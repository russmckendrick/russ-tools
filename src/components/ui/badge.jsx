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
 * DESIGN.md defines two badge shapes, and they are not the same component:
 *
 *   `badge-category`  a SOLID block of `category-fill-*` with graphite ink —
 *                     the `category` variant here. It marks what a thing *is*.
 *   `badge-status`    a hue on its own `-subtle` tint — the status variants.
 *
 * `default` is neither. It is the quiet marker most tools actually reach for,
 * labelling a record type, a count or a key, and it stays a hairline outline
 * with the category hue as *text*: thirty-four files use it, and turning all
 * of them into solid colour blocks would repeat the category signal until it
 * meant nothing.
 *
 * The two category hues are not interchangeable. `--cat` is the text hue,
 * deepened in light mode to clear 4.5:1 on bone. `--cat-fill` is the block,
 * identical in both themes because the ink on it is always graphite. Putting
 * `--cat` behind that ink measures 1.6:1 on the light card.
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
          "border-outline bg-transparent text-[var(--cat,var(--color-primary-text))]",
        category:
          "border-2 border-rule bg-[var(--cat-fill,var(--color-primary))] px-2 py-[3px] font-sans text-label-caps-sm uppercase text-on-category-fill",
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
