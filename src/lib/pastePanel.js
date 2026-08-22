/**
 * The DOM half of the paste panel, shared by the index and /404 so the two
 * cannot drift.
 *
 * Kept apart from `suggest()` on purpose: `paste.js` is pure and unit-tested
 * against a table of inputs, and this file is the part that only a browser can
 * exercise. Neither imports React, because neither page ships any.
 */

import { suggest } from './paste.js';

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

  const render = () => {
    const matches = suggest(input.value);
    go.disabled = matches.length === 0;

    if (!input.value.trim()) {
      hint.innerHTML = resting;
      hint.setAttribute('data-resting', '');
      return matches;
    }

    hint.removeAttribute('data-resting');
    // The tool's own path, not the full href: five chips each repeating
    // `example.com` is five near-identical strings of noise, and the value is
    // already sitting in the field directly above them.
    hint.replaceChildren(
      ...matches.map((match, i) => {
        const link = document.createElement('a');
        link.className = 'rt-kbd';
        link.href = match.href;
        link.textContent = `${match.label} → ${match.path}`;
        if (i === 0) link.setAttribute('data-first', '');
        return link;
      })
    );
    return matches;
  };

  input.addEventListener('input', render);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // Recomputed rather than read off the last input event: autofill, a
    // programmatic `.value`, and /404's prefill never fire one.
    const matches = render();
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
