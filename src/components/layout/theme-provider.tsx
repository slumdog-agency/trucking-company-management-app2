import * as React from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // No theme switching functionality needed - using only white theme
  return <>{children}</>
}