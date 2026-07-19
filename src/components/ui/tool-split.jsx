import { cn } from '@/lib/utils';

/**
 * The control/result split every tool page uses.
 *
 * DESIGN.md's Layout section: *"On a tool page the body splits into a `320px`
 * control column and a fluid result column above 820px, stacking below it.
 * Controls left, output right, always."* This is the component that makes
 * "always" true, and it is the largest single source of one tool page not
 * looking like the next.
 *
 * **Why this lives in React rather than in `ToolLayout.astro`'s `controls`
 * slot.** An Astro slot is filled at build time. A tool's controls and its
 * results share React state — the domain being looked up, the loading flag —
 * so they cannot be split across two slots without splitting the island in
 * two and inventing a channel between them. The layout therefore belongs
 * inside the island, expressed in the same tokens the shell uses, and
 * `ToolLayout` renders a single column beneath its header. The Astro
 * `controls` slot stays for shell-owned content.
 *
 * `minmax(0, 1fr)` rather than `1fr` on the result column: a `1fr` track has
 * `min-width: auto`, so one wide `<pre>` of DNS records or a long token pushes
 * the whole grid past the page width instead of scrolling inside its panel.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.controls left column — inputs, presets, history
 * @param {import('react').ReactNode} props.children right column — the answer
 * @param {string} [props.className]
 */
export function ToolSplit({ controls, children, className }) {
  return (
    <div
      className={cn(
        'grid items-start gap-3 min-[820px]:grid-cols-[320px_minmax(0,1fr)]',
        className
      )}
    >
      <div className="grid min-w-0 content-start gap-3">{controls}</div>
      <div className="grid min-w-0 content-start gap-3">{children}</div>
    </div>
  );
}

/**
 * What the result column shows before there is a result.
 *
 * DESIGN.md is explicit that empty vertical space below the content is a bug,
 * and a two-column layout creates exactly that on first load: a form on the
 * left and 400px of nothing on the right. This states what will appear there
 * instead of leaving the user to guess.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.icon]
 * @param {string} props.title
 * @param {string} [props.hint]
 */
export function ToolSplitEmpty({ icon, title, hint }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-outline px-6 py-10 text-center">
      {icon && <div className="text-[var(--cat)] opacity-70">{icon}</div>}
      <p className="text-title-sm text-on-surface-muted">{title}</p>
      {hint && <p className="text-body-sm text-on-surface-faint">{hint}</p>}
    </div>
  );
}
