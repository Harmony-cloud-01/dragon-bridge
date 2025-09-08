"use client"

import { scopedKey } from "@/utils/profile-storage"
import { getStorage, currentProfileId } from "@/storage"

export type ActivityEvent =
| { type: "audio.play"; text: string; dialect?: string; t: number }
| { type: "srs.grade"; key: string; grade: string; t: number }
| { type: "srs.add"; key: string; t: number }
| { type: "tone.analysis"; text: string; dialect?: string; t: number } 

export function logEvent(ev: ActivityEvent) {
  if (typeof window === "undefined") return
  ;(async () => {
    try {
      const eng = await getStorage()
      await eng.logEvent(ev, currentProfileId())
      window.dispatchEvent(new CustomEvent("activity:updated", { detail: ev }))
    } catch {
      // fallback to localStorage in case storage init fails
      try {
        const BASE_ACTIVITY = "activity.logs"
        const key = scopedKey(BASE_ACTIVITY)
        const raw = localStorage.getItem(key)
        const arr: ActivityEvent[] = raw ? JSON.parse(raw) : []
        arr.push(ev)
        localStorage.setItem(key, JSON.stringify(arr))
        window.dispatchEvent(new CustomEvent("activity:updated", { detail: ev }))
      } catch {}
    }
  })()
}

export function readEvents(): ActivityEvent[] {
  if (typeof window === "undefined") return []
  // For now, read from localStorage synchronously for UI simplicity
  try {
    const BASE_ACTIVITY = "activity.logs"
    const key = scopedKey(BASE_ACTIVITY)
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as ActivityEvent[]) : []
  } catch { return [] }
}

export function clearEvents() {
  if (typeof window === "undefined") return
  ;(async () => {
    try {
      const eng = await getStorage()
      await eng.clearEvents(currentProfileId())
      window.dispatchEvent(new Event("activity:updated"))
    } catch {
      try {
        const BASE_ACTIVITY = "activity.logs"
        const key = scopedKey(BASE_ACTIVITY)
        localStorage.removeItem(key)
        window.dispatchEvent(new Event("activity:updated"))
      } catch {}
    }
  })()
}
