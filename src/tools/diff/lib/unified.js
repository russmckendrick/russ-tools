const NO_EOL = '\\ No newline at end of file';

function flatten(result) {
  const lines = [];
  const lastLeft = result.left.count;
  const lastRight = result.right.count;
  for (const block of result.blocks) {
    if (block.type === 'equal') {
      for (const line of block.lines) {
        lines.push({
          op: ' ',
          text: line.left,
          l: line.l,
          r: line.r,
          noEol: !result.left.eol && line.l === lastLeft && line.r === lastRight,
        });
      }
    } else {
      for (const line of block.removed) lines.push({ op: '-', text: line.text, l: line.l, noEol: line.noEol });
      for (const line of block.added) lines.push({ op: '+', text: line.text, r: line.r, noEol: line.noEol });
    }
  }
  return lines;
}

const span = (start, count) => (count === 1 ? `${start}` : `${count === 0 ? start - 1 : start},${count}`);

export function toUnified(result, { context = 3, leftName = 'original', rightName = 'changed' } = {}) {
  if (!result.ok || result.identical) return '';
  const lines = flatten(result);
  const changed = lines.map((line, index) => (line.op === ' ' ? -1 : index)).filter((index) => index !== -1);

  const hunks = [];
  for (const index of changed) {
    const from = Math.max(0, index - context);
    const to = Math.min(lines.length - 1, index + context);
    const last = hunks[hunks.length - 1];
    if (last && from <= last.to + 1) last.to = to;
    else hunks.push({ from, to });
  }

  const out = [`--- ${leftName}`, `+++ ${rightName}`];
  let leftSeen = 0;
  let rightSeen = 0;
  let cursor = 0;
  for (const hunk of hunks) {
    for (; cursor < hunk.from; cursor++) {
      if (lines[cursor].op !== '+') leftSeen += 1;
      if (lines[cursor].op !== '-') rightSeen += 1;
    }
    const body = [];
    let leftCount = 0;
    let rightCount = 0;
    for (; cursor <= hunk.to; cursor++) {
      const line = lines[cursor];
      if (line.op !== '+') leftCount += 1;
      if (line.op !== '-') rightCount += 1;
      body.push(`${line.op}${line.text}`);
      if (line.noEol) body.push(NO_EOL);
    }
    out.push(`@@ -${span(leftSeen + 1, leftCount)} +${span(rightSeen + 1, rightCount)} @@`, ...body);
    leftSeen += leftCount;
    rightSeen += rightCount;
  }
  return `${out.join('\n')}\n`;
}
