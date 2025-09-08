"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useSrs } from "@/hooks/use-srs"

export type Lesson = {
  id: string
  title: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  dialectCode: string
  words: { text: string }[]
  tags?: string[]
}

export function LessonCard({ lesson, onPractice }: { lesson: Lesson; onPractice?: (l: Lesson) => void }) {
  const { addItem, items } = useSrs()
  const { toast } = useToast()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const total = lesson.words.length
  const now = Date.now()
  const inSrs = lesson.words.reduce((acc, w) => acc + (items[`word:${w.text}`] ? 1 : 0), 0)
  const dueCount = lesson.words.reduce((acc, w) => {
    const it = items[`word:${w.text}`]
    return acc + (it && it.due <= now ? 1 : 0)
  }, 0)
  const addAll = () => {
    lesson.words.forEach((w) => addItem(w.text, "word"))
    toast({ title: "Added to SRS", description: `Queued ${lesson.words.length} items.` })
  }
  const addSelected = () => {
    const count = Array.from(selected).reduce((acc, i) => {
      const w = lesson.words[i]
      if (w) { addItem(w.text, "word"); return acc + 1 }
      return acc
    }, 0)
    toast({ title: "Added selected", description: `Queued ${count} items.` })
  }
  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }
  const practiceAll = () => {
    try {
      localStorage.setItem("lessons.current", JSON.stringify(lesson))
      localStorage.setItem("tone.practice.queue", JSON.stringify(lesson.words.map((w) => w.text)))
      localStorage.setItem("tone.practice.text", lesson.words[0]?.text || "你好")
    } catch {}
    onPractice?.(lesson)
  }
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{lesson.title}</span>
          <span className="text-xs text-stone-500">{lesson.difficulty} • in SRS {inSrs}/{total} • due {dueCount}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {lesson.tags && lesson.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 text-xs">
            {lesson.tags.map((t, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">#{t}</span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {lesson.words.slice(0, 24).map((w, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className={cn(
                "px-2 py-1 rounded text-sm border",
                selected.has(i) ? "bg-emerald-100 border-emerald-300" : "bg-stone-100 border-stone-200"
              )}
              aria-pressed={selected.has(i)}
            >
              {w.text}
            </button>
          ))}
          {lesson.words.length > 12 && <span className="text-xs text-stone-500">+{lesson.words.length - 12} more</span>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={addAll}>Add all to SRS</Button>
          <Button size="sm" variant="outline" onClick={addSelected} disabled={selected.size === 0}>Add selected</Button>
          {onPractice && (
            <>
              <Button size="sm" variant="outline" onClick={() => onPractice(lesson)}>Practice</Button>
              <Button size="sm" variant="ghost" onClick={practiceAll}>Practice all</Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={selected.size === 0}
                onClick={() => {
                  const list = Array.from(selected).map((i) => lesson.words[i]?.text).filter(Boolean) as string[]
                  if (list.length) {
                    try {
                      localStorage.setItem("lessons.current", JSON.stringify(lesson))
                      localStorage.setItem("tone.practice.queue", JSON.stringify(list))
                      localStorage.setItem("tone.practice.text", list[0])
                    } catch {}
                    onPractice(lesson)
                  }
                }}
              >
                Practice selected
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
