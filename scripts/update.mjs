// 한신아이티타워 점심지도 - 데이터 자동 갱신 (Node 20+ / GitHub Actions)
// 실행: node scripts/update.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CEN = { lat: 37.48249743, lon: 126.89445322 }; // 한신아이티타워
const RADIUS = 520;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const hav = (lat, lon) => {
  const R = 6371000, t = Math.PI / 180;
  const dLat = (lat - CEN.lat) * t, dLon = (lon - CEN.lon) * t;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(CEN.lat * t) * Math.cos(lat * t) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const T = (ms = 8000) => AbortSignal.timeout(ms);   // 모든 요청 타임아웃
const STARTED = Date.now();
const budgetLeft = () => 18 * 60 * 1000 - (Date.now() - STARTED); // 전체 18분 예산

async function ksearch(q, page) {
  const u = `https://search.map.kakao.com/mapsearch/map.daum?callback=cb&q=${encodeURIComponent(q)}&msFlag=A&sort=0&page=${page}`;
  for (let try_ = 0; try_ < 3; try_++) {
    try {
      const r = await fetch(u, { headers: { referer: 'https://map.kakao.com/', 'user-agent': UA }, signal: T() });
      const t = await r.text();
      return JSON.parse(t.replace(/^\/\*\*\/cb\(/, '').replace(/\);?\s*$/, ''));
    } catch (e) { await sleep(600); }
  }
  return { place: [] };
}

async function kdetail(id) {
  for (let try_ = 0; try_ < 3; try_++) {
    try {
      const r = await fetch(`https://place-api.map.kakao.com/places/panel3/${id}`, {
        headers: { pf: 'web', referer: `https://place.map.kakao.com/${id}`, origin: 'https://place.map.kakao.com', 'user-agent': UA },
        signal: T()
      });
      if (!r.ok) { await sleep(400); continue; }
      return await r.json();
    } catch (e) { await sleep(600); }
  }
  return null;
}

const QUERIES = [
  '구로디지털단지 음식점', '구로디지털단지 맛집', '구로동 한식', '구로동 중식', '구로동 일식', '구로동 분식',
  '구로동 양식', '구로동 카페', '구로디지털단지 점심', '구로동 국밥', '구로동 돈까스', '구로동 김밥', '구로동 고기',
  '구로동 백반', '구로동 칼국수', '구로동 초밥', '구로동 샐러드', '구로동 햄버거', '구로동 쌀국수', '구로동 뷔페',
  '구로동 신규오픈', '구로디지털단지 새로생긴', '구로동 부대찌개', '구로동 순대국', '구로동 파스타', '구로동 덮밥',
  '한신아이티타워 식당', '구로 지타워몰 식당', '에이스하이엔드 구로 식당', '코오롱디지털타워 식당', '구로동 회식',
  // 확장(카카오 검색은 키워드당 90개까지만 주므로 넓게)
  '구로동 제육볶음', '구로동 직화', '구로동 불고기', '구로동 정식', '구로동 가정식', '구로동 김치찌개', '구로동 된장찌개', '구로동 순두부', '구로동 비빔밥', '구로동 덮밥집', '구로동 생선구이', '구로동 고등어', '구로동 쌈밥', '구로동 보리밥', '구로동 낙지', '구로동 오징어', '구로동 닭갈비', '구로동 찜닭', '구로동 족발', '구로동 감자탕', '구로동 뼈해장국', '구로동 설렁탕', '구로동 육개장', '구로동 갈비탕', '구로동 우동', '구로동 라멘', '구로동 짬뽕', '구로동 마라탕', '구로동 양꼬치', '구로동 쌀국수집', '구로동 카레', '구로동 오므라이스', '구로동 파스타집', '구로동 리조또', '구로동 스테이크', '구로동 버거', '구로동 샌드위치', '구로동 토스트', '구로동 브런치', '구로동 떡볶이', '구로동 라볶이', '구로동 만두', '구로동 도시락', '구로동 죽', '구로동 국수집', '구로동 냉면', '구로동 막국수', '구로동 메밀', '구로동 회덮밥', '구로동 참치', '구로동 포케', '구로동 샐러드바', '구로동 뷔페식당', '구로동 한식뷔페', '구로동 구내식당', '구로동 분식집', '구로동 술집', '구로동 호프', '구로동 이자카야', '구로동 곱창', '구로동 막창', '구로동 삼겹살집', '구로동 갈비', '구로동 소고기', '구로동 한우', '구로동 양식집', '구로동 일식집', '구로동 중식당', '구로동 베이커리', '구로동 디저트', '구로동 케이크', '구로동 카페 디저트', '구로동 아메리카노', '디지털로26길 식당', '디지털로27길 식당', '디지털로31길 식당', '디지털로33길 식당', '디지털로32길 식당', '디지털로34길 식당', '구로동 맛집 점심', '남구로역 점심', '구로디지털단지역 점심', '구로디지털단지 회식', '구로디지털단지 혼밥', '구로디지털단지 가성비', '구로디지털단지 새로 오픈', '디지털로 식당', '디지털로26길 맛집', '디지털로27길 맛집', '디지털로31길 맛집', '디지털로33길 맛집', '구로동로 식당', '구로중앙로 식당', '벚꽃로 구로 식당'
,
  // 회식
  '구로디지털단지 회식', '구로디지털단지 회식장소', '구로동 회식', '구로동 술집', '구로동 호프', '구로동 이자카야', '구로동 포차', '구로동 포장마차', '구로동 와인바', '구로동 맥주', '구로동 수제맥주', '구로동 소주', '구로동 안주', '구로동 고깃집', '구로동 삼겹살 회식', '구로동 소고기 회식', '구로동 단체회식', '구로동 룸 식당', '구로동 단체 예약', '구로디지털단지 이자카야', '구로디지털단지 고깃집', '구로디지털단지 술집', '남구로역 술집', '구로동 치킨 맥주', '구로동 막창', '구로동 곱창집', '구로동 족발집', '구로동 횟집', '구로동 참치집', '구로동 양꼬치집', '구로동 칵테일바', '구로동 바', '구로동 요리주점', '구로동 전집', '구로동 막걸리', '구로동 닭발', '구로동 오뎅바', '구로동 하이볼', '구로동 샤브샤브 회식', '구로동 중식 코스', '구로동 해물찜', '구로동 조개구이', '구로동 골뱅이', '구로동 곱창 회식', '디지털로 회식', '구로디지털단지 2차', '구로디지털단지 회식 맛집'
,
  // 프랜차이즈
  '구로디지털단지 햄버거', '구로디지털단지 버거', '구로동 맥도날드', '구로동 롯데리아', '구로동 맘스터치', '구로동 버거킹', '구로동 KFC', '구로동 노브랜드버거', '구로동 파파이스', '구로동 수제버거', '구로동 서브웨이', '구로디지털단지 서브웨이', '구로디지털단지 치킨', '구로동 BBQ', '구로동 bhc', '구로동 교촌', '구로동 굽네', '구로동 네네치킨', '구로동 처갓집', '구로동 페리카나', '구로동 60계', '구로동 자담치킨', '구로동 노랑통닭', '구로디지털단지 피자', '구로동 도미노피자', '구로동 피자헛', '구로동 파파존스', '구로동 피자스쿨', '구로동 피자마루', '구로동 반올림피자', '구로동 고피자', '구로동 김밥천국', '구로동 한솥', '구로동 본도시락', '구로동 서브웨이 샌드위치', '구로동 이삭토스트', '구로동 에그드랍', '구로동 명랑핫도그', '구로동 죠스떡볶이', '구로동 신전떡볶이', '구로동 엽기떡볶이', '구로동 컴포즈커피', '구로동 메가커피', '구로동 스타벅스', '구로동 투썸', '구로동 이디야', '구로동 파리바게뜨', '구로동 뚜레쥬르', '구로동 배스킨라빈스', '구로동 설빙', '구로동 공차'
];


/* ---------- 카테고리 정규화 (브랜드명·중복 카테고리 정리, 식당 아닌 것 제외) ---------- */
const NONFOOD = ["식품가공,제조","소프트웨어","컨설팅","가죽공예","서비스,산업","문화,예술","가정,생활","정육점","부동산","학원"];
const BURGER = /맥도날드|롯데리아|맘스터치(?!.*피자)|노브랜드버거|kfc|버거킹|쉐이크쉑|프랭크버거|파파이스|버거|burger/i, CHICKEN = /치킨|chicken|bbq|bhc|교촌|굽네|네네|페리카나|처갓집|호식이|60계|푸라닭|자담|멕시카나|노랑통닭|또래오래|지코바/i, PIZZA = /피자|pizza|도미노|파파존스/i, SALAD = /샐러드|포케|poke|salad/i, KIMBAP = /김밥/;
const CAFE_BRAND = /스타벅스|이디야|투썸|메가mgc|메가커피|컴포즈|빽다방|더벤티|매머드|할리스|파스쿠찌|엔젤리너스|커피빈|폴바셋|블루보틀|공차|쥬씨|커피|카페|coffee|cafe/i;
const MERGE = {"중식":"중국요리","일식집":"일식","설렁탕":"곰탕","정육점":"정육식당","무인카페":"카페","푸드코트":"뷔페","수제버거":"햄버거","샐러드바":"샐러드","테마카페":"카페","간식":"분식","족발":"족발,보쌈","보쌈":"족발,보쌈","백반,가정식":"한식","기사식당":"한식","해물찜":"해물,생선","조개":"해물,생선","조개구이":"해물,생선","매운탕,해물탕":"해물,생선","게,대게":"해물,생선","굴,전복":"해물,생선","오징어":"해물,생선","낙지":"해물,생선","장어":"해물,생선","민물장어":"해물,생선","복어":"해물,생선","생선구이":"해물,생선","쌈밥":"한식","보리밥":"한식","닭갈비":"닭요리","찜닭":"닭요리","오리":"닭요리","아이스크림":"디저트카페","빙수":"디저트카페","도넛":"디저트카페","마카롱":"디저트카페","케이크":"디저트카페","와플":"디저트카페","주스":"카페","떡,한과":"디저트카페","토스트":"샌드위치","브런치":"양식","카레":"일식","오므라이스":"일식","만두":"분식","죽":"한식","술집":"호프,요리주점","와인바":"칵테일바","바":"칵테일바","사철탕,영양탕":"한식","추어":"한식","아구":"해물,생선","두부전문점":"한식","불고기,두루치기":"육류,고기","삼겹살":"육류,고기","갈비":"육류,고기","정육식당":"육류,고기","동남아음식":"아시아음식","멕시칸,브라질":"양식","퓨전요리":"양식"};
function normCat(name, cat) {
  let c = (cat || '음식점').trim();
  if (NONFOOD.includes(c)) return null;
  if (/라마노/.test(name)) return '피자';
  if (c === '패스트푸드' || c === '햄버거' || c === '치킨' || c === '피자' || c === '음식점' || c === '분식') {
    if (PIZZA.test(name)) c = '피자';
    else if (BURGER.test(name)) c = '햄버거';
    else if (CHICKEN.test(name)) c = '치킨';
  }
  if (c === '음식점' || c === '한식') { if (SALAD.test(name)) c = '샐러드'; else if (KIMBAP.test(name)) c = '김밥'; else if (/국수|칼국수|우동/.test(name) && c === '음식점') c = '국수'; else if (/국밥|순대국/.test(name) && c === '음식점') c = '국밥'; else if (c === '음식점' && CAFE_BRAND.test(name)) c = '커피전문점'; }
  if (c === '카페' && /커피|coffee|스타벅스|이디야|투썸|메가|컴포즈|빽다방|더벤티|매머드|할리스|파스쿠찌|엔젤리너스|폴바셋/i.test(name)) c = '커피전문점';
  if (c === '햄버거' && /fruit|주스|쥬스|과일/i.test(name)) c = '카페';
  if (SALAD.test(name) && ['양식', '한식', '분식', '음식점', '도시락'].includes(c)) c = '샐러드';
  if (MERGE[c]) c = MERGE[c];
  return c;
}

const CAFE = ['커피전문점', '카페', '디저트카페', '제과,베이커리', '전통찻집', '북카페', '샌드위치'];
const BAR = ['호프,요리주점', '실내포장마차', '칵테일바', '오뎅바', '일본식주점', '술집', '와인바', '바'];   // 순수 술집 → kind '회식'
const HS_TAG = ['육류,고기', '삼겹살', '갈비', '곱창,막창', '족발,보쌈', '해물,생선', '회', '참치회', '조개', '해물찜', '치킨', '감자탕', '샤브샤브', '한정식', '뷔페', '한식뷔페', '양꼬치', '닭요리', '불고기,두루치기', '스테이크,립', '정육식당', '사철탕,영양탕', '오봉집', '교촌치킨', '멕시카나치킨', 'BBQ', 'bhc']; // 회식 가능 태그
const isHS = c => BAR.includes(c) || HS_TAG.some(t => c === t || c.includes(t));
const FF = ['패스트푸드', '햄버거', '치킨', '피자'];

/* ---------- 1. 후보 수집 ---------- */
const base = new Map();
// 키워드 5개씩 병렬 수집 (223개 키워드 × 최대 6페이지)
const addPlaces = arr => { for (const pl of arr) { const d = hav(+pl.lat, +pl.lon); if (d <= RADIUS) base.set(pl.confirmid, { id: pl.confirmid, name: pl.name, lat: +pl.lat, lon: +pl.lon, dist: d, addr: pl.new_address || pl.address, tel: pl.tel, c2: pl.cate_name_depth2 }); } };
async function collectQuery(q) { for (let p = 1; p <= 6; p++) { const j = await ksearch(q, p); const arr = j.place || []; if (!arr.length) break; addPlaces(arr); if (arr.length < 15) break; await sleep(40); } }
for (let i = 0; i < QUERIES.length; i += 5) { await Promise.all(QUERIES.slice(i, i + 5).map(collectQuery)); }
console.log(`[1/4] 반경 ${RADIUS}m 후보 ${base.size}곳`);

/* ---------- 1.5 직원 추가 요청 처리 (Firebase /requests) ---------- */
const FBURL = 'https://guro-lunch-default-rtdb.asia-southeast1.firebasedatabase.app';
const nn = s => (s || '').replace(/\s+/g, '').replace(/[()\[\]·・.,'"&#-]/g, '').toLowerCase();
// 오타 허용: 2글자 조각(bigram) 겉침 범위 (0~1)
const bigrams = s => { const o = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); o.set(g, (o.get(g) || 0) + 1); } return o; };
const sim = (a, b) => { if (!a || !b) return 0; if (a.length < 2 || b.length < 2) return a === b ? 1 : 0; const A = bigrams(a), B = bigrams(b); let hit = 0; for (const [g, c] of A) hit += Math.min(c, B.get(g) || 0); return (2 * hit) / ((a.length - 1) + (b.length - 1)); };
const isSubseq = (small, big) => { let i = 0; for (const ch of big) { if (ch === small[i]) i++; if (i === small.length) return true; } return i === small.length; };
const nameMatch = (cand, want) => {
  const c = nn(cand), w = nn(want); if (!c || !w) return 0;
  if (c === w) return 1;
  if (c.includes(w) || w.includes(c)) return 0.9;
  const toks = String(want).split(/\s+/).map(nn).filter(t => t.length >= 2);
  if (toks.length >= 2 && toks.every(t => c.includes(t))) return 0.85;          // "담소 순대" → 담소소사골순대육개장
  if (w.length >= 4 && isSubseq(w, c) && w.length / c.length >= 0.4) return 0.7; // "송가제육" → 송가직화제육
  return sim(c, w);
};
let reqs = {};
try { reqs = (await (await fetch(FBURL + '/requests.json', { signal: T() })).json()) || {}; } catch (e) { }
const pendingReqs = Object.entries(reqs).filter(([, r]) => r && r.status === 'pending');
const reqLog = [];
for (const [qid, r] of pendingReqs) {
  let best = null, reason = '';
  const tryQ = [r.name, '구로디지털단지 ' + r.name, '구로동 ' + r.name, (r.hint ? r.hint + ' ' + r.name : null)].filter(Boolean);
  // 0) 이미 수집된 반경 내 후보(base) 안에서 먼저 찾기 (카카오 검색이 안 돌려주는 이름도 잡힐)
  {
    let bb = null;
    for (const b of base.values()) { const sc = nameMatch(b.name, r.name); if (sc >= 0.6 && (!bb || sc > bb.score || (sc === bb.score && b.dist < bb.d))) bb = { p: { confirmid: b.id, name: b.name, lat: b.lat, lon: b.lon, new_address: b.addr, tel: b.tel, cate_name_depth1: '음식점', cate_name_depth2: b.c2 }, d: b.dist, score: sc }; }
    if (bb) best = bb;
  }
  // 이미 확정된 카카오 ID가 있으면 그걸 바로 사용
  if (!best && r.rid && /^\d+$/.test(String(r.rid))) {
    const j = await ksearch(r.name, 1);
    const hit = (j.place || []).find(p => p.confirmid === String(r.rid));
    if (hit) best = { p: hit, d: hav(+hit.lat, +hit.lon), score: 1 };
  }
  for (const q of (best ? [] : tryQ)) {
    const j = await ksearch(q, 1);
    const cands = (j.place || []).map(p => ({ p, d: hav(+p.lat, +p.lon), score: nameMatch(p.name, r.name) }))
      .filter(x => x.p.cate_name_depth1 === '음식점' && x.score >= 0.55);
    // 반경 안에서: 이름 유사도 우선, 같으면 가까운 순
    const near = cands.filter(x => x.d <= RADIUS).sort((a, b) => (b.score - a.score) || (a.d - b.d))[0];
    if (near) { best = near; break; }
    if (!best && cands.length) { best = cands.sort((a, b) => (b.score - a.score) || (a.d - b.d))[0]; reason = 'far'; }
    await sleep(80);
  }
  let patch;
  if (best && best.d <= RADIUS) {
    const pl = best.p;
    if (!base.has(pl.confirmid)) base.set(pl.confirmid, { id: pl.confirmid, name: pl.name, lat: +pl.lat, lon: +pl.lon, dist: best.d, addr: pl.new_address || pl.address, tel: pl.tel, c2: pl.cate_name_depth2, req: 1 });
    patch = { status: 'added', rid: pl.confirmid, matched: pl.name, addr: pl.new_address || pl.address || '', dist: best.d, score: Math.round((best.score || 0) * 100), doneAt: Date.now() };
    reqLog.push(`✅ ${r.name} → ${pl.name} (${best.d}m, 유사도 ${patch.score}%)`);
  } else if (best) {
    patch = { status: 'far', matched: best.p.name, addr: best.p.new_address || best.p.address || '', dist: best.d, score: Math.round((best.score || 0) * 100), doneAt: Date.now() };
    reqLog.push(`📏 ${r.name} → ${best.p.name} ${best.d}m (반경 밖)`);
  } else {
    patch = { status: 'notfound', doneAt: Date.now() };
    reqLog.push(`❓ ${r.name} 못 찾음`);
  }
  try { await fetch(FBURL + '/requests/' + qid + '.json', { method: 'PATCH', body: JSON.stringify(patch), signal: T() }); } catch (e) { }
}
console.log(`[1.5/4] 추가 요청 ${pendingReqs.length}건 처리${reqLog.length ? '\n  ' + reqLog.join('\n  ') : ''}`);
if (base.size < 50) { console.error('수집 결과가 비정상적으로 적음. 중단(기존 데이터 유지).'); process.exit(1); }

/* ---------- 2. 상세(메뉴/가격/평점) ---------- */
const ids = [...base.keys()];
const details = {};
const CONC = 6;
for (let i = 0; i < ids.length; i += CONC) {
  await Promise.all(ids.slice(i, i + CONC).map(async id => {
    const j = await kdetail(id);
    if (!j) return;
    const s = j.summary || {};
    details[id] = {
      name: s.name, cat: s.category?.name, lat: s.point?.lat, lon: s.point?.lon,
      addr: s.address?.disp, tel: s.phone_numbers?.[0]?.tel, photo: s.main_photo_url, status: s.status,
      score: j.kakaomap_review?.score_set?.average_score, rc: j.kakaomap_review?.score_set?.review_count,
      menus: (j.menu?.menus?.items || []).map(m => ({ n: m.name, p: m.price, ai: m.is_ai_mate ? 1 : 0, d: m.ai_mate_desc || '' }))
    };
  }));
  await sleep(120);
}
console.log(`[2/4] 상세 수집 ${Object.keys(details).length}곳`);

/* ---------- 3. 네이버 플레이스 (평점/리뷰수/플레이스ID) ---------- */
function apolloState(h) {
  const i = h.indexOf('window.__APOLLO_STATE__'); if (i < 0) return null;
  const s = h.indexOf('{', i);
  let d = 0, e = -1, ins = false, esc = false;
  for (let k = s; k < h.length; k++) {
    const c = h[k];
    if (ins) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') ins = false; continue; }
    if (c === '"') { ins = true; continue; }
    if (c === '{') d++; else if (c === '}') { d--; if (d === 0) { e = k + 1; break; } }
  }
  try { return JSON.parse(h.slice(s, e)); } catch (err) { return null; }
}
const toInt = v => parseInt(String(v || '0').replace(/,/g, '')) || 0;
const nvBulk = new Map();
const NQ = [...QUERIES, '구로동 찌개', '구로동 커피', '구로동 포케', '구로동 도시락', '구로동 삼겹살', '구로동 냉면', '구로동 우동',
  '구로동 카레', '구로동 마라탕', '구로동 김치찌개', '구로동 제육', '구로동 보쌈', '구로동 스테이크', '구로동 샤브샤브', '구로동 밥집',
  '구로디지털단지역 맛집', '남구로역 맛집', '디지털로 272', '구로동 혼밥', '구로동 가성비', '구로동 브런치', '구로동 면요리'];
let nvFail = 0;
for (const q of NQ) {
  if (nvFail >= 6 && nvBulk.size === 0) { console.log('  네이버 목록 응답 없음 -> 건너뜀'); break; }
  if (budgetLeft() < 5 * 60 * 1000) break;
  try {
    const r = await fetch(`https://pcmap.place.naver.com/restaurant/list?query=${encodeURIComponent(q)}&x=${CEN.lon}&y=${CEN.lat}`,
      { headers: { 'user-agent': UA, referer: 'https://map.naver.com/' }, signal: T(10000) });
    if (!r.ok) { nvFail++; continue; }
    const st = apolloState(await r.text());
    if (!st) { nvFail++; continue; }
    for (const k of Object.keys(st)) {
      if (!k.startsWith('PlaceListBusinessesItem')) continue;
      const o = st[k];
      nvBulk.set(String(o.id), { id: String(o.id), name: o.name, x: +o.x, y: +o.y, vr: toInt(o.visitorReviewCount), br: toInt(o.blogCafeReviewCount), sc: o.visitorReviewScore ? +o.visitorReviewScore : null, img: o.imageUrl || '' });
    }
  } catch (e) { nvFail++; }
  await sleep(150);
}
console.log(`[3/4] 네이버 목록 ${nvBulk.size}곳 (실패 ${nvFail})`);

async function nInstant(q) {
  try {
    const r = await fetch(`https://map.naver.com/p/api/search/instant-search?query=${encodeURIComponent(q)}&coords=${CEN.lat},${CEN.lon}&lang=ko`,
      { headers: { 'user-agent': UA, referer: 'https://map.naver.com/' }, signal: T(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    return j.place || [];
  } catch (e) { return null; }
}
const gdist = (lat1, lon1, lat2, lon2) => {
  const R = 6371000, t = Math.PI / 180;
  const dLat = (lat2 - lat1) * t, dLon = (lon2 - lon1) * t;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};
const naver = {};

// (a) 목록 데이터로 좌표+이름 매칭 (해외 러너에서도 동작)
const nnorm = s => (s || '').replace(/\s+/g, '').replace(/[()·・.,'"&#-]/g, '').toLowerCase();
const ncore = s => nnorm(s).replace(/(구로디지털단지역|구로디지털단지|구로디지털역|구로디지털|구로지타워몰|지타워몰|g타워몰|구로하이엔드|구로에이스하이엔드\d?차?|코오롱디지털|코오롱타워|구디|구로)(\d호)?(직영)?점?$/, '').replace(/(본점|직영점|점)$/, '');
const NB = [...nvBulk.values()];
let bulkHit = 0;
for (const [id, b] of base) {
  const d = details[id]; if (!d) continue;
  const name = d.name || b.name, lat = d.lat || b.lat, lon = d.lon || b.lon;
  const a1 = nnorm(name), a2 = ncore(name);
  let best = null;
  for (const n of NB) {
    if (gdist(lat, lon, n.y, n.x) > 90) continue;
    const b1 = nnorm(n.name), b2 = ncore(n.name);
    if (a1 === b1 || (a2 && b2 && (a2 === b2 || (a2.length >= 2 && b2.length >= 2 && (a2.includes(b2) || b2.includes(a2)))))) {
      if (!best || n.vr > best.vr) best = n;
    }
  }
  if (best) { naver[id] = { nid: best.id, nvr: best.vr, nbr: best.br, nsc: best.sc, img: best.img || '' }; bulkHit++; }
}
console.log(`[3/4] 네이버 목록 매칭 ${bulkHit}/${base.size}`);

// (b) 목록에 없는 곳만 개별 검색 (국내 IP에서만 동작할 수 있음)
let nvHit = 0, nvErr = 0, nvTried = 0;
for (const [id, b] of base) {
  const d = details[id]; if (!d) continue;
  if (naver[id]) continue;
  if (nvTried >= 15 && nvHit === 0) { console.log('  개별 검색 매칭 0 -> 건너뜀(이전 값 유지)'); break; }
  if (nvErr >= 25 && nvErr > nvHit) { console.log('  네이버 검색 오류 과다 -> 중단(이전 값 유지)'); break; }
  if (budgetLeft() < 90 * 1000) { console.log('  시간 예산 소진 -> 중단(이전 값 유지)'); break; }
  nvTried++;
  const name = d.name || b.name;
  const lat = d.lat || b.lat, lon = d.lon || b.lon;
  let best = null;
  for (const q of [name, name.replace(/\s*(구로디지털단지점|구로디지털점|구로점|본점|직영점)$/, '')]) {
    const arr = await nInstant(q);
    if (arr === null) { nvErr++; break; }
    best = arr.find(p => gdist(lat, lon, +p.y, +p.x) <= 120);
    if (best) break;
    await sleep(50);
  }
  if (best) {
    const bk = nvBulk.get(String(best.id));
    naver[id] = { nid: String(best.id), nvr: toInt(best.review?.count), nbr: bk?.br || 0, nsc: bk?.sc || null, img: bk?.img || '' };
    nvHit++;
  }
  await sleep(50);
}
console.log(`[3/4] 개별 검색 추가 매칭 ${nvHit} (총 ${Object.keys(naver).length})`);

/* ---------- 4. 기존 데이터 diff + 파일 쓰기 ---------- */
let prevIds = new Set();
const prevById = new Map();
try {
  const old = await fs.readFile(path.join(ROOT, 'data.js'), 'utf8');
  const oj = JSON.parse(old.replace(/^window\.LUNCH_DATA\s*=\s*/, '').replace(/;\s*$/, ''));
  oj.list.forEach(r => { prevIds.add(r.id); prevById.set(r.id, r); });
} catch (e) { /* 최초 실행 */ }

// seen.json: { id: { f: 처음 발견일(기준선이면 null), l: 마지막 발견일 } }  -- 절대 지우지 않음
const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // KST
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400e3);
let seen = {};
try { seen = JSON.parse(await fs.readFile(path.join(ROOT, 'seen.json'), 'utf8')); } catch (e) { }
const firstRun = Object.keys(seen).length === 0;
if (firstRun) prevIds.forEach(id => { seen[id] = { f: null, l: TODAY }; });
const NEW_DAYS = 14;

const list = [], added = [];
for (const [id, b] of base) {
  const d = details[id];
  if (!d) continue;
  if (d.status && d.status !== 'Y') continue;
  const name = d.name || b.name;
  const cat = normCat(name, d.cat || b.c2 || '음식점');
  if (cat === null) continue; // 식당 아님
  let kind = '밥집';
  if (cat === '구내식당') kind = '구내식당';
  else if (CAFE.includes(cat)) kind = '카페';
  else if (BAR.includes(cat)) kind = '회식';
  else if (FF.includes(cat)) kind = '패스트푸드';

  const menus = (d.menus || []).filter(m => m.p > 0);
  const lunch = menus.filter(m => m.p >= 4000 && m.p <= 20000).map(m => m.p).sort((x, y) => x - y);
  const med = lunch.length ? lunch[Math.floor(lunch.length / 2)] : null;
  if (!seen[id]) {
    seen[id] = { f: firstRun ? null : TODAY, l: TODAY, ...(b.req ? { req: 1 } : {}) };
    if (!firstRun) added.push(`${name}(${cat}, ${b.dist}m${med ? ', ' + med.toLocaleString('ko-KR') + '원' : ''})`);
  }
  seen[id].l = TODAY;
  const fsd = seen[id].f;
  const isNew = !!fsd && daysBetween(fsd, TODAY) <= NEW_DAYS;

  list.push({
    id, n: name, c: cat, k: kind, d: b.dist,
    la: +(d.lat || b.lat).toFixed(6), lo: +(d.lon || b.lon).toFixed(6),
    a: d.addr || b.addr, t: d.tel || b.tel || '',
    s: d.score || null, rc: d.rc || 0,
    // 사진: 카카오 → 네이버 → 직전 값
    ph: d.photo || naver[id]?.img || prevById.get(id)?.ph || '',
    pr: med, pmin: lunch[0] || null, pmax: lunch[lunch.length - 1] || null,
    m: menus.slice().sort((x, y) => y.ai - x.ai).slice(0, 10).map(m => ({ n: m.n, p: m.p, ...(m.d ? { d: m.d.slice(0, 40) } : {}) })),
    nw: isNew ? 1 : 0,
    ...(isHS(cat) ? { hs: 1 } : {}),
    ...(fsd ? { fs: fsd } : {}),
    // 네이버: 이번에 못 가져오면 직전 값 유지
    nid: naver[id]?.nid || prevById.get(id)?.nid || null,
    nvr: naver[id]?.nvr || prevById.get(id)?.nvr || 0,
    nbr: naver[id]?.nbr || prevById.get(id)?.nbr || 0,
    nsc: naver[id]?.nsc || prevById.get(id)?.nsc || null
  });
}
// 이번에 검색에서 빠진 곳: 최근 7일 안에 본 적 있으면 직전 정보로 유지 (검색 흔들림 보정)
const inList = new Set(list.map(r => r.id));
let kept = 0;
for (const [id, r] of prevById) {
  if (inList.has(id)) continue;
  if (seen[id]?.req) seen[id].l = TODAY;
  const sn = seen[id];
  if (sn && sn.l && (daysBetween(sn.l, TODAY) <= 7 || sn.req)) {
    const fsd = sn.f;
    list.push({ ...r, nw: fsd && daysBetween(fsd, TODAY) <= NEW_DAYS ? 1 : 0 });
    kept++;
  }
}
await fs.writeFile(path.join(ROOT, 'seen.json'), JSON.stringify(seen), 'utf8');
list.sort((a, b) => a.d - b.d);

const payload = {
  meta: { center: CEN, building: '한신아이티타워', address: '서울 구로구 디지털로 272', radius: RADIUS, updated: new Date().toISOString(), count: list.length, naverMatched: list.filter(r => r.nid).length },
  list
};
const dataJs = 'window.LUNCH_DATA = ' + JSON.stringify(payload) + ';';
await fs.writeFile(path.join(ROOT, 'data.js'), dataJs, 'utf8');

const tpl = await fs.readFile(path.join(ROOT, 'template.html'), 'utf8');
await fs.writeFile(path.join(ROOT, 'index.html'), tpl.replace('<script src="data.js"></script>', '<script>' + dataJs + '</script>'), 'utf8');

const closed = [...prevIds].filter(id => !list.some(r => r.id === id)).length;
const summary = `[4/4] 총 ${list.length}곳 / 오늘 신규 ${added.length} / 검색에서 빠졌지만 유지 ${kept} / 제외 ${closed} / 네이버 매칭 ${payload.meta.naverMatched}\n신규: ${added.length ? added.join(' · ') : '없음'}${reqLog.length ? '\n요청: ' + reqLog.join(' / ') : ''}`;
console.log(summary);
await fs.writeFile(path.join(ROOT, 'last-run.txt'), `${new Date().toISOString()}\n${summary}\n`, 'utf8');
