// 구로 점심지도 서비스워커 v4: 페이지는 항상 최신 우선, 느리거나 오프라인이면 저장본
const VER = 'v4';
const SHELL = 'gl-shell-' + VER, IMG = 'gl-img-' + VER;
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !k.endsWith(VER)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin && (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/'))) {
    e.respondWith((async () => {
      const cache = await caches.open(SHELL); const key = url.origin + url.pathname;
      const net = fetch(new Request(key, { cache: 'no-cache', credentials: 'same-origin' })).then(res => { if (res && res.ok) cache.put(key, res.clone()); return res; });
      const timeout = new Promise(r => setTimeout(() => r(null), 2500));
      try { const first = await Promise.race([net, timeout]); if (first) return first; } catch (err) {}
      const cached = await cache.match(key); if (cached) return cached;
      try { return await net; } catch (err) { return new Response('오프라인이에요. 네트워크 연결 후 다시 열어주세요.', { headers: { 'content-type': 'text/plain; charset=utf-8' } }); }
    })());
    return;
  }
  if (/t1\.daumcdn\.net|kakaocdn\.net|pstatic\.net|cdn\.jsdelivr\.net|unpkg\.com|tile\.openstreetmap\.org/.test(url.host)) {
    e.respondWith(caches.open(IMG).then(async cache => {
      const hit = await cache.match(req); if (hit) return hit;
      try { const res = await fetch(req); if (res && (res.ok || res.type === 'opaque')) { cache.put(req, res.clone()); cache.keys().then(ks => { if (ks.length > 600) ks.slice(0, ks.length - 600).forEach(k => cache.delete(k)); }); } return res; } catch (err) { return hit || Response.error(); }
    }));
  }
});
