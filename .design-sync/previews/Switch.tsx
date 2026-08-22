import { Label, Switch } from 'russ-tools';

const row = { display: 'flex', alignItems: 'center', gap: 8 } as const;

export const States = () => (
  <div style={{ display: 'grid', gap: 14 }}>
    <div style={row}>
      <Switch id="on" defaultChecked />
      <Label htmlFor="on">Checked</Label>
    </div>
    <div style={row}>
      <Switch id="off" />
      <Label htmlFor="off">Unchecked</Label>
    </div>
    <div style={row}>
      <Switch id="dis" disabled />
      <Label htmlFor="dis">Disabled</Label>
    </div>
  </div>
);

export const Settings = () => (
  <div style={{ display: 'grid', gap: 14, maxWidth: 380 }}>
    <div style={row}>
      <Switch id="dnssec" defaultChecked />
      <Label htmlFor="dnssec">Validate DNSSEC</Label>
    </div>
    <div style={row}>
      <Switch id="trace" />
      <Label htmlFor="trace">Show full resolution trace</Label>
    </div>
    <div style={row}>
      <Switch id="ipv6" defaultChecked />
      <Label htmlFor="ipv6">Include AAAA records</Label>
    </div>
  </div>
);
