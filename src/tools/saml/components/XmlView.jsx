import React from 'react';

const INK = {
  tag: 'text-[var(--cat,var(--color-primary-text))]',
  attr: 'text-on-surface-muted',
  value: 'text-on-surface',
  text: 'text-on-surface',
  punct: 'text-on-surface-faint',
  comment: 'text-on-surface-faint',
  space: undefined,
};

const MAX_LINES = 4000;

export default function XmlView({ lines }) {
  const shown = lines.slice(0, MAX_LINES);
  return (
    <div className="rounded-md border border-outline bg-surface-inset">
      <pre
        className="max-h-[36rem] overflow-y-auto px-3 py-3 font-mono text-data-sm text-on-surface"
        tabIndex={0}
        aria-label="Decoded XML"
      >
        <code className="block">
          {shown.map((line, index) => (
            <span
              key={index}
              className="block whitespace-pre-wrap [overflow-wrap:anywhere]"
              style={{ paddingLeft: `${line.indent + 2}ch`, textIndent: `-${line.indent + 2}ch` }}
            >
              {' '.repeat(line.indent)}
              {line.tokens.map((part, position) => (
                <span key={position} className={INK[part.type]}>
                  {part.text}
                </span>
              ))}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
      {lines.length > MAX_LINES && (
        <p className="border-t border-outline px-3 py-2 text-body-sm text-on-surface-faint">
          Showing the first {MAX_LINES.toLocaleString()} of {lines.length.toLocaleString()} lines. Copy XML has all of them.
        </p>
      )}
    </div>
  );
}
