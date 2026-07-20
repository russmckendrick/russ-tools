/**
 * Node ≥22 defines its own experimental `localStorage`/`sessionStorage`
 * globals, which return undefined unless `--localstorage-file` is passed —
 * and under vitest's jsdom environment they shadow jsdom's origin-scoped
 * storage, so every storage-backed test silently no-ops against `undefined`.
 *
 * vitest exposes the JSDOM instance as `globalThis.jsdom`; point the globals
 * back at the real ones. Node-environment test files have no `jsdom` and are
 * untouched.
 */
if (typeof globalThis.jsdom !== 'undefined') {
  for (const name of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get: () => globalThis.jsdom.window[name],
    });
  }
}
