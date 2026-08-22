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
 * 1. **The fill is the house accent, never the category hue.** Category
 *    labels; it does not shout. Driving large fills from it made the amber
 *    security hue — which is brown once it clears 4.5:1 in light mode — the
 *    primary button on every security tool. The hue still reaches the icon
 *    tile, badges, borders and text, where it codes the category without
 *    becoming the loudest thing on the page.
 * 2. **The label is `on-primary` (near-black in dark), never white.** White
 *    on any accent in this palette measures near 2:1. Phase 1 caught the
 *    approved mockup doing exactly this.
 *
 * Under Stacks a solid button is a pressable chunk: 2px `rule` border,
 * `rounded-md`, and the `press-sm` offset shadow that vanishes as `:active`
 * sinks the button by the offset — the press IS the animation. The accent's
 * hover state is the explicit `primary-hover` token rather than a
 * `brightness()` filter, which would drift the hue off the value measured
 * against its ink. Ghost and link stay chromeless; `outline` is the quiet
 * bordered middle (no shadow).
 */
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
    "text-body-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-140 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0"
  ),
  {
    variants: {
      variant: {
        default:
          "rounded-md border-2 border-rule bg-primary text-on-primary shadow-press-sm hover:bg-primary-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        // `on-status`, not `on-primary`. The ink on a status fill flips with
        // the theme — graphite on the bright dark hue, white on the deep
        // light one — while the accent's ink is graphite in both.
        destructive:
          "rounded-md border-2 border-rule bg-error text-on-status shadow-press-sm hover:brightness-110 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        outline:
          "rounded-md border-2 border-rule bg-transparent text-on-surface hover:bg-surface-inset",
        secondary:
          "rounded-md border-2 border-rule bg-surface-raised text-on-surface shadow-press-sm hover:bg-surface-inset active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        ghost: "rounded-md text-on-surface-muted hover:bg-surface-inset hover:text-on-surface",
        // `primary-text`, never `primary`: the raw accent as text is ~1.6:1
        // on the paper ground.
        link: "text-primary-text underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-[15px] py-2",
        sm: "h-8 rounded-sm px-2.5 text-data-sm",
        lg: "h-10 px-[18px]",
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
