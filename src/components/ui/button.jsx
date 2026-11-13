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
 * 2. **The label is `on-primary`, which flips with the theme.** The accent
 *    is a deep green in light (white ink) and mint in dark (ink-green ink).
 *    `tokens.contrast.test.js` measures both.
 *
 * Under Datasheet a solid button is flat: no border of its own, `rounded-md`,
 * and a 1px sink on `:active`. The accent's hover state is the explicit
 * `primary-hover` token rather than a `brightness()` filter, which would
 * drift the hue off the value measured against its ink. `outline` and
 * `secondary` take the 3:1 `outline-strong` boundary; ghost and link stay
 * chromeless.
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
          "rounded-md border border-transparent bg-primary text-on-primary hover:bg-primary-hover active:translate-y-px",
        // `on-status`, not `on-primary`. The ink on a status fill flips with
        // the theme — graphite on the bright dark hue, white on the deep
        // light one — while the accent's ink is graphite in both.
        destructive:
          "rounded-md border border-transparent bg-error text-on-status hover:brightness-110 active:translate-y-px",
        outline:
          "rounded-md border border-outline-strong bg-transparent text-on-surface hover:bg-surface-inset active:translate-y-px",
        secondary:
          "rounded-md border border-outline-strong bg-surface-raised text-on-surface hover:bg-surface-inset active:translate-y-px",
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
