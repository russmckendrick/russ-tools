import { Label, Textarea } from 'russ-tools';

export const WithLabel = () => (
  <div style={{ display: 'grid', gap: 6, maxWidth: 460 }}>
    <Label htmlFor="jwt">Token</Label>
    <Textarea
      id="jwt"
      rows={5}
      defaultValue="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlJ1c3MifQ.dQw4w9WgXcQ"
    />
  </div>
);

export const Placeholder = () => (
  <div style={{ display: 'grid', gap: 6, maxWidth: 460 }}>
    <Label htmlFor="yaml">Paste YAML</Label>
    <Textarea id="yaml" rows={5} placeholder="key: value" />
  </div>
);

export const Disabled = () => (
  <div style={{ maxWidth: 460 }}>
    <Textarea rows={4} disabled defaultValue="Read-only output" />
  </div>
);
