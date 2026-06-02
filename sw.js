const CACHE = 'decourban-v7';
const ASSETS = [
  '/',
  '/index.html',
  '/coleccion.html',
  '/producto.html',
  '/styles.css',
  '/cortinas.html',
  '/nosotros.html',
  '/contacto.html',
  '/privacidad.html',
  '/404.html',
  '/gracias.html',
  '/favicon.svg',
  '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/404.html'));
      return cached || network;
    })
  );
});
