import React from 'react';
import { Copy, Download, PencilLine, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import KqlCode from './KqlCode.jsx';

export default function QueryPanel({ built, onCopy, onEdit, onSave, onDownload }) {
  const notes = built.problems.filter((problem) => problem.scope !== 'filter');

  return (
    <Card emphasis>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <h3 className="text-title-sm">Query</h3>
            <p className="font-mono text-data-sm text-on-surface-faint">{built.table}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={onCopy}>
              <Copy aria-hidden="true" />
              Copy query
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <PencilLine aria-hidden="true" />
              <span className="max-sm:sr-only">Edit as KQL</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onSave}>
              <Star aria-hidden="true" />
              <span className="max-sm:sr-only">Save</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download aria-hidden="true" />
              <span className="max-sm:sr-only">Download</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-body-md text-on-surface" aria-live="polite">
          {built.reading}
        </p>
        {notes.map((note) => (
          <p key={note.message} className="text-body-sm text-error">
            {note.message}
          </p>
        ))}
        <KqlCode kql={built.kql} />
      </CardContent>
    </Card>
  );
}
