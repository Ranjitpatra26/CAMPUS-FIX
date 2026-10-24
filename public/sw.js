/**
 * CampusFix Safe Service Worker
 * Focus: Static assets & App Shell caching with strict security isolation.
 *
 * SECURITY GUARANTEES:
 * 1. Never caches API responses (/api/*) or AWS Lambda/DynamoDB/SES data.
 * 2. Never caches Cognito auth tokens, SSO callbacks, or user session state.
 * 3. Never caches non-GET requests.
 * 4. Automatic cache cleanup on activation to prevent stale code bundles.
 */

const CACHE_NAME = 'campusfix-shell-v1';

// Immutable core static shell assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/pwa-192.svg',
  '/pwa-512.svg',
  '/campus-landmark.svg',
  '/campusfix-login-illustration.svg',
  '/manifest.webmanifest'
];

// Helper: check if a URL is an authentication or sensitive endpoint
function isSensitiveOrApiRequest(url) {
  const path = url.pathname.toLowerCase();
  const host = url.hostname.toLowerCase();

  return (
    path.startsWith('/api/') ||
    path.includes('/oauth2/') ||
    path.includes('/cognito') ||
    path.includes('/auth') ||
    path.includes('callback') ||
    path.includes('logout') ||
    host.includes('amazoncognito.com') ||
    host.includes('amazonaws.com')
  );
}

// Install Event: pre-cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[CampusFix SW] Failed to pre-cache some static assets:', err);
      });
    })
  );
  // Do not automatically force-claim during install to let current pages finish cleanly
});

// Activate Event: clear old cache versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[CampusFix SW] Purging obsolete cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: handle requests with security isolation
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only process GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Strict Security: bypass any API or Auth requests (Network Only)
  if (isSensitiveOrApiRequest(url)) {
    return;
  }

  // 3. Navigation requests: Network-first to ensure newest HTML and routes
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // 4. Static assets (images, fonts, static icons): Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.webmanifest');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // If offline and not in cache, return undefined
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// Message Event: support manual update skip-waiting
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
