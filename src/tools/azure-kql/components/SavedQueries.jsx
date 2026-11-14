import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import SavedRow from './SavedRow.jsx';

const SHOWN = 5;

function Section({ title, count, empty, action, children }) {
  const [all, setAll] = useState(false);
  const rows = React.Children.toArray(children);
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-3">
        <h4 className="text-label-caps text-on-surface-muted">
          {title} <span className="text-on-surface-faint">{count}</span>
        </h4>
        {action}
      </div>
      {rows.length === 0 ? (
        <p className="py-3 text-body-sm text-on-surface-faint">{empty}</p>
      ) : (
        <ul>{all ? rows : rows.slice(0, SHOWN)}</ul>
      )}
      {rows.length > SHOWN && (
        <Button variant="link" size="sm" className="px-0" onClick={() => setAll(!all)}>
          {all ? 'Show fewer' : `Show all ${rows.length}`}
        </Button>
      )}
    </section>
  );
}

export default function SavedQueries({ library, onOpen, onRename, onDelete, onSaveRecent, onClearRecent }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-title-sm">Saved and recent</h3>
        <p className="text-body-sm text-on-surface-muted">Kept in this browser only.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        <Section title="Saved" count={library.saved.length} empty="Nothing saved yet. Save a query to keep it here.">
          {library.saved.map((entry) => (
            <SavedRow key={entry.id} entry={entry} onOpen={onOpen} onRename={onRename} onDelete={onDelete} />
          ))}
        </Section>
        <Section
          title="Recent"
          count={library.recent.length}
          empty="Queries you copy or download appear here."
          action={
            library.recent.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearRecent}>
                Clear recent
              </Button>
            )
          }
        >
          {library.recent.map((entry) => (
            <SavedRow key={entry.id} entry={entry} onOpen={onOpen} onSave={onSaveRecent} />
          ))}
        </Section>
      </CardContent>
    </Card>
  );
}
