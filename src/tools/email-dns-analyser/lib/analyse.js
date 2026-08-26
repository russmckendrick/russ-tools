import { decodeDnsText, detectEmailProviders, dnsRecords, normalizeDnsName, queryDns } from '@/core';

const finding = (severity, title, detail, evidence = '') => ({ severity, title, detail, evidence });

export function parseTagRecord(value) {
  const tags = {};
  for (const part of String(value ?? '').split(';')) {
    const at = part.indexOf('=');
    if (at === -1) continue;
    const key = part.slice(0, at).trim().toLowerCase();
    if (key) tags[key] = part.slice(at + 1).trim();
  }
  return tags;
}

export function spfDnsTerms(value) {
  const directives = String(value ?? '')
    .trim()
    .split(/\s+/)
    .slice(1);
  const allIndex = directives.findIndex((term) => /^[+?~-]?all$/i.test(term));
  return (allIndex === -1 ? directives : directives.slice(0, allIndex))
    .filter((term) =>
      /^(?:[+?~-]?(?:include:|exists:|a(?:$|:|\/)|mx(?:$|:|\/)|ptr(?:$|:))|redirect=)/i.test(term)
    );
}

export function analyseSpfRecord(records) {
  const findings = [];
  if (records.length === 0) {
    findings.push(finding('warning', 'No SPF policy', 'The domain publishes no v=spf1 TXT record.'));
    return { record: null, terms: [], findings };
  }
  if (records.length > 1) {
    findings.push(finding('error', 'Multiple SPF policies', 'SPF permits one policy record per name.', records.join(' · ')));
  }

  const record = records[0];
  const terms = spfDnsTerms(record);
  if (!/(?:^|\s)[+?~-]?all(?:\s|$)/i.test(record)) {
    findings.push(finding('warning', 'No terminal all mechanism', 'The policy does not end with an explicit all decision.', record));
  }
  if (/(?:^|\s)[+?~-]?ptr(?::|\s|$)/i.test(record)) {
    findings.push(finding('warning', 'PTR mechanism used', 'The SPF ptr mechanism is slow and not recommended.', record));
  }
  findings.push(finding('success', 'SPF policy found', `${terms.length} DNS-producing terms in the published policy.`, record));
  return { record, terms, findings };
}

async function walkSpf(domain, query, state, seen = new Set(), depth = 0) {
  if (seen.has(domain)) return { record: null, lookups: 0, findings: [finding('error', 'SPF include loop', `The policy returns to ${domain}.`)] };
  if (depth > 10) return { lookups: 0, findings: [finding('error', 'SPF recursion too deep', 'More than ten include/redirect levels were followed.')] };
  if (state.signal?.aborted) throw new DOMException('Request cancelled', 'AbortError');
  if (state.cache.has(domain)) return state.cache.get(domain);
  if (state.queries >= state.maxQueries) {
    return { record: null, lookups: 0, findings: [finding('error', 'SPF analysis query budget reached', `Stopped after ${state.maxQueries} SPF policy queries to prevent unbounded include traversal.`)] };
  }

  const nextSeen = new Set(seen).add(domain);
  state.queries += 1;
  const response = await query(domain, 'TXT', { signal: state.signal });
  const policies = dnsRecords(response, 'TXT').map((record) => record.text).filter((text) => /^v=spf1(?:\s|$)/i.test(text));
  const local = analyseSpfRecord(policies);
  let lookups = local.terms.length;
  const findings = [...local.findings];

  for (const term of local.terms) {
    const match = /^(?:[+?~-]?include:|redirect=)([^/\s]+)/i.exec(term);
    if (!match) continue;
    const child = normalizeDnsName(match[1]);
    if (!child) continue;
    if (state.queries >= state.maxQueries && !state.cache.has(child)) {
      findings.push(finding('error', 'SPF analysis query budget reached', `Stopped after ${state.maxQueries} SPF policy queries to prevent unbounded include traversal.`));
      break;
    }
    try {
      const walked = await walkSpf(child, query, state, nextSeen, depth + 1);
      lookups += walked.lookups;
      if (!walked.record) {
        const traversalErrors = walked.findings.filter((item) => item.severity === 'error');
        if (traversalErrors.length) findings.push(...traversalErrors);
        else {
          const relationship = term.toLowerCase().startsWith('redirect=') ? 'redirect' : 'include';
          findings.push(finding('error', `SPF ${relationship} has no policy`, `${child} returned no SPF policy, which makes this ${relationship} a permanent error.`));
        }
      } else {
        findings.push(...walked.findings.filter((item) => item.severity !== 'success'));
      }
    } catch {
      findings.push(finding('warning', 'SPF include unavailable', `Could not read the policy at ${child}.`));
    }
  }

  const result = { ...local, lookups, findings, response };
  state.cache.set(domain, result);
  return result;
}

export function analyseDmarcRecord(records) {
  const findings = [];
  if (records.length === 0) {
    findings.push(finding('warning', 'No DMARC policy', 'No policy was found at _dmarc.'));
    return { record: null, tags: {}, findings };
  }
  if (records.length > 1) findings.push(finding('error', 'Multiple DMARC policies', 'Publish exactly one DMARC policy record.'));

  const record = records[0];
  const tags = parseTagRecord(record);
  if (tags.v?.toUpperCase() !== 'DMARC1') findings.push(finding('error', 'Invalid DMARC version', 'The record must begin with v=DMARC1.', record));
  if (!['none', 'quarantine', 'reject'].includes(tags.p)) findings.push(finding('error', 'Invalid DMARC policy', 'p must be none, quarantine or reject.', record));
  else findings.push(finding(tags.p === 'none' ? 'warning' : 'success', `DMARC policy: ${tags.p}`, tags.p === 'none' ? 'Monitoring mode does not request enforcement.' : 'The domain requests enforcement.', record));
  if (tags.pct) findings.push(finding('warning', 'Historic pct tag', 'RFC 9989 marks percentage sampling as historic.', `pct=${tags.pct}`));
  if (!tags.rua) findings.push(finding('info', 'No aggregate report address', 'rua is optional, but reports help observe authentication failures.'));
  return { record, tags, findings };
}

export function analyseDkimRecord(records, selector) {
  if (!selector) return { record: null, tags: {}, findings: [finding('info', 'DKIM selector not checked', 'Add a selector to inspect its public key.')] };
  if (records.length === 0) return { record: null, tags: {}, findings: [finding('warning', 'DKIM key not found', `No TXT record was found for ${selector}._domainkey.`)] };

  const record = records[0];
  const tags = parseTagRecord(record);
  const findings = [];
  if (tags.v && tags.v.toUpperCase() !== 'DKIM1') findings.push(finding('error', 'Invalid DKIM version', 'v, when present, must be DKIM1.', record));
  if (!tags.p) findings.push(finding('warning', 'Revoked or empty DKIM key', 'The p tag contains no public key.', record));
  else findings.push(finding('success', 'DKIM key published', `${tags.k || 'rsa'} key found for selector ${selector}.`, record));
  return { record, tags, findings };
}

function providerFinding(detection, mx) {
  const evidence = mx.map((record) => record.exchange.replace(/\.$/, '')).join(' · ');
  if (!detection.providers.length) {
    return finding('info', 'Custom or self-hosted email', 'The MX hosts do not match a known provider signature.', evidence);
  }
  const describe = (provider) =>
    provider.type === 'gateway' ? `${provider.name} (security gateway)`
      : provider.type === 'routing' ? `${provider.name} (forwarding service)`
        : provider.name;
  const viaMx = detection.providers.filter((provider) => provider.via === 'mx');
  const viaSpf = detection.providers.filter((provider) => provider.via === 'spf');
  const detail = [
    viaMx.length ? `Mail is routed through ${viaMx.map(describe).join(' and ')}.` : '',
    viaSpf.length ? `SPF suggests mailboxes are hosted on ${viaSpf.map((provider) => provider.name).join(' and ')}.` : '',
  ].filter(Boolean).join(' ');
  return finding('info', `Email provider: ${detection.providers.map((provider) => provider.name).join(' + ')}`, detail, evidence);
}

function txtPolicies(response, prefix) {
  return dnsRecords(response, 'TXT').map((record) => decodeDnsText(record.data)).filter((text) => text.toLowerCase().startsWith(prefix));
}

export async function analyseEmailDns(input, selector = '', options = {}) {
  const domain = normalizeDnsName(input);
  if (!domain) throw new Error('Enter a valid mail domain.');
  const query = options.query ?? ((name, type, queryOptions = {}) => queryDns(name, type, {
    provider: 'google',
    dnssec: true,
    signal: queryOptions.signal,
  }));
  const cleanSelector = selector.trim().replace(/\._domainkey\..*$/i, '');
  const queryOptions = { signal: options.signal };
  const spfState = { signal: options.signal, queries: 0, maxQueries: 20, cache: new Map() };

  const [mxResponse, dmarcResponse, dkimResponse, mtaResponse, tlsResponse, spf] = await Promise.all([
    query(domain, 'MX', queryOptions),
    query(`_dmarc.${domain}`, 'TXT', queryOptions),
    cleanSelector ? query(`${cleanSelector}._domainkey.${domain}`, 'TXT', queryOptions) : Promise.resolve(null),
    query(`_mta-sts.${domain}`, 'TXT', queryOptions),
    query(`_smtp._tls.${domain}`, 'TXT', queryOptions),
    walkSpf(domain, query, spfState),
  ]);

  if (spf.lookups > 10) {
    spf.findings.push(finding('error', 'SPF lookup limit exceeded', `${spf.lookups} DNS-producing terms were found across the include graph; the limit is 10.`));
  } else if (spf.record) {
    spf.findings.push(finding('success', 'SPF lookup budget', `${spf.lookups} of 10 DNS-producing terms used across the include graph.`));
  }

  const mx = dnsRecords(mxResponse, 'MX');
  const nullMx = mx.length === 1 && mx[0].preference === 0 && mx[0].exchange === '.';
  const mxFindings = nullMx
    ? [finding('info', 'Domain does not accept email', 'A null MX record explicitly says this domain accepts no email.', '0 .')]
    : mx.length > 0
      ? [finding('success', 'Mail exchangers published', `${mx.length} MX record${mx.length === 1 ? '' : 's'} found.`)]
      : [finding('warning', 'No MX records', 'The domain publishes no explicit mail exchanger.')];
  const spfGraphDomains = [...spfState.cache.keys()].filter((name) => name !== domain);
  const detection = !nullMx && mx.length > 0
    ? detectEmailProviders(mx.map((record) => record.exchange), spfGraphDomains)
    : { providers: [], unmatched: [] };
  if (!nullMx && mx.length > 0) mxFindings.push(providerFinding(detection, mx));
  const dmarc = analyseDmarcRecord(txtPolicies(dmarcResponse, 'v=dmarc1'));
  const dkim = analyseDkimRecord(dkimResponse ? dnsRecords(dkimResponse, 'TXT').map((record) => record.text) : [], cleanSelector);
  const mta = txtPolicies(mtaResponse, 'v=stsv1');
  const tls = txtPolicies(tlsResponse, 'v=tlsrptv1');
  const mtaFindings = mta.length
    ? [finding('success', 'MTA-STS signal published', 'The DNS policy signal is present.', mta[0])]
    : [finding('info', 'No MTA-STS signal', 'No v=STSv1 TXT record was found at _mta-sts.')];
  const tlsFindings = tls.length
    ? [finding('success', 'SMTP TLS reporting published', 'A TLS-RPT reporting policy is present.', tls[0])]
    : [finding('info', 'No SMTP TLS reporting', 'No v=TLSRPTv1 TXT record was found at _smtp._tls.')];

  const sections = [
    { id: 'mx', title: 'Mail routing', findings: mxFindings, data: mx },
    { id: 'spf', title: 'SPF', findings: spf.findings, data: spf.record },
    { id: 'dmarc', title: 'DMARC', findings: dmarc.findings, data: dmarc.tags },
    { id: 'dkim', title: 'DKIM', findings: dkim.findings, data: dkim.tags },
    { id: 'mta-sts', title: 'MTA-STS', findings: mtaFindings, data: mta },
    { id: 'tls-rpt', title: 'TLS reporting', findings: tlsFindings, data: tls },
  ];

  return {
    domain,
    selector: cleanSelector,
    providers: detection.providers,
    sections,
    counts: sections.flatMap((section) => section.findings).reduce((counts, item) => ({ ...counts, [item.severity]: (counts[item.severity] ?? 0) + 1 }), {}),
    raw: { mxResponse, spfResponse: spf.response, spfPolicyQueries: spfState.queries, dmarcResponse, dkimResponse, mtaResponse, tlsResponse },
  };
}
