import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronsUpDown, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { SCENARIO_COUNT, searchScenarios } from '../lib/search.js';

const optionId = (entry) => `kql-option-${entry.service.id}-${entry.scenario.id}`;
const fine = () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

function Results({ results, grouped, active, onHover, onPick }) {
  return results.map((entry, index) => {
    const heading = grouped && (index === 0 || results[index - 1].service.id !== entry.service.id);
    return (
      <React.Fragment key={optionId(entry)}>
        {heading && (
          <div role="presentation" className="sticky top-0 z-10 border-b border-outline bg-surface px-4 py-1.5 text-label-caps-sm text-on-surface-muted">
            {entry.service.group} · {entry.service.name}
          </div>
        )}
        <div
          id={optionId(entry)}
          role="option"
          aria-selected={index === active}
          className={cn('cursor-pointer px-4 py-2.5', index === active && 'bg-surface-inset')}
          onMouseMove={() => onHover(index)}
          onClick={() => onPick(entry)}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-body-md text-on-surface">
              {!grouped && <span className="text-on-surface-muted">{entry.service.name} · </span>}
              {entry.scenario.name}
            </span>
            <span className="font-mono text-data-sm text-on-surface-faint">{entry.scenario.table}</span>
          </div>
          <p className="text-body-sm text-on-surface-muted">{entry.scenario.description}</p>
        </div>
      </React.Fragment>
    );
  });
}

export default function ScenarioPicker({ service, scenario, open, onOpenChange, onPick }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const list = useRef(null);
  const results = useMemo(() => searchScenarios(query), [query]);
  const current = results[active];

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(Math.max(0, searchScenarios('').findIndex((entry) => entry.service.id === service?.id && entry.scenario.id === scenario?.id)));
  }, [open, service, scenario]);

  useEffect(() => {
    if (open && current) document.getElementById(optionId(current))?.scrollIntoView({ block: 'nearest' });
  }, [open, current]);

  const pick = (entry) => {
    onPick(entry.service.id, entry.scenario.id);
    onOpenChange(false);
  };

  const onKeyDown = (event) => {
    const last = results.length - 1;
    const moves = { ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), Home: 0, End: last, PageDown: Math.min(active + 8, last), PageUp: Math.max(active - 8, 0) };
    const caret = (event.key === 'Home' || event.key === 'End') && query;
    if (event.key in moves && !caret) {
      event.preventDefault();
      setActive(moves[event.key]);
    } else if (event.key === 'Enter' && current) {
      event.preventDefault();
      pick(current);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor="kql-scenario">Scenario</Label>
      <button
        id="kql-scenario"
        type="button"
        aria-haspopup="dialog"
        onClick={() => onOpenChange(true)}
        className="rt-tap flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-outline-strong bg-surface-raised px-[11px] py-1.5 text-left text-body-sm text-on-surface transition-colors duration-140 hover:bg-surface-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
      >
        <span className="min-w-0 truncate">
          {scenario ? (
            <>
              <span className="text-on-surface-muted">{service.name} · </span>
              {scenario.name}
            </>
          ) : (
            'Choose a scenario'
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-on-surface-faint">
          <kbd className="hidden rounded-sm border border-outline px-1.5 font-mono text-data-sm [@media(pointer:fine)]:inline">/</kbd>
          <ChevronsUpDown className="size-4" aria-hidden="true" />
        </span>
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="top-[8vh] flex max-h-[84vh] max-w-2xl translate-y-0 flex-col gap-0 overflow-hidden p-0 max-sm:top-[4vh] max-sm:max-h-[92vh] max-sm:w-[calc(100%-1.5rem)]"
          onOpenAutoFocus={(event) => !fine() && event.preventDefault()}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById('kql-scenario')?.focus();
          }}
        >
          <DialogTitle className="sr-only">Choose a scenario</DialogTitle>
          <DialogDescription className="sr-only">Search {SCENARIO_COUNT} scenarios by service, name or table.</DialogDescription>
          <div className="flex items-center gap-2 border-b border-outline px-4 py-3 pr-11">
            <Search className="size-4 shrink-0 text-on-surface-faint" aria-hidden="true" />
            <input
              role="combobox"
              aria-expanded="true"
              aria-controls="kql-scenario-list"
              aria-activedescendant={current ? optionId(current) : undefined}
              aria-label="Search scenarios"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={`Search ${SCENARIO_COUNT} scenarios: failed sign-ins, WAF, SigninLogs…`}
              className="w-full bg-transparent text-body-md text-on-surface outline-none placeholder:text-on-surface-faint"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
                list.current?.scrollTo({ top: 0 });
              }}
              onKeyDown={onKeyDown}
            />
          </div>
          <div ref={list} id="kql-scenario-list" role="listbox" aria-label="Scenarios" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-body-sm text-on-surface-muted">Nothing matches “{query}”. Try a service, a table name or a word like “failed”.</p>
            ) : (
              <Results results={results} grouped={!query.trim()} active={active} onHover={setActive} onPick={pick} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
