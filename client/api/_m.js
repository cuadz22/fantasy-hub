// Shared helpers for the iPhone app backend (/api/mobile/*) and the cached weekly lineups.
'use strict';
const crypto = require('crypto');
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL, TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const LGS = ['gl', 'bh', 'rb', 'sts'];
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Storage trouble must never take the site down: every call is time-boxed and returns null on failure.
async function rc(cmd, ms) {
  if (!URL_ || !TOKEN) return null;
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), ms || 2500);
  try { const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd), signal: ctl.signal }); const j = await r.json(); return j.error ? null : j.result; }
  catch (e) { return null; } finally { clearTimeout(tm); }
}
async function rget(key) { const v = await rc(['GET', key]); if (v == null) return null; try { return JSON.parse(v); } catch (e) { return null; } }
async function rset(key, obj, exSec) { const c = ['SET', key, JSON.stringify(obj)]; if (exSec) c.push('EX', exSec); return (await rc(c, 4000)) === 'OK'; }

// ---- NFL calendar and scoreboard (ESPN public scoreboard; one request covers clock, score and possession) ----
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const ABB = { WSH: 'WAS', LAR: 'LA', LVR: 'LV', JAC: 'JAX', KAN: 'KC', NOR: 'NO', SFO: 'SF', TAM: 'TB', GBP: 'GB', NEP: 'NE', SDG: 'LAC', STL: 'LA' }; // canonical uppercase, matching the abbreviations Yahoo shows in lineups
const canon = t => { t = String(t || '').toUpperCase().trim(); return ABB[t] || t; };
async function jfetch(url, ms) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms || 6000);
  try { const r = await fetch(url, { headers: { 'User-Agent': 'cfn-site', Accept: 'application/json' }, signal: ac.signal }); if (!r.ok) throw new Error('http ' + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}
const toNum = x => { const n = Number(x); return x === '' || x == null || !isFinite(n) ? null : n; };
function parseBoard(j) {
  const games = []; let lastStart = 0;
  (j.events || []).forEach(e => {
    const c = e.competitions && e.competitions[0]; if (!c) return;
    const home = c.competitors.find(x => x.homeAway === 'home'), away = c.competitors.find(x => x.homeAway === 'away'); if (!home || !away) return;
    const st = (e.status && e.status.type) || {}, state = st.state || 'pre';
    let poss = null;
    if (state === 'in' && c.situation && c.situation.possession != null) { const id = String(c.situation.possession); const t = id === String(home.team.id) ? home : id === String(away.team.id) ? away : null; poss = t ? canon(t.team.abbreviation) : null; }
    let period = null;
    if (state === 'post') period = /OT/i.test(st.shortDetail || '') ? 'Final/OT' : 'Final';
    else if (state === 'in') { if (st.name === 'STATUS_HALFTIME') period = 'Halftime'; else { const p = Number(e.status.period); period = (p > 4 ? 'OT' : 'Q' + p) + ' ' + (e.status.displayClock || ''); period = period.trim(); } }
    games.push({ id: String(e.id), state, period, homeTeam: canon(home.team.abbreviation), awayTeam: canon(away.team.abbreviation), homeScore: state === 'pre' ? null : toNum(home.score), awayScore: state === 'pre' ? null : toNum(away.score), possessionTeam: poss, start: e.date });
    lastStart = Math.max(lastStart, Date.parse(e.date) || 0);
  });
  return { season: j.season && j.season.year, week: j.week && j.week.number, byes: ((j.week && j.week.teamsOnBye) || []).map(t => canon(t.abbreviation)), games, lastStart: lastStart || null };
}
// Board for the current week (key 'cur') or a given week. A failed fetch never advances sourceUpdatedAt; the last good board is returned marked stale.
async function getBoard(week, maxAgeS) {
  const key = 'mb:' + (week || 'cur'), now = Date.now();
  const rec = await rget(key);
  if (rec && rec.done) return rec; // a finished week's board never changes
  if (rec && now - rec.fetchedAt <= (maxAgeS === undefined ? 20 : maxAgeS) * 1000) return rec;
  try {
    const j = await jfetch(week ? ESPN + '?seasontype=2&week=' + week : ESPN, 6000), b = parseBoard(j);
    if (!b.week || !b.games.length) throw new Error('empty scoreboard');
    const allDone = b.games.every(g => g.state === 'post');
    const out = Object.assign(b, { fetchedAt: now, sourceUpdatedAt: now, done: !!week && allDone });
    await rset(key, out, week && allDone ? 0 : 6 * 3600);
    return out;
  } catch (e) { if (rec) return Object.assign({}, rec, { stale: true, error: String(e.message || e).slice(0, 80) }); return null; }
}
const isLive = b => !!b && b.games.some(g => g.state === 'in');
const soon = b => !!b && b.games.some(g => g.state === 'pre' && Date.parse(g.start) - Date.now() < 25 * 60000 && Date.parse(g.start) - Date.now() > -60000);

// ---- context: season, current week, and which weeks have stored data ----
async function context() {
  const b = await getBoard(null, 120);
  let week = b && b.week, season = b && b.season, updated = b && b.sourceUpdatedAt;
  if (!week) { const c = await rget('mc:ctx'); if (c) { week = c.week; season = c.season; updated = c.updated; } }
  if (!week) return null;
  await rset('mc:ctx', { week, season, updated }, 30 * 86400);
  const h = (await rc(['HGETALL', 'mw:avail'])) || [], have = {};
  for (let i = 0; i + 1 < h.length; i += 2) { const [lg, w] = h[i].split(':'); (have[w] = have[w] || {})[lg] = h[i + 1]; }
  const weeks = [];
  for (let w = 1; w <= Math.min(week, 14); w++) { const x = have[w] || {}; if (w === week ? Object.keys(x).length >= 1 : LGS.every(l => x[l])) weeks.push(w); }
  return { season, week, weeks, updated, board: b };
}

// ---- stored weekly lineups ----
const RK = (lg, w) => 'mw:' + lg + ':' + w;
async function saveWeek(lg, week, matchups, partial, opts) {
  opts = opts || {}; const now = Date.now(), old = await rget(RK(lg, week));
  if (old && old.final && !opts.force) return old; // finished weeks are never overwritten
  if (partial && old && !old.partial) return old; // never replace a complete read with a short one
  const rec = { lg, week, matchups, partial: !!partial, fetchedAt: now, sourceUpdatedAt: now, lastAttemptAt: now, lastError: null, final: !!opts.final && !partial };
  await rset(RK(lg, week), rec, rec.final ? 0 : 21 * 86400);
  if (!partial) await rc(['HSET', 'mw:avail', lg + ':' + week, String(now)]);
  if (rec.final) { await rc(['HSET', 'mw:final', lg + ':' + week, String(now)]); backup(rec); }
  return rec;
}
async function noteFail(lg, week, err) { const old = await rget(RK(lg, week)); if (!old) return; old.lastAttemptAt = Date.now(); old.lastError = String(err || 'fetch failed').slice(0, 100); await rset(RK(lg, week), old, old.final ? 0 : 21 * 86400); }
async function backup(rec) { // durable copy of finished weeks outside Redis
  try { const { put } = require('@vercel/blob'); await put('mobile/weeks/' + rec.lg + '-' + rec.week + '.json', JSON.stringify(rec), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' }); } catch (e) {}
}
async function restore(lg, week) {
  try { const { get } = require('@vercel/blob'); const r = await get('mobile/weeks/' + lg + '-' + week + '.json', { access: 'private', useCache: false }); if (!r || r.statusCode !== 200 || !r.stream) return null; const rec = JSON.parse(await new Response(r.stream).text()); if (rec && rec.matchups) { await rset(RK(lg, week), rec, 0); await rc(['HSET', 'mw:avail', lg + ':' + week, String(rec.fetchedAt)]); return rec; } } catch (e) {}
  return null;
}
const statusClean = s => String(s || '').replace(/&#?\w*;?\s*$/, '').trim();
// Row decoration: canonical team code, cleaned status, optional ninth item with the live game.
function decorate(rec, board) {
  const byTeam = {}; if (board) board.games.forEach(g => { if (g.state === 'in' || g.state === 'post') { byTeam[g.homeTeam] = g; byTeam[g.awayTeam] = g; } });
  const fix = r => {
    const t = canon(r[3]), o = [r[0], r[1], r[2], t, r[4], r[5], statusClean(r[6]), r[7] || ''], g = byTeam[t];
    if (g) {
      if (!o[6]) o[6] = g.period + ', ' + (t === g.homeTeam ? g.homeScore + '-' + g.awayScore + ' vs ' + g.awayTeam : g.awayScore + '-' + g.homeScore + ' @ ' + g.homeTeam);
      o.push({ period: g.period, homeTeam: g.homeTeam, awayTeam: g.awayTeam, homeScore: g.homeScore, awayScore: g.awayScore, possessionTeam: g.possessionTeam });
    }
    return o;
  };
  return rec.matchups.map(m => Object.assign({}, m, { L: m.L.map(fix), R: m.R.map(fix) }));
}
// Freshness thresholds: a live read older than 3 minutes is stale; outside games, older than 45 minutes.
function staleAfterS(live) { return live ? 180 : 2700; }
async function serveWeek(lg, week, ctx) {
  let rec = await rget(RK(lg, week)); if (!rec) rec = await restore(lg, week); if (!rec) return null;
  const board = week === ctx.week ? ctx.board : await getBoard(week, 3600);
  const age = Math.round((Date.now() - rec.fetchedAt) / 1000), live = week === ctx.week && isLive(ctx.board);
  const stale = rec.final ? false : age > staleAfterS(live) || !!rec.lastError && age > 120;
  return {
    lg, week, at: new Date(rec.fetchedAt).toISOString(), partial: !!rec.partial, matchups: decorate(rec, board),
    fetchedAt: new Date(rec.fetchedAt).toISOString(), sourceUpdatedAt: new Date(rec.sourceUpdatedAt).toISOString(), cacheAgeSeconds: age,
    stale, final: !!rec.final, scoreboardUpdatedAt: board ? new Date(board.sourceUpdatedAt).toISOString() : null, scoreboardStale: !!(board && (board.stale || (isLive(board) && Date.now() - board.fetchedAt > 90000))),
    lastError: rec.lastError || undefined
  };
}
// A past week is final once the current NFL week has moved past it and its last game started at least 8 hours before this read.
async function finalEligible(week, ctx) {
  if (!ctx || week >= ctx.week) return false;
  const b = await getBoard(week, 3600); if (!b || !b.lastStart || !b.games.every(g => g.state === 'post')) return false;
  return Date.now() - b.lastStart > 8 * 3600000;
}
module.exports = { finalEligible, LGS, sha, sleep, rc, rget, rset, canon, getBoard, parseBoard, isLive, soon, context, saveWeek, noteFail, serveWeek, decorate, restore, jfetch };
