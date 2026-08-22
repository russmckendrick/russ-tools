/**
 * The canonical hostname predicate.
 *
 * The repo already had three domain regexes — `ssl-checker/lib/sslUtils.js`,
 * `microsoft-portals/lib/tenantLookup.js`, and a third inlined inside
 * `getTenantId` in that same file — and none of them can be reused here for
 * two reasons.
 *
 * The first is mechanical: both modules import `@/core`, and the index page
 * ships no JavaScript beyond one bundled module script. Importing either would
 * pull the API client onto a page that has no need of it.
 *
 * The second is behavioural, and it is the one that matters. All three accept
 * a dotless single label — `isValidDomain('test')` is `true` — which is
 * correct when a user has already told you they are typing a domain into a
 * domain field, and wrong here, where the same string has to be told apart
 * from a base64 blob. `detectBase64('test')` is also `true`. Something has to
 * break the tie, and requiring a real dotted name is the honest way to do it:
 * a bare word falls through to the encoder, which is where a bare word belongs.
 *
 * Consolidating the other three onto this module is deliberately left alone —
 * they carry their own tests and their own error strings.
 */

/**
 * A label is 1–63 chars of alphanumerics and hyphens, not starting or ending
 * with a hyphen, and optionally carrying a leading underscore — `_dmarc`,
 * `_acme-challenge` and `_sip._tcp` are the names people most often paste at a
 * DNS tool, and DNS Lookup is one of the five destinations here.
 *
 * The TLD is alphabetic and at least two characters. That is what keeps
 * `10.0.0.1` from arriving as a "domain", and it is the whole tie-break
 * against base64. It does NOT distinguish a real TLD from a file extension:
 * `notes.txt` reads as a hostname. Curating a TLD list to fix that is more
 * than the front door is worth, and offering DNS Lookup for `notes.txt` costs
 * a wasted click rather than a wrong answer.
 */
const LABEL = '_?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?';
const HOSTNAME = new RegExp(`^(?:${LABEL}\\.)+[a-z]{2,63}$`, 'i');

/**
 * Reduce whatever was pasted to the host it names.
 *
 * Handles the three things people actually paste instead of a bare hostname:
 * a full URL, an email address, and a name with the root dot still on it.
 * Anything it cannot parse it returns trimmed and lowercased, so the caller
 * still gets a clean string to test.
 */
export function cleanHostname(input) {
  if (typeof input !== 'string') return '';
  let value = input.trim();
  if (!value) return '';

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    try {
      value = new URL(value).hostname;
    } catch {
      // Not a URL after all — fall through and treat it as a bare string.
    }
  }

  if (value.includes('@')) value = value.slice(value.lastIndexOf('@') + 1);

  value = value.split(/[/?#]/)[0];
  value = value.replace(/\.$/, '');
  return value.toLowerCase();
}

/**
 * Is this a dotted hostname? Total length is capped at 253 octets by RFC 1035;
 * the per-label cap lives in the pattern.
 */
export function isHostname(input) {
  const value = cleanHostname(input);
  return value.length > 0 && value.length <= 253 && HOSTNAME.test(value);
}
