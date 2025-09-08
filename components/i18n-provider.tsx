"use client"

import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react"
import { scopedKey } from "@/utils/profile-storage"

type Lang = "en" | "zh"

type Translations = {
  [key in Lang]: Record<string, string>
}

const translations: Translations = {
  en: {
    appName: "Dragon Bridge - Mandarin Teacher",
    appSubtitle: "Practice characters, dialects, and pronunciation",
    backHome: "Back to Home",
    wordsLearned: "Words Learned",
    accuracyRate: "Accuracy Rate",
    dayStreak: "Day Streak",
    village: "Village",
    classic: "Classic",
    villageMapTitle: "Village Learning Map",
    exploreByPlace: "Explore by place",
    tapAPlace: "Tap a place to start learning",
    navHome: "Home",
    navWords: "Words",
    navPhrases: "Phrases",
    navCalendar: "Calendar",
    navSettings: "Settings",
    placeFarmFields: "Farm Fields",
    placeMarketStreet: "Market Street",
    placeCommunityHall: "Community Hall",
    placeAlmanacKiosk: "Almanac Kiosk",
    placeAudioBooth: "Audio Booth",
    placeSettingsPavilion: "Settings Pavilion",
    learnWords: "Learn Words",
    dialectWords: "Dialect Words",
    dialectPhrases: "Dialect Phrases",
    farmCalendar: "Farm Calendar",
    audioSettings: "Audio Settings",
    dialects: "Dialects",
    descFarmFields: "Field tools, crops, daily actions",
    descMarketStreet: "Compare words across dialects",
    descCommunityHall: "Greetings and everyday talk",
    descAlmanacKiosk: "Seasonal activities & tips",
    descAudioBooth: "Speed and voice preferences",
    descSettingsPavilion: "Choose dialects to practice",
    descToneDrills: "Listen and identify tones; mimic with mic feedback",
    descReview: "Review due items with spaced repetition",
    descMarketQuest: "Practice real tasks like bargaining at the market",
    descReminders: "Get daily prompts to practice",
    descTeacherMode: "Export reports for teachers",
    english: "English",
    chinese: "中文",
    previous: "Previous",
    next: "Next",
    showAll: "Show All",
    showSelected: "Show Selected",
    playingDialect: "Playing dialect",
    practicalExample: "Practical Example",
    phrasesLower: "phrases",
    classicTitle: "Rural Mandarin Learning",
    classicSubtitle: "Rural Chinese Learning App",
    playWelcome: "Play Welcome",
    quickStart: "Quick Start",
    ruralVocabularyTitle: "Rural Practical Vocabulary",
    communityPhrasesTitle: "Community Communication Phrases",
    agriCalendarTitle: "Agricultural Calendar",
    toneGuideTitle: "Pronunciation Guide",
    vocabularyPractice: "Vocabulary Practice",
    characterPractice: "Character Practice",
    phrasePractice: "Phrase Practice",
    reviewTitle: "Spaced Repetition Review",
    reviewSubtitle: "Strengthen memory over time",
    marketQuestTitle: "Market Quest",
    remindersTitle: "Daily Reminders",
    remindersSubtitle: "Friendly nudge to practice",
    teacherModeTitle: "Teacher Mode",
    teacherModeSubtitle: "Export session reports",
    audioSettingsTitle: "Audio Settings",
    playbackSpeed: "Playback Speed",
    slow: "Slow",
    normal: "Normal",
    fast: "Fast",
    ttsNotSupported: "Text-to-Speech not supported. The app will use pre-recorded audio when available.",
    noChineseVoice: "No Chinese voice detected. The system default will be used, or pre-recorded audio when available.",
    stopAudio: "Stop Audio",
    androidTip: "For best offline voices on Android, install a Mandarin TTS voice in system settings.",
    preferredVoice: "Preferred Voice",
    voiceAvailabilityTip: "Voice availability depends on your device OS and browser.",
    dialectSettingsTitle: "Dialect Settings",
    playbackSettingsTitle: "Playback Settings",
    speed: "Speed",
    selectDialectsTitle: "Select Dialects",
    selectDialectsDesc: "Choose dialects you want to learn (multiple selection allowed)",
    testPronunciation: "Test Pronunciation",
    currentSelection: "Current Selection",
    selectedDialectsWillPlay: "Selected dialects will be played during learning",
    dialectVocabCompare: "Dialect Vocabulary Comparison",
    dialectCompare: "Dialect Comparison",
    playStdThenDialect: "Play Standard → Dialect",
    playStdThenSelectedDialects: "Play Standard → Selected Dialects",
    standardMandarin: "Standard Mandarin",
    mandarinTones: "Mandarin Tones",
    practiceExamples: "Practice Examples",
    offlineTitle: "You are offline",
    offlineDetail: "Some content may be unavailable. Previously visited pages and assets can still be viewed.",
    offlineTip: "Tip: Add this app to your home screen for a better offline experience.",
    dismiss: "Dismiss",
    chooseLanguageTitle: "Choose your language",
    chooseLanguageDesc: "Select your preferred interface language. You can change this any time in the header.",
    startLearning: "Start Learning",
  },
  zh: {
    appName: "龙桥 - 中文老师",
    appSubtitle: "练习汉字、方言和发音",
    backHome: "返回首页",
    wordsLearned: "已学单词",
    accuracyRate: "准确率",
    dayStreak: "连续天数",
    village: "村落",
    classic: "经典",
    villageMapTitle: "村落学习地图",
    exploreByPlace: "按地点探索",
    tapAPlace: "点击地点开始学习",
    navHome: "首页",
    navWords: "词汇",
    navPhrases: "短语",
    navCalendar: "日历",
    navSettings: "设置",
    placeFarmFields: "农田",
    placeMarketStreet: "集市街",
    placeCommunityHall: "活动中心",
    placeAlmanacKiosk: "黄历小亭",
    placeAudioBooth: "语音室",
    placeSettingsPavilion: "设置亭",
    learnWords: "学词汇",
    dialectWords: "方言词汇",
    dialectPhrases: "方言短语",
    farmCalendar: "农事日历",
    audioSettings: "音频设置",
    dialects: "方言",
    descFarmFields: "农具、庄稼与日常动作",
    descMarketStreet: "对比不同方言的词汇",
    descCommunityHall: "问候交流与日常用语",
    descAlmanacKiosk: "四季农事与小贴士",
    descAudioBooth: "语速和发音偏好",
    descSettingsPavilion: "选择练习的方言",
    descToneDrills: "听辨声调并用麦克风练习模仿",
    descReview: "使用间隔重复巩固记忆",
    descMarketQuest: "在集市等真实情景中完成任务",
    descReminders: "每天提醒你练习",
    descTeacherMode: "导出学习报告",
    english: "English",
    chinese: "中文",
    previous: "上一页",
    next: "下一页",
    showAll: "显示全部",
    showSelected: "显示选中",
    playingDialect: "正在播放方言",
    practicalExample: "实用例句",
    phrasesLower: "短语",
    classicTitle: "农村中文学习",
    classicSubtitle: "农村中文学习应用",
    playWelcome: "播放欢迎语",
    quickStart: "快速开始",
    ruralVocabularyTitle: "农村实用词汇",
    communityPhrasesTitle: "社区交流用语",
    agriCalendarTitle: "农事日历",
    toneGuideTitle: "发音指南",
    vocabularyPractice: "词汇练习",
    characterPractice: "汉字练习",
    phrasePractice: "短语练习",
    reviewTitle: "间隔重复复习",
    reviewSubtitle: "随时间强化记忆",
    marketQuestTitle: "集市任务",
    remindersTitle: "每日提醒",
    remindersSubtitle: "友好的练习提示",
    teacherModeTitle: "教师模式",
    teacherModeSubtitle: "导出学习报告",
    audioSettingsTitle: "音频设置",
    playbackSpeed: "播放速度",
    slow: "慢",
    normal: "正常",
    fast: "快",
    ttsNotSupported: "当前设备不支持语音合成，将使用预录音频（如有）。",
    noChineseVoice: "未检测到中文语音，将使用系统默认或预录音频。",
    stopAudio: "停止播放",
    androidTip: "为获得更好的离线发音，请在安卓系统安装中文语音包。",
    preferredVoice: "首选语音",
    voiceAvailabilityTip: "语音可用性取决于设备系统和浏览器。",
    dialectSettingsTitle: "方言设置",
    playbackSettingsTitle: "播放设置",
    speed: "速度",
    selectDialectsTitle: "选择方言",
    selectDialectsDesc: "选择你想学习的方言（可多选）",
    testPronunciation: "试听",
    currentSelection: "当前选择",
    selectedDialectsWillPlay: "学习时会播放所选方言",
    dialectVocabCompare: "方言词汇对比",
    dialectCompare: "方言对比",
    playStdThenDialect: "播放 普通话 → 方言",
    playStdThenSelectedDialects: "播放 普通话 → 已选方言",
    standardMandarin: "标准普通话",
    mandarinTones: "普通话声调",
    practiceExamples: "练习示例",
    offlineTitle: "你已离线",
    offlineDetail: "部分内容不可用。已访问的页面与资源仍可查看。",
    offlineTip: "提示：添加到主屏以获得更好的离线体验。",
    dismiss: "关闭",
    chooseLanguageTitle: "选择界面语言",
    chooseLanguageDesc: "请选择界面语言，之后可随时在顶部切换。",
    startLearning: "开始学习",
  },
}

type I18nContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)
export const LS_LANG = "ui.lang"

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("zh")

  const hydrateLang = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem(scopedKey(LS_LANG))
      if (saved === "en" || saved === "zh") setLang(saved)
      else setLang("zh")
    } catch {
      setLang("zh")
    }
  }, [])

  useEffect(() => {
    hydrateLang()
  }, [hydrateLang])

  useEffect(() => {
    const onProfileChanged = () => hydrateLang()
    window.addEventListener("profile:changed", onProfileChanged)
    return () => window.removeEventListener("profile:changed", onProfileChanged)
  }, [hydrateLang])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(scopedKey(LS_LANG), lang)
    } catch {}
  }, [lang])

  const t = (key: string) => {
    return translations[lang][key] ?? translations.en[key] ?? key
  }

  const value = useMemo(() => ({ lang, setLang, t }), [lang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider")
  return ctx
}
