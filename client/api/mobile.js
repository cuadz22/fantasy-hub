// One function for the iPhone app: GET /api/mobile/context, /me, /market-movers, /access; POST /auth/request-code, /auth/verify-code, /auth/logout.
// Also the cron entry (/api/mobile/cron): keeps the scoreboard and current-week lineups fresh and backfills finished weeks, independent of visitors.
'use strict';
const M = require('./_m'), A = require('./_mauth'), MV = require('./_mmovers');
const { scrapeLeague } = require('./_lscrape');
const J = (res, status, obj, cache, extra) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.setHeader('Cache-Control', cache || 'no-store'); if (extra) Object.keys(extra).forEach(k => res.setHeader(k, extra[k])); res.end(JSON.stringify(obj)); };
const bodyOf = req => { const b = req.body; if (b && typeof b === 'object') return b; try { return JSON.parse(b || '{}'); } catch (e) { return {}; } };
const AUTH = { status: 401, json: { error: 'unauthorized' } };

async function cron(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== 'Bearer ' + secret) return J(res, 401, { error: 'unauthorized' });
  if ((await M.rc(['SET', 'mlock', '1', 'NX', 'EX', '25'])) !== 'OK') return J(res, 200, { skipped: 'another refresh is running' });
  const t0 = Date.now(), el = () => Date.now() - t0, out = { lineups: {}, backfill: null };
  let board = await M.getBoard(null, 10);
  if (!board) return J(res, 200, { error: 'scoreboard unavailable' });
  const cw = board.week, live = M.isLive(board) || M.soon(board); out.week = cw; out.live = live;
  const final = {}; const fh = (await M.rc(['HGETALL', 'mw:final'])) || []; for (let i = 0; i + 1 < fh.length; i += 2) final[fh[i]] = 1;
  const ctx = await M.context();
  for (const lg of M.LGS) { // current week: every minute in game windows, every 15 minutes otherwise
    if (el() > 38000) { out.lineups[lg] = 'time'; continue; }
    const rec = await M.rget('mw:' + lg + ':' + cw), age = rec ? Date.now() - rec.fetchedAt : Infinity;
    if (age < (live ? 50000 : 900000)) { out.lineups[lg] = 'fresh'; continue; }
    try { const sc = await scrapeLeague(lg, cw); if (sc.matchups.length) { await M.saveWeek(lg, cw, sc.matchups, sc.partial, {}); out.lineups[lg] = sc.partial ? 'partial' : 'ok'; } else { await M.noteFail(lg, cw, 'no matchups'); out.lineups[lg] = 'failed'; } }
    catch (e) { await M.noteFail(lg, cw, e.message); out.lineups[lg] = 'failed'; }
  }
  // Backfill / finalize one finished league-week per run, newest first. Finished weeks are written once and kept.
  if (el() < 30000) {
    outer: for (let w = cw - 1; w >= 1; w--) for (const lg of M.LGS) {
      if (final[lg + ':' + w]) continue;
      if (!(await M.finalEligible(w, ctx))) continue;
      try { const sc = await scrapeLeague(lg, w); if (sc.matchups.length && !sc.partial) { await M.saveWeek(lg, w, sc.matchups, false, { final: true }); out.backfill = lg + ':' + w + ' final'; } else out.backfill = lg + ':' + w + ' incomplete'; } catch (e) { out.backfill = lg + ':' + w + ' failed'; }
      break outer;
    }
  }
  if (live) { // scoreboard every ~20 seconds while games are on
    for (let i = 0; i < 2 && el() < 32000; i++) { await M.sleep(18000); board = await M.getBoard(null, 0) || board; }
    out.scoreboardPasses = 3;
  }
  out.ms = el(); await M.rc(['DEL', 'mlock']);
  J(res, 200, out);
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return J(res, 204, {});
    const q = new URL(req.url, 'http://x').searchParams, r = String(q.get('r') || '').replace(/^\/+|\/+$/g, '');
    if (r === 'cron') return await cron(req, res);
    if (r === 'context' && req.method === 'GET') {
      const c = await M.context(); if (!c) return J(res, 503, { error: 'context_unavailable' });
      return J(res, 200, { schemaVersion: 1, season: c.season, currentWeek: c.week, availableWeeks: c.weeks, updatedAt: new Date(c.updated || Date.now()).toISOString(), live: M.isLive(c.board), byes: c.board ? c.board.byes : [] }, 'public, s-maxage=20, stale-while-revalidate=10');
    }
    if (r === 'auth/request-code' && req.method === 'POST') { const x = await A.requestCode(req, bodyOf(req)); return J(res, x.status, x.json, 'no-store', x.retryAfter ? { 'Retry-After': x.retryAfter } : null); }
    if (r === 'auth/verify-code' && req.method === 'POST') { const x = await A.verifyCode(req, bodyOf(req)); return J(res, x.status, x.json, 'no-store', x.retryAfter ? { 'Retry-After': x.retryAfter } : null); }
    if (r === 'auth/logout' && req.method === 'POST') { const x = await A.logout(req); return J(res, x.status, x.json); }
    if (r === 'me' && req.method === 'GET') { const a = await A.authenticate(req); return a ? J(res, 200, A.memberOut(a.member)) : J(res, AUTH.status, AUTH.json); }
    if (r === 'access' && req.method === 'GET') { // guard for every future private route: a session may only touch its own teams
      const a = await A.authenticate(req); if (!a) return J(res, 401, AUTH.json);
      const lg = String(q.get('leagueId') || ''), t = Number(q.get('teamId'));
      return A.canAccess(a.member, lg, t) ? J(res, 200, { ok: true, leagueId: lg, teamId: t }) : J(res, 403, { error: 'forbidden' });
    }
    if (r === 'market-movers' && req.method === 'GET') {
      const c = await M.context(); if (!c) return J(res, 503, { error: 'context_unavailable' });
      const hj = async u => { const x = await fetch(u, { headers: { 'User-Agent': 'cfn-mobile' } }); if (!x.ok) throw new Error('http ' + x.status); return x.json(); };
      const cached = await M.rget('mm:cache');
      if (cached && Date.now() - cached.at < 15 * 60000 && cached.week === c.week) return J(res, 200, cached.body, 'public, s-maxage=300, stale-while-revalidate=600');
      const m = await MV.compute(req.headers.host, c.week, hj);
      if (!m.ok) { if (cached) return J(res, 200, Object.assign({}, cached.body, { stale: true }), 'public, s-maxage=60'); return J(res, 503, { error: m.error || 'unavailable' }); }
      await M.rset('mm:cache', { at: Date.now(), week: c.week, key: m.key, body: m.body }, 86400);
      return J(res, 200, m.body, 'public, s-maxage=300, stale-while-revalidate=600');
    }
    J(res, 404, { error: 'not_found' });
  } catch (e) { J(res, 500, { error: 'server_error' }); }
};
