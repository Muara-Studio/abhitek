// ABHITEK push service worker — shows Web Push notifications (SRS NOT-7) and opens the linked screen.
// Deliberately no caching/offline logic: field offline work lives in the native app.
// Paths resolve against the worker's scope, so the app also works below a base path (GitHub Pages: /abhitek/).
const at = (p) => new URL(String(p).replace(/^\//, ''), self.registration.scope).href
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { title: 'ABHITEK', body: event.data && event.data.text() } }
  event.waitUntil(self.registration.showNotification(data.title || 'ABHITEK', {
    body: data.body || '', icon: at('favicon.svg'), badge: at('favicon.svg'), tag: data.tag, data: { url: at(data.url || 'notifikasi') },
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
