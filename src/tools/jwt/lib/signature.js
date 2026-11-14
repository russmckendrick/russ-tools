import { compactVerify, importJWK, importSPKI } from 'jose';

const KEY_TYPES = { RS: 'RSA', PS: 'RSA', ES: 'EC' };

export function algorithmFamily(alg) {
  if (typeof alg !== 'string' || !alg) return 'unknown';
  if (alg.toLowerCase() === 'none') return 'none';
  if (alg.startsWith('HS')) return 'hmac';
  if (KEY_TYPES[alg.slice(0, 2)]) return 'asymmetric';
  return 'unknown';
}

export const isAsymmetric = (alg) => algorithmFamily(alg) === 'asymmetric';

const notChecked = (message) => ({ status: 'not-checked', message });
const sentence = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export function parseKeyMaterial(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return null;
  if (trimmed.includes('BEGIN')) return { kind: 'pem', pem: trimmed };

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('The key is neither PEM nor JSON. Paste a PEM public key, a JWK, or a JWKS key set.');
  }
  if (parsed && Array.isArray(parsed.keys)) {
    if (parsed.keys.length === 0) throw new Error('The pasted key set has no keys in it.');
    return { kind: 'jwks', keys: parsed.keys };
  }
  if (parsed && typeof parsed === 'object' && typeof parsed.kty === 'string') {
    return { kind: 'jwk', jwk: parsed };
  }
  if (parsed && typeof parsed === 'object' && typeof parsed.jwks_uri === 'string') {
    throw new Error(
      'That is the discovery document, not the keys. Open the jwks_uri address it names and paste what that shows.',
    );
  }
  throw new Error('The JSON is not a JWK (no "kty") and not a JWKS (no "keys" list).');
}

export function candidateKeys(keys, header) {
  const keyType = KEY_TYPES[String(header.alg).slice(0, 2)];
  const usable = keys.filter(
    (key) =>
      key &&
      key.kty === keyType &&
      (key.use === undefined || key.use === 'sig') &&
      (key.alg === undefined || key.alg === header.alg),
  );
  if (header.kid === undefined) return usable;
  return usable.filter((key) => key.kid === header.kid);
}

async function verifyWith(token, alg, importKey) {
  let key;
  try {
    key = await importKey();
  } catch (error) {
    return { outcome: 'unusable', reason: error.message };
  }
  try {
    await compactVerify(token, key, { algorithms: [alg] });
    return { outcome: 'verified' };
  } catch (error) {
    if (error?.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') return { outcome: 'failed' };
    return { outcome: 'unusable', reason: error.message };
  }
}

async function verifyWithKeySet(token, header, keys, sourceLabel) {
  const candidates = candidateKeys(keys, header);
  if (candidates.length === 0) {
    const count = `${keys.length} key${keys.length === 1 ? '' : 's'}`;
    return notChecked(
      header.kid === undefined
        ? `${sentence(sourceLabel)} has ${count}, but none is a signing key for ${header.alg}.`
        : `${sentence(sourceLabel)} has ${count}, but none with the key ID "${header.kid}" for ${header.alg}. Issuers rotate keys, so an old token can outlive the key that signed it.`,
    );
  }

  let unusable;
  for (const jwk of candidates) {
    const result = await verifyWith(token, header.alg, () => importJWK(jwk, header.alg));
    if (result.outcome === 'verified') {
      return {
        status: 'verified',
        kid: jwk.kid,
        message: jwk.kid === undefined ? `Signature verified with a key from ${sourceLabel}.` : `Signature verified with key "${jwk.kid}" from ${sourceLabel}.`,
      };
    }
    if (result.outcome === 'unusable') unusable = result.reason;
  }

  if (unusable && candidates.length === 1) return notChecked(`The key could not be used: ${unusable}`);
  return {
    status: 'failed',
    message:
      candidates.length === 1
        ? `Signature does not match the key from ${sourceLabel}. The token was not signed by it, or has been altered since.`
        : `Signature matches none of the ${candidates.length} possible keys from ${sourceLabel}. The token was not signed by them, or has been altered since.`,
  };
}

export async function verifySignature({ token, header, keyText = '', jwks = null, jwksSource = 'the issuer' }) {
  const family = algorithmFamily(header?.alg);
  if (family === 'none') {
    return notChecked('This token is unsigned ("alg": "none"), so there is no signature to check. Do not trust it.');
  }
  if (family === 'hmac') {
    return notChecked(
      `${header.alg} signatures are made with a shared secret, and checking one here would mean typing that secret into a web page. Verify HMAC tokens on the server that holds the secret.`,
    );
  }
  if (family !== 'asymmetric') {
    return notChecked(`This tool does not verify the algorithm "${header?.alg ?? 'not stated'}".`);
  }

  let material;
  try {
    material = parseKeyMaterial(keyText);
  } catch (error) {
    return notChecked(error.message);
  }

  if (material?.kind === 'pem') {
    const result = await verifyWith(token, header.alg, () => importSPKI(material.pem, header.alg));
    if (result.outcome === 'verified') return { status: 'verified', message: 'Signature verified with the pasted public key.' };
    if (result.outcome === 'failed') {
      return {
        status: 'failed',
        message: 'Signature does not match the pasted public key. The token was not signed by it, or has been altered since.',
      };
    }
    return notChecked(`The pasted key could not be used: ${result.reason}`);
  }
  if (material?.kind === 'jwk') return verifyWithKeySet(token, { ...header, kid: undefined }, [material.jwk], 'the pasted JWK');
  if (material?.kind === 'jwks') return verifyWithKeySet(token, header, material.keys, 'the pasted key set');
  if (jwks) return verifyWithKeySet(token, header, jwks.keys, jwksSource);

  return notChecked('Waiting for a key: fetch the issuer\'s keys or paste one below.');
}
