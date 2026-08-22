import { Progress } from 'russ-tools';

export const Values = () => (
  <div style={{ display: 'grid', gap: 18, maxWidth: 380 }}>
    <Progress value={12} />
    <Progress value={48} />
    <Progress value={91} />
    <Progress value={100} />
  </div>
);

export const Labelled = () => (
  <div style={{ display: 'grid', gap: 8, maxWidth: 380 }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        color: 'var(--color-on-surface-muted)',
      }}
    >
      <span>Checking certificate chain</span>
      <span style={{ fontFamily: 'var(--font-mono)' }}>3 / 5</span>
    </div>
    <Progress value={60} />
  </div>
);
