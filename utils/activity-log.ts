"use client"

import { getStorage, currentProfileId } from "@/storage"
import { reportStorageFailure } from "@/storage/failure"

export type ActivityEvent =
| { type: "audio.play"; text: string; dialect?: string; t: number }
| { type: "srs.grade"; key: string; grade: string; t: number }
| { type: "srs.add"; key: string; t: number }
| { type: "tone.analysis"; text: string; dialect?: string; t: number }

export async function logEvent(ev: ActivityEvent, profileId = currentProfileId()): Promise<boolean> {
  if (typeof window === "undefined") return false
  try {
    const eng = await getStorage()
    await eng.logEvent(ev, profileId)
    window.dispatchEvent(new CustomEvent("activity:updated", { detail: ev }))
    return true
  } catch {
    reportStorageFailure("save activity")
    return false
  }
}

export async function readEvents(profileId = currentProfileId()): Promise<ActivityEvent[]> {
  if (typeof window === "undefined") return []
  const eng = await getStorage()
  return eng.readEvents(profileId)
}

export async function clearEvents(profileId = currentProfileId()): Promise<boolean> {
  if (typeof window === "undefined") return false
  try {
    const eng = await getStorage()
    await eng.clearEvents(profileId)
    window.dispatchEvent(new Event("activity:updated"))
    return true
  } catch {
    reportStorageFailure("clear activity")
    return false
  }
}
