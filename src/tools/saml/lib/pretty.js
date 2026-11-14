const ELEMENT = 1;
const TEXT = 3;
const CDATA = 4;
const COMMENT = 8;

const INDENT = 2;

const escapeText = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttribute = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const token = (type, text) => ({ type, text });

function openTag(element, close) {
  const tokens = [token('punct', '<'), token('tag', element.nodeName)];
  for (const attribute of element.attributes) {
    tokens.push(
      token('space', ' '),
      token('attr', attribute.name),
      token('punct', '='),
      token('value', `"${escapeAttribute(attribute.value)}"`)
    );
  }
  tokens.push(token('punct', close));
  return tokens;
}

const closeTag = (element) => [token('punct', '</'), token('tag', element.nodeName), token('punct', '>')];

function walk(node, depth, lines) {
  if (node.nodeType === COMMENT) {
    lines.push({ depth, tokens: [token('comment', `<!--${node.data}-->`)] });
    return;
  }
  if (node.nodeType === TEXT || node.nodeType === CDATA) {
    const text = node.data.trim();
    if (text) lines.push({ depth, tokens: [token('text', escapeText(text))] });
    return;
  }
  if (node.nodeType !== ELEMENT) return;

  const children = [...node.childNodes].filter(
    (child) => !((child.nodeType === TEXT || child.nodeType === CDATA) && !child.data.trim())
  );

  if (children.length === 0) {
    lines.push({ depth, tokens: openTag(node, '/>') });
    return;
  }

  if (children.every((child) => child.nodeType === TEXT || child.nodeType === CDATA)) {
    const text = children.map((child) => child.data).join('').trim();
    lines.push({ depth, tokens: [...openTag(node, '>'), token('text', escapeText(text)), ...closeTag(node)] });
    return;
  }

  lines.push({ depth, tokens: openTag(node, '>') });
  for (const child of children) walk(child, depth + 1, lines);
  lines.push({ depth, tokens: closeTag(node) });
}

export function prettyLines(document) {
  const lines = [];
  for (const node of document.childNodes) walk(node, 0, lines);
  return lines.map((line) => ({ indent: line.depth * INDENT, tokens: line.tokens }));
}

export function prettyText(lines) {
  return lines.map((line) => `${' '.repeat(line.indent)}${line.tokens.map((part) => part.text).join('')}`).join('\n');
}
