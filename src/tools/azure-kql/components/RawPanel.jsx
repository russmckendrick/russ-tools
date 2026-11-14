import React from 'react';
import { Copy, Download, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import KqlEditor from './KqlEditor.jsx';

export default function RawPanel({ kql, onChange, onCopy, onSave, onDownload }) {
  const empty = !kql.trim();
  return (
    <Card emphasis>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <h3 className="text-title-sm">
              <Label htmlFor="kql-editor" className="text-title-sm">
                Query
              </Label>
            </h3>
            <p className="text-body-sm text-on-surface-muted">Write or paste KQL. Nothing here is checked or changed.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={onCopy} disabled={empty}>
              <Copy aria-hidden="true" />
              Copy query
            </Button>
            <Button variant="outline" size="sm" onClick={onSave} disabled={empty}>
              <Star aria-hidden="true" />
              <span className="max-sm:sr-only">Save</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload} disabled={empty}>
              <Download aria-hidden="true" />
              <span className="max-sm:sr-only">Download</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <KqlEditor id="kql-editor" value={kql} onChange={onChange} />
      </CardContent>
    </Card>
  );
}
