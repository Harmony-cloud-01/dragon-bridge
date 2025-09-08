"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

const TONE_COLORS = [
  "bg-green-500", // 1: flat
  "bg-blue-500", // 2: rising
  "bg-purple-500", // 3: dipping
  "bg-red-500", // 4: falling
  "bg-gray-500", // 5: neutral
]

function mockToneForChar(ch: string): number {
  const map: Record<string, number> = {
    "妈": 1, "麻": 2, "马": 3, "骂": 4, "吗": 5,
    "你": 3, "好": 3, "呢": 5, "我": 3, "很": 3, "高": 1,
  }
  return map[ch] || 5
}

export function ToneVisualizer({
  text,
  activeIndex,
  showPinyin = true,
}: {
  text: string
  activeIndex?: number
  showPinyin?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const chars = text.split("")
    const W = (canvas.width = canvas.clientWidth)
    const H = (canvas.height = 100)
    ctx.clearRect(0, 0, W, H)
    const segW = Math.max(1, W / Math.max(1, chars.length))

    chars.forEach((ch, i) => {
      const tone = mockToneForChar(ch)
      const x0 = i * segW
      const x1 = x0 + segW
      const xMid = (x0 + x1) / 2
      const baseY = H * 0.6
      const amp = H * 0.3
      const isAct = activeIndex === i

      ctx.beginPath()
      ctx.strokeStyle = isAct ? "#111" : "#bbb"
      ctx.lineWidth = isAct ? 3 : 1
      if (tone === 1) {
        ctx.moveTo(x0, baseY - amp * 0.5)
        ctx.lineTo(x1, baseY - amp * 0.5)
      } else if (tone === 2) {
        ctx.moveTo(x0, baseY + amp * 0.4)
        ctx.lineTo(x1, baseY - amp * 0.6)
      } else if (tone === 3) {
        ctx.moveTo(x0, baseY)
        ctx.quadraticCurveTo(xMid, baseY + amp * 0.5, x1, baseY)
      } else if (tone === 4) {
        ctx.moveTo(x0, baseY - amp * 0.6)
        ctx.lineTo(x1, baseY + amp * 0.4)
      } else {
        ctx.moveTo(x0, baseY)
        ctx.lineTo(x1, baseY)
      }
      ctx.stroke()

      ctx.fillStyle = isAct ? "#111" : "#666"
      ctx.font = "12px system-ui, -apple-system, sans-serif"
      ctx.fillText(ch, xMid - 6, H - 6)
    })
  }, [text, activeIndex])

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} className="w-full border rounded-lg bg-white" />
      {showPinyin && (
        <div className="flex justify-center gap-2">
          {text.split("").map((ch, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs tone-marker",
                TONE_COLORS[(mockToneForChar(ch) - 1) as 0 | 1 | 2 | 3 | 4],
                activeIndex === i && "ring-2 ring-black tone-marker active"
              )}
              aria-label={`Tone marker ${i + 1}`}
            >
              {mockToneForChar(ch)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

