// Gym Log service worker: app shell available offline, always fresh when online.
const VERSION = 'dev'; // replaced with the commit SHA by the deploy workflow
const SHELL = `gymlog-shell-${VERSION}`;
const CDN = 'gymlog-cdn-v1';
const SHELL_FILES = ['./', './index.html', './css/app.css', './js/app.js', './js/store.js', './js/config.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('gymlog-shell-') && k !== SHELL).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in')) return; // data + photos: never cached here

  if (url.origin === self.location.origin) {
    // network first so new deploys show up immediately; cache is the offline fallback
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
    return;
  }
  if (/(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) {
    // versioned libraries and fonts: cache first
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CDN).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
