/**
 * Getting Conditional Access policies out of whatever someone pasted.
 *
 * The same policy reaches this tool in at least three shapes depending on how
 * it was exported, and a tool that accepts only one of them fails most of the
 * time for reasons the user cannot see:
 *
 *   - a Graph collection envelope, `{ "@odata.context": …, "value": [ … ] }`,
 *     from Graph Explorer or a raw REST call
 *   - a bare array, from `Get-MgIdentityConditionalAccessPolicy | ConvertTo-Json`
 *   - a single policy object, from copying one policy out of a response
 *
 * Anything unrecognised comes back as a described failure rather than a throw,
 * because the caller renders it in an Alert.
 */

/**
 * @typedef {{ ok: true, policies: object[], shape: string }} ParseOk
 * @typedef {{ ok: false, error: string }} ParseFail
 */

/** A policy is recognised by carrying the two fields every CA policy has. */
const looksLikePolicy = (v) =>
  v !== null &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  ('conditions' in v || 'grantControls' in v || 'sessionControls' in v || 'state' in v);

/**
 * @param {string} text
 * @returns {ParseOk | ParseFail}
 */
export function parsePolicies(text) {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return { ok: false, error: 'Paste a Conditional Access policy to analyse.' };

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    return { ok: false, error: `That is not valid JSON: ${error.message}` };
  }

  let candidates;
  let shape;

  if (Array.isArray(parsed)) {
    candidates = parsed;
    shape = 'array';
  } else if (parsed && Array.isArray(parsed.value)) {
    candidates = parsed.value;
    shape = 'graph collection';
  } else if (looksLikePolicy(parsed)) {
    candidates = [parsed];
    shape = 'single policy';
  } else {
    return {
      ok: false,
      error:
        'That JSON parsed, but it does not look like a Conditional Access policy. ' +
        'Expected a policy object, an array of them, or a Graph response with a "value" array.',
    };
  }

  const policies = candidates.filter(looksLikePolicy);

  if (policies.length === 0) {
    return {
      ok: false,
      error:
        candidates.length === 0
          ? 'That looks like a Conditional Access export, but it contains no policies.'
          : `Found ${candidates.length} object(s), but none carry conditions, grantControls or state.`,
    };
  }

  return { ok: true, policies, shape };
}

/**
 * A stable identity for a policy, used as a React key and to point findings at
 * the policy that caused them. `id` is a GUID in a real export; a hand-written
 * sample may have none, so fall back to the name and then the position.
 * @param {object} policy
 * @param {number} index
 */
export const policyKey = (policy, index) =>
  policy.id ?? policy.displayName ?? `policy-${index}`;
