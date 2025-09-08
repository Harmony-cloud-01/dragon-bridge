"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
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
  const { addItem } = useSrs()
  const { toast } = useToast()
  const addAll = () => {
    lesson.words.forEach((w) => addItem(w.text, "word"))
    toast({ title: "Added to SRS", description: `Queued ${lesson.words.length} items.` })
  }
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{lesson.title}</span>
          <span className="text-xs text-stone-500">{lesson.difficulty}</span>
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
          {lesson.words.slice(0, 12).map((w, i) => (
            <span key={i} className="px-2 py-1 bg-stone-100 rounded text-sm">
              {w.text}
            </span>
          ))}
          {lesson.words.length > 12 && <span className="text-xs text-stone-500">+{lesson.words.length - 12} more</span>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={addAll}>Add all to SRS</Button>
          {onPractice && (
            <Button size="sm" variant="outline" onClick={() => onPractice(lesson)}>Practice</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
