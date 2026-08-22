import * as React from 'react';

import { TOOL_ICONS } from '@/shell/icons.mjs';
import { cn } from '@/lib/utils';

/**
 * A tool's Lucide icon, in React.
 *
 * The drawings come from `src/shell/icons.mjs` — the same module the
 * prerendered Astro `ToolIcon` renders from — so a tool's icon is drawn once
 * and used in both apps. The wrapper attributes here are Lucide's stroke
 * contract and must agree with `iconSvg` in that module.
 *
 * `currentColor`, per DESIGN.md, makes the glyph take its ink from the
 * surrounding layout — graphite inside a category tile, the category text
 * hue beside a heading — without picking its own colour.
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
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
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
