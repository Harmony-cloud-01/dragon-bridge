"use client"

import { Button } from "@/components/ui/button"
import { Home, BookOpen, Users, CalendarDays, Settings } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useI18n } from "./i18n-provider"

type BottomNavProps = {
  current?: string
  onChange?: (section: string) => void
}

const items = [
  { id: "home", icon: Home, labelKey: "navHome" },
  { id: "dialect-vocabulary", icon: BookOpen, labelKey: "navWords" },
  { id: "dialect-phrases", icon: Users, labelKey: "navPhrases" },
  { id: "calendar", icon: CalendarDays, labelKey: "navCalendar" },
  { id: "dialect-settings", icon: Settings, labelKey: "navSettings" },
]

export function BottomNav({ current = "home", onChange = () => {} }: BottomNavProps) {
  const { t } = useI18n()
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-40 sm:hidden" role="navigation" aria-label="Primary">
      <div className="mx-auto flex max-w-xl items-center justify-between rounded-2xl border border-stone-200 bg-white/90 px-2 py-1 shadow-lg backdrop-blur">
        {items.map((item) => {
          const ActiveIcon = item.icon
          const active = current === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onChange(item.id)}
              aria-current={active ? "page" : undefined}
              aria-label={t(item.labelKey)}
              className={cn(
                "flex h-10 flex-col items-center justify-center gap-0 px-3 text-xs",
                active ? "text-emerald-700" : "text-stone-600"
              )}
            >
              <ActiveIcon className={cn("h-5 w-5", active ? "text-emerald-700" : "text-stone-500")} />
              <span className="mt-0.5">{t(item.labelKey)}</span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
