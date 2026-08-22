import { Button } from 'russ-tools';

const row = { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' } as const;

export const Variants = () => (
  <div style={row}>
    <Button>Look up</Button>
    <Button variant="secondary">Copy</Button>
    <Button variant="outline">Cancel</Button>
    <Button variant="ghost">Reset</Button>
    <Button variant="destructive">Delete all</Button>
    <Button variant="link">View docs</Button>
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const Disabled = () => (
  <div style={row}>
    <Button disabled>Look up</Button>
    <Button variant="secondary" disabled>
      Copy
    </Button>
    <Button variant="outline" disabled>
      Cancel
    </Button>
  </div>
);
