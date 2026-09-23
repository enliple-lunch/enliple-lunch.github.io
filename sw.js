// 구로 점심지도 서비스워커
const VER = 'v3';
const SHELL = 'gl-shell-' + VER, IMG = 'gl-img-' + VER;
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !k.endsWith(VER)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 1) 같은 사이트 페이지: 캐시 먼저 보여주고 뒤에서 갱신 (stale-while-revalidate)
  if (url.origin === location.origin && (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/'))) {
    e.respondWith(caches.open(SHELL).then(async cache => {
      const key = url.origin + url.pathname; // 쿼리/해시 무시
      const cached = await cache.match(key);
      const net = fetch(new Request(key, { cache: 'no-cache', credentials: 'same-origin' })).then(async res => { if (res && res.ok) { const fresh = res.clone(); if (cached) { const [a, b] = await Promise.all([cached.clone().text(), res.clone().text()]); if (a !== b) { self.clients.matchAll({ type: 'window' }).then(cs => cs.forEach(c => c.postMessage({ type: 'new-version' }))); } } cache.put(key, fresh); } return res; }).catch(() => null);
      return cached || (await net) || new Response('오프라인이에요. 네트워크 연결 후 다시 열어주세요.', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }));
    return;
  }
  // 2) 가게 사진·폰트: 캐시 우선 (최대 400장)
  if (/t1\.daumcdn\.net|kakaocdn\.net|pstatic\.net|cdn\.jsdelivr\.net/.test(url.host)) {
    e.respondWith(caches.open(IMG).then(async cache => {
      const hit = await cache.match(req); if (hit) return hit;
      try { const res = await fetch(req); if (res && (res.ok || res.type === 'opaque')) { cache.put(req, res.clone()); cache.keys().then(ks => { if (ks.length > 400) ks.slice(0, ks.length - 400).forEach(k => cache.delete(k)); }); } return res; } catch (err) { return hit || Response.error(); }
    }));
  }
});
