import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OPERATORS } from '../lib/operators.js';
import { splitList } from '../lib/values.js';

const PLACEHOLDERS = {
  ip: '10.0.0.4 or 10.0.0.0/8',
  port: '443',
  int: '500',
  real: '0.5',
  string: 'value',
};

const numeric = (type) => type === 'port' || type === 'int';

function EnumChips({ column, value, label, onChange }) {
  const chosen = splitList(value);
  const toggle = (item) => {
    const next = chosen.includes(item) ? chosen.filter((other) => other !== item) : [...chosen, item];
    onChange({ value: column.values.filter((option) => next.includes(option)).join(', ') });
  };
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {column.values.map((item) => (
        <Button
          key={item}
          type="button"
          size="sm"
          variant={chosen.includes(item) ? 'default' : 'outline'}
          aria-pressed={chosen.includes(item)}
          onClick={() => toggle(item)}
        >
          {item}
        </Button>
      ))}
    </div>
  );
}

export default function FilterValue({ id, column, filter, invalid, describedBy, onChange }) {
  const input = OPERATORS[filter.op]?.input ?? 'single';
  const label = `${column.name} value`;
  const shared = { 'aria-invalid': invalid || undefined, 'aria-describedby': describedBy };

  if (input === 'none') return null;

  if (column.type === 'enum' && input === 'list') {
    return <EnumChips column={column} value={filter.value} label={label} onChange={onChange} />;
  }

  if (column.type === 'enum') {
    return (
      <Select value={column.values.includes(filter.value) ? filter.value : ''} onValueChange={(value) => value && onChange({ value })}>
        <SelectTrigger id={id} aria-label={label} {...shared}>
          <SelectValue placeholder="Choose a value" />
        </SelectTrigger>
        <SelectContent>
          {column.values.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (column.type === 'datetime') {
    return (
      <Input id={id} type="datetime-local" aria-label={`${label}, UTC`} value={filter.value} onChange={(event) => onChange({ value: event.target.value })} {...shared} />
    );
  }

  if (input === 'range') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Input id={id} aria-label={`${column.name} from`} inputMode="decimal" placeholder="from" value={filter.value} onChange={(event) => onChange({ value: event.target.value })} {...shared} />
        <Input aria-label={`${column.name} to`} inputMode="decimal" placeholder="to" value={filter.value2 ?? ''} onChange={(event) => onChange({ value2: event.target.value })} {...shared} />
      </div>
    );
  }

  const listId = column.suggest ? `${id}-suggestions` : undefined;
  const sample = PLACEHOLDERS[column.type] ?? PLACEHOLDERS.string;
  return (
    <>
      <Input
        id={id}
        aria-label={label}
        list={listId}
        inputMode={input === 'single' && numeric(column.type) ? 'numeric' : undefined}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={input === 'list' ? 'comma-separated values' : column.suggest?.[0] ?? sample}
        value={filter.value}
        onChange={(event) => onChange({ value: event.target.value })}
        {...shared}
      />
      {listId && (
        <datalist id={listId}>
          {column.suggest.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      )}
    </>
  );
}
