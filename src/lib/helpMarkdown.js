const HELP_START = '<!-- help:start -->';
const HELP_END = '<!-- help:end -->';

export function extractHelpMarkdown(source) {
  const start = source.indexOf(HELP_START);
  const end = source.indexOf(HELP_END);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Help documentation must contain a valid help:start/help:end block');
  }

  return source.slice(start + HELP_START.length, end).trim();
}

/**
 * The anchor id for a help section heading. One function, used by both the
 * help page's jump chips and the rendered headings, so a chip cannot point at
 * an anchor the article does not render.
 *
 * @param {string} title
 */
export function helpHeadingId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The `## ` section headings of a help block, in document order.
 *
 * @param {string} markdown
 * @returns {{ id: string, title: string }[]}
 */
export function helpHeadings(markdown) {
  return [...markdown.matchAll(/^## +(.+?)\s*$/gm)].map((m) => ({
    id: helpHeadingId(m[1]),
    title: m[1],
  }));
}

export { HELP_START, HELP_END };
