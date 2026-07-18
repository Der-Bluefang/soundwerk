const CACHE_NAME = 'soundwerk-shell-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './data/sounds.json',
  './assets/css/app.css',
  './assets/js/core.js',
  './assets/js/app.js',
  './assets/icons/app-icon.svg',
  './assets/audio/re3/re3-willkommensgong.mp3',
  './assets/audio/re3/re3-willkommen-duesseldorf.mp3',
  './assets/audio/re3/re3-willkommen-dortmund.mp3',
  './assets/audio/re3/re3-dortmund-hbf.mp3',
  './assets/audio/re3/re3-dortmund-mengede.mp3',
  './assets/audio/re3/re3-castrop-rauxel-hbf.mp3',
  './assets/audio/re3/re3-herne.mp3',
  './assets/audio/re3/re3-wanne-eickel-hbf.mp3',
  './assets/audio/re3/re3-gelsenkirchen-hbf.mp3',
  './assets/audio/re3/re3-essen-altenessen.mp3',
  './assets/audio/re3/re3-oberhausen-hbf.mp3',
  './assets/audio/re3/re3-duisburg-hbf.mp3',
  './assets/audio/re3/re3-duesseldorf-flughafen.mp3',
  './assets/audio/re3/re3-duesseldorf-hbf.mp3',
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
