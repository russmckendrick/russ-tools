/**
 * Copy to clipboard, with the fallback that makes it work off HTTPS.
 *
 * `navigator.clipboard` is undefined on any non-secure origin, which
 * includes a colleague hitting the dev server over the LAN, so the
 * `execCommand('copy')` path is not legacy cruft — it is the branch that
 * fires when someone tries the tool from a phone on the office network.
 *
 * Returns a boolean rather than throwing: every caller's response to a
 * failure is the same toast, and none of them can do anything else about it.
 */

/**
 * @param {string} text
 * @returns {Promise<boolean>} whether the text reached the clipboard
 */
export async function copyText(text) {
  if (typeof text !== 'string') return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied, or the document was not focused. Fall through to
    // the synchronous path, which has neither requirement.
  }

  return legacyCopy(text);
}

/**
 * The pre-async-clipboard mechanism: a hidden textarea and `execCommand`.
 * Deprecated, universally implemented, and the only thing that works on
 * `http://192.168.x.x`.
 *
 * @param {string} text
 * @returns {boolean}
 */
function legacyCopy(text) {
  if (typeof document === 'undefined') return false;

  const area = document.createElement('textarea');
  area.value = text;
  // Off-screen rather than `display:none` — a hidden element cannot be
  // selected, and iOS scrolls to a focused input unless it is already in
  // the viewport.
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '0';
  area.style.left = '-9999px';

  document.body.appendChild(area);
  const previous = document.activeElement;

  try {
    area.select();
    area.setSelectionRange(0, area.value.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(area);
    if (previous instanceof HTMLElement) previous.focus();
  }
}
