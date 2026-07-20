import * as React from "react"

import { cn } from "@/lib/utils"

/** The Input contract at block scale — same ground, boundary and monospace. */
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-sm border border-outline-strong bg-surface px-[11px] py-2",
        "font-mono text-data-md text-on-surface placeholder:text-on-surface-faint",
        "transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-primary/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised",
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
