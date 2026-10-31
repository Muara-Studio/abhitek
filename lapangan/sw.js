// ABHITEK Lapangan service worker: Web Push (SRS NOT-7) and an app shell that opens without a connection.
//
// WHY only a shell: the PWA caches just enough to start offline — the HTML shell and the hashed build files it loads.
// Offline inspections (cache + queue + sync, first-write-wins) live in the app's own IndexedDB (src/lib/fieldDb.ts,
// src/lib/outbox.ts, cleared on sign-out), never here. Never cached:
//   /v1/*    live data and writes; a stale answer would look current, a replayed write could double a record
//   /n/*     public chip verification must ask the server every time (a blocked chip must stop verifying)
//   other origins (map tiles, catalog photos, Web Push endpoints) — not ours to keep
// VERSION is replaced with a build hash by phone/vite.config.ts, so each deploy installs a fresh cache and drops the
// old one (hashed /assets files would otherwise pile up). Registered at start in production builds (src/lib/pwa.ts);
// `@/lib/push` registers the same URL on demand, which resolves to this same registration.
const VERSION = 'abhitek-shell-5c2e00dcb5cd'
// Every path is relative to the worker's scope: '/' in production, '/abhitek/lapangan/' on GitHub Pages. /v1 stays
// absolute — the API (or the demo backend) lives at the origin root whatever the app's base is.
const BASE = new URL(self.registration.scope).pathname
const at = (p) => new URL(String(p).replace(/^\//, ''), self.registration.scope).href
const SHELL = BASE
const FAVICON = `${BASE}favicon.svg`
const NAV_TIMEOUT_MS = 5000 // weak field signal: fall back to the shell instead of a long white screen

const sameOrigin = (url) => url.origin === self.location.origin
const isAsset = (url) => sameOrigin(url) && url.pathname.startsWith(`${BASE}assets/`)
const ASSET_REF = new RegExp(`(?:src|href)="(${BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}assets/[^"]+)"`, 'g')

// The shell plus every /assets file it names (entry, CSS, modulepreloads): the page that registers the worker
// loaded those before the worker existed, so they would otherwise be missing from the first offline start.
async function precache() {
  const cache = await caches.open(VERSION)
  const res = await fetch(SHELL, { cache: 'reload' })
  if (!res.ok) throw new Error(`shell ${res.status}`)
  const html = await res.clone().text()
  const assets = [...html.matchAll(ASSET_REF)].map((m) => m[1])
  await cache.put(SHELL, res)
  await cache.addAll([...new Set([FAVICON, ...assets])])
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('abhitek-shell-') && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()))
})

// The page sends the /assets files it already loaded (lazy route chunks fetched before this worker took control).
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'warm' || !Array.isArray(event.data.urls)) return
  const urls = event.data.urls.map((u) => { try { return new URL(u) } catch { return null } }).filter((u) => u && isAsset(u))
  event.waitUntil(caches.open(VERSION).then((c) => Promise.all(urls.map((u) => c.match(u.pathname, { ignoreVary: true }).then((hit) => hit || c.add(u.pathname).catch(() => {}))))))
})

async function navigate(request, url) {
  const cache = await caches.open(VERSION)
  // Only the start URL refreshes the stored shell; /n/* and deep links are served, never stored.
  const net = fetch(request).then(async (res) => { if (url.pathname === SHELL && res.ok) await cache.put(SHELL, res.clone()); return res })
  net.catch(() => {}) // a late failure after the shell was served is not an error
  try {
    const res = await Promise.race([net, new Promise((r) => setTimeout(r, NAV_TIMEOUT_MS))])
    if (res) return res
  } catch { /* offline: serve the shell */ }
  // No shell yet (first visit): keep waiting for the network, or fail as the browser would.
  return (await cache.match(SHELL)) ?? net
}

// ignoreVary: the page asks for module scripts with an Origin header (crossorigin), the precache did not, and the
// server's `Vary: Origin` would make every stored file a miss. Hashed files do not vary.
async function asset(request) {
  const cache = await caches.open(VERSION)
  const hit = await cache.match(request, { ignoreVary: true })
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok) await cache.put(request, res.clone())
  return res
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (!sameOrigin(url) || url.pathname.startsWith('/v1/')) return
  if (request.mode === 'navigate') event.respondWith(navigate(request, url))
  else if (isAsset(url)) event.respondWith(asset(request))
  else if (url.pathname === FAVICON) event.respondWith(fetch(request).catch(() => caches.match(FAVICON)))
})

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { title: 'ABHITEK', body: event.data && event.data.text() } }
  event.waitUntil(self.registration.showNotification(data.title || 'ABHITEK', {
    // PNG: Android Chrome does not draw SVG notification icons.
    body: data.body || '', icon: at('icons/icon-192.png'), badge: FAVICON, tag: data.tag, data: { url: at(data.url || 'notifikasi') },
  }))
})
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || at('notifikasi')
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
    const same = wins.find((w) => new URL(w.url).origin === self.location.origin)
    return same ? (same.navigate(url), same.focus()) : self.clients.openWindow(url)
  }))
})
