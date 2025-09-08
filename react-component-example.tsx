"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Component() {
  const [count, setCount] = useState(0)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Simple Counter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-4xl font-bold">{count}</span>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => setCount(count - 1)}>
            Decrease
          </Button>
          <Button onClick={() => setCount(0)} variant="outline">
            Reset
          </Button>
          <Button onClick={() => setCount(count + 1)}>
            Increase
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
