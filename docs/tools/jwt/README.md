# JWT Decoder/Validator

Decode a JSON Web Token, inspect its claims and timestamps, and optionally verify an asymmetric signature with a public key.

<!-- help:start -->

## Quick start

1. Paste a JWT into the token field or load one of the examples.
2. Check that the format indicator confirms three Base64URL-separated parts.
3. Review the decoded header and payload, token analysis, and standard or custom claims.
4. To verify an RSA, RSA-PSS, or ECDSA signature, enable validation and provide a matching PEM public key or JWK.
5. Copy individual decoded parts as needed, then clear the token when finished.

## Decoding and validation

- Decoding reveals the header and payload but does **not** prove that the token is authentic.
- Token Analysis reports the declared algorithm and interprets `iat`, `exp`, and `nbf` timestamps when present.
- Signature validation supports public-key algorithms in the RS, PS, and ES families.
- HMAC tokens can be decoded, but HS signatures are not verified by this browser tool because verification would require entering the shared secret.
- The issuer, audience, subject, expiry, and application-specific claims still need to be checked against your own trust policy.

## Security tips

- Treat bearer tokens as credentials. Redact or use a synthetic token when sharing screenshots or bug reports.
- Never paste a private signing key. Asymmetric verification needs only the public key.
- Reject an unexpected algorithm even if a signature operation succeeds.
- Production systems must validate signatures and required claims on the server; this tool is for inspection and debugging.

## Privacy and saved data

Token decoding and signature verification run locally in the browser. The tool makes no token-processing API call and stores no token history. A token placed in a deep-link URL can still be retained in browser history, logs outside this app, screenshots, or anything you share it with.

## Troubleshooting

- A JWT must have exactly three dot-separated parts and valid Base64URL JSON in its header and payload.
- A verification key must match both the signing key and the token's algorithm family.
- PEM input must include the public-key header and footer; JWK input must be valid JSON.
- Clock-based status uses the current device time, so an incorrect system clock can make expiry results misleading.

<!-- help:end -->

An older extended reference remains in [README_JWT.md](README_JWT.md). The tool contract is defined in [`src/tools/jwt/manifest.mjs`](../../../src/tools/jwt/manifest.mjs).
