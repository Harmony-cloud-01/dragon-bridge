"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDialect } from "@/hooks/use-dialect"
import { useI18n } from "./i18n-provider"
import { Store, Check, X, Volume2 } from 'lucide-react'

type Step = {
  context: string // Chinese prompt
  english: string // English hint
  options: { text: string; correct: boolean }[]
}

const STEPS: Step[] = [
  {
    context: "你来到集市，想问土豆的价格。",
    english: "You arrive at the market and want to ask the price of potatoes.",
    options: [
      { text: "这个多少钱一斤？", correct: true },
      { text: "你吃饭了吗？", correct: false },
      { text: "天气真好！", correct: false },
    ],
  },
  {
    context: "摊主回答价格后，你想便宜一点。",
    english: "After hearing the price, ask for a lower price.",
    options: [
      { text: "能便宜点吗？", correct: true },
      { text: "请问，洗手间在哪里？", correct: false },
      { text: "我不会说中文。", correct: false },
    ],
  },
  {
    context: "你准备买两斤。",
    english: "You want to buy 2 jin (1 kg).",
    options: [
      { text: "我要两斤，谢谢。", correct: true },
      { text: "我不要，谢谢。", correct: false },
      { text: "这是我家种的。", correct: false },
    ],
  },
]

export function MarketTask() {
  const { t } = useI18n()
  const { playPronunciation, isPlaying, currentlyPlaying } = useDialect()
  const [stepIndex, setStepIndex] = useState(0)
  const [corrects, setCorrects] = useState(0)

  const finished = stepIndex >= STEPS.length
  const step = !finished ? STEPS[stepIndex] : null

  const playContext = async () => {
    if (!step) return
    await playPronunciation(step.context)
  }

  const choose = (opt: { text: string; correct: boolean }) => {
    if (opt.correct) setCorrects((c) => c + 1)
    // advance; if this was the last step, move index to STEPS.length to mark finished
    setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : STEPS.length))
  }

  const restart = () => {
    setStepIndex(0)
    setCorrects(0)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Market Quest</h2>
        <p className="text-gray-600">Task-based learning in real-world context</p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" /> {finished ? "Wrap Up" : `Step ${stepIndex + 1}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!finished && step ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-amber-900">{step.context}</div>
                    <div className="text-sm text-amber-800">{step.english}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={playContext} disabled={isPlaying} aria-label="Play context">
                    <Volume2 className={`h-4 w-4 ${currentlyPlaying === step.context ? "text-blue-600" : ""}`} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {step.options.map((opt, i) => (
                  <Button key={i} onClick={() => choose(opt)} variant="outline" className="h-auto p-4 text-left">
                    {opt.text}
                  </Button>
                ))}
              </div>

              <div className="text-center text-sm text-gray-600">
                Score: <span className="font-semibold">{corrects}</span> / {STEPS.length}
              </div>
            </>
          ) : (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-emerald-700">
                <Check className="h-5 w-5" />
                <span className="font-semibold">Great job completing the task!</span>
              </div>
              <div className="text-sm text-gray-600">Try again or explore other tasks.</div>
              <div className="flex gap-2 justify-center">
                <Button onClick={restart} variant="outline" className="flex items-center gap-2">
                  <X className="h-4 w-4" /> Restart
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
