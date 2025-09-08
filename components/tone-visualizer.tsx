"use client"

import { useEffect, useRef } from "react"
import { isLowRam } from "@/utils/device"

export function SimpleToneStrip() {
  return (
    <div className="h-10 w-full rounded bg-gray-100 overflow-hidden">
      <div className="h-full w-1/3 bg-teal-300" />
    </div>
  )
}

export function ToneVisualizer({ stream }: { stream: MediaStream | null }) {
  if (isLowRam) return <SimpleToneStrip />
  return <Waveform stream={stream} />
}

function Waveform({ stream }: { stream: MediaStream | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

  useEffect(() => {
    let stopped = false
    async function setup() {
      if (!stream) return
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      src.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
      sourceRef.current = src
      draw()
    }
    setup()
    return () => {
      stopped = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      try { sourceRef.current?.mediaStream.getTracks().forEach((t) => t.stop()) } catch {}
      audioCtxRef.current?.close().catch(() => {})
      audioCtxRef.current = null
      analyserRef.current = null
      sourceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream])

  const draw = () => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const bufferLength = analyser.fftSize
    const dataArray = new Uint8Array(bufferLength)
    const render = () => {
      analyser.getByteTimeDomainData(dataArray)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#f1f5f9"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = "#0ea5a4"
      ctx.lineWidth = 2
      ctx.beginPath()
      const slice = canvas.width / bufferLength
      for (let i = 0; i < bufferLength; i++) {
        const x = i * slice
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      rafRef.current = requestAnimationFrame(render)
    }
    render()
  }

  return <canvas ref={canvasRef} className="h-24 w-full rounded border" />
}

