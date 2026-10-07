"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSrs } from "@/hooks/use-srs"
import { useDialect } from "@/hooks/use-dialect"
import { useI18n } from "./i18n-provider"
import { Volume2, Clock, Inbox } from 'lucide-react'

export function ReviewSRS() {
  const { dueItems, gradeItem, allItems } = useSrs()
  const { t } = useI18n()
  const { playPronunciation, isPlaying, currentlyPlaying } = useDialect()
  const [reviewedKeys, setReviewedKeys] = useState<string[]>([])
  const reviewedKeysRef = useRef<string[]>([])
  const [isGrading, setIsGrading] = useState(false)
  const gradingRequest = useRef<object | null>(null)
  const mounted = useRef(false)
  const profileVersion = useRef(0)
  const renderedProfileVersion = profileVersion.current

  useEffect(() => {
    mounted.current = true
    const onProfileChange = () => {
      profileVersion.current++
      gradingRequest.current = null
      reviewedKeysRef.current = []
      setReviewedKeys([])
      setIsGrading(false)
    }
    window.addEventListener("profile:changed", onProfileChange)
    return () => {
      mounted.current = false
      gradingRequest.current = null
      window.removeEventListener("profile:changed", onProfileChange)
    }
  }, [])

  useEffect(() => {
    // Keep committed cards hidden while the asynchronous storage reload catches
    // up, then forget them so they can appear again at their next due date.
    const stillDue = reviewedKeys.filter(key => dueItems.some(item => item.key === key))
    if (stillDue.length !== reviewedKeys.length) {
      reviewedKeysRef.current = stillDue
      setReviewedKeys(stillDue)
    }
  }, [dueItems, reviewedKeys])

  const queue = dueItems.filter(item => !reviewedKeys.includes(item.key))
  const current = queue[0]

  const onPlay = async () => {
    if (!current) return
    await playPronunciation(current.text)
  }

  const onGrade = async (grade: "again" | "hard" | "good" | "easy") => {
    if (!current || !mounted.current || gradingRequest.current || reviewedKeysRef.current.includes(current.key) || renderedProfileVersion !== profileVersion.current) return
    // A ref closes the gap before React renders the disabled buttons.
    const request = {}
    gradingRequest.current = request
    setIsGrading(true)
    try {
      const saved = await gradeItem(current.key, grade)
      if (!mounted.current || gradingRequest.current !== request || !saved) return
      reviewedKeysRef.current = [...reviewedKeysRef.current, current.key]
      setReviewedKeys(reviewedKeysRef.current)
    } finally {
      // An old profile's completion must not unlock a newer review request.
      if (mounted.current && gradingRequest.current === request) {
        gradingRequest.current = null
        setIsGrading(false)
      }
    }
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
                <Button onClick={() => onGrade("again")} disabled={isGrading} variant="outline">Again</Button>
                <Button onClick={() => onGrade("hard")} disabled={isGrading} variant="outline">Hard</Button>
                <Button onClick={() => onGrade("good")} disabled={isGrading} className="bg-emerald-600 hover:bg-emerald-700">Good</Button>
                <Button onClick={() => onGrade("easy")} disabled={isGrading} variant="outline">Easy</Button>
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
