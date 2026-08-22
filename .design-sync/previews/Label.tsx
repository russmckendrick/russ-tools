import { Input, Label, Switch } from 'russ-tools';

export const WithInput = () => (
  <div style={{ display: 'grid', gap: 6, maxWidth: 360 }}>
    <Label htmlFor="token">JWT</Label>
    <Input id="token" placeholder="eyJhbGciOiJIUzI1NiIs…" />
  </div>
);

export const WithSwitch = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <Switch id="dnssec" defaultChecked />
    <Label htmlFor="dnssec">Validate DNSSEC</Label>
  </div>
);

export const Stacked = () => (
  <div style={{ display: 'grid', gap: 14, maxWidth: 360 }}>
    <div style={{ display: 'grid', gap: 6 }}>
      <Label htmlFor="a">Record type</Label>
      <Input id="a" defaultValue="MX" />
    </div>
    <div style={{ display: 'grid', gap: 6 }}>
      <Label htmlFor="b">Resolver</Label>
      <Input id="b" defaultValue="1.1.1.1" />
    </div>
  </div>
);
