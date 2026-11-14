# Text Diff

Compare two pieces of text line by line, with the changed words marked inside each changed line. Built for configuration files, JSON and command output.

<!-- help:start -->

## Quick start

1. Paste the earlier text into **Original** and the later text into **Changed**. The page opens on a sample so the result is never empty.
2. Read **Differences**. Removed lines are marked `-`, added lines `+`, and the words that changed inside a line are highlighted.
3. On a wide screen, switch between **Unified** and **Side by side**.
4. Use the switches to ignore whitespace or case.
5. Use **Copy as unified diff** to take the result away.

## Reading the result

- The two numbers in the header are the lines added and the lines removed.
- In the unified view the two columns of numbers are the line in the original and the line in the changed text.
- When a removed line and an added line are similar, only the words that differ are highlighted. When they have little in common the whole line is marked instead, because speckled highlighting is harder to read than none.
- **Collapse unchanged lines** keeps three lines round each change and replaces the rest with a count. Switch it off to see every line.
- "No newline at end of file" appears when one text ends with a line break and the other does not, since that is a real difference in a file.

On a phone the side-by-side view is not offered: two columns of code do not fit, so the result is always unified.

## Options

- **Ignore whitespace** treats lines as equal when they differ only in indentation, trailing space or the width of the gaps between words. It does not ignore a space added where there was none.
- **Ignore case** compares letters without regard to case.
- **Normalise JSON before diffing** appears only when both sides parse as JSON. Both are re-written with their keys sorted and a two-space indent, so reordered keys and reformatting stop showing as changes and only real ones remain. The line numbers are then those of the normalised text. Array order is kept, because it is significant.

Line endings are not compared: a file with Windows (CRLF) endings and the same file with Unix endings are identical here, and the result says when the two sides differ in this way.

## Copy as unified diff

The copy is in the standard unified format, with three lines of context, headed `--- original` and `+++ changed`. `patch` and `git apply` read it. It always holds the whole diff, including lines the page has collapsed or not drawn.

With **Ignore whitespace** or **Ignore case** on, the copy reflects that comparison, so it may not apply cleanly to the real file.

## Privacy and limits

Both texts stay in this browser tab. Nothing is sent anywhere, nothing is saved, and nothing is put in the page address.

- Each side is limited to 1,000,000 characters and 20,000 lines. Past that the tool says so and compares nothing, instead of hanging.
- The diff is the shortest possible (the Myers algorithm) unless the two texts are very different, when the search is cut short. The result is still correct, but a changed region may be larger than it needs to be, and the page says when that happened.
- At most 3,000 rows are drawn. The copy still holds everything.
- Normalising JSON goes through the browser's JSON parser, so numbers are re-written: `1.0` becomes `1` and an integer beyond 2^53 loses precision.

## Troubleshooting

- **Every line is marked as changed.** The indentation differs. Switch on **Ignore whitespace**.
- **Two JSON documents look entirely different.** Their keys are in a different order. Switch on **Normalise JSON before diffing**.
- **The JSON option is missing.** One side does not parse as a JSON object or array. A trailing comma or a comment is the usual cause.
- **The last line is marked although it reads the same.** One side ends with a line break and the other does not.

<!-- help:end -->

The Myers algorithm (the linear-space, middle-snake form) is in [`src/tools/diff/lib/myers.js`](../../../src/tools/diff/lib/myers.js) and has no dependency. Line and word comparison and JSON normalising are in [`lib/diff.js`](../../../src/tools/diff/lib/diff.js), the rows for the two views in [`lib/rows.js`](../../../src/tools/diff/lib/rows.js) and the unified writer in [`lib/unified.js`](../../../src/tools/diff/lib/unified.js). The tool contract is defined in [`src/tools/diff/manifest.mjs`](../../../src/tools/diff/manifest.mjs).
