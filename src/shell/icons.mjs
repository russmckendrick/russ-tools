/**
 * The bespoke tool icon set — one per tool, drawn on a 24px grid with a
 * 1.6px stroke, round caps and joins, no fill, inheriting `currentColor` so
 * the category hue applies automatically. See DESIGN.md, "Iconography".
 *
 * Each icon depicts what its tool operates on rather than a generic
 * abstraction, and no two tools share one. These replace the fifteen thin
 * @tabler wrappers in the old tree; a tool drops its wrapper when it ports.
 *
 * Generic UI glyphs (chevron, copy, external link) are not here — those come
 * from lucide-react, the project's only icon dependency.
 */

export const TOOL_ICONS = {
  /** Nested rectangles: a parent network carved into subnets. */
  subnet: '<rect x="8" y="3" width="8" height="5" rx="1.4"/><path d="M12 8v3M4.5 11h15M4.5 11v3M12 11v3M19.5 11v3"/><rect x="2" y="14" width="5" height="6" rx="1.3"/><rect x="9.5" y="14" width="5" height="6" rx="1.3"/><rect x="17" y="14" width="5" height="6" rx="1.3"/>',
  /** A wrapped globe: a name resolved across the network. */
  globe: '<circle cx="12" cy="12" r="8.7"/><path d="M3.3 12h17.4M12 3.3c2.2 2.4 3.3 5.3 3.3 8.7S14.2 18.3 12 20.7M12 3.3C9.8 5.7 8.7 8.6 8.7 12s1.1 6.3 3.3 8.7"/><circle cx="17.7" cy="8.2" r="1.15" fill="currentColor" stroke="none"/>',
  /** A lens over a record: registration detail looked up. */
  whois: '<rect x="3" y="4" width="12.5" height="16" rx="1.8"/><circle cx="7.8" cy="9" r="2"/><path d="M5.2 15c.8-1.6 1.7-2.3 2.8-2.3s2 .7 2.8 2.3"/><circle cx="17.4" cy="14.9" r="3.2"/><path d="m19.8 17.3 2.2 2.2"/>',
  /** A funnel: a query narrowing a stream of logs. */
  filter: '<path d="M3 5h18l-7 7.6v5.8l-4 2v-7.8z"/><path d="m17.5 3.2.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" fill="currentColor" stroke="none"/>',
  /** A luggage tag: a resource labelled to a convention. */
  tag: '<path d="M3.2 11.8V4.7c0-.8.7-1.5 1.5-1.5h7.1l9 9-8.6 8.6z"/><circle cx="7.3" cy="7.3" r="1.2" fill="currentColor" stroke="none"/><path d="M10.3 9.7h4.1M10.3 12.7h7.1"/>',
  /** A grid of tiles with one leaving: deep links out to many portals. */
  portals: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"/><circle cx="6.5" cy="6.5" r="1" fill="currentColor" stroke="none"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/><path d="m14 20 7-7m0 0h-4.7m4.7 0v4.7"/>',
  /** A building with a lens: the organisation behind a domain. */
  tenant: '<path d="M3.5 21V5c0-1 .8-1.8 1.8-1.8h8.4c1 0 1.8.8 1.8 1.8v16M2 21h15"/><circle cx="9.5" cy="8" r="1.5" fill="currentColor" stroke="none"/><path d="M6.7 13c.8-1.5 1.7-2.2 2.8-2.2s2 .7 2.8 2.2"/><circle cx="18.5" cy="16" r="3"/><path d="m20.7 18.2 1.8 1.8"/>',
  /** A certificate with a ribbon: an issued and dated credential. */
  cert: '<path d="M5 3h10l4 4v9H5zM15 3v4h4"/><path d="M8 9h7M8 12h4"/><circle cx="16.5" cy="17" r="3.3"/><path d="m15 17 1 1 2-2.2M14.5 19.7v2l2-1 2 1v-2"/>',
  /** Three segments: a JWT's header, payload and signature. */
  jwt: '<rect x="1.5" y="8.5" width="5.5" height="7" rx="1.4"/><rect x="9.25" y="8.5" width="5.5" height="7" rx="1.4"/><rect x="17" y="8.5" width="5.5" height="7" rx="1.4"/><circle cx="4.25" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19.75" cy="12" r="1" fill="currentColor" stroke="none"/><path d="M7 12h2.25M14.75 12H17"/>',
  /**
   * A masked field: the dots a generated password actually appears as, with
   * a cursor at the end. DESIGN.md asks an icon to depict what the tool
   * operates on — this tool produces a string into a password box, and a key
   * is the generic glyph for "security" rather than for this.
   */
  key: '<path d="m4.2 8.2.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7zM10.1 8.2l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7zM16 8.2l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill="currentColor" stroke="none"/><path d="M21 7v10"/>',
  /** A clock: a schedule expressed in five fields. */
  clock: '<circle cx="12" cy="9.5" r="6.7"/><path d="M12 5.4v4.1l3 1.8"/><circle cx="4" cy="20" r=".9" fill="currentColor" stroke="none"/><circle cx="8" cy="20" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="20" r=".9" fill="currentColor" stroke="none"/><circle cx="16" cy="20" r=".9" fill="currentColor" stroke="none"/><circle cx="20" cy="20" r=".9" fill="currentColor" stroke="none"/>',
  /** Two opposed arrows: a format converted and converted back. */
  swap: '<path d="M3 6h8M3 10h5M13 7h7m0 0-2.7-2.7M20 7l-2.7 2.7M21 18h-8M21 14h-5M11 17H4m0 0 2.7-2.7M4 17l2.7 2.7"/><circle cx="11" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  /** Braces around a divider: text encoded into another alphabet. */
  braces: '<path d="M8 3.2C5.5 3.2 5.5 7 5.5 9.3c0 1.7-.8 2.7-2.5 2.7 1.7 0 2.5 1 2.5 2.7C5.5 17 5.5 20.8 8 20.8M16 3.2c2.5 0 2.5 3.8 2.5 6.1 0 1.7.8 2.7 2.5 2.7-1.7 0-2.5 1-2.5 2.7 0 2.3 0 6.1-2.5 6.1"/><circle cx="10.2" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="13.8" cy="12" r="1" fill="currentColor" stroke="none"/>',
  /** A ruled table: rows, a header and an aligned column. */
  table: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9h18M3 14h18M9 9v11M15 9v11"/><path d="M4.5 5.5h15v2h-15z" fill="currentColor" fill-opacity=".18" stroke="none"/>',
  /** A speech bubble full of filler: words that say nothing. */
  bubble: '<path d="M20.5 4H3.5C2.7 4 2 4.7 2 5.5v10c0 .8.7 1.5 1.5 1.5H7v3.5l4.2-3.5h9.3c.8 0 1.5-.7 1.5-1.5v-10c0-.8-.7-1.5-1.5-1.5Z"/><path d="M6.5 8.2h5M6.5 13.2h7.5"/><circle cx="16.8" cy="9.2" r="1.2" fill="currentColor" stroke="none"/>',
};

export const ICON_NAMES = Object.keys(TOOL_ICONS);

/**
 * Renders one icon as an inline SVG string. Inline rather than sprited
 * because these are prerendered into static HTML — there is no runtime to
 * resolve a sprite reference, and fifteen small paths cost less than a
 * second request.
 *
 * @param {string} name  a key of TOOL_ICONS
 * @param {number} [size]
 */
export function iconSvg(name, size = 17) {
  const paths = TOOL_ICONS[name];
  if (!paths) throw new Error(`unknown tool icon: ${name}`);
  return (
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" ` +
    'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" ' +
    `stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
  );
}
