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

export { HELP_START, HELP_END };
