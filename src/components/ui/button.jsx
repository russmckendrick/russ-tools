import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * DESIGN.md's buttons, under shadcn's name. 47 files render this, so it is
 * the single control every tool has in common.
 *
 * Two things here are contract, not taste:
 *
 * 1. **The primary fill is `var(--cat)`, falling back to the house accent.**
 *    ToolLayout sets `--cat` once per page from the manifest's `category`,
 *    so a tool's main action takes that tool's hue automatically and no tool
 *    ever picks a colour — DESIGN.md, "when a primary button belongs to a
 *    tool, it takes that tool's category hue".
 * 2. **The label is `on-primary` (near-black in dark), never white.** White
 *    on any accent in this palette measures near 2:1. Phase 1 caught the
 *    approved mockup doing exactly this.
 *
 * Sizes follow DESIGN.md's `8px 13px` control padding and 6px radius, not
 * shadcn's stock 10/4 and `rounded-md`.
 */
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm",
    "text-body-sm font-medium transition-colors duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cat,var(--color-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0"
  ),
  {
    variants: {
      variant: {
        default:
          "bg-[var(--cat,var(--color-primary))] text-on-primary shadow-[inset_0_1px_0_rgba(255,255,255,.18)] hover:brightness-110",
        destructive:
          "bg-error text-on-primary shadow-[inset_0_1px_0_rgba(255,255,255,.18)] hover:brightness-110",
        outline:
          "border border-outline-strong bg-surface-raised text-on-surface hover:bg-surface-inset",
        secondary:
          "border border-outline bg-surface-inset text-on-surface hover:border-outline-strong",
        ghost: "text-on-surface-muted hover:bg-surface-inset hover:text-on-surface",
        link: "text-[var(--cat,var(--color-primary))] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-[13px] py-2",
        sm: "h-8 px-2.5 text-data-sm",
        lg: "h-10 px-4",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
