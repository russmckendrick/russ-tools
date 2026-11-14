import React, { useId, useState } from 'react';
import { ListOrdered } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { formatCount } from '../lib/format';
import { parseRequirements } from '../lib/plan';

const SAMPLE = {
  4: 'web 500\ndb 120\nmgmt 60\np2p 2',
  6: 'site /56\nlan /64\nlink /127',
};

const HINT = {
  4: 'One per line: an optional name, then the hosts it needs. Write /30 to ask for an exact prefix.',
  6: 'One per line: an optional name, then a prefix length such as /64.',
};

function wanted(want) {
  const label = want.name || 'Unnamed';
  if (want.hosts !== null) return `${label}: ${formatCount(want.hosts)} hosts`;
  return want.prefix === null ? label : `${label}: /${want.prefix}`;
}

function whyNot(want, cidr) {
  if (want.reason === 'larger-than-parent') {
    return want.hosts !== null
      ? `needs a /${want.prefix}, which is larger than ${cidr}`
      : `is larger than ${cidr}`;
  }
  if (want.reason === 'no-space') {
    return want.hosts !== null ? `needs a /${want.prefix} and there is no room left` : 'has no room left';
  }
  return 'is not a size this family has';
}

function summary(family, plan) {
  const asked = plan.allocations.length + plan.unallocated.length;
  const blocks = plan.free.length;
  const head = `${plan.allocations.length} of ${asked} allocated`;
  if (blocks === 0) return `${head}. Nothing is left over.`;
  const largest = Math.min(...plan.free.map((leaf) => leaf.prefix));
  const where = `${blocks} free block${blocks === 1 ? '' : 's'}, the largest a /${largest}`;
  return family === 4
    ? `${head}. ${formatCount(Number(plan.freeAddresses))} addresses left in ${where}.`
    : `${head}. ${where}.`;
}

export default function SubnetPlanner({ family, cidr, plan, onPlan }) {
  const id = useId();
  const [text, setText] = useState('');
  const [errors, setErrors] = useState([]);

  const submit = (event) => {
    event.preventDefault();
    const parsed = parseRequirements(text, family);
    if (parsed.errors.length === 0 && parsed.requirements.length === 0) {
      setErrors([{ line: 0, message: 'Add at least one requirement.' }]);
      return;
    }
    setErrors(parsed.errors);
    if (parsed.errors.length === 0) onPlan(parsed.requirements);
  };

  return (
    <form
      onSubmit={submit}
      className="mb-4 flex flex-col gap-3 rounded-lg border border-outline bg-surface-inset p-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-list`}>{family === 4 ? 'Subnets needed' : 'Prefixes needed'}</Label>
        <Textarea
          id={`${id}-list`}
          rows={6}
          className="max-w-xl"
          placeholder={SAMPLE[family]}
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-describedby={`${id}-hint`}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <p id={`${id}-hint`} className="text-body-sm text-muted-foreground">
          {HINT[family]}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button type="submit">
          <ListOrdered />
          Allocate
        </Button>
        <p className="text-body-sm text-muted-foreground">
          Largest first, out of {cidr}. Replaces the current divide.
        </p>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="flex flex-col gap-1">
              {errors.map((error) => (
                <li key={`${error.line}-${error.message}`}>
                  {error.line > 0 && <span className="font-mono">Line {error.line}: </span>}
                  {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {plan && errors.length === 0 && (
        <div className="flex flex-col gap-2">
          <p role="status" className="font-mono text-data-md text-on-surface">
            {summary(family, plan)}
          </p>
          {plan.unallocated.length > 0 && (
            <Alert variant="warning">
              <AlertDescription>
                <p>
                  {plan.unallocated.length === 1
                    ? 'One requirement did not fit:'
                    : `${plan.unallocated.length} requirements did not fit:`}
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {plan.unallocated.map((want) => (
                    <li key={want.index}>
                      <span className="font-mono">{wanted(want)}</span> {whyNot(want, cidr)}.
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </form>
  );
}
