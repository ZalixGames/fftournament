// 1. کیش کا نام تبدیل کریں (سب سے اہم تبدیلی)
const CACHE_NAME = 'gaming-tournament-cache-v2'; // ورژن نمبر v1 سے v2 کر دیا گیا ہے

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
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        // 2. نئے سروس ورکر کو فوراً ایکٹیویٹ کریں
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache during install:', error);
      })
  );
});

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
    }).then(() => {
        // 3. کھلے ہوئے تمام ٹیبز کا کنٹرول سنبھالیں
        return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Network First, then Cache strategy for better updates
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // اگر نیٹ ورک سے جواب مل جاتا ہے تو اسے استعمال کریں اور کیش کو بھی اپ ڈیٹ کر دیں
        if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
        }
        return networkResponse;
      })
      .catch(() => {
        // اگر نیٹ ورک فیل ہو جائے تو کیش سے جواب دکھائیں
        return caches.match(event.request)
          .then(cachedResponse => {
            return cachedResponse || caches.match('index.html');
          });
      })
  );
});
