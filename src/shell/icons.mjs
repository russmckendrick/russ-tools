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
  subnet: '<rect x="3.2" y="4.5" width="17.6" height="15" rx="1.6"/><path d="M3.2 10.2h17.6M9.4 10.2v9.3M15.2 4.5v5.7"/>',
  /** A wrapped globe: a name resolved across the network. */
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5a13 13 0 0 1 0 17a13 13 0 0 1 0-17Z"/>',
  /** A lens over a record: registration detail looked up. */
  whois: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m19.6 19.6-4.3-4.3"/><path d="M8.2 9.4h5.2M8.2 12.2h3.2"/>',
  /** A funnel: a query narrowing a stream of logs. */
  filter: '<path d="M3.6 5h16.8l-6.6 7.6v6.1l-3.6 1.8v-7.9z"/>',
  /** A luggage tag: a resource labelled to a convention. */
  tag: '<path d="M3.4 11.6V4.6a1.3 1.3 0 0 1 1.3-1.3h7l9.1 9.1-8.3 8.3z"/><circle cx="7.6" cy="7.5" r="1.35"/>',
  /** A grid of tiles with one leaving: deep links out to many portals. */
  portals: '<rect x="3.3" y="3.3" width="7" height="7" rx="1"/><rect x="13.7" y="3.3" width="7" height="7" rx="1"/><rect x="3.3" y="13.7" width="7" height="7" rx="1"/><path d="M14 20.4l6.4-6.4m0 0h-4.3m4.3 0v4.3"/>',
  /** A building with a lens: the organisation behind a domain. */
  tenant: '<path d="M4.4 20.6V4.9a1.2 1.2 0 0 1 1.2-1.2h7.8a1.2 1.2 0 0 1 1.2 1.2v15.7"/><path d="M2.4 20.6h13"/><path d="M7.4 7.9h3.4M7.4 11.6h3.4"/><circle cx="18.6" cy="15.4" r="3.1"/>',
  /** A certificate with a ribbon: an issued and dated credential. */
  cert: '<rect x="2.8" y="4.2" width="18.4" height="11.4" rx="1.6"/><path d="M6.4 8.1h11M6.4 11.4h5.6"/><path d="M14.9 17.1v4.3l2.6-1.5 2.6 1.5v-4.3"/>',
  /** Three segments: a JWT's header, payload and signature. */
  jwt: '<rect x="1.8" y="9" width="5.7" height="6" rx="1.2"/><rect x="9.15" y="9" width="5.7" height="6" rx="1.2"/><rect x="16.5" y="9" width="5.7" height="6" rx="1.2"/>',
  /** A key: a generated secret. */
  key: '<circle cx="6.9" cy="12" r="3.6"/><path d="M10.5 12h10.6m-3.4 0v3.1m-3.3-3.1v2.4"/>',
  /** A clock: a schedule expressed in five fields. */
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 6.9V12l3.6 2.1"/>',
  /** Two opposed arrows: a format converted and converted back. */
  swap: '<path d="M3.6 8.1h13.1m0 0-3.4-3.4m3.4 3.4-3.4 3.4"/><path d="M20.4 15.9H7.3m0 0 3.4-3.4m-3.4 3.4 3.4 3.4"/>',
  /** Braces around a divider: text encoded into another alphabet. */
  braces: '<path d="M8.4 3.9c-2.6 0-2.6 5.1-2.6 8.1s0 8.1 2.6 8.1"/><path d="M15.6 3.9c2.6 0 2.6 5.1 2.6 8.1s0 8.1-2.6 8.1"/><path d="M9.9 12h4.2"/>',
  /** A ruled table: rows, a header and an aligned column. */
  table: '<rect x="3.2" y="4.4" width="17.6" height="15.2" rx="1.6"/><path d="M3.2 9.5h17.6M3.2 14.6h17.6M9.6 9.5v10.1"/>',
  /** A speech bubble full of filler: words that say nothing. */
  bubble: '<path d="M20.2 4.2H3.8a1.1 1.1 0 0 0-1.1 1.1v9.6a1.1 1.1 0 0 0 1.1 1.1h3.5v3.8l4.3-3.8h8.6a1.1 1.1 0 0 0 1.1-1.1V5.3a1.1 1.1 0 0 0-1.1-1.1Z"/><path d="M6.6 8.4h9.6M6.6 11.9h5.4"/>',
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
    'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ' +
    `stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
  );
}
