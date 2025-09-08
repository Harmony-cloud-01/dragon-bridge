"use client"

import { useEffect, useState } from "react"
import { WifiOff } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useI18n } from "./i18n-provider"

export function OfflineBanner() {
  const [offline, setOffline] = useState<boolean>(false)
  const [dismissed, setDismissed] = useState<boolean>(false)
  const { t } = useI18n()

  useEffect(() => {
    if (typeof window === "undefined") return
    const set = () => setOffline(!navigator.onLine)
    set()
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!offline || dismissed) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-3 left-3 right-3 z-50",
      )}
    >
      <div className="mx-auto max-w-xl rounded-lg border border-yellow-300 bg-yellow-50 shadow-md">
        <div className="flex items-start gap-3 p-3">
          <WifiOff className="h-5 w-5 text-yellow-700 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">{t("offlineTitle")}</p>
            <p className="text-xs text-yellow-700">
              {t("offlineDetail")}
            </p>
          </div>
          <button
            className="text-xs text-yellow-800 underline underline-offset-2"
            onClick={() => setDismissed(true)}
          >
            {t("dismiss")}
          </button>
        </div>
      </div>
    </div>
  )
}
