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
 * Per DESIGN.md: `surface-raised` ground in both themes, a 1px `outline`
 * hairline (never a ring, never a shadow at rest), 10px radius, and the
 * `inset 0 1px 0` top highlight that stops the dark theme reading flat.
 */
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-outline bg-surface-raised text-on-surface",
      "shadow-[inset_0_1px_0_rgba(255,255,255,.05)]",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * The panel header bar: `surface-inset`, separated by the same hairline.
 * DESIGN.md specifies a `label-caps` title here, but tools supply their own
 * heading markup, so the bar sets the ground and the rhythm and lets the
 * tool's text sit in it. Headings normalise per tool as each one ports.
 */
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-1 rounded-t-lg border-b border-outline bg-surface-inset/60 px-4 py-3",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-title-sm font-title-sm tracking-title-sm text-on-surface", className)}
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
