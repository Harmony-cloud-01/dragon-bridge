"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { readEvents } from "@/utils/activity-log"
import { useSrs } from "@/hooks/use-srs"

type Progress = {
  wordsLearned: number
  accuracy: number // 0..100
  streak: number
  level: "Beginner" | "Intermediate" | "Advanced"
}

function startOfDay(ts: number) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function calcStreak(activityDays: number[]): number {
  if (activityDays.length === 0) return 0
  // Unique sorted ascending day timestamps
  const unique = Array.from(new Set(activityDays.map((t) => startOfDay(t)))).sort((a, b) => a - b)
  // Count consecutive days ending today
  const today = startOfDay(Date.now())
  let streak = 0
  let day = today
  let i = unique.length - 1
  while (i >= 0) {
    if (unique[i] === day) {
      streak++
      day -= 24 * 60 * 60 * 1000
      i--
    } else if (unique[i] < day) {
      // Missed a day
      break
    } else {
      // Skip any duplicates (shouldn't happen after Set) or future values
      i--
    }
  }
  return streak
}

function levelFromLearned(n: number): "Beginner" | "Intermediate" | "Advanced" {
  if (n >= 300) return "Advanced"
  if (n >= 100) return "Intermediate"
  return "Beginner"
}

export function useProgress() {
  const { allItems } = useSrs()
  const [progress, setProgress] = useState<Progress>({
    wordsLearned: 0,
    accuracy: 0,
    streak: 0,
    level: "Beginner",
  })

  const compute = useCallback(() => {
    const events = readEvents()
    const gradeEvents = events.filter((e) => e.type === "srs.grade") as any[]
    const playEvents = events.filter((e) => e.type === "audio.play") as any[]
    // Words learned: combine SRS items and unique text you've practiced
    const srsCount = allItems.length
    const uniquePlayed = new Set(playEvents.map((e) => e.text)).size
    const wordsLearned = Math.max(srsCount, uniquePlayed)

    // Accuracy: correct grades / total grades
    const correct = gradeEvents.filter((g) => g.grade === "good" || g.grade === "easy").length
    const total = gradeEvents.length
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

    // Streak: any activity (audio.play or srs.grade/srs.add) on a day counts
    const activityDays = events.map((e) => (e as any).t).filter(Boolean) as number[]
    const streak = calcStreak(activityDays)

    const level = levelFromLearned(wordsLearned)

    setProgress({ wordsLearned, accuracy, streak, level })
  }, [allItems])

  useEffect(() => {
    compute()
    // Refresh when SRS changes
  }, [compute, allItems.length])

  useEffect(() => {
    const onActivity = () => compute()
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return
      if (e.key.includes("activity.logs") || e.key.includes("srs.items")) compute()
    }
    if (typeof window !== "undefined") {
      window.addEventListener("activity:updated", onActivity as any)
      window.addEventListener("storage", onStorage)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("activity:updated", onActivity as any)
        window.removeEventListener("storage", onStorage)
      }
    }
  }, [compute])

  // Recompute at midnight for streak rollover
  useEffect(() => {
    const now = new Date()
    const msTillMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()
    const id = window.setTimeout(() => compute(), msTillMidnight + 1000)
    return () => clearTimeout(id)
  }, [compute])

  return progress
}
