import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { commonColumns, findColumn, tableColumns } from '../lib/schema.js';
import FilterRow from './FilterRow.jsx';

function AddFilter({ table, onAdd }) {
  const common = commonColumns(table);
  const names = new Set(common.map((column) => column.name));
  const rest = tableColumns(table).filter((column) => !names.has(column.name));

  return (
    <Select value="" onValueChange={(column) => column && onAdd(column)}>
      <SelectTrigger aria-label="Add a filter" className="w-full sm:w-64">
        <span className="flex items-center gap-1.5 text-on-surface">
          <Plus className="size-4" aria-hidden="true" />
          <SelectValue placeholder="Add a filter" />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Most used</SelectLabel>
          {common.map((column) => (
            <SelectItem key={column.name} value={column.name}>
              {column.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>All columns</SelectLabel>
          {rest.map((column) => (
            <SelectItem key={column.name} value={column.name}>
              {column.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default function FilterList({ table, filters, problems, onAdd, onChange, onRemove }) {
  const problemFor = (id) => problems.find((problem) => problem.scope === 'filter' && problem.id === id)?.message;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <h3 className="text-title-sm">Filters</h3>
            <p className="text-body-sm text-on-surface-muted max-sm:hidden">
              Columns of <span className="font-mono text-data-md">{table}</span>, each added as its own where clause.
            </p>
          </div>
          <AddFilter table={table} onAdd={onAdd} />
        </div>
      </CardHeader>
      <CardContent className="py-1">
        {filters.length === 0 ? (
          <p className="py-3 text-body-sm text-on-surface-faint">No filters yet. The query returns everything in the time range.</p>
        ) : (
          <ul>
            {filters.map((filter) => (
              <FilterRow
                key={filter.id}
                filter={filter}
                column={findColumn(table, filter.column)}
                problem={problemFor(filter.id)}
                onChange={(patch) => onChange(filter.id, patch)}
                onRemove={() => onRemove(filter.id)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
