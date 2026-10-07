"use client"

import type { StorageEngine } from "./engine"
import type { ActivityEvent } from "@/utils/activity-log"
import type { SrsItem } from "@/types/srs"
import type { Profile } from "@/utils/profile-storage"
import { scopedKey } from "@/utils/profile-storage"

function readArray<T>(key: string): T[] {
  const raw = localStorage.getItem(key)
  if (raw === null) return []
  const value = JSON.parse(raw)
  if (!Array.isArray(value)) throw new Error(`Invalid stored list: ${key}`)
  return value
}

function readSrs(key: string): Record<string, SrsItem> {
  const raw = localStorage.getItem(key)
  if (raw === null) return {}
  const value = JSON.parse(raw)
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid stored SRS: ${key}`)
  return value
}

// Storage exceptions must reach callers: a quota/permission error is not a saved change.
export function makeLocalEngine(): StorageEngine {
  return {
    async init() {},
    async logEvent(ev: ActivityEvent, profileId?: string | null) {
      if (typeof window === "undefined") return
      const key = scopedKey("activity.logs", profileId)
      const events = readArray<ActivityEvent>(key)
      events.push(ev)
      localStorage.setItem(key, JSON.stringify(events))
    },
    async readEvents(profileId?: string | null) {
      if (typeof window === "undefined") return []
      return readArray<ActivityEvent>(scopedKey("activity.logs", profileId))
    },
    async clearEvents(profileId?: string | null) {
      if (typeof window === "undefined") return
      localStorage.removeItem(scopedKey("activity.logs", profileId))
    },
    async srsLoadAll(profileId?: string | null) {
      if (typeof window === "undefined") return {}
      return readSrs(scopedKey("srs.items", profileId))
    },
    async srsUpsert(item: SrsItem, profileId?: string | null) {
      if (typeof window === "undefined") return
      const key = scopedKey("srs.items", profileId)
      const map = readSrs(key)
      map[item.key] = item
      localStorage.setItem(key, JSON.stringify(map))
    },
    async srsRemove(srsKey: string, profileId?: string | null) {
      if (typeof window === "undefined") return
      const key = scopedKey("srs.items", profileId)
      const map = readSrs(key)
      delete map[srsKey]
      localStorage.setItem(key, JSON.stringify(map))
    },
    async profilesLoad() {
      if (typeof window === "undefined") return []
      return readArray<Profile>("profile.list")
    },
    async profilesSave(list: Profile[]) {
      if (typeof window === "undefined") return
      localStorage.setItem("profile.list", JSON.stringify(list))
    },
    async profilesGetCurrent() {
      if (typeof window === "undefined") return null
      return localStorage.getItem("profile.current")
    },
    async profilesSetCurrent(id: string) {
      if (typeof window === "undefined") return
      localStorage.setItem("profile.current", id)
    },
    async settingsGet(key: string, profileId?: string | null) {
      if (typeof window === "undefined") return null
      return localStorage.getItem(scopedKey(key, profileId))
    },
    async settingsSet(key: string, value: string, profileId?: string | null) {
      if (typeof window === "undefined") return
      localStorage.setItem(scopedKey(key, profileId), value)
    },
  }
}
