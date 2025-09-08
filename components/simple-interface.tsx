"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, Mic, BookOpen, Calendar, Users, Settings, Activity, Repeat, ShoppingBasket, Bell, GraduationCap } from 'lucide-react'
import { useDialect } from "@/hooks/use-dialect"
import { useI18n } from "./i18n-provider"

interface SimpleInterfaceProps {
  onNavigate: (section: string) => void
}

export function SimpleInterface({ onNavigate }: SimpleInterfaceProps) {
  const { playPronunciation, isPlaying } = useDialect()
  const { t } = useI18n()

  const menuItems = [
    { id: "vocabulary", title: t("learnWords"), subtitle: t("learnWords"), icon: <BookOpen className="h-12 w-12" />, color: "bg-blue-100 hover:bg-blue-200", description: t("descFarmFields") },
    { id: "dialect-vocabulary", title: t("dialectWords"), subtitle: t("dialectWords"), icon: <Volume2 className="h-12 w-12" />, color: "bg-red-100 hover:bg-red-200", description: t("descMarketStreet") },
    { id: "dialect-phrases", title: t("dialectPhrases"), subtitle: t("dialectPhrases"), icon: <Users className="h-12 w-12" />, color: "bg-green-100 hover:bg-green-200", description: t("descCommunityHall") },
    { id: "tone-drills", title: t("toneGuideTitle"), subtitle: t("toneGuideTitle"), icon: <Activity className="h-12 w-12" />, color: "bg-rose-100 hover:bg-rose-200", description: t("descToneDrills") },
    { id: "review", title: t("reviewTitle"), subtitle: t("reviewSubtitle"), icon: <Repeat className="h-12 w-12" />, color: "bg-indigo-100 hover:bg-indigo-200", description: t("descReview") },
    { id: "market-task", title: t("marketQuestTitle"), subtitle: t("marketQuestTitle"), icon: <ShoppingBasket className="h-12 w-12" />, color: "bg-amber-100 hover:bg-amber-200", description: t("descMarketQuest") },
    { id: "reminders", title: t("remindersTitle"), subtitle: t("remindersSubtitle"), icon: <Bell className="h-12 w-12" />, color: "bg-emerald-100 hover:bg-emerald-200", description: t("descReminders") },
    { id: "teacher-mode", title: t("teacherModeTitle"), subtitle: t("teacherModeSubtitle"), icon: <GraduationCap className="h-12 w-12" />, color: "bg-stone-100 hover:bg-stone-200", description: t("descTeacherMode") },
    { id: "calendar", title: t("farmCalendar"), subtitle: t("farmCalendar"), icon: <Calendar className="h-12 w-12" />, color: "bg-yellow-100 hover:bg-yellow-200", description: t("descAlmanacKiosk") },
    { id: "dialect-settings", title: t("dialects"), subtitle: t("dialects"), icon: <Settings className="h-12 w-12" />, color: "bg-purple-100 hover:bg-purple-200", description: t("descSettingsPavilion") },
  ]

  const handleGreeting = async () => {
    await playPronunciation("欢迎使用农村中文学习应用")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardHeader className="text-center py-8">
            <CardTitle className="text-4xl font-bold mb-4">
              {t("classicTitle")}
            </CardTitle>
            <p className="text-xl text-green-100 mb-4">
              {t("classicSubtitle")}
            </p>
            <Button
              variant="secondary"
              onClick={handleGreeting}
              disabled={isPlaying}
              className="mx-auto flex items-center gap-2"
              aria-label={t("playWelcome")}
            >
              <Volume2 className="h-5 w-5" />
              {t("playWelcome")}
            </Button>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <Card
              key={item.id}
              className={`${item.color} cursor-pointer transition-all duration-200 hover:scale-105 border-2`}
              onClick={() => onNavigate(item.id)}
            >
              <CardContent className="p-8 text-center">
                <div className="mb-4 flex justify-center">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-lg text-gray-600 mb-3">{item.subtitle}</p>
                <p className="text-sm text-gray-700">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
