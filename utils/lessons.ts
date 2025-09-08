"use client"

import { withBasePath } from "@/lib/base-path"

export type Lesson = {
  id: string
  text: string
  pinyin?: string
  dialectCode: string
  audio?: string
}

let cache: Lesson[] | null = null
let lastLoadError: any = null

export async function loadLessons(): Promise<Lesson[]> {
  if (cache) return cache
  const url = withBasePath("/lessons.json")
  try {
    const res = await fetch(url, { cache: "force-cache" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as Lesson[]
    cache = Array.isArray(data) ? data : []
    return cache
  } catch (err) {
    lastLoadError = err
    return []
  }
}

export function getLastLessonsLoadError() {
  return lastLoadError
}

export async function findAudioFor(text: string, dialectCode: string): Promise<string | null> {
  const lessons = await loadLessons()
  const normalized = text.trim()
  const matchExact = lessons.find(
    (l) => l.dialectCode === dialectCode && l.text === normalized && l.audio
  )
  if (matchExact?.audio) return withBasePath(`/${matchExact.audio.replace(/^\//, "")}`)

  // fallback: try Standard Mandarin asset
  const matchStd = lessons.find(
    (l) => l.dialectCode === "zh-CN" && l.text === normalized && l.audio
  )
  if (matchStd?.audio) return withBasePath(`/${matchStd.audio.replace(/^\//, "")}`)
  return null
}

export async function preloadLessons() {
  try { await loadLessons() } catch {}
}

