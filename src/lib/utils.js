import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useEffect, useState } from "react"

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