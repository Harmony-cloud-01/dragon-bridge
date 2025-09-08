"use client"

import { useDialect } from "@/hooks/use-dialect"

export function AudioStatus() {
  const { currentlyPlaying, currentDialect, isPlaying } = useDialect()
  // Accessible live region to announce audio state
  return (
    <div aria-live="polite" className="sr-only" role="status">
      {isPlaying
        ? `Playing ${currentDialect ? currentDialect : "audio"}: ${currentlyPlaying ?? ""}`
        : "Audio stopped"}
    </div>
  )
}
