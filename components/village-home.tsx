"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Map, Store, BookOpen, Users, CalendarDays, Headphones, Settings, Activity, Repeat, ShoppingBasket, Bell, GraduationCap } from 'lucide-react'
import { useI18n } from "./i18n-provider"
import { useBasePath } from "./BasePathProvider" // Add this import

type VillageHomeProps = {
  onNavigate?: (section: string) => void
}

export function VillageHome({ onNavigate = () => {} }: VillageHomeProps) {
  const { t } = useI18n()
  const { withBasePath } = useBasePath() // Add this hook

  const places = [
    {
      id: "vocabulary",
      titleKey: "placeFarmFields",
      subtitleKey: "learnWords",
      icon: <BookOpen className="h-6 w-6 text-emerald-700" />,
      emoji: "🌾",
      color: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
      descKey: "descFarmFields",
    },
    {
      id: "dialect-vocabulary",
      titleKey: "placeMarketStreet",
      subtitleKey: "dialectWords",
      icon: <Store className="h-6 w-6 text-amber-700" />,
      emoji: "🛍️",
      color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
      descKey: "descMarketStreet",
    },
    {
      id: "dialect-phrases",
      titleKey: "placeCommunityHall",
      subtitleKey: "dialectPhrases",
      icon: <Users className="h-6 w-6 text-orange-700" />,
      emoji: "🏯",
      color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
      descKey: "descCommunityHall",
    },
    {
      id: "calendar",
      titleKey: "placeAlmanacKiosk",
      subtitleKey: "farmCalendar",
      icon: <CalendarDays className="h-6 w-6 text-lime-700" />,
      emoji: "📅",
      color: "bg-lime-50 border-lime-200 hover:bg-lime-100",
      descKey: "descAlmanacKiosk",
    },
    {
      id: "audio",
      titleKey: "placeAudioBooth",
      subtitleKey: "audioSettings",
      icon: <Headphones className="h-6 w-6 text-stone-700" />,
      emoji: "🎧",
      color: "bg-stone-50 border-stone-200 hover:bg-stone-100",
      descKey: "descAudioBooth",
    },
    {
      id: "settings",
      titleKey: "placeSettingsPavilion",
      subtitleKey: "dialects",
      icon: <Settings className="h-6 w-6 text-teal-700" />,
      emoji: "🛖",
      color: "bg-teal-50 border-teal-200 hover:bg-teal-100",
      descKey: "descSettingsPavilion",
    },
    {
      id: "tone-drills",
      titleKey: "toneGuideTitle",
      subtitleKey: "toneGuideTitle",
      icon: <Activity className="h-6 w-6 text-rose-700" />,
      emoji: "🎯",
      color: "bg-rose-50 border-rose-200 hover:bg-rose-100",
      descKey: "descToneDrills",
    },
    {
      id: "review",
      titleKey: "reviewTitle",
      subtitleKey: "reviewSubtitle",
      icon: <Repeat className="h-6 w-6 text-indigo-700" />,
      emoji: "🔁",
      color: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
      descKey: "descReview",
    },
    {
      id: "market-task",
      titleKey: "marketQuestTitle",
      subtitleKey: "marketQuestTitle",
      icon: <ShoppingBasket className="h-6 w-6 text-amber-700" />,
      emoji: "🧺",
      color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
      descKey: "descMarketQuest",
    },
    {
      id: "reminders",
      titleKey: "remindersTitle",
      subtitleKey: "remindersSubtitle",
      icon: <Bell className="h-6 w-6 text-emerald-700" />,
      emoji: "⏰",
      color: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
      descKey: "descReminders",
    },
    {
      id: "teacher-mode",
      titleKey: "teacherModeTitle",
      subtitleKey: "teacherModeSubtitle",
      icon: <GraduationCap className="h-6 w-6 text-stone-700" />,
      emoji: "🎓",
      color: "bg-stone-50 border-stone-200 hover:bg-stone-100",
      descKey: "descTeacherMode",
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-2 border-emerald-200">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {t("villageMapTitle")}
            </CardTitle>
            <Badge variant="outline" className="border-emerald-300 text-emerald-800">
              {t("exploreByPlace")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="relative w-full overflow-hidden rounded-md ring-1 ring-emerald-200">
            <Image
              src={withBasePath("/rural-china-village.png")} // Update this line              
              alt="Rural village illustration with fields, market street, and a hall"
              width={1200}
              height={240}
              className="h-48 w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/70 to-transparent" />
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm shadow-sm ring-1 ring-emerald-200">
              <Map className="h-4 w-4 text-emerald-700" />
              {t("tapAPlace")}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {places.map((p) => (
          <button
            key={p.id}
            onClick={() => onNavigate(p.id)}
            className={`text-left rounded-lg border ${p.color} transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400`}
            aria-label={`${t(p.titleKey)} - ${t(p.subtitleKey)}`}
          >
            <div className="p-4 flex items-start gap-3">
              <div className="text-2xl leading-none">{p.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {p.icon}
                  <h3 className="font-semibold">{t(p.titleKey)}</h3>
                </div>
                <p className="text-sm text-stone-600">{t(p.subtitleKey)}</p>
                <p className="mt-2 text-xs text-stone-500">{t(p.descKey)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button size="lg" className="h-14 bg-emerald-600 hover:bg-emerald-700" onClick={() => onNavigate("dialect-vocabulary")}>
          <BookOpen className="h-5 w-5 mr-2" />
          {t("dialectWords")}
        </Button>
        <Button variant="outline" size="lg" className="h-14" onClick={() => onNavigate("dialect-phrases")}>
          <Users className="h-5 w-5 mr-2" />
          {t("dialectPhrases")}
        </Button>
        <Button variant="outline" size="lg" className="h-14" onClick={() => onNavigate("calendar")}>
          <CalendarDays className="h-5 w-5 mr-2" />
          {t("farmCalendar")}
        </Button>
      </div>
    </div>
  )
}
