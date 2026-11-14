import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PERMISSION_SIDES, SIDE_LABEL } from '../lib/entraIds.js';
import { EntryDetail } from './EntryDetail.jsx';

const KIND_BADGE = {
  application: 'Application',
  permission: 'Graph permission',
  role: 'Directory role',
  error: 'Error code',
};

/** The line under a result's name: enough to pick it out without opening it. */
function summary({ entry, matched, side }) {
  const record = entry.record;
  if (matched === 'id') {
    if (entry.kind === 'permission') return `Matched its ${SIDE_LABEL[side].toLowerCase()} ID`;
    return entry.kind === 'role' ? 'Matched its role template ID' : 'Matched its application (client) ID';
  }
  if (entry.kind === 'application') return record.id;
  if (entry.kind === 'role') return record.description;
  if (entry.kind === 'error') return record.name ? `${record.name}. ${record.description}` : record.description;
  const sides = PERMISSION_SIDES.filter((key) => record[key]);
  const text = record[sides[0]]?.displayText ?? '';
  return `${sides.map((key) => SIDE_LABEL[key]).join(' and ')}${text ? `: ${text}` : ''}`;
}

export function ResultList({ matches, openKey, onToggle, sources }) {
  return (
    <ul className="divide-y divide-outline border-y border-outline">
      {matches.map((match) => {
        const key = `${match.entry.key}:${match.id ?? ''}`;
        const open = openKey === key;
        const idSummary = match.matched !== 'id' && match.entry.kind === 'application';
        return (
          <li key={key}>
            <button
              type="button"
              className="flex w-full items-start gap-3 py-3 text-left hover:bg-surface-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={open}
              onClick={() => onToggle(open ? null : key)}
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={cn('text-on-surface [overflow-wrap:anywhere]', match.entry.kind === 'application' || match.entry.kind === 'role' ? 'text-body-md' : 'font-mono text-data-md')}>
                    {match.entry.title}
                  </span>
                  <Badge variant={match.matched === 'id' || match.matched === 'code' ? 'default' : 'secondary'}>
                    {KIND_BADGE[match.entry.kind]}
                  </Badge>
                  {match.entry.kind === 'role' && match.entry.record.privileged && <Badge variant="warning">Privileged</Badge>}
                </span>
                <span
                  className={cn(
                    'mt-1 block text-on-surface-muted',
                    idSummary ? 'whitespace-nowrap font-mono text-data-sm' : 'line-clamp-2 text-body-sm'
                  )}
                >
                  {summary(match)}
                </span>
              </span>
              <ChevronDown
                className={cn('mt-1 size-4 shrink-0 text-on-surface-faint transition-transform', open && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
            {open && (
              <div className="pb-4">
                <EntryDetail match={match} sources={sources} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
