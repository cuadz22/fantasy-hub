// Offline tests for the iPhone app backend: in-memory Redis, fixture scoreboard, captured mail. Run: node tools/test_mobile.js
process.env.KV_REST_API_URL = 'https://fake-redis.test'; process.env.KV_REST_API_TOKEN = 't'; process.env.RESEND_API_KEY = 'test-key'; process.env.MOBILE_AUTH_PEPPER = 'test-pepper'; process.env.CRON_SECRET = 'test-cron';
const crypto = require('crypto'), sha = s => crypto.createHash('sha256').update(s).digest('hex');
const store = new Map(), ttl = new Map(); let mail = [], BOARD = null, espnDown = false;
const exp = k => { const t = ttl.get(k); if (t && t < Date.now()) { store.delete(k); ttl.delete(k); } };
function redis(c) {
  const [op, k, ...a] = c; exp(k); const U = op.toUpperCase();
  if (U === 'EVAL') { const key = a[1], token = a[2]; if (store.get(key) !== token) return 0; store.delete(key); ttl.delete(key); return 1; }
  if (U === 'GET') return store.has(k) ? store.get(k) : null;
  if (U === 'SET') { if (a.includes('NX') && store.has(k)) return null; store.set(k, a[0]); const i = a.indexOf('EX'); if (i >= 0) ttl.set(k, Date.now() + a[i + 1] * 1000); else ttl.delete(k); return 'OK'; }
  if (U === 'DEL') { const had = store.delete(k); ttl.delete(k); return had ? 1 : 0; }
  if (U === 'INCR') { const n = (Number(store.get(k)) || 0) + 1; store.set(k, String(n)); return n; }
  if (U === 'EXPIRE') { ttl.set(k, Date.now() + a[0] * 1000); return 1; }
  if (U === 'TTL') return ttl.has(k) ? Math.ceil((ttl.get(k) - Date.now()) / 1000) : -1;
  if (U === 'RPUSH') { const l = store.get(k) || []; l.push(...a); store.set(k, l); return l.length; }
  if (U === 'LTRIM') { store.set(k, (store.get(k) || []).slice(Number(a[0]), a[1] === -1 ? undefined : Number(a[1]) + 1)); return 'OK'; }
  if (U === 'LINDEX') return (store.get(k) || []).at(Number(a[0])) || null;
  if (U === 'HSET') { const h = store.get(k) || {}; h[a[0]] = a[1]; store.set(k, h); return 1; }
  if (U === 'HGETALL') { const h = store.get(k) || {}; return Object.entries(h).flat(); }
  if (U === 'SADD') { const s = store.get(k) || []; if (!s.includes(a[0])) s.push(a[0]); store.set(k, s); return 1; }
  if (U === 'SREM') { store.set(k, (store.get(k) || []).filter(x => x !== a[0])); return 1; }
  if (U === 'SMEMBERS') return store.get(k) || [];
  throw new Error('redis op ' + op);
}
const game = (id, h, a, hs, as, state, per, clock, poss, start) => ({ id, date: start, status: { type: { state, name: state === 'post' ? 'STATUS_FINAL' : 'STATUS_IN_PROGRESS', shortDetail: state === 'post' ? 'Final' : '' }, period: per, displayClock: clock }, competitions: [{ competitors: [{ homeAway: 'home', score: String(hs), team: { id: '1' + id, abbreviation: h } }, { homeAway: 'away', score: String(as), team: { id: '2' + id, abbreviation: a } }], situation: poss ? { possession: poss === 'home' ? '1' + id : '2' + id } : undefined }] });
const mkBoard = (week, events, byes) => ({ season: { year: 2026 }, week: { number: week, teamsOnBye: (byes || []).map(t => ({ abbreviation: t })) }, events });
global.fetch = async (url, o) => {
  url = String(url);
  if (url.startsWith('https://fake-redis')) { const r = redis(JSON.parse(o.body)); return { ok: true, json: async () => ({ result: r }) }; }
  if (url.includes('espn.com')) { if (espnDown) throw new Error('espn down'); return { ok: true, json: async () => JSON.parse(JSON.stringify(BOARD)) }; }
  if (url.includes('api.resend.com')) { const b = JSON.parse(o.body); mail.push({ to: b.to[0], code: /\b(\d{6})\b/.exec(b.subject)[1] }); return { ok: true, json: async () => ({}) }; }
  throw new Error('unexpected fetch ' + url);
};
const M = require('../client/api/_m'), A = require('../client/api/_mauth'), mobile = require('../client/api/mobile'), lineups = require('../client/api/lineups');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
const call = async (h, url, o = {}) => { const res = { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { this.body = b; } }; await h({ url, method: o.method || 'GET', headers: Object.assign({ 'x-forwarded-for': o.ip || '1.1.1.1' }, o.headers || {}), body: o.body }, res); let j = null; try { j = JSON.parse(res.body); } catch (e) {} return { s: res.statusCode, j, h: res.headers }; };
const mu = (ia, ib) => ({ ia, ib, an: 'T' + ia, bn: 'T' + ib, L: [['QB', 'Joe Burrow', 'QB', 'Cin', 20, null, 'Sun 1:00 pm @ Hou', ''], ['RB', 'Bijan', 'RB', 'Atl', 10, 5, 'Final', 'Q']], R: [['QB', 'CJ Stroud', 'QB', 'HOU', 18, 9.5, '', ''], ['WR', 'Nico Collins', 'WR', 'Wsh', 12, null, '', '']], ya: [1, 2], yb: [3, 4] });
const six = (f) => [mu(f, f + 1), mu(f + 2, f + 3), mu(f + 4, f + 5), mu(f + 6, f + 7), mu(f + 8, f + 9), mu(f + 10, f + 11)];
const H = t => ({ headers: { authorization: 'Bearer ' + t } });
module.exports = { store, ttl, game, mkBoard, M, A, mobile, lineups, call, mu, six, ok, H, sha, get mail() { return mail; }, set mail(v) { mail = v; }, set BOARD(v) { BOARD = v; }, set espnDown(v) { espnDown = v; }, done() { console.log(pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0); } };
