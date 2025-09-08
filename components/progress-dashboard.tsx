"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProgress } from "@/hooks/use-progress"

export function ProgressDashboard() {
  const { wordsLearned, accuracy, streak, level } = useProgress()
  const xp = wordsLearned * 10 + streak * 5 + Math.round(Number(accuracy) || 0)
  const badges: { id: string; name: string; desc: string }[] = []
  if (wordsLearned >= 50) badges.push({ id: "word50", name: "Word Explorer", desc: "Learned 50+ words" })
  if (streak >= 7) badges.push({ id: "streak7", name: "Weekly Streak", desc: "Practiced 7 days in a row" })
  if ((Number(accuracy) || 0) >= 85) badges.push({ id: "accuracy85", name: "Sharpshooter", desc: "Accuracy ≥ 85%" })
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle>Words Learned</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">{wordsLearned}</CardContent>
      </Card>
      <Card className="border-lime-200">
        <CardHeader>
          <CardTitle>Accuracy</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">{accuracy}%</CardContent>
      </Card>
      <Card className="border-rose-200">
        <CardHeader>
          <CardTitle>Streak</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">{streak} days</CardContent>
      </Card>
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Level & XP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl">{level}</div>
          <div className="text-sm text-stone-600">XP: <span className="font-mono">{xp}</span></div>
        </CardContent>
      </Card>
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <div className="text-sm text-stone-600">No badges yet. Keep practicing!</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <div key={b.id} className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  {b.name}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
