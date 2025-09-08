"use client"
// Lightweight debounce to avoid pulling lodash-es for a single helper
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 500) {
  let t: any
  function debounced(this: any, ...args: any[]) {
    clearTimeout(t)
    t = setTimeout(() => fn.apply(this, args), wait)
  }
  ;(debounced as any).cancel = () => clearTimeout(t)
  return debounced as T & { cancel: () => void }
}
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react"
import { useToast } from "@/hooks/use-toast"
import { logEvent } from "@/utils/activity-log"
import { scopedKey } from "@/utils/profile-storage"
import { isOffline } from "@/utils/offline"
import { findAudioFor, preloadLessons } from "@/utils/lessons"
import { getPreferLocalAudio } from "@/stores/settings"
import { analyzeTones } from "@/lib/tones"

export interface DialectInfo {
  name: string
  code: string
  region: string
  description: string
  available: boolean
}

const supportedDialects: DialectInfo[] = [
  { name: "普通话", code: "zh-CN", region: "Standard", description: "Standard Mandarin", available: true },
  { name: "东北话", code: "zh-CN-northeast", region: "Northeast", description: "Northeastern dialect", available: true },
  { name: "四川话", code: "zh-CN-sichuan", region: "Sichuan", description: "Sichuan dialect", available: true },
  { name: "河南话", code: "zh-CN-henan", region: "Henan", description: "Henan dialect", available: true },
  { name: "山东话", code: "zh-CN-shandong", region: "Shandong", description: "Shandong dialect", available: true },
  { name: "陕西话", code: "zh-CN-shaanxi", region: "Shaanxi", description: "Shaanxi dialect", available: true },
  // Extra (Phase 5)
  { name: "山西话", code: "zh-CN-shanxi", region: "Shanxi", description: "Shanxi dialect", available: true },
  { name: "河北话", code: "zh-CN-hebei", region: "Hebei", description: "Hebei dialect", available: true },
  { name: "安徽话", code: "zh-CN-anhui", region: "Anhui", description: "Anhui dialect", available: true },
  { name: "江西话", code: "zh-CN-jiangxi", region: "Jiangxi", description: "Jiangxi dialect", available: true },
  { name: "湖南话", code: "zh-CN-hunan", region: "Hunan", description: "Hunan dialect", available: true },
  { name: "湖北话", code: "zh-CN-hubei", region: "Hubei", description: "Hubei dialect", available: true },
  // Minority / regional extensions
  { name: "科尔沁蒙古语", code: "mn-Khorchin", region: "内蒙古东部", description: "Khorchin Mongolian", available: true },
  { name: "卫拉特蒙古语", code: "mn-Oirat", region: "新疆西部", description: "Oirat Mongolian", available: true },
  { name: "布里亚特蒙古语", code: "mn-Buryat", region: "东北(巴尔嘎)", description: "Buryat Mongolian", available: true },
  { name: "保安(东乡)语", code: "mn-Dongxiang", region: "甘肃/青海", description: "Dongxiang / Santa", available: true },
  { name: "土族(蒙古尔)语", code: "mn-Monguor", region: "青海互助/民和", description: "Monguor (Tu)", available: true },
  { name: "壮语(混合)", code: "za-Zhuang", region: "广西/贵州", description: "Zhuang–Mandarin code-switch", available: true },
  { name: "彝汉混合", code: "ii-Yi", region: "云南", description: "Yi–Mandarin mixed speech", available: true },
  { name: "满式东北话", code: "mnc-Manchu", region: "黑龙江", description: "Manchu-influenced NE Mandarin", available: true },
]

const PREFERRED_VOICE_PATTERNS: Record<string, string[]> = {
  "zh-CN": ["Ting-Ting", "Tingting", "Mei-Jia", "Liang", "Zhiwei", "Chinese"],
  "zh-CN-northeast": ["Chinese", "Mandarin", "zh-CN", "Dongbei"],
  "zh-CN-sichuan": ["Chinese", "Mandarin", "zh-CN", "Sichuan"],
  "zh-CN-henan": ["Chinese", "Mandarin", "zh-CN", "Henan"],
  "zh-CN-shandong": ["Chinese", "Mandarin", "zh-CN", "Shandong"],
  "zh-CN-shaanxi": ["Chinese", "Mandarin", "zh-CN", "Shaanxi"],
  "zh-CN-shanxi": ["Chinese", "Mandarin", "zh-CN", "Shanxi"],
  "zh-CN-hebei": ["Chinese", "Mandarin", "zh-CN", "Hebei"],
  "zh-CN-anhui": ["Chinese", "Mandarin", "zh-CN", "Anhui"],
  "zh-CN-jiangxi": ["Chinese", "Mandarin", "zh-CN", "Jiangxi"],
  "zh-CN-hunan": ["Chinese", "Mandarin", "zh-CN", "Hunan"],
  "zh-CN-hubei": ["Chinese", "Mandarin", "zh-CN", "Hubei"],
  // Fallback patterns for minority / regional codes — map to Mandarin voices
  "mn-Khorchin": ["Chinese", "Mandarin", "zh-CN", "Inner Mongolia", "Nei Mongol", "Khorchin"],
  "mn-Oirat": ["Chinese", "Mandarin", "zh-CN", "Xinjiang", "Oirat"],
  "mn-Buryat": ["Chinese", "Mandarin", "zh-CN", "Northeast", "Buryat"],
  "mn-Dongxiang": ["Chinese", "Mandarin", "zh-CN", "Gansu", "Qinghai", "Dongxiang", "Santa"],
  "mn-Monguor": ["Chinese", "Mandarin", "zh-CN", "Qinghai", "Monguor", "Tu"],
  "za-Zhuang": ["Chinese", "Mandarin", "zh-CN", "Guangxi", "Zhuang"],
  "ii-Yi": ["Chinese", "Mandarin", "zh-CN", "Yunnan", "Yi"],
  "mnc-Manchu": ["Chinese", "Mandarin", "zh-CN", "Heilongjiang", "Manchu"],
}

export interface DialectContextType {
  playPronunciation: (text: string, dialectCode?: string) => Promise<void>
  playBothDialects: (text: string, primaryDialect: string) => Promise<void>
  playWithToneDisplay: (text: string, dialectCode?: string) => Promise<void>
  stopAudio: () => void
  isPlaying: boolean
  currentlyPlaying: string | null
  currentDialect: string | null
  playbackRate: number
  setPlaybackRate: (rate: number) => void
  selectedDialects: string[]
  setSelectedDialects: (dialects: string[]) => void
  preferredVoiceName: string | null
  setPreferredVoiceName: (name: string | null) => void
  speechSupported: boolean
  voices: SpeechSynthesisVoice[]
  hasChineseVoice: boolean
  supportedDialects: DialectInfo[]
}

const DialectContext = createContext<DialectContextType | undefined>(undefined)

interface DialectProviderProps {
  children: React.ReactNode
}

const BASE_SELECTED_DIALECTS = "dialect.v2.selectedDialects"
const BASE_PLAYBACK_RATE = "dialect.v2.playbackRate"
const BASE_PREFERRED_VOICE = "dialect.v2.preferredVoice"

export function DialectProvider({ children }: DialectProviderProps) {
  const { toast } = useToast()

  const [speechSupported, setSpeechSupported] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [currentDialect, setCurrentDialect] = useState<string | null>(null)
  const [playbackRate, setPlaybackRate] = useState(0.8)
  const [selectedDialects, setSelectedDialects] = useState<string[]>(["zh-CN", "zh-CN-northeast"])
  const [preferredVoiceName, setPreferredVoiceName] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const supported = typeof window !== "undefined" && "speechSynthesis" in window
    setSpeechSupported(supported)
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent))
    // Warm lessons cache for offline mapping
    preloadLessons()
  }, [])

  useEffect(() => {
    if (!speechSupported) return
    const loadVoices = debounce(() => {
      const list = speechSynthesis.getVoices()
      if (list?.length) setVoices(list)
    }, 500)
    loadVoices()
    speechSynthesis.addEventListener("voiceschanged", loadVoices)
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices)
      loadVoices.cancel()
    }
  }, [speechSupported])

  const hydratePrefs = useCallback(() => {
    if (typeof window === "undefined") return
    const load = <T,>(key: string, fallback: T, validate: (v: any) => boolean): T => {
      try {
        const item = localStorage.getItem(scopedKey(key))
        if (item) {
          const parsed = JSON.parse(item)
          if (validate(parsed)) return parsed
        }
      } catch {}
      return fallback
    }
    setSelectedDialects(load(BASE_SELECTED_DIALECTS, ["zh-CN", "zh-CN-northeast"], Array.isArray))
    setPlaybackRate(load(BASE_PLAYBACK_RATE, 0.8, (v) => typeof v === "number"))
    setPreferredVoiceName(load(BASE_PREFERRED_VOICE, null, (v) => typeof v === "string" || v === null))
  }, [])

  useEffect(() => {
    hydratePrefs()
    const onProfileChange = () => hydratePrefs()
    window.addEventListener("profile:changed", onProfileChange)
    return () => window.removeEventListener("profile:changed", onProfileChange)
  }, [hydratePrefs])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(scopedKey(BASE_SELECTED_DIALECTS), JSON.stringify(selectedDialects))
  }, [selectedDialects])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(scopedKey(BASE_PLAYBACK_RATE), String(playbackRate))
  }, [playbackRate])

  useEffect(() => {
    if (typeof window === "undefined") return
    preferredVoiceName
      ? localStorage.setItem(scopedKey(BASE_PREFERRED_VOICE), preferredVoiceName)
      : localStorage.removeItem(scopedKey(BASE_PREFERRED_VOICE))
  }, [preferredVoiceName])

  const stopAudio = useCallback(() => {
    speechSynthesis.cancel()
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current.currentTime = 0
      audioElRef.current = null
    }
    setIsPlaying(false)
    setCurrentlyPlaying(null)
    setCurrentDialect(null)
    utteranceRef.current = null
  }, [])

  const findBestVoice = useCallback(
    (dialectCode: string) => {
      if (!speechSupported) return undefined
      if (preferredVoiceName) {
        const byName = voices.find((v) => v.name === preferredVoiceName)
        if (byName) return byName
      }
      const patterns = [
        ...(PREFERRED_VOICE_PATTERNS[dialectCode] || []),
        ...(dialectCode !== "zh-CN" ? PREFERRED_VOICE_PATTERNS["zh-CN"] : []),
        "Chinese",
        "Mandarin",
      ]
      for (const p of patterns) {
        const candidate = voices.find(
          (v) =>
            v.lang.toLowerCase().includes(dialectCode.toLowerCase()) ||
            v.name.toLowerCase().includes(p.toLowerCase()) ||
            v.lang.toLowerCase().includes("zh")
        )
        if (candidate) return candidate
      }
      return voices.find((v) => v.default) || voices[0]
    },
    [voices, speechSupported, preferredVoiceName]
  )

  const getBakedAudioPath = useCallback((text: string, dialectCode: string) => {
    return `/audio/${dialectCode}/${encodeURIComponent(text)}.mp3`
  }, [])

  const playWithAudioTag = useCallback(
    async (text: string, dialectCode: string) => {
      const src = getBakedAudioPath(text, dialectCode)
      stopAudio()
      const audio = new Audio(src)
      audioElRef.current = audio
      audio.onerror = () => {
        stopAudio()
        toast({ title: "Audio unavailable", description: "No recording available for this phrase" })
      }
      audio.onended = () => stopAudio()
      setIsPlaying(true)
      setCurrentlyPlaying(text)
      setCurrentDialect(dialectCode)
      logEvent({ type: "audio.play", text, dialect: dialectCode, t: Date.now() })
      try {
        await audio.play()
        try { window.dispatchEvent(new CustomEvent("tone:audio", { detail: { text, dialectCode, element: audio } })) } catch {}
      } catch (err) {
        stopAudio()
        if (isMobile) {
          toast({ title: "Tap to play", description: "Mobile requires direct interaction" })
        }
      }
    },
    [getBakedAudioPath, isMobile, stopAudio, toast]
  )

  const playPronunciation = useCallback(
    async (text: string, dialectCode = "zh-CN") => {
      if (isMobile) {
        toast({ title: "Tap speaker icon", description: "Mobile requires direct interaction" })
        return
      }
      stopAudio()
      // Prefer baked audio when offline or when user opted to prefer local audio
      if (isOffline()) {
        const url = await findAudioFor(text, dialectCode)
        if (url) {
          // temporarily override path-based player to use explicit URL
          stopAudio()
          const audio = new Audio(url)
          audioElRef.current = audio
          audio.onerror = () => {
            stopAudio()
            toast({ title: "Audio unavailable", description: "No recording available for this phrase" })
          }
          audio.onended = () => stopAudio()
          setIsPlaying(true)
          setCurrentlyPlaying(text)
          setCurrentDialect(dialectCode)
          logEvent({ type: "audio.play", text, dialect: dialectCode, t: Date.now() })
          try { await audio.play(); try { window.dispatchEvent(new CustomEvent("tone:audio", { detail: { text, dialectCode, element: audio } })) } catch {} } catch { stopAudio() }
          return
        } else {
          toast({ title: "Offline", description: "Audio not cached for this phrase" })
          return
        }
      } else if (getPreferLocalAudio()) {
        const url = await findAudioFor(text, dialectCode)
        if (url) {
          stopAudio()
          const audio = new Audio(url)
          audioElRef.current = audio
          audio.onerror = () => {
            stopAudio()
            toast({ title: "Audio unavailable", description: "No recording available for this phrase" })
          }
          audio.onended = () => stopAudio()
          setIsPlaying(true)
          setCurrentlyPlaying(text)
          setCurrentDialect(dialectCode)
          logEvent({ type: "audio.play", text, dialect: dialectCode, t: Date.now() })
          try { await audio.play(); try { window.dispatchEvent(new CustomEvent("tone:audio", { detail: { text, dialectCode, element: audio } })) } catch {} } catch { stopAudio() }
          return
        }
      }
      if (!speechSupported) return playWithAudioTag(text, dialectCode)
      setIsPlaying(true)
      setCurrentlyPlaying(text)
      setCurrentDialect(dialectCode)
      const utterance = new SpeechSynthesisUtterance(text)
      utteranceRef.current = utterance
      utterance.lang = dialectCode
      utterance.rate = playbackRate
      utterance.pitch = dialectCode.includes("northeast") ? 1.1 : 1.0
      const voice = findBestVoice(dialectCode)
      if (voice) utterance.voice = voice
      utterance.onend = () => stopAudio()
      utterance.onerror = () => {
        stopAudio()
        playWithAudioTag(text, dialectCode)
      }
      logEvent({ type: "audio.play", text, dialect: dialectCode, t: Date.now() })
      speechSynthesis.speak(utterance)
    },
    [findBestVoice, isMobile, playbackRate, playWithAudioTag, speechSupported, stopAudio, toast]
  )

  const playBothDialects = useCallback(
    async (text: string, primaryDialect: string) => {
      await playPronunciation(text, "zh-CN")
      const waitForEnd = () =>
        new Promise<void>((resolve) => {
          const current = utteranceRef.current
          if (!current) return resolve()
          
const prevOnEnd = current.onend
current.onend = function(e: SpeechSynthesisEvent) {
  prevOnEnd?.call(this, e)
  resolve()
}

const prevOnErr = current.onerror
current.onerror = function(e: SpeechSynthesisErrorEvent) {
  prevOnErr?.call(this, e)
  resolve()
}

        })
      await waitForEnd()
      if (primaryDialect !== "zh-CN") {
        await playPronunciation(text, primaryDialect)
      }
    },
    [playPronunciation]
  )

  const playWithToneDisplay = useCallback(
    async (text: string, dialectCode = "zh-CN") => {
      // Start analysis first, then play, then emit results
      const analysisPromise = analyzeTones(text).catch(() => null)
      await playPronunciation(text, dialectCode)
      const analysis = await analysisPromise
      logEvent({ type: "tone.analysis", text, dialect: dialectCode, t: Date.now() })
      try {
        if (analysis) {
          window.dispatchEvent(new CustomEvent("tone:analysis", { detail: { text, dialectCode, analysis } }))
        }
      } catch {}
    },
    [playPronunciation]
  )

  const contextValue = useMemo(
    () => ({
      playPronunciation,
      playBothDialects,
      playWithToneDisplay,
      stopAudio,
      isPlaying,
      currentlyPlaying,
      currentDialect,
      playbackRate,
      setPlaybackRate,
      supportedDialects,
      selectedDialects,
      setSelectedDialects,
      preferredVoiceName,
      setPreferredVoiceName,
      speechSupported,
      voices,
      hasChineseVoice: voices.some((v) => v.lang.toLowerCase().includes("zh")),
    }),
    [
      playPronunciation,
      playBothDialects,
      playWithToneDisplay,
      stopAudio,
      isPlaying,
      currentlyPlaying,
      currentDialect,
      playbackRate,
      selectedDialects,
      preferredVoiceName,
      speechSupported,
      voices,
    ]
  )

  return <DialectContext.Provider value={contextValue}>{children}</DialectContext.Provider>
}

export function useDialect() {
  const context = useContext(DialectContext);
  if (!context) {
    throw new Error("useDialect must be used within a DialectProvider");
  }
  return context
}

export { DialectContext };
