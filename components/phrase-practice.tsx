"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, RotateCcw, Play } from 'lucide-react'
import { useDialect } from "@/hooks/use-dialect"
import { MiniDictionary } from "./mini-dictionary"

interface PhraseItem {
  id: number
  chinese: string
  pinyin: string
  english: string
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
}

const phrases: PhraseItem[] = [
  { id: 1, chinese: "你好吗？", pinyin: "nǐ hǎo ma?", english: "How are you?", category: "Greetings", difficulty: "Beginner" },
  { id: 2, chinese: "我很好，谢谢。", pinyin: "wǒ hěn hǎo, xiè xiè.", english: "I'm fine, thank you.", category: "Greetings", difficulty: "Beginner" },
  {
    id: 3,
    chinese: "请问，洗手间在哪里？",
    pinyin: "qǐng wèn, xǐ shǒu jiān zài nǎ lǐ?",
    english: "Excuse me, where is the bathroom?",
    category: "Questions",
    difficulty: "Intermediate",
  },
  { id: 4, chinese: "我不会说中文。", pinyin: "wǒ bù huì shuō zhōng wén.", english: "I can't speak Chinese.", category: "Communication", difficulty: "Beginner" },
  { id: 5, chinese: "这个多少钱？", pinyin: "zhè gè duō shǎo qián?", english: "How much does this cost?", category: "Shopping", difficulty: "Intermediate" },
]

export function PhrasePractice() {
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)
  const [repeatCount, setRepeatCount] = useState(0)
  const { playPronunciation, isPlaying, currentlyPlaying, currentDialect } = useDialect()
  const containerRef = useRef<HTMLElement | null>(null)

  const phrase = phrases[currentPhrase]

  const handlePlayPhrase = async () => {
    await playPronunciation(phrase.chinese)
    setRepeatCount((prev) => prev + 1)
  }

  const handlePlaySlowly = async () => {
    await playPronunciation(phrase.chinese)
  }

  const nextPhrase = () => {
    setCurrentPhrase((prev) => (prev + 1) % phrases.length)
    setShowTranslation(false)
    setRepeatCount(0)
  }

  const previousPhrase = () => {
    setCurrentPhrase((prev) => (prev - 1 + phrases.length) % phrases.length)
    setShowTranslation(false)
    setRepeatCount(0)
  }

  const isThisPlaying = currentlyPlaying === phrase.chinese

  return (
    <div className="space-y-6">
      <MiniDictionary containerRef={containerRef} />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Phrase Practice</h2>
        <div className="text-sm text-gray-600">Repeated: {repeatCount} times</div>
      </div>

      <Card className="max-w-2xl mx-auto" aria-live="polite" ref={containerRef as any}>
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline">{phrase.category}</Badge>
            <Badge variant={phrase.difficulty === "Beginner" ? "default" : "secondary"}>{phrase.difficulty}</Badge>
          </div>
          <CardTitle className="text-3xl font-bold text-red-600 mb-4">{phrase.chinese}</CardTitle>
          <div className="text-lg text-gray-600 mb-2">{phrase.pinyin}</div>
          {isThisPlaying && currentDialect && (
            <div className="mt-1 text-xs text-gray-500">Playing dialect: {currentDialect}</div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={handlePlayPhrase} disabled={isPlaying} className="flex items-center gap-2" aria-label="Play phrase">
              {isThisPlaying ? <Volume2 className="h-4 w-4 text-blue-600" /> : <Play className="h-4 w-4" />}
              Play Normal
            </Button>
            <Button onClick={handlePlaySlowly} disabled={isPlaying} variant="outline" className="flex items-center gap-2" aria-label="Play slowly">
              <Volume2 className="h-4 w-4" />
              Play Slowly
            </Button>
          </div>

          {showTranslation ? (
            <div className="text-center space-y-4">
              <div className="text-xl font-semibold text-green-600 p-4 bg-green-50 rounded-lg">{phrase.english}</div>
              <Button onClick={() => setShowTranslation(false)} variant="outline" aria-pressed={showTranslation}>
                Hide Translation
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Button onClick={() => setShowTranslation(true)} className="w-full" aria-pressed={showTranslation}>
                Show Translation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-2">
        <Button variant="outline" onClick={previousPhrase}>
          Previous
        </Button>
        <Button variant="outline" onClick={nextPhrase}>
          Next Phrase
        </Button>
      </div>
    </div>
  )
}
