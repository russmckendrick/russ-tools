import { edgeFade } from './edgeFade.js';
import {
  PINNED_KEY,
  RECENT_KEY,
  canRemember,
  clearRecent,
  flipPin,
  renderStrip,
} from './yourTools.js';

export function wireYourTools({ settle = (mutate) => mutate(), announce = () => {} } = {}) {
  const strip = document.getElementById('rt-mine');
  if (!strip || !canRemember()) return;

  const pins = [...document.querySelectorAll('.rt-pin')];
  const syncFade = edgeFade(strip.querySelector('.rt-mine-scroll'));

  const paint = () => {
    const lists = renderStrip(strip);
    for (const pin of pins) {
      pin.setAttribute('aria-pressed', String(lists.pinned.includes(pin.dataset.pin)));
    }
    syncFade();
  };

  document.addEventListener('click', (event) => {
    const pin = event.target instanceof Element ? event.target.closest('.rt-pin') : null;
    if (!pin) return;
    flipPin(pin.dataset.pin);
    settle(paint);
  });

  document.getElementById('rt-mine-clear').addEventListener('click', () => {
    clearRecent();
    settle(() => {
      paint();
      const next = strip.hidden
        ? document.querySelector('#filters [aria-checked="true"]')
        : strip.querySelector('.rt-mine-link');
      next?.focus();
    });
    announce('Recent tools cleared');
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) paint();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === PINNED_KEY || event.key === RECENT_KEY) paint();
  });

  for (const pin of pins) pin.hidden = false;
  paint();
}
