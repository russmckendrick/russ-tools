import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { OPERATORS, operatorsFor } from '../lib/operators.js';
import FilterValue from './FilterValue.jsx';

const TYPE_NAMES = { string: 'text', ip: 'IP address', port: 'port', int: 'number', real: 'number', enum: 'one of a set', bool: 'true or false', datetime: 'date and time' };

export default function FilterRow({ filter, column, problem, onChange, onRemove }) {
  const id = `kql-filter-${filter.id}`;
  const errorId = problem ? `${id}-error` : undefined;
  const input = OPERATORS[filter.op]?.input ?? 'single';
  const wide = input === 'range' || (column?.type === 'enum' && input === 'list');

  return (
    <li className="kql-row-in flex flex-col gap-1.5 border-b border-outline py-2.5 last:border-b-0">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 md:grid-cols-[auto_minmax(0,14rem)_minmax(0,11rem)_minmax(0,1fr)_auto]">
        <Switch checked={!filter.off} onCheckedChange={(on) => onChange({ off: !on })} aria-label={`Use the ${filter.column} filter`} />
        <div className={cn('flex min-h-9 min-w-0 flex-col justify-center', filter.off && 'opacity-55')}>
          <span className="font-mono text-data-md text-on-surface [overflow-wrap:anywhere]">{filter.column}</span>
          <span className="text-label-caps-sm text-on-surface-faint">
            {filter.off ? 'switched off' : column ? TYPE_NAMES[column.type] : 'unknown column'}
            {filter.preset && !filter.off ? ' · from the scenario' : ''}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="md:order-last" onClick={onRemove} aria-label={`Remove the ${filter.column} filter`}>
          <X aria-hidden="true" />
        </Button>
        {column && (
          <div className={cn('col-span-full grid min-w-0 gap-2 md:col-span-2 md:grid-cols-subgrid', wide ? 'grid-cols-1' : 'grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)]', filter.off && 'opacity-55')}>
            <Select value={filter.op} onValueChange={(op) => op && onChange({ op })}>
              <SelectTrigger id={`${id}-op`} aria-label={`${filter.column} operator`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operatorsFor(column).map((op) => (
                  <SelectItem key={op} value={op}>
                    {OPERATORS[op].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="min-w-0">
              <FilterValue id={id} column={column} filter={filter} invalid={Boolean(problem)} describedBy={errorId} onChange={onChange} />
            </div>
          </div>
        )}
      </div>
      {problem && (
        <p id={errorId} className="text-body-sm text-error">
          {problem} This filter is left out of the query.
        </p>
      )}
    </li>
  );
}
