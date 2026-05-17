const CACHE = 'spelling-quest-v0.1.15';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './db.js',
  './speech.js',
  './rewards.js',
  './bonus.js',
  './game.js',
  './manifest.json',
  './mobs.js',
  './fonts/PressStart2P-Regular.ttf',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
