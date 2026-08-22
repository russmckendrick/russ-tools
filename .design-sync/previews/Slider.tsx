import { Label, Slider } from 'russ-tools';

export const PasswordLength = () => (
  <div style={{ display: 'grid', gap: 10, maxWidth: 380 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Label htmlFor="len">Length</Label>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-on-surface-muted)' }}>24</span>
    </div>
    <Slider id="len" defaultValue={[24]} min={8} max={64} step={1} />
  </div>
);

export const Positions = () => (
  <div style={{ display: 'grid', gap: 22, maxWidth: 380 }}>
    <Slider defaultValue={[10]} min={0} max={100} />
    <Slider defaultValue={[50]} min={0} max={100} />
    <Slider defaultValue={[90]} min={0} max={100} />
  </div>
);
