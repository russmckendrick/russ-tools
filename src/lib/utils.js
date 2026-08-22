import { clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"
import { useEffect, useState } from "react"

/**
 * tailwind-merge has to be told about DESIGN.md's type scale.
 *
 * Out of the box it knows Tailwind's stock sizes (`text-sm`, `text-lg`) and
 * assumes any other `text-*` is a colour. So in
 * `cn("text-body-sm ... text-on-surface-muted")` it saw two colours, kept the
 * last, and **silently dropped the size** — which is why labels and inputs
 * rendered without their step even though the class was right there in the
 * source. Every custom step was affected wherever it shared a component with
 * a text colour, which is most of them.
 *
 * Declaring the steps as `font-size` makes the two groups distinct again.
 * This list must match DESIGN.md's `typography` block exactly — a step missing
 * here is a step `cn()` deletes at every call site, silently.
 * Guarded by src/lib/utils.test.js.
 */
const TYPE_SCALE = [
  "display",
  "headline-lg",
  "headline-md",
  "title-sm",
  "body-lg",
  "body-md",
  "body-sm",
  "label-caps",
  "label-caps-sm",
  "data-xl",
  "data-lg",
  "data-md",
  "data-sm",
  "verdict",
]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: TYPE_SCALE }],
    },
  },
})

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Lightweight localStorage hook compatible with Mantine's API
// Supports both signature forms:
// - useLocalStorage({ key, defaultValue })
// - useLocalStorage(key, defaultValue)
export function useLocalStorage(arg1, arg2) {
  const config = typeof arg1 === 'string' ? { key: arg1, defaultValue: arg2 } : arg1 || {}
  const storageKey = config.key
  const defaultValue = config.defaultValue

  const readStoredValue = () => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw === null || raw === undefined) return defaultValue
      return JSON.parse(raw)
    } catch (_) {
      return defaultValue
    }
  }

  const [value, setValue] = useState(readStoredValue)

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value))
    } catch (_) {
      // ignore write errors
    }
  }, [storageKey, value])

  return [value, setValue]
}