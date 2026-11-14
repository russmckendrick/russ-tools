import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ValueList, ValueRow } from '@/components/ui/value-list';
import { PERMISSION_SIDES, SIDE_LABEL } from '../lib/entraIds.js';

function SourceLink({ source }) {
  return (
    <a
      className="inline-flex items-center gap-1 text-primary-text underline underline-offset-2"
      href={source.url}
      target="_blank"
      rel="noreferrer"
    >
      {source.title}
      <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
    </a>
  );
}

function ApplicationDetail({ record, sources }) {
  return (
    <>
      <ValueList>
        <ValueRow label="Application (client) ID" value={record.id} copyValue={record.id} />
        <ValueRow label="Name" value={record.name} copyValue={record.name} mono={false} />
        {record.aliases.length > 0 && <ValueRow label="Also listed as" value={record.aliases.join(', ')} mono={false} />}
      </ValueList>
      <p className="mt-3 text-body-sm text-on-surface-muted">
        Listed by Microsoft in:{' '}
        {record.sources.map((key, index) => (
          <React.Fragment key={key}>
            {index > 0 && ', '}
            {sources[key] ? <SourceLink source={sources[key]} /> : key}
          </React.Fragment>
        ))}
      </p>
    </>
  );
}

function PermissionDetail({ record, matchedSide, sources }) {
  const sides = PERMISSION_SIDES.filter((side) => record[side]);
  return (
    <div className="space-y-4">
      {sides.map((side) => (
        <section key={side} aria-label={SIDE_LABEL[side]}>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-label-caps uppercase text-on-surface-faint">{SIDE_LABEL[side]}</h4>
            {matchedSide === side && <Badge variant="success">Matches this ID</Badge>}
          </div>
          <ValueList>
            <ValueRow label="Permission ID" value={record[side].id} copyValue={record[side].id} />
            <ValueRow label="Display text" value={record[side].displayText ?? 'Not published'} mono={false} />
            {side !== 'resourceSpecific' && (
              <ValueRow
                label="Admin consent"
                value={record[side].adminConsentRequired ? 'Required' : 'Not required'}
                mono={false}
              />
            )}
            <ValueRow label="What it grants" value={record[side].description ?? 'Not published'} mono={false} />
          </ValueList>
        </section>
      ))}
      {sources.permissions && (
        <p className="text-body-sm text-on-surface-muted">
          From the <SourceLink source={sources.permissions} />. Resource app: Microsoft Graph.
        </p>
      )}
    </div>
  );
}

function RoleDetail({ record, sources }) {
  return (
    <>
      <ValueList>
        <ValueRow label="Role template ID" value={record.id} copyValue={record.id} />
        <ValueRow label="Role" value={record.name} copyValue={record.name} mono={false} />
        <ValueRow label="What it can do" value={record.description || 'Not published'} mono={false} />
        <ValueRow
          label="Privileged"
          value={record.privileged ? 'Yes, marked privileged by Microsoft' : 'Not marked privileged'}
          mono={false}
        />
      </ValueList>
      {sources.roles && (
        <p className="mt-3 text-body-sm text-on-surface-muted">
          From <SourceLink source={sources.roles} />. The template ID is the same in every tenant.
        </p>
      )}
    </>
  );
}

function ErrorDetail({ record, sources }) {
  return (
    <>
      <ValueList>
        <ValueRow label="Code" value={record.code} copyValue={record.code} />
        {record.name && <ValueRow label="Error name" value={record.name} copyValue={record.name} />}
        <ValueRow label="Meaning" value={record.description} mono={false} />
      </ValueList>
      {sources.errors && (
        <p className="mt-3 text-body-sm text-on-surface-muted">
          From <SourceLink source={sources.errors} />. Microsoft documents a subset of codes and their wording changes.
        </p>
      )}
    </>
  );
}

export function EntryDetail({ match, sources }) {
  const { entry } = match;
  if (entry.kind === 'application') return <ApplicationDetail record={entry.record} sources={sources} />;
  if (entry.kind === 'permission') return <PermissionDetail record={entry.record} matchedSide={match.side} sources={sources} />;
  if (entry.kind === 'role') return <RoleDetail record={entry.record} sources={sources} />;
  return <ErrorDetail record={entry.record} sources={sources} />;
}
