/**
 * The shared tool icon set — drawn for this site, not taken from a library.
 *
 * Every glyph sits on a 24px grid and is built from the same few moves:
 * square-cornered boxes, circles, and straight strokes with round caps, at a
 * 1.75px `currentColor` line. Squared boxes rather than Lucide's rounded
 * ones are what make the set read as one family beside Datasheet's ruled
 * rows.
 *
 * The SVG child markup lives here so Astro and React render exactly the same
 * drawing; the stroke attributes live on the wrapper (`iconSvg` below and
 * `ui/tool-icon.jsx`), which must stay in agreement.
 *
 * The KEYS are the kebab-cased Lucide names the manifests already declared
 * under Stacks. They are kept as identifiers only, so no manifest and no
 * `<Tool>Icon.jsx` had to change — the comment beside each says which tool
 * it is drawn for. Generic interface glyphs inside the tools still come from
 * lucide-react.
 */

export const TOOL_ICONS = {
  // bgp-explorer: three peers, fully meshed
  route:
    '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 6h10M6 7.7l5 8.6M18 7.7l-5 8.6"/>',
  // cidr-workbench: two overlapping sets
  combine:
    '<path d="M4 4h11v11H4z"/><path d="M9 9h11v11H9z"/>',
  // dns-lookup
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  // zone-file-linter: a file that passed
  'file-diff':
    '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 14l2 2 4-4"/>',
  // email-dns-analyser
  'mail-check':
    '<path d="M3 6h18v12H3z"/><path d="M3 7l9 6 9-6"/>',
  // subnet-calculator: one block divided in two
  network:
    '<path d="M8 3h8v5H8z"/><path d="M3 16h7v5H3z"/><path d="M14 16h7v5h-7z"/><path d="M12 8v4M6.5 16v-4h11v4"/>',
  // whois-lookup
  'id-card':
    '<path d="M3 5h18v14H3z"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.6-1.6 5.4-1.6 6 0M14 10h4M14 14h4"/>',
  // azure-kql: a query over rows
  'search-code':
    '<path d="M4 6h9M4 11h5M4 16h5"/><circle cx="15.5" cy="14.5" r="3.5"/><path d="M18 17l3 3"/>',
  // azure-rbac
  'shield-user':
    '<path d="M12 3l7 3v5c0 5-3 8-7 10c-4-2-7-5-7-10V6z"/><circle cx="12" cy="10" r="2"/><path d="M8.5 16c1-2.5 6-2.5 7 0"/>',
  // azure-naming
  tag:
    '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
  // azure-service-tags
  tags:
    '<path d="M3 11V5h6l9 9-6 6z"/><path d="M13 5l8 8-6 7"/><circle cx="6.5" cy="8.5" r="1"/>',
  // conditional-access
  'file-lock-2':
    '<path d="M6 11h12v9H6z"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/><path d="M12 14.5v2.5"/>',
  // m365-licenses
  'receipt-text':
    '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  // microsoft-portals
  'layout-grid':
    '<path d="M4 4h7v7H4z"/><path d="M13 4h7v7h-7z"/><path d="M4 13h7v7H4z"/><path d="M13 13h7v7h-7z"/>',
  // tenant-lookup
  'building-2':
    '<path d="M5 21V4h9v17"/><path d="M14 9h5v12"/><path d="M3 21h18M8 8h3M8 12h3M8 16h3"/>',
  // dnssec-checker: a chain of trust
  'globe-lock':
    '<path d="M10 14a4 4 0 0 1 0-5.6l3-3a4 4 0 0 1 5.6 5.6l-1.5 1.5"/><path d="M14 10a4 4 0 0 1 0 5.6l-3 3a4 4 0 0 1-5.6-5.6l1.5-1.5"/>',
  // jwt: three parts between braces
  braces:
    '<path d="M8 4c-2 0-3 1-3 3v2c0 1.5-1 3-2 3c1 0 2 1.5 2 3v2c0 2 1 3 3 3"/><path d="M16 4c2 0 3 1 3 3v2c0 1.5 1 3 2 3c-1 0-2 1.5-2 3v2c0 2-1 3-3 3"/><path d="M12 8h.01M12 12h.01M12 16h.01"/>',
  // password-generator
  'key-round':
    '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M13.5 9.5l2 2"/>',
  // cert-decoder: a certificate with its seal and ribbon
  'file-badge':
    '<path d="M12.5 17H3V4h18v6.5"/><path d="M7 8.5h7M7 12h3.5"/><circle cx="17" cy="14" r="3.2"/><path d="M15 16.6V21l2-1.4 2 1.4v-4.4"/>',
  // ssl-checker
  'shield-check':
    '<path d="M12 3l7 3v5c0 5-3 8-7 10c-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  // http-headers: a response, its lines ticked off
  'list-checks':
    '<path d="M3 6.5l1.8 1.8L8 5M3 12.5l1.8 1.8L8 11M3 18.5l1.8 1.8L8 17"/><path d="M12 6.5h9M12 12.5h9M12 18.5h6"/>',
  // saml: an identity carried inside angle brackets
  'code-xml':
    '<path d="M7 7l-4 5 4 5M17 7l4 5-4 5"/><circle cx="12" cy="9.5" r="2"/><path d="M8.5 16.5c.8-2.6 6.2-2.6 7 0"/>',
  // base64
  binary:
    '<path d="M6 4v6M18 4v6M14 14v6M18 14v6"/><path d="M10 4h4v6h-4z"/><path d="M6 14h4v6H6z"/>',
  // hash: the sign itself
  hash:
    '<path d="M9.5 4L7.5 20M16.5 4l-2 16M4.5 9h15.5M4 15h15.5"/>',
  // uuid: a die, because a version 4 is a roll
  dices:
    '<path d="M4 4h16v16H4z"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"/>',
  // timestamp: an hourglass, so it is not a second clock beside cron's
  hourglass:
    '<path d="M6 3h12M6 21h12"/><path d="M7.5 3v3.5l4.5 5.5 4.5-5.5V3"/><path d="M7.5 21v-3.5l4.5-5.5 4.5 5.5V21"/>',
  // cron-builder
  'calendar-clock':
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  // data-converter
  'arrow-right-left':
    '<path d="M4 8h14M15 5l3 3-3 3"/><path d="M20 16H6M9 13l-3 3 3 3"/>',
  // markdown-table-tool
  table:
    '<path d="M3 5h18v14H3z"/><path d="M3 10h18M9 5v14M15 5v14"/>',
  // buzzword-ipsum: a speech bubble of filler
  megaphone:
    '<path d="M4 5h16v11H10l-4 4v-4H4z"/><path d="M8 9h8M8 12h5"/>',
};

/**
 * One glyph per index group, keyed by `categoryGroupId`. These head the
 * sections of the catalogue, where a number or a coloured rule used to.
 */
export const GROUP_ICONS = {
  network:
    '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5v4M12 11.5l-5.6 5.3M12 11.5l5.6 5.3"/>',
  'microsoft-azure':
    '<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 9.5a4.3 4.3 0 0 1 .5 8.5z"/>',
  security:
    '<path d="M12 3l7 3v5c0 5-3 8-7 10c-4-2-7-5-7-10V6z"/><circle cx="12" cy="10.5" r="1.5"/><path d="M12 12v3"/>',
  developer:
    '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/>',
  content:
    '<path d="M4 6h16M4 11h16M4 16h10"/>',
};

export const ICON_NAMES = Object.keys(TOOL_ICONS);

/**
 * Renders one icon as an inline SVG string.
 *
 * The wrapper carries the stroke contract — `fill="none"`, a 1.75px
 * `currentColor` stroke, round caps and joins.
 *
 * @param {string} name  a key of TOOL_ICONS (or of `set`)
 * @param {number} [size]
 * @param {Record<string, string>} [set]
 */
export function iconSvg(name, size = 17, set = TOOL_ICONS) {
  const paths = set[name];
  if (!paths) throw new Error(`unknown tool icon: ${name}`);
  return (
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" ` +
    `fill="none" stroke="currentColor" stroke-width="1.75" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
  );
}
