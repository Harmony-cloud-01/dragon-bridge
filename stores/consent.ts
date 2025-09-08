"use client"

import { scopedKey } from "@/utils/profile-storage"

const LS_CONSENT = "privacy.voiceConsent"

export function getConsent(): boolean {
  if (typeof window === "undefined") return false
  try {
    const v = localStorage.getItem(scopedKey(LS_CONSENT))
    return v === "true"
  } catch {
    return false
  }
}

export function setConsent(v: boolean) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(scopedKey(LS_CONSENT), String(v))
    window.dispatchEvent(new CustomEvent("consent:changed", { detail: v }))
  } catch {}
}

