"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Check } from 'lucide-react'

type Point = { x: number; y: number }
type Stroke = Point[]

type StrokeCanvasProps = {
  width?: number
  height?: number
  targetStrokes: number
  onEvaluate?: (result: { ok: boolean; coverage: number; strokes: number }) => void
}

export function StrokeCanvas({ width = 480, height = 240, targetStrokes, onEvaluate }: StrokeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [drawing, setDrawing] = useState(false)

  // Draw grid and strokes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // background
    ctx.fillStyle = "#f8fafc"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // grid
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1
    for (let x = 0; x <= canvas.width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y <= canvas.height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    // strokes
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#0ea5a4"
    ctx.lineWidth = 6
    strokes.forEach((s) => {
      ctx.beginPath()
      s.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.stroke()
    })
  }, [strokes, width, height])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    setDrawing(true)
    const p = getPos(e)
    setStrokes((prev) => [...prev, [p]])
  }
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    const p = getPos(e)
    setStrokes((prev) => {
      const cp = [...prev]
      cp[cp.length - 1] = [...cp[cp.length - 1], p]
      return cp
    })
  }
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDrawing(false)
  }

  const clear = () => setStrokes([])

  const evaluate = () => {
    // Simple heuristic: coverage (drawn bbox area / canvas area) and stroke count closeness
    const allPts = strokes.flat()
    if (allPts.length === 0) {
      onEvaluate?.({ ok: false, coverage: 0, strokes: 0 })
      return
    }
    const xs = allPts.map((p) => p.x)
    const ys = allPts.map((p) => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const bboxArea = Math.max(1, (maxX - minX) * (maxY - minY))
    const coverage = Math.min(1, bboxArea / (width * height * 0.6)) // expected within ~60% of area
    const strokeOk = Math.abs(strokes.length - targetStrokes) <= 1
    const ok = coverage > 0.15 && strokeOk
    onEvaluate?.({ ok, coverage, strokes: strokes.length })
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full rounded border bg-white touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Stroke practice canvas"
      />
      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={clear} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Clear
        </Button>
        <Button onClick={evaluate} className="flex items-center gap-2">
          <Check className="h-4 w-4" />
          Check
        </Button>
      </div>
    </div>
  )
}
