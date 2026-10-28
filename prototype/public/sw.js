// NutriPlan prototype service worker.
// Network-first for pages (fresh content, offline fallback to cache),
// cache-first for static build assets and icons.
const VERSION = "nutriplan-v3"
const PRECACHE = ["/", "/home", "/plan", "/log", "/recipes", "/profile", "/welcome", "/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  const isStatic = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(?:png|svg|ico|woff2?)$/.test(url.pathname)

  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(VERSION).then((c) => c.put(request, copy))
            return res
          }),
      ),
    )
    return
  }

  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put(request, copy))
          return res
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/offline.html"))),
    )
  }
})
