import { createToolStorage } from '@/core';
import { migrateLegacy } from './legacy.js';
import { portable, restore } from './state.js';

export const MAX_RECENT = 50;
export const MAX_SAVED = 200;
const SLOT = 'library';
const LEGACY_TEMPLATES = 'azure-kql-custom-templates';

const EMPTY = { version: 1, saved: [], recent: [] };

const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

function clean(entry) {
  if (!entry || typeof entry !== 'object' || typeof entry.kql !== 'string' || !entry.kql.trim()) return null;
  const state = entry.kind === 'build' ? restore(entry.state) : null;
  return {
    id: text(String(entry.id ?? ''), 60) || crypto.randomUUID(),
    name: text(entry.name, 120) || 'Saved query',
    description: text(entry.description, 400),
    tags: Array.isArray(entry.tags) ? entry.tags.map((tag) => text(tag, 40)).filter(Boolean).slice(0, 12) : [],
    kind: state ? 'build' : 'kql',
    ...(state ? { state: portable(state) } : {}),
    ...(entry.service ? { service: text(entry.service, 60) } : {}),
    kql: entry.kql.slice(0, 20000),
    at: text(entry.at, 40) || new Date().toISOString(),
  };
}

const cleanList = (list, max) => (Array.isArray(list) ? list.map(clean).filter(Boolean).slice(0, max) : []);

export function createLibrary({ backend } = {}) {
  const storage = createToolStorage('azure-kql', { backend });

  function load() {
    if (storage.has(SLOT)) {
      const stored = storage.get(SLOT, { fallback: EMPTY });
      return { version: 1, saved: cleanList(stored?.saved, MAX_SAVED), recent: cleanList(stored?.recent, MAX_RECENT) };
    }
    const migrated = migrateLegacy({
      store: storage.get('store'),
      templates: storage.get('custom-templates', { fallback: [], legacy: LEGACY_TEMPLATES }),
    });
    const library = {
      version: 1,
      saved: cleanList(migrated.saved, MAX_SAVED),
      recent: cleanList(migrated.recent, MAX_RECENT),
    };
    if (library.saved.length || library.recent.length) storage.set(SLOT, library);
    return library;
  }

  function persist(library) {
    storage.set(SLOT, library);
    return library;
  }

  return { load, persist };
}

export function entryFor(state, kql, name) {
  const build = state.mode !== 'kql';
  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    tags: [],
    kind: build ? 'build' : 'kql',
    ...(build ? { state: portable(state) } : {}),
    kql,
    at: new Date().toISOString(),
  };
}

export function withSaved(library, entry) {
  return { ...library, saved: [entry, ...library.saved].slice(0, MAX_SAVED) };
}

export function withRecent(library, entry) {
  const others = library.recent.filter((item) => item.kql !== entry.kql);
  return { ...library, recent: [entry, ...others].slice(0, MAX_RECENT) };
}

export function withoutSaved(library, id) {
  return { ...library, saved: library.saved.filter((entry) => entry.id !== id) };
}

export function renamed(library, id, name) {
  const next = name.trim().slice(0, 120);
  if (!next) return library;
  return { ...library, saved: library.saved.map((entry) => (entry.id === id ? { ...entry, name: next } : entry)) };
}

export function withoutRecent(library) {
  return { ...library, recent: [] };
}

export function openEntry(entry) {
  const state = entry.kind === 'build' ? restore(entry.state) : null;
  return state ?? restore({ mode: 'kql', kql: entry.kql });
}
