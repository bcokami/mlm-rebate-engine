/**
 * Service Worker for MLM Rebate Engine
 * 
 * This service worker provides:
 * 1. Offline support
 * 2. Caching of static assets
 * 3. Caching of API responses
 * 4. Background sync for offline operations
 */

// Cache names
const STATIC_CACHE_NAME = 'mlm-static-v1';
const DYNAMIC_CACHE_NAME = 'mlm-dynamic-v1';
const API_CACHE_NAME = 'mlm-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/images/logo.png',
  '/images/product-placeholder.jpg',
  '/images/20250503.svg',
  '/workers/calculation-worker.js'
];

// API routes to cache
const API_ROUTES = [
  '/api/products',
  '/api/ranks'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Successfully installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME
            ) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    // For API routes that should be cached
    if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
      event.respondWith(
        cacheFirstWithRefresh(event.request, API_CACHE_NAME)
      );
    } else {
      // For other API routes, use network first with cache fallback
      event.respondWith(
        networkFirstWithCache(event.request, API_CACHE_NAME)
      );
    }
    return;
  }
  
  // Handle static assets
  if (
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/workers/') ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request)
            .then((fetchResponse) => {
              return caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, fetchResponse.clone());
                  return fetchResponse;
                });
            });
        })
    );
    return;
  }
  
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      networkFirstWithCache(event.request, DYNAMIC_CACHE_NAME)
    );
    return;
  }
  
  // Default strategy for other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request)
          .then((fetchResponse) => {
            return caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                // Only cache successful responses
                if (fetchResponse.ok) {
                  cache.put(event.request, fetchResponse.clone());
                }
                return fetchResponse;
              });
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch error:', error);
            // Return a fallback response for HTML pages
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            return new Response('Network error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
          });
      })
  );
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-purchases') {
    event.waitUntil(syncPurchases());
  } else if (event.tag === 'sync-profile-updates') {
    event.waitUntil(syncProfileUpdates());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/images/logo.png',
    badge: '/images/badge.png',
    data: {
      url: data.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Helper function: Cache-first with network refresh
function cacheFirstWithRefresh(request, cacheName) {
  return caches.open(cacheName)
    .then((cache) => {
      return cache.match(request)
        .then((cacheResponse) => {
          // Clone the request because it's a stream that can only be consumed once
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            })
            .catch(() => {
              console.log('[Service Worker] Fetch failed, returning cached response');
              return cacheResponse;
            });
          
          // Return the cached response immediately, but update the cache in the background
          return cacheResponse || fetchPromise;
        });
    });
}

// Helper function: Network-first with cache fallback
function networkFirstWithCache(request, cacheName) {
  return fetch(request)
    .then((networkResponse) => {
      // Cache the network response
      caches.open(cacheName)
        .then((cache) => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
        });
      
      return networkResponse;
    })
    .catch(() => {
      // If network fails, try the cache
      return caches.match(request)
        .then((cacheResponse) => {
          return cacheResponse || caches.match('/offline.html');
        });
    });
}

// Helper function: Sync purchases from IndexedDB
async function syncPurchases() {
  // Implementation would depend on your IndexedDB structure
  console.log('[Service Worker] Syncing purchases');
  
  // This is a placeholder for the actual implementation
  return Promise.resolve();
}

// Helper function: Sync profile updates from IndexedDB
async function syncProfileUpdates() {
  // Implementation would depend on your IndexedDB structure
  console.log('[Service Worker] Syncing profile updates');
  
  // This is a placeholder for the actual implementation
  return Promise.resolve();
}
