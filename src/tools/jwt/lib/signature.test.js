import { beforeAll, describe, expect, it } from 'vitest';
import { SignJWT, exportJWK, exportSPKI, generateKeyPair } from 'jose';
import { algorithmFamily, candidateKeys, isAsymmetric, parseKeyMaterial, verifySignature } from './signature.js';

const decodeHeader = (token) => JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());

const keys = {};

async function makeKey(alg, kid) {
  const pair = await generateKeyPair(alg, { extractable: true });
  const jwk = { ...(await exportJWK(pair.publicKey)), kid, use: 'sig', alg };
  return { alg, kid, privateKey: pair.privateKey, jwk, pem: await exportSPKI(pair.publicKey) };
}

async function sign(key, { kid = key.kid, claims = {}, expiresIn } = {}) {
  let builder = new SignJWT({ sub: 'user-1', ...claims })
    .setProtectedHeader(kid === null ? { alg: key.alg } : { alg: key.alg, kid })
    .setIssuer('https://issuer.example');
  if (expiresIn !== undefined) builder = builder.setExpirationTime(expiresIn);
  return builder.sign(key.privateKey);
}

const tamper = (token) => {
  const [header, , signature] = token.split('.');
  const payload = Buffer.from(JSON.stringify({ sub: 'admin', iss: 'https://issuer.example' })).toString('base64url');
  return `${header}.${payload}.${signature}`;
};

const check = (token, extra) => verifySignature({ token, header: decodeHeader(token), ...extra });

beforeAll(async () => {
  keys.rs = await makeKey('RS256', 'rsa-1');
  keys.rsOther = await makeKey('RS256', 'rsa-2');
  keys.es = await makeKey('ES256', 'ec-1');
  keys.ps = await makeKey('PS256', 'pss-1');
});

describe('algorithmFamily', () => {
  it.each([
    ['RS256', 'asymmetric'],
    ['PS384', 'asymmetric'],
    ['ES512', 'asymmetric'],
    ['HS256', 'hmac'],
    ['none', 'none'],
    ['None', 'none'],
    ['EdDSA', 'unknown'],
    [undefined, 'unknown'],
  ])('%s is %s', (alg, family) => {
    expect(algorithmFamily(alg)).toBe(family);
    expect(isAsymmetric(alg)).toBe(family === 'asymmetric');
  });
});

describe('verifySignature against a fetched key set', () => {
  const jwks = () => ({ keys: [keys.rsOther.jwk, keys.es.jwk, keys.rs.jwk, keys.ps.jwk] });

  it.each(['rs', 'es', 'ps'])('verifies an %s token with the key its kid names', async (name) => {
    const token = await sign(keys[name]);
    expect(await check(token, { jwks: jwks(), jwksSource: 'issuer.example' })).toEqual({
      status: 'verified',
      kid: keys[name].kid,
      message: `Signature verified with key "${keys[name].kid}" from issuer.example.`,
    });
  });

  it('fails a token whose payload was changed after signing', async () => {
    const result = await check(tamper(await sign(keys.rs)), { jwks: jwks() });
    expect(result.status).toBe('failed');
    expect(result.message).toMatch(/does not match the key from the issuer/);
  });

  it('fails a token signed by a different key that claims the same kid', async () => {
    const token = await sign(keys.rsOther, { kid: 'rsa-1' });
    expect((await check(token, { jwks: jwks() })).status).toBe('failed');
  });

  it('does not check when no key has the kid, and says keys rotate', async () => {
    const token = await sign(keys.rs, { kid: 'retired' });
    const result = await check(token, { jwks: jwks() });
    expect(result.status).toBe('not-checked');
    expect(result.message).toMatch(/^The issuer has 4 keys, but none with the key ID "retired" for RS256.*rotate/);
  });

  it('tries every suitable key when the token names none', async () => {
    const token = await sign(keys.rs, { kid: null });
    expect(await check(token, { jwks: jwks() })).toMatchObject({ status: 'verified', kid: 'rsa-1' });
  });

  it('fails when the token names no key and none fits', async () => {
    const token = await sign(keys.rs, { kid: null });
    const result = await check(token, { jwks: { keys: [keys.rsOther.jwk, keys.es.jwk] } });
    expect(result.status).toBe('failed');
  });

  it('skips keys of the wrong type, use or algorithm', () => {
    const header = { alg: 'RS256' };
    const set = [
      { kty: 'EC', kid: 'ec' },
      { kty: 'RSA', kid: 'enc', use: 'enc' },
      { kty: 'RSA', kid: 'ps', alg: 'PS256' },
      { kty: 'RSA', kid: 'plain' },
      { kty: 'RSA', kid: 'exact', use: 'sig', alg: 'RS256' },
      null,
    ];
    expect(candidateKeys(set, header).map((key) => key.kid)).toEqual(['plain', 'exact']);
    expect(candidateKeys(set, { alg: 'RS256', kid: 'exact' }).map((key) => key.kid)).toEqual(['exact']);
  });

  it('verifies an expired token: the signature and the time claims are separate checks', async () => {
    const token = await sign(keys.rs, { expiresIn: Math.floor(Date.now() / 1000) - 3600 });
    expect((await check(token, { jwks: jwks() })).status).toBe('verified');
  });
});

describe('verifySignature with pasted key material', () => {
  it('verifies with a PEM public key', async () => {
    expect(await check(await sign(keys.rs), { keyText: keys.rs.pem })).toEqual({
      status: 'verified',
      message: 'Signature verified with the pasted public key.',
    });
  });

  it('fails with the wrong PEM', async () => {
    expect((await check(await sign(keys.rs), { keyText: keys.rsOther.pem })).status).toBe('failed');
  });

  it('verifies with a single JWK, whatever its kid', async () => {
    const jwk = { ...keys.es.jwk, kid: 'renamed' };
    expect(await check(await sign(keys.es), { keyText: JSON.stringify(jwk) })).toMatchObject({ status: 'verified' });
  });

  it('verifies with a pasted JWKS, picking the key by kid', async () => {
    const pasted = JSON.stringify({ keys: [keys.rsOther.jwk, keys.rs.jwk] }, null, 2);
    expect(await check(await sign(keys.rs), { keyText: pasted })).toEqual({
      status: 'verified',
      kid: 'rsa-1',
      message: 'Signature verified with key "rsa-1" from the pasted key set.',
    });
  });

  it('prefers pasted material to fetched keys', async () => {
    const result = await check(await sign(keys.rs), { keyText: keys.rsOther.pem, jwks: { keys: [keys.rs.jwk] } });
    expect(result.status).toBe('failed');
  });

  it.each([
    ['not a key', /neither PEM nor JSON/],
    ['{"keys": []}', /no keys in it/],
    ['{"hello": "world"}', /not a JWK .* and not a JWKS/],
    ['{"issuer": "https://issuer.example", "jwks_uri": "https://issuer.example/keys"}', /discovery document, not the keys/],
    ['-----BEGIN PUBLIC KEY-----\nnope\n-----END PUBLIC KEY-----', /could not be used/],
  ])('does not check with %s', async (keyText, message) => {
    const result = await check(await sign(keys.rs), { keyText });
    expect(result.status).toBe('not-checked');
    expect(result.message).toMatch(message);
  });

  it('does not check an RSA token against an EC key', async () => {
    const result = await check(await sign(keys.rs), { keyText: JSON.stringify(keys.es.jwk) });
    expect(result.status).toBe('not-checked');
  });
});

describe('verifySignature without a usable route', () => {
  const hs = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2ln';
  const unsigned = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from('{"sub":"a"}').toString('base64url')}.`;

  it('waits for a key', async () => {
    const result = await check(await sign(keys.rs));
    expect(result.status).toBe('not-checked');
    expect(result.message).toMatch(/Waiting for a key/);
  });

  it('never reports an HMAC token as verified or failed', async () => {
    const result = await check(hs, { keyText: 'secret', jwks: { keys: [keys.rs.jwk] } });
    expect(result.status).toBe('not-checked');
    expect(result.message).toMatch(/shared secret/);
  });

  it('never reports an unsigned token as verified', async () => {
    const result = await check(unsigned, { jwks: { keys: [keys.rs.jwk] } });
    expect(result.status).toBe('not-checked');
    expect(result.message).toMatch(/unsigned/);
  });

  it('does not check an algorithm it does not know', async () => {
    const result = await verifySignature({ token: 'a.b.c', header: { alg: 'EdDSA' } });
    expect(result).toEqual({ status: 'not-checked', message: 'This tool does not verify the algorithm "EdDSA".' });
  });

  it('refuses a token whose alg was swapped to one the key does not sign', async () => {
    const token = await sign(keys.rs);
    const [, payload, signature] = token.split('.');
    const header = Buffer.from(JSON.stringify({ alg: 'PS256', kid: 'rsa-1' })).toString('base64url');
    const result = await check(`${header}.${payload}.${signature}`, { jwks: { keys: [keys.rs.jwk] } });
    expect(result.status).not.toBe('verified');
  });
});

describe('parseKeyMaterial', () => {
  it('returns nothing for an empty box', () => {
    expect(parseKeyMaterial('   ')).toBeNull();
    expect(parseKeyMaterial(undefined)).toBeNull();
  });

  it('tells PEM, JWK and JWKS apart', () => {
    expect(parseKeyMaterial('-----BEGIN PUBLIC KEY-----').kind).toBe('pem');
    expect(parseKeyMaterial('{"kty":"RSA"}').kind).toBe('jwk');
    expect(parseKeyMaterial('{"keys":[{"kty":"RSA"}]}').kind).toBe('jwks');
  });
});
