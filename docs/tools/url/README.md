# URL Parser & Encoder

Split a URL into its parts, edit any of them and get the URL rebuilt, with checks for the mistakes URLs commonly carry. A second mode percent-encodes and decodes text and converts internationalised hostnames.

<!-- help:start -->

## Quick start

1. Paste a URL into **URL** on the **Parse** tab. The parts appear underneath, decoded.
2. Edit a part: the scheme, host, port, path, any query parameter or the fragment. The URL in the field above is rebuilt as you type.
3. Use **Add parameter** or the remove button on a row to change the query string.
4. Read **Checks** for anything commonly wrong with the URL.
5. Use **Copy URL** on the parts panel, or the copy buttons under **Other forms**.
6. To encode or decode a piece of text rather than a whole URL, switch to **Encode and decode**.

## What the parts show

- **Scheme**, **Host** and **Port** are shown as written.
- **User name** and **Password** appear only when the URL has them.
- **Path** is decoded, with one exception: an escaped slash, question mark, hash or percent sign (`%2F`, `%3F`, `%23`, `%25`) stays escaped, because decoding it would change where the path ends.
- **Query parameters** are one row each, name and value fully decoded. A `+` is read as a space when the query uses one, which is the form-encoding rule servers apply.
- **Fragment** is everything after `#`, decoded.

Only the part you edit is re-encoded. The rest of the URL is left exactly as you pasted it, so an unusual but valid spelling elsewhere is not rewritten.

## Checks

Each finding is marked **Check** (likely a mistake or a risk) or **Note** (worth knowing).

- **Credentials in the URL.** A user name or password before the host. The check names the real host, because a long user part is a common way to disguise one.
- **Parameters named like secrets.** Names such as `token`, `access_token`, `api_key`, `sig`, `password` or `code`, in the query or in an OAuth-style fragment. This is matched **by name only**. The values are not inspected, so a harmless `code` is flagged and a secret under an unusual name is not.
- **Double-encoding.** An escape such as `%2520`, which decodes to the text `%20` rather than a space.
- **Characters that must be encoded.** A space, `<`, `>`, `"` and similar written as they are.
- **A stray `%`**, and escapes that are not valid UTF-8.
- **An unencoded URL inside a value**, where the inner URL's own `&` has leaked into the outer query.
- Notes for square brackets, characters outside ASCII, `+` read as a space, repeated names, a default port and an internationalised hostname.

These checks read the text of the URL. They do not open it, and they do not say whether the site it points to is safe.

## Encode and decode

Type or paste text and both directions are shown at once.

- **encodeURIComponent** is for one value: a query parameter or a single path segment. It escapes `/ ? & = #`.
- **encodeURI** is for a whole URL. It leaves the separators in place.
- **Form encoding** is encodeURIComponent with a space written as `+`.
- The three decoded rows are the reverse of each. If the text has a broken escape, it is decoded as far as it can be and the panel says what was wrong.

A hostname with letters outside ASCII, such as `münchen.de`, also gets its **punycode** form (`xn--mnchen-3ya.de`), and a name starting `xn--` gets its Unicode form.

## Privacy and limits

Everything is worked out in this browser tab. Nothing is sent anywhere or saved, and the URL you paste is never requested.

A deep link of the form `/url/<encoded URL>` puts the URL in the page address, so it reaches the web server's request log like any other page address and is kept in browser history. The paste panel on the home page uses `/url#url=<encoded URL>` instead: a fragment is not sent to the server. Use that form for anything sensitive.

The limit is 100,000 characters. Any scheme is read, including ones with no host such as `mailto:`.

## Troubleshooting

- **"No scheme".** The text starts with a host. Use **Read it with https://** or type the scheme.
- **"This browser's own URL parser rejects it".** The parts are still shown as a best reading. A space in the host or an impossible port are the usual causes.
- **The rebuilt URL differs from "As a browser sends it".** A browser lower-cases the scheme and host, drops a default port and encodes anything not already encoded. Both forms point to the same place.
- **A `+` became `%2B`.** You typed a literal plus into a value. In a query a bare `+` means a space, so a real plus has to be escaped.

<!-- help:end -->

Splitting, rebuilding and the checks are in [`src/tools/url/lib/url.js`](../../../src/tools/url/lib/url.js); percent-encoding helpers in [`lib/encoding.js`](../../../src/tools/url/lib/encoding.js); the punycode decoder (RFC 3492) in [`lib/punycode.js`](../../../src/tools/url/lib/punycode.js), which leaves encoding to the platform's `URL`. The tool contract is defined in [`src/tools/url/manifest.mjs`](../../../src/tools/url/manifest.mjs).
