"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, Users, Heart, HandHeart } from 'lucide-react'
import { useDialect } from "@/hooks/use-dialect"
import { useI18n } from "./i18n-provider"
import { MiniDictionary } from "./mini-dictionary"

interface CommunityPhrase {
  chinese: string
  pinyin: string
  english: string
  situation: string
}

interface CommunityCategory {
  category: string
  icon: React.ReactNode
  color: string
  phrases: CommunityPhrase[]
}

const communityPhrases: CommunityCategory[] = [
  {
    category: "互相帮助 (Mutual Help)",
    icon: <HandHeart className="h-6 w-6" />,
    color: "bg-blue-100",
    phrases: [
      { chinese: "需要帮忙吗？", pinyin: "xū yào bāng máng ma?", english: "Do you need help?", situation: "When seeing someone struggling" },
      { chinese: "谢谢你的帮助", pinyin: "xiè xiè nǐ de bāng zhù", english: "Thank you for your help", situation: "After receiving help" },
      { chinese: "大家一起干活", pinyin: "dà jiā yī qǐ gān huó", english: "Let's work together", situation: "During harvest or construction" },
    ],
  },
]

export function DialectPhrases() {
  const { t } = useI18n()
  const { playPronunciation } = useDialect()
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="space-y-6" aria-live="polite">
      <MiniDictionary containerRef={containerRef as React.RefObject<HTMLElement>} />

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t("dialectPhrases")}</h2>
        <p className="text-muted-foreground mb-6">
          {t("dialectPhrasesSubtitle")}
        </p>
      </div>

      {communityPhrases.map((category) => (
        <Card key={category.category} className={category.color}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {category.icon}
              {category.category}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {category.phrases.map((phrase) => (
              <div
                key={phrase.chinese}
                className="flex items-center justify-between p-4 bg-white/50 rounded-lg"
              >
                <div>
                  <div className="font-mono text-lg">{phrase.chinese}</div>
                  <div className="text-sm text-muted-foreground">{phrase.pinyin}</div>
                  <Badge variant="outline" className="mt-1">
                    {phrase.english}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => playPronunciation(phrase.chinese)}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
