export const CONTEXT = 3;
export const MAX_ROWS = 3000;
const MIN_GAP = 4;

function visibleEqual(block, index, total, context) {
  const { lines } = block;
  if (context === null) return [{ lines }];
  const first = index === 0;
  const last = index === total - 1;
  const head = first ? 0 : context;
  const tail = last ? 0 : context;
  if (lines.length < head + tail + MIN_GAP) return [{ lines }];
  const out = [];
  if (head > 0) out.push({ lines: lines.slice(0, head) });
  out.push({ gap: lines.length - head - tail });
  if (tail > 0) out.push({ lines: lines.slice(lines.length - tail) });
  return out;
}

function limit(rows) {
  if (rows.length <= MAX_ROWS) return { rows, hidden: 0 };
  return { rows: rows.slice(0, MAX_ROWS), hidden: rows.length - MAX_ROWS };
}

export function unifiedRows(result, context = CONTEXT) {
  const rows = [];
  result.blocks.forEach((block, index) => {
    if (block.type === 'equal') {
      for (const piece of visibleEqual(block, index, result.blocks.length, context)) {
        if (piece.gap) rows.push({ kind: 'gap', count: piece.gap });
        else for (const line of piece.lines) rows.push({ kind: 'equal', l: line.l, r: line.r, text: line.right });
      }
      return;
    }
    for (const line of block.removed) {
      rows.push({ kind: 'removed', l: line.l, r: null, text: line.text, parts: line.parts });
      if (line.eolNote) rows.push({ kind: 'note', side: 'removed' });
    }
    for (const line of block.added) {
      rows.push({ kind: 'added', l: null, r: line.r, text: line.text, parts: line.parts });
      if (line.eolNote) rows.push({ kind: 'note', side: 'added' });
    }
  });
  return limit(rows);
}

export function splitRows(result, context = CONTEXT) {
  const rows = [];
  result.blocks.forEach((block, index) => {
    if (block.type === 'equal') {
      for (const piece of visibleEqual(block, index, result.blocks.length, context)) {
        if (piece.gap) rows.push({ kind: 'gap', count: piece.gap });
        else {
          for (const line of piece.lines) {
            rows.push({
              kind: 'equal',
              left: { no: line.l, text: line.left },
              right: { no: line.r, text: line.right },
            });
          }
        }
      }
      return;
    }
    for (const { removed, added } of block.pairs) {
      rows.push({
        kind: 'change',
        left: removed ? { no: removed.l, text: removed.text, parts: removed.parts, noEol: removed.eolNote } : null,
        right: added ? { no: added.r, text: added.text, parts: added.parts, noEol: added.eolNote } : null,
      });
    }
  });
  return limit(rows);
}
