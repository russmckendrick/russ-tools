/** Prints the `colors:` block of DESIGN.md front matter for one direction. Run: node _work/build-yaml.mjs hex */
import { PALETTES } from './palettes.mjs';
const id = process.argv[2] ?? 'hex';
const p = PALETTES[id];
const CATS = ['network', 'azure', 'microsoft', 'security', 'developer', 'content'];
const line = (k, v) => `  ${k}: "${v}"`;
const theme = (t, suffix) => {
  const T = p[t];
  const order = ['surface', 'surface-raised', 'surface-inset', 'outline', 'outline-strong', 'rule', 'on-surface', 'on-surface-muted', 'on-surface-faint', 'on-surface-dim', 'primary', 'primary-hover', 'on-primary'];
  const out = order.map((k) => line(k + suffix, T[k]));
  out.push(line('nav-active' + suffix, T['surface-inset']), line('footer' + suffix, T.footer));
  for (const k of ['success', 'warning', 'error', 'info', 'success-subtle', 'warning-subtle', 'info-subtle', 'error-subtle']) out.push(line(k + suffix, T[k]));
  for (const c of CATS) out.push(line(`category-${c}${suffix}`, T['primary-text']));
  return out;
};
const out = ['colors:', `  # ---- ${p.scheme} dark (unsuffixed: dark stays the CSS default) ----`, ...theme('dark', ''), '', `  # ---- ${p.scheme} light (\`-light\` suffix) ----`, ...theme('light', '-light'), '', '  # ---- Category fills: all the bright accent, as today ----'];
for (const c of CATS) out.push(line(`category-fill-${c}`, p.band['accent-bright']));
out.push(line('on-category-fill', p.band['on-accent-bright']), '', '  # ---- Accent as text ----', line('primary-text', p.dark['primary-text']), line('primary-text-light', p.light['primary-text']));
out.push('', '  # ---- Ink on a solid status fill ----', line('on-status', p.dark['on-status']), line('on-status-light', p.light['on-status']));
out.push('', '  # ---- The lip ----', line('shadow-ink', p.dark['shadow-ink']), line('shadow-ink-light', p.light['shadow-ink']));
out.push('', '  # ---- Ink on the footer ----', line('on-footer', p.dark['on-footer']), line('on-footer-muted', p.dark['on-footer-muted']), line('on-footer-light', p.light['on-footer']), line('on-footer-muted-light', p.light['on-footer-muted']));
out.push('', '  # ---- The band: identical in both themes ----');
for (const [k, v] of Object.entries(p.band)) out.push(line(k, v));
console.log(out.join('\n'));
