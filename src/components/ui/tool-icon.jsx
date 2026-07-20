import * as React from 'react';

import { TOOL_ICONS } from '@/shell/icons.mjs';
import { cn } from '@/lib/utils';

/**
 * A tool's Material icon, in React.
 *
 * The paths come from `src/shell/icons.mjs` — the same module the prerendered
 * Astro `ToolIcon` renders from — so a tool's icon is drawn once and used in
 * both apps. Before this, every tool had a `<Tool>Icon.jsx` wrapper around a
 * @tabler glyph, which meant the icon in the page header and the icon inside
 * the tool were two different pictures of the same thing.
 *
 * `currentColor`, per DESIGN.md, makes the filled glyph take the category hue
 * from `--cat` wherever one is in scope without picking its own colour.
 *
 * @param {{ name: string, size?: number, className?: string }} props
 */
export const ToolIcon = React.forwardRef(({ name, size, className, ...props }, ref) => {
  const paths = TOOL_ICONS[name];
  if (!paths) throw new Error(`unknown tool icon: ${name}`);

  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      className={cn(size ? undefined : 'size-6', className)}
      dangerouslySetInnerHTML={{ __html: paths }}
      {...props}
    />
  );
});
ToolIcon.displayName = 'ToolIcon';

/**
 * Builds a tool's icon component from the shared set. Each tool's
 * `<Tool>Icon.jsx` is one call to this, which keeps the existing import
 * sites working unchanged while there is only one drawing behind them.
 *
 * @param {string} name a key of TOOL_ICONS
 */
export function createToolIcon(name) {
  const Icon = React.forwardRef((props, ref) => <ToolIcon ref={ref} name={name} {...props} />);
  Icon.displayName = `ToolIcon(${name})`;
  return Icon;
}

export default ToolIcon;
