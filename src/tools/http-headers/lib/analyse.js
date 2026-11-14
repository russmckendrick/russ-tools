const YEAR = 31536000;
const DAY = 86400;

export const STATUS_ORDER = ['fail', 'warn', 'info', 'pass'];

const text = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);

function span(seconds) {
  if (seconds >= YEAR) {
    const years = seconds / YEAR;
    return `${Number.isInteger(years) ? years : years.toFixed(1)} year${years === 1 ? '' : 's'}`;
  }
  const days = Math.round(seconds / DAY);
  if (days >= 1) return `${days} day${days === 1 ? '' : 's'}`;
  return `${seconds} second${seconds === 1 ? '' : 's'}`;
}

export function parseHsts(value) {
  const first = String(value ?? '').split(',')[0];
  const directives = first.split(';').map((part) => part.trim().toLowerCase()).filter(Boolean);
  const age = directives.find((part) => part.startsWith('max-age'));
  const match = age ? /^max-age\s*=\s*"?(\d+)"?$/.exec(age) : null;
  return {
    maxAge: match ? Number(match[1]) : null,
    includeSubDomains: directives.includes('includesubdomains'),
    preload: directives.includes('preload'),
  };
}

export function parseCsp(value) {
  return String(value ?? '')
    .split(',')
    .map((policy) => {
      const directives = new Map();
      for (const part of policy.split(';')) {
        const [name, ...sources] = part.trim().split(/\s+/).filter(Boolean);
        if (name && !directives.has(name.toLowerCase())) directives.set(name.toLowerCase(), sources);
      }
      return directives;
    })
    .filter((policy) => policy.size > 0);
}

const scriptSources = (policy) => policy.get('script-src') ?? policy.get('default-src') ?? null;
const lower = (sources) => sources.map((source) => source.toLowerCase());
const hasNonceOrHash = (sources) =>
  lower(sources).some((source) => /^'(?:nonce-|sha(?:256|384|512)-)/.test(source) || source === "'strict-dynamic'");

const CSP_WEAKNESSES = [
  {
    test: (sources) => lower(sources).includes("'unsafe-inline'") && !hasNonceOrHash(sources),
    finding: "allows inline scripts with 'unsafe-inline', which removes most of the protection against injected script",
  },
  {
    test: (sources) => lower(sources).includes("'unsafe-eval'"),
    finding: "allows 'unsafe-eval', so strings can be run as code",
  },
  {
    test: (sources) => lower(sources).some((source) => source === '*' || source === 'http:' || source === 'https:'),
    finding: 'allows scripts from any host with a wildcard or a bare scheme',
  },
  {
    test: (sources) => lower(sources).includes('data:'),
    finding: 'allows scripts from data: URLs',
  },
];

function sentence(parts) {
  const joined = parts.length > 1 ? `${parts.slice(0, -1).join('; ')}; and ${parts.at(-1)}` : parts[0];
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}.`;
}

function checkHsts(headers, finalUrl) {
  const value = text(headers['strict-transport-security']);
  const base = {
    id: 'hsts',
    name: 'Strict-Transport-Security',
    group: 'transport',
    purpose: 'Tells browsers to use HTTPS for every later visit, so a connection cannot be downgraded to plain HTTP.',
    sources: [{ name: 'Strict-Transport-Security', value }],
    present: Boolean(value),
  };

  if (finalUrl.protocol !== 'https:') {
    return {
      ...base,
      status: 'fail',
      finding: 'The final response was served over plain HTTP. Browsers ignore this header unless it arrives over HTTPS.',
    };
  }
  if (!value) return { ...base, status: 'fail', finding: 'Not set, so a first visit or a stripped link can still be served over HTTP.' };

  const { maxAge, includeSubDomains, preload } = parseHsts(value);
  if (maxAge === null) return { ...base, status: 'fail', finding: 'No readable max-age, so browsers discard the header.' };
  if (maxAge === 0) return { ...base, status: 'fail', finding: 'max-age is 0, which tells browsers to forget the policy.' };

  const extras = [
    includeSubDomains ? 'Subdomains are covered.' : 'includeSubDomains is not set, so subdomains are not covered.',
    preload && (!includeSubDomains || maxAge < YEAR)
      ? 'preload is set, but the preload list also needs includeSubDomains and a max-age of at least a year.'
      : preload
        ? 'preload is set.'
        : null,
  ].filter(Boolean);

  if (maxAge < YEAR) {
    return {
      ...base,
      status: 'warn',
      finding: [`max-age is ${span(maxAge)}, under the one year usually recommended.`, ...extras].join(' '),
    };
  }
  return { ...base, status: 'pass', finding: [`max-age is ${span(maxAge)}.`, ...extras].join(' ') };
}

function checkCsp(headers) {
  const value = text(headers['content-security-policy']);
  const reportOnly = text(headers['content-security-policy-report-only']);
  const base = {
    id: 'csp',
    name: 'Content-Security-Policy',
    group: 'content',
    purpose: 'Lists where scripts, styles and other resources may load from, which limits what injected markup can do.',
    sources: [
      { name: 'Content-Security-Policy', value },
      ...(reportOnly ? [{ name: 'Content-Security-Policy-Report-Only', value: reportOnly }] : []),
    ],
    present: Boolean(value),
  };

  if (!value) {
    return reportOnly
      ? { ...base, status: 'warn', finding: 'Only a report-only policy is sent. It reports violations and blocks nothing.' }
      : { ...base, status: 'fail', finding: 'Not set, so the page can load script from anywhere.' };
  }

  const policies = parseCsp(value);
  if (policies.length === 0) return { ...base, status: 'fail', finding: 'The header is present and empty.' };

  if (policies.every((policy) => scriptSources(policy) === null)) {
    return {
      ...base,
      status: 'warn',
      finding: 'Sets neither script-src nor default-src, so scripts are not restricted.',
    };
  }

  const restricting = policies.filter((policy) => scriptSources(policy) !== null);
  const weaknesses = CSP_WEAKNESSES.filter((weakness) =>
    restricting.every((policy) => weakness.test(scriptSources(policy)))
  ).map((weakness) => weakness.finding);

  if (weaknesses.length > 0) return { ...base, status: 'warn', finding: sentence(weaknesses) };
  return { ...base, status: 'pass', finding: 'Restricts scripts, with no unsafe-inline, unsafe-eval or wildcard source.' };
}

function checkContentType(headers) {
  const value = text(headers['x-content-type-options']);
  const base = {
    id: 'content-type-options',
    name: 'X-Content-Type-Options',
    group: 'content',
    purpose: 'Stops browsers guessing a content type, so an upload cannot be run as a script or style sheet.',
    sources: [{ name: 'X-Content-Type-Options', value }],
    present: Boolean(value),
  };

  if (!value) return { ...base, status: 'warn', finding: 'Not set, so browsers may sniff a different type from the content.' };
  if (value.split(',')[0].trim().toLowerCase() === 'nosniff') return { ...base, status: 'pass', finding: 'Set to nosniff.' };
  return { ...base, status: 'warn', finding: 'The only value browsers act on is nosniff.' };
}

function checkFraming(headers) {
  const xfo = text(headers['x-frame-options']);
  const ancestors = parseCsp(headers['content-security-policy'])
    .map((policy) => policy.get('frame-ancestors'))
    .filter(Boolean);
  const ancestorsText = ancestors.length ? ancestors.map((sources) => sources.join(' ') || "'none'").join(', ') : null;
  const base = {
    id: 'framing',
    name: 'X-Frame-Options',
    group: 'content',
    purpose: 'Controls which sites may show this page in a frame, which is what stops clickjacking.',
    sources: [
      { name: 'X-Frame-Options', value: xfo },
      { name: 'CSP frame-ancestors', value: ancestorsText },
    ],
    present: Boolean(xfo || ancestorsText),
  };

  if (ancestors.length) {
    const open = ancestors.every((sources) =>
      lower(sources).some((source) => source === '*' || source === 'http:' || source === 'https:')
    );
    return open
      ? { ...base, status: 'warn', finding: 'frame-ancestors allows any site to frame the page.' }
      : {
          ...base,
          status: 'pass',
          finding: xfo
            ? 'frame-ancestors restricts framing. Browsers that support it ignore X-Frame-Options.'
            : 'frame-ancestors restricts framing.',
        };
  }

  if (!xfo) return { ...base, status: 'fail', finding: 'Neither header is set, so any site can put this page in a frame.' };

  const directive = xfo.split(',')[0].trim().toLowerCase();
  if (directive === 'deny') return { ...base, status: 'pass', finding: 'DENY: the page cannot be framed at all.' };
  if (directive === 'sameorigin') return { ...base, status: 'pass', finding: 'SAMEORIGIN: only the site itself can frame the page.' };
  if (directive.startsWith('allow-from')) {
    return { ...base, status: 'warn', finding: 'ALLOW-FROM is obsolete and ignored by current browsers. Use CSP frame-ancestors.' };
  }
  return { ...base, status: 'warn', finding: 'Not a value browsers recognise. Use DENY or SAMEORIGIN.' };
}

const REFERRER_POLICIES = new Set([
  'no-referrer',
  'no-referrer-when-downgrade',
  'origin',
  'origin-when-cross-origin',
  'same-origin',
  'strict-origin',
  'strict-origin-when-cross-origin',
  'unsafe-url',
]);
const REFERRER_LEAKY = {
  'unsafe-url': 'unsafe-url sends the full URL, path and query included, to every site, even over HTTP.',
  'no-referrer-when-downgrade': 'no-referrer-when-downgrade sends the full URL, path and query included, to every HTTPS site.',
};

function checkReferrer(headers) {
  const value = text(headers['referrer-policy']);
  const base = {
    id: 'referrer-policy',
    name: 'Referrer-Policy',
    group: 'content',
    purpose: 'Decides how much of the address of this page is sent to the sites it links to or loads from.',
    sources: [{ name: 'Referrer-Policy', value }],
    present: Boolean(value),
  };

  if (!value) {
    return {
      ...base,
      status: 'warn',
      finding: 'Not set. Current browsers fall back to strict-origin-when-cross-origin; older ones send the full URL.',
    };
  }

  const effective = value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((part) => REFERRER_POLICIES.has(part))
    .at(-1);

  if (!effective) return { ...base, status: 'warn', finding: 'Not a policy browsers recognise, so the default applies.' };
  if (REFERRER_LEAKY[effective]) return { ...base, status: 'warn', finding: REFERRER_LEAKY[effective] };
  return { ...base, status: 'pass', finding: `${effective} limits what other sites are told.` };
}

function checkPermissions(headers) {
  const value = text(headers['permissions-policy']);
  const legacy = text(headers['feature-policy']);
  const base = {
    id: 'permissions-policy',
    name: 'Permissions-Policy',
    group: 'content',
    purpose: 'Switches browser features such as camera, microphone and geolocation on or off for the page and its frames.',
    sources: [
      { name: 'Permissions-Policy', value },
      ...(legacy ? [{ name: 'Feature-Policy', value: legacy }] : []),
    ],
    present: Boolean(value),
  };

  if (value) {
    const count = value.split(',').filter((part) => part.includes('=')).length;
    return { ...base, status: 'pass', finding: `Sets a policy for ${count} feature${count === 1 ? '' : 's'}.` };
  }
  if (legacy) {
    return { ...base, status: 'warn', finding: 'Only the retired Feature-Policy header is sent. Current browsers read Permissions-Policy.' };
  }
  return { ...base, status: 'warn', finding: 'Not set, so every feature keeps its browser default, including inside embedded frames.' };
}

function isolation({ id, name, header, purpose, strong, weak, missing }) {
  return (headers) => {
    const value = text(headers[header]);
    const base = { id, name, group: 'isolation', purpose, sources: [{ name, value }], present: Boolean(value) };
    if (!value) return { ...base, status: 'info', finding: missing };

    const directive = value.split(';')[0].trim().toLowerCase();
    if (strong[directive]) return { ...base, status: 'pass', finding: strong[directive] };
    if (weak[directive]) return { ...base, status: 'info', finding: weak[directive] };
    return { ...base, status: 'warn', finding: 'Not a value browsers recognise, so the default applies.' };
  };
}

const checkCoop = isolation({
  id: 'coop',
  name: 'Cross-Origin-Opener-Policy',
  header: 'cross-origin-opener-policy',
  purpose: 'Separates this page from windows on other origins that open it or that it opens.',
  strong: {
    'same-origin': 'same-origin: windows on other origins get no reference to this page.',
    'same-origin-allow-popups': 'same-origin-allow-popups: isolated from its opener, while its own popups keep a reference.',
    'noopener-allow-popups': 'noopener-allow-popups: always opened without a reference back to the opener.',
  },
  weak: { 'unsafe-none': 'unsafe-none is the browser default: no isolation.' },
  missing: 'Not set. The default, unsafe-none, lets a window on another origin keep a reference to this page.',
});

const checkCoep = isolation({
  id: 'coep',
  name: 'Cross-Origin-Embedder-Policy',
  header: 'cross-origin-embedder-policy',
  purpose: 'Requires every resource the page embeds to opt in to being loaded across origins.',
  strong: {
    'require-corp': 'require-corp: cross-origin resources must opt in with CORP or CORS.',
    credentialless: 'credentialless: cross-origin resources load without cookies unless they opt in.',
  },
  weak: { 'unsafe-none': 'unsafe-none is the browser default: no restriction.' },
  missing: 'Not set. Only needed for cross-origin isolation, which features such as SharedArrayBuffer require.',
});

const checkCorp = isolation({
  id: 'corp',
  name: 'Cross-Origin-Resource-Policy',
  header: 'cross-origin-resource-policy',
  purpose: 'Says which sites may embed this response as an image, script or other subresource.',
  strong: {
    'same-origin': 'same-origin: only the site itself can embed this response.',
    'same-site': 'same-site: only this site and its subdomains can embed this response.',
  },
  weak: { 'cross-origin': 'cross-origin: any site can embed this response.' },
  missing: 'Not set, so any site can embed this response.',
});

const LEAKS = [
  ['server', 'Server', 'Names the web server software.'],
  ['x-powered-by', 'X-Powered-By', 'Names the framework or runtime behind the site.'],
  ['x-aspnet-version', 'X-AspNet-Version', 'Names the ASP.NET version behind the site.'],
  ['x-aspnetmvc-version', 'X-AspNetMvc-Version', 'Names the ASP.NET MVC version behind the site.'],
  ['x-generator', 'X-Generator', 'Names the software that generated the page.'],
];
const ALWAYS_REPORTED = new Set(['server', 'x-powered-by']);

function checkLeaks(headers) {
  return LEAKS.filter(([header]) => ALWAYS_REPORTED.has(header) || text(headers[header])).map(([header, name, purpose]) => {
    const value = text(headers[header]);
    const base = { id: `leak-${header}`, name, group: 'disclosure', purpose, sources: [{ name, value }], present: Boolean(value) };

    if (!value) return { ...base, status: 'pass', finding: 'Not sent.' };
    if (/\d/.test(value)) {
      return { ...base, status: 'warn', finding: 'Gives a version number, which tells an attacker which known flaws to try.' };
    }
    if (header === 'server') return { ...base, status: 'info', finding: 'Names the software and no version.' };
    return { ...base, status: 'warn', finding: 'Names the technology behind the site. Nothing needs this header.' };
  });
}

export function analyseCookie(cookie, secureContext = true) {
  const problems = [];
  const warnings = [];
  const sameSite = cookie.sameSite?.toLowerCase() ?? null;

  if (!cookie.secure) {
    problems.push(secureContext ? 'no Secure flag, so it is also sent over plain HTTP' : 'no Secure flag');
  }
  if (sameSite === 'none' && !cookie.secure) problems.push('SameSite=None without Secure, which browsers reject');
  if (cookie.name.startsWith('__Secure-') && !cookie.secure) problems.push('the __Secure- prefix requires Secure');
  if (cookie.name.startsWith('__Host-') && (!cookie.secure || cookie.domain || cookie.path !== '/')) {
    problems.push('the __Host- prefix requires Secure, Path=/ and no Domain');
  }

  if (!cookie.httpOnly) warnings.push('no HttpOnly flag, so page script can read it');
  if (!sameSite) warnings.push('no SameSite attribute, so the browser default applies');
  else if (!['strict', 'lax', 'none'].includes(sameSite)) warnings.push('SameSite is not Strict, Lax or None');

  const issues = [...problems, ...warnings];
  return {
    ...cookie,
    status: problems.length ? 'fail' : warnings.length ? 'warn' : 'pass',
    finding: issues.length ? sentence(issues) : 'Secure, HttpOnly and SameSite are all set.',
  };
}

export function analyseChain(chain = []) {
  const findings = [];
  const urls = chain.map((hop) => {
    try {
      return new URL(hop.url);
    } catch {
      return null;
    }
  });

  urls.forEach((url, index) => {
    const next = urls[index + 1];
    if (!url || !next) return;
    if (url.protocol === 'https:' && next.protocol === 'http:') {
      findings.push({ status: 'fail', text: `Hop ${index + 1} redirects from HTTPS back to plain HTTP.` });
    }
    if (url.protocol === 'http:' && next.protocol === 'http:' && url.hostname !== next.hostname) {
      findings.push({
        status: 'warn',
        text: `Hop ${index + 1} redirects to another host over plain HTTP, before HTTPS and HSTS can apply to the first one.`,
      });
    }
  });

  const [first] = urls;
  const last = urls.at(-1);
  if (first?.protocol === 'http:' && last?.protocol === 'https:' && !findings.some((finding) => finding.status === 'fail')) {
    findings.push({ status: 'pass', text: 'Plain HTTP is redirected to HTTPS.' });
  }

  return findings;
}

export function analyse(result) {
  const headers = result?.headers ?? {};
  let finalUrl;
  try {
    finalUrl = new URL(result.finalUrl);
  } catch {
    finalUrl = new URL('https://invalid.invalid/');
  }

  const checks = [
    checkHsts(headers, finalUrl),
    checkCsp(headers),
    checkContentType(headers),
    checkFraming(headers),
    checkReferrer(headers),
    checkPermissions(headers),
    checkCoop(headers),
    checkCoep(headers),
    checkCorp(headers),
    ...checkLeaks(headers),
  ];
  const cookies = (result?.cookies ?? []).map((cookie) => analyseCookie(cookie, finalUrl.protocol === 'https:'));
  const chain = analyseChain(result?.chain);

  const counts = { pass: 0, warn: 0, fail: 0, info: 0 };
  for (const item of [...checks, ...cookies]) counts[item.status] += 1;

  return {
    requestedUrl: result?.requestedUrl ?? null,
    finalUrl: result?.finalUrl ?? null,
    status: result?.status ?? null,
    method: result?.method ?? null,
    hops: result?.chain ?? [],
    chainFindings: chain,
    checks,
    cookies,
    counts,
    headers,
    truncatedHeaders: result?.truncatedHeaders ?? [],
  };
}

export function toPlain(report) {
  return {
    requestedUrl: report.requestedUrl,
    finalUrl: report.finalUrl,
    status: report.status,
    redirects: report.hops,
    counts: report.counts,
    checks: report.checks.map(({ id, name, status, present, sources, finding }) => ({
      id,
      header: name,
      status,
      present,
      values: Object.fromEntries(sources.map((source) => [source.name, source.value])),
      finding,
    })),
    cookies: report.cookies.map(({ status, finding, ...flags }) => ({ ...flags, status, finding })),
  };
}
