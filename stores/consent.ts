"use client"

import { scopedKey } from "@/utils/profile-storage"
import { getStorage, currentProfileId } from "@/storage"

const LS_CONSENT = "privacy.voiceConsent"

export function getConsent(): boolean {
  if (typeof window === "undefined") return false
  try {
    const v = localStorage.getItem(scopedKey(LS_CONSENT))
    // async refresh from storage engine
    ;(async () => {
      try { 
        const eng = await getStorage()
        const stored = await eng.settingsGet(LS_CONSENT, currentProfileId())
        if (stored != null) localStorage.setItem(scopedKey(LS_CONSENT), stored)
      } catch {}
    })()
    return v === "true"
  } catch {
    return false
  }
}

export function setConsent(v: boolean) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(scopedKey(LS_CONSENT), String(v))
    window.dispatchEvent(new CustomEvent("consent:changed", { detail: v }))
  } catch {}
  ;(async () => { try { const eng = await getStorage(); await eng.settingsSet(LS_CONSENT, String(v), currentProfileId()) } catch {} })()
}
