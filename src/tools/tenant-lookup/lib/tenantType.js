/**
 * A tenant kind, not a verdict on it — the category hue for the known kinds,
 * neutral for anything unrecognised. One implementation: the island and
 * TenantInfoDisplay used to hold byte-identical copies.
 */
export function getTenantTypeColor(tenantType) {
  switch (tenantType) {
    case 'AAD':
    case 'B2C':
    case 'AADB2C':
      return 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]';
    default:
      return 'bg-surface-inset text-on-surface-muted';
  }
}
