"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { scopedKey } from "@/utils/profile-storage"
import { logEvent } from "@/utils/activity-log"

export type SrsItemType = "word" | "phrase" | "character"
export type SrsGrade = "again" | "hard" | "good" | "easy"

export interface SrsItem {
  key: string // unique key (e.g., word:玉米)
  text: string // Chinese text for playback
  type: SrsItemType
  box: number // 1..5
  due: number // timestamp ms
  addedAt: number
  history: { t: number; grade: SrsGrade }[]
}

const BASE_SRS = "srs.items"

// Intervals per box in days
const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 16, 30] // 0th unused; box 1..5

function nextDue(box: number) {
  const days = BOX_INTERVALS_DAYS[Math.max(1, Math.min(5, box))]
  return Date.now() + days * 24 * 60 * 60 * 1000
}

export function useSrs() {
  const [items, setItems] = useState<Record<string, SrsItem>>({})
  const storageKey = scopedKey(BASE_SRS)

  // hydrate
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setItems(JSON.parse(raw))
      else setItems({})
    } catch {
      setItems({})
    }
  // re-hydrate whenever the storageKey changes (i.e., profile switched)
  }, [storageKey])

  // persist
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(storageKey, JSON.stringify(items))
    } catch {}
  }, [items, storageKey])

  // rehydrate on profile change event (additional safety)
  useEffect(() => {
    const onProfileChange = () => {
      try {
        const raw = localStorage.getItem(scopedKey(BASE_SRS))
        setItems(raw ? JSON.parse(raw) : {})
      } catch {
        setItems({})
      }
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
      // Activity log for adding to SRS
      logEvent({ type: "srs.add", key, t: Date.now() })
      return { ...prev, [key]: it }
    })
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((prev) => {
      const cp = { ...prev }
      delete cp[key]
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
