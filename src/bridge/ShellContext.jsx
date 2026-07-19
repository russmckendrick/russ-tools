import { createContext, useContext } from 'react';

/**
 * Marks a subtree as running inside the Astro shell rather than the legacy
 * React SPA.
 *
 * Both apps render the same tool components during Phase 2, and a few pieces
 * of shared chrome (`SEOHead`, `ToolHeader`) do jobs the shell has already
 * done in prerendered HTML — set the document title, render an `h1`. Doing
 * them twice is not a styling nit: two `h1`s and a second `ld+json` would
 * break frozen contract #4 the moment the bridge lands.
 *
 * The context, not a global flag, so it is explicit and testable: the SPA
 * never provides it, so `useShell()` is `null` there and every component
 * behaves exactly as it does today.
 *
 * This whole directory is Phase 2 scaffolding and is deleted at cutover.
 *
 * @typedef {{ toolId: string }} ShellInfo
 */
export const ShellContext = createContext(/** @type {ShellInfo | null} */ (null));

/** @returns {ShellInfo | null} the shell context, or null under the SPA. */
export const useShell = () => useContext(ShellContext);
