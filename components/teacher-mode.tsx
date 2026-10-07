"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSrs } from "@/hooks/use-srs"
import { reportStorageFailure } from "@/storage/failure"
import type { ActivityEvent } from "@/utils/activity-log"
import { readEvents, clearEvents } from "@/utils/activity-log"
import { Download, FileJson, FileSpreadsheet, Upload } from 'lucide-react'
import { useProfile } from "./profile-provider"
import { exportProfileBackup, importProfileBackup } from "@/utils/profile-backup"

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
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const fileRef = useRef<HTMLInputElement | null>(null)
  const backupBusy = useRef(false)
  const [backupPending, setBackupPending] = useState(false)
  const { current } = useProfile()
  useEffect(() => {
    let active = true
    let version = 0
    const refresh = async () => {
      const request = ++version
      try {
        const list = await readEvents(current?.id ?? null)
        if (active && request === version) setEvents(list)
      } catch { if (active) reportStorageFailure("load activity") }
    }
    setEvents([])
    void refresh()
    window.addEventListener("activity:updated", refresh)
    return () => { active = false; window.removeEventListener("activity:updated", refresh) }
  }, [current?.id])


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

  const exportProfileJSON = async () => {
    if (backupBusy.current) return
    const profile = current ? { id: current.id, name: current.name, avatar: current.avatar } : null
    backupBusy.current = true
    setBackupPending(true)
    try {
      const payload = await exportProfileBackup(profile)
      const name = profile ? `profile-${profile.name}-${profile.id}.json` : "profile-export.json"
      downloadBlob(name, JSON.stringify(payload, null, 2), "application/json")
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : "Could not read profile data"}`)
    } finally {
      backupBusy.current = false
      setBackupPending(false)
    }
  }

  const importProfileJSON = async (file: File) => {
    if (backupBusy.current) return
    // File reading and native storage can take time; retain the initiating profile.
    const profileId = current?.id ?? null
    const profileName = current?.name ?? "the default profile"
    backupBusy.current = true
    setBackupPending(true)
    try {
      const json = JSON.parse(await file.text())
      await importProfileBackup(json, profileId)
      alert(`Profile data imported successfully into ${profileName}.`)
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : "Could not import profile data"}`)
    } finally {
      backupBusy.current = false
      setBackupPending(false)
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
              <Button disabled={backupPending} onClick={exportProfileJSON} className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Export Current Profile (JSON)
              </Button>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  disabled={backupPending}
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) importProfileJSON(f)
                    if (fileRef.current) fileRef.current.value = ""
                  }}
                />
                <Button disabled={backupPending} variant="outline" className="flex items-center gap-2" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Import JSON into Current Profile
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Import replaces included SRS items, activity logs, reminders, dialect preferences, and UI language for the selected profile. Preferences remain in local storage on web and native.
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Note: activity events currently log SRS grades and some audio plays. Use Clear Activity Events below to clear this profile’s activity.
          </div>
          <div>
            <Button variant="ghost" onClick={() => clearEvents()}>Clear Activity Events</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
