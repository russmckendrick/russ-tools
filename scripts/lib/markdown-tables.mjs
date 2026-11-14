/**
 * Pipe tables out of Microsoft Learn markdown, for the refresh scripts.
 *
 * The reference articles these scripts read are prose with tables in them, not
 * data files, so every one needs the same three things: find the tables, split
 * the rows without being fooled by an escaped pipe, and strip the cell down to
 * the text a reader sees. Kept here so a fix to any of them reaches every
 * dataset that is scraped this way.
 */

/** @param {string} line */
function splitRow(line) {
  const body = line.trim().replace(/^\|/, '').replace(/\|\s*$/, '');
  const cells = [];
  let cell = '';
  for (let i = 0; i < body.length; i += 1) {
    if (body[i] === '\\' && body[i + 1] === '|') {
      cell += '|';
      i += 1;
    } else if (body[i] === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += body[i];
    }
  }
  cells.push(cell.trim());
  return cells;
}

/**
 * Every pipe table in a document, in order, as raw (uncleaned) cells.
 *
 * A leading `>` is dropped first: Learn wraps wide tables in a blockquote so
 * they scroll, and the Entra role table is one of them.
 *
 * @param {string} markdown
 * @returns {Array<{ header: string[], rows: string[][], line: number }>}
 */
export function parseTables(markdown) {
  const lines = markdown.split(/\r?\n/).map((line) => line.replace(/^\s*>\s?/, ''));
  const tables = [];
  let i = 0;

  while (i < lines.length) {
    const isRow = lines[i].trim().startsWith('|');
    const isRule = /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] ?? '');
    if (!isRow || !isRule) {
      i += 1;
      continue;
    }

    const table = { header: splitRow(lines[i]), rows: [], line: i + 1 };
    i += 2;
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      table.rows.push(splitRow(lines[i]));
      i += 1;
    }
    tables.push(table);
  }

  return tables;
}

/**
 * A cell as a reader sees it: no images, footnote markers, link targets,
 * emphasis or HTML, and `<br>` as a space.
 *
 * @param {string} cell
 */
export function cleanCell(cell) {
  return (cell ?? '')
    .replace(/\[?!\[[^\]]*\]\([^)]*\)(?:\]\([^)]*\))?/g, ' ')
    .replace(/:::image[\s\S]*?:::/g, ' ')
    .replace(/<sup>[\s\S]*?<\/sup>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|`/g, '')
    .replace(/&nbsp;| /g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The first number in a cell, with thousands separators removed. `N/A`, a
 * dash and an empty cell are all "not published", which is `null` and not 0.
 *
 * @param {string} cell
 * @returns {number | null}
 */
export function cellNumber(cell) {
  const match = /-?\d[\d,]*(?:\.\d+)?/.exec(cleanCell(cell));
  return match ? Number(match[0].replace(/,/g, '')) : null;
}

/**
 * Fetch text, failing loudly: a refresh that swallows a 404 writes a smaller
 * dataset and calls it current.
 *
 * @param {string} url
 * @param {Record<string, string>} [headers]
 */
export async function fetchText(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

/**
 * Run `task` over `items` a few at a time. The VM size reference is some two
 * hundred articles; serial is slow and all-at-once is rude.
 *
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<R>} task
 * @returns {Promise<R[]>}
 */
export async function mapLimit(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * JSON with one array element per line for the arrays named in `rowKeys`, so
 * a refresh that changes one record is a one-line diff rather than a rewrite
 * of a minified blob or a twelve-thousand-line pretty print.
 *
 * @param {Record<string, unknown>} data
 * @param {string[]} rowKeys
 */
export function stringifyRows(data, rowKeys) {
  const parts = Object.entries(data).map(([key, value]) => {
    if (rowKeys.includes(key) && Array.isArray(value)) {
      const rows = value.map((row) => `    ${JSON.stringify(row)}`).join(',\n');
      return `  ${JSON.stringify(key)}: [\n${rows}\n  ]`;
    }
    return `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`;
  });
  return `{\n${parts.join(',\n')}\n}\n`;
}

/** A Learn article without its YAML front matter, whose `#` lines are not headings. */
export function stripFrontMatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}
