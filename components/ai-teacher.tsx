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
  const [endpoint, setEndpoint] = useState<string>(process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434")
  const [model, setModel] = useState<string>(localStorage.getItem("ai.model") || "qwen2:0.5b")
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!text.trim()) return
    const user: Msg = { role: "user", text: text.trim() }
    setMessages((m) => [...m, user])
    setText("")
    // Try Ollama first; fall back to local suggestion if unavailable
    try {
      setLoading(true)
      // Pull current lesson context if available
      let context = ""
      try {
        const raw = localStorage.getItem("lessons.current")
        if (raw) {
          const l = JSON.parse(raw)
          if (l && Array.isArray(l.words)) {
            const words = l.words.slice(0, 12).map((w:any)=>w.text).join("、")
            context = `\nContext lesson: ${l.title} (words: ${words})\n`
          }
        }
      } catch {}
      const res = await fetch(`${endpoint.replace(/\/$/, "")}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: `Act as a Mandarin teacher for rural learners. Reply simply.${context}Student said: ${user.text}`,
          stream: true,
        }),
      })
      if (!res.ok || !res.body) throw new Error(String(res.status))
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accum = ""
      // Ollama streams JSON lines: {"response":"...","done":false}
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accum += chunk
        // Try to extract any "response" fields
        const parts = accum.split("\n").filter(Boolean)
        const last = parts[parts.length - 1]
        try {
          const obj = JSON.parse(last)
          if (obj?.response) {
            // push partial or accumulate
            setMessages((m) => {
              const prev = [...m]
              const lastMsg = prev[prev.length - 1]
              if (lastMsg?.role === "assistant") {
                lastMsg.text += obj.response
                return [...prev.slice(0, -1), lastMsg]
              }
              return [...prev, { role: "assistant", text: String(obj.response) }]
            })
          }
        } catch {
          // ignore partial JSON
        }
      }
    } catch (e) {
      const suggestion = user.text.includes("多少钱") ? "可以说：这个多少钱？" : "很好！试着用更简单的短句。"
      setMessages((m) => [...m, { role: "assistant", text: suggestion }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Teacher</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label htmlFor="endpoint">Endpoint:</label>
          <input id="endpoint" className="border rounded px-2 py-1" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="http://localhost:11434" />
          <label htmlFor="model">Model:</label>
          <input id="model" className="border rounded px-2 py-1" value={model} onChange={(e) => { setModel(e.target.value); localStorage.setItem("ai.model", e.target.value) }} placeholder="qwen2:0.5b" />
          {loading && <span className="text-stone-500">Generating…</span>}
        </div>
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
          Tip: Configure an Ollama endpoint (default http://localhost:11434). Responses stream into the chat. Falls back to a local tip when unreachable.
        </p>
      </CardContent>
    </Card>
  )
}
