"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function LessonsImporter({ onImported }: { onImported?: () => void }) {
  const [status, setStatus] = useState<string>("")
  const [url, setUrl] = useState<string>(process.env.NEXT_PUBLIC_LESSONS_URL || "https://raw.githubusercontent.com/Harmony-cloud-01/dragon-bridge/main/public/lessons.library.json")
  const importFile = async (file: File) => {
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      if (!Array.isArray(json)) throw new Error("Invalid JSON: expected array")
      localStorage.setItem("lessons.library.override", JSON.stringify(json))
      setStatus(`Imported ${json.length} lessons.`)
      onImported?.()
    } catch (e: any) {
      setStatus(`Error: ${e?.message || e}`)
    }
  }
  const clearOverride = () => {
    localStorage.removeItem("lessons.library.override")
    setStatus("Cleared override.")
    onImported?.()
  }
  const loadFromUrl = async () => {
    if (!url) return
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(String(res.status))
      const json = await res.json()
      if (!Array.isArray(json)) throw new Error("Invalid JSON: expected array")
      localStorage.setItem("lessons.library.override", JSON.stringify(json))
      setStatus(`Loaded ${json.length} lessons from URL.`)
      onImported?.()
    } catch (e: any) {
      setStatus(`Error loading URL: ${e?.message || e}`)
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Lessons (JSON)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="url"
            placeholder="https://example.com/lessons.json"
            className="border rounded px-2 py-1 flex-1 min-w-[240px]"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button size="sm" onClick={loadFromUrl}>Load from URL</Button>
          <Button size="sm" variant="outline" onClick={() => setUrl("https://raw.githubusercontent.com/Harmony-cloud-01/dragon-bridge/main/public/lessons.library.json")}>Use default</Button>
        </div>
        <input
          type="file"
          accept="application/json"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importFile(f)
          }}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={clearOverride}>Clear override</Button>
        </div>
        {status && <div className="text-stone-600">{status}</div>}
        <p className="text-xs text-stone-500">Tip: Structure must be an array of lessons with id, title, difficulty, dialectCode, and words[].</p>
      </CardContent>
    </Card>
  )
}
