"use client"

export type AvatarKey = "male" | "female" | "child"

export type Profile = {
  id: string
  name: string
  avatar: AvatarKey
  createdAt: number
  lastActiveAt: number
  pinHash?: string | null
}

export const LS_PROFILES = "profile.list"
export const LS_CURRENT = "profile.current"

// Keys we may want to migrate when introducing profiles for the first time
const MIGRATE_KEYS = [
  "srs.items",
  "activity.logs",
  "daily.reminder.config",
  "dialect.selectedDialects",
  "dialect.playbackRate",
  "dialect.preferredVoice",
  "ui.lang", // added to migrate UI language to profile scope
]

export function getCurrentProfileId(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(LS_CURRENT)
  } catch {
    return null
  }
}

export function setCurrentProfileId(id: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LS_CURRENT, id)
  } catch {}
}

export function loadProfiles(): Profile[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LS_PROFILES)
    return raw ? (JSON.parse(raw) as Profile[]) : []
  } catch {
    return []
  }
}

export function saveProfiles(profiles: Profile[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LS_PROFILES, JSON.stringify(profiles))
  } catch {}
}

export function scopedKey(base: string, profileId?: string | null) {
  const id = profileId ?? getCurrentProfileId()
  return id ? `${base}::${id}` : base
}

export function migrateGlobalToProfile(profileId: string) {
  // Move global keys into profile-scoped keys if they exist and the scoped key is empty
  if (typeof window === "undefined") return
  try {
    MIGRATE_KEYS.forEach((k) => {
      const globalVal = localStorage.getItem(k)
      const scoped = scopedKey(k, profileId)
      const already = localStorage.getItem(scoped)
      if (globalVal && !already) {
        localStorage.setItem(scoped, globalVal)
      }
    })
  } catch {}
}
