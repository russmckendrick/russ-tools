# Timestamp Converter

Convert a Unix timestamp or an ISO 8601 date into every common notation, in any time zone, with a live clock for the current moment.

<!-- help:start -->

## Quick start

1. Paste a Unix timestamp or a date into **Timestamp or date**. The result updates as you type.
2. Read the line under the field: it says how the value was read, for example "10 digits: read as seconds".
3. Pick a **Time zone** to see the local time somewhere else. It starts on this device's zone.
4. Copy any row of the result with the button beside it.
5. With the field empty the result follows the clock. **Convert this moment** freezes the current second into the field.

## What it reads

- **Epoch seconds**, such as `1794651210`, including a decimal fraction and negative values for dates before 1970.
- **Epoch milliseconds**, such as `1794651210123`.
- Microseconds (15 to 17 digits) and nanoseconds (18 or more) are recognised and reduced to milliseconds.
- **ISO 8601**, such as `2026-11-14T10:13:30Z`, `2026-11-14T15:43:30+05:30` or `2026-11-14`.
- **RFC 2822**, such as `Sat, 14 Nov 2026 10:13:30 +0000`.

## Seconds or milliseconds

A bare number does not say which unit it is in, so the tool decides by size: up to 11 digits is seconds, 12 to 14 is milliseconds. That is right for any date from 1973 onwards. The note under the field always says which was assumed.

If the guess is wrong, for example a millisecond value from the first weeks of 1970, set **Number is in** to **Seconds** or **Milliseconds** to override it.

## Time zones

- The zone list is the browser's own IANA database, grouped by region, with this device's zone and UTC first.
- **Local time**, **ISO 8601 with offset** and **RFC 2822** are written in the chosen zone, using the offset in force on that date, so daylight saving is handled.
- An ISO 8601 value with no offset, or a date with no time, is read as a time in the chosen zone, and the note says so. A value with `Z` or a numeric offset names an exact instant and ignores the zone when read.

## Privacy and limits

Everything is calculated in this browser tab. Nothing is sent anywhere or saved.

Results are precise to the millisecond; finer detail in a microsecond or nanosecond value is dropped. The range is that of a JavaScript date, roughly 271,821 BC to AD 275,760. Leap seconds are not represented, as in Unix time itself.

A value placed in a deep link (`/timestamp/1794651210`) is part of the URL and is kept in browser history.

## Troubleshooting

- **The date is in 1970.** A seconds value was read as milliseconds, or a real millisecond value is very small. Set the unit by hand.
- **The date is tens of thousands of years away.** A millisecond value was forced to seconds. Set the unit back to **Detect from size**.
- **The local time is an hour out.** Check the chosen zone, and whether the value had its own offset. An offset in the value always wins.
- **"Not an epoch value or a date this can read".** Free-form dates such as "next Tuesday" or `14/11/2026` are not accepted because they are ambiguous. Use ISO 8601.

<!-- help:end -->

Parsing and formatting are in [`src/tools/timestamp/lib/timestamp.js`](../../../src/tools/timestamp/lib/timestamp.js), which uses `Intl` for time zones and `date-fns` for ISO 8601 parsing and relative time. The tool contract is defined in [`src/tools/timestamp/manifest.mjs`](../../../src/tools/timestamp/manifest.mjs).
