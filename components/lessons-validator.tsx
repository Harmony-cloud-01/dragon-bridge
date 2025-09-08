"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadLessons } from "@/utils/lessons"

type Result = { ok: number; fail: number; samples: { audio: string; ok: boolean }[] }

async function checkUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch { return false }
}

export function LessonsValidator() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const run = async () => {
    setRunning(true)
    setResult(null)
    try {
      const lessons = await loadLessons()
      let ok = 0, fail = 0
      const samples: { audio: string; ok: boolean }[] = []
      const max = Math.min(50, lessons.length)
      for (let i = 0; i < max; i++) {
        const l = lessons[i]
        if (!l.audio) continue
        const good = await checkUrl(l.audio.startsWith('http') ? l.audio : l.audio)
        samples.push({ audio: l.audio, ok: good })
        good ? ok++ : fail++
      }
      setResult({ ok, fail, samples })
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lessons Validator</CardTitle>
        <Button size="sm" onClick={run} disabled={running}>Validate</Button>
      </CardHeader>
      <CardContent>
        {running && <div className="text-sm text-stone-600">Validating up to 50 entries…</div>}
        {!running && result && (
          <div className="space-y-2 text-sm">
            <div>OK: <span className="font-mono">{result.ok}</span></div>
            <div>Missing: <span className="font-mono">{result.fail}</span></div>
            <div className="max-h-48 overflow-auto">
              <ul className="list-disc ml-5">
                {result.samples.map((s, i) => (
                  <li key={i} className={s.ok ? "text-stone-700" : "text-red-600"}>
                    {s.ok ? "OK" : "Missing"} – {s.audio}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {!running && !result && (
          <div className="text-sm text-stone-600">Click Validate to test audio URLs in lessons.json</div>
        )}
      </CardContent>
    </Card>
  )
}

