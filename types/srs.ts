export type SrsItemType = "word" | "phrase" | "character"
export type SrsGrade = "again" | "hard" | "good" | "easy"

export interface SrsItem {
  key: string // unique key (e.g., word:玉米)
  text: string // Chinese text for playback
  type: SrsItemType
  box: number // 1..5
  due: number // timestamp ms
  addedAt: number
  history: { t: number; grade: SrsGrade }[]
}

