import { useState } from 'react';
import { Button, ToolAction, ToolActionsProvider } from 'russ-tools';

// ToolAction portals into a row the shell owns, so the only honest preview
// composes it with its provider and a real target node. Without a provider it
// deliberately renders nothing.
const rowStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '8px 0',
  borderBottom: '1px solid var(--color-outline)',
  minHeight: 36,
} as const;

export const ActionRow = () => {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  return (
    <div style={{ maxWidth: 560 }}>
      <div ref={setTarget} style={rowStyle} />
      <ToolActionsProvider target={target}>
        <ToolAction>
          <Button variant="outline" size="sm">
            Share
          </Button>
        </ToolAction>
        <ToolAction>
          <Button variant="outline" size="sm">
            Help
          </Button>
        </ToolAction>
      </ToolActionsProvider>
      <p style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--color-on-surface-muted)' }}>
        Tool body. The actions above are portalled into the shell&apos;s row, not rendered here.
      </p>
    </div>
  );
};
