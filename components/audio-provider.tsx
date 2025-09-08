"use client"

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react"

interface AudioContextType {
  playPronunciation: (text: string, lang?: string) => Promise<void>
  isPlaying: boolean
  currentlyPlaying: string | null
  stopAudio: () => void
  setPlaybackRate: (rate: number) => void
  playbackRate: number
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

interface AudioProviderProps {
  children: ReactNode
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [playbackRate, setPlaybackRate] = useState(0.8) // Slower for learning
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const stopAudio = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }
    setIsPlaying(false)
    setCurrentlyPlaying(null)
    utteranceRef.current = null
  }, [])

  const playPronunciation = useCallback(async (text: string, lang: string = 'zh-CN') => {
    // Stop any currently playing audio
    stopAudio()

    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported')
      return
    }

    try {
      setIsPlaying(true)
      setCurrentlyPlaying(text)

      const utterance = new SpeechSynthesisUtterance(text)
      utteranceRef.current = utterance
      
      // Configure the utterance
      utterance.lang = lang
      utterance.rate = playbackRate
      utterance.pitch = 1
      utterance.volume = 1

      // Try to find a Chinese voice
      const voices = speechSynthesis.getVoices()
      const chineseVoice = voices.find(voice => 
        voice.lang.includes('zh') || 
        voice.name.toLowerCase().includes('chinese') ||
        voice.name.toLowerCase().includes('mandarin')
      )
      
      if (chineseVoice) {
        utterance.voice = chineseVoice
      }

      // Set up event listeners
      utterance.onend = () => {
        setIsPlaying(false)
        setCurrentlyPlaying(null)
        utteranceRef.current = null
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        setIsPlaying(false)
        setCurrentlyPlaying(null)
        utteranceRef.current = null
      }

      // Speak the text
      speechSynthesis.speak(utterance)

    } catch (error) {
      console.error('Error playing pronunciation:', error)
      setIsPlaying(false)
      setCurrentlyPlaying(null)
    }
  }, [playbackRate, stopAudio])

  const contextValue: AudioContextType = {
    playPronunciation,
    isPlaying,
    currentlyPlaying,
    stopAudio,
    setPlaybackRate,
    playbackRate
  }

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}
