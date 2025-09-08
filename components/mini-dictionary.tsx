"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, X } from 'lucide-react'
import { useDialect } from "@/hooks/use-dialect"

type MiniDictionaryProps = {
  containerRef: React.RefObject<HTMLElement | null>
}

type DictEntry = {
  hanzi: string
  pinyin: string
  english: string
}

// Minimal inline dictionary for demo; can be replaced with a larger dataset
const DICT: Record<string, DictEntry> = {
  "你": { hanzi: "你", pinyin: "nǐ", english: "you" },
  "好": { hanzi: "好", pinyin: "hǎo", english: "good; well" },
  "吗": { hanzi: "吗", pinyin: "ma", english: "question particle" },
  "吃": { hanzi: "吃", pinyin: "chī", english: "to eat" },
  "饭": { hanzi: "饭", pinyin: "fàn", english: "meal; rice" },
  "了": { hanzi: "了", pinyin: "le", english: "aspect particle" },
  "请": { hanzi: "请", pinyin: "qǐng", english: "please" },
  "问": { hanzi: "问", pinyin: "wèn", english: "to ask" },
  "洗": { hanzi: "洗", pinyin: "xǐ", english: "to wash" },
  "手": { hanzi: "手", pinyin: "shǒu", english: "hand" },
  "间": { hanzi: "间", pinyin: "jiān", english: "room; between" },
  "在": { hanzi: "在", pinyin: "zài", english: "be at; in" },
  "哪": { hanzi: "哪", pinyin: "nǎ", english: "which; where" },
  "里": { hanzi: "里", pinyin: "lǐ", english: "inside; in" },
  "谢": { hanzi: "谢", pinyin: "xiè", english: "thanks" },
}

const HANZI_REGEX = /[\u4e00-\u9fff]/g

export function MiniDictionary({ containerRef }: MiniDictionaryProps) {
  const { playPronunciation } = useDialect()
  const [visible, setVisible] = useState(false)
  const [entries, setEntries] = useState<DictEntry[]>([])
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const onSelectionChange = () => {
    if (!containerRef.current) return
    const sel = document.getSelection()
    if (!sel || sel.isCollapsed) {
      setVisible(false)
      return
    }
    const range = sel.rangeCount ? sel.getRangeAt(0) : null
    if (!range) return

    // Only show if selection intersects container
    const container = containerRef.current
    const common = range.commonAncestorContainer
    const containerContains = container.contains(common.nodeType === 1 ? (common as Element) : common.parentElement!)
    if (!containerContains) {
      setVisible(false)
      return
    }

    const text = sel.toString().trim()
    if (!text || !HANZI_REGEX.test(text)) {
      setVisible(false)
      return
    }

    // Collect per-character dictionary entries
    const chars = Array.from(new Set((text.match(HANZI_REGEX) || []).slice(0, 12)))
    const list = chars.map((c) => DICT[c]).filter(Boolean) as DictEntry[]
    if (list.length === 0) {
      setVisible(false)
      return
    }

    const rect = range.getBoundingClientRect()
    const top = Math.max(8, rect.top + window.scrollY - 12)
    const left = Math.max(8, rect.left + window.scrollX)
    setEntries(list)
    setPos({ top, left })
    setVisible(true)
  }

  useEffect(() => {
    document.addEventListener("selectionchange", onSelectionChange)
    return () => document.removeEventListener("selectionchange", onSelectionChange)
  }, [containerRef])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (!overlayRef.current) return
      if (overlayRef.current.contains(target)) return
      setVisible(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  if (!visible) return null

  return (
    <div
      ref={overlayRef}
      style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 60 }}
      className="max-w-[90vw]"
      role="dialog"
      aria-label="Mini dictionary"
    >
      <Card className="shadow-lg border-emerald-200">
        <CardContent className="p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Mini Dictionary</span>
            <Button variant="ghost" size="sm" onClick={() => setVisible(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {entries.map((e) => (
              <div key={e.hanzi} className="flex items-center justify-between gap-3 rounded border p-2 bg-white">
                <div>
                  <div className="text-xl font-bold text-red-600">{e.hanzi}</div>
                  <div className="text-sm text-gray-700">{e.pinyin}</div>
                  <div className="text-xs text-gray-500">{e.english}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => playPronunciation(e.hanzi)}
                  aria-label={`Play ${e.hanzi}`}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
