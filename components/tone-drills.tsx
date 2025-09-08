"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDialect } from "@/hooks/use-dialect"
import { useI18n } from "./i18n-provider"
import { Mic, Volume2, Waves, Sparkles } from 'lucide-react'
import { isOffline } from "@/utils/offline"
import { isLowRam } from "@/utils/device"
import { useToast } from "@/hooks/use-toast"
import { ToneVisualizer, SimpleToneStrip } from "@/components/tone-visualizer"
import { getConsent, setConsent } from "@/stores/consent"
import { Switch } from "@/components/ui/switch"

type Tone = 1 | 2 | 3 | 4
const TONE_NAMES: Record<Tone, string> = { 1: "High-flat", 2: "Rising", 3: "Fall-rise", 4: "Falling" }

const DEFAULT_SYLLABLES = ["ma", "ba", "da", "la"]

export function ToneDrills() {
  const { t } = useI18n()
  const { playPronunciation, isPlaying } = useDialect()
  const { toast } = useToast()
  const [syllable, setSyllable] = useState("ma")
  const [targetTone, setTargetTone] = useState<Tone>(1)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [consent, setConsentState] = useState<boolean>(false)

  // Mic visualization (energy bar)
  const [micActive, setMicActive] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null)

  useEffect(() => {
    // hydrate consent on mount
    setConsentState(getConsent())
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {})
    }
  }, [])

  const playRandom = async () => {
    const tone = (Math.floor(Math.random() * 4) + 1) as Tone
    setTargetTone(tone)
    const marked = markTone(syllable, tone)
    if (isOffline()) {
      // No pre-recorded audio mapping yet; warn user gracefully
      toast({
        title: t("offlineTitle") ?? "You are offline",
        description: t("offlineDetail") ?? "Some audio may not be available.",
      })
    }
    await playPronunciation(marked)
  }

  const answer = (tone: Tone) => {
    setScore((s) => ({ correct: s.correct + (tone === targetTone ? 1 : 0), total: s.total + 1 }))
  }

  const startMic = async () => {
    if (micActive) return
    try {
      if (!consent) {
        // require explicit consent toggle before mic
        toast({ title: "Permission required", description: "Enable mic analysis in settings below." })
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      src.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
      srcRef.current = src
      setMicActive(true)
      draw()
    } catch (e) {
      console.warn("Mic permission denied", e)
    }
  }

  const stopMic = () => {
    setMicActive(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    try {
      srcRef.current?.mediaStream.getTracks().forEach((t) => t.stop())
    } catch {}
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {})
    audioCtxRef.current = null
    analyserRef.current = null
    srcRef.current = null
  }

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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{t("toneGuideTitle")}</h2>
        <p className="text-gray-600">Tonal drills for perception and production</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" /> Tone Identification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-3 text-sm">
            <span>Enable mic analysis (consent)</span>
            <Switch
              checked={consent}
              onCheckedChange={(v) => {
                setConsentState(v)
                setConsent(v)
              }}
              aria-label="Enable mic analysis"
            />
          </div>
          {isLowRam ? (
            <SimpleToneStrip />
          ) : null}
          <div className="flex items-center gap-3 justify-center">
            <span className="text-sm text-gray-600">Syllable</span>
            <div className="flex gap-2">
              {DEFAULT_SYLLABLES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={syllable === s ? "default" : "outline"}
                  onClick={() => setSyllable(s)}
                  aria-pressed={syllable === s}
                >
                  {s}
                </Button>
              ))}
            </div>
            <Button onClick={playRandom} disabled={isPlaying} className="ml-2">
              Play Random Tone
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((tn) => (
              <Button key={tn} variant="outline" onClick={() => answer(tn as Tone)}>
                {tn}. {TONE_NAMES[tn as Tone]}
              </Button>
            ))}
          </div>

          <div className="text-center text-sm text-gray-600">
            Score: <span className="font-semibold">{score.correct}/{score.total}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" /> Mimic Mode (beta)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Listen, then press Start and say the syllable with the target tone. The waveform shows your voice energy.
          </p>
          <div className="flex justify-center gap-2">
            {!micActive ? (
              <Button onClick={startMic} className="flex items-center gap-2">
                <Waves className="h-4 w-4" /> Start Mic
              </Button>
            ) : (
              <Button onClick={stopMic} variant="outline" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Stop Mic
              </Button>
            )}
          </div>
          <div className="mx-auto max-w-2xl">
            {isLowRam ? (
              <SimpleToneStrip />
            ) : (
              <canvas
                ref={canvasRef}
                width={800}
                height={160}
                className="w-full rounded border bg-slate-50"
                aria-label="Voice waveform"
              />
            )}
          </div>
          <div className="text-xs text-gray-500 text-center">
            Note: Full tone recognition requires signal processing/ML. This visualization helps you self-evaluate.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function markTone(base: string, tone: Tone) {
  // naive mappings for demo
  const map: Record<string, [string, string, string, string]> = {
    ma: ["mā", "má", "mǎ", "mà"],
    ba: ["bā", "bá", "bǎ", "bà"],
    da: ["dā", "dá", "dǎ", "dà"],
    la: ["lā", "lá", "lǎ", "là"],
  }
  const choices = map[base] || map["ma"]
  return choices[tone - 1]
}
