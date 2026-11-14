export const DEFAULT_BUDGET = 1500;
const OVER_BUDGET = Symbol('over budget');

function bisect(a, aLo, aHi, b, bLo, bHi, budget) {
  const n = aHi - aLo;
  const m = bHi - bLo;
  const maxD = Math.ceil((n + m) / 2);
  const offset = maxD;
  const size = 2 * maxD + 2;
  const forward = new Int32Array(size).fill(-1);
  const backward = new Int32Array(size).fill(-1);
  forward[offset + 1] = 0;
  backward[offset + 1] = 0;
  const delta = n - m;
  const front = delta % 2 !== 0;
  let fStart = 0;
  let fEnd = 0;
  let bStart = 0;
  let bEnd = 0;

  for (let d = 0; d < maxD; d++) {
    if (d > budget) return OVER_BUDGET;

    for (let k = -d + fStart; k <= d - fEnd; k += 2) {
      const at = offset + k;
      let x = k === -d || (k !== d && forward[at - 1] < forward[at + 1]) ? forward[at + 1] : forward[at - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[aLo + x] === b[bLo + y]) {
        x += 1;
        y += 1;
      }
      forward[at] = x;
      if (x > n) fEnd += 2;
      else if (y > m) fStart += 2;
      else if (front) {
        const mirror = offset + delta - k;
        if (mirror >= 0 && mirror < size && backward[mirror] !== -1 && x >= n - backward[mirror]) {
          return { x: aLo + x, y: bLo + y };
        }
      }
    }

    for (let k = -d + bStart; k <= d - bEnd; k += 2) {
      const at = offset + k;
      let x = k === -d || (k !== d && backward[at - 1] < backward[at + 1]) ? backward[at + 1] : backward[at - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[aHi - x - 1] === b[bHi - y - 1]) {
        x += 1;
        y += 1;
      }
      backward[at] = x;
      if (x > n) bEnd += 2;
      else if (y > m) bStart += 2;
      else if (!front) {
        const mirror = offset + delta - k;
        if (mirror >= 0 && mirror < size && forward[mirror] !== -1) {
          const fx = forward[mirror];
          const fy = offset + fx - mirror;
          if (fx >= n - x) return { x: aLo + fx, y: bLo + fy };
        }
      }
    }
  }
  return null;
}

export function diffIds(a, b, budget = DEFAULT_BUDGET) {
  const blocks = [];
  let approximate = false;

  const push = (equal, aStart, aEnd, bStart, bEnd) => {
    if (aStart === aEnd && bStart === bEnd) return;
    const last = blocks[blocks.length - 1];
    if (last && last.equal === equal) {
      last.aEnd = aEnd;
      last.bEnd = bEnd;
    } else {
      blocks.push({ equal, aStart, aEnd, bStart, bEnd });
    }
  };

  const walk = (aLo, aHi, bLo, bHi) => {
    let aFrom = aLo;
    let bFrom = bLo;
    while (aFrom < aHi && bFrom < bHi && a[aFrom] === b[bFrom]) {
      aFrom += 1;
      bFrom += 1;
    }
    let aTo = aHi;
    let bTo = bHi;
    while (aTo > aFrom && bTo > bFrom && a[aTo - 1] === b[bTo - 1]) {
      aTo -= 1;
      bTo -= 1;
    }
    push(true, aLo, aFrom, bLo, bFrom);

    if (aFrom === aTo || bFrom === bTo) {
      push(false, aFrom, aTo, bFrom, bTo);
    } else {
      const split = bisect(a, aFrom, aTo, b, bFrom, bTo, budget);
      const corner =
        split !== null &&
        split !== OVER_BUDGET &&
        ((split.x === aFrom && split.y === bFrom) || (split.x === aTo && split.y === bTo));
      if (split === null || split === OVER_BUDGET || corner) {
        if (split !== null) approximate = true;
        push(false, aFrom, aTo, bFrom, bTo);
      } else {
        walk(aFrom, split.x, bFrom, split.y);
        walk(split.x, aTo, split.y, bTo);
      }
    }

    push(true, aTo, aHi, bTo, bHi);
  };

  walk(0, a.length, 0, b.length);
  return { blocks, approximate };
}

export function editDistance(blocks) {
  let distance = 0;
  for (const block of blocks) {
    if (!block.equal) distance += block.aEnd - block.aStart + (block.bEnd - block.bStart);
  }
  return distance;
}
