# Hash & HMAC Generator

Compute MD5 and SHA digests of text or a file in the browser, switch to HMAC with a key, and check the result against a digest you were given.

<!-- help:start -->

## Quick start

1. Type or paste text. The digests update as you type; there is no button to press.
2. To hash a file instead, drop it on the input panel or select **Choose a file**.
3. Copy any digest as hex or as Base64 with the button beside it.
4. To compute an HMAC, enter a key in **HMAC key**. Clear the key to go back to a plain hash.
5. To verify a download or a signature, paste the digest you were given into **Compare against**.

## Algorithms and output

- **SHA-256**, **SHA-384** and **SHA-512** are the SHA-2 family and are the ones to use for integrity checks and signatures.
- **SHA-1** is shown because older systems and Git still use it. It is no longer safe where an attacker could craft a collision.
- **MD5** is labelled **Not for security**. It is still common as a quick checksum, and that is all it should be used for.
- Every digest is shown twice: lower-case **hex**, and standard padded **Base64**. They are two spellings of the same bytes.
- Text is hashed as its UTF-8 bytes, exactly as typed, including any trailing newline or spaces. A file is hashed byte for byte.

## HMAC

- A non-empty key switches all five digests to HMAC (RFC 2104), and the result panel says so.
- The key is read as UTF-8 text. A key supplied as hex or Base64 has to be decoded first; this tool does not do that for you.
- HMAC-MD5 carries the same **Not for security** label as MD5.

## Compare against

- Paste a digest and the tool checks it against all five results, in both encodings, and names the one that matches.
- Hex is compared without regard to case, spaces or colons, so a fingerprint written `AB:CD:…` works.
- Base64 is accepted padded or unpadded, and in the URL-safe alphabet.
- A leading algorithm name such as `sha256:` or the `sha256-` of a Subresource Integrity value is ignored.
- When nothing matches, the tool says which algorithm the pasted value is the right length for, which usually tells you whether the input or the algorithm is wrong.

## Privacy and limits

Hashing happens in this browser tab. Text, files and keys are not uploaded, and nothing is saved. SHA and HMAC use the browser's WebCrypto; MD5 is computed by the page itself.

A file is read in 2 MB pieces so the page stays responsive, but WebCrypto needs the whole file at once, so files are limited to 512 MB. For anything larger use `sha256sum`, `shasum -a 256` or `Get-FileHash`.

Text placed in a deep link (`/hash/your-text`) is part of the URL and is visible in browser history and to anyone you send the link to. Do not put a secret there.

## Troubleshooting

- **The digest differs from the one a command line gave.** `echo` adds a newline; use `printf '%s' "text" | sha256sum` or `echo -n`. Check for a trailing space or a Windows line ending in the pasted text.
- **Compare says no match but the values look alike.** You may be comparing a plain hash with an HMAC, or the digest of a different file version. Check that the key field is as intended.
- **A large file fails.** Close memory-heavy tabs and try again, or use a command-line tool; the browser has to hold the whole file in memory.

<!-- help:end -->

The digest functions are in [`src/tools/hash/lib/hash.js`](../../../src/tools/hash/lib/hash.js) and the MD5 implementation in [`src/tools/hash/lib/md5.js`](../../../src/tools/hash/lib/md5.js), both covered by tests against published vectors and `node:crypto`. The tool contract is defined in [`src/tools/hash/manifest.mjs`](../../../src/tools/hash/manifest.mjs).
