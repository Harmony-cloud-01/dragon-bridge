"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "./i18n-provider"
import { Globe } from 'lucide-react'

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n()

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-white/90" aria-hidden="true" />
      <div className="flex rounded-md overflow-hidden ring-1 ring-white/40">
        <Button
          size="sm"
          variant={lang === "zh" ? "default" : "outline"}
          onClick={() => setLang("zh")}
          aria-pressed={lang === "zh"}
          className={lang === "zh" ? "bg-white text-emerald-700" : "bg-transparent text-white hover:bg-white/10"}
        >
          {t("chinese")}
        </Button>
        <Button
          size="sm"
          variant={lang === "en" ? "default" : "outline"}
          onClick={() => setLang("en")}
          aria-pressed={lang === "en"}
          className={lang === "en" ? "bg-white text-emerald-700" : "bg-transparent text-white hover:bg-white/10"}
        >
          {t("english")}
        </Button>
      </div>
    </div>
  )
}
