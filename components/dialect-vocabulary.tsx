"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, MapPin, ArrowRightLeft, Plus } from 'lucide-react'
import { useDialect } from "@/hooks/use-dialect"
import { useI18n } from "./i18n-provider"
import { useSrs } from "@/hooks/use-srs"

interface DialectVariation {
  text: string
  pronunciation: string
}

interface DialectWord {
  id: number
  chinese: string
  pinyin: string
  english: string
  category: string
  icon: string
  dialectVariations: Record<string, DialectVariation>
}

const dialectVocabulary: DialectWord[] = [
  {
    id: 1,
    chinese: "玉米",
    pinyin: "yù mǐ",
    english: "Corn",
    category: "Crops",
    icon: "🌽",
    dialectVariations: {
      "zh-CN": { text: "玉米", pronunciation: "yù mǐ" },
      "zh-CN-northeast": { text: "苞米", pronunciation: "bāo mǐ" },
      "zh-CN-sichuan": { text: "包谷", pronunciation: "bāo gǔ" },
      "zh-CN-henan": { text: "棒子", pronunciation: "bàng zi" },
      "zh-CN-shandong": { text: "玉茭子", pronunciation: "yù jiǎo zi" },
    },
  },
  {
    id: 2,
    chinese: "土豆",
    pinyin: "tǔ dòu",
    english: "Potato",
    category: "Crops",
    icon: "🥔",
    dialectVariations: {
      "zh-CN": { text: "土豆", pronunciation: "tǔ dòu" },
      "zh-CN-northeast": { text: "土豆", pronunciation: "tǔ dòu" },
      "zh-CN-sichuan": { text: "洋芋", pronunciation: "yáng yù" },
      "zh-CN-henan": { text: "红薯", pronunciation: "hóng shǔ" },
      "zh-CN-shandong": { text: "地瓜", pronunciation: "dì guā" },
    },
  },
  {
    id: 3,
    chinese: "下雨",
    pinyin: "xià yǔ",
    english: "Raining",
    category: "Weather",
    icon: "🌧️",
    dialectVariations: {
      "zh-CN": { text: "下雨", pronunciation: "xià yǔ" },
      "zh-CN-northeast": { text: "下雨", pronunciation: "xià yǔ" },
      "zh-CN-sichuan": { text: "落雨", pronunciation: "luò yǔ" },
      "zh-CN-henan": { text: "下雨", pronunciation: "xià yǔ" },
      "zh-CN-shandong": { text: "下雨", pronunciation: "xià yǔ" },
    },
  },
  {
    id: 4,
    chinese: "吃饭",
    pinyin: "chī fàn",
    english: "Eat meal",
    category: "Daily Life",
    icon: "🍚",
    dialectVariations: {
      "zh-CN": { text: "吃饭", pronunciation: "chī fàn" },
      "zh-CN-northeast": { text: "造饭", pronunciation: "zào fàn" },
      "zh-CN-sichuan": { text: "吃饭", pronunciation: "chī fàn" },
      "zh-CN-henan": { text: "喝汤", pronunciation: "hē tāng" },
      "zh-CN-shandong": { text: "用饭", pronunciation: "yòng fàn" },
    },
  },
  {
    id: 5,
    chinese: "很好",
    pinyin: "hěn hǎo",
    english: "Very good",
    category: "Expressions",
    icon: "👍",
    dialectVariations: {
      "zh-CN": { text: "很好", pronunciation: "hěn hǎo" },
      "zh-CN-northeast": { text: "老好了", pronunciation: "lǎo hǎo le" },
      "zh-CN-sichuan": { text: "巴适", pronunciation: "bā shì" },
      "zh-CN-henan": { text: "中", pronunciation: "zhōng" },
      "zh-CN-shandong": { text: "好得很", pronunciation: "hǎo de hěn" },
    },
  },
]

export function DialectVocabulary() {
  const [currentWord, setCurrentWord] = useState(0)
  const [showAllDialects, setShowAllDialects] = useState(false)
  const {
    selectedDialects,
    supportedDialects,
    playPronunciation,
    playBothDialects,
    isPlaying,
    currentlyPlaying,
    currentDialect,
  } = useDialect()
  const { t } = useI18n()
  const { addItem } = useSrs()

  const word = dialectVocabulary[currentWord]

  const getDialectName = (code: string) => supportedDialects.find((d) => d.code === code)?.name || code
  const getDialectRegion = (code: string) => supportedDialects.find((d) => d.code === code)?.region || ""

  const handlePlayDialect = async (dialectCode: string) => {
    const variation = word.dialectVariations[dialectCode]
    if (variation) {
      await playPronunciation(variation.text, dialectCode)
    }
  }

  const playStandardThenDialect = async () => {
    const primary = selectedDialects.find((d) => d !== "zh-CN") || "zh-CN"
    await playBothDialects(word.chinese, primary)
  }

  const addToReview = () => {
    addItem(word.chinese, "word")
  }

  return (
    <div className="space-y-6" aria-live="polite">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t("dialectVocabCompare")}</h2>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">{word.icon}</div>
          <CardTitle className="text-4xl font-bold text-red-600 mb-2">{word.chinese}</CardTitle>
          <div className="text-xl text-gray-600 mb-2">{word.pinyin}</div>
          <div className="text-lg text-gray-800 mb-2">{word.english}</div>
          <Badge className="mb-4">{word.category}</Badge>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={playStandardThenDialect} disabled={isPlaying} className="flex items-center gap-2" aria-label={t("playStdThenDialect")}>
              <ArrowRightLeft className="h-4 w-4" />
              {t("playStdThenDialect")}
            </Button>
            <Button variant="outline" size="sm" onClick={addToReview} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add to Review
            </Button>
          </div>
          {currentlyPlaying === word.chinese && currentDialect && (
            <div className="mt-2 text-xs text-gray-500">
              {t("playingDialect")}: {currentDialect}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{t("dialectCompare")}</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllDialects(!showAllDialects)}
                aria-pressed={showAllDialects}
              >
                {showAllDialects ? t("showSelected") : t("showAll")}
              </Button>
            </div>

            {(showAllDialects ? Object.keys(word.dialectVariations) : selectedDialects.filter((d) => word.dialectVariations[d])).map(
              (dialectCode) => {
                const variation = word.dialectVariations[dialectCode]
                const dialectName = getDialectName(dialectCode)
                const dialectRegion = getDialectRegion(dialectCode)
                const isPlayingThis = currentlyPlaying === variation.text && currentDialect === dialectCode

                return (
                  <Card key={dialectCode} className={`${isPlayingThis ? "ring-2 ring-blue-500 bg-blue-50" : "bg-gray-50"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {dialectRegion}
                            </Badge>
                            <span className="font-medium">{dialectName}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-red-600">{variation.text}</span>
                            <span className="text-gray-600">{variation.pronunciation}</span>
                          </div>
                          {isPlayingThis && (
                            <div className="mt-1 text-xs text-gray-500">
                              {t("playingDialect")}: {dialectCode}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlayDialect(dialectCode)}
                          disabled={isPlaying}
                          aria-label={`Play ${dialectName}`}
                        >
                          <Volume2 className={`h-4 w-4 ${isPlayingThis ? "text-blue-600" : ""}`} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              }
            )}
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={() => setCurrentWord(Math.max(0, currentWord - 1))} disabled={currentWord === 0}>
              {t("previous")}
            </Button>
            <span className="text-sm text-gray-600">
              {currentWord + 1} / {dialectVocabulary.length}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentWord(Math.min(dialectVocabulary.length - 1, currentWord + 1))}
              disabled={currentWord === dialectVocabulary.length - 1}
            >
              {t("next")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
