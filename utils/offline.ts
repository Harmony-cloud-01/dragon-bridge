"use client"

export function isOffline(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false
  try {
    return navigator.onLine === false
  } catch {
    return false
  }
}

export function onOfflineChange(cb: (offline: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {}
  const handleOnline = () => cb(false)
  const handleOffline = () => cb(true)
  window.addEventListener("online", handleOnline)
  window.addEventListener("offline", handleOffline)
  // initial fire
  cb(isOffline())
  return () => {
    window.removeEventListener("online", handleOnline)
    window.removeEventListener("offline", handleOffline)
  }
}

