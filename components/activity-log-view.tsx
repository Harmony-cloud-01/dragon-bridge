"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getStorage } from "@/storage"
import type { ActivityEvent } from "@/utils/activity-log"

function ts(t: number) {
  try { return new Date(t).toLocaleString() } catch { return String(t) }
}

export function ActivityLogView() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const eng = await getStorage()
      const list = await eng.readEvents(null)
      setEvents(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const onUpd = () => load()
    window.addEventListener("activity:updated", onUpd as any)
    return () => window.removeEventListener("activity:updated", onUpd as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clear = async () => {
    setLoading(true)
    try {
      const eng = await getStorage()
      await eng.clearEvents(null)
      await load()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity Log</CardTitle>
        <Button size="sm" variant="outline" onClick={clear} disabled={loading}>Clear</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-stone-600">Loading…</div>
        ) : events.length === 0 ? (
          <div className="text-sm text-stone-600">No events yet.</div>
        ) : (
          <div className="max-h-64 overflow-auto text-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="text-stone-500">
                  <th className="py-1 pr-3">Time</th>
                  <th className="py-1 pr-3">Type</th>
                  <th className="py-1">Detail</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1 pr-3 whitespace-nowrap">{ts((e as any).t)}</td>
                    <td className="py-1 pr-3">{(e as any).type}</td>
                    <td className="py-1 text-stone-700">
                      {"text" in e && e.text ? <span className="font-mono">{e.text}</span> : null}
                      {"dialect" in e && e.dialect ? <span className="ml-2 text-stone-500">[{e.dialect}]</span> : null}
                      {"grade" in e && e.grade ? <span className="ml-2">grade: {e.grade}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

