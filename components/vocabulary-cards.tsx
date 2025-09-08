"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Volume2, Check, X } from 'lucide-react'
import { useDialect } from "@/hooks/use-dialect"

export interface VocabItem {
  id: number
  chinese: string
  pinyin: string
  english: string
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
}

const vocabularyData: VocabItem[] = [
  { id: 1, chinese: "你好", pinyin: "nǐ hǎo", english: "Hello", category: "Greetings", difficulty: "Beginner" },
  { id: 2, chinese: "谢谢", pinyin: "xiè xiè", english: "Thank you", category: "Greetings", difficulty: "Beginner" },
  { id: 3, chinese: "学生", pinyin: "xué shēng", english: "Student", category: "People", difficulty: "Beginner" },
  { id: 4, chinese: "老师", pinyin: "lǎo shī", english: "Teacher", category: "People", difficulty: "Beginner" },
  { id: 5, chinese: "朋友", pinyin: "péng yǒu", english: "Friend", category: "People", difficulty: "Intermediate" },
]

export function VocabularyCards() {
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const { playPronunciation, isPlaying, currentlyPlaying, currentDialect } = useDialect()

  const card = vocabularyData[currentCard]

  const handleAnswer = (correct: boolean) => {
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }))
    nextCard()
  }

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % vocabularyData.length)
    setShowAnswer(false)
  }

  const handlePlayPronunciation = async () => {
    await playPronunciation(card.chinese)
  }

  const handlePlayPinyin = async () => {
    await playPronunciation(card.pinyin, "zh-CN")
  }

  const isThisPlaying = currentlyPlaying === card.chinese || currentlyPlaying === card.pinyin

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vocabulary Practice</h2>
        <div className="text-sm text-gray-600">
          Score: {score.correct}/{score.total}{" "}
          ({score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%)
        </div>
      </div>

      <Card className="max-w-md mx-auto" aria-live="polite">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-2">
            <Badge variant="outline">{card.category}</Badge>
            <Badge variant={card.difficulty === "Beginner" ? "default" : "secondary"}>{card.difficulty}</Badge>
          </div>
          <CardTitle className="text-4xl font-bold text-red-600 mb-2">{card.chinese}</CardTitle>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg text-gray-600">{card.pinyin}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPronunciation}
              disabled={isPlaying}
              className="p-1"
              aria-label="Play character pronunciation"
              title="Play character pronunciation"
            >
              <Volume2 className={`h-4 w-4 ${currentlyPlaying === card.chinese ? "text-blue-600" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPinyin}
              disabled={isPlaying}
              className="p-1"
              aria-label="Play pinyin pronunciation"
              title="Play pinyin pronunciation"
            >
              <Volume2 className={`h-3 w-3 ${currentlyPlaying === card.pinyin ? "text-green-600" : ""}`} />
            </Button>
          </div>
          {isThisPlaying && currentDialect && (
            <div className="mt-2 text-xs text-gray-500">Playing dialect: {currentDialect}</div>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {showAnswer ? (
            <div className="space-y-4">
              <div className="text-xl font-semibold text-green-600">{card.english}</div>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => handleAnswer(false)} variant="outline" className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Incorrect
                </Button>
                <Button onClick={() => handleAnswer(true)} className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Correct
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowAnswer(true)} className="w-full" aria-pressed={showAnswer}>
              Show Answer
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => setCurrentCard((prev) => (prev - 1 + vocabularyData.length) % vocabularyData.length)}
        >
          Previous
        </Button>
        <Button variant="outline" onClick={nextCard} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Next Card
        </Button>
      </div>
    </div>
  )
}
