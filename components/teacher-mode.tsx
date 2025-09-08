"use client"

import { useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSrs } from "@/hooks/use-srs"
import { readEvents, clearEvents } from "@/utils/activity-log"
import { Download, FileJson, FileSpreadsheet, Upload } from 'lucide-react'
import { useProfile } from "./profile-provider"
import { scopedKey } from "@/utils/profile-storage"

function toCSV(rows: string[][]) {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
}

function downloadBlob(name: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function TeacherMode() {
  const { allItems, dueItems } = useSrs()
  const events = useMemo(() => readEvents(), [])
  const fileRef = useRef<HTMLInputElement | null>(null)
  const { current } = useProfile()

  const srsCSV = () => {
    const rows: string[][] = [
      ["key", "text", "type", "box", "dueISO", "addedAtISO", "historyCount"],
      ...allItems.map((it) => [
        it.key,
        it.text,
        it.type,
        String(it.box),
        new Date(it.due).toISOString(),
        new Date(it.addedAt).toISOString(),
        String(it.history.length),
      ]),
    ]
    downloadBlob("srs-items.csv", toCSV(rows), "text/csv")
  }

  const eventsCSV = () => {
    const rows: string[][] = [["type", "payload", "timeISO"]]
    events.forEach((ev) => {
      rows.push([ev.type, JSON.stringify({ ...ev, t: undefined }), new Date((ev as any).t).toISOString()])
    })
    downloadBlob("activity-events.csv", toCSV(rows), "text/csv")
  }

  const allJSON = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      srs: allItems,
      srsDueCount: dueItems.length,
      events,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      lang: typeof navigator !== "undefined" ? navigator.language : "",
    }
    downloadBlob("session-report.json", JSON.stringify(data, null, 2), "application/json")
  }

  const readLocal = (key: string) => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  const writeLocal = (key: string, value: any) => {
    try {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value))
    } catch {}
  }

  const exportProfileJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: current ? { id: current.id, name: current.name, avatar: current.avatar } : null,
      data: {
        srs: readLocal(scopedKey("srs.items")),
        activity: readLocal(scopedKey("activity.logs")),
        reminders: readLocal(scopedKey("daily.reminder.config")),
        dialect: {
          selectedDialects: readLocal(scopedKey("dialect.selectedDialects")),
          playbackRate: readLocal(scopedKey("dialect.playbackRate")),
          preferredVoice: readLocal(scopedKey("dialect.preferredVoice")),
        },
        uiLang: readLocal(scopedKey("ui.lang")), // include UI language per profile
      },
      version: 2,
    }
    const name = current ? `profile-${current.name}-${current.id}.json` : "profile-export.json"
    downloadBlob(name, JSON.stringify(payload, null, 2), "application/json")
  }

  const importProfileJSON = async (file: File) => {
    try {
      const txt = await file.text()
      const json = JSON.parse(txt)
      if (!json || typeof json !== "object") throw new Error("Invalid JSON")
      // import into CURRENT profile scope
      if (json?.data?.srs) writeLocal(scopedKey("srs.items"), json.data.srs)
      if (json?.data?.activity) writeLocal(scopedKey("activity.logs"), json.data.activity)
      if (json?.data?.reminders) writeLocal(scopedKey("daily.reminder.config"), json.data.reminders)
      if (json?.data?.dialect) {
        if (json.data.dialect.selectedDialects) writeLocal(scopedKey("dialect.selectedDialects"), json.data.dialect.selectedDialects)
        if (json.data.dialect.playbackRate) writeLocal(scopedKey("dialect.playbackRate"), json.data.dialect.playbackRate)
        if (json.data.dialect.preferredVoice !== undefined) {
          if (json.data.dialect.preferredVoice === null) localStorage.removeItem(scopedKey("dialect.preferredVoice"))
          else writeLocal(scopedKey("dialect.preferredVoice"), json.data.dialect.preferredVoice)
        }
      }
      if (json?.data?.uiLang !== undefined) {
        // ui.lang may be a string or JSON string, normalize to string
        if (typeof json.data.uiLang === "string") {
          writeLocal(scopedKey("ui.lang"), json.data.uiLang)
        } else {
          writeLocal(scopedKey("ui.lang"), json.data.uiLang)
        }
      }
      // Notify interested hooks
      window.dispatchEvent(new Event("profile:changed"))
      window.dispatchEvent(new Event("activity:updated"))
      alert("Profile data imported successfully into current profile.")
    } catch (e: any) {
      alert(`Import failed: ${e?.message ?? "Unknown error"}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Teacher Mode</h2>
        <p className="text-gray-600">Export session data and SRS progress</p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">SRS Items: {allItems.length}</Badge>
            <Badge variant="outline">Due Today: {dueItems.length}</Badge>
            <Badge variant="outline">Activity Events: {events.length}</Badge>
            {current && <Badge variant="outline">Profile: {current.name}</Badge>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button onClick={srsCSV} className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export SRS (CSV)
            </Button>
            <Button onClick={eventsCSV} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Events (CSV)
            </Button>
            <Button onClick={allJSON} variant="outline" className="flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              Export All (JSON)
            </Button>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="text-sm font-medium">Per-Profile Export/Import</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={exportProfileJSON} className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Export Current Profile (JSON)
              </Button>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) importProfileJSON(f)
                    if (fileRef.current) fileRef.current.value = ""
                  }}
                />
                <Button variant="outline" className="flex items-center gap-2" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Import JSON into Current Profile
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Import will overwrite SRS items, activity logs, reminders, dialect preferences, and UI language for the current profile.
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Note: activity events currently log SRS grades and some audio plays. You can clear events in your browser storage.
          </div>
          <div>
            <Button variant="ghost" onClick={() => clearEvents()}>Clear Activity Events</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
