/**
 * Registers a WebMCP tool for the lifetime of the mounted island.
 *
 * WebMCP (webmachinelearning/webmcp) lets a page declare structured tools an
 * agent can call. astro-webmcp registers the site-wide set (search, sections,
 * navigation) on every page; this hook is how an island adds a tool backed by
 * its own logic — the real functions from its `lib/`, not a build-time string
 * duplicate.
 *
 * The descriptor MUST be a module-scope constant: it is the effect's only
 * dependency, so an inline object literal would re-register on every render.
 *
 * API surface is feature-detected and the hook no-ops where absent —
 * `document.modelContext` (current spec home) first, the deprecated
 * `navigator.modelContext` as fallback. Cleanup covers the two unregistration
 * shapes the spec has carried: AbortSignal and explicit unregisterTool().
 */
import { useEffect } from 'react';

const modelContext = () =>
  (typeof document !== 'undefined' && document.modelContext) ||
  (typeof navigator !== 'undefined' && navigator.modelContext) ||
  null;

export function useWebMCPTool(tool) {
  useEffect(() => {
    const ctx = modelContext();
    if (!ctx || typeof ctx.registerTool !== 'function') return undefined;

    const controller = new AbortController();
    let registration;
    try {
      registration = ctx.registerTool(tool, { signal: controller.signal });
    } catch {
      return undefined;
    }

    return () => {
      try {
        controller.abort();
        if (registration && typeof registration.unregister === 'function') {
          registration.unregister();
        } else if (typeof ctx.unregisterTool === 'function') {
          ctx.unregisterTool(tool.name);
        }
      } catch {
        /* a vanished context at teardown is not an error */
      }
    };
  }, [tool]);
}

/** The spec's structured content envelope for a text result. */
export const textResult = (data) => ({
  content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data) }],
});
