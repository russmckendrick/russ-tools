import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Fields({ className, children }) {
  return <dl className={cn('flex flex-col', className)}>{children}</dl>;
}

export function Field({ label, children }) {
  return (
    <div className="grid gap-x-6 gap-y-1 border-b border-rule py-2.5 last:border-b-0 last:pb-0 sm:grid-cols-[11rem_minmax(0,1fr)]">
      <dt className="text-body-sm text-on-surface-muted">{label}</dt>
      <dd className="min-w-0 overflow-x-auto font-mono text-data-md text-on-surface">{children}</dd>
    </div>
  );
}

export function Words({ text }) {
  return String(text)
    .split(' ')
    .map((word, index) => (
      <React.Fragment key={index}>
        {index > 0 && ' '}
        <span className="whitespace-nowrap">{word}</span>
      </React.Fragment>
    ));
}

export function Title({ text }) {
  return (
    <h3 className="min-w-0 text-title-sm">
      {String(text)
        .split(' ')
        .map((word, index) => (
          <React.Fragment key={index}>
            {index > 0 && ' '}
            <span className="inline-block max-w-full truncate align-bottom">{word}</span>
          </React.Fragment>
        ))}
    </h3>
  );
}

const GROUP = 8;

export function Hex({ value }) {
  if (!value) return <Absent>Not available</Absent>;
  const bytes = value.split(':');
  const groups = [];
  for (let i = 0; i < bytes.length; i += GROUP) groups.push(bytes.slice(i, i + GROUP).join(':'));
  return (
    <span className="select-all">
      {groups.map((group, index) => (
        <React.Fragment key={index}>
          {index > 0 && <wbr />}
          <span className="whitespace-nowrap">
            {group}
            {index < groups.length - 1 && ':'}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
}

export function Absent({ children = 'Not present' }) {
  return <span className="font-sans text-body-sm text-on-surface-faint">{children}</span>;
}

export function Note({ children }) {
  return <span className="whitespace-nowrap font-sans text-body-sm text-on-surface-faint">{children}</span>;
}

export function Lines({ items }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item, index) => (
        <li key={index} className="whitespace-nowrap">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Names({ names }) {
  if (!names.length) return <Absent>None</Absent>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {names.map((name, index) => (
        <li key={`${name.type}-${name.value}-${index}`}>
          <Badge variant="secondary" className="text-on-surface">
            <span className="text-on-surface-faint">{name.type}</span>
            {name.value}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function KeyUsageValue({ usage }) {
  if (!usage) return <Absent />;
  return (
    <>
      <Words text={usage.usages.join(', ')} />
      {usage.critical && <Note> · critical</Note>}
    </>
  );
}

export function ExtendedUsageValue({ usages }) {
  if (!usages.length) return <Absent />;
  return <Lines items={usages.map((usage) => usage.name)} />;
}

export function KeyValue({ publicKey }) {
  return (
    <>
      <span className="whitespace-nowrap">{publicKey.label}</span>
      {publicKey.size && !publicKey.label.includes(String(publicKey.size)) && <Note> · {publicKey.size} bits</Note>}
    </>
  );
}

export function SignatureValue({ algorithm }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="whitespace-nowrap">{algorithm.name}</span>
      {algorithm.weak && <Badge variant="warning">weak</Badge>}
    </span>
  );
}
