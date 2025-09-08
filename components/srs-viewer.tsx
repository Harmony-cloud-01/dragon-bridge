"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSrs } from "@/hooks/use-srs"

function dt(ms: number) {
  try { return new Date(ms).toLocaleDateString() } catch { return String(ms) }
}

export function SrsViewer() {
  const { allItems, removeItem, gradeItem } = useSrs()
  const rows = useMemo(() => allItems.slice(0, 100), [allItems])

  return (
    <Card>
      <CardHeader>
        <CardTitle>SRS Items</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="text-sm text-stone-600">No SRS items yet.</div>
        ) : (
          <div className="max-h-64 overflow-auto text-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="text-stone-500">
                  <th className="py-1 pr-2">Key</th>
                  <th className="py-1 pr-2">Box</th>
                  <th className="py-1 pr-2">Due</th>
                  <th className="py-1 pr-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((it) => (
                  <tr key={it.key} className="border-t">
                    <td className="py-1 pr-2 font-mono whitespace-nowrap">{it.key}</td>
                    <td className="py-1 pr-2">{it.box}</td>
                    <td className="py-1 pr-2">{dt(it.due)}</td>
                    <td className="py-1 pr-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => gradeItem(it.key, 'again')}>again</Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => gradeItem(it.key, 'good')}>good</Button>
                        <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => removeItem(it.key)}>remove</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
