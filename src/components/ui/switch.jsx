import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

/**
 * The toggle is a pill — `rounded-full` is Stacks' pill radius — drawn with
 * the same 2px `rule` border as every other control. The accent fills the
 * checked track; the unchecked track is the inset ground behind the border.
 */
const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-rule transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-surface-inset",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // No `ring-0`: it neutralises a ring nothing sets here, and it does it
        // by emitting a five-layer transparent `box-shadow` — the only
        // computed box-shadow left anywhere in the app once Signal landed.
        "pointer-events-none block h-4 w-4 rounded-full border border-rule bg-surface-raised transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }