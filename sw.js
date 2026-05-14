/**
 * Service Worker – Rutina App
 * Estrategia: Cache-first para estáticos, Network-first para dinámicos.
 */

const CACHE_NAME = 'rutina-app-v1';
const DYNAMIC_CACHE = 'rutina-dynamic-v1';

// Recursos estáticos que se cachean en la instalación
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/css/themes.css',
  './assets/js/app.js',
  './assets/js/router.js',
  './assets/js/storage.js',
  './assets/js/utils.js',
  './assets/js/modules/gym.js',
  './assets/js/modules/meals.js',
  './assets/js/modules/sleep.js',
  './assets/js/modules/calendar.js',
  './assets/js/modules/stats.js',
  './assets/js/modules/goals.js',
  './assets/js/modules/onboarding.js',
  './assets/js/modules/notifications.js',
  './assets/js/modules/sync.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

// ---- INSTALL ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-cacheando recursos estáticos');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ---- ACTIVATE ----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== DYNAMIC_CACHE)
          .map(k => {
            console.log('[SW] Eliminando caché antigua:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ---- FETCH ----
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar peticiones HTTP/HTTPS del mismo origen o estáticos
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Estrategia Cache-first para activos locales
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // Fallback offline: devolver index.html para rutas SPA
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
    );
  }
});

// ---- PUSH NOTIFICATIONS ----
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'Rutina App', body: '¡Tienes una notificación!' };
  const options = {
    body: data.body || '',
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || './' },
    actions: data.actions || []
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Rutina App', options)
  );
});

// ---- NOTIFICATION CLICK ----
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// ---- BACKGROUND SYNC (experimental) ----
self.addEventListener('sync', event => {
  if (event.tag === 'sync-rutina-data') {
    event.waitUntil(syncDataInBackground());
  }
});

async function syncDataInBackground() {
  // La lógica de sincronización real está en sync.js (cliente)
  console.log('[SW] Background sync iniciado');
}
