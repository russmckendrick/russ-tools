import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Status only. DESIGN.md: status colours are the only colours permitted to
 * express state, and colour is never the sole carrier of meaning — so every
 * variant keeps its icon slot and its text.
 */
const alertVariants = cva(
  cn(
    "rt-enter-surface relative w-full rounded-lg border p-4 text-body-sm",
    "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-4",
    "[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-2px]"
  ),
  {
    variants: {
      variant: {
        default: "border-outline bg-surface-inset text-on-surface",
        destructive: "border-danger/40 bg-danger-subtle text-danger [&>svg]:text-danger",
        success: "border-success/40 bg-success-subtle text-success [&>svg]:text-success",
        warning: "border-warning/40 bg-warning-subtle text-warning [&>svg]:text-warning",
        info: "border-info/40 bg-info-subtle text-info [&>svg]:text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-body-sm [&_p]:leading-relaxed", className)} {...props} />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
