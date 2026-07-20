# Buzzword Ipsum

Generate intentionally meaningless corporate filler for mockups, presentations, demos, and the occasional strategy deck in distress.

<!-- help:start -->

## Quick start

1. Choose Phrases, Sentences, or Paragraphs.
2. Set the quantity from 1 to 20.
3. For sentences or paragraphs, choose a short, medium, or long sentence length.
4. Select **Generate Text**.
5. Edit the generated text if needed, then copy or download it.

## Output formats

- **Phrases** produce compact combinations suitable for labels and short placeholders.
- **Sentences** add capitalization and punctuation around a generated phrase.
- **Paragraphs** combine several sentences into longer blocks for realistic layouts.
- The output card reports word and character counts so you can judge how it will fit.
- **API Usage** documents the separate hosted API for applications that need generated terms programmatically.

## Useful tips

- Generate more than you need, then trim the output to the exact shape of the design.
- Use phrases for navigation or cards, sentences for short copy, and paragraphs for body layouts.
- The text is designed to sound plausible rather than communicate facts; do not publish it as real guidance.
- Regenerating replaces the current output, so copy or download anything you want to keep first.

## Privacy and saved data

Generation in this page happens locally from the bundled word lists. The tool stores no generated text or preferences. Calling the optional hosted API is a separate network action governed by the API information shown in the tool.

## Troubleshooting

- Sentence length is intentionally disabled for Phrases because that format has a fixed compact structure.
- Quantity is clamped to the supported range of 1–20.
- If clipboard or download actions are blocked, check the browser's site permissions and try the visible text selection as a fallback.

<!-- help:end -->

The phrase corpus is bundled in [`src/tools/buzzword-ipsum/data/buzzwords.json`](../../../src/tools/buzzword-ipsum/data/buzzwords.json). The tool contract is defined in [`src/tools/buzzword-ipsum/manifest.mjs`](../../../src/tools/buzzword-ipsum/manifest.mjs).
