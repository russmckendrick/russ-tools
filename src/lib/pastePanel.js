/**
 * The DOM half of the paste panel, shared by the index and /404 so the two
 * cannot drift.
 *
 * Kept apart from `suggest()` on purpose: `paste.js` is pure and unit-tested
 * against a table of inputs, and this file is the part that only a browser can
 * exercise. Neither imports React, because neither page ships any.
 */

import { refine, suggest } from './paste.js';

/**
 * Wire up the panel rendered by `shell/PastePanel.astro`.
 *
 * @param {object} [options]
 * @param {boolean} [options.autofocus] Focus the field on init. /404 does —
 *   the visitor is already stuck, and the field is the way out. The index does
 *   not: stealing focus on a catalogue would hijack the scroll position and
 *   pop a keyboard on every phone that opens the site.
 * @returns {void}
 */
export function wirePastePanel({ autofocus = false } = {}) {
  const form = document.getElementById('rt-jump');
  if (!form) return;

  const input = document.getElementById('rt-jump-input');
  const hint = document.getElementById('rt-jump-hint');
  const go = form.querySelector('.rt-jump-go');
  const resting = hint.innerHTML;

  const draw = (matches) => {
    // The tool's own path, not the full href: five chips each repeating
    // `example.com` is five near-identical strings of noise, and the value is
    // already sitting in the field directly above them.
    hint.replaceChildren(
      ...matches.map((match, i) => {
        const link = document.createElement('a');
        link.className = 'rt-kbd';
        link.href = match.href;
        link.title = match.why;
        link.textContent = `${match.label} → ${match.path}`;
        if (i === 0) link.setAttribute('data-first', '');
        return link;
      })
    );
  };

  // Resolves to the settled answer for what is in the field now. `suggest()`
  // is instant; `refine()` may reorder a GUID's chips once the Entra index
  // has loaded.
  const render = () => {
    const value = input.value;
    const matches = suggest(value);
    go.disabled = matches.length === 0;

    if (!value.trim()) {
      hint.innerHTML = resting;
      hint.setAttribute('data-resting', '');
      return Promise.resolve(matches);
    }

    hint.removeAttribute('data-resting');
    draw(matches);

    return refine(value, matches).then((refined) => {
      // Typing carried on while the index loaded: this answer is stale.
      if (input.value === value && refined !== matches) draw(refined);
      return refined;
    });
  };

  input.addEventListener('input', render);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    // Recomputed rather than read off the last input event: autofill, a
    // programmatic `.value`, and /404's prefill never fire one. Awaited so
    // that Enter pressed straight after a paste follows the refined order.
    const matches = await render();
    if (matches.length) location.assign(matches[0].href);
  });

  form.hidden = false;
  // A prefilled field (/404 seeding from the failed URL) has matches to show
  // before anyone has typed.
  if (input.value.trim()) render();
  if (autofocus) {
    input.focus();
    input.select();
  }
}
