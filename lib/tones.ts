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

// --- Basic Web Audio pitch detection (autocorrelation) and analysis for an HTMLAudioElement ---

function autocorrelate(buf: Float32Array, sampleRate: number): number {
  // Returns frequency (Hz) or -1 if no pitch
  let SIZE = buf.length
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01) return -1

  let r1 = 0, r2 = SIZE - 1, thres = 0.2
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break }
  buf = buf.slice(r1, r2)
  SIZE = buf.length

  const c = new Array(SIZE).fill(0)
  for (let i = 0; i < SIZE; i++)
    for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i]

  let d = 0; while (c[d] > c[d + 1]) d++
  let maxval = -1, maxpos = -1
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i }
  }
  if (maxpos <= 0) return -1
  return sampleRate / maxpos
}

// --- Basic Pinyin utilities ---

const TONE_MARKS: Record<string, [string, number]> = {
  // a
  "ā": ["a", 1], "á": ["a", 2], "ǎ": ["a", 3], "à": ["a", 4],
  // e
  "ē": ["e", 1], "é": ["e", 2], "ě": ["e", 3], "è": ["e", 4],
  // i
  "ī": ["i", 1], "í": ["i", 2], "ǐ": ["i", 3], "ì": ["i", 4],
  // o
  "ō": ["o", 1], "ó": ["o", 2], "ǒ": ["o", 3], "ò": ["o", 4],
  // u
  "ū": ["u", 1], "ú": ["u", 2], "ǔ": ["u", 3], "ù": ["u", 4],
  // ü
  "ǖ": ["ü", 1], "ǘ": ["ü", 2], "ǚ": ["ü", 3], "ǜ": ["ü", 4],
}

export function toneNumberFromPinyin(syllable: string): number {
  // Returns 1..4 when diacritic found, else 5 (neutral)
  for (const ch of syllable) {
    const m = TONE_MARKS[ch]
    if (m) return m[1]
  }
  // Also support numeric tone (ma1, ma2...)
  const mnum = syllable.match(/\d/)
  if (mnum) {
    const n = Number(mnum[0])
    if (n >= 1 && n <= 4) return n
    return 5
  }
  return 5
}

export function splitPinyin(pinyin: string): string[] {
  // naive split by spaces; callers can provide per-character if available
  return pinyin
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}


export async function analyzeAudioFromElement(el: HTMLMediaElement, text: string): Promise<ToneAnalysis[]> {
  const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext)
  const ctx: AudioContext = new AudioCtx()
  const source = ctx.createMediaElementSource(el)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  source.connect(analyser)
  analyser.connect(ctx.destination)

  const buf = new Float32Array(analyser.fftSize)
  const contours: number[] = []
  const energies: number[] = []

  let stopped = false
  const onEnd = () => { stopped = true }
  el.addEventListener('ended', onEnd, { once: true })

  // sample pitch every 100ms until ended or 10s max
  const start = ctx.currentTime
  while (!stopped && (ctx.currentTime - start) < 10) {
    analyser.getFloatTimeDomainData(buf)
    // energy
    let energy = 0
    for (let i = 0; i < buf.length; i++) energy += buf[i] * buf[i]
    energy = energy / buf.length
    energies.push(energy)
    const f = autocorrelate(buf, ctx.sampleRate)
    const hz = f > 0 ? f : 0
    contours.push(hz)
    await new Promise(r => setTimeout(r, 100))
  }

  try { source.disconnect(); analyser.disconnect(); ctx.close() } catch {}

  // Heuristic segmentation based on energy valleys
  const chars = text.split("")
  const n = contours.length
  const winMs = 100
  // smooth energy
  const smooth: number[] = energies.map((e, i, arr) => (e + (arr[i - 1] || e) + (arr[i + 1] || e)) / 3)
  const thresh = smooth.reduce((a, b) => a + b, 0) / Math.max(1, smooth.length) * 0.6
  const boundaries: number[] = [0]
  for (let i = 1; i < smooth.length - 1; i++) {
    if (smooth[i] < thresh && smooth[i - 1] >= thresh && boundaries.length < chars.length) {
      boundaries.push(i)
    }
  }
  if (boundaries.length < chars.length) {
    // pad evenly
    const step = Math.floor(n / chars.length)
    while (boundaries.length < chars.length) boundaries.push(boundaries[boundaries.length - 1] + step)
  }
  boundaries.push(n)

  const out: ToneAnalysis[] = []
  for (let i = 0; i < chars.length; i++) {
    const i0 = Math.max(0, Math.min(n, boundaries[i]))
    const i1 = Math.max(i0 + 1, Math.min(n, boundaries[i + 1]))
    const seg = contours.slice(i0, i1)
    const startTime = (i0 * winMs) / 1000
    const endTime = (i1 * winMs) / 1000
    out.push({ char: chars[i], pinyin: chars[i], tone: 5, startTime, endTime, pitchContour: seg })
  }
  return out
}
