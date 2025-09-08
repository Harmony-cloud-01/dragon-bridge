"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDialect } from "@/hooks/use-dialect"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function DialectDiagnostics() {
  const {
    supportedDialects,
    selectedDialects,
    speechSupported,
    voices,
    hasChineseVoice,
    playPronunciation,
    isPlaying,
  } = useDialect()
  const [testCode, setTestCode] = useState<string>(supportedDialects[0]?.code || "zh-CN")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dialect Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <div>Supported dialects: <span className="font-mono">{supportedDialects.length}</span></div>
        <div>Selected dialects: <span className="font-mono">{selectedDialects.join(", ") || "(none)"}</span></div>
        <div>Speech supported: <span className="font-mono">{String(speechSupported)}</span></div>
        <div>Voices available: <span className="font-mono">{voices.length}</span></div>
        <div>Has Chinese voice: <span className="font-mono">{String(hasChineseVoice)}</span></div>
        <div className="flex items-center gap-2">
          <label htmlFor="dialect-test" className="text-stone-700">Test dialect:</label>
          <select
            id="dialect-test"
            className="border rounded px-2 py-1 text-sm"
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
          >
            {supportedDialects.map((d) => (
              <option key={d.code} value={d.code}>{d.name} ({d.region})</option>
            ))}
          </select>
          <Button size="sm" onClick={() => playPronunciation("你好", testCode)} disabled={isPlaying}>Test voice</Button>
        </div>
        {voices.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer">List voices</summary>
            <ul className="mt-1 max-h-40 overflow-auto list-disc pl-5">
              {voices.slice(0, 50).map((v, i) => (
                <li key={i} className="text-stone-700">
                  <span className="font-mono">{v.name}</span> – <span className="text-stone-500">{v.lang}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
