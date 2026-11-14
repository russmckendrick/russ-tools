# JWT Decoder/Validator

Decode a JSON Web Token, inspect its claims and timestamps, and optionally verify an asymmetric signature with the issuer's published keys or a public key you paste.

<!-- help:start -->

## Quick start

1. Paste a JWT into the token field or load one of the examples.
2. Check that the format indicator confirms three Base64URL-separated parts.
3. Review the decoded header and payload, token analysis, and standard or custom claims.
4. To verify an RSA, RSA-PSS, or ECDSA signature, switch on **Enable validation**, then either press **Fetch issuer keys** or paste a PEM public key, a JWK, or a JWKS key set.
5. Copy individual decoded parts as needed, then clear the token when finished.

## Decoding and validation

- Decoding reveals the header and payload but does **not** prove that the token is authentic.
- Token Analysis reports the declared algorithm and interprets `iat`, `exp`, and `nbf` timestamps when present.
- Signature validation supports public-key algorithms in the RS, PS, and ES families.
- The diagram's **Signature** step reads **verified**, **failed**, or **not checked** from the actual result. "Not checked" covers everything short of a completed check: validation switched off, no key yet, an HMAC or unsigned token, or a key that could not be found. Only a signature that was tested against a key and did not match reads "failed".
- The signature and the time claims are separate checks. An expired token with a good signature reads "verified" beside "expired".
- HMAC tokens can be decoded, but HS signatures are not verified by this browser tool because verification would require entering the shared secret.
- The issuer, audience, subject, expiry, and application-specific claims still need to be checked against your own trust policy.

## Verifying against the issuer's published keys

Most identity providers publish their public signing keys. When a token uses an RS, PS, or ES algorithm and its `iss` claim is an `https` address, the validation panel offers **Fetch issuer keys**.

Nothing is fetched until you press it. Pressing it makes two GET requests from your browser:

1. `<iss>/.well-known/openid-configuration`, the issuer's OpenID discovery document;
2. the address that document gives as `jwks_uri`, the issuer's key set.

The key is then picked by the `kid` in the token's header and the signature is checked in the browser.

What this does and does not send:

- **The token is not sent**, to the issuer or to russ.tools. The two requests carry no token, no cookies and no referring page address.
- The issuer's server sees what any web server sees: your IP address, your browser, and that the request came from russ.tools. It can infer that someone on this site is looking at one of its tokens.
- The second request normally goes to the issuer's own host. If `jwks_uri` is on a different host (Google keeps its keys on `www.googleapis.com`), the tool stops, names the host, and asks before sending it.
- Redirects are refused, so a request never ends up somewhere other than the address shown.
- The fetched keys are held in the page and are gone when it closes. **Forget these keys** drops them sooner.

A verified result means the token was signed by whoever controls the address in its `iss` claim. A forged token can name a forger's address and will verify against the forger's keys, so check the issuer is one you trust.

### If the keys cannot be fetched

A browser may only read another site's response when that site allows it (CORS), and not every issuer does. The tool then says the request did not complete and links the address it tried. Open that address in a new tab, follow `jwks_uri` if you are looking at the discovery document, copy the JSON key set, and paste it into the key box. A pasted JWKS is searched by `kid` exactly as a fetched one is, and a pasted key always takes precedence over fetched keys.

## Security tips

- Treat bearer tokens as credentials. Redact or use a synthetic token when sharing screenshots or bug reports.
- Never paste a private signing key. Asymmetric verification needs only the public key.
- Reject an unexpected algorithm even if a signature operation succeeds.
- Production systems must validate signatures and required claims on the server; this tool is for inspection and debugging.

## Privacy and saved data

Token decoding and signature verification run locally in the browser, and the token never leaves it. The tool makes no network request of its own accord and stores no token history. The one exception is yours to trigger: **Fetch issuer keys** sends two GET requests for the issuer's public keys, described above, and neither contains the token. A token placed in a deep-link URL can still be retained in browser history, logs outside this app, screenshots, or anything you share it with.

## Troubleshooting

- A JWT must have exactly three dot-separated parts and valid Base64URL JSON in its header and payload.
- A verification key must match both the signing key and the token's algorithm family.
- PEM input must include the public-key header and footer; JWK and JWKS input must be valid JSON. Pasting the discovery document itself does not work: open its `jwks_uri` and paste that.
- "None with the key ID" means the key set does not hold the key that signed the token. Issuers rotate keys, so an old token can outlive its key.
- If **Fetch issuer keys** is not offered, the token is HMAC-signed or unsigned, has no `iss`, or its `iss` is not an `https` address.
- Clock-based status uses the current device time, so an incorrect system clock can make expiry results misleading.

<!-- help:end -->

Issuer discovery lives in [`lib/issuer.js`](../../../src/tools/jwt/lib/issuer.js) and verification in [`lib/signature.js`](../../../src/tools/jwt/lib/signature.js). An older extended reference remains in [README_JWT.md](README_JWT.md). The tool contract is defined in [`src/tools/jwt/manifest.mjs`](../../../src/tools/jwt/manifest.mjs).
