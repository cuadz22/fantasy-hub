// Live lineups for one league, read from the public Yahoo matchup pages (no login).
// GET /api/lineups?lg=gl&week=10  ->  { lg, week, at, matchups:[{ia,ib,an,bn,L:[[slot,name,pos,team,proj,pts,status]...],R:[...]}] }
// Edge-cached for a minute so many viewers share one Yahoo read.
const M = require('./_m');
const { scrapeLeague } = require('./_lscrape');
const LGS = ['gl', 'bh', 'rb', 'sts'];
// One-off backfill for the week we were not recording yet (win-probability series copied from Flock Fantasy).
let FLOCK = null; try { FLOCK = require('./_flock_w10.json'); } catch (e) {}
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
    const lg = String(q.get('lg') || ''); if (!LGS.includes(lg)) { res.statusCode = 400; res.setHeader('Cache-Control', 'no-store'); return res.end(JSON.stringify({ error: 'invalid_league' })); }
    const wkRaw = q.get('week'); let week, ctx;
    if (wkRaw == null || wkRaw === '') { const c0 = ctx = await M.context({ cachedOnly: true }); if (!c0) { res.statusCode = 503; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify({ error: 'context_unavailable' })); return; } week = c0.week; } // default = the real current NFL week, not a fixed number
    else { week = Number(wkRaw); if (!Number.isInteger(week) || week < 1 || week > 18) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify({ lg, week: wkRaw, available: false, error: 'invalid_week', matchups: [] })); return; } }
    if (q.get('hist')) { // win-probability history for the chart
      const raw = (await redis(['LRANGE', 'wph:' + lg + ':' + week, 0, -1], 4000)) || [], pts = [];
      raw.forEach(x => { try { pts.push(JSON.parse(x)); } catch (e) {} });
      res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=30'); res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify({ lg, week, n: pts.length, pts, flock: FLOCK && FLOCK.week === week && FLOCK[lg] ? FLOCK[lg] : null })); return;
    }
    if (!ctx) ctx = await M.context({ cachedOnly: true });
    const sv = await M.serveWeek(lg, week, ctx);
    res.setHeader('Content-Type', 'application/json'); res.setHeader('Access-Control-Allow-Origin', '*');
    if (!sv) { res.statusCode = 404; res.setHeader('Cache-Control', 'no-store'); return res.end(JSON.stringify({ lg, week, available: false, error: 'week_unavailable', matchups: [] })); }
    sv.ms = Date.now() - t0;
    res.setHeader('Cache-Control', sv.stale || sv.partial ? 'no-store' : sv.final ? 'public, s-maxage=3600, max-age=60' : 'public, s-maxage=10, max-age=0');
    res.end(JSON.stringify(sv));
  } catch (e) {
    res.statusCode = 503; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'feed_unavailable' }));
  }
};
module.exports.record = record;
