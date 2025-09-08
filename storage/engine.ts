"use client"

import type { ActivityEvent } from "@/utils/activity-log"

export interface StorageEngine {
  init(): Promise<void>
  // Activity logs
  logEvent(ev: ActivityEvent, profileId?: string | null): Promise<void>
  readEvents(profileId?: string | null): Promise<ActivityEvent[]>
  clearEvents(profileId?: string | null): Promise<void>
}

