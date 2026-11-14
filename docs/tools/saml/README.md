# SAML Decoder

Read a SAML 2.0 response, request or assertion copied out of a browser trace. It is decoded in the browser: a SAML response names a real user and often carries group memberships, so it should not be pasted into a site that uploads it.

<!-- help:start -->

## Quick start

1. Copy the `SAMLResponse` or `SAMLRequest` value from your browser's network tab or a SAML tracer extension. The whole redirect URL or form body works too.
2. Paste it into the box. **Load sample** fills in a synthetic response to try.
3. Read the summary: who issued it, who it is about, which service it is for, and how long it is valid.
4. Check the findings beneath the summary, then the attribute table, the signatures and the re-indented XML.

## What it accepts

The encoding is detected, and the line under the box says how the message was read.

- **Base64**: the HTTP POST binding, which is how a response usually arrives.
- **Base64 over DEFLATE**: the HTTP Redirect binding, which is how a request usually leaves.
- **URL-encoded** versions of either, as they appear in a query string or form body.
- **A whole URL or form body**: `https://idp.example/sso?SAMLRequest=...&RelayState=...`. The `RelayState` is shown, and a `SigAlg` and `Signature` are reported as a query-string signature.
- **Raw XML**.

Responses, authentication requests, logout requests and responses, and bare assertions are summarised. Any other XML is re-indented and shown without a summary.

## What is shown

- **Issuer**, **subject** and **NameID format**, **audience**, **destination** and **recipient**.
- **Validity window**: `NotBefore` to `NotOnOrAfter`, drawn as a bar with the current time on it.
- **Authentication context**, the time of sign-in and the session index.
- **Attributes**: every attribute and every value. Entra ID claim URIs such as `.../identity/claims/tenantid` and common `urn:oid:` names are labelled with their friendly names, with the URI kept beneath.
- **Signatures**: whether the response, the assertion, both or neither is signed, with the signature, digest and canonicalisation algorithms, what each signature covers, and a link to decode an embedded certificate.
- **XML**: re-indented and coloured. The original bytes are what was signed, not this copy.

## Findings

- **Expired** or **not yet valid**, measured against this device's clock. An expired assertion is normal for a trace captured more than a few minutes ago.
- **No audience restriction**: the assertion does not say which service it is for.
- **SHA-1 or MD5** in a signature or digest.
- **Nothing is signed**, or **the assertion is not signed** and only the response around it is.
- **A signature that references another element**, which is the shape of a signature-wrapping attack.
- **A failed status**, with the identity provider's code and message.
- **An encrypted assertion**, which cannot be read without the service provider's private key.

## Limits

**Signatures are reported, not verified.** The tool reads which algorithms and certificate a signature names. It does not check the signature against a key, so it cannot tell you a message is genuine or unaltered, and a "signed" badge means only that a signature element is present. It does not decrypt an `EncryptedAssertion`, and it does not read SAML 1.1 or WS-Federation messages. A document with a `DOCTYPE` is refused, since SAML never uses one.

## Privacy and saved data

Nothing is uploaded and nothing is saved to localStorage. The message is decoded with the browser's own XML parser, which does not fetch external entities. The sample is synthetic: an all-zero tenant ID, an `example.com` user and placeholder signature values.

<!-- help:end -->

## Implementation notes

- `src/tools/saml/lib/`: `decode.js` (encoding detection, with inflation capped at 4 MB), `parse.js` (the summary and findings, on `DOMParser`), `labels.js` (claim, NameID format, authentication context and algorithm names), `pretty.js` (re-indents the DOM into typed tokens, so the view is coloured without `innerHTML`), `sample.js` and `saml.js` (the combined entry point and the JSON the WebMCP tool returns).
- `pako` does the inflating; it was already a dependency of the share-link codec. No package was added.
- Tests are in `lib/saml.test.js` and run under jsdom for `DOMParser`.
- The WebMCP tool is `decode_saml`.
- The sample's certificate is the cert-decoder's own test leaf (`src/tools/cert-decoder/fixtures/leaf.pem`), so **Decode it** opens something real. Its signature and digest values are placeholders.
