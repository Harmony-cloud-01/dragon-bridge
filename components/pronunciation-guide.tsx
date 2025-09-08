"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, Play } from 'lucide-react'
import { useDialect } from "@/hooks/use-dialect"
import { AudioControls } from "./audio-controls"
import { useToast } from "@/hooks/use-toast"
import { isOffline } from "@/utils/offline"
import { useI18n } from "./i18n-provider"

const tones = [
  { tone: 1, name: "First Tone", description: "High and flat", symbol: "ˉ", example: "mā (mother)", color: "text-red-500" },
  { tone: 2, name: "Second Tone", description: "Rising", symbol: "ˊ", example: "má (hemp)", color: "text-orange-500" },
  { tone: 3, name: "Third Tone", description: "Falling then rising", symbol: "ˇ", example: "mǎ (horse)", color: "text-green-500" },
  { tone: 4, name: "Fourth Tone", description: "Falling", symbol: "ˋ", example: "mà (scold)", color: "text-blue-500" },
  { tone: 0, name: "Neutral Tone", description: "Light and short", symbol: "·", example: "ma (question particle)", color: "text-gray-500" },
]

const pinyinExamples = [
  { pinyin: "nǐ hǎo", chinese: "你好", english: "hello" },
  { pinyin: "xiè xiè", chinese: "谢谢", english: "thank you" },
  { pinyin: "zài jiàn", chinese: "再见", english: "goodbye" },
  { pinyin: "duì bù qǐ", chinese: "对不起", english: "sorry" },
  { pinyin: "bù kè qì", chinese: "不客气", english: "you're welcome" },
]

export function PronunciationGuide() {
  const [selectedTone, setSelectedTone] = useState<number | null>(null)
  const { playPronunciation, isPlaying, currentlyPlaying } = useDialect()
  const { t } = useI18n()
  const { toast } = useToast()

  const handlePlayToneExample = async (example: string) => {
    const chineseText = example.split(" ")[0]
    if (isOffline()) {
      toast({
        title: t("offlineTitle") ?? "You are offline",
        description: t("offlineDetail") ?? "Some audio may not be available.",
      })
    }
    await playPronunciation(chineseText)
  }

  const handlePlayPinyinExample = async (_pinyin: string, chinese: string) => {
    if (isOffline()) {
      toast({
        title: t("offlineTitle") ?? "You are offline",
        description: t("offlineDetail") ?? "Some audio may not be available.",
      })
    }
    await playPronunciation(chinese)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("toneGuideTitle")}</h2>

      <AudioControls />

      <Card>
        <CardHeader>
          <CardTitle>{t("mandarinTones")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {tones.map((tone) => (
              <Card
                key={tone.tone}
                className={`cursor-pointer transition-all ${selectedTone === tone.tone ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedTone(selectedTone === tone.tone ? null : tone.tone)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`text-3xl font-bold mb-2 ${tone.color}`}>{tone.symbol}</div>
                  <div className="font-semibold">{tone.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{tone.description}</div>
                  <div className="text-sm font-mono">{tone.example}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayToneExample(tone.example)
                    }}
                    disabled={isPlaying}
                    className="mt-2"
                    aria-label={`Play example for ${tone.name}`}
                  >
                    <Volume2 className={`h-4 w-4 ${currentlyPlaying === tone.example.split(" ")[0] ? "text-blue-600" : ""}`} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("practiceExamples")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pinyinExamples.map((example, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-red-600">{example.chinese}</span>
                    <span className="text-lg text-gray-600">{example.pinyin}</span>
                    <span className="text-sm text-gray-500">{example.english}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePlayPinyinExample(example.pinyin, example.chinese)}
                  disabled={isPlaying}
                  aria-label={`Play ${example.chinese}`}
                >
                  {currentlyPlaying === example.chinese ? <Volume2 className="h-4 w-4 text-blue-600" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
