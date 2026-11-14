# UUID / GUID Generator

Generate version 4 and version 7 UUIDs in bulk, format them the way your system expects, and decode a UUID you already have.

<!-- help:start -->

## Quick start

1. The page opens with one version 4 UUID already generated. Copy it with the button beside it.
2. Choose **Version 4** or **Version 7**, and set **How many** to anything from 1 to 500.
3. Switch on **Uppercase**, **Braces** or **No hyphens** to match the format you need. These restyle the list without changing the values.
4. Select **Regenerate** for a fresh batch, **Copy all** for the whole list, or **Download** for a text file with one UUID per line.
5. To inspect an existing UUID, open the **Decode** tab and paste it.

## Versions

- **Version 4** is 122 random bits from the browser's cryptographic random source. Use it when you only need uniqueness.
- **Version 7** starts with a 48-bit Unix timestamp in milliseconds, followed by random bits. Values sort in the order they were made, which keeps database indexes compact. A batch generated here is strictly ascending, even within one millisecond.
- A version 7 UUID reveals when it was created. Use version 4 if that matters.
- "GUID" is Microsoft's name for the same 128-bit identifier. The **Braces** and **Uppercase** options produce the registry style, `{XXXXXXXX-XXXX-…}`.

## Decoding

- The decoder accepts hyphenated, bare 32-digit hex, braced, parenthesised and `urn:uuid:` forms, in either case.
- It reports the **version** (1 to 8) and the **variant**, which says which specification laid out the bits. Almost every UUID in use is the RFC 9562 variant.
- For versions 1, 6 and 7 it shows the embedded **timestamp**, with a link to the Timestamp Converter.
- For versions 1 and 6 it also shows the clock sequence and the node, and says whether the node is a hardware address or a random one.
- The nil UUID (all zeros) and the max UUID (all ones) are named as such.
- It also lists the same UUID in canonical, uppercase, braced, no-hyphen and URN forms, each with a copy button.

## Privacy and limits

UUIDs are generated in this browser tab and are not sent anywhere or saved. Decoding is a local calculation too.

A UUID placed in a deep link (`/uuid/your-uuid`) is part of the URL, so it is kept in browser history and visible to anyone you share the link with.

The limit of 500 per batch is there to keep the page quick; regenerate for more.

## Troubleshooting

- **"Not a UUID".** The value needs exactly 32 hex digits. Check for a missing character, a letter outside `a` to `f`, or text copied along with it.
- **The version says none.** The UUID uses a variant other than RFC 9562, so the version field has no defined meaning. This is common for identifiers that only look like UUIDs.
- **A version 1 timestamp looks wrong.** Some systems write random bits where the timestamp should be while still marking the value as version 1. The decoder reports what the bits say.

<!-- help:end -->

Generation and decoding are in [`src/tools/uuid/lib/uuid.js`](../../../src/tools/uuid/lib/uuid.js), tested against the examples in RFC 9562. The tool contract is defined in [`src/tools/uuid/manifest.mjs`](../../../src/tools/uuid/manifest.mjs).
