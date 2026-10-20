const CACHE = 'healthyweight-v1.1.1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/calculator.js',
  './js/ai-food.js',
  './js/version.js',
  './diet-plans.json',
  './manifest.webmanifest',
  './icon.svg'
];

function isSameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      await cache.put(request, response.clone());
      return response;
    }
    const cached = await cache.match(request);
    return cached || response;
  } catch {
    const cached = await cache.match(request);
    return cached || Response.error();
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.allSettled(
        PRECACHE_ASSETS.map((asset) => cache.add(asset).catch(() => {}))
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!isSameOrigin(event.request)) return;
  event.respondWith(networkFirst(event.request));
});
