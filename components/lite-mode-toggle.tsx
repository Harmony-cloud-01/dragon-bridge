"use client"

import { useLiteMode } from "./lite-mode"
import { Zap, ZapOff } from "lucide-react"
import { cn } from "@/lib/utils"

export function LiteModeToggle() {
  const { enabled, toggle, reason } = useLiteMode()

  return (
    <button
      aria-label={enabled ? "Disable Lite Mode" : "Enable Lite Mode"}
      onClick={toggle}
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "rounded-full border px-3 py-2 text-xs shadow bg-white/90 backdrop-blur",
        "hover:bg-white transition"
      )}
      title={enabled ? `Lite Mode on (${reason ?? "user"})` : "Lite Mode off"}
    >
      <span className="inline-flex items-center gap-2">
        {enabled ? <Zap className="h-4 w-4 text-amber-600" /> : <ZapOff className="h-4 w-4 text-slate-600" />}
        <span className="hidden sm:inline">Lite</span>
      </span>
    </button>
  )
}

