"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { MapPin, Volume2, Settings, Globe } from 'lucide-react'
import { useDialect } from "@/hooks/use-dialect"
import { useI18n } from "./i18n-provider"
import { DialectDiagnostics } from "@/components/dialect-diagnostics"

export function DialectSelector() {
  const {
    supportedDialects,
    selectedDialects,
    setSelectedDialects,
    playbackRate,
    setPlaybackRate,
    playPronunciation,
    isPlaying,
  } = useDialect()
  const { t } = useI18n()

  const handleDialectToggle = (dialectCode: string) => {
    if (selectedDialects.includes(dialectCode)) {
      if (selectedDialects.length > 1) {
        setSelectedDialects(selectedDialects.filter((d) => d !== dialectCode))
      }
    } else {
      setSelectedDialects([...selectedDialects, dialectCode])
    }
  }

  const testDialect = async (dialectCode: string, dialectName: string) => {
    await playPronunciation(`你好，我说${dialectName}`, dialectCode)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{t("dialectSettingsTitle")}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("playbackSettingsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t("speed")}
            </span>
            <Badge variant="outline">{playbackRate.toFixed(1)}x</Badge>
          </div>
          <Slider
            value={[playbackRate]}
            onValueChange={(value) => setPlaybackRate(value[0])}
            min={0.5}
            max={2.0}
            step={0.1}
            className="w-full"
            aria-label={t("playbackSpeed")}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{t("slow")} (0.5x)</span>
            <span>{t("normal")} (1.0x)</span>
            <span>{t("fast")} (2.0x)</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("selectDialectsTitle")}
          </CardTitle>
          <p className="text-sm text-gray-600">{t("selectDialectsDesc")}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportedDialects.length === 0 && (
              <div className="text-sm text-stone-600">No dialects available.</div>
            )}
            {supportedDialects.map((dialect) => (
              <Card
                key={dialect.code}
                className={`cursor-pointer transition-all ${
                  selectedDialects.includes(dialect.code) ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                }`}
                onClick={() => handleDialectToggle(dialect.code)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedDialects.includes(dialect.code)}
                          onCheckedChange={() => handleDialectToggle(dialect.code)}
                          aria-label={`Select ${dialect.name}`}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{dialect.name}</h4>
                        <p className="text-sm text-gray-600">{dialect.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {dialect.region}
                    </Badge>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      testDialect(dialect.code, dialect.name)
                    }}
                    disabled={isPlaying}
                    className="w-full flex items-center gap-2"
                    aria-label={t("testPronunciation")}
                  >
                    <Volume2 className="h-4 w-4" />
                    {t("testPronunciation")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg">{t("currentSelection")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedDialects.map((dialectCode) => {
              const dialect = supportedDialects.find((d) => d.code === dialectCode)
              return dialect ? (
                <Badge key={dialectCode} variant="default" className="text-sm">
                  {dialect.name} ({dialect.region})
                </Badge>
              ) : null
            })}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {t("selectedDialectsWillPlay")}
          </p>
        </CardContent>
      </Card>

      {/* Diagnostics panel for troubleshooting */}
      <DialectDiagnostics />
    </div>
  )
}
