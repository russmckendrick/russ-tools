// The root wrapper design-sync previews mount inside.
//
// It is not a component of the design system — it reproduces, for a preview
// card, the two things the real app does around every component and which
// nothing in src/components/ui/ does for itself:
//
//   1. BaseLayout.astro picks the theme with a pre-paint inline script and
//      puts `.dark` / `.light` on <html>. With no class the stylesheet falls
//      through to `@media (prefers-color-scheme)`, so an unwrapped preview
//      renders whichever theme the screenshot browser happens to prefer —
//      non-deterministic, and light by default in headless Chromium. This
//      design system is dark-first, so previews pin `.dark`.
//   2. ToolLayout.astro sets `--cat: var(--color-category-<id>)` once per
//      page. Badge, HelpDialog and ToolIcon read `var(--cat, …)`, so without
//      it they silently fall back to the house accent and the category hue —
//      a defining part of this system — never appears.
//
// It also paints the page in `--color-surface`, because the generated preview
// shell hardcodes a white body and dark components on white is not a state
// this design system has.

import * as React from 'react';

export function DesignSystemRoot({ theme = 'dark', category = 'network', children }) {
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    const prev = root.className;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    document.body.style.background = 'var(--color-surface)';
    document.body.style.color = 'var(--color-on-surface)';
    return () => {
      root.className = prev;
    };
  }, [theme]);

  return React.createElement(
    'div',
    {
      style: {
        '--cat': `var(--color-category-${category})`,
        background: 'var(--color-surface)',
        color: 'var(--color-on-surface)',
        fontFamily: 'var(--font-sans)',
      },
    },
    children,
  );
}
