import React, { useMemo } from 'react';
import { highlightKql } from '../lib/highlight.js';
import './kql.css';

export default function KqlEditor({ id, value, onChange }) {
  const html = useMemo(() => highlightKql(value), [value]);
  return (
    <div className="kql-editor rounded-md border border-outline-strong bg-surface-raised focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-surface-raised">
      <pre aria-hidden="true">
        <code dangerouslySetInnerHTML={{ __html: `${html}\n` }} />
      </pre>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        placeholder={'SigninLogs\n| where TimeGenerated > ago(24h)\n| summarize count() by UserPrincipalName'}
      />
    </div>
  );
}
