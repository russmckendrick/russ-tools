import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OPERATORS, operatorsFor } from '../lib/operators.js';
import FilterValue from './FilterValue.jsx';

const TYPE_NAMES = { string: 'text', ip: 'IP address', port: 'port', int: 'number', real: 'number', enum: 'one of a set', bool: 'true or false', datetime: 'date and time' };

export default function FilterRow({ filter, column, problem, onChange, onRemove }) {
  const id = `kql-filter-${filter.id}`;
  const errorId = problem ? `${id}-error` : undefined;

  return (
    <li className="flex flex-col gap-1.5 border-b border-outline py-3 last:border-b-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 md:grid-cols-[minmax(0,15rem)_minmax(0,12rem)_minmax(0,1fr)_auto]">
        <div className="flex min-h-9 min-w-0 flex-col justify-center">
          <span className="font-mono text-data-md text-on-surface [overflow-wrap:anywhere]">{filter.column}</span>
          <span className="text-label-caps-sm text-on-surface-faint">
            {column ? TYPE_NAMES[column.type] : 'unknown column'}
            {filter.preset ? ' · from the scenario' : ''}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="md:order-last" onClick={onRemove} aria-label={`Remove the ${filter.column} filter`}>
          <X aria-hidden="true" />
        </Button>
        {column && (
          <>
            <Select value={filter.op} onValueChange={(op) => op && onChange({ op })}>
              <SelectTrigger aria-label={`${filter.column} operator`} className="max-md:col-span-full">
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
            <div className="min-w-0 max-md:col-span-full">
              <FilterValue id={id} column={column} filter={filter} invalid={Boolean(problem)} describedBy={errorId} onChange={onChange} />
            </div>
          </>
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
