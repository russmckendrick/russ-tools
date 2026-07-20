import React, { useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { HelpDialog } from '@/components/ui/help-dialog';
import { extractHelpMarkdown } from '@/lib/helpMarkdown';

export default function ToolHelp({ tool }) {
  const [markdown, setMarkdown] = useState('');
  const [status, setStatus] = useState('idle');

  const handleOpenChange = useCallback(
    async (open) => {
      if (!open) {
        if (status === 'error') setStatus('idle');
        return;
      }
      if (status !== 'idle') return;

      setStatus('loading');
      try {
        const source = await tool.help();
        setMarkdown(extractHelpMarkdown(source.default));
        setStatus('ready');
      } catch (error) {
        console.error(`Failed to load help for ${tool.id}:`, error);
        setStatus('error');
      }
    },
    [status, tool]
  );

  return (
    <HelpDialog
      title={`${tool.title} help`}
      description="Guidance from this tool's documentation"
      onOpenChange={handleOpenChange}
    >
      {status === 'loading' && <p>Loading help…</p>}
      {status === 'error' && (
        <p>Help could not be loaded. Close this panel and try again.</p>
      )}
      {status === 'ready' && <ReactMarkdown components={markdownComponents}>{markdown}</ReactMarkdown>}
    </HelpDialog>
  );
}

const markdownComponents = {
  h2: ({ children }) => (
    <h3 className="font-mono text-label-caps uppercase text-on-surface-faint">{children}</h3>
  ),
  h3: ({ children }) => <h4 className="text-title-sm text-on-surface">{children}</h4>,
  p: ({ children }) => <p className="text-body-sm text-on-surface-muted">{children}</p>,
  ol: ({ children }) => (
    <ol className="ml-5 list-decimal space-y-2 marker:font-mono marker:text-[var(--cat)]">
      {children}
    </ol>
  ),
  ul: ({ children }) => (
    <ul className="ml-5 list-disc space-y-2 marker:text-[var(--cat)]">{children}</ul>
  ),
  li: ({ children }) => <li className="pl-1 text-body-sm text-on-surface-muted">{children}</li>,
  strong: ({ children }) => <strong className="text-on-surface">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded-sm bg-surface-inset px-1 py-0.5 font-mono text-data-sm text-on-surface">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-md border border-outline bg-surface-inset p-3 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  a: ({ children, href }) => (
    <a className="text-primary underline underline-offset-2" href={href}>
      {children}
    </a>
  ),
};
