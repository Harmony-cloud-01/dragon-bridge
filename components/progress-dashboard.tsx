"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProgress } from "@/hooks/use-progress"

export function ProgressDashboard() {
  const { wordsLearned, accuracy, streak, level } = useProgress()
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
          <CardTitle>Level</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl">{level}</CardContent>
      </Card>
    </div>
  )
}

