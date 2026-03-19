self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html')
      }

      throw new Error('Request gagal dan tidak ada fallback cache')
    }),
  )
})
