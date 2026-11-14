import {
  COMPONENT_SAFE,
  FRAGMENT_SAFE,
  PATH_SAFE,
  decodeText,
  encodeText,
  hasMalformedEscape,
} from './encoding.js';
import { hostForms } from './punycode.js';

export const MAX_URL_LENGTH = 100000;
export const SAMPLE_URL =
  'https://api.example.com:8443/v1/search/caf%C3%A9?q=subnet+calculator&page=2&tag=dns&tag=tls#results';

const SPLIT = /^([a-z][a-z0-9+.-]*):(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#([\s\S]*))?$/i;
const PATH_KEEP = '/?#%';

const field = (raw, options) => ({ raw, text: decodeText(raw, options) });

function splitAuthority(authority) {
  const at = authority.lastIndexOf('@');
  const userinfo = at === -1 ? null : authority.slice(0, at);
  const hostport = at === -1 ? authority : authority.slice(at + 1);

  let host = hostport;
  let port = '';
  const bracket = hostport.startsWith('[') ? hostport.indexOf(']') : -1;
  if (bracket !== -1) {
    host = hostport.slice(0, bracket + 1);
    port = hostport.slice(bracket + 1).replace(/^:/, '');
  } else {
    const colon = hostport.lastIndexOf(':');
    if (colon !== -1) {
      host = hostport.slice(0, colon);
      port = hostport.slice(colon + 1);
    }
  }

  let username = null;
  let password = null;
  if (userinfo !== null) {
    const colon = userinfo.indexOf(':');
    username = colon === -1 ? userinfo : userinfo.slice(0, colon);
    password = colon === -1 ? null : userinfo.slice(colon + 1);
  }
  return { username, password, host, port };
}

function splitQuery(raw, plusAsSpace) {
  if (raw === undefined || raw === '') return [];
  return raw.split('&').map((pair, index) => {
    const equals = pair.indexOf('=');
    const rawKey = equals === -1 ? pair : pair.slice(0, equals);
    const rawValue = equals === -1 ? '' : pair.slice(equals + 1);
    return {
      id: index + 1,
      rawKey,
      key: decodeText(rawKey, { plusAsSpace }),
      rawValue,
      value: decodeText(rawValue, { plusAsSpace }),
      hasEquals: equals !== -1,
    };
  });
}

export function parseUrl(input) {
  if (typeof input !== 'string') return { ok: false, empty: true };
  const text = input.trim();
  if (!text) return { ok: false, empty: true };
  if (text.length > MAX_URL_LENGTH) {
    return { ok: false, error: `Too long: ${text.length.toLocaleString('en-GB')} characters. The limit is ${MAX_URL_LENGTH.toLocaleString('en-GB')}.` };
  }

  const match = SPLIT.exec(text);
  if (!match) {
    const bare = /^[^\s/?#:]+\.[^\s/?#:]+/.test(text);
    return {
      ok: false,
      error: bare
        ? 'No scheme. A URL starts with one, such as https:// in front of the host.'
        : 'Not a URL: it needs a scheme first, such as https://.',
      suggestion: bare ? `https://${text}` : null,
    };
  }

  const [, scheme, authority, path, query, fragment] = match;
  const hasAuthority = authority !== undefined;
  const { username, password, host, port } = hasAuthority
    ? splitAuthority(authority)
    : { username: null, password: null, host: '', port: '' };
  const plusAsSpace = query !== undefined && query.includes('+');
  const params = splitQuery(query, plusAsSpace);

  return {
    ok: true,
    parts: {
      scheme,
      hasAuthority,
      hasUserinfo: username !== null,
      username: field(username ?? ''),
      hasPassword: password !== null,
      password: field(password ?? ''),
      host,
      port,
      path: field(path, { keep: PATH_KEEP }),
      plusAsSpace,
      params,
      nextId: params.length + 1,
      hasFragment: fragment !== undefined,
      fragment: field(fragment ?? ''),
    },
  };
}

export function readUrl(text) {
  const result = parseUrl(text);
  return {
    text,
    result,
    parts: result.ok ? result.parts : null,
    credentials: result.ok && result.parts.hasUserinfo,
  };
}

export function buildUrl(parts) {
  let out = `${parts.scheme}:`;
  if (parts.hasAuthority) {
    out += '//';
    if (parts.hasUserinfo) {
      out += parts.username.raw;
      if (parts.hasPassword) out += `:${parts.password.raw}`;
      out += '@';
    }
    out += parts.host;
    if (parts.port) out += `:${parts.port}`;
  }
  out += parts.path.raw;
  if (parts.params.length > 0) {
    out += `?${parts.params
      .map((param) => (param.hasEquals ? `${param.rawKey}=${param.rawValue}` : param.rawKey))
      .join('&')}`;
  }
  if (parts.hasFragment) out += `#${parts.fragment.raw}`;
  return out;
}

const component = (text, parts) =>
  encodeText(text, COMPONENT_SAFE, { spaceAsPlus: Boolean(parts?.plusAsSpace) });

export function editPart(parts, name, text) {
  switch (name) {
    case 'scheme':
      return { ...parts, scheme: text.replace(/[:/\s]+$/, '') };
    case 'host':
      return { ...parts, host: text.trim(), hasAuthority: true };
    case 'port':
      return { ...parts, port: text.trim().replace(/^:/, ''), hasAuthority: true };
    case 'username':
      return {
        ...parts,
        hasUserinfo: text !== '' || parts.hasPassword,
        username: { text, raw: encodeText(text, COMPONENT_SAFE) },
      };
    case 'password':
      return {
        ...parts,
        hasPassword: text !== '',
        hasUserinfo: text !== '' || parts.username.text !== '',
        password: { text, raw: encodeText(text, COMPONENT_SAFE) },
      };
    case 'path': {
      let raw = encodeText(text, PATH_SAFE, { keepEscapes: true });
      if (parts.hasAuthority && raw && !raw.startsWith('/')) raw = `/${raw}`;
      return { ...parts, path: { text, raw } };
    }
    case 'fragment':
      return {
        ...parts,
        hasFragment: text !== '',
        fragment: { text, raw: encodeText(text, FRAGMENT_SAFE) },
      };
    default:
      return parts;
  }
}

export function editParam(parts, id, name, text) {
  return {
    ...parts,
    params: parts.params.map((param) => {
      if (param.id !== id) return param;
      if (name === 'key') return { ...param, key: text, rawKey: component(text, parts) };
      return { ...param, value: text, rawValue: component(text, parts), hasEquals: true };
    }),
  };
}

export function addParam(parts) {
  return {
    ...parts,
    nextId: parts.nextId + 1,
    params: [...parts.params, { id: parts.nextId, key: '', rawKey: '', value: '', rawValue: '', hasEquals: true }],
  };
}

export function removeParam(parts, id) {
  return { ...parts, params: parts.params.filter((param) => param.id !== id) };
}

export function describeUrl(text) {
  let url;
  try {
    url = new URL(text);
  } catch {
    return { valid: false };
  }
  const host = url.hostname ? hostForms(url.hostname) : { ascii: null, unicode: null, international: false };
  return {
    valid: true,
    href: url.href,
    origin: url.origin === 'null' ? null : url.origin,
    asciiHost: host.ascii,
    unicodeHost: host.unicode,
    international: host.international,
  };
}

const SECRET_EXACT = new Set([
  'key', 'code', 'sig', 'sid', 'auth', 'authorization', 'pwd', 'pass', 'jwt', 'bearer',
  'session', 'passphrase', 'subscriptionkey', 'sas',
]);
const SECRET_SUFFIX = [
  'token', 'secret', 'password', 'passwd', 'signature', 'apikey', 'privatekey', 'accesskey',
  'secretkey', 'sessionid', 'credential', 'credentials',
];

export function looksSecret(key) {
  const name = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!name) return false;
  return SECRET_EXACT.has(name) || SECRET_SUFFIX.some((suffix) => name.endsWith(suffix));
}

const DOUBLE = /%25[0-9a-fA-F]{2}/;
const FORBIDDEN = /[\s"<>\\^`{|}]/g;
const NON_ASCII = /[\u0080-\uffff]/;
const NESTED_URL = /^[a-z][a-z0-9+.-]*:\/\//i;
const DEFAULT_PORTS = { http: '80', https: '443', ws: '80', wss: '443', ftp: '21' };

const code = (value) => `\`${value}\``;
const list = (values) => [...new Set(values)].map(code).join(', ');
const charName = (char) => (/\s/.test(char) ? (char === ' ' ? 'space' : 'line break or tab') : char);

function fragmentKeys(raw) {
  if (!/^[^=&]+=[^&]*(?:&[^=&]+=[^&]*)*$/.test(raw)) return [];
  return raw.split('&').map((pair) => decodeText(pair.slice(0, pair.indexOf('='))));
}

export function checkUrl(parts) {
  const checks = [];
  const add = (id, level, title, detail) => checks.push({ id, level, title, detail });

  const places = [
    ['the path', parts.path.raw],
    ...parts.params.flatMap((param) => [
      [`the name ${code(param.key)}`, param.rawKey],
      [`the value of ${code(param.key)}`, param.rawValue],
    ]),
    ['the fragment', parts.fragment.raw],
    ['the user name', parts.username.raw],
    ['the password', parts.password.raw],
  ].filter(([, raw]) => raw);

  if (parts.hasUserinfo) {
    add(
      'credentials',
      'warning',
      parts.hasPassword ? 'A user name and password are in the URL' : 'A user name is in the URL',
      `${code(parts.username.text || '(empty)')} sits before the host${
        parts.hasPassword ? ' with a password' : ''
      }. A URL like this carries them into browser history, logs and anywhere it is pasted, and a long user part can disguise the real host, which is ${code(parts.host)}.`
    );
  }

  const secretKeys = [
    ...parts.params.filter((param) => looksSecret(param.key)).map((param) => param.key),
    ...fragmentKeys(parts.fragment.raw).filter(looksSecret),
  ];
  if (secretKeys.length > 0) {
    add(
      'secret-names',
      'warning',
      secretKeys.length === 1 ? 'One parameter is named like a secret' : 'Parameters are named like secrets',
      `${list(secretKeys)}: flagged by name only. The values were not inspected, so this can be wrong both ways: a harmless ${code('code')} or ${code('page_token')} is flagged, and a secret under an unusual name is not. If it is real, treat this whole URL as a credential.`
    );
  }

  if (parts.scheme.toLowerCase() === 'http' && (parts.hasUserinfo || secretKeys.length > 0)) {
    add(
      'plain-http',
      'warning',
      'Sent over plain http',
      'Everything in this URL, including the items above, crosses the network unencrypted.'
    );
  }

  const doubled = places.filter(([, raw]) => DOUBLE.test(raw));
  if (doubled.length > 0) {
    const example = DOUBLE.exec(doubled[0][1])[0];
    add(
      'double-encoding',
      'warning',
      'Looks double-encoded',
      `${code(example)} in ${doubled[0][0]} decodes to the text ${code(decodeText(example))}, not to the character it stands for. That usually means an already encoded value was encoded again.${
        doubled.length > 1 ? ` Also in ${doubled.slice(1).map(([where]) => where).join(', ')}.` : ''
      }`
    );
  }

  const malformed = places.filter(([, raw]) => hasMalformedEscape(raw));
  if (malformed.length > 0) {
    add(
      'malformed-escape',
      'warning',
      'A % that does not start an escape',
      `In ${malformed.map(([where]) => where).join(', ')}. A literal percent sign must be written ${code('%25')}; some servers reject the URL otherwise.`
    );
  }

  const invalid = [];
  for (const [, raw] of places) decodeText(raw, { invalid });
  if (invalid.length > 0) {
    add(
      'invalid-utf8',
      'note',
      'Escapes that are not UTF-8',
      `${list(invalid)} cannot be read as UTF-8 text, so it is left as written. It may be Latin-1 or binary data.`
    );
  }

  const unencoded = [parts.path.raw, ...parts.params.flatMap((p) => [p.rawKey, p.rawValue]), parts.fragment.raw].join('');
  const forbidden = unencoded.match(FORBIDDEN);
  if (forbidden) {
    add(
      'unencoded',
      'warning',
      'Characters that must be percent-encoded',
      `${[...new Set(forbidden.map(charName))].map(code).join(', ')} appear as written. Browsers repair some of these silently; other clients send them as they are or refuse the URL.`
    );
  }

  const beforeFragment = [parts.path.raw, ...parts.params.flatMap((p) => [p.rawKey, p.rawValue])].join('');
  if (/[[\]]/.test(beforeFragment)) {
    add(
      'brackets',
      'note',
      'Unencoded square brackets',
      `${code('[')} and ${code(']')} are reserved for IPv6 hosts. Browsers accept them in a path or query, but strict parsers and some proxies do not; ${code('%5B')} and ${code('%5D')} are the safe form.`
    );
  }

  if (NON_ASCII.test(unencoded)) {
    add(
      'non-ascii',
      'note',
      'Characters outside ASCII',
      'A browser sends these percent-encoded as UTF-8. A client that does not will send something the server may read differently.'
    );
  }

  const nested = parts.params.filter((param) => NESTED_URL.test(param.rawValue));
  for (const param of nested) {
    const last = parts.params[parts.params.length - 1] === param && !parts.hasFragment;
    add(
      `nested-${param.id}`,
      last ? 'note' : 'warning',
      `${param.key || 'A value'} holds a URL that was not encoded`,
      last
        ? `It reads correctly only while the inner URL has no ${code('&')} or ${code('#')} of its own. Encoding the whole value removes the doubt.`
        : `The inner URL's own ${code('&')} and ${code('#')} are not escaped, so everything after the first one has been read as part of the outer URL.`
    );
  }

  if (parts.plusAsSpace) {
    add(
      'plus',
      'note',
      '+ is read as a space',
      `That is the form-encoding rule nearly every server applies to a query. A literal plus sign has to be written ${code('%2B')}.`
    );
  }

  const counts = new Map();
  for (const param of parts.params) if (param.key) counts.set(param.key, (counts.get(param.key) ?? 0) + 1);
  const repeated = [...counts].filter(([, count]) => count > 1).map(([key]) => key);
  if (repeated.length > 0) {
    add(
      'repeated',
      'note',
      'Repeated parameter names',
      `${list(repeated)} appear more than once. Frameworks disagree on what that means: some keep the first, some the last, some build a list.`
    );
  }

  if (parts.params.some((param) => !param.rawKey && !param.rawValue && !param.hasEquals)) {
    add('empty-param', 'note', 'An empty parameter', `A stray ${code('&')} leaves a parameter with no name or value.`);
  }

  if (parts.port) {
    if (!/^\d+$/.test(parts.port) || Number(parts.port) > 65535) {
      add('port', 'warning', 'The port is not valid', `${code(parts.port)} is not a number from 0 to 65535.`);
    } else if (DEFAULT_PORTS[parts.scheme.toLowerCase()] === String(Number(parts.port))) {
      add(
        'default-port',
        'note',
        'The port is the default',
        `${code(parts.port)} is what ${parts.scheme.toLowerCase()} uses anyway, so a browser drops it. Signatures and allow-lists that compare URLs as text can then disagree.`
      );
    }
  }

  const host = parts.host && !parts.host.startsWith('[') ? hostForms(parts.host) : null;
  if (host?.international) {
    add(
      'idn',
      'note',
      'Internationalised hostname',
      `On the wire this host is ${code(host.ascii)}. Letters from another script can imitate a familiar name, so compare the ASCII form when it matters.`
    );
  }

  return checks;
}

export function summarise(parts, description) {
  if (!description.valid) {
    return 'This browser\'s own URL parser rejects it, so the parts below are a best reading.';
  }
  const count = parts.params.length;
  const pieces = [`${parts.scheme.toLowerCase()} URL`, count === 1 ? '1 query parameter' : `${count} query parameters`];
  if (parts.hasFragment) pieces.push('a fragment');
  return `Valid ${pieces.join(', ')}.`;
}

export function toPlain(parts) {
  return {
    scheme: parts.scheme,
    username: parts.hasUserinfo ? parts.username.text : null,
    password: parts.hasPassword ? parts.password.text : null,
    host: parts.host,
    port: parts.port || null,
    path: parts.path.text,
    query: parts.params.map((param) => ({ key: param.key, value: param.hasEquals ? param.value : null })),
    fragment: parts.hasFragment ? parts.fragment.text : null,
  };
}
