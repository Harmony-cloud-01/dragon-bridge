"use client"

import { useEffect, useState } from "react"
import { ToneVisualizer } from "@/components/tones/ToneVisualizer"
import { Button } from "@/components/ui/button"
import { useDialect } from "@/hooks/use-dialect"
import { Play, Waves, Loader2 } from "lucide-react"

export function TonePlayer({ text, dialectCode = "zh-CN" }: { text: string; dialectCode?: string }) {
  const { playWithToneDisplay, isPlaying, currentlyPlaying } = useDialect()
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [toneCount, setToneCount] = useState<number>(0)

  useEffect(() => {
    if (currentlyPlaying === text) {
      const chars = text.split("")
      let idx = 0
      const id = window.setInterval(() => {
        setActiveIndex(idx)
        idx = (idx + 1) % Math.max(1, chars.length)
      }, 500)
      return () => window.clearInterval(id)
    } else {
      setActiveIndex(-1)
    }
  }, [currentlyPlaying, text])

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent
      if (!ev?.detail) return
      if (ev.detail.text !== text) return
      const arr = Array.isArray(ev.detail.analysis) ? ev.detail.analysis : []
      setToneCount(arr.length)
    }
    window.addEventListener("tone:analysis", handler as any)
    return () => window.removeEventListener("tone:analysis", handler as any)
  }, [text])

  const handlePlay = async () => {
    setIsAnalyzing(true)
    try {
      await playWithToneDisplay(text, dialectCode)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <ToneVisualizer text={text} activeIndex={activeIndex} />
      {toneCount > 0 && (
        <p className="text-center text-xs text-stone-500">Analyzed {toneCount} segments</p>
      )}
      <div className="flex justify-center">
        <Button onClick={handlePlay} disabled={isPlaying || isAnalyzing} size="sm">
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing
            </>
          ) : isPlaying && currentlyPlaying === text ? (
            <>
              <Waves className="mr-2 h-4 w-4" /> Playing...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" /> Play with Tone Visualization
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
