const CACHE_NAME = "dragon-bridge-pwa-v2"
const OFFLINE_URL = "./offline"
const PRECACHE = [
  "./",
  "./offline",
  "./manifest.webmanifest",
  "./lessons.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key)
        })
      )
    ).then(() => self.clients.claim())
  )
})

// Network-first for navigations (pages) with offline fallback
async function handleNavigate(request) {
  try {
    const fresh = await fetch(request)
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, fresh.clone())
    return fresh
  } catch {
    const cache = await caches.open(CACHE_NAME)
    const cachedExact = await cache.match(request)
    if (cachedExact) return cachedExact
    const appShell = await cache.match("./")
    if (appShell) return appShell
    return cache.match(OFFLINE_URL)
  }
}

// Stale-while-revalidate for other GET requests
async function handleAsset(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)
  return cached || fetchPromise
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request))
  } else {
    event.respondWith(handleAsset(request))
  }
})

// Notifications
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" })
      if (allClients && allClients.length > 0) {
        const client = allClients[0]
        client.focus()
        client.postMessage({ type: "open", url: "./" })
      } else {
        await self.clients.openWindow("./")
      }
    })()
  )
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "show-reminder") {
    self.registration.showNotification("Time to practice Mandarin", {
      body: "Open Dragon Bridge and review a few words.",
      tag: "dragon-bridge-daily",
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
    })
  }
})
