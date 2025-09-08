"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDialect } from "@/hooks/use-dialect"

export function DialectDiagnostics() {
  const {
    supportedDialects,
    selectedDialects,
    speechSupported,
    voices,
    hasChineseVoice,
  } = useDialect()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dialect Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        <div>Supported dialects: <span className="font-mono">{supportedDialects.length}</span></div>
        <div>Selected dialects: <span className="font-mono">{selectedDialects.join(", ") || "(none)"}</span></div>
        <div>Speech supported: <span className="font-mono">{String(speechSupported)}</span></div>
        <div>Voices available: <span className="font-mono">{voices.length}</span></div>
        <div>Has Chinese voice: <span className="font-mono">{String(hasChineseVoice)}</span></div>
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

