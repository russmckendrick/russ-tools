# Base64 Encoder/Decoder

Encode text or files as Base64 and decode Base64 back to text or image data without uploading the input.

<!-- help:start -->

## Quick start

1. Choose **Encode** or **Decode** with the mode switch.
2. Select Standard, URL-Safe, or MIME Base64.
3. Paste text, use the clipboard button, or drop one supported file up to 15 MB.
4. Select **Encode** or **Decode**.
5. Copy the result or download it as a file.

## Encoding modes and files

- **Standard Base64** uses the RFC 4648 alphabet with `+` and `/`.
- **URL-Safe Base64** replaces those characters with `-` and `_` for URLs and filenames.
- **MIME Base64** wraps encoded output with line breaks.
- Images can be previewed. Text and small files are read as text where appropriate; other files are handled as binary data.
- Base64-looking text is detected automatically and may switch the tool into Decode mode.

## Practical tips

- Base64 is an encoding, not encryption; anyone with the value can decode it.
- Use URL-Safe output when the value will be placed in a path, query string, cookie, or filename.
- Remove accidental surrounding whitespace if a value is rejected, and make sure it was not truncated in transit.
- Base64 increases data size by roughly one third. For large files, a normal binary transfer is usually more efficient.

## Privacy and limits

All conversion happens in the browser and the tool keeps no history or saved state. Files are limited to 15 MB because both the original and encoded forms must fit in browser memory. A value placed directly in a deep-link URL is visible in the URL and may be retained by browser history or anything you share it with.

## Troubleshooting

- An invalid Base64 error usually means the selected variant is wrong, the value is incomplete, or it contains non-Base64 characters.
- To decode an encoded image, paste or upload its Base64 text rather than uploading the original image while Decode mode is selected.
- If a large file fails, close memory-heavy tabs or use a smaller input.

<!-- help:end -->

The codec is implemented in [`src/tools/base64/lib/base64.js`](../../../src/tools/base64/lib/base64.js) and covered by its characterization tests. The tool contract is defined in [`src/tools/base64/manifest.mjs`](../../../src/tools/base64/manifest.mjs).
