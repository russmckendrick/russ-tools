import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * DESIGN.md's Panel, under shadcn's name.
 *
 * Every tool already renders through this file — 48 of them — so it is the
 * one place a change reaches all fifteen at once. That is deliberate: the
 * alternative is fifteen tools each deciding what a container looks like,
 * which is exactly the inconsistency the redesign exists to remove.
 *
 * Per DESIGN.md's `panel`: `surface-raised` ground in both themes and a 1px
 * `outline` hairline. Square, and flat — Signal has no radius and no
 * elevation scale, so the inset top-highlight that used to stop the dark
 * theme reading flat went with them. Depth is ground value plus rule weight.
 *
 * ### Why the press-lg shadow is opt-in
 *
 * DESIGN.md's `panel-emphasis` carries the 5px offset shadow, and the same
 * lesson from Signal's 3px top rule applies: a tool here stacks five to ten
 * panels, and a chunky shadow under every one of them turns "this is the
 * page's subject" into wallpaper. Panels at rest carry the 2px border only.
 *
 * So the weight is a prop. `<Card emphasis>` marks the one panel per page
 * that is the page's subject — the result, the output, the thing you came
 * for. Everything else is just the border.
 */
const Card = React.forwardRef(({ className, emphasis = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden rounded-lg border-2 border-rule bg-surface-raised text-on-surface",
      emphasis && "shadow-press-lg",
      "transition-[border-color,background-color,box-shadow] duration-140 ease-out",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * The panel header bar, separated by the same hairline. It takes the plain
 * page ground rather than a 60% tint of the inset: against `surface-raised`
 * that is the darker of the two in dark mode and the lighter in light, which
 * is the same read in both without a `color-mix` to reason about.
 *
 * DESIGN.md specifies a `label-caps` title here, but tools supply their own
 * heading markup, so the bar sets the ground and the rhythm and lets the
 * tool's text sit in it.
 */
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-1 border-b border-outline bg-surface px-4 py-3",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-title-sm text-on-surface", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-body-sm text-on-surface-muted", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 border-t border-outline px-4 py-3", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
