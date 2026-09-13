const CACHE = 'pyaazsure-v2.0.0';
const ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './css/style.css',
  './js/standards.js',
  './js/sensor.js',
  './js/inference.js',
  './js/data.js',
  './js/ui.js',
  './js/app.js',
  './js/pwa.js',
  './assets/onion-hero.jpeg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-192.jpeg',
  './assets/icon-512.jpeg'
];

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE)
    .then(c => c.addAll(ASSETS))
    .then(() => self.skipWaiting())
));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html') || caches.match('./offline.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(r => {
      if (r.ok && new URL(e.request.url).origin === location.origin) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return r;
    }))
  );
});
