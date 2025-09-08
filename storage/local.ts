"use client"

import type { StorageEngine } from "./engine"
import type { ActivityEvent } from "@/utils/activity-log"
import { scopedKey } from "@/utils/profile-storage"

const BASE_ACTIVITY = "activity.logs"

export function makeLocalEngine(): StorageEngine {
  return {
    async init() {},
    async logEvent(ev: ActivityEvent, profileId?: string | null) {
      if (typeof window === "undefined") return
      try {
        const key = scopedKey(BASE_ACTIVITY, profileId ?? undefined)
        const raw = localStorage.getItem(key)
        const arr: ActivityEvent[] = raw ? JSON.parse(raw) : []
        arr.push(ev)
        localStorage.setItem(key, JSON.stringify(arr))
      } catch {}
    },
    async readEvents(profileId?: string | null) {
      if (typeof window === "undefined") return []
      try {
        const key = scopedKey(BASE_ACTIVITY, profileId ?? undefined)
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as ActivityEvent[]) : []
      } catch {
        return []
      }
    },
    async clearEvents(profileId?: string | null) {
      if (typeof window === "undefined") return
      try {
        const key = scopedKey(BASE_ACTIVITY, profileId ?? undefined)
        localStorage.removeItem(key)
      } catch {}
    },
  }
}

