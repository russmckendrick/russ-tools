import { Separator } from 'russ-tools';

export const Horizontal = () => (
  <div style={{ maxWidth: 420 }}>
    <div style={{ padding: '4px 0', fontSize: 13 }}>Resolved records</div>
    <Separator />
    <div style={{ padding: '4px 0', fontSize: 13, color: 'var(--color-on-surface-muted)' }}>
      Queried 1.1.1.1 in 24ms
    </div>
  </div>
);

export const Vertical = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
    <span>IPv4</span>
    <Separator orientation="vertical" style={{ height: 20 }} />
    <span>/24</span>
    <Separator orientation="vertical" style={{ height: 20 }} />
    <span>254 hosts</span>
  </div>
);
