"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PenTool, RotateCcw, Eye, Volume2, CheckCircle, XCircle } from 'lucide-react'
import { useDialect } from "@/hooks/use-dialect"
import { StrokeCanvas } from "./stroke-canvas"

interface CharItem {
  id: number
  character: string
  pinyin: string
  meaning: string
  strokes: number
  radicals: string[]
  strokeOrder: string[]
}

const characters: CharItem[] = [
  { id: 1, character: "人", pinyin: "rén", meaning: "person", strokes: 2, radicals: ["人"], strokeOrder: ["丿", "丨"] },
  { id: 2, character: "大", pinyin: "dà", meaning: "big", strokes: 3, radicals: ["大"], strokeOrder: ["一", "丿", "丶"] },
  { id: 3, character: "小", pinyin: "xiǎo", meaning: "small", strokes: 3, radicals: ["小"], strokeOrder: ["丶", "丿", "丶"] },
  { id: 4, character: "水", pinyin: "shuǐ", meaning: "water", strokes: 4, radicals: ["水"], strokeOrder: ["丨", "丶", "丿", "丶"] },
]

export function CharacterPractice() {
  const [currentChar, setCurrentChar] = useState(0)
  const [showStrokes, setShowStrokes] = useState(false)
  const [practiceMode, setPracticeMode] = useState<"learn" | "practice">("learn")
  const { playPronunciation, isPlaying, currentlyPlaying, currentDialect } = useDialect()
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  const char = characters[currentChar]

  const handlePlayCharacter = async () => {
    await playPronunciation(char.character)
  }

  const isThisPlaying = currentlyPlaying === char.character

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Character Practice</h2>
        <div className="flex gap-2">
          <Button
            variant={practiceMode === "learn" ? "default" : "outline"}
            onClick={() => setPracticeMode("learn")}
            aria-pressed={practiceMode === "learn"}
          >
            Learn
          </Button>
          <Button
            variant={practiceMode === "practice" ? "default" : "outline"}
            onClick={() => setPracticeMode("practice")}
            aria-pressed={practiceMode === "practice"}
          >
            Practice
          </Button>
        </div>
      </div>

      <Card className="max-w-md mx-auto" aria-live="polite">
        <CardHeader className="text-center">
          <CardTitle className="text-6xl font-bold text-red-600 mb-4">{char.character}</CardTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl text-gray-600">{char.pinyin}</span>
              <Button variant="ghost" size="sm" onClick={handlePlayCharacter} disabled={isPlaying} aria-label="Play">
                <Volume2 className={`h-4 w-4 ${isThisPlaying ? "text-blue-600" : ""}`} />
              </Button>
            </div>
            <div className="text-lg">{char.meaning}</div>
            <Badge variant="outline">{char.strokes} strokes</Badge>
          </div>
          {isThisPlaying && currentDialect && (
            <div className="mt-2 text-xs text-gray-500">Playing dialect: {currentDialect}</div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {practiceMode === "learn" && (
            <div className="space-y-4">
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowStrokes(!showStrokes)}
                  className="flex items-center gap-2"
                  aria-pressed={showStrokes}
                >
                  <Eye className="h-4 w-4" />
                  {showStrokes ? "Hide" : "Show"} Stroke Order
                </Button>
              </div>

              {showStrokes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Stroke Order:</h4>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {char.strokeOrder.map((stroke, index) => (
                      <div
                        key={index}
                        className="w-12 h-12 border-2 border-gray-300 rounded flex items-center justify-center text-lg font-bold"
                      >
                        {stroke}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Radicals:</h4>
                <div className="flex gap-2 justify-center">
                  {char.radicals.map((radical, index) => (
                    <Badge key={index} variant="secondary">
                      {radical}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {practiceMode === "practice" && (
            <div className="space-y-4">
              <StrokeCanvas
                targetStrokes={char.strokes}
                onEvaluate={({ ok, coverage, strokes }) => {
                  if (ok) setFeedback({ ok: true, msg: `Great! Strokes: ${strokes} (target ${char.strokes}), coverage ${(coverage * 100).toFixed(0)}%` })
                  else setFeedback({ ok: false, msg: `Keep trying. Strokes: ${strokes} (target ${char.strokes}), coverage ${(coverage * 100).toFixed(0)}%` })
                }}
              />
              {feedback && (
                <div className={`flex items-center gap-2 justify-center text-sm ${feedback.ok ? "text-emerald-700" : "text-rose-700"}`}>
                  {feedback.ok ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {feedback.msg}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => setCurrentChar((prev) => (prev - 1 + characters.length) % characters.length)}
        >
          Previous
        </Button>
        <Button variant="outline" onClick={() => setCurrentChar((prev) => (prev + 1) % characters.length)}>
          Next
        </Button>
      </div>
    </div>
  )
}
