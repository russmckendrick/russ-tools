import { ToolIcon } from 'russ-tools';

// The glyph renders with fill="currentColor", so it takes the ambient --cat.
// Each cell below sets the hue the way ToolLayout/ToolCard do.
const cell = {
  display: 'grid',
  justifyItems: 'center',
  gap: 6,
  fontSize: 11,
  color: 'var(--color-on-surface-muted)',
} as const;

const TOOLS: Array<[string, string, string]> = [
  ['dns', 'network', 'DNS Lookup'],
  ['lan', 'network', 'Subnet'],
  ['token', 'developer', 'JWT'],
  ['password', 'security', 'Password'],
  ['policy', 'security', 'SSL'],
  ['corporate-fare', 'microsoft', 'Tenant'],
  ['data-object', 'developer', 'Data'],
  ['campaign', 'content', 'Buzzword'],
];

export const CategoryHues = () => (
  <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
    {TOOLS.map(([name, category, label]) => (
      <div key={name} style={{ ...cell, '--cat': `var(--color-category-${category})` }}>
        <ToolIcon name={name} style={{ color: 'var(--cat)' }} />
        <span>{label}</span>
      </div>
    ))}
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', '--cat': 'var(--color-category-network)' }}>
    <ToolIcon name="dns" size={16} style={{ color: 'var(--cat)' }} />
    <ToolIcon name="dns" size={24} style={{ color: 'var(--cat)' }} />
    <ToolIcon name="dns" size={34} style={{ color: 'var(--cat)' }} />
    <ToolIcon name="dns" size={48} style={{ color: 'var(--cat)' }} />
  </div>
);
