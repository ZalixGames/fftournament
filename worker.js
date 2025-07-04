const CACHE_NAME = 'gaming-tournament-cache-v1';
const URLS_TO_CACHE = [
  '/',
  'index.html',
  'manifest.json',
  'images/icons/icon-192x192.png',
  'images/icons/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
  // Note: Firebase SDKs are loaded via type="module" and might not be cacheable this way directly.
  // The browser will handle them, but the core app shell will be offline.
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use addAll for atomic operation
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(error => {
        console.error('Failed to cache during install:', error);
      })
  );
});

// Cache and return requests - Cache First Strategy
self.addEventListener('fetch', event => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If we have a cached response, return it.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If it's not in the cache, fetch it from the network.
        return fetch(event.request)
          .then(networkResponse => {
            // Check if we received a valid response. We don't want to cache errors.
            if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
              return networkResponse;
            }

            // Clone the response because it's a stream and can only be consumed once.
            const responseToCache = networkResponse.clone();

            // Open the cache and add the new response to it.
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            // Return the network response to the browser.
            return networkResponse;
          })
          .catch(() => {
            // If the network request fails and there's nothing in the cache,
            // it's a real offline scenario. We can return a fallback page.
            // For navigation requests, the pre-cached 'index.html' is a good fallback.
            if (event.request.mode === 'navigate') {
              console.log('Fetch failed, returning index.html from cache.');
              return caches.match('index.html');
            }
            // For other assets like images, we don't have a specific fallback, so let it fail.
          });
      })
  );
});


// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
