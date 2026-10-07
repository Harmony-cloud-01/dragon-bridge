"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { logEvent } from "@/utils/activity-log"
import type { SrsItem, SrsGrade, SrsItemType } from "@/types/srs"
import { getStorage, currentProfileId } from "@/storage"
import { queueSrsMutation } from "@/storage/srs-mutations"
import { reportStorageFailure } from "@/storage/failure"

// Intervals per box in days
const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 16, 30] // 0th unused; box 1..5

function nextDue(box: number) {
  const days = BOX_INTERVALS_DAYS[Math.max(1, Math.min(5, box))]
  return Date.now() + days * 24 * 60 * 60 * 1000
}

export function useSrs() {
  const [items, setItems] = useState<Record<string, SrsItem>>({})

  useEffect(() => {
    let active = true
    let version = 0
    const load = async () => {
      const request = ++version
      const profile = currentProfileId()
      try {
        const eng = await getStorage()
        const map = await eng.srsLoadAll(profile)
        if (active && request === version && profile === currentProfileId()) setItems(map)
      } catch {
        if (active && request === version) reportStorageFailure("load progress")
      }
    }
    const onProfileChange = () => { setItems({}); void load() }
    void load()
    window.addEventListener("profile:changed", onProfileChange)
    window.addEventListener("srs:updated", load)
    return () => {
      active = false
      window.removeEventListener("profile:changed", onProfileChange)
      window.removeEventListener("srs:updated", load)
    }
  }, [])

  const mutate = useCallback(async (
    profile: string | null,
    operation: (eng: Awaited<ReturnType<typeof getStorage>>) => Promise<void>,
  ): Promise<boolean> => {
    try {
      await queueSrsMutation(async () => operation(await getStorage()))
      window.dispatchEvent(new CustomEvent("srs:updated", { detail: { profileId: profile } }))
      return true
    } catch {
      reportStorageFailure()
      return false
    }
  }, [])

  const addItem = useCallback((text: string, type: SrsItemType = "word", opts?: { initialBox?: number }) => {
    const profile = currentProfileId()
    const key = `${type}:${text}`
    return mutate(profile, async (eng) => {
      const map = await eng.srsLoadAll(profile)
      if (map[key]) return
      const startBox = Math.max(1, Math.min(5, opts?.initialBox ?? 1))
      const item: SrsItem = { key, text, type, box: startBox, due: nextDue(startBox), addedAt: Date.now(), history: [] }
      await eng.srsUpsert(item, profile)
      logEvent({ type: "srs.add", key, t: Date.now() }, profile)
    })
  }, [mutate])

  const removeItem = useCallback((key: string) => {
    const profile = currentProfileId()
    return mutate(profile, (eng) => eng.srsRemove(key, profile))
  }, [mutate])

  const gradeItem = useCallback((key: string, grade: SrsGrade) => {
    const profile = currentProfileId()
    return mutate(profile, async (eng) => {
      const map = await eng.srsLoadAll(profile)
      const it = map[key]
      if (!it) throw new Error("Review item no longer exists")
      let box = it.box
      if (grade === "again") box = Math.max(1, box - 1)
      if (grade === "good") box = Math.min(5, box + 1)
      if (grade === "easy") box = Math.min(5, box + 2)
      await eng.srsUpsert({ ...it, box, due: nextDue(box), history: [...it.history, { t: Date.now(), grade }] }, profile)
      logEvent({ type: "srs.grade", key, grade, t: Date.now() }, profile)
    })
  }, [mutate])

  const dueItems = useMemo(() => {
    const now = Date.now()
    return Object.values(items)
      .filter((it) => it.due <= now)
      .sort((a, b) => a.due - b.due)
  }, [items])

  const allItems = useMemo(() => Object.values(items).sort((a, b) => a.addedAt - b.addedAt), [items])

  return { items, allItems, dueItems, addItem, removeItem, gradeItem }
}
