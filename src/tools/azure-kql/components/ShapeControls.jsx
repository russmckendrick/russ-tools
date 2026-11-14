import React from 'react';
import { LineChart, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MAX_GROUP, MAX_ROWS } from '../lib/build.js';
import { commonColumns, tableColumns } from '../lib/schema.js';

export default function ShapeControls({ table, group, limit, kind, dispatch }) {
  const taken = new Set(group.by);
  const common = commonColumns(table).filter((column) => !taken.has(column.name));
  const names = new Set(common.map((column) => column.name));
  const rest = tableColumns(table).filter((column) => !names.has(column.name) && !taken.has(column.name));
  const custom = group.by.length > 0 || group.overTime;

  return (
    <div className="col-span-full flex flex-wrap items-end gap-x-3 gap-y-2">
      {kind !== 'series' && (
        <div className="flex w-20 flex-col gap-1.5 sm:w-24">
          <Label htmlFor="kql-limit">{kind === 'top' ? 'Groups' : 'Rows'}</Label>
          <Input id="kql-limit" type="number" inputMode="numeric" min={1} max={MAX_ROWS} value={limit} onChange={(event) => dispatch({ type: 'limit', limit: event.target.value })} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Label htmlFor="kql-group">Summarise</Label>
        <div className="flex flex-wrap items-center gap-1.5">
          <Select value="" onValueChange={(column) => column && dispatch({ type: 'group-add', column })} disabled={group.by.length >= MAX_GROUP}>
            <SelectTrigger id="kql-group" className="w-auto min-w-[7.5rem] flex-1 sm:w-36 sm:flex-none">
              <SelectValue placeholder="Count by…" />
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
          {group.by.map((name) => (
            <Button key={name} type="button" variant="secondary" className="kql-row-in h-9 gap-1 px-2.5 font-mono text-data-md" aria-label={`Stop counting by ${name}`} onClick={() => dispatch({ type: 'group-remove', column: name })}>
              {name}
              <X aria-hidden="true" />
            </Button>
          ))}
          <Button type="button" variant={group.overTime ? 'default' : 'outline'} className="h-9 px-3" aria-pressed={group.overTime} onClick={() => dispatch({ type: 'group-time', overTime: !group.overTime })}>
            <LineChart aria-hidden="true" />
            <span className="max-sm:sr-only">Over time</span>
          </Button>
          {custom && (
            <Button type="button" variant="ghost" className="h-9 px-2.5" onClick={() => dispatch({ type: 'group-clear' })}>
              <RotateCcw aria-hidden="true" />
              <span className="max-sm:sr-only">Reset</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
