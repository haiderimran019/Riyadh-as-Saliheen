/* One-time retirement worker: replace cached app shells left by older builds. */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const appUrl = new URL(self.registration.scope)
    const appPrefix = `${appUrl.origin}${appUrl.pathname}`
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames
      .filter((name) => name.startsWith('hadith-content-') || (name.startsWith('workbox-precache-') && name.includes(appPrefix)))
      .map((name) => caches.delete(name)))

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    await self.registration.unregister()
    await Promise.all(clients.filter((client) => {
      const clientUrl = new URL(client.url)
      return clientUrl.origin === appUrl.origin && clientUrl.pathname.startsWith(appUrl.pathname)
    }).map((client) => client.navigate(client.url)))
  })())
})
