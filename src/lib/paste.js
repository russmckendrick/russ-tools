/**
 * The index's paste dispatcher: one string in, a ranked list of tools that can
 * read it out.
 *
 * The homepage ships no React — it is a prerendered catalogue plus one bundled
 * module script — so everything imported here has to be dependency-free. That
 * rules out `ssl-checker/lib/sslUtils.js` and `microsoft-portals/lib/
 * tenantLookup.js`, which both pull `@/core`, and it is why `hostname.js`
 * exists rather than a fourth copy of their domain regex.
 *
 * Ranking, not routing, is the point. Five tools accept a bare hostname, so
 * "paste example.com and go" cannot be a single destination without silently
 * hiding four tools that wanted the same input. The caller renders one chip
 * per suggestion and follows the first on Enter.
 */

import { parseIPv4, parseIPv4Cidr } from '../tools/subnet-calculator/lib/ipv4.js';
import { parseIPv6, parseIPv6Cidr } from '../tools/subnet-calculator/lib/ipv6.js';
import { looksLikeCron } from '../tools/cron-builder/lib/cron.js';
import { cleanHostname, isHostname } from './hostname.js';

/** A pasted value long enough to be a file is not a link. */
const MAX_LENGTH = 2000;

/**
 * A path segment, with colons left alone.
 *
 * `encodeURIComponent` escapes `:`, which would render every IPv6 deep link as
 * `2001%3Adb8%3A%3A1`. A colon is a legal `pchar` and the route fixture frozen
 * in `e2e/deeplinks.spec.js` carries literal ones, so escaping them would both
 * diverge from the contract and make the site's shareable links unreadable.
 */
const seg = (value) => encodeURIComponent(value).replace(/%3A/gi, ':');

/**
 * A JWT is three base64url segments whose header parses to a JOSE object.
 *
 * Structure alone is not enough — `a.b.c` is three segments — and the payload
 * is not safe to lean on either, because an unsecured JWT can carry anything.
 * The header is the part RFC 7515 constrains: an object, and `alg` is
 * REQUIRED. `jose` is deliberately not imported; `decodeJwt` throws on exactly
 * the tokens this needs to reject, so a try/catch around a dependency would be
 * more code than the check itself.
 */
function isJwt(value) {
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  if (!parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return false;
  try {
    const json = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
    const header = JSON.parse(json);
    return typeof header === 'object' && header !== null && typeof header.alg === 'string';
  } catch {
    return false;
  }
}

/**
 * If a whole URL was pasted, everything downstream should see its host.
 *
 * This has to happen before the IP tests, not inside the hostname test:
 * `https://10.0.0.1:8443/` names an address, and reading it only at the
 * hostname step left it falling through to the encoder. IPv6 literals arrive
 * bracketed from `URL.hostname`, and the brackets are URL syntax rather than
 * part of the address.
 */
function subject(value) {
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  const host = cleanHostname(value);
  return host.replace(/^\[|\]$/g, '') || value;
}

const tool = (toolId, label, path, href, why) => ({ toolId, label, path, href, why });

/**
 * Which tools will take this?
 *
 * Order is most-specific-first, and each branch returns rather than
 * accumulating, because the shapes are mutually exclusive once the collisions
 * below are settled:
 *
 *   - a bare word is both `detectBase64`-true and "domain-shaped" under the
 *     repo's older regexes. `isHostname` requires a real dotted name, so the
 *     word falls to the encoder, which is where a word belongs.
 *   - a JWT's segments are individually base64, so JWT is tested first. There
 *     is no collision the other way: a dotted string is not base64.
 *   - an IPv4 address is dot-separated like a hostname, so the exact IP
 *     parsers run before the hostname pattern.
 *   - a cron expression is only digits and punctuation in five fields, which
 *     nothing else here satisfies.
 *
 * The list is never empty for usable input: base64 encodes anything, so the
 * panel has no dead end to design a state for.
 *
 * @param {string} input
 * @returns {Array<{ toolId: string, label: string, path: string, href: string, why: string }>}
 */
export function suggest(input) {
  if (typeof input !== 'string') return [];
  const raw = input.trim();
  if (!raw || raw.length > MAX_LENGTH) return [];

  const value = subject(raw);

  if (isJwt(value)) {
    return [tool('jwt', 'JWT Decoder', '/jwt', `/jwt/${seg(value)}`, 'JWT')];
  }

  const cidr = parseIPv4Cidr(value) ?? parseIPv6Cidr(value);
  if (cidr && cidr.prefix !== null) {
    // The slash between address and prefix is a real segment boundary —
    // /subnet-calculator/:ip/:prefix — so the two halves are encoded
    // separately and joined with a literal one.
    return [
      tool(
        'subnet-calculator',
        'Subnet Calculator',
        '/subnet-calculator',
        `/subnet-calculator/${seg(cidr.address)}/${cidr.prefix}`,
        'CIDR'
      ),
    ];
  }

  if (parseIPv4(value) !== null || parseIPv6(value) !== null) {
    return [
      tool('subnet-calculator', 'Subnet Calculator', '/subnet-calculator', `/subnet-calculator/${seg(value)}`, 'IP address'),
      tool('whois-lookup', 'WHOIS Lookup', '/whois-lookup', `/whois-lookup/${seg(value)}`, 'IP address'),
    ];
  }

  if (looksLikeCron(value)) {
    // Normalised, because the tool's translator splits on a single space
    // where its validator splits on any run of whitespace.
    const expression = value.replace(/\s+/g, ' ');
    return [tool('cron-builder', 'CRON Builder', '/cron', `/cron/${seg(expression)}`, 'cron expression')];
  }

  if (isHostname(value)) {
    // Ordered by how little each one presumes: DNS answers a question about
    // any host at all, WHOIS presumes a registry, SSL presumes an HTTPS
    // service, and the last two presume Microsoft.
    const host = cleanHostname(value);
    return [
      tool('dns-lookup', 'DNS Lookup', '/dns-lookup', `/dns-lookup/${seg(host)}`, 'domain'),
      tool('whois-lookup', 'WHOIS Lookup', '/whois-lookup', `/whois-lookup/${seg(host)}`, 'domain'),
      tool('ssl-checker', 'SSL Checker', '/ssl-checker', `/ssl-checker/${seg(host)}`, 'domain'),
      tool('tenant-lookup', 'Tenant Lookup', '/tenant-lookup', `/tenant-lookup/${seg(host)}`, 'domain'),
      tool('microsoft-portals', 'Microsoft Portals', '/microsoft-portals', `/microsoft-portals/${seg(host)}`, 'domain'),
    ];
  }

  // The catch-all, and the reason the list is total. Base64 decides
  // encode-vs-decode inside the tool itself (`base64/island.jsx` sniffs the
  // value on mount), so anything text-shaped has somewhere useful to land.
  // The raw paste, not the URL-reduced subject: this is the branch for things
  // that were never a name.
  return [tool('base64', 'Base64 Encoder', '/base64', `/base64/${encodeURIComponent(raw)}`, 'text')];
}
