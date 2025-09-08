"use client"

import type { StorageEngine } from "./engine"
import { makeLocalEngine } from "./local"
import { makeSQLiteEngine } from "./sqlite"
import { getCurrentProfileId } from "@/utils/profile-storage"

let enginePromise: Promise<StorageEngine> | null = null

export function getStorage(): Promise<StorageEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const sqlite = await makeSQLiteEngine().catch(() => null)
      const eng = sqlite ?? makeLocalEngine()
      await eng.init()
      return eng
    })()
  }
  return enginePromise
}

export function currentProfileId(): string | null {
  return getCurrentProfileId()
}

