"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CalendarPlus, User } from 'lucide-react'
import { scopedKey } from "@/utils/profile-storage"
import { useProfile } from "./profile-provider"

type ReminderConfig = {
  hour: number
  minute: number
  days: number[] // 0..6, Sunday=0
  enabled: boolean
}

const BASE_REMINDER = "daily.reminder.config"

function pad(n: number) {
  return n.toString().padStart(2, "0")
}

function nextOccurrence({ hour, minute, days }: ReminderConfig) {
  const now = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  if (days.length === 0) {
    if (target <= now) target.setDate(target.getDate() + 1)
    return target
  }
  // next day in days[]
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    const wd = d.getDay()
    if (days.includes(wd)) {
      d.setHours(hour, minute, 0, 0)
      if (d > now) return d
    }
  }
  return target
}

export function Reminders() {
  const { current } = useProfile()
  const [cfg, setCfg] = useState<ReminderConfig>({ hour: 19, minute: 0, days: [1,2,3,4,5], enabled: false })
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [nextTime, setNextTime] = useState<Date | null>(null)
  const [timerId, setTimerId] = useState<number | null>(null)

  const storageKey = scopedKey(BASE_REMINDER)

  // hydrate on mount and when profile changes
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setCfg(JSON.parse(raw))
      else setCfg({ hour: 19, minute: 0, days: [1,2,3,4,5], enabled: false })
    } catch {
      setCfg({ hour: 19, minute: 0, days: [1,2,3,4,5], enabled: false })
    }
    setPermission(typeof Notification !== "undefined" ? Notification.permission : "denied")
  }, [storageKey])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(storageKey, JSON.stringify(cfg))
    } catch {}
    if (cfg.enabled) scheduleNext()
    else cancelTimer()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.hour, cfg.minute, JSON.stringify(cfg.days), cfg.enabled, storageKey])

  useEffect(() => {
    const onProfileChange = () => {
      try {
        const raw = localStorage.getItem(scopedKey(BASE_REMINDER))
        setCfg(raw ? JSON.parse(raw) : { hour: 19, minute: 0, days: [1,2,3,4,5], enabled: false })
      } catch {
        setCfg({ hour: 19, minute: 0, days: [1,2,3,4,5], enabled: false })
      }
    }
    window.addEventListener("profile:changed", onProfileChange)
    return () => window.removeEventListener("profile:changed", onProfileChange)
  }, [])

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return
    const res = await Notification.requestPermission()
    setPermission(res)
  }

  const scheduleNext = async () => {
    cancelTimer()
    const n = nextOccurrence(cfg)
    setNextTime(n)
    const delay = Math.max(0, n.getTime() - Date.now())
    const id = window.setTimeout(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg && Notification.permission === "granted") {
          reg.showNotification("Time to practice Mandarin", {
            body: `Open Dragon Bridge and review a few words${current ? `, ${current.name}` : ""}.`,
            tag: "dragon-bridge-daily",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
          })
        } else if (Notification.permission === "granted") {
          new Notification("Time to practice Mandarin", { body: "Open Dragon Bridge and review a few words." })
        }
      } catch {}
      // schedule next occurrence if recurring
      scheduleNext()
    }, delay)
    setTimerId(id)
  }

  const cancelTimer = () => {
    if (timerId) {
      clearTimeout(timerId)
      setTimerId(null)
    }
  }

  const toggleDay = (d: number) => {
    setCfg((c) => {
      const has = c.days.includes(d)
      return { ...c, days: has ? c.days.filter((x) => x !== d) : [...c.days, d] }
    })
  }

  const dlICS = () => {
    // generate a weekly repeating event ICS
    const uid = `dragon-bridge-${Date.now()}@local`
    const dtStart = new Date()
    dtStart.setHours(cfg.hour, cfg.minute, 0, 0)
    const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    const timeStr = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    const RRULE = cfg.days.length
      ? `RRULE:FREQ=WEEKLY;BYDAY=${cfg.days.map((d) => ["SU","MO","TU","WE","TH","FR","SA"][d]).join(",")}`
      : "RRULE:FREQ=DAILY"
    const end = new Date(dtStart.getTime() + 30 * 60 * 1000)
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Dragon Bridge//Reminders//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${timeStr(dtStart)}`,
      `DTEND:${timeStr(end)}`,
      "SUMMARY:Mandarin Practice",
      "DESCRIPTION:Daily Mandarin review with Dragon Bridge",
      RRULE,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "mandarin-practice.ics"
    a.click()
    URL.revokeObjectURL(url)
  }

  const googleCalendarLink = useMemo(() => {
    // Google Calendar quick add for a single event; recurring via ICS is more reliable
    const start = new Date()
    start.setHours(cfg.hour, cfg.minute, 0, 0)
    const end = new Date(start.getTime() + 30 * 60 * 1000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    const text = encodeURIComponent("Mandarin Practice")
    const details = encodeURIComponent("Daily Mandarin review with Dragon Bridge")
    const dates = `${fmt(start)}/${fmt(end)}`
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&dates=${dates}`
  }, [cfg.hour, cfg.minute])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Daily Reminders</h2>
        <p className="text-gray-600">Get a friendly nudge to practice</p>
      </div>

      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminder Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <User className="h-3.5 w-3.5" />
            This reminder is saved for profile: <span className="font-medium">{current?.name ?? "Unknown"}</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-32">Time</label>
            <input
              type="time"
              value={`${pad(cfg.hour)}:${pad(cfg.minute)}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map((x) => parseInt(x, 10))
                setCfg((c) => ({ ...c, hour: h, minute: m }))
              }}
              className="border rounded px-2 py-1"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-32">Days</label>
            <div className="flex flex-wrap gap-2">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={cfg.days.includes(i) ? "default" : "outline"}
                  onClick={() => toggleDay(i)}
                  aria-pressed={cfg.days.includes(i)}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-32">Permission</label>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{permission}</Badge>
              {permission !== "granted" && (
                <Button size="sm" onClick={requestPermission}>Enable Notifications</Button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setCfg((c) => ({ ...c, enabled: true }))} disabled={permission !== "granted"}>
              Start Reminders
            </Button>
            <Button variant="outline" onClick={() => setCfg((c) => ({ ...c, enabled: false }))}>
              Stop
            </Button>
          </div>

          {cfg.enabled && nextTime && (
            <div className="text-sm text-gray-600">
              Next reminder: <span className="font-semibold">{nextTime.toLocaleString()}</span>
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <div className="text-sm font-medium">Optional: Add to your Calendar</div>
            <div className="flex gap-2">
              <Button onClick={dlICS} className="flex items-center gap-2">
                <CalendarPlus className="h-4 w-4" />
                Download .ics
              </Button>
              <a href={googleCalendarLink} target="_blank" rel="noreferrer">
                <Button variant="outline">Add to Google Calendar</Button>
              </a>
            </div>
            <div className="text-xs text-gray-500">
              Using a calendar event is the most reliable cross-device reminder. Browser notifications may not fire when the app is closed.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
