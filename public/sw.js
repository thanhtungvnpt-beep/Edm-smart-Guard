/**
 * EDM SmartGuard SCADA Service Worker
 * Provides offline caching for device telemetry states, technical documents,
 * AI diagnosis playbooks, and critical factory operational data.
 */

const CACHE_NAME = 'edm-smartguard-core-v1';
const DATA_CACHE_NAME = 'edm-smartguard-data-v1';

// Static assets to precache for offline shell
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
];

// Critical API endpoints to cache for offline diagnostic availability
const CACHEABLE_API_ROUTES = [
  '/api/devices',
  '/api/documents',
  '/api/learnings',
  '/api/stats',
  '/api/technicians',
  '/api/notifications',
];

// 1. INSTALL LIFECYCLE
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE LIFECYCLE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. FETCH INTERCEPTION (Network-First with Cache Fallback for APIs, Stale-While-Revalidate for UI assets)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST for triggering alarms or submitting diagnoses)
  if (request.method !== 'GET') {
    return;
  }

  // A. API ENDPOINTS CACHING STRATEGY: Network First -> Cache Fallback -> Offline Mock
  const isApiRequest = url.pathname.startsWith('/api/');
  if (isApiRequest) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If valid response, clone and cache in DATA_CACHE_NAME
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed (factory floor WiFi dead zone or intermittent disconnect)
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            // Append header to inform app that this is cached offline data
            const headers = new Headers(cachedResponse.headers);
            headers.set('X-SmartGuard-Offline', 'true');
            return new Response(cachedResponse.body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: headers,
            });
          }

          // Fallback minimal JSON response if never cached before
          return new Response(
            JSON.stringify({
              success: false,
              offline: true,
              message: 'Thiết bị đang ngoại tuyến. Dữ liệu chưa có sẵn trong bộ nhớ đệm.',
              data: [],
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'X-SmartGuard-Offline': 'true',
              },
            }
          );
        })
    );
    return;
  }

  // B. NAVIGATION REQUESTS (SPA Shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedIndex = await caches.match('/index.html');
        return cachedIndex || caches.match('/');
      })
    );
    return;
  }

  // C. STATIC ASSETS & FONTS (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. CLIENT MESSAGING FOR PROACTIVE STATE CACHING
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  // Client proactively caches state snapshot (devices, documents, telemetry)
  if (type === 'CACHE_SNAPSHOT') {
    caches.open(DATA_CACHE_NAME).then((cache) => {
      const now = new Date().toISOString();

      if (payload.devices) {
        const devResponse = new Response(
          JSON.stringify({
            success: true,
            cachedAt: now,
            data: payload.devices,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
        cache.put('/api/devices', devResponse);
      }

      if (payload.documents) {
        const docResponse = new Response(
          JSON.stringify({
            success: true,
            cachedAt: now,
            data: payload.documents,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
        cache.put('/api/documents', docResponse);
      }

      if (payload.learnings) {
        const learnResponse = new Response(
          JSON.stringify({
            success: true,
            cachedAt: now,
            data: payload.learnings,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
        cache.put('/api/learnings', learnResponse);
      }
    });

    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true, timestamp: Date.now() });
    }
  }

  // Clear cache if requested
  if (type === 'CLEAR_CACHE') {
    caches.delete(DATA_CACHE_NAME).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ cleared: true });
      }
    });
  }
});
