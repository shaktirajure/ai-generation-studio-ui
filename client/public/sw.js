// AI Studio Service Worker
// Provides offline support for Home and Assets pages

const CACHE_NAME = 'ai-studio-v1';
const STATIC_CACHE_NAME = 'ai-studio-static-v1';

// URLs to cache for offline support
const STATIC_ASSETS = [
  '/',
  '/assets',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle navigation requests (pages)
  if (request.mode === 'navigate' || 
      (request.method === 'GET' && request.headers.get('accept').includes('text/html'))) {
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If online, return the response and cache it
          const responseClone = response.clone();
          
          // Only cache successful responses for our app routes
          if (response.status === 200 && (url.pathname === '/' || url.pathname === '/assets')) {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          
          return response;
        })
        .catch(() => {
          // If offline, try to serve from cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // For home page requests when offline, serve the cached root
              if (url.pathname === '/' || url.pathname === '/home') {
                return caches.match('/');
              }
              
              // For assets page requests when offline, serve the cached assets page
              if (url.pathname === '/assets') {
                return caches.match('/assets');
              }
              
              // Return offline fallback page
              return new Response(
                `<!DOCTYPE html>
                <html>
                <head>
                  <title>AI Studio - Offline</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; }
                    .offline-container { max-width: 400px; margin: 0 auto; }
                    .offline-icon { font-size: 64px; margin-bottom: 20px; }
                    .offline-title { color: #333; margin-bottom: 10px; }
                    .offline-message { color: #666; line-height: 1.5; }
                  </style>
                </head>
                <body>
                  <div class="offline-container">
                    <div class="offline-icon">⚡</div>
                    <h1 class="offline-title">AI Studio</h1>
                    <p class="offline-message">
                      You're currently offline. Please check your internet connection and try again.
                    </p>
                    <p class="offline-message">
                      Some pages may be available offline if you've visited them before.
                    </p>
                  </div>
                </body>
                </html>`,
                {
                  headers: { 'Content-Type': 'text/html' },
                  status: 200
                }
              );
            });
        })
    );
    return;
  }
  
  // Handle static assets and API calls
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache API responses or non-successful responses
            if (!request.url.includes('/api/') && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            
            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed', error);
            
            // For offline API requests, return a meaningful error
            if (request.url.includes('/api/')) {
              return new Response(
                JSON.stringify({
                  error: 'offline',
                  message: 'This feature requires an internet connection'
                }),
                {
                  headers: { 'Content-Type': 'application/json' },
                  status: 503
                }
              );
            }
            
            throw error;
          });
      })
  );
});

// Handle background sync for offline actions (if needed in the future)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
});

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event);
});

// Message handling for communication with the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.payload;
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urls);
      })
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache URLs', error);
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }
});