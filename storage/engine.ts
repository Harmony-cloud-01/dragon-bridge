"use client"

import type { ActivityEvent } from "@/utils/activity-log"
import type { SrsItem } from "@/types/srs"
import type { Profile } from "@/utils/profile-storage"

export interface StorageEngine {
  init(): Promise<void>
  // Activity logs
  logEvent(ev: ActivityEvent, profileId?: string | null): Promise<void>
  readEvents(profileId?: string | null): Promise<ActivityEvent[]>
  clearEvents(profileId?: string | null): Promise<void>
  // SRS
  srsLoadAll(profileId?: string | null): Promise<Record<string, SrsItem>>
  srsUpsert(item: SrsItem, profileId?: string | null): Promise<void>
  srsRemove(key: string, profileId?: string | null): Promise<void>
  // Profiles (optional async mirror)
  profilesLoad(): Promise<Profile[]>
  profilesSave(list: Profile[]): Promise<void>
  profilesGetCurrent(): Promise<string | null>
  profilesSetCurrent(id: string): Promise<void>
}
