import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * DESIGN.md's Badge: a small monospace marker for a record type, a grade, a
 * count or a state — data about the content, rendered as data.
 *
 * Not to be confused with the capability pills that used to sit under a tool
 * title; those were page furniture restating what the tool plainly is, and
 * they are gone. A badge here always labels something concrete on the page.
 *
 * `default` takes the tool's category hue as a tint, so a badge belonging to
 * a tool is coloured by the manifest rather than by the tool. Status variants
 * are the only ones permitted to express state.
 */
const badgeVariants = cva(
  cn(
    "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5",
    "font-mono text-data-sm whitespace-nowrap",
    "[&_svg]:size-3 [&_svg]:shrink-0"
  ),
  {
    variants: {
      variant: {
        default:
          "border-[color-mix(in_oklab,var(--cat,var(--color-primary))_40%,transparent)] bg-[color-mix(in_oklab,var(--cat,var(--color-primary))_13%,transparent)] text-[var(--cat,var(--color-primary))]",
        secondary: "border-outline bg-surface-inset text-on-surface-muted",
        outline: "border-outline text-on-surface-muted",
        destructive: "border-danger/40 bg-danger-subtle text-danger",
        success: "border-success/40 bg-success-subtle text-success",
        warning: "border-warning/40 bg-warning-subtle text-warning",
        info: "border-info/40 bg-info-subtle text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
