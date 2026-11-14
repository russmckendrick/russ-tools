import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { commonColumns, findColumn, tableColumns } from '../lib/schema.js';
import FilterRow from './FilterRow.jsx';

const QUICK = 6;

export default function FilterList({ table, filters, problems, onAdd, onChange, onRemove }) {
  const problemFor = (id) => problems.find((problem) => problem.scope === 'filter' && problem.id === id)?.message;
  const used = new Set(filters.map((filter) => filter.column));
  const quick = commonColumns(table).filter((column) => !used.has(column.name)).slice(0, QUICK);
  const active = filters.filter((filter) => !filter.off).length;

  return (
    <Card className="kql-under-pin">
      <CardHeader className="gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h3 className="text-title-sm">
            Filters <span className="text-on-surface-faint">{active}</span>
          </h3>
          <Select value="" onValueChange={(column) => column && onAdd(column)}>
            <SelectTrigger aria-label="Add a filter on any column" className="w-auto min-w-[10.5rem]">
              <SelectValue placeholder="Any column…" />
            </SelectTrigger>
            <SelectContent>
              {tableColumns(table).map((column) => (
                <SelectItem key={column.name} value={column.name}>
                  {column.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {quick.length > 0 && (
          <div role="group" aria-label="Add a filter" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
            {quick.map((column) => (
              <Button key={column.name} type="button" variant="outline" size="sm" className="shrink-0 font-mono" onClick={() => onAdd(column.name)}>
                <Plus aria-hidden="true" />
                {column.name}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      {filters.length > 0 && (
        <CardContent className="py-0.5">
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
        </CardContent>
      )}
    </Card>
  );
}
