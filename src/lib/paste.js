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
 * `licenses.js` passes that test: its 426 KB dataset sits behind a dynamic
 * import inside `loadLicenses()`, so importing `detectQueryKind` costs the
 * index a few lines of module and nothing else. Reusing it is the point — the
 * tool's own definition of "that is a SKU part number" is the only one that
 * can be right about it.
 *
 * Ranking, not routing, is the point. Seven tools accept a bare hostname, so
 * "paste example.com and go" cannot be a single destination without silently
 * hiding four tools that wanted the same input. The caller renders one chip
 * per suggestion and follows the first on Enter.
 */

import { parseIPv4, parseIPv4Cidr } from '../tools/subnet-calculator/lib/ipv4.js';
import { parseIPv6, parseIPv6Cidr } from '../tools/subnet-calculator/lib/ipv6.js';
import { looksLikeCron } from '../tools/cron-builder/lib/cron.js';
import { detectQueryKind } from '../tools/m365-licenses/lib/licenses.js';
import { cleanHostname, isHostname } from './hostname.js';

/** A pasted value long enough to be a file is not a link. */
const MAX_LENGTH = 2000;

/** The one shape two tools share: an Azure role id and a Microsoft 365 SKU id. */
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ASN = /^(?:AS)?\d{1,10}$/i;

/**
 * A Microsoft licence code, which is what people actually have: `E3`, `E5`,
 * `F1`, `F3`, `A1`/`A3`/`A5`, `G3`/`G5`, `P1`/`P2`, `BP`. One or two letters
 * and one or two digits, and nothing else on this site reads that shape.
 *
 * The family prefix is optional and captured away, because "M365 E3" is how it
 * is said and `/m365-licenses/m365 e3` finds nothing: the decoder searches by
 * literal substring, so the link carries the code alone. Reducing a pasted
 * value to the part a tool can read is what `subject()` already does for URLs.
 */
const LICENCE_CODE =
  /^(?:(?:microsoft|office|m|o)\s*365\s+|ems\s+|win(?:dows)?\s+)?([a-z]{1,2}\d{1,2})$/i;

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
 *   - a GUID is dashed hex and matches nothing above it; a SKU part number is
 *     upper-case and underscored and a licence code is two letters and a
 *     digit, and both are offered ahead of — not instead of — the encoder,
 *     because neither test consults the licence dataset.
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
    const normalized = `${cidr.address}/${cidr.prefix}`;
    return [
      tool(
        'subnet-calculator',
        'Subnet Calculator',
        '/subnet-calculator',
        `/subnet-calculator/${seg(cidr.address)}/${cidr.prefix}`,
        'CIDR'
      ),
      tool('cidr-workbench', 'CIDR Workbench', '/cidr-workbench', `/cidr-workbench/${seg(normalized)}`, 'CIDR'),
      tool('bgp-explorer', 'BGP Explorer', '/bgp-explorer', `/bgp-explorer/${seg(normalized)}`, 'CIDR'),
    ];
  }

  if (parseIPv4(value) !== null || parseIPv6(value) !== null) {
    return [
      tool('subnet-calculator', 'Subnet Calculator', '/subnet-calculator', `/subnet-calculator/${seg(value)}`, 'IP address'),
      tool('whois-lookup', 'WHOIS Lookup', '/whois-lookup', `/whois-lookup/${seg(value)}`, 'IP address'),
      tool('bgp-explorer', 'BGP Explorer', '/bgp-explorer', `/bgp-explorer/${seg(value)}`, 'IP address'),
      tool('azure-service-tags', 'Azure Service Tags', '/azure-service-tags', `/azure-service-tags/${seg(value)}`, 'IP address'),
    ];
  }

  if (looksLikeCron(value)) {
    // Normalised, because the tool's translator splits on a single space
    // where its validator splits on any run of whitespace.
    const expression = value.replace(/\s+/g, ' ');
    return [tool('cron-builder', 'CRON Builder', '/cron', `/cron/${seg(expression)}`, 'cron expression')];
  }

  if (ASN.test(value)) {
    const asn = value.toUpperCase().startsWith('AS') ? value.toUpperCase() : `AS${value}`;
    return [tool('bgp-explorer', 'BGP Explorer', '/bgp-explorer', `/bgp-explorer/${asn}`, 'autonomous system number')];
  }

  /*
    A bare GUID is genuinely two answers, which is the case this panel was
    built for. Azure role definitions and Microsoft 365 SKUs and service plans
    are all identified by one, and nothing in the string says which — an RBAC
    id copied out of a Bicep template and a SKU id copied out of a Graph
    response are the same 36 characters. Both are offered; RBAC leads because
    role ids are the ones people paste from something they are editing.
  */
  if (GUID.test(value)) {
    return [
      tool('azure-rbac', 'Azure RBAC', '/azure-rbac', `/azure-rbac/${seg(value)}`, 'GUID'),
      tool('m365-licenses', 'M365 Licences', '/m365-licenses', `/m365-licenses/${seg(value)}`, 'GUID'),
    ];
  }

  /*
    Two ways of naming a licence, one destination.

    A SKU part number — `SPE_E3`, `ENTERPRISEPACK` — is read by the licence
    tool's own classifier rather than by a fifth copy of its regex here. A
    licence code — `E3`, `M365 E5` — is the shorthand people actually carry,
    and the decoder resolves a partial by substring, so it lands on a real
    result rather than an empty state.

    The encoder is kept in the list behind both, because neither test consults
    the dataset: `detectQueryKind` is deliberately loose over there (it only
    has to beat "name"), `DEADBEEF` is part-number-shaped, and `E7` is
    code-shaped without being a licence anyone sells.
  */
  const licence = LICENCE_CODE.exec(value);
  if (licence || detectQueryKind(value) === 'partNumber') {
    const query = licence ? licence[1] : value;
    return [
      tool(
        'm365-licenses',
        'M365 Licences',
        '/m365-licenses',
        `/m365-licenses/${seg(query)}`,
        licence ? 'licence code' : 'SKU part number'
      ),
      tool('base64', 'Base64 Encoder', '/base64', `/base64/${encodeURIComponent(raw)}`, 'text'),
    ];
  }

  if (isHostname(value)) {
    // Ordered by how little each one presumes: general DNS answers first,
    // then focused mail and DNSSEC analysis, registration, TLS and Microsoft.
    const host = cleanHostname(value);
    return [
      tool('dns-lookup', 'DNS Lookup', '/dns-lookup', `/dns-lookup/${seg(host)}`, 'domain'),
      tool('email-dns-analyser', 'Email DNS', '/email-dns-analyser', `/email-dns-analyser/${seg(host)}`, 'domain'),
      tool('dnssec-checker', 'DNSSEC Checker', '/dnssec-checker', `/dnssec-checker/${seg(host)}`, 'domain'),
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
