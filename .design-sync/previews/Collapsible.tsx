import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'russ-tools';

const pre = {
  margin: '10px 0 0',
  padding: 12,
  borderRadius: 6,
  background: 'var(--color-surface-inset)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  color: 'var(--color-on-surface-muted)',
  whiteSpace: 'pre-wrap',
} as const;

export const Open = () => (
  <div style={{ maxWidth: 520 }}>
    <Collapsible defaultOpen>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm">
          Raw response
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre style={pre}>
          {'{\n  "Status": 0,\n  "Answer": [\n    { "name": "russ.tools", "type": 1, "TTL": 300 }\n  ]\n}'}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  </div>
);

export const Closed = () => (
  <div style={{ maxWidth: 520 }}>
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm">
          Advanced options
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre style={pre}>Hidden until opened.</pre>
      </CollapsibleContent>
    </Collapsible>
  </div>
);
