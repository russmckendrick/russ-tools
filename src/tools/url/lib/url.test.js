import { describe, it, expect } from 'vitest';
import {
  SAMPLE_URL,
  addParam,
  buildUrl,
  checkUrl,
  describeUrl,
  editParam,
  editPart,
  looksSecret,
  parseUrl,
  removeParam,
  summarise,
  toPlain,
} from './url.js';
import { decodeForms, decodeText, encodeForms } from './encoding.js';
import { decodePunycode, hostForms, toUnicodeHost } from './punycode.js';

const parts = (text) => parseUrl(text).parts;
const ids = (text) => checkUrl(parts(text)).map((check) => check.id);

describe('parseUrl', () => {
  it('splits a URL into decoded parts', () => {
    expect(toPlain(parts(SAMPLE_URL))).toEqual({
      scheme: 'https',
      username: null,
      password: null,
      host: 'api.example.com',
      port: '8443',
      path: '/v1/search/café',
      query: [
        { key: 'q', value: 'subnet calculator' },
        { key: 'page', value: '2' },
        { key: 'tag', value: 'dns' },
        { key: 'tag', value: 'tls' },
      ],
      fragment: 'results',
    });
  });

  it('reads credentials, an IPv6 host and its port', () => {
    const plain = toPlain(parts('https://deploy:p%40ss@[2001:db8::1]:8443/'));
    expect(plain.username).toBe('deploy');
    expect(plain.password).toBe('p@ss');
    expect(plain.host).toBe('[2001:db8::1]');
    expect(plain.port).toBe('8443');
  });

  it('splits credentials on the last @, which is where the host really starts', () => {
    expect(toPlain(parts('https://bank.example@evil.test/login')).host).toBe('evil.test');
  });

  it('keeps the escapes that would change the shape of a path', () => {
    const plain = toPlain(parts('https://example.com/a%2Fb/c%20d/100%25'));
    expect(plain.path).toBe('/a%2Fb/c d/100%25');
  });

  it('tells a bare name from a name with an empty value', () => {
    expect(toPlain(parts('https://example.com/?debug&v=')).query).toEqual([
      { key: 'debug', value: null },
      { key: 'v', value: '' },
    ]);
  });

  it('reads + as a space only when the query uses it', () => {
    expect(toPlain(parts('https://example.com/?q=a+b')).query[0].value).toBe('a b');
    expect(toPlain(parts('https://example.com/a+b')).path).toBe('/a+b');
  });

  it('reads a URL with no authority', () => {
    const plain = toPlain(parts('mailto:someone@example.com?subject=Hello%20there'));
    expect(plain.scheme).toBe('mailto');
    expect(plain.host).toBe('');
    expect(plain.path).toBe('someone@example.com');
    expect(plain.query).toEqual([{ key: 'subject', value: 'Hello there' }]);
  });

  it('never throws on broken escapes', () => {
    const plain = toPlain(parts('https://example.com/%zz?a=%E0%A4&b=%'));
    expect(plain.path).toBe('/%zz');
    expect(plain.query).toEqual([
      { key: 'a', value: '%E0%A4' },
      { key: 'b', value: '%' },
    ]);
  });

  it('explains what is missing rather than guessing', () => {
    expect(parseUrl('')).toEqual({ ok: false, empty: true });
    const bare = parseUrl('example.com/path?a=1');
    expect(bare.ok).toBe(false);
    expect(bare.error).toMatch(/No scheme/);
    expect(bare.suggestion).toBe('https://example.com/path?a=1');
    expect(parseUrl('just some words').suggestion).toBeNull();
  });

  it('refuses a paste too long to be a URL', () => {
    expect(parseUrl(`https://example.com/${'a'.repeat(100001)}`).error).toMatch(/Too long/);
  });
});

describe('buildUrl', () => {
  it.each([
    SAMPLE_URL,
    'https://deploy:p%40ss@[2001:db8::1]:8443/',
    'https://example.com/a%2Fb/c%20d/100%25?debug&v=&&x=%2520#',
    'mailto:someone@example.com?subject=Hello%20there',
    'HTTP://Example.COM:80/%7Euser?next=https://other.test/?a=1&b=2#frag',
    'https://example.com',
    'https://example.com/?',
  ])('gives back %s untouched when nothing is edited', (url) => {
    const expected = url.endsWith('/?') ? url.slice(0, -1) : url;
    expect(buildUrl(parts(url))).toBe(expected);
  });

  it('re-encodes only the part that was edited', () => {
    const start = parts('https://example.com/a%2Fb?redirect=%2Fhome&q=one+two');
    const edited = editParam(start, 2, 'value', 'three four & five');
    expect(buildUrl(edited)).toBe('https://example.com/a%2Fb?redirect=%2Fhome&q=three+four+%26+five');
  });

  it('writes a space as %20 when the query does not use +', () => {
    const edited = editParam(parts('https://example.com/?q=one'), 1, 'value', 'a b+c');
    expect(buildUrl(edited)).toBe('https://example.com/?q=a%20b%2Bc');
  });

  it('adds, renames and removes parameters', () => {
    let state = addParam(parts('https://example.com/'));
    state = editParam(state, 1, 'key', 'tag name');
    state = editParam(state, 1, 'value', 'ünï');
    expect(buildUrl(state)).toBe('https://example.com/?tag%20name=%C3%BCn%C3%AF');
    state = addParam(state);
    expect(state.params.map((param) => param.id)).toEqual([1, 2]);
    expect(buildUrl(removeParam(removeParam(state, 1), 2))).toBe('https://example.com/');
  });

  it('encodes an edited path but leaves typed escapes alone', () => {
    const start = parts('https://example.com/old');
    expect(buildUrl(editPart(start, 'path', '/a b/c%2Fd/50%/é?#'))).toBe(
      'https://example.com/a%20b/c%2Fd/50%25/%C3%A9%3F%23'
    );
    expect(buildUrl(editPart(start, 'path', 'no-slash'))).toBe('https://example.com/no-slash');
  });

  it('edits the scheme, host, port, credentials and fragment', () => {
    let state = parts('https://example.com/x');
    state = editPart(state, 'scheme', 'wss://');
    state = editPart(state, 'host', 'münchen.de');
    state = editPart(state, 'port', ':9000');
    state = editPart(state, 'username', 'a user');
    state = editPart(state, 'password', 'p:w@d');
    state = editPart(state, 'fragment', 'part two');
    expect(buildUrl(state)).toBe('wss://a%20user:p%3Aw%40d@münchen.de:9000/x#part%20two');
    state = editPart(editPart(state, 'password', ''), 'username', '');
    state = editPart(state, 'fragment', '');
    expect(buildUrl(state)).toBe('wss://münchen.de:9000/x');
  });

  it('round-trips its own output', () => {
    const edited = editParam(parts(SAMPLE_URL), 1, 'value', 'a=b&c d');
    const rebuilt = buildUrl(edited);
    expect(toPlain(parts(rebuilt))).toEqual(toPlain(edited));
  });
});

describe('checkUrl', () => {
  it('finds nothing wrong with an ordinary URL', () => {
    expect(ids('https://example.com/docs/page?id=42#top')).toEqual([]);
  });

  it('flags embedded credentials and names the real host', () => {
    const [check] = checkUrl(parts('https://bank.example@evil.test/login'));
    expect(check.id).toBe('credentials');
    expect(check.level).toBe('warning');
    expect(check.detail).toContain('`evil.test`');
  });

  it('flags secret-looking names and says it is by name only', () => {
    const [check] = checkUrl(parts('https://example.com/cb?state=1&access_token=abc&X-Amz-Signature=def'));
    expect(check.id).toBe('secret-names');
    expect(check.detail).toContain('`access_token`, `X-Amz-Signature`');
    expect(check.detail).toContain('flagged by name only');
  });

  it('reads an OAuth-style fragment for secret names too', () => {
    expect(ids('https://app.example/cb#access_token=abc&expires_in=3600')).toContain('secret-names');
    expect(ids('https://app.example/docs#section-2')).toEqual([]);
  });

  it('adds the plain-http warning only when there is something to expose', () => {
    expect(ids('http://example.com/?api_key=1')).toEqual(['secret-names', 'plain-http']);
    expect(ids('http://example.com/?page=1')).toEqual([]);
  });

  it('flags double-encoding and shows what it decodes to', () => {
    const check = checkUrl(parts('https://example.com/a?next=%252Fhome%2520page')).find(
      (item) => item.id === 'double-encoding'
    );
    expect(check.detail).toContain('`%252F` in the value of `next` decodes to the text `%2F`');
  });

  it('flags characters that must be encoded', () => {
    const check = checkUrl(parts('https://example.com/my file?q=<b>')).find((item) => item.id === 'unencoded');
    expect(check.detail).toContain('`space`, `<`, `>`');
  });

  it('flags a stray percent sign and bytes that are not UTF-8', () => {
    expect(ids('https://example.com/?discount=50%')).toEqual(['malformed-escape']);
    expect(ids('https://example.com/caf%E9')).toEqual(['invalid-utf8']);
  });

  it('notes brackets, non-ASCII text, + and repeated names', () => {
    expect(ids('https://example.com/?filter[name]=x')).toEqual(['brackets']);
    expect(ids('https://example.com/café')).toEqual(['non-ascii']);
    expect(ids('https://example.com/?q=a+b')).toEqual(['plus']);
    expect(ids('https://example.com/?tag=a&tag=b')).toEqual(['repeated']);
    expect(ids('https://example.com/?a=1&&b=2')).toEqual(['empty-param']);
  });

  it('warns when an unencoded inner URL has leaked parameters into the outer one', () => {
    const leaked = checkUrl(parts('https://example.com/login?next=https://app.test/?a=1&b=2'));
    expect(leaked[0].id).toBe('nested-1');
    expect(leaked[0].level).toBe('warning');
    const last = checkUrl(parts('https://example.com/login?x=1&next=https://app.test/home'));
    expect(last[0].level).toBe('note');
  });

  it('checks the port', () => {
    expect(ids('https://example.com:99999/')).toEqual(['port']);
    expect(ids('https://example.com:abc/')).toEqual(['port']);
    expect(ids('https://example.com:443/')).toEqual(['default-port']);
    expect(ids('https://example.com:8443/')).toEqual([]);
  });

  it('notes an internationalised host in either spelling', () => {
    expect(ids('https://münchen.de/')).toEqual(['idn']);
    expect(ids('https://xn--mnchen-3ya.de/')).toEqual(['idn']);
  });
});

describe('looksSecret', () => {
  it.each(['token', 'access_token', 'id-token', 'apiKey', 'api_key', 'client_secret', 'sig', 'code', 'password', 'X-Amz-Credential', 'sessionId', 'subscription-key'])(
    'flags %s',
    (key) => expect(looksSecret(key)).toBe(true)
  );

  it.each(['page', 'q', 'keyword', 'sort', 'author', 'passenger', 'signal', 'tokenise', ''])('leaves %s alone', (key) =>
    expect(looksSecret(key)).toBe(false)
  );
});

describe('describeUrl and summarise', () => {
  it('gives the form a browser sends and both spellings of the host', () => {
    expect(describeUrl('HTTPS://München.de:443/a b?q=ü')).toEqual({
      valid: true,
      href: 'https://xn--mnchen-3ya.de/a%20b?q=%C3%BC',
      origin: 'https://xn--mnchen-3ya.de',
      asciiHost: 'xn--mnchen-3ya.de',
      unicodeHost: 'münchen.de',
      international: true,
    });
  });

  it('says so when the browser parser rejects the URL', () => {
    const state = parts('https://exa mple.com/');
    const description = describeUrl(buildUrl(state));
    expect(description).toEqual({ valid: false });
    expect(summarise(state, description)).toMatch(/rejects it/);
    expect(summarise(parts(SAMPLE_URL), describeUrl(SAMPLE_URL))).toBe(
      'Valid https URL, 4 query parameters, a fragment.'
    );
  });
});

describe('percent-encoding helpers', () => {
  it('decodes valid UTF-8 and leaves the rest as written', () => {
    const invalid = [];
    expect(decodeText('caf%C3%A9%20%E9%zz', { invalid })).toBe('café %E9%zz');
    expect(invalid).toEqual(['%E9']);
    expect(decodeText('%F0%9F%98%80')).toBe('😀');
  });

  it('gives all three encodings of the same text', () => {
    const forms = encodeForms('a b&c=d/é?');
    expect(forms.component.value).toBe('a%20b%26c%3Dd%2F%C3%A9%3F');
    expect(forms.uri.value).toBe('a%20b&c=d/%C3%A9?');
    expect(forms.form.value).toBe('a+b%26c%3Dd%2F%C3%A9%3F');
  });

  it('reports text that cannot be encoded instead of throwing', () => {
    expect(encodeForms('\ud800').component.ok).toBe(false);
  });

  it('decodes strictly when it can and leniently when it cannot', () => {
    const clean = decodeForms('a%20b%26c%2Fd+e');
    expect(clean.component).toEqual({ ok: true, value: 'a b&c/d+e' });
    expect(clean.uri).toEqual({ ok: true, value: 'a b%26c%2Fd+e' });
    expect(clean.form).toEqual({ ok: true, value: 'a b&c/d e' });

    const broken = decodeForms('50%25 off%2 now %E9');
    expect(broken.component).toEqual({ ok: false, value: '50% off%2 now %E9' });
    expect(broken.uri.ok).toBe(false);
    expect(broken.malformed).toBe(true);
    expect(broken.invalid).toEqual(['%E9']);
  });
});

describe('punycode', () => {
  it.each([
    ['mnchen-3ya', 'münchen'],
    ['bcher-kva', 'bücher'],
    ['p1ai', 'рф'],
    ['e1afmkfd', 'пример'],
    ['fsq', '例'],
    ['maana-pta', 'mañana'],
    ['ls8h', '💩'],
  ])('decodes %s to %s', (encoded, decoded) => {
    expect(decodePunycode(encoded)).toBe(decoded);
  });

  it('returns null for input that is not punycode', () => {
    expect(decodePunycode('é')).toBeNull();
    expect(decodePunycode('abc-!!!')).toBeNull();
  });

  it('agrees with the platform encoder for every label it decodes', () => {
    for (const name of ['münchen.de', 'пример.рф', '中国.cn', 'café.example', 'ñandú.es', 'ελληνικά.gr']) {
      const ascii = new URL(`http://${name}`).hostname;
      expect(ascii).toContain('xn--');
      expect(toUnicodeHost(ascii)).toBe(name);
    }
  });

  it('describes a host in both forms', () => {
    expect(hostForms('Bücher.example')).toEqual({
      ascii: 'xn--bcher-kva.example',
      unicode: 'bücher.example',
      international: true,
    });
    expect(hostForms('example.com')).toEqual({ ascii: 'example.com', unicode: 'example.com', international: false });
    expect(hostForms('not a host').ascii).toBeNull();
  });
});
