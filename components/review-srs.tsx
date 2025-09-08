"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSrs } from "@/hooks/use-srs"
import { useDialect } from "@/hooks/use-dialect"
import { useI18n } from "./i18n-provider"
import { Volume2, Clock, Inbox } from 'lucide-react'
import { logEvent } from "@/utils/activity-log"

export function ReviewSRS() {
  const { dueItems, gradeItem, allItems } = useSrs()
  const { t } = useI18n()
  const { playPronunciation, isPlaying, currentlyPlaying } = useDialect()
  const [idx, setIdx] = useState(0)

  const queue = dueItems
  const current = queue[idx]

  const onPlay = async () => {
    if (!current) return
    logEvent({ type: "audio.play", text: current.text, t: Date.now() })
    await playPronunciation(current.text)
  }

  const onGrade = (grade: "again" | "hard" | "good" | "easy") => {
    if (!current) return
    gradeItem(current.key, grade)
    logEvent({ type: "srs.grade", key: current.key, grade, t: Date.now() })
    const nextIndex = idx + 1
    if (nextIndex < queue.length) setIdx(nextIndex)
    else setIdx(0)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Spaced Repetition</h2>
        <div className="mt-2 flex items-center justify-center gap-3 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" /> {queue.length} due
          </span>
          <span className="inline-flex items-center gap-1">
            <Inbox className="h-4 w-4" /> {allItems.length} total
          </span>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{current ? "Review Now" : "You're all caught up!"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {current ? (
            <>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-red-600">{current.text}</div>
                <Badge variant="outline" className="capitalize">{current.type}</Badge>
                <div className="text-xs text-gray-500">Box {current.box}</div>
                <Button onClick={onPlay} disabled={isPlaying} aria-label="Play review item" variant="secondary" className="mt-2 inline-flex items-center gap-2">
                  <Volume2 className={`h-4 w-4 ${currentlyPlaying === current.text ? "text-blue-600" : ""}`} />
                  Play
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Button onClick={() => onGrade("again")} variant="outline">Again</Button>
                <Button onClick={() => onGrade("hard")} variant="outline">Hard</Button>
                <Button onClick={() => onGrade("good")} className="bg-emerald-600 hover:bg-emerald-700">Good</Button>
                <Button onClick={() => onGrade("easy")} variant="outline">Easy</Button>
              </div>
              <div className="text-center text-xs text-gray-500">
                Tip: Good moves forward, Again moves back. Items reappear when due.
              </div>
            </>
          ) : (
            <div className="text-center text-gray-600">
              Add items to your review from vocabulary and phrases.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
