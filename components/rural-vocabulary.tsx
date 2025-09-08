"use client"
import { useBasePath } from "@/components/BasePathProvider";
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, Plus, Shuffle, RefreshCcw } from 'lucide-react'
import { useDialect } from "@/hooks/use-dialect"
import { useI18n } from "./i18n-provider"
import { useSrs } from "@/hooks/use-srs"
import { logEvent } from "@/utils/activity-log"

interface RuralWord {
  id: number
  chinese: string
  pinyin: string
  english: string
  category: string
  icon: string
  difficulty: "Basic" | "Intermediate" | "Advanced"
  context: string
}

// DATA: Extended (20 per category). Truncated comments removed for brevity.
const ruralVocabulary: RuralWord[] = [
  // Agriculture (20)
  { id: 1001, chinese: "种地", pinyin: "zhòng dì", english: "Farm the land", category: "Agriculture", icon: "🌾", difficulty: "Basic", context: "春天要种地了 (Spring is time to farm)" },
  { id: 1002, chinese: "播种", pinyin: "bō zhǒng", english: "Sow seeds", category: "Agriculture", icon: "🌾", difficulty: "Basic", context: "今天在地里播种玉米 (Sow corn in the field today)" },
  // ... (rest of your data remains the same)
  { id: 6020, chinese: "手套", pinyin: "shǒu tào", english: "Gloves", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "干活戴上手套 (Wear gloves for work)" },
]

const categories = [
  { name: "Agriculture", icon: "🌾" },
  { name: "Daily Life", icon: "🏠" },
  { name: "Community", icon: "👥" },
  { name: "Weather", icon: "🌤️" },
  { name: "Livestock", icon: "🐄" },
  { name: "Farm Equipment", icon: "🚜" },
]

type StartDifficulty = "hard" | "normal" | "easy"

export function RuralVocabulary() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [randomMode, setRandomMode] = useState(false)
  const [order, setOrder] = useState<number[]>([])
  const [pos, setPos] = useState(0)
  const [startDiff, setStartDiff] = useState<StartDifficulty>("normal")
  const { withBasePath } = useBasePath()
  const { playPronunciation, isPlaying, currentlyPlaying, currentDialect } = useDialect()
  const { t } = useI18n()
  const { addItem } = useSrs()

  // Hardcoded category images per v0 rules (no string concatenation for placeholders)
  // Updated to use withBasePath for GitHub Pages compatibility
  const categoryImageSrc: Record<string, string> = {
    "Agriculture": withBasePath("/placeholder-altgr.png"),
    "Daily Life": withBasePath("/rural-village-home-yard.png"),
    "Community": withBasePath("/village-gathering-square.png"),
    "Weather": withBasePath("/farmland-sky.png"),
    "Livestock": withBasePath("/farm-animals-chickens-cattle.png"),
    "Farm Equipment": withBasePath("/farm-tools-tractor-implements.png"),
  }

  const filteredWords = useMemo(
    () => (selectedCategory ? ruralVocabulary.filter((w) => w.category === selectedCategory) : ruralVocabulary),
    [selectedCategory]
  )

  // Build index order based on mode/category/length
  useEffect(() => {
    const base = Array.from({ length: filteredWords.length }, (_, i) => i)
    if (randomMode) {
      const shuffled = [...base]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setOrder(shuffled)
    } else {
      setOrder(base)
    }
    setPos(0)
  }, [randomMode, selectedCategory, filteredWords.length])

  const word = filteredWords.length > 0 && order.length > 0 ? filteredWords[order[pos]] : null

  const next = () => {
    if (order.length === 0) return
    setPos((p) => Math.min(order.length - 1, p + 1))
  }
  const prev = () => {
    if (order.length === 0) return
    setPos((p) => Math.max(0, p - 1))
  }
  const reshuffle = () => {
    if (!randomMode) return
    const base = Array.from({ length: filteredWords.length }, (_, i) => i)
    const shuffled = [...base]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setOrder(shuffled)
    setPos(0)
  }

  const handlePlayWord = async () => {
    if (!word) return
    await playPronunciation(word.chinese)
    ;(logEvent as any) && logEvent({ type: "audio.play", text: word.chinese, t: Date.now() })
  }
  const handlePlayContext = async () => {
    if (!word) return
    const chineseContext = word.context.split("(")[0].trim()
    await playPronunciation(chineseContext)
  }

  // Map chosen start difficulty to initial SRS box
  const initialBox = startDiff === "easy" ? 3 : startDiff === "normal" ? 2 : 1

  const addToReview = () => {
    if (!word) return
    addItem(word.chinese, "word", { initialBox })
  }

  return (
    <div className="space-y-6" aria-live="polite">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t("ruralVocabularyTitle")}</h2>
        <p className="text-gray-600">Rural Practical Vocabulary</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => {
            setSelectedCategory(null)
          }}
          className="h-auto p-3"
          aria-pressed={selectedCategory === null}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">📚</div>
            <div className="text-sm">{t("showAll")}</div>
          </div>
        </Button>
        {categories.map((category) => (
          <Button
            key={category.name}
            variant={selectedCategory === category.name ? "default" : "outline"}
            onClick={() => {
              setSelectedCategory(category.name)
            }}
            className="h-auto p-3"
            aria-pressed={selectedCategory === category.name}
            aria-label={`Filter ${category.name}`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="text-sm">{category.name}</div>
            </div>
          </Button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={randomMode ? "default" : "outline"}
          size="sm"
          onClick={() => setRandomMode((v) => !v)}
          aria-pressed={randomMode}
          className={randomMode ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          <Shuffle className="h-4 w-4 mr-2" />
          {randomMode ? "Random: On" : "Random: Off"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={reshuffle}
          disabled={!randomMode || filteredWords.length < 2}
          aria-disabled={!randomMode || filteredWords.length < 2}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Reshuffle
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-600">Start difficulty for SRS:</span>
          <Button
            size="sm"
            variant={startDiff === "hard" ? "default" : "outline"}
            onClick={() => setStartDiff("hard")}
            aria-pressed={startDiff === "hard"}
          >
            Hard
          </Button>
          <Button
            size="sm"
            variant={startDiff === "normal" ? "default" : "outline"}
            onClick={() => setStartDiff("normal")}
            aria-pressed={startDiff === "normal"}
          >
            Normal
          </Button>
          <Button
            size="sm"
            variant={startDiff === "easy" ? "default" : "outline"}
            onClick={() => setStartDiff("easy")}
            aria-pressed={startDiff === "easy"}
          >
            Easy
          </Button>
        </div>
      </div>

      {/* Current Item Card */}
      <Card className="max-w-2xl mx-auto">
        {word && (
          <>
            {/* Category image banner */}
            <div className="relative w-full">
              <Image
                src={categoryImageSrc[word.category] || "/placeholder.svg?height=180&width=720&query=rural%20china"}
                alt={`Illustration for ${word.category}`}
                width={720}
                height={180}
                className="h-40 w-full object-cover rounded-t-md"
                priority
              />
            </div>

            <CardHeader className="text-center">
              <div className="text-6xl mb-3">{word.icon}</div>
              <CardTitle className="text-4xl font-bold text-red-600 mb-2">{word.chinese}</CardTitle>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xl text-gray-600">{word.pinyin}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlayWord}
                  disabled={isPlaying}
                  aria-label="Play word"
                >
                  <Volume2 className={`h-5 w-5 ${currentlyPlaying === word.chinese ? "text-blue-600" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addToReview}
                  className="ml-2 inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add to Review
                </Button>
              </div>
              {currentlyPlaying === word.chinese && currentDialect && (
                <div className="text-xs text-gray-500">
                  {'Playing dialect: '}{currentDialect}
                </div>
              )}
              <div className="text-lg text-gray-800 mb-2">{word.english}</div>
              <div className="flex items-center justify-center gap-2">
                <Badge className="mb-2">{word.category}</Badge>
                <Badge variant="outline" className="mb-2">{word.difficulty}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">
                  {t("practicalExample")}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlayContext}
                    disabled={isPlaying}
                    aria-label="Play example"
                    className="ml-2 inline-flex items-center gap-2"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </h4>
                <p className="text-lg">{word.context}</p>
              </div>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={prev}
                  disabled={pos === 0}
                >
                  {t("previous")}
                </Button>
                <span className="text-sm text-gray-600">
                  {filteredWords.length > 0 ? `${pos + 1} / ${filteredWords.length}` : "0 / 0"}
                </span>
                <Button
                  variant="outline"
                  onClick={next}
                  disabled={pos >= (order.length - 1)}
                >
                  {t("next")}
                </Button>
              </div>
            </CardContent>
          </>
        )}
        {!word && (
          <CardContent className="p-6 text-center text-gray-600">
            No items found.
          </CardContent>
        )}
      </Card>
    </div>
  )
}
