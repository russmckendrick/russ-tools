import { defaultBackend, storageKey } from '../core/storage.js';

export const SHELL_STORAGE = { id: 'shell', storageKeys: ['pinned', 'recent'] };
export const PINNED_KEY = storageKey(SHELL_STORAGE.id, 'pinned');
export const RECENT_KEY = storageKey(SHELL_STORAGE.id, 'recent');
export const RECENT_STORED = 12;
export const RECENT_SHOWN = 6;

const KEYS = { pinned: PINNED_KEY, recent: RECENT_KEY };

export function parseIds(raw) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  return value.filter((id, i) => typeof id === 'string' && id !== '' && value.indexOf(id) === i);
}

export function recordVisit(recent, id, limit = RECENT_STORED) {
  return [id, ...recent.filter((other) => other !== id)].slice(0, limit);
}

export function togglePin(pinned, id) {
  return pinned.includes(id) ? pinned.filter((other) => other !== id) : [...pinned, id];
}

export function planStrip(pinned, recent, known, limit) {
  const pins = pinned.filter((id) => known.includes(id));
  return {
    pinned: pins,
    recent: recent.filter((id) => known.includes(id) && !pins.includes(id)).slice(0, limit),
  };
}

export function paintStrip(strip, storage, keys, limit, parse, plan) {
  const items = new Map();
  for (const item of strip.querySelector('template').content.querySelectorAll('[data-tool]')) {
    items.set(item.dataset.tool, item);
  }
  const read = (key) => {
    try {
      return parse(storage.getItem(key));
    } catch {
      return [];
    }
  };
  const lists = plan(read(keys.pinned), read(keys.recent), [...items.keys()], limit);
  for (const name of ['pinned', 'recent']) {
    const group = strip.querySelector(`[data-group="${name}"]`);
    group
      .querySelector('ul')
      .replaceChildren(...lists[name].map((id) => items.get(id).cloneNode(true)));
    group.hidden = lists[name].length === 0;
  }
  strip.hidden = lists.pinned.length + lists.recent.length === 0;
  return lists;
}

export function stripBootSource(stripId) {
  const args = [
    `document.getElementById(${JSON.stringify(stripId)})`,
    'localStorage',
    JSON.stringify(KEYS),
    String(RECENT_SHOWN),
    String(parseIds),
    String(planStrip),
  ];
  return `try{(${paintStrip})(${args.join(',')})}catch{}`;
}

const readIds = (store, key) => {
  try {
    return parseIds(store.getItem(key));
  } catch {
    return [];
  }
};

const writeIds = (store, key, ids) => {
  try {
    if (ids.length > 0) store.setItem(key, JSON.stringify(ids));
    else store.removeItem(key);
  } catch {
    return;
  }
};

export function canRemember() {
  try {
    return defaultBackend() === localStorage;
  } catch {
    return false;
  }
}

export function renderStrip(strip, { backend } = {}) {
  return paintStrip(strip, backend ?? defaultBackend(), KEYS, RECENT_SHOWN, parseIds, planStrip);
}

export function noteVisit(id, { backend } = {}) {
  if (typeof id !== 'string' || id === '') return;
  const store = backend ?? defaultBackend();
  writeIds(store, RECENT_KEY, recordVisit(readIds(store, RECENT_KEY), id));
}

export function flipPin(id, { backend } = {}) {
  const store = backend ?? defaultBackend();
  const next = togglePin(readIds(store, PINNED_KEY), id);
  writeIds(store, PINNED_KEY, next);
  return next.includes(id);
}

export function clearRecent({ backend } = {}) {
  writeIds(backend ?? defaultBackend(), RECENT_KEY, []);
}
