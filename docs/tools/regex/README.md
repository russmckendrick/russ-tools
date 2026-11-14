# Regex Tester

Test a regular expression against sample text, with the matches highlighted where they are, every group listed with its position, a replace mode and a time limit that stops a runaway pattern.

<!-- help:start -->

## Quick start

1. Type a pattern into **Pattern**, without the surrounding slashes. The page opens on a sample so there is something to change.
2. Switch flags on and off with the buttons under it.
3. Edit **Test text**. Every match is highlighted in place as you type, and the line under the field gives the count.
4. Read **Matches** for each match, its groups and where each one starts and stops.
5. Open **Replace**, type a replacement and copy the result.
6. Use **Copy link** at the top of the page to share the pattern, flags, text and replacement.

## Which flavour this is

The pattern runs on your browser's own `RegExp`, so the flavour is **ECMAScript (JavaScript)**, in whatever version your browser implements.

It is not PCRE, .NET, Python, Go (RE2) or POSIX grep. A pattern that works here may need changes there, and the other way round. JavaScript has no possessive quantifiers (`a++`), atomic groups (`(?>...)`), conditionals, POSIX classes (`[[:alpha:]]`) or `\A` and `\Z` anchors. Named groups are written `(?<name>...)`.

## Flags

- **g global**: find every match. Without it the search stops at the first, and Replace changes only the first.
- **i ignore case**.
- **m multiline**: `^` and `$` match at each line break, not only at the ends of the text.
- **s dot all**: `.` also matches a line break.
- **u unicode** and **v unicode sets**: read the pattern as code points and allow `\p{...}`. They cannot be combined, so switching one on switches the other off.
- **y sticky**: match only at the current position.

## Matches and groups

Each match is a row, followed by one row per capturing group, numbered from 1 and carrying its name when it has one. A group that did not take part in a match says so.

A range is where the text starts and where it stops, counted from 0 in UTF-16 code units, which is how JavaScript counts. The end is not included, so `0-9` is nine characters. An emoji or other character outside the Basic Multilingual Plane counts as two.

Up to 2,000 matches are collected and the first 200 are listed. The count is always the full number.

## The time limit

Matching runs in a background worker, not on the page. If it has not finished after **1 second** the worker is stopped and the page says so, instead of the tab freezing.

A timeout nearly always means catastrophic backtracking: a repeated group whose contents can also repeat, such as `(a+)+` or `(\w+\s?)*`, facing text that almost matches. Rewrite the pattern so each character can only be matched one way.

## Pattern library

**Load a pattern** fills in a pattern, its flags and sample text holding good and bad examples one per line. Each pattern is anchored with `^` and `$` and uses the `m` flag, so a valid line is highlighted whole and an invalid one is not. Each one is tested against those samples.

- **IPv4 address**: four octets from 0 to 255, no leading zeros.
- **IPv6 address**: full and `::` compressed forms. No embedded IPv4 tail and no zone.
- **IPv4 CIDR block**: an address and a prefix from 0 to 32. Host bits are not checked.
- **MAC address**: colon, hyphen or Cisco dotted notation, with a consistent separator.
- **GUID / UUID**: hyphenated, with or without a matched pair of braces.
- **Fully qualified domain name**: ASCII labels of 1 to 63 characters, 253 in all. Write an internationalised name in its `xn--` form.
- **Email address**: the shape browsers accept in an email field, plus a required dot in the domain. It does not prove the mailbox exists.
- **ISO 8601 date**: a date, optionally with a time and an offset. It checks the shape, so `2026-02-31` passes.

To search inside longer text instead of testing whole lines, remove the `^` and `$`.

## Privacy and limits

The pattern and text never leave the browser, and nothing is saved to storage.

Once you change anything, the pattern, flags, text and replacement are written into the page address after the `#`, compressed. That part of an address is not sent to the server, but it is kept in browser history and it travels with the link when you share it. Do not test against text you would not put in a link. If the text is too long to carry, the address is left alone and **Copy link** is switched off.

The test text is limited to 100,000 characters.

## Troubleshooting

- **"The pattern does not compile".** The message is the browser's own. An unescaped `(`, `[` or `\` at the end is the usual cause.
- **Only one match.** The **g** flag is off.
- **`^` or `$` matches nothing in the middle.** Switch on **m**.
- **A flag is rejected.** **v** needs a recent browser. Switch it off.
- **The count says matches but nothing is highlighted.** The matches are empty, such as those of `x*` or a lookahead on its own.

<!-- help:end -->

Matching is in [`src/tools/regex/lib/regex.js`](../../../src/tools/regex/lib/regex.js), run through the worker in [`lib/regex.worker.js`](../../../src/tools/regex/lib/regex.worker.js) by [`lib/runner.js`](../../../src/tools/regex/lib/runner.js), which enforces the time limit by terminating the worker. The patterns and their samples are in [`lib/library.js`](../../../src/tools/regex/lib/library.js). Links use the share codec in `src/core/sharelink.js`, unchanged, carried in the fragment as `#config=`. The tool contract is defined in [`src/tools/regex/manifest.mjs`](../../../src/tools/regex/manifest.mjs).
