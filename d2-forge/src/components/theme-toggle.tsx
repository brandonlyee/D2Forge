"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Icon } from "@/components/forge/icons"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light" : "Switch to dark"}
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      {isDark ? <Icon.sun /> : <Icon.moon />}
    </button>
  )
}
