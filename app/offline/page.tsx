"use client"

import { useI18n } from "@/components/i18n-provider"

export default function OfflinePage() {
  const { t } = useI18n()

  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("offlineTitle")}</h1>
        <p className="text-gray-600">
          {t("offlineDetail")}
        </p>
        <p className="text-sm text-gray-500">
          {t("offlineTip")}
        </p>
      </div>
    </main>
  )
}
