"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useI18n, LS_LANG } from "./i18n-provider"
import { Languages, Check } from 'lucide-react'
import { scopedKey } from "@/utils/profile-storage"

export function LanguageOnboarding() {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const [ack, setAck] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = localStorage.getItem(scopedKey(LS_LANG))
    // Show if no language saved yet for current profile
    setOpen(!saved)
  }, [])

  const choose = (l: "en" | "zh") => {
    setLang(l)
    try {
      localStorage.setItem(scopedKey(LS_LANG), l)
    } catch {}
  }

  const close = () => {
    setAck(true)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-emerald-600" />
            {t("chooseLanguageTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("chooseLanguageDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button
            variant={lang === "zh" ? "default" : "outline"}
            onClick={() => choose("zh")}
            aria-pressed={lang === "zh"}
            className={lang === "zh" ? "bg-emerald-600" : ""}
          >
            {t("chinese")}
          </Button>
          <Button
            variant={lang === "en" ? "default" : "outline"}
            onClick={() => choose("en")}
            aria-pressed={lang === "en"}
            className={lang === "en" ? "bg-emerald-600" : ""}
          >
            {t("english")}
          </Button>
        </div>

        <Button onClick={close} className="mt-4 w-full flex items-center gap-2">
          <Check className="h-4 w-4" />
          {t("startLearning")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
