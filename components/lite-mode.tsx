"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { scopedKey } from "@/utils/profile-storage"

type LiteReason = "user" | "save-data" | "low-memory" | "low-cpu" | "reduced-motion" | null

type LiteModeContextType = {
  enabled: boolean
  reason: LiteReason
  setEnabled: (on: boolean, reason?: LiteReason) => void
  toggle: () => void
}

const LiteModeContext = createContext<LiteModeContextType | undefined>(undefined)

const LS_LITE = "ui.liteMode"

function detectAutoLite(): { on: boolean; reason: LiteReason } {
  try {
    // Network save-data hint
    // @ts-expect-error: older browsers may not have connection
    const saveData = typeof navigator !== "undefined" && navigator?.connection?.saveData
    if (saveData) return { on: true, reason: "save-data" }

    // Memory-constrained devices
    const mem = (navigator as any)?.deviceMemory as number | undefined
    if (mem && mem <= 2) return { on: true, reason: "low-memory" }

    // Lower CPU core count
    const cores = navigator?.hardwareConcurrency
    if (cores && cores <= 4) return { on: true, reason: "low-cpu" }

    // User prefers reduced motion
    const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return { on: true, reason: "reduced-motion" }
  } catch {}
  return { on: false, reason: null }
}

export function LiteModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false)
  const [reason, setReason] = useState<LiteReason>(null)

  // Hydrate from storage or auto-detect
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(scopedKey(LS_LITE))
      if (stored != null) {
        const parsed = JSON.parse(stored)
        setEnabledState(!!parsed)
        setReason("user")
        return
      }
    } catch {}

    const auto = detectAutoLite()
    setEnabledState(auto.on)
    setReason(auto.reason)
  }, [])

  // Reflect on <html> for global CSS overrides
  useEffect(() => {
    if (typeof document === "undefined") return
    const el = document.documentElement
    if (enabled) el.classList.add("lite")
    else el.classList.remove("lite")
  }, [enabled])

  const setEnabled = useCallback((on: boolean, r?: LiteReason) => {
    setEnabledState(on)
    setReason(r ?? "user")
    try {
      localStorage.setItem(scopedKey(LS_LITE), JSON.stringify(on))
    } catch {}
  }, [])

  const toggle = useCallback(() => setEnabled(!enabled, "user"), [enabled, setEnabled])

  const value = useMemo(() => ({ enabled, reason, setEnabled, toggle }), [enabled, reason, setEnabled, toggle])

  return <LiteModeContext.Provider value={value}>{children}</LiteModeContext.Provider>
}

export function useLiteMode(): LiteModeContextType {
  const ctx = useContext(LiteModeContext)
  if (!ctx) throw new Error("useLiteMode must be used within LiteModeProvider")
  return ctx
}

