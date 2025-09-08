"use client"

import { withBasePath } from "@/lib/base-path"
import type { Lesson } from "@/components/lesson-card"

let cache: Lesson[] | null = null

export async function loadLessonLibrary(): Promise<Lesson[]> {
  if (cache) return cache
  // Local override in localStorage (admin import)
  try {
    const raw = localStorage.getItem("lessons.library.override")
    if (raw) {
      const parsed = JSON.parse(raw) as Lesson[]
      if (Array.isArray(parsed) && parsed.length) {
        cache = parsed
        return cache
      }
    }
  } catch {}
  const url = withBasePath("/lessons.library.json")
  try {
    const res = await fetch(url, { cache: "force-cache" })
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as Lesson[]
    cache = Array.isArray(data) ? data : []
  } catch {
    cache = []
  }
  return cache
}
