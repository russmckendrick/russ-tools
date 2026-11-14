import { describeValue, inferScalar, isScalar, scalarToText } from './scalars.js';

export const ATTRIBUTE_PREFIX = '@';
export const TEXT_KEY = '#text';
export const LIST_ROOT = 'rows';
export const LIST_ITEM = 'row';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_NODE = 4;

export class XmlError extends Error {
  constructor(message, line = null, column = null) {
    super(message);
    this.name = 'XmlError';
    this.line = line;
    this.column = column;
  }
}

function requireDom() {
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
    throw new XmlError('XML conversion needs a browser: DOMParser is not available here.');
  }
}

function readParserError(document) {
  const error = document.getElementsByTagName('parsererror')[0];
  if (!error) return null;
  const text = (error.textContent || 'The XML is not well formed.').replace(/\s+/g, ' ').trim();
  const position = text.match(/line (\d+) at column (\d+)/i) || text.match(/Line Number (\d+), Column (\d+)/i) || text.match(/^(\d+):(\d+):/);
  const message = text
    .replace(/^This page contains the following errors:\s*/i, '')
    .replace(/\s*Below is a rendering of the page up to the first error\.?\s*$/i, '');
  return new XmlError(message, position ? Number(position[1]) : null, position ? Number(position[2]) : null);
}

function elementToValue(element, infer) {
  const value = {};
  let hasContent = false;

  for (const attribute of Array.from(element.attributes)) {
    value[`${ATTRIBUTE_PREFIX}${attribute.name}`] = infer(attribute.value);
    hasContent = true;
  }

  let text = '';
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === TEXT_NODE || child.nodeType === CDATA_NODE) {
      text += child.nodeValue;
    } else if (child.nodeType === ELEMENT_NODE) {
      const childValue = elementToValue(child, infer);
      const name = child.nodeName;
      if (!Object.prototype.hasOwnProperty.call(value, name)) value[name] = childValue;
      else if (Array.isArray(value[name])) value[name].push(childValue);
      else value[name] = [value[name], childValue];
      hasContent = true;
    }
  }

  text = text.trim();
  if (!hasContent) return infer(text);
  if (text !== '') value[TEXT_KEY] = infer(text);
  return value;
}

export function parseXml(text, { inferTypes = true } = {}) {
  requireDom();
  if (!String(text).trim()) throw new XmlError('There is no XML here: the input is empty.', 1, 1);

  const document = new DOMParser().parseFromString(String(text).trim(), 'application/xml');
  const parserError = readParserError(document);
  if (parserError) throw parserError;

  const root = document.documentElement;
  const infer = inferTypes ? inferScalar : (value) => value;
  return { [root.nodeName]: elementToValue(root, infer) };
}

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) && !isScalar(value);

function findRoot(data) {
  if (Array.isArray(data)) return [LIST_ROOT, { [LIST_ITEM]: data }];
  if (!isPlainObject(data)) {
    throw new XmlError(`XML needs a single root element, and this is ${describeValue(data)} with no name. Wrap it in one key, for example {"value": ...}.`);
  }
  const keys = Object.keys(data);
  if (keys.length !== 1) {
    const shown = keys.slice(0, 3).map((key) => `"${key}"`).join(', ');
    throw new XmlError(
      keys.length === 0
        ? 'XML needs a single root element, and this object is empty.'
        : `XML needs a single root element, and this object has ${keys.length} top-level keys (${shown}${keys.length > 3 ? ', ...' : ''}). Wrap them in one key, for example {"root": {...}}.`,
    );
  }
  const [name] = keys;
  if (Array.isArray(data[name])) {
    throw new XmlError(
      `XML needs a single root element, and "${name}" is a list, which would write several. Wrap it in one more key, for example {"${name}": {"item": [...]}}.`,
    );
  }
  return [name, data[name]];
}

function createElement(document, name, path) {
  if (name.startsWith(ATTRIBUTE_PREFIX) || name === TEXT_KEY) {
    throw new XmlError(`"${name}" at ${path} is an attribute or text key, and cannot be an element.`);
  }
  try {
    return document.createElement(name);
  } catch {
    throw new XmlError(`The key "${name}" at ${path} cannot be an XML element name. Names start with a letter or underscore and have no spaces.`);
  }
}

function appendValue(document, parent, name, value, path) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (Array.isArray(item)) {
        throw new XmlError(`"${name}" at ${path} holds a list inside a list, which XML cannot express. Give the inner list a key of its own.`);
      }
      appendValue(document, parent, name, item, `${path}[${index}]`);
    });
    return;
  }

  const element = createElement(document, name, path);
  parent.appendChild(element);

  if (isScalar(value)) {
    const text = scalarToText(value);
    if (text !== '') element.appendChild(document.createTextNode(text));
    return;
  }

  for (const key of Object.keys(value)) {
    const child = value[key];
    const childPath = `${path} > ${key}`;
    if (key === TEXT_KEY) {
      if (!isScalar(child)) throw new XmlError(`"${TEXT_KEY}" at ${path} must be a single value, not ${describeValue(child)}.`);
      element.appendChild(document.createTextNode(scalarToText(child)));
    } else if (key.startsWith(ATTRIBUTE_PREFIX)) {
      if (!isScalar(child)) {
        throw new XmlError(`The attribute "${key}" at ${path} must be a single value, not ${describeValue(child)}.`);
      }
      try {
        element.setAttribute(key.slice(ATTRIBUTE_PREFIX.length), scalarToText(child));
      } catch {
        throw new XmlError(`"${key}" at ${path} cannot be an XML attribute name.`);
      }
    } else {
      appendValue(document, element, key, child, childPath);
    }
  }
}

function indent(document, element, depth, unit) {
  const children = Array.from(element.childNodes).filter((child) => child.nodeType === ELEMENT_NODE);
  if (children.length === 0) return;
  for (const child of children) {
    element.insertBefore(document.createTextNode(`\n${unit.repeat(depth + 1)}`), child);
    indent(document, child, depth + 1, unit);
  }
  element.appendChild(document.createTextNode(`\n${unit.repeat(depth)}`));
}

export function toXml(data, { pretty = true } = {}) {
  requireDom();
  const [rootName, rootValue] = findRoot(data);

  const document = new DOMParser().parseFromString('<x/>', 'application/xml');
  const holder = document.documentElement;
  appendValue(document, holder, rootName, rootValue, rootName);
  const root = holder.firstChild;
  if (pretty) indent(document, root, 0, '  ');

  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(root)}\n`;
}

export function looksLikeXml(text) {
  const trimmed = String(text).trim();
  return /^<[?!A-Za-z_]/.test(trimmed) && trimmed.endsWith('>');
}
