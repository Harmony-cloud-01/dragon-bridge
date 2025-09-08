"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, Trophy, Target, TrendingUp } from 'lucide-react'

const weeklyProgress = [
  { day: "Mon", words: 12, characters: 8, time: 25 },
  { day: "Tue", words: 15, characters: 10, time: 30 },
  { day: "Wed", words: 8, characters: 5, time: 15 },
  { day: "Thu", words: 18, characters: 12, time: 35 },
  { day: "Fri", words: 20, characters: 15, time: 40 },
  { day: "Sat", words: 25, characters: 18, time: 45 },
  { day: "Sun", words: 22, characters: 16, time: 38 }
]

const achievements = [
  { name: "First Steps", description: "Learned your first 10 words", earned: true },
  { name: "Character Master", description: "Practiced 50 characters", earned: true },
  { name: "Streak Keeper", description: "7-day learning streak", earned: true },
  { name: "Tone Expert", description: "Perfect tone recognition", earned: false },
  { name: "Vocabulary Builder", description: "Learn 500 words", earned: false }
]

const skillLevels = [
  { skill: "Vocabulary", level: 65, total: 100 },
  { skill: "Characters", level: 45, total: 100 },
  { skill: "Pronunciation", level: 55, total: 100 },
  { skill: "Tones", level: 35, total: 100 }
]

export function ProgressTracker() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Progress</h2>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week's Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weeklyProgress.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium mb-2">{day.day}</div>
                <div className="bg-gray-100 rounded-lg p-2 space-y-1">
                  <div className="text-xs text-gray-600">Words</div>
                  <div className="font-bold text-blue-600">{day.words}</div>
                  <div className="text-xs text-gray-600">Chars</div>
                  <div className="font-bold text-green-600">{day.characters}</div>
                  <div className="text-xs text-gray-600">Min</div>
                  <div className="font-bold text-purple-600">{day.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skill Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Skill Levels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skillLevels.map((skill, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{skill.skill}</span>
                <span className="text-sm text-gray-600">
                  {skill.level}/{skill.total}
                </span>
              </div>
              <Progress value={skill.level} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  achievement.earned
                    ? "border-yellow-300 bg-yellow-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{achievement.name}</h4>
                  {achievement.earned && (
                    <Trophy className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{achievement.description}</p>
                <Badge
                  variant={achievement.earned ? "default" : "secondary"}
                  className="mt-2"
                >
                  {achievement.earned ? "Earned" : "Locked"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Learn 200 words this month</span>
              <span className="text-sm text-gray-600">156/200</span>
            </div>
            <Progress value={78} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Practice 30 minutes daily</span>
              <span className="text-sm text-gray-600">7/7 days</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Master 100 characters</span>
              <span className="text-sm text-gray-600">67/100</span>
            </div>
            <Progress value={67} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
