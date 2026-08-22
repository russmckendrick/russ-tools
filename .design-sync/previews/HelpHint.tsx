import { HelpHint, Input, Label } from 'russ-tools';

// HelpHint is the field-level `i` beside one control, so its only true render
// is inside a real field row. It brings its own TooltipProvider.
export const BesideALabel = () => (
  <div style={{ display: 'grid', gap: 6, maxWidth: 340 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Label htmlFor="prefix">Prefix length</Label>
      <HelpHint content="Between /8 and /30. Smaller numbers mean larger networks." />
    </div>
    <Input id="prefix" defaultValue="/24" />
  </div>
);

export const InAForm = () => (
  <div style={{ display: 'grid', gap: 14, maxWidth: 340 }}>
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Label htmlFor="resolver">Resolver</Label>
        <HelpHint content="The recursive resolver queried. Defaults to 1.1.1.1." />
      </div>
      <Input id="resolver" defaultValue="1.1.1.1" />
    </div>
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Label htmlFor="ttl">Minimum TTL</Label>
        <HelpHint content="Records with a shorter TTL are refetched on each lookup." />
      </div>
      <Input id="ttl" defaultValue="300" />
    </div>
  </div>
);
