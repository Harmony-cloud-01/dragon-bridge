"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Msg = { role: "user" | "assistant"; text: string }

export function AiTeacher() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "你好！我是你的中文老师。我们从问候开始吧。" },
  ])
  const [text, setText] = useState("")
  const endRef = useRef<HTMLDivElement | null>(null)

  const send = async () => {
    if (!text.trim()) return
    const user: Msg = { role: "user", text: text.trim() }
    setMessages((m) => [...m, user])
    setText("")
    // Placeholder response — replace with Ollama/OpenAI call
    const suggestion = user.text.includes("多少钱") ? "可以说：这个多少钱？" : "很好！试着用更简单的短句。"
    const assistant: Msg = { role: "assistant", text: suggestion }
    setTimeout(() => setMessages((m) => [...m, assistant]), 400)
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Teacher (offline demo)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-64 overflow-auto border rounded p-2 bg-white">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "assistant" ? "text-stone-800" : "text-emerald-700"}>
              <span className="font-semibold mr-2">{m.role === "assistant" ? "老师" : "你"}:</span>
              <span>{m.text}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="输入短句，例如：这个多少钱？" />
          <Button onClick={send}>Send</Button>
        </div>
        <p className="text-xs text-stone-500">
          Tip: This demo is local only. To enable a real model (e.g., Ollama), wire your endpoint here and stream assistant replies.
        </p>
      </CardContent>
    </Card>
  )
}

