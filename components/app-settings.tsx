"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "./i18n-provider"
import { getConsent, setConsent } from "@/stores/consent"
import { getPreferLocalAudio, setPreferLocalAudio } from "@/stores/settings"
import { isLowRam, isLowCpu } from "@/utils/device"
import { isOffline, onOfflineChange } from "@/utils/offline"
import { clearLessonCache } from "@/utils/lessons-lib"
import { ActivityLogView } from "./activity-log-view"
import { LessonsValidator } from "./lessons-validator"
import { SrsViewer } from "./srs-viewer"

export function AppSettings() {
  const { t } = useI18n()
  const [consent, setConsentState] = useState(false)
  const [preferLocalAudio, setPrefState] = useState(false)
  const [offline, setOffline] = useState(isOffline())
  const [deviceMem, setDeviceMem] = useState<number | null>(null)
  const [cores, setCores] = useState<number | null>(null)

  useEffect(() => {
    setConsentState(getConsent())
    setPrefState(getPreferLocalAudio())
    try {
      // @ts-ignore
      setDeviceMem((navigator as any)?.deviceMemory ?? null)
      setCores(navigator?.hardwareConcurrency ?? null)
    } catch {}
    const stop = onOfflineChange(setOffline)
    return () => stop()
  }, [])

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4 text-sm text-emerald-900">
          This is a HarmonyOnline release. It is open‑source and free for use.
          For more info, updates, or to report a bug, visit
          {" "}
          <a
            href="https://harmonyonline.org"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
            aria-label="HarmonyOnline.org website"
          >
            HarmonyOnline.org
          </a>
          .
          {" "}
          Or open an issue at
          {" "}
          <a
            href="https://github.com/Harmony-cloud-01/dragon-bridge/issues"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
            aria-label="Dragon Bridge GitHub Issues"
          >
            GitHub Issues
          </a>
          .
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audio and Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable mic analysis (consent)</div>
              <div className="text-sm text-stone-600">No audio is uploaded or stored. Used only for local visualization.</div>
            </div>
            <Switch
              checked={consent}
              onCheckedChange={(v) => { setConsentState(v); setConsent(v) }}
              aria-label="Enable mic analysis"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Prefer pre-recorded audio</div>
              <div className="text-sm text-stone-600">When available, play local audio before TTS even online.</div>
            </div>
            <Switch
              checked={preferLocalAudio}
              onCheckedChange={(v) => { setPrefState(v); setPreferLocalAudio(v) }}
              aria-label="Prefer pre-recorded audio"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Library & Cache</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Clear lesson library override</div>
              <div className="text-stone-600">Removes locally imported lessons so the default library is used.</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => { localStorage.removeItem("lessons.library.override"); clearLessonCache() }}>Clear</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Clear lesson loader cache</div>
              <div className="text-stone-600">Forces re-fetch of lessons.library.json next time.</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => { clearLessonCache() }}>Clear</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Use default lesson library</div>
              <div className="text-stone-600">Loads the library from the project repository into local override.</div>
            </div>
            <Button size="sm" onClick={() => {
              const url = (process.env.NEXT_PUBLIC_LESSONS_URL) || "https://raw.githubusercontent.com/Harmony-cloud-01/dragon-bridge/main/public/lessons.library.json";
              fetch(url).then(r=>r.json()).then(json=>{
                if (Array.isArray(json)) {
                  localStorage.setItem("lessons.library.override", JSON.stringify(json));
                  clearLessonCache();
                }
              }).catch(()=>{});
            }}>Load default</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Offline: <span className="font-mono">{String(offline)}</span></div>
          <div>Device memory (GB): <span className="font-mono">{deviceMem ?? 'n/a'}</span></div>
          <div>CPU cores: <span className="font-mono">{cores ?? 'n/a'}</span></div>
          <div>Low RAM heuristic: <span className="font-mono">{String(isLowRam)}</span></div>
          <div>Low CPU heuristic: <span className="font-mono">{String(isLowCpu)}</span></div>
        </CardContent>
      </Card>

      <ActivityLogView />
      <LessonsValidator />
      <SrsViewer />
    </div>
  )
}
