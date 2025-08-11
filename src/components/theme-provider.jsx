import { createContext, useContext, useEffect, useState } from "react"

const ThemeProviderContext = createContext({
  theme: "system",
  setTheme: () => null,
})

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useState(
    () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem(storageKey) || defaultTheme
      }
      return defaultTheme
    }
  )

  useEffect(() => {
    const root = window.document.documentElement
    const body = window.document.body

    root.classList.remove("light", "dark")
    body.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      body.classList.add(systemTheme)
      console.log("Applied system theme:", systemTheme)
      return
    }

    root.classList.add(theme)
    body.classList.add(theme)
    console.log("Applied theme:", theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme) => {
      console.log("Setting theme to:", newTheme)
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}