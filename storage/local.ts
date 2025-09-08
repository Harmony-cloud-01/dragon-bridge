"use client"

import type { StorageEngine } from "./engine"
import type { ActivityEvent } from "@/utils/activity-log"
import type { SrsItem } from "@/types/srs"
import type { Profile } from "@/utils/profile-storage"
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
    async srsLoadAll(profileId?: string | null) {
      if (typeof window === "undefined") return {}
      try {
        const key = scopedKey("srs.items", profileId ?? undefined)
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as Record<string, SrsItem>) : {}
      } catch { return {} }
    },
    async srsUpsert(item: SrsItem, profileId?: string | null) {
      if (typeof window === "undefined") return
      const key = scopedKey("srs.items", profileId ?? undefined)
      try {
        const raw = localStorage.getItem(key)
        const map: Record<string, SrsItem> = raw ? JSON.parse(raw) : {}
        map[item.key] = item
        localStorage.setItem(key, JSON.stringify(map))
      } catch {}
    },
    async srsRemove(srsKey: string, profileId?: string | null) {
      if (typeof window === "undefined") return
      const key = scopedKey("srs.items", profileId ?? undefined)
      try {
        const raw = localStorage.getItem(key)
        const map: Record<string, SrsItem> = raw ? JSON.parse(raw) : {}
        delete map[srsKey]
        localStorage.setItem(key, JSON.stringify(map))
      } catch {}
    },
    async profilesLoad() {
      if (typeof window === "undefined") return []
      try {
        const raw = localStorage.getItem('profile.list')
        return raw ? (JSON.parse(raw) as Profile[]) : []
      } catch { return [] }
    },
    async profilesSave(list: Profile[]) {
      if (typeof window === "undefined") return
      try { localStorage.setItem('profile.list', JSON.stringify(list)) } catch {}
    },
    async profilesGetCurrent() {
      if (typeof window === "undefined") return null
      try { return localStorage.getItem('profile.current') } catch { return null }
    },
    async profilesSetCurrent(id: string) {
      if (typeof window === "undefined") return
      try { localStorage.setItem('profile.current', id) } catch {}
    },
    async settingsGet(key: string, profileId?: string | null) {
      if (typeof window === "undefined") return null
      try { return localStorage.getItem(scopedKey(key, profileId ?? undefined)) } catch { return null }
    },
    async settingsSet(key: string, value: string, profileId?: string | null) {
      if (typeof window === "undefined") return
      try { localStorage.setItem(scopedKey(key, profileId ?? undefined), value) } catch {}
    },
  }
}
