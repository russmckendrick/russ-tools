import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ToolActionsProvider } from '@/components/ui/tool-actions';
import { TOOLS_BY_ID } from '../tools/registry.mjs';
import ToolHelp from './ToolHelp';

/**
 * One island entry that mounts any tool's React component inside
 * `ToolLayout.astro`.
 *
 * It supplies the two things the tools expect that a static Astro page does
 * not have:
 *
 *  1. **A router.** Nine tools call `useParams`/`useSearchParams`. Rather
 *     than editing nine tools, the island mounts a real `BrowserRouter` whose
 *     routes are generated from the manifest's `params` — the same source the
 *     `_redirects` rewrites come from, so a deep link cannot match in one
 *     place and miss in the other.
 *  2. **Toasts.** One `<Toaster/>` per page, belonging to the island.
 *
 * The theme needs nothing: it is a class on `<html>` written by BaseLayout's
 * pre-paint script. No `ThemeProvider` is required because no tool consumes
 * `useTheme`.
 *
 * This was Phase 2 scaffolding and the directory was meant to die at cutover.
 * It did not: `ShellContext` went with the SPA — its only consumers were
 * `SEOHead` and `ToolHeader`, whose job was to stand down under the shell, and
 * they are gone — but the router and the toaster are load-bearing for every
 * tool page. Folding this into `[tool].astro` would only move it.
 *
 * @param {{ toolId: string }} props
 */
export default function ToolIsland({ toolId }) {
  const tool = TOOLS_BY_ID[toolId];
  const [actionsTarget, setActionsTarget] = React.useState(null);

  if (!tool) {
    // Unreachable via getStaticPaths, but a silent blank panel would be the
    // worst possible failure mode here.
    throw new Error(`ToolIsland: no manifest for "${toolId}"`);
  }

  const Tool = React.useMemo(() => React.lazy(tool.island), [tool]);

  // /ssl-checker, /ssl-checker/:domain — and for the two-segment tools the
  // partial pattern too, matching allRoutes().
  const patterns = [
    tool.path,
    ...tool.params.map(
      (_, i) =>
        `${tool.path}/${tool.params
          .slice(0, i + 1)
          .map((p) => `:${p}`)
          .join('/')}`
    ),
  ];

  return (
    <div className="rt-island" onClickCapture={interceptLinks}>
      <BrowserRouter>
        <ToolActionsProvider target={actionsTarget}>
          <div className="mb-4 flex justify-end gap-2">
            <div ref={setActionsTarget} className="contents" />
            <ToolHelp tool={tool} />
          </div>
          <Suspense fallback={<IslandLoading title={tool.title} />}>
            <IslandErrorBoundary title={tool.title}>
              <Routes>
                {patterns.map((pattern) => (
                  <Route key={pattern} path={pattern} element={<Tool />} />
                ))}
              </Routes>
            </IslandErrorBoundary>
          </Suspense>
        </ToolActionsProvider>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

/**
 * Under Astro every navigation is a document load, but a react-router `Link`
 * inside an island calls `preventDefault` and hands the URL to a router that
 * only knows this one tool's routes — so a cross-tool link (dns-lookup's
 * record display links to whois) would change the address bar and render
 * nothing. Capture the click before React sees it and let the browser do a
 * real navigation, which is the correct semantics for an MPA.
 *
 * @param {import('react').MouseEvent<HTMLDivElement>} event
 */
function interceptLinks(event) {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const anchor = /** @type {HTMLElement} */ (event.target).closest?.('a[href]');
  if (!anchor) return;

  const href = anchor.getAttribute('href');
  if (!href || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return;

  event.preventDefault();
  event.stopPropagation();
  window.location.assign(url.href);
}

/** @param {{ title: string }} props */
function IslandLoading({ title }) {
  return (
    <section className="rt-panel">
      <div className="rt-panel-head">
        <span>{title}</span>
        <em>loading</em>
      </div>
      <div className="rt-panel-body">
        <p className="rt-island-note">Loading the tool…</p>
      </div>
    </section>
  );
}

class IslandErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('Island failed to load:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section className="rt-panel">
        <div className="rt-panel-head">
          <span>{this.props.title}</span>
          <em>failed to load</em>
        </div>
        <div className="rt-panel-body">
          <p className="rt-island-note">
            This tool could not be loaded. Reloading the page usually fixes it.
          </p>
          <button type="button" className="rt-island-retry" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </section>
    );
  }
}
