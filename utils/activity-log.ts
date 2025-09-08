"use client"

import { scopedKey } from "@/utils/profile-storage"

export type ActivityEvent =
| { type: "audio.play"; text: string; dialect?: string; t: number }
| { type: "srs.grade"; key: string; grade: string; t: number }
| { type: "srs.add"; key: string; t: number }
| { type: "tone.analysis"; text: string; dialect?: string; t: number } 

const BASE_ACTIVITY = "activity.logs"

function key() {
  return scopedKey(BASE_ACTIVITY)
}

export function logEvent(ev: ActivityEvent) {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem(key())
    const arr: ActivityEvent[] = raw ? JSON.parse(raw) : []
    arr.push(ev)
    localStorage.setItem(key(), JSON.stringify(arr))
    // Notify listeners so UI can refresh live
    window.dispatchEvent(new CustomEvent("activity:updated", { detail: ev }))
  } catch {}
}

export function readEvents(): ActivityEvent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key())
    return raw ? (JSON.parse(raw) as ActivityEvent[]) : []
  } catch {
    return []
  }
}

export function clearEvents() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(key())
    window.dispatchEvent(new Event("activity:updated"))
  } catch {}
}
