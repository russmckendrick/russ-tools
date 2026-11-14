import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { highlightKql } from '../lib/highlight.js';
import './kql.css';

export default function KqlCode({ kql, className }) {
  const html = useMemo(() => highlightKql(kql), [kql]);
  return (
    <pre
      className={cn('kql-code rounded-md border border-outline bg-surface-inset px-3.5 py-3', className)}
      tabIndex={0}
      aria-label="KQL query"
    >
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}
