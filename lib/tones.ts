export interface ToneAnalysis {
  char: string
  pinyin: string
  tone: number
  startTime: number
  endTime: number
  pitchContour: number[]
}

// Mock analyzer for demo; replace with real WebAudio/ML later
export async function analyzeTones(text: string, _audioBlob?: Blob): Promise<ToneAnalysis[]> {
  const getTone = (ch: string) => {
    const map: Record<string, number> = { "你": 3, "好": 3, "吗": 5, "我": 3, "很": 3, "高": 1 }
    return map[ch] || 5
  }
  const getPinyin = (ch: string) => {
    const map: Record<string, string> = { "你": "nǐ", "好": "hǎo", "吗": "ma", "我": "wǒ", "很": "hěn", "高": "gāo" }
    return map[ch] || ch
  }
  return text.split("").map((char, i) => {
    const tone = getTone(char)
    const base = [0.8, 1.2, 0.9, 1.1, 1.0][(tone - 1) as 0 | 1 | 2 | 3 | 4] || 1.0
    const contour = Array.from({ length: 10 }, () => base + (Math.random() * 0.1 - 0.05))
    return { char, pinyin: getPinyin(char), tone, startTime: i * 0.5, endTime: (i + 1) * 0.5, pitchContour: contour }
  })
}

