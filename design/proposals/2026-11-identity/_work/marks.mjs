/**
 * The three marks, hand-written on a 24px grid. Every shape is a filled path,
 * so a mark needs no stroke attributes and scales without a stroke-width to
 * keep in step. `ink` shapes take the reading colour of the ground they sit
 * on; `lit` shapes take the accent.
 */
export const MARKS = {
  /**
   * Hex — a hex key and the bolt it turns. One bar, 3.5 wide, bent once on a
   * 5-unit centreline radius, both ends cut square: the key is also the "r".
   * The bolt is a flat-topped hexagon standing on the same baseline: the dot.
   */
  hex: {
    ink: ['M5 20.75V10.25A6.75 6.75 0 0 1 11.75 3.5h7.5V7h-7.5A3.25 3.25 0 0 0 8.5 10.25v10.5z'],
    lit: ['M11.75 17.5l1.875-3.25h3.75l1.875 3.25-1.875 3.25h-3.75z'],
  },
  /**
   * Block — one square divided the way a prefix divides: a half, a quarter,
   * an eighth and two sixteenths, separated by 2-unit gaps rather than drawn
   * lines. Only the outer corners are rounded. The quarter is lit: one block
   * picked out of the space.
   */
  block: {
    ink: [
      'M4.5 2H11v20H4.5A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2z',
      'M13 13h3.5v9H13z',
      'M18.5 13H22v3.5h-3.5z',
      'M18.5 18.5H22V20a2 2 0 0 1-2 2h-1.5z',
    ],
    lit: ['M13 2h6.5A2.5 2.5 0 0 1 22 4.5V11h-9z'],
  },
  /**
   * Ligature — r and t sharing one stroke. The r is a stem and a quarter
   * turn; its arm runs on as the crossbar of the t. Both letters are 2.5
   * wide with square-cut ends, and both bends use the 4-unit centreline
   * radius of the diagram connectors. The t is lit and sits over the bar.
   */
  ligature: {
    ink: ['M3.75 21.25V13A5.25 5.25 0 0 1 9 7.75h11v2.5H9A2.75 2.75 0 0 0 6.25 13v8.25z'],
    lit: ['M12.75 3.5h2.5V16A2.75 2.75 0 0 0 18 18.75h2v2.5h-2A5.25 5.25 0 0 1 12.75 16z'],
  },
};

/** How far the mark is scaled down inside the favicon tile. */
export const TILE = { scale: 0.8, shift: 2.4 };

/** The lit quarter of Block on paper: a mid blue that still clears 3:1 on white. */
export const BLOCK_LIT_LIGHT = '#3f86e0';

/**
 * Block redrawn on a 16px grid for the favicon: full bleed, 2px gaps between
 * the halves, 1px inside the last quarter, every edge on a pixel. The 24-grid
 * master puts its edges at thirds of a pixel at this size.
 */
export function block16(ink, lit) {
  return (
    `<path fill="${ink}" d="M1.5 0H7v16H1.5A1.5 1.5 0 0 1 0 14.500v-13A1.500 1.500 0 0 1 1.500 0zM9 9h3v7H9zM13 9h3v3h-3zM13 13h3v1.500a1.500 1.500 0 0 1-1.500 1.500H13z"/>` +
    `<path fill="${lit}" d="M9 0h5.500A1.500 1.500 0 0 1 16 1.500V7H9z"/>`
  ).replaceAll('.500', '.5');
}

/** Inner markup of a mark in two colours (or one, when lit === ink). */
export function markInner(id, ink, lit = ink) {
  const m = MARKS[id];
  const group = (paths, fill) => `<path fill="${fill}" d="${paths.join('')}"/>`;
  return ink === lit ? group([...m.ink, ...m.lit], ink) : group(m.ink, ink) + group(m.lit, lit);
}

/** The colours each mark takes on a light and a dark ground, from its palette. */
export function markColours(id, p) {
  const lightLit = { hex: p.light.primary, block: BLOCK_LIT_LIGHT, ligature: p.light.primary }[id];
  const lightInk = { hex: p.light['on-surface'], block: p.light.primary, ligature: p.light['on-surface'] }[id];
  return {
    light: { ink: lightInk, lit: lightLit, word: p.light['on-surface'] },
    dark: { ink: p.band['on-band'], lit: p.band['accent-bright'], word: p.band['on-band'] },
  };
}
