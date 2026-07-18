const CACHE_NAME = 'soundwerk-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './data/sounds.json',
  './assets/css/app.css',
  './assets/js/core.js',
  './assets/js/app.js',
  './assets/icons/app-icon.svg',
  './assets/audio/start-gong.mp3',
  './assets/audio/attention-signal.mp3',
  './assets/audio/cue-a.mp3',
  './assets/audio/cue-b.mp3',
];

function networkFirst(request, fallback) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => caches.match(request))
    .then((response) => response || fallback || Response.error());
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const offlineFallback = event.request.mode === 'navigate' ? caches.match('./index.html') : undefined;
  event.respondWith(networkFirst(event.request, offlineFallback));
});
