# Certificate & CSR Decoder

Read an X.509 certificate, a full chain or a PKCS#10 signing request you already hold. Everything is decoded in the browser: the SSL Checker inspects a live public host, and this tool reads the file on your desk.

<!-- help:start -->

## Quick start

1. Paste one or more PEM blocks, or drop a `.pem`, `.crt`, `.cer`, `.der` or `.csr` file onto the text box. **Load sample** fills in a three-certificate chain to try.
2. Read each certificate: subject, issuer, alternative names, validity, key, signature algorithm, usages, fingerprints and revocation URLs.
3. For more than one certificate, check the chain panel: the certificates are ordered leaf to root, drawn as a tree, and any broken link or expiry is listed beneath it.
4. Use **Copy PEM** to lift one certificate out of a bundle, or **Copy as JSON** for the whole decode.

## What is decoded

- **Certificates** (`-----BEGIN CERTIFICATE-----`): subject and issuer distinguished names, subject alternative names (DNS, IP, email, URI, directory and UPN forms), serial number, validity, public key algorithm and size, signature algorithm, key usage, extended key usage, basic constraints, subject and authority key identifiers, SHA-1 and SHA-256 fingerprints, and the OCSP, CA issuer and CRL URLs. Any other extension is listed by name with its critical flag.
- **Signing requests** (`-----BEGIN CERTIFICATE REQUEST-----`): subject, requested alternative names, public key, signature algorithm, and any requested key usage.
- **Bare base64 or a binary DER file** is accepted too, and read as whichever of the two it turns out to be.

Distinguished names are shown in the order they are encoded, which is the order `openssl x509 -text` prints. Fingerprints are of the DER bytes, matching `openssl x509 -fingerprint`.

## Chain checks

The certificates are sorted by following each issuer name to the matching subject, so a bundle pasted root first still reads leaf to root. The panel then reports:

- **A broken link**: a certificate whose issuer is not the subject of the next one, or whose authority key identifier is not that certificate's subject key identifier. The second case is usually an old or cross-signed copy of the issuing CA with the same name.
- **Expiry**: anything expired, not yet valid, or within 30 days of its end date.
- **Order**: a bundle that is not leaf first. A server has to send the leaf, then each issuer in turn.
- **A missing root**: noted, not flagged. Servers normally leave the root out and the client supplies it from its trust store.
- **Weak material**: an MD5 or SHA-1 signature, or an RSA key under 2048 bits.

## Limits

Links are matched by name and key identifier. **Signatures are not verified**, the chain is not checked against any trust store, and no OCSP or CRL lookup is made, so this tool cannot tell you that a certificate is trusted or unrevoked. Use the SSL Checker for what a live host actually serves. Trusted-certificate blocks, PKCS#7 bundles and PKCS#12 files are not read; convert them to PEM first.

## Privacy and saved data

Nothing is uploaded and nothing is saved to localStorage. A private key block is never decoded: it is skipped with a warning, and its contents are dropped as soon as the block is recognised. When the paste box on the home page sends a certificate here it travels in the URL fragment (the part after `#`), which the browser does not send to the server.

<!-- help:end -->

## Implementation notes

- Parsing lives in `src/tools/cert-decoder/lib/`: `pem.js` (dependency-free, shared with the home-page paste dispatcher), `x509.js` (decoding, on `@peculiar/asn1-schema`, `@peculiar/asn1-x509` and `@peculiar/asn1-csr`), `chain.js` (ordering and findings) and `decode.js` (the combined entry point and the JSON shape the WebMCP tool returns).
- The fixtures in `src/tools/cert-decoder/fixtures/` were made by `generate.sh` beside them. Private keys are written to a temporary directory and discarded. Regenerating changes every serial, date and fingerprint, so the expectations in `lib/x509.test.js` and `lib/chain.test.js` have to be re-read from `openssl x509 -text` afterwards. `chain.pem` is also the page's **Load sample**; its leaf is valid until November 2036.
- The WebMCP tool is `decode_certificate`.
