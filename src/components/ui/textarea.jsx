import * as React from "react"

import { cn } from "@/lib/utils"

/** The Input contract at block scale — same ground, boundary and monospace. */
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-md border-2 border-rule bg-surface-raised px-[11px] py-2",
        "font-mono text-data-md text-on-surface placeholder:text-on-surface-faint",
        "transition-[border-color,background-color,box-shadow] duration-140 ease-out hover:bg-surface-inset focus-visible:bg-surface-raised",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
