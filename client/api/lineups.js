// Live lineups for one league, read from the public Yahoo matchup pages (no login).
// GET /api/lineups?lg=gl&week=10  ->  { lg, week, at, matchups:[{ia,ib,an,bn,L:[[slot,name,pos,team,proj,pts,status]...],R:[...]}] }
// Edge-cached for a minute so many viewers share one Yahoo read.
const { fetchPage, parsePage, fetchTeam, parseTeam } = require('./_ysweep');
const LGS = ['gl', 'bh', 'rb', 'sts'];
const clean = s => String(s || '').replace(/&#x[0-9a-f]+;|&#\d+;/gi, '').replace(/\s+/g, ' ').trim();
const row = x => [x.slot, x.name, x.pos, x.team, x.proj, x.pts, clean(x.status), x.inj || ''];
// Hourly normally; every 10 minutes only inside NFL game windows (US Eastern time) to stay well under Yahoo's rate limits.
function cacheSeconds() {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
    const m = Number(p.hour) * 60 + Number(p.minute);
    if (p.weekday === 'Sun' && m >= 9 * 60 + 25) return 75;
    if ((p.weekday === 'Thu' || p.weekday === 'Mon') && m >= 19 * 60 + 55) return 75;
    if ((p.weekday === 'Mon' || p.weekday === 'Fri') && m < 90) return 75; // late-night tail of Sunday/Thursday games
    // Don't let an hourly cache entry outlive the start of the next game window.
    const start = p.weekday === 'Sun' ? 9 * 60 + 25 : (p.weekday === 'Thu' || p.weekday === 'Mon') ? 19 * 60 + 55 : null;
    if (start != null && m < start) return Math.max(60, Math.min(900, (start - m) * 60));
  } catch (e) {}
  return 900;
}
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL, TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
// Win-probability history: every full read of a league appends one compact snapshot of each matchup's Yahoo score + projection.
// The chart is drawn from these in the browser. Storage trouble must never affect the live lineups, so every call is time-boxed and swallowed.
async function redis(cmd, ms) {
  if (!URL_ || !TOKEN) return null;
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), ms || 1200);
  try { const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd), signal: ctl.signal }); const j = await r.json(); return j.error ? null : j.result; }
  catch (e) { return null; } finally { clearTimeout(tm); }
}
const r2 = n => Math.round(Number(n) * 100) / 100;
function snapshot(matchups) {
  const rows = matchups.filter(m => m.ya && m.yb && isFinite(m.ya[0]) && isFinite(m.ya[1]) && isFinite(m.yb[0]) && isFinite(m.yb[1])).map(m => [m.ia, r2(m.ya[0]), r2(m.ya[1]), r2(m.yb[0]), r2(m.yb[1])]);
  return rows.length >= 6 ? JSON.stringify([Math.floor(Date.now() / 1000), rows]) : null;
}
async function record(lg, week, matchups) {
  const snap = snapshot(matchups); if (!snap) return;
  const key = 'wph:' + lg + ':' + week;
  const last = await redis(['LINDEX', key, -1], 900);
  if (last) { try { const a = JSON.parse(last); if (Date.now() / 1000 - a[0] < 40) return; } catch (e) {} }
  await redis(['RPUSH', key, snap], 900); await redis(['LTRIM', key, -1500, -1], 700); await redis(['EXPIRE', key, 60 * 86400], 700);
}
module.exports = async (req, res) => {
  const t0 = Date.now();
  try {
    const q = new URL(req.url, 'http://x').searchParams;
    const lg = String(q.get('lg') || ''); if (!LGS.includes(lg)) throw new Error('bad league');
    const week = Math.min(18, Math.max(1, parseInt(q.get('week'), 10) || 10));
    if (q.get('hist')) { // win-probability history for the chart
      const raw = (await redis(['LRANGE', 'wph:' + lg + ':' + week, 0, -1], 4000)) || [], pts = [];
      raw.forEach(x => { try { pts.push(JSON.parse(x)); } catch (e) {} });
      res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=30'); res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify({ lg, week, n: pts.length, pts })); return;
    }
    const seen = new Set(), matchups = [], diag = {}; let diagT = null;
    // Primary path: team pages (the current week's matchup pages no longer carry lineups in the raw HTML).
    try {
      const ids = Array.from({ length: 12 }, (_, i) => i + 1), T = {};
      diagT = T;
      let next = 0;
      await Promise.all(Array.from({ length: 6 }, async () => {
        while (next < ids.length) {
          const id = ids[next++];
          let last = null; for (let tryN = 0; tryN < 3; tryN++) { try { const pt = parseTeam(await fetchTeam(lg, week, id), id); if (pt.rows.length >= 8) { T[id] = pt; last = null; break; } last = 'rows ' + pt.rows.length; } catch (e) { last = String(e.message || e).slice(0, 60); } await new Promise(r => setTimeout(r, 350 * (tryN + 1))); }
          if (last) { T[id] = T[id] || null; diag[id] = last; }
        }
      }));
      const done = new Set();
      ids.forEach(id => {
        const a = T[id]; if (!a || !a.opp || done.has(id) || done.has(a.opp)) return;
        const b = T[a.opp]; if (!b || !a.rows.length || !b.rows.length) return;
        done.add(id); done.add(a.opp);
        const [x, y] = id < a.opp ? [a, b] : [b, a];
        matchups.push({ ia: x.id, ib: y.id, an: x.name, bn: y.name, L: x.rows.map(row), R: y.rows.map(row), ya: x.tot, yb: y.tot });
      });
    } catch (e) { matchups.length = 0; }
    const useOld = !matchups.length;
    for (let mid = 1; useOld && mid <= 14 && matchups.length < 7; mid++) {
      if (seen.has(mid)) continue;
      const p = parsePage(await fetchPage(lg, week, mid));
      if (p.teams.length < 2 || (!p.L.length && !p.R.length)) { seen.add(mid); continue; }
      const [a, b] = p.teams; seen.add(a.id); seen.add(b.id);
      // left side of the page is the team in mid1
      matchups.push({ ia: a.id, ib: b.id, an: a.name, bn: b.name, L: p.L.map(row), R: p.R.map(row) });
    }
    res.setHeader('Content-Type', 'application/json');
    // A short or incomplete read must never sit in the edge cache: only a full league (all matchups, full rosters) is cached for the normal window.
    const partial = useOld ? matchups.length < 6 : matchups.length < 6 || matchups.some(m => m.L.length < 8 || m.R.length < 8);
    const ttl = partial ? 15 : cacheSeconds();
    res.setHeader('Cache-Control', `s-maxage=${ttl}, stale-while-revalidate=${partial ? 0 : Math.min(60, ttl)}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!partial && !useOld) await record(lg, week, matchups);
    res.end(JSON.stringify({ lg, week, at: new Date().toISOString(), ms: Date.now() - t0, partial, matchups, diag: q.get('dbg') ? { diag, t: diagT && Object.fromEntries(Object.entries(diagT).map(([k, v]) => [k, v ? [v.rows.length, v.opp, v.name, v.dbgc.slice(0, 4).join('/'), v.info] : null])) } : undefined }));
  } catch (e) {
    res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: String(e.message || e) }));
  }
};
