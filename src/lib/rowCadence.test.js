import { describe, expect, it } from 'vitest';
import { CADENCE, placements, rowPlan } from './rowCadence.js';

describe('rowPlan', () => {
  it('covers the catalogue exactly', () => {
    for (let n = 0; n <= 40; n += 1) {
      expect(rowPlan(n).reduce((a, b) => a + b, 0), `n=${n}`).toBe(n);
    }
  });

  it('never strands a tile on a row of its own', () => {
    for (let n = 2; n <= 40; n += 1) {
      expect(rowPlan(n), `n=${n}`).not.toContain(1);
    }
  });

  it('only ever asks for a row of two or three', () => {
    for (let n = 2; n <= 40; n += 1) {
      for (const size of rowPlan(n)) expect([2, 3], `n=${n}`).toContain(size);
    }
  });

  it('punctuates rather than blocks — the eighteen break 3,2,3,3,2,3,2', () => {
    expect(rowPlan(18)).toEqual([3, 2, 3, 3, 2, 3, 2]);
  });

  it('reads a filtered run as its own cadence, not a slice of the long one', () => {
    // Three Security tools are one flush row of thirds; seven Microsoft and
    // Azure tools are a row of thirds and two rows of halves.
    expect(rowPlan(3)).toEqual([3]);
    expect(rowPlan(7)).toEqual([3, 2, 2]);
    expect(rowPlan(1)).toEqual([1]);
  });

  it('starts on the widest step so the catalogue opens on a full row', () => {
    expect(CADENCE[0]).toBe(3);
  });
});

describe('placements', () => {
  it('gives every tile a step and a position', () => {
    const p = placements(18);
    expect(p).toHaveLength(18);
    expect(p[0]).toEqual({ span: 'third', row: 0, col: 0 });
    expect(p[3]).toEqual({ span: 'half', row: 1, col: 0 });
    expect(p[4]).toEqual({ span: 'half', row: 1, col: 1 });
    expect(p.at(-1)).toEqual({ span: 'half', row: 6, col: 1 });
  });

  it('spans agree with the row that produced them', () => {
    let i = 0;
    for (const size of rowPlan(23)) {
      for (let col = 0; col < size; col += 1, i += 1) {
        expect(placements(23)[i].span).toBe(size === 2 ? 'half' : 'third');
      }
    }
  });
});
