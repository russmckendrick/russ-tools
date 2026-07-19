import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * DESIGN.md's Input: the page ground rather than the panel ground — inputs
 * sit *darker* than the panel they are in, not lighter — an `outline-strong`
 * boundary (the decorative hairline is never a control boundary; it does not
 * clear 3:1), monospace content because input is data, and a 6px radius.
 */
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-sm border border-outline-strong bg-surface px-[11px] py-2",
        "font-mono text-data-md text-on-surface placeholder:text-on-surface-faint",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cat,var(--color-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-body-sm file:font-medium file:text-on-surface",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
