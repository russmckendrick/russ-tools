/**
 * Lookups over the Microsoft 365 licensing reference.
 *
 * Every function here is pure and takes the dataset as its first argument, so
 * the whole surface is testable against a small fixture without loading the
 * real 416 KB file. `loadLicenses()` is the one impure entry point, and it is
 * a dynamic import so Vite emits the dataset as its own lazy chunk instead of
 * folding it into the island's first-paint bundle.
 *
 * The dataset is normalised: `skus[].plans` holds service-plan ids, and the
 * plan records live once in `servicePlans`. Hydrating is `expandSku`'s job.
 */

/**
 * @typedef {{ guid: string, partNumber: string, name: string, plans: string[] }} Sku
 * @typedef {{ id: string, name: string, friendly: string }} ServicePlan
 * @typedef {{ source: string, licence: string, generatedAt: string,
 *             skus: Sku[], servicePlans: ServicePlan[] }} LicenseData
 */

/** @type {Promise<LicenseData> | null} */
let pending = null;

/**
 * The dataset, fetched once per page load and shared by every caller.
 * @returns {Promise<LicenseData>}
 */
export function loadLicenses() {
  if (!pending) {
    pending = import('../../../data/microsoft/m365-licenses.json').then((m) => m.default ?? m);
  }
  return pending;
}

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * What the user appears to have typed. Drives which panel the island opens on,
 * so a pasted GUID lands on a result rather than a list of near-misses.
 *
 * Part numbers are the `String_Id` column: upper-case, underscore-separated,
 * no spaces (`SPE_E3`, `ENTERPRISEPACK`, `Microsoft_Teams_Rooms_Pro`). The
 * test is deliberately loose — it only has to beat "name".
 * @param {string} query
 * @returns {'guid' | 'partNumber' | 'name' | 'empty'}
 */
export function detectQueryKind(query) {
  const q = (query ?? '').trim();
  if (!q) return 'empty';
  if (GUID.test(q)) return 'guid';
  if (/^[A-Za-z0-9]+(_[A-Za-z0-9]+)+$/.test(q) && q === q.toUpperCase()) return 'partNumber';
  if (/^[A-Z0-9]{6,}$/.test(q)) return 'partNumber';
  return 'name';
}

/** @type {WeakMap<object, {byGuid: Map<string, Sku>, byPart: Map<string, Sku>, byPlanId: Map<string, ServicePlan>, byPlanName: Map<string, ServicePlan>, skusByPlan: Map<string, Sku[]>}>} */
const indexes = new WeakMap();

/**
 * Lookup maps, built once per dataset object. 620 SKUs would scan fine, but
 * the reverse "which SKUs include this plan" view is O(skus x plans) per
 * keystroke without it.
 * @param {LicenseData} data
 */
function index(data) {
  let built = indexes.get(data);
  if (built) return built;

  const byGuid = new Map();
  const byPart = new Map();
  const skusByPlan = new Map();

  for (const sku of data.skus) {
    byGuid.set(sku.guid.toLowerCase(), sku);
    if (sku.partNumber) byPart.set(sku.partNumber.toLowerCase(), sku);
    for (const planId of sku.plans) {
      const list = skusByPlan.get(planId);
      if (list) list.push(sku);
      else skusByPlan.set(planId, [sku]);
    }
  }

  const byPlanId = new Map();
  const byPlanName = new Map();
  for (const plan of data.servicePlans) {
    byPlanId.set(plan.id.toLowerCase(), plan);
    if (plan.name) byPlanName.set(plan.name.toLowerCase(), plan);
  }

  built = { byGuid, byPart, byPlanId, byPlanName, skusByPlan };
  indexes.set(data, built);
  return built;
}

/**
 * One SKU, by GUID, part number, or exact display name. Returns null rather
 * than a best guess — `searchSkus` is what offers alternatives.
 * @param {LicenseData} data
 * @param {string} query
 * @returns {Sku | null}
 */
export function findSku(data, query) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return null;

  const { byGuid, byPart } = index(data);
  return (
    byGuid.get(q) ??
    byPart.get(q) ??
    data.skus.find((s) => s.name.toLowerCase() === q) ??
    null
  );
}

/**
 * Rank a candidate against a query: exact beats prefix beats substring, and
 * a shorter match beats a longer one at the same tier. Returns -1 for no match.
 * @param {string} haystack
 * @param {string} needle
 */
function score(haystack, needle) {
  const h = haystack.toLowerCase();
  if (!h) return -1;
  if (h === needle) return 0;
  if (h.startsWith(needle)) return 1000 + h.length;
  const at = h.indexOf(needle);
  if (at !== -1) return 2000 + at * 10 + h.length;
  return -1;
}

/**
 * A GUID is hex, so a short query hits dozens of them by accident and hits
 * them *hard*: two thirds of the catalogue's ids contain "e3" somewhere and
 * some begin with it, which scored 1036 and beat every SKU whose **name**
 * contains it. Searching "E3" answered "Microsoft Teams Phone Resource
 * Account_USGOV_GCCHIGH" before "Microsoft 365 E3".
 *
 * So an id is matched only by a fragment long enough to have been copied from
 * one, and an id-only match always sorts behind every name and part-number
 * match rather than competing with them. An exact id never reaches here —
 * `findSku` and `planDetail` answer that directly.
 */
const ID_FRAGMENT_MIN = 8;
const ID_RANK = 100_000;

function scoreId(id, needle) {
  if (needle.length < ID_FRAGMENT_MIN) return -1;
  const s = score(id, needle);
  return s === -1 ? -1 : ID_RANK + s;
}

/** The best textual score, or `Infinity` when nothing matched. */
const best = (...scores) =>
  Math.min(...scores.filter((s) => s !== -1).concat(Number.POSITIVE_INFINITY));

/**
 * Ranked partial matches across part number, display name and GUID.
 * @param {LicenseData} data
 * @param {string} query
 * @param {number} [limit]
 * @returns {Sku[]}
 */
export function searchSkus(data, query, limit = 50) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return [];

  const scored = [];
  for (const sku of data.skus) {
    const rank = best(score(sku.partNumber, q), score(sku.name, q), scoreId(sku.guid, q));
    if (Number.isFinite(rank)) scored.push([rank, sku]);
  }

  return scored
    .sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name))
    .slice(0, limit)
    .map(([, sku]) => sku);
}

/**
 * Ranked partial matches across service-plan name, friendly name and id.
 * @param {LicenseData} data
 * @param {string} query
 * @param {number} [limit]
 * @returns {ServicePlan[]}
 */
export function searchServicePlans(data, query, limit = 50) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return [];

  const scored = [];
  for (const plan of data.servicePlans) {
    const rank = best(score(plan.name, q), score(plan.friendly, q), scoreId(plan.id, q));
    if (Number.isFinite(rank)) scored.push([rank, plan]);
  }

  return scored
    .sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name))
    .slice(0, limit)
    .map(([, plan]) => plan);
}

/**
 * A SKU with its service plans hydrated and sorted by friendly name, which is
 * what the result table shows.
 * @param {LicenseData} data
 * @param {Sku} sku
 * @returns {{ sku: Sku, plans: ServicePlan[] }}
 */
export function expandSku(data, sku) {
  const { byPlanId } = index(data);
  const plans = sku.plans
    .map((id) => byPlanId.get(id.toLowerCase()) ?? { id, name: id, friendly: '' })
    .sort((a, b) => (a.friendly || a.name).localeCompare(b.friendly || b.name));
  return { sku, plans };
}

/**
 * The reverse lookup: a service plan, plus every SKU that includes it. This is
 * the question the Microsoft docs page cannot answer without a spreadsheet.
 * @param {LicenseData} data
 * @param {string} query  plan id or plan name
 * @returns {{ plan: ServicePlan, skus: Sku[] } | null}
 */
export function planDetail(data, query) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return null;

  const { byPlanId, byPlanName, skusByPlan } = index(data);
  const plan = byPlanId.get(q) ?? byPlanName.get(q) ?? null;
  if (!plan) return null;

  const skus = [...(skusByPlan.get(plan.id) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  return { plan, skus };
}
