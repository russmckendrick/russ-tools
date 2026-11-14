import React, { useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { segments } from './lib/regex.js';

const TYPE = 'whitespace-pre-wrap px-[11px] py-2 font-mono text-data-md [overflow-wrap:anywhere]';

export function HighlightArea({ value, onChange, matches, className, ...props }) {
  const runs = useMemo(() => segments(value, matches), [value, matches]);

  return (
    <div
      className={cn(
        'grid max-h-[26rem] overflow-auto rounded-md border border-outline-strong bg-surface-raised',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-surface-raised',
        className
      )}
    >
      <div
        aria-hidden="true"
        data-highlight=""
        className={cn(
          TYPE,
          'pointer-events-none col-start-1 row-start-1 text-transparent [@media(pointer:coarse)]:text-[16px]'
        )}
      >
        {runs.map((run, index) =>
          run.match === null ? (
            <React.Fragment key={index}>{run.text}</React.Fragment>
          ) : (
            <span
              key={index}
              data-match={run.match}
              className={cn('rounded-[2px]', run.match % 2 === 0 ? 'bg-primary/20' : 'bg-primary/40')}
            >
              {run.text}
            </span>
          )
        )}{' '}
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className={cn(
          TYPE,
          'col-start-1 row-start-1 min-h-36 resize-none overflow-hidden rounded-none border-0 bg-transparent',
          'hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0'
        )}
        {...props}
      />
    </div>
  );
}
