"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function LessonsImporter({ onImported }: { onImported?: () => void }) {
  const [status, setStatus] = useState<string>("")
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Lessons (JSON)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
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

