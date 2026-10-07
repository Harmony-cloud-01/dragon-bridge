import type { StorageEngine } from "./engine"
import type { SrsItem } from "@/types/srs"
import type { ActivityEvent } from "@/utils/activity-log"

// Earlier native builds could save activity through the localStorage fallback.
// Import missing progress before exposing SQLite. Keep source bytes untouched;
// replay is safe after partial failure. Existing native SRS records win conflicts.
export async function migrateLocalProgress(engine: StorageEngine): Promise<void> {
  if (typeof window === "undefined") return
  const marker = "migration.local-progress.v1"
  if (await engine.settingsGet(marker, null) === "complete") return
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && /^(srs\.items|activity\.logs)(::.+)?$/.test(key)) keys.push(key)
  }
  for (const key of keys) {
    const raw = localStorage.getItem(key)
    if (raw === null) continue
    const value = JSON.parse(raw)
    const separator = key.indexOf("::")
    const profileId = separator < 0 ? null : key.slice(separator + 2)
    if (key.startsWith("srs.items")) {
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid legacy SRS data")
      const existing = await engine.srsLoadAll(profileId)
      for (const [itemKey, item] of Object.entries(value) as [string, SrsItem][]) {
        if (!item || item.key !== itemKey || typeof item.text !== "string" || !Array.isArray(item.history)) {
          throw new Error("Invalid legacy SRS item")
        }
        if (!existing[itemKey]) await engine.srsUpsert(item, profileId)
      }
    } else {
      if (!Array.isArray(value)) throw new Error("Invalid legacy activity data")
      const existing = new Map<string, number>()
      for (const event of await engine.readEvents(profileId)) {
        const signature = JSON.stringify(event)
        existing.set(signature, (existing.get(signature) ?? 0) + 1)
      }
      for (const event of value as ActivityEvent[]) {
        if (!event || typeof event.type !== "string" || typeof event.t !== "number") throw new Error("Invalid legacy activity event")
        const signature = JSON.stringify(event)
        const count = existing.get(signature) ?? 0
        if (count > 0) existing.set(signature, count - 1)
        else await engine.logEvent(event, profileId)
      }
    }
  }
  // Write last: a partial import retries, but successful imports never resurrect
  // subsequently removed SRS/activity from the preserved local backup.
  await engine.settingsSet(marker, "complete", null)
}
