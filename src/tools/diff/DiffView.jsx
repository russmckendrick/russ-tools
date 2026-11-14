import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CONTEXT, splitRows, unifiedRows } from './lib/rows.js';

const NUMBER = 'select-none px-1.5 text-right text-data-sm text-on-surface-faint';
const TEXT = 'min-w-0 whitespace-pre-wrap pr-3 [overflow-wrap:anywhere]';
const TONE = {
  removed: { row: 'bg-danger-subtle', mark: 'bg-danger/25', sign: 'text-danger' },
  added: { row: 'bg-success-subtle', mark: 'bg-success/25', sign: 'text-success' },
};

function Content({ text, parts, mark }) {
  if (!parts) return text === '' ? ' ' : text;
  return parts.map((part, index) =>
    part.changed ? (
      <span key={index} data-changed="" className={cn('rounded-[2px]', mark)}>
        {part.text}
      </span>
    ) : (
      <React.Fragment key={index}>{part.text}</React.Fragment>
    )
  );
}

function Gap({ count }) {
  return (
    <div className="border-y border-outline bg-surface-inset px-3 py-1 font-sans text-body-sm text-on-surface-muted">
      {count === 1 ? '1 unchanged line' : `${count.toLocaleString('en-GB')} unchanged lines`}
    </div>
  );
}

function Hidden({ hidden }) {
  if (!hidden) return null;
  return (
    <p className="border-t border-outline px-4 py-3 font-sans text-body-sm text-on-surface-muted">
      {hidden.toLocaleString('en-GB')} more rows are not drawn, to keep the page responsive. Copy as unified diff
      includes all of them.
    </p>
  );
}

const NO_EOL = 'No newline at end of file';

export function UnifiedView({ result, collapse }) {
  const { rows, hidden } = useMemo(() => unifiedRows(result, collapse ? CONTEXT : null), [result, collapse]);
  const grid = 'grid grid-cols-[2rem_2rem_1rem_minmax(0,1fr)] sm:grid-cols-[2.75rem_2.75rem_1.25rem_minmax(0,1fr)]';

  return (
    <div data-view="unified" className="font-mono text-data-md text-on-surface">
      {rows.map((row, index) => {
        if (row.kind === 'gap') return <Gap key={index} count={row.count} />;
        const tone = TONE[row.kind] ?? TONE[row.side];
        if (row.kind === 'note') {
          return (
            <div key={index} className={cn(grid, tone.row)}>
              <span className="col-start-4 font-sans text-body-sm text-on-surface-muted">{NO_EOL}</span>
            </div>
          );
        }
        return (
          <div key={index} data-row={row.kind} className={cn(grid, 'py-px', tone?.row)}>
            <span className={NUMBER}>{row.l ?? ''}</span>
            <span className={NUMBER}>{row.r ?? ''}</span>
            <span className={cn('select-none text-center', tone?.sign)}>
              <span aria-hidden="true">{row.kind === 'added' ? '+' : row.kind === 'removed' ? '-' : ''}</span>
              {tone ? <span className="sr-only">{row.kind}</span> : null}
            </span>
            <span className={TEXT}>
              <Content text={row.text} parts={row.parts} mark={tone?.mark} />
            </span>
          </div>
        );
      })}
      <Hidden hidden={hidden} />
    </div>
  );
}

function Half({ cell, tone, label, className }) {
  if (!cell) return <div className={cn('bg-surface-inset', className)} />;
  return (
    <div className={cn('grid grid-cols-[2.75rem_minmax(0,1fr)] py-px', tone?.row, className)}>
      <span className={NUMBER}>{cell.no}</span>
      <span className={TEXT}>
        {tone ? <span className="sr-only">{label} </span> : null}
        <Content text={cell.text} parts={cell.parts} mark={tone?.mark} />
        {cell.noEol ? <span className="block font-sans text-body-sm text-on-surface-muted">{NO_EOL}</span> : null}
      </span>
    </div>
  );
}

export function SplitView({ result, collapse }) {
  const { rows, hidden } = useMemo(() => splitRows(result, collapse ? CONTEXT : null), [result, collapse]);

  return (
    <div data-view="split" className="font-mono text-data-md text-on-surface">
      {rows.map((row, index) =>
        row.kind === 'gap' ? (
          <Gap key={index} count={row.count} />
        ) : (
          <div
            key={index}
            data-row={row.kind}
            className="grid grid-cols-2"
          >
            <Half cell={row.left} tone={row.kind === 'change' ? TONE.removed : null} label="removed" />
            <Half
              cell={row.right}
              tone={row.kind === 'change' ? TONE.added : null}
              label="added"
              className="border-l border-outline"
            />
          </div>
        )
      )}
      <Hidden hidden={hidden} />
    </div>
  );
}
