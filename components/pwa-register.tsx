// components/pwa-register.tsx
"use client"

import { useEffect } from "react"
import { useBasePath } from "./BasePathProvider" // Add this import

export function PWARegister() {
  const { withBasePath } = useBasePath() // Use the hook instead of props

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(withBasePath("/sw.js")) // Use withBasePath
        .then((registration) => {
          console.log("SW registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    }
  }, [withBasePath])

  return null
}
