"use client"

import type { StorageEngine } from "./engine"
import { makeLocalEngine } from "./local"
import { makeSQLiteEngine } from "./sqlite"
import { migrateLocalProgress } from "./migrate-local"
import { getCurrentProfileId } from "@/utils/profile-storage"

let enginePromise: Promise<StorageEngine> | null = null
let initializedEngine: StorageEngine | null = null
let native = false

export function getStorage(): Promise<StorageEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      // Native failures must not silently hide an existing database behind a new local store.
      if (!initializedEngine) {
        const sqlite = await makeSQLiteEngine()
        const eng = sqlite ?? makeLocalEngine()
        await eng.init()
        initializedEngine = eng
        native = sqlite !== null
      }
      const eng = initializedEngine
      // Retain an already-open database if migration fails, so a retry does not
      // attempt to create a duplicate native connection.
      if (native) await migrateLocalProgress(eng)
      return eng
    })().catch((error) => {
      enginePromise = null // A later explicit action may retry initialization.
      throw error
    })
  }
  return enginePromise
}

export function currentProfileId(): string | null {
  return getCurrentProfileId()
}

