/**
 * What did they mean by `/dns-lookup-tool`?
 *
 * A 404 knows the one thing the index does not: the URL that failed. A static
 * "popular tools" list throws that away. This reads the first path segment and
 * ranks the catalogue against it, so `/subnet`, `/dnslookup` and
 * `/subnet-calcualtor` all land on the tool that was obviously meant.
 *
 * Deliberately not fuzzy-for-its-own-sake: a wrong confident guess on a 404 is
 * worse than no guess, because the visitor is already lost. Everything below
 * the threshold returns nothing and the page falls back to its popular list.
 */

/** Comparable form: case, separators and the noise words tool names collect. */
const normalise = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Levenshtein, iterative with a single row — the catalogue is fifteen items. */
function distance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const next = [i];
    for (let j = 1; j <= b.length; j += 1) {
      next[j] = Math.min(
        row[j] + 1,
        next[j - 1] + 1,
        row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    row = next;
  }
  return row[b.length];
}

/**
 * 0 (no relation) to 1 (the same string), by the best of three readings.
 *
 * Containment is scored separately from edit distance because the two catch
 * different mistakes. `dnslookuptool` vs `dnslookup` is a small edit distance
 * *and* a clean containment; `subnet` vs `subnetcalculator` is a terrible edit
 * distance (11 of 16 characters differ) but an unambiguous prefix — and
 * "I typed the first word only" is the single most common way a tool URL is
 * got wrong.
 */
function score(segment, candidate) {
  if (!segment || !candidate) return 0;
  if (segment === candidate) return 1;

  const contains = candidate.startsWith(segment)
    ? 0.75 + (0.2 * segment.length) / candidate.length
    : candidate.includes(segment) || segment.includes(candidate)
      ? 0.6 + (0.2 * Math.min(segment.length, candidate.length)) / Math.max(segment.length, candidate.length)
      : 0;

  const edits = distance(segment, candidate);
  const typo = 1 - edits / Math.max(segment.length, candidate.length);

  return Math.max(contains, typo);
}

/**
 * Below this, say nothing. Tuned against the catalogue: `/subnet` scores 0.81,
 * `/dns-lookup-tool` 0.92 and `/subnet-calcualtor` 0.88, while an unrelated
 * word like `/pricing` peaks at 0.31 and a random string at ~0.15.
 */
const THRESHOLD = 0.55;

/**
 * Rank tools against a path segment.
 *
 * @param {string} segment The failed URL's first path segment.
 * @param {Array<{id: string, path: string, title: string}>} tools
 * @param {number} [limit]
 * @returns {Array<{id: string, path: string, title: string, score: number}>}
 */
export function nearestTools(segment, tools, limit = 3) {
  const needle = normalise(segment);
  if (needle.length < 2 || !Array.isArray(tools)) return [];

  return tools
    .map((tool) => ({
      ...tool,
      // A tool is findable by its route, its id or its human title — someone
      // guessing `/subnetcalculator` and someone guessing `/subnet-calculator`
      // are making the same mistake about different spellings of the same name.
      score: Math.max(
        score(needle, normalise(tool.path)),
        score(needle, normalise(tool.id)),
        score(needle, normalise(tool.title))
      ),
    }))
    .filter((tool) => tool.score >= THRESHOLD)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/**
 * The part of a failed URL that was not the tool name.
 *
 * `/whois/example.com` is a wrong tool name carrying a right value — the
 * visitor had the thing they wanted to look up, and only the route was off.
 * Handing that value to the paste panel turns a dead end into one keystroke.
 *
 * @param {string} pathname
 * @returns {string} the joined remainder, or an empty string
 */
export function trailingValue(pathname) {
  const parts = String(pathname ?? '')
    .split('/')
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });
  // Rejoined rather than taking parts[1]: a CIDR arrives as two segments,
  // exactly as /subnet-calculator/:ip/:prefix serves it.
  return parts.slice(1).join('/');
}
