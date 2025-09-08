"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProfileProvider, ProfileButton } from "./profile-provider"
import { DialectProvider } from "./dialect-provider"
import { RuralVocabulary } from "./rural-vocabulary"
import { SeasonalCalendar } from "./seasonal-calendar"
import { CommunityPhrases } from "./community-phrases"
import { SimpleInterface } from "./simple-interface"
import { AudioControls } from "./audio-controls"
import { DialectVocabulary } from "./dialect-vocabulary"
import { DialectPhrases } from "./dialect-phrases"
import { DialectSelector } from "./dialect-selector"
import { VillageHome } from "./village-home"
import { BottomNav } from "./bottom-nav"
import { Star, LayoutTemplate, Map } from 'lucide-react'
import { useI18n } from "./i18n-provider"
import { LanguageToggle } from "./language-toggle"
import { AudioStatus } from "./audio-status"
import { LanguageOnboarding } from "./language-onboarding"
import { ToneDrills } from "./tone-drills"
import { ReviewSRS } from "./review-srs"
import { MarketTask } from "./market-task"
import { TeacherMode } from "./teacher-mode"
import { Reminders } from "./reminders"
import { useProgress } from "@/hooks/use-progress"
import { AppSettings } from "./app-settings"

type HomeVariant = "village" | "classic"
const LS_HOME_VARIANT = "ui.homeVariant"

function AppShellInner() {
  const [currentSection, setCurrentSection] = useState<string>("home")
  const [homeVariant, setHomeVariant] = useState<HomeVariant>("village")
  const { t } = useI18n()
  const { wordsLearned, accuracy, streak, level } = useProgress()

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = localStorage.getItem(LS_HOME_VARIANT) as HomeVariant | null
    if (saved === "village" || saved === "classic") setHomeVariant(saved)
  }, [])
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(LS_HOME_VARIANT, homeVariant)
    } catch {}
  }, [homeVariant])

  return (
    <DialectProvider>
      <div className="min-h-screen bg-[linear-gradient(135deg,#f9fafb,40%,#fef7ee)] p-4">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">{t("appName")}</CardTitle>
                    <p className="text-emerald-100">{t("appSubtitle")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <LanguageToggle />
                      <ProfileButton />
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-2 bg-white text-emerald-700">
                        {level}
                      </Badge>
                      <div className="flex items-center justify-end gap-2">
                        <Star className="h-4 w-4" />
                        <span className="font-semibold">{streak} {t("dayStreak")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* UI variant toggle */}
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant={homeVariant === "village" ? "default" : "outline"}
                    onClick={() => setHomeVariant("village")}
                    aria-pressed={homeVariant === "village"}
                    className="bg-white text-emerald-700 hover:bg-emerald-50"
                  >
                    <Map className="h-4 w-4 mr-1" />
                    {t("village")}
                  </Button>
                  <Button
                    size="sm"
                    variant={homeVariant === "classic" ? "default" : "outline"}
                    onClick={() => setHomeVariant("classic")}
                    aria-pressed={homeVariant === "classic"}
                    className="bg-white text-emerald-700 hover:bg-emerald-50"
                  >
                    <LayoutTemplate className="h-4 w-4 mr-1" />
                    {t("classic")}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* First-run language selection modal */}
          <LanguageOnboarding />

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-amber-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{wordsLearned}</div>
                <div className="text-sm text-stone-600">{t("wordsLearned")}</div>
              </CardContent>
            </Card>
            <Card className="border-lime-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{`${accuracy}%`}</div>
                <div className="text-sm text-stone-600">{t("accuracyRate")}</div>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{streak}</div>
                <div className="text-sm text-stone-600">{t("dayStreak")}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          {currentSection === "home" &&
            (homeVariant === "village" ? (
              <VillageHome onNavigate={setCurrentSection} />
            ) : (
              <SimpleInterface onNavigate={setCurrentSection} />
            ))}

          {currentSection === "vocabulary" && (
            <SectionWrapper back={() => setCurrentSection("home")} title={t("backHome")}>
              <RuralVocabulary />
            </SectionWrapper>
          )}

          {currentSection === "phrases" && (
            <SectionWrapper back={() => setCurrentSection("home")} title={t("backHome")}>
              <CommunityPhrases />
            </SectionWrapper>
          )}

          {currentSection === "calendar" && (
            <SectionWrapper back={() => setCurrentSection("home")} title={t("backHome")}>
              <SeasonalCalendar />
            </SectionWrapper>
          )}

          {currentSection === "audio" && (
            <SectionWrapper back={() => setCurrentSection("home")} title={t("backHome")}>
              <AudioControls />
            </SectionWrapper>
          )}

          {currentSection === "dialect-vocabulary" && (
            <SectionWrapper back={() => setCurrentSection("home")} title={t("backHome")}>
              <DialectVocabulary />
            </SectionWrapper>
          )}

          {currentSection === "dialect-phrases" && (
            <SectionWrapper back={() => setCurrentSection("home")} title={t("backHome")}>
              <DialectPhrases />
            </SectionWrapper>
          )}

          {currentSection === "settings" && (
            <SectionWrapper back={() => setCurrentSection("home")} title={t("backHome")}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DialectSelector />
                <AppSettings />
              </div>
            </SectionWrapper>
          )}

          {currentSection === "tone-drills" && (
            <SectionWrapper back={() => setCurrentSection("home")} title={t("backHome")}>
              <ToneDrills />
            </SectionWrapper>
          )}

          {currentSection === "review" && (
            <SectionWrapper back={() => setCurrentSection("home")} title={t("backHome")}>
              <ReviewSRS />
            </SectionWrapper>
          )}

          {currentSection === "market-task" && (
            <SectionWrapper back={() => setCurrentSection("home")} title={t("backHome")}>
              <MarketTask />
            </SectionWrapper>
          )}

          {currentSection === "teacher-mode" && (
            <SectionWrapper back={() => setCurrentSection("home")} title={t("backHome")}>
              <TeacherMode />
            </SectionWrapper>
          )}

          {currentSection === "reminders" && (
            <SectionWrapper back={() => setCurrentSection("home")} title={t("backHome")}>
              <Reminders />
            </SectionWrapper>
          )}
        </div>

        <BottomNav current={currentSection} onChange={setCurrentSection} />
      </div>
      <AudioStatus />
    </DialectProvider>
  )
}

function SectionWrapper({ back, title, children }: { back: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={back}>
        {"← "}{title}
      </Button>
      {children}
    </div>
  )
}

export function MandarinApp() {
  // Wrap the whole app with ProfileProvider to enable first-run modal and switching
  return (
    <ProfileProvider>
      <AppShellInner />
    </ProfileProvider>
  )
}
