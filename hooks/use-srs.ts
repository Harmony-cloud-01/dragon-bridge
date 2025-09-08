"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { logEvent } from "@/utils/activity-log"
import type { SrsItem, SrsGrade, SrsItemType } from "@/types/srs"
import { getStorage, currentProfileId } from "@/storage"

// Intervals per box in days
const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 16, 30] // 0th unused; box 1..5

function nextDue(box: number) {
  const days = BOX_INTERVALS_DAYS[Math.max(1, Math.min(5, box))]
  return Date.now() + days * 24 * 60 * 60 * 1000
}

export function useSrs() {
  const [items, setItems] = useState<Record<string, SrsItem>>({})

  // hydrate
  useEffect(() => {
    (async () => {
      try {
        const eng = await getStorage()
        const map = await eng.srsLoadAll(currentProfileId())
        setItems(map)
      } catch {
        setItems({})
      }
    })()
  }, [])

  // rehydrate on profile change event (additional safety)
  useEffect(() => {
    const onProfileChange = () => {
      ;(async () => {
        try {
          const eng = await getStorage()
          const map = await eng.srsLoadAll(currentProfileId())
          setItems(map)
        } catch { setItems({}) }
      })()
    }
    window.addEventListener("profile:changed", onProfileChange)
    return () => window.removeEventListener("profile:changed", onProfileChange)
  }, [])

  const addItem = useCallback((text: string, type: SrsItemType = "word", opts?: { initialBox?: number }) => {
    const key = `${type}:${text}`
    setItems((prev) => {
      if (prev[key]) return prev
      const startBox = Math.max(1, Math.min(5, opts?.initialBox ?? 1))
      const it: SrsItem = {
        key,
        text,
        type,
        box: startBox,
        due: nextDue(startBox),
        addedAt: Date.now(),
        history: [],
      }
      // persist via storage (fire and forget)
      ;(async () => {
        try { const eng = await getStorage(); await eng.srsUpsert(it, currentProfileId()) } catch {}
      })()
      logEvent({ type: "srs.add", key, t: Date.now() })
      return { ...prev, [key]: it }
    })
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((prev) => {
      const cp = { ...prev }
      delete cp[key]
      // persist
      ;(async () => { try { const eng = await getStorage(); await eng.srsRemove(key, currentProfileId()) } catch {} })()
      return cp
    })
  }, [])

  const gradeItem = useCallback((key: string, grade: SrsGrade) => {
    setItems((prev) => {
      const it = prev[key]
      if (!it) return prev
      let newBox = it.box
      if (grade === "again") newBox = Math.max(1, it.box - 1)
      if (grade === "hard") newBox = Math.max(1, it.box)
      if (grade === "good") newBox = Math.min(5, it.box + 1)
      if (grade === "easy") newBox = Math.min(5, it.box + 2)
      const updated: SrsItem = {
        ...it,
        box: newBox,
        due: nextDue(newBox),
        history: [...it.history, { t: Date.now(), grade }],
      }
      ;(async () => { try { const eng = await getStorage(); await eng.srsUpsert(updated, currentProfileId()) } catch {} })()
      return { ...prev, [key]: updated }
    })
  }, [])

  const dueItems = useMemo(() => {
    const now = Date.now()
    return Object.values(items)
      .filter((it) => it.due <= now)
      .sort((a, b) => a.due - b.due)
  }, [items])

  const allItems = useMemo(() => Object.values(items).sort((a, b) => a.addedAt - b.addedAt), [items])

  return { items, allItems, dueItems, addItem, removeItem, gradeItem }
}
