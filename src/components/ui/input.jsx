import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * DESIGN.md's Input: the raised ground inside the 2px `rule` border at
 * `rounded-md` — the border does the work the ground shift used to. Content
 * is monospace because input is data. Focus is the ring, not a border swap.
 */
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border-2 border-rule bg-surface-raised px-[11px] py-2",
        "font-mono text-data-md text-on-surface placeholder:text-on-surface-faint",
        "transition-[border-color,background-color,box-shadow] duration-140 ease-out hover:bg-surface-inset focus-visible:bg-surface-raised",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised",
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
