"use client"

import { scopedKey } from "@/utils/profile-storage"
import { getStorage, currentProfileId } from "@/storage"
import { reportStorageFailure } from "@/storage/failure"

const LS_CONSENT = "privacy.voiceConsent"
// An explicit choice stays authoritative for this session, even when persistence
// is unavailable or an older background read resolves after a revocation.
const sessionChoices = new Map<string, boolean>()

export function getConsent(): boolean {
  if (typeof window === "undefined") return false
  const profileId = currentProfileId()
  const key = scopedKey(LS_CONSENT, profileId)
  if (sessionChoices.has(key)) return sessionChoices.get(key)!
  try {
    const cached = localStorage.getItem(key)
    ;(async () => {
      try {
        const eng = await getStorage()
        const stored = await eng.settingsGet(LS_CONSENT, profileId)
        if (stored == null || sessionChoices.has(key)) return
        try { localStorage.setItem(key, stored) } catch {}
        if (currentProfileId() === profileId && stored !== cached) {
          window.dispatchEvent(new CustomEvent("consent:changed", { detail: stored === "true" }))
        }
      } catch {}
    })()
    return cached === "true"
  } catch {
    return false
  }
}

export function setConsent(value: boolean) {
  if (typeof window === "undefined") return
  const profileId = currentProfileId()
  const key = scopedKey(LS_CONSENT, profileId)
  sessionChoices.set(key, value)
  try { localStorage.setItem(key, String(value)) } catch { reportStorageFailure("save microphone consent") }
  // Revocation is immediate and must not depend on a successful storage write.
  window.dispatchEvent(new CustomEvent("consent:changed", { detail: value }))
  ;(async () => {
    try {
      const eng = await getStorage()
      await eng.settingsSet(LS_CONSENT, String(value), profileId)
    } catch { reportStorageFailure("save microphone consent") }
  })()
}
