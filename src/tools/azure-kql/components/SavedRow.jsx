import React, { useState } from 'react';
import { Check, FolderOpen, Pencil, Star, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { findScenario, findService } from '../lib/catalog.js';

const when = (iso) => {
  const time = Date.parse(iso);
  return time > 0 ? new Date(time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
};

function source(entry) {
  if (entry.kind !== 'build') return 'Written KQL';
  const service = findService(entry.state?.service);
  const scenario = findScenario(entry.state?.service, entry.state?.scenario);
  return service && scenario ? `${service.name} · ${scenario.name}` : 'Written KQL';
}

export default function SavedRow({ entry, onOpen, onRename, onDelete, onSave }) {
  const [draft, setDraft] = useState(null);
  const editing = draft !== null;
  const commit = () => {
    onRename(entry.id, draft);
    setDraft(null);
  };

  return (
    <li className="flex flex-col gap-2 border-b border-outline py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        {editing ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              commit();
            }}
          >
            <Input autoFocus aria-label="Name" className="font-sans" value={draft} maxLength={120} onChange={(event) => setDraft(event.target.value)} />
            <Button type="submit" variant="outline" size="icon" aria-label="Save the name" disabled={!draft.trim()}>
              <Check aria-hidden="true" />
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Cancel renaming" onClick={() => setDraft(null)}>
              <X aria-hidden="true" />
            </Button>
          </form>
        ) : (
          <p className="text-body-md text-on-surface [overflow-wrap:anywhere]">{onRename ? entry.name : source(entry)}</p>
        )}
        <p className="text-body-sm text-on-surface-muted">
          {[onRename && source(entry), when(entry.at), ...(entry.tags ?? [])].filter(Boolean).join(' · ')}
        </p>
        {entry.description && <p className="text-body-sm text-on-surface-muted">{entry.description}</p>}
        <p className="mt-1 truncate font-mono text-data-sm text-on-surface-faint">{entry.kql.split('\n').slice(0, 3).join(' ')}</p>
      </div>
      {!editing && (
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onOpen(entry)}>
            <FolderOpen aria-hidden="true" />
            Open
          </Button>
          {onSave && (
            <Button variant="ghost" size="icon" aria-label="Save this query" onClick={() => onSave(entry)}>
              <Star aria-hidden="true" />
            </Button>
          )}
          {onRename && (
            <Button variant="ghost" size="icon" aria-label={`Rename ${entry.name}`} onClick={() => setDraft(entry.name)}>
              <Pencil aria-hidden="true" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" aria-label={`Delete ${entry.name}`} onClick={() => onDelete(entry.id)}>
              <Trash2 aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
