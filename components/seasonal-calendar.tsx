"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, Sun, Cloud, Snowflake, Flower } from 'lucide-react'
import { useDialect } from "@/hooks/use-dialect"
import { useI18n } from "./i18n-provider"

const seasonalActivities = {
  spring: {
    name: "春天",
    pinyin: "chūn tiān",
    icon: <Flower className="h-8 w-8 text-green-600" />,
    color: "bg-green-100",
    activities: [
      { chinese: "播种", pinyin: "bō zhǒng", english: "Sowing seeds", description: "春天是播种的好时节" },
      { chinese: "施肥", pinyin: "shī féi", english: "Apply fertilizer", description: "给庄稼施肥长得好" },
      { chinese: "修剪果树", pinyin: "xiū jiǎn guǒ shù", english: "Prune fruit trees", description: "春天修剪果树结果多" },
    ],
  },
  summer: {
    name: "夏天",
    pinyin: "xià tiān",
    icon: <Sun className="h-8 w-8 text-yellow-600" />,
    color: "bg-yellow-100",
    activities: [
      { chinese: "浇水", pinyin: "jiāo shuǐ", english: "Water crops", description: "夏天天热要多浇水" },
      { chinese: "除草", pinyin: "chú cǎo", english: "Weed removal", description: "夏天草长得快要除草" },
      { chinese: "防虫", pinyin: "fáng chóng", english: "Pest control", description: "夏天虫子多要防治" },
    ],
  },
  autumn: {
    name: "秋天",
    pinyin: "qiū tiān",
    icon: <Cloud className="h-8 w-8 text-orange-600" />,
    color: "bg-orange-100",
    activities: [
      { chinese: "收获", pinyin: "shōu huò", english: "Harvest", description: "秋天是收获的季节" },
      { chinese: "晒粮食", pinyin: "shài liáng shi", english: "Dry grains", description: "收获后要晒干粮食" },
      { chinese: "准备过冬", pinyin: "zhǔn bèi guò dōng", english: "Prepare for winter", description: "秋天要准备过冬的东西" },
    ],
  },
  winter: {
    name: "冬天",
    pinyin: "dōng tiān",
    icon: <Snowflake className="h-8 w-8 text-blue-600" />,
    color: "bg-blue-100",
    activities: [
      { chinese: "修理农具", pinyin: "xiū lǐ nóng jù", english: "Repair farm tools", description: "冬天有时间修理农具" },
      { chinese: "计划明年", pinyin: "jì huà míng nián", english: "Plan next year", description: "冬天计划明年种什么" },
      { chinese: "储存粮食", pinyin: "chǔ cún liáng shi", english: "Store grains", description: "冬天要储存好粮食" },
    ],
  },
}

export function SeasonalCalendar() {
  const [selectedSeason, setSelectedSeason] = useState<keyof typeof seasonalActivities>('spring')
  const { playPronunciation, isPlaying, currentlyPlaying } = useDialect()
  const { t } = useI18n()

  const season = seasonalActivities[selectedSeason]

  const handlePlaySeason = async () => {
    await playPronunciation(season.name)
  }
  const handlePlayActivity = async (activity: any) => {
    await playPronunciation(activity.chinese)
  }
  const handlePlayDescription = async (description: string) => {
    await playPronunciation(description)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{t("agriCalendarTitle")}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(seasonalActivities).map(([key, seasonData]) => (
          <Button
            key={key}
            variant={selectedSeason === key ? "default" : "outline"}
            onClick={() => setSelectedSeason(key as keyof typeof seasonalActivities)}
            className={`h-auto p-4 ${seasonData.color}`}
          >
            <div className="text-center space-y-2">
              {seasonData.icon}
              <div className="font-semibold">{seasonData.name}</div>
              <div className="text-sm text-gray-600">{seasonData.pinyin}</div>
            </div>
          </Button>
        ))}
      </div>

      <Card className={`${season.color} border-2`}>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            {season.icon}
            <div>
              <CardTitle className="text-3xl font-bold text-red-600">{season.name}</CardTitle>
              <div className="flex items-center gap-2 justify-center">
                <span className="text-lg text-gray-600">{season.pinyin}</span>
                <Button variant="ghost" size="sm" onClick={handlePlaySeason} disabled={isPlaying} aria-label="Play season">
                  <Volume2 className={`h-4 w-4 ${currentlyPlaying === season.name ? "text-blue-600" : ""}`} />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center mb-4">主要农事活动</h3>
            {season.activities.map((activity, index) => (
              <Card key={index} className="bg-white/80">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-bold text-red-600">{activity.chinese}</span>
                        <Button variant="ghost" size="sm" onClick={() => handlePlayActivity(activity)} disabled={isPlaying} aria-label="Play activity">
                          <Volume2 className={`h-4 w-4 ${currentlyPlaying === activity.chinese ? "text-blue-600" : ""}`} />
                        </Button>
                      </div>
                      <div className="text-gray-600 mb-1">{activity.pinyin}</div>
                      <div className="text-sm text-gray-800 mb-2">{activity.english}</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{activity.description}</span>
                      <Button variant="ghost" size="sm" onClick={() => handlePlayDescription(activity.description)} disabled={isPlaying} aria-label="Play description">
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
