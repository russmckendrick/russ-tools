import { Input, Label } from 'russ-tools';

const field = { display: 'grid', gap: 6, maxWidth: 360 } as const;

export const WithLabel = () => (
  <div style={field}>
    <Label htmlFor="domain">Domain</Label>
    <Input id="domain" defaultValue="russ.tools" />
  </div>
);

export const Placeholder = () => (
  <div style={field}>
    <Label htmlFor="cidr">Network</Label>
    <Input id="cidr" placeholder="10.0.0.0/16" />
  </div>
);

export const States = () => (
  <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
    <Input defaultValue="example.com" />
    <Input placeholder="Disabled" disabled />
    <Input type="password" defaultValue="correct-horse-battery" />
  </div>
);
