"use client"

import { LessonCard, type Lesson } from "@/components/lesson-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/components/i18n-provider"
import { useEffect, useState } from "react"
import { loadLessonLibrary } from "@/utils/lessons-lib"
import { LessonsImporter } from "@/components/lessons-importer"
import { useSrs } from "@/hooks/use-srs"

const FALLBACK: Lesson[] = [
  {
    id: "market-beginner",
    title: "Market Conversations (Beginner)",
    difficulty: "Beginner",
    dialectCode: "zh-CN",
    words: [
      { text: "你好" }, { text: "谢谢" }, { text: "多少钱" }, { text: "太贵了" }, { text: "可以便宜点吗" }, { text: "再见" },
      { text: "苹果" }, { text: "土豆" }, { text: "大米" }, { text: "白菜" }, { text: "一斤" }, { text: "半斤" },
      { text: "今天" }, { text: "明天" }, { text: "便宜" }, { text: "划算" }, { text: "新鲜" }, { text: "好吃" },
    ],
  },
  {
    id: "farm-tools",
    title: "Farm Tools & Actions",
    difficulty: "Beginner",
    dialectCode: "zh-CN",
    words: [
      { text: "锄头" }, { text: "镰刀" }, { text: "铁锹" }, { text: "喷雾器" }, { text: "水桶" }, { text: "车" },
      { text: "播种" }, { text: "浇水" }, { text: "施肥" }, { text: "除草" }, { text: "收割" }, { text: "晾晒" },
    ],
  },
  {
    id: "greetings-phrases",
    title: "Greetings & Daily Phrases",
    difficulty: "Beginner",
    dialectCode: "zh-CN",
    words: [
      { text: "你吃了吗" }, { text: "慢走" }, { text: "小心点" }, { text: "没关系" }, { text: "请再说一遍" },
      { text: "我听不懂" }, { text: "你好久不见" }, { text: "你辛苦了" },
    ],
  },
]

export function LessonsSection({ onPracticeTone }: { onPracticeTone?: (example: string) => void }) {
  const { t } = useI18n()
  const [lessons, setLessons] = useState<Lesson[]>(FALLBACK)
  const [tag, setTag] = useState<string | null>(null)
  const { items } = useSrs()
  const totalSrs = Object.keys(items).length
  const now = Date.now()
  const dueSrs = Object.values(items).filter((it) => it.due <= now).length

  useEffect(() => {
    loadLessonLibrary().then((lib) => {
      if (lib.length) setLessons(lib)
    })
  }, [])

  // Preselect tag if set by village navigation
  useEffect(() => {
    try {
      const preset = localStorage.getItem("lessons.filter")
      if (preset) setTag(preset)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      if (tag) localStorage.setItem("lessons.filter", tag)
      else localStorage.removeItem("lessons.filter")
    } catch {}
  }, [tag])

  const allTags = Array.from(new Set(lessons.flatMap((l) => l.tags || [])))
  const filtered = tag ? lessons.filter((l) => (l.tags || []).includes(tag)) : lessons

  // If filter yields nothing but lessons exist, auto-clear filter once
  useEffect(() => {
    if (tag && lessons.length > 0 && filtered.length === 0) {
      setTag(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons, tag])
  return (
    <div className="space-y-6">
      <LessonsImporter onImported={() => loadLessonLibrary().then((lib) => lib.length && setLessons(lib))} />

      {allTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 items-center text-sm">
            <div className="flex gap-2">
              <Button size="sm" variant={tag === null ? "default" : "outline"} onClick={() => setTag(null)}>
                All
              </Button>
              {allTags.map((tname) => (
                <Button key={tname} size="sm" variant={tag === tname ? "default" : "outline"} onClick={() => setTag(tname)}>
                  #{tname}
                </Button>
              ))}
            </div>
            <div className="ml-auto">
              <Button size="sm" variant="ghost" onClick={() => setTag(null)}>Reset filters</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mb-2">
            <div>Loaded: <span className="font-mono">{lessons.length}</span>{tag ? <> • Filter: <span className="font-mono">#{tag}</span></> : null}</div>
            <div className="ml-auto">SRS total: <span className="font-mono">{totalSrs}</span> • due today: <span className="font-mono">{dueSrs}</span></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onPractice={(l) => {
                  try { localStorage.setItem("lessons.current", JSON.stringify(l)) } catch {}
                  const ex = l.words[0]?.text || "你好"
                  try { localStorage.setItem("tone.practice.text", ex) } catch {}
                  onPracticeTone?.(ex)
                }}
              />
            ))}
            {lessons.length > 0 && filtered.length === 0 && (
              <div className="text-sm text-stone-600">No lessons for this filter.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-sky-50">
        <CardHeader>
          <CardTitle>Pronunciation Practice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-stone-700">
            Jump into tone drills to practice pitch and clarity. You can enable “Prefer pre‑recorded audio” for better offline analysis.
          </p>
          <Button onClick={() => onPracticeTone?.("你好")}>Go to Tone Drills</Button>
        </CardContent>
      </Card>
    </div>
  )
}
