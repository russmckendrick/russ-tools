import React, { useEffect, useMemo, useRef } from 'react';
import { highlightKql } from '../lib/highlight.js';
import './kql.css';

const HINTS = { scenario: 'scenario', time: 'time range', limit: 'rows', group: 'summarise' };
const hintFor = (source) => HINTS[source] ?? 'filter';

export default function QueryLines({ lines, onJump }) {
  const seen = useRef(null);
  const rendered = useMemo(() => lines.map((line) => ({ ...line, html: highlightKql(line.text) })), [lines]);
  const before = seen.current;

  useEffect(() => {
    seen.current = new Set(lines.map((line) => line.text));
  }, [lines]);

  const jump = (event, source) => {
    const selection = window.getSelection();
    const selecting = selection && !selection.isCollapsed && event.currentTarget.parentElement.contains(selection.anchorNode);
    if (!selecting) onJump(source);
  };

  return (
    <div className="kql-code kql-lines rounded-md border border-outline bg-surface-inset py-2" role="group" aria-label="KQL query">
      {rendered.map((line, index) => (
        <div
          key={`${index}:${line.text}`}
          role="button"
          tabIndex={0}
          className={before && !before.has(line.text) ? 'kql-line kql-line-fresh' : 'kql-line'}
          data-hint={hintFor(line.source)}
          title={`Change the ${hintFor(line.source)}`}
          onClick={(event) => jump(event, line.source)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onJump(line.source);
            }
          }}
        >
          <code dangerouslySetInnerHTML={{ __html: line.html }} />
        </div>
      ))}
    </div>
  );
}
