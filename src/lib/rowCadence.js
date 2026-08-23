/**
 * The index's row cadence — what decides how wide a tool tile is.
 *
 * The stream used to pick a tile's width from its own text length (three px
 * steps, 235/315/400). Two things went wrong with that, and both are visible
 * at 1440px:
 *
 *   1. It is not a cadence, it is a coincidence. All seven Microsoft and
 *      Azure tools carry long titles, so all seven hit the widest step at
 *      once and the "stream" collapsed into 3 / 2 / 2 / 2 / 3 / 3 / 3 — a
 *      solid block of one shape in the middle of the page.
 *   2. Rows did not flush. A 2-up row of capped 500px tiles stopped 124px
 *      short of the right edge, so three consecutive rows read as a narrower
 *      table indented inside the catalogue.
 *
 * The width is authored here instead, and it is a *ratio* rather than a pixel
 * count: a row of three thirds or a row of two halves, both of which add up
 * to exactly 100% of the stream. Mixed rows are impossible by construction,
 * so every row flushes to both edges at every width and in every filter
 * state.
 *
 * The pattern repeats [3, 2, 3, 3, 2] so the wide rows land as punctuation
 * rather than as a block, and a wide tile earns its width by carrying the
 * tool's badge terms (see `ToolCard.astro`) rather than by stretching one
 * sentence across 500px.
 *
 * `placements` runs twice over the same list: once in `index.astro` for the
 * prerendered eighteen, and once per filter in the index's client script, so
 * that three Security tools are three thirds rather than the middle of a
 * cadence written for eighteen.
 */

export const CADENCE = [3, 2, 3, 3, 2];

/**
 * Row sizes covering `n` tiles, summing to exactly `n`.
 * Only the last row may fall short of its cadence step, and it is never left
 * holding one tile — an orphan row is folded back into its neighbour.
 */
export function rowPlan(n) {
  if (n <= 0) return [];

  const rows = [];
  let left = n;
  for (let i = 0; left > 0; i += 1) {
    const size = Math.min(CADENCE[i % CADENCE.length], left);
    rows.push(size);
    left -= size;
  }

  if (rows.length > 1 && rows.at(-1) === 1) {
    rows.pop();
    // 2 + 1 becomes one row of three; 3 + 1 becomes two rows of two. Both
    // preserve the total, and neither leaves a tile stranded on its own row.
    const previous = rows.pop();
    if (previous === 2) rows.push(3);
    else rows.push(2, 2);
  }

  return rows;
}

/**
 * One entry per tile: the width step it takes and where it sits, which is
 * what the diagonal deal-in reads.
 */
export function placements(n) {
  const out = [];
  rowPlan(n).forEach((size, row) => {
    for (let col = 0; col < size; col += 1) {
      out.push({ span: size === 2 ? 'half' : 'third', row, col });
    }
  });
  return out;
}
