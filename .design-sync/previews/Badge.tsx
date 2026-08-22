import { Badge } from 'russ-tools';

const row = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } as const;

const CATEGORIES = ['network', 'azure', 'microsoft', 'security', 'developer', 'content'];

// The default variant tints itself from the ambient `--cat`, so a badge takes
// the hue of whatever tool it belongs to. Setting --cat per item is how the
// shell renders a mixed grid.
export const CategoryHues = () => (
  <div style={row}>
    {CATEGORIES.map((c) => (
      <span key={c} style={{ '--cat': `var(--color-category-${c})` }}>
        <Badge>{c}</Badge>
      </span>
    ))}
  </div>
);

export const StatusVariants = () => (
  <div style={row}>
    <Badge variant="success">valid</Badge>
    <Badge variant="warning">expiring</Badge>
    <Badge variant="destructive">expired</Badge>
    <Badge variant="info">cached</Badge>
  </div>
);

export const NeutralVariants = () => (
  <div style={row}>
    <Badge variant="secondary">TLS 1.3</Badge>
    <Badge variant="outline">RS256</Badge>
    <Badge variant="secondary">TTL 3600</Badge>
  </div>
);

export const AsRecordType = () => (
  <div style={row}>
    <Badge>A</Badge>
    <Badge>AAAA</Badge>
    <Badge>MX</Badge>
    <Badge>TXT</Badge>
    <Badge>NS</Badge>
    <Badge>CNAME</Badge>
  </div>
);
