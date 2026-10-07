"use client"

import { getStorage } from "@/storage"
import { queueSrsMutation } from "@/storage/srs-mutations"
import type { SrsItem } from "@/types/srs"
import type { ActivityEvent } from "@/utils/activity-log"
import { scopedKey, type Profile } from "@/utils/profile-storage"

type BackupProfile = Pick<Profile, "id" | "name" | "avatar">
type ReminderConfig = { hour: number; minute: number; days: number[]; enabled: boolean }
type BackupData = {
  srs?: Record<string, SrsItem> | null
  activity?: ActivityEvent[] | null
  reminders?: ReminderConfig | null
  dialect?: {
    selectedDialects?: string[] | null
    playbackRate?: number | null
    preferredVoice?: string | null
  } | null
  uiLang?: "en" | "zh" | null
}
export type ProfileBackup = {
  exportedAt: string
  profile: BackupProfile | null
  data: BackupData
  version: 2
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
function timestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 8640000000000000
}
function invalid(field: string): never { throw new Error(`Invalid profile backup: ${field}`) }

// Validate every supported field before initialization or writes. Null fields from
// older v2 exports mean "not saved"; empty objects/arrays explicitly clear progress.
export function validateProfileBackup(value: unknown): asserts value is Pick<ProfileBackup, "version" | "data"> {
  if (!record(value) || value.version !== 2 || !record(value.data)) invalid("expected version 2 and a data object")
  const data = value.data
  if (!["srs", "activity", "reminders", "dialect", "uiLang"].some(key => Object.prototype.hasOwnProperty.call(data, key))) invalid("no profile data")
  if (data.srs != null) {
    if (!record(data.srs)) invalid("SRS items")
    for (const [key, item] of Object.entries(data.srs)) {
      if (["__proto__", "constructor", "prototype"].includes(key) || !record(item) || item.key !== key ||
        typeof item.text !== "string" || !["word", "phrase", "character"].includes(item.type as string) ||
        !Number.isInteger(item.box) || Number(item.box) < 1 || Number(item.box) > 5 ||
        !timestamp(item.due) || !timestamp(item.addedAt) || !Array.isArray(item.history) ||
        !item.history.every(entry => record(entry) && timestamp(entry.t) && ["again", "hard", "good", "easy"].includes(entry.grade as string))) invalid("SRS item")
    }
  }
  if (data.activity != null) {
    if (!Array.isArray(data.activity)) invalid("activity events")
    for (const event of data.activity) {
      if (!record(event) || !timestamp(event.t)) invalid("activity event")
      if (event.type === "audio.play" || event.type === "tone.analysis") {
        if (typeof event.text !== "string" || (event.dialect !== undefined && typeof event.dialect !== "string")) invalid("audio/tone event")
      } else if (event.type === "srs.add" || event.type === "srs.grade") {
        if (typeof event.key !== "string" || (event.type === "srs.grade" && typeof event.grade !== "string")) invalid("SRS event")
      } else invalid("activity event type")
    }
  }
  if (data.reminders != null) {
    const reminder = data.reminders
    if (!record(reminder) || !Number.isInteger(reminder.hour) || Number(reminder.hour) < 0 || Number(reminder.hour) > 23 ||
      !Number.isInteger(reminder.minute) || Number(reminder.minute) < 0 || Number(reminder.minute) > 59 ||
      !Array.isArray(reminder.days) || !reminder.days.every(day => Number.isInteger(day) && day >= 0 && day <= 6) ||
      typeof reminder.enabled !== "boolean") invalid("reminder settings")
  }
  if (data.dialect != null) {
    if (!record(data.dialect)) invalid("dialect settings")
    const { selectedDialects, playbackRate, preferredVoice } = data.dialect
    if (selectedDialects != null && (!Array.isArray(selectedDialects) || !selectedDialects.every(value => typeof value === "string"))) invalid("selected dialects")
    if (playbackRate != null && (typeof playbackRate !== "number" || !Number.isFinite(playbackRate) || playbackRate <= 0)) invalid("playback rate")
    if (preferredVoice != null && typeof preferredVoice !== "string") invalid("preferred voice")
  }
  if (data.uiLang != null && data.uiLang !== "en" && data.uiLang !== "zh") invalid("UI language")
}

// Preferences still belong to the existing local providers, even on native.
// The backup field names stay unchanged while dialect providers use v2 keys.
function readPreference(key: string, profileId: string | null): unknown {
  const raw = localStorage.getItem(scopedKey(key, profileId))
  if (raw === null) return null
  if (key === "ui.lang" || key.endsWith("preferredVoice")) {
    return raw.startsWith('"') ? JSON.parse(raw) : raw
  }
  return JSON.parse(raw)
}

export async function exportProfileBackup(profile: BackupProfile | null): Promise<ProfileBackup> {
  const snapshot = profile ? { id: profile.id, name: profile.name, avatar: profile.avatar } : null
  const profileId = snapshot?.id ?? null
  return queueSrsMutation(async () => {
    const engine = await getStorage()
    const [srs, activity] = await Promise.all([engine.srsLoadAll(profileId), engine.readEvents(profileId)])
    const payload = {
      exportedAt: new Date().toISOString(), profile: snapshot, version: 2,
      data: {
        srs, activity,
        reminders: readPreference("daily.reminder.config", profileId),
        dialect: {
          selectedDialects: readPreference("dialect.v2.selectedDialects", profileId),
          playbackRate: readPreference("dialect.v2.playbackRate", profileId),
          preferredVoice: readPreference("dialect.v2.preferredVoice", profileId),
        },
        uiLang: readPreference("ui.lang", profileId),
      },
    }
    validateProfileBackup(payload)
    return payload
  })
}

export async function importProfileBackup(value: unknown, profileId: string | null): Promise<void> {
  validateProfileBackup(value)
  const data = value.data
  await queueSrsMutation(async () => {
    const engine = await getStorage()
    // Complete prerequisite reads before mutating either progress collection.
    const existing = data.srs == null ? {} : await engine.srsLoadAll(profileId)
    let writing = false
    const writePreference = (key: string, value: unknown) => {
      writing = true
      if (value === null) localStorage.removeItem(scopedKey(key, profileId))
      else localStorage.setItem(scopedKey(key, profileId), typeof value === "string" ? value : JSON.stringify(value))
    }
    try {
      if (data.srs != null) {
        writing = true
        for (const item of Object.values(data.srs)) await engine.srsUpsert(item, profileId)
        for (const key of Object.keys(existing)) if (!Object.prototype.hasOwnProperty.call(data.srs, key)) await engine.srsRemove(key, profileId)
      }
      if (data.activity != null) {
        writing = true
        await engine.clearEvents(profileId)
        for (const event of data.activity) await engine.logEvent(event, profileId)
      }
      if (data.reminders != null) writePreference("daily.reminder.config", data.reminders)
      if (data.dialect?.selectedDialects != null) writePreference("dialect.v2.selectedDialects", data.dialect.selectedDialects)
      if (data.dialect?.playbackRate != null) writePreference("dialect.v2.playbackRate", data.dialect.playbackRate)
      if (data.dialect && data.dialect.preferredVoice !== undefined) writePreference("dialect.v2.preferredVoice", data.dialect.preferredVoice)
      if (data.uiLang != null) writePreference("ui.lang", data.uiLang)
    } catch (error) {
      // The engine currently has per-record writes, not an atomic backup API.
      throw new Error(`Some profile data may have changed. Retry the same backup to finish importing. ${error instanceof Error ? error.message : "Storage write failed."}`)
    } finally {
      if (writing) {
        window.dispatchEvent(new CustomEvent("srs:updated", { detail: { profileId } }))
        window.dispatchEvent(new Event("activity:updated"))
        window.dispatchEvent(new Event("profile:changed"))
      }
    }
  })
}
