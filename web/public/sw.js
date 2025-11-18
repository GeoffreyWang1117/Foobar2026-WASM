/**
 * Service Worker for Music Style Filter PWA
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'music-style-filter-v1'
const RUNTIME_CACHE = 'runtime-cache-v1'

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching assets')
      return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' })))
    }).then(() => {
      console.log('[Service Worker] Skip waiting')
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[Service Worker] Claiming clients')
      return self.clients.claim()
    })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[Service Worker] Serving from cache:', request.url)
        return cachedResponse
      }

      console.log('[Service Worker] Fetching from network:', request.url)
      return fetch(request).then((response) => {
        // Don't cache if not a success response
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        // Cache runtime assets
        caches.open(RUNTIME_CACHE).then((cache) => {
          // Only cache GET requests
          if (request.method === 'GET') {
            cache.put(request, responseToCache)
          }
        })

        return response
      }).catch((error) => {
        console.error('[Service Worker] Fetch failed:', error)

        // Return offline page if available
        return caches.match('/index.html')
      })
    })
  )
})

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      }).then(() => {
        return self.clients.matchAll()
      }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'CACHE_CLEARED' })
        })
      })
    )
  }
})
