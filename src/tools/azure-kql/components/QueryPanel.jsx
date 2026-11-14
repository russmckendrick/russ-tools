import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, PencilLine, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import QueryLines from './QueryLines.jsx';

export function CopyButton({ onCopy, disabled }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Button size="sm" className="min-w-[7.25rem]" disabled={disabled} onClick={async () => setCopied(await onCopy())}>
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy query'}</span>
    </Button>
  );
}

export default function QueryPanel({ built, onCopy, onEdit, onSave, onDownload, onJump }) {
  const notes = built.problems.filter((problem) => problem.scope !== 'filter');

  return (
    <Card emphasis className="kql-pin">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <h3 className="text-title-sm">Query</h3>
            <p className="font-mono text-data-sm text-on-surface-faint">{built.table}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton onCopy={onCopy} />
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
        <p className="kql-reading text-body-md text-on-surface">{built.reading}</p>
        {notes.map((note) => (
          <p key={note.message} className="text-body-sm text-error">
            {note.message}
          </p>
        ))}
        <QueryLines lines={built.lines} onJump={onJump} />
        <p className="text-body-sm text-on-surface-faint [@media(pointer:coarse)]:hidden">Select a line to jump to the control that wrote it.</p>
      </CardContent>
    </Card>
  );
}
