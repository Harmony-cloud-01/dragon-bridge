"use client"

import { scopedKey } from "@/utils/profile-storage"
import { getStorage, currentProfileId } from "@/storage"

const LS_PREFER_LOCAL_AUDIO = "settings.preferLocalAudio"

export function getPreferLocalAudio(): boolean {
  if (typeof window === "undefined") return false
  try {
    const v = localStorage.getItem(scopedKey(LS_PREFER_LOCAL_AUDIO))
    ;(async () => {
      try {
        const eng = await getStorage()
        const stored = await eng.settingsGet(LS_PREFER_LOCAL_AUDIO, currentProfileId())
        if (stored != null) localStorage.setItem(scopedKey(LS_PREFER_LOCAL_AUDIO), stored)
      } catch {}
    })()
    return v === "true"
  } catch {
    return false
  }
}

export function setPreferLocalAudio(v: boolean) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(scopedKey(LS_PREFER_LOCAL_AUDIO), String(v))
    window.dispatchEvent(new CustomEvent("settings:changed", { detail: { preferLocalAudio: v } }))
  } catch {}
  ;(async () => { try { const eng = await getStorage(); await eng.settingsSet(LS_PREFER_LOCAL_AUDIO, String(v), currentProfileId()) } catch {} })()
}
