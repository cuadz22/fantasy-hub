// Shared helpers for the iPhone app backend (/api/mobile/*) and the cached weekly lineups.
'use strict';
const crypto = require('crypto');
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL, TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const LGS = ['gl', 'bh', 'rb', 'sts'];
// These Yahoo league IDs belong to the 2026 season. Never silently reuse them next year.
const SEASON = 2026;
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Strict commands distinguish an unavailable store from an absent value. Reads used
// for optional decorations may fall back; writes and job coordination must fail loudly.
async function command(cmd, ms = 2500) {
  if (!URL_ || !TOKEN) throw new Error('storage_unconfigured');
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd), signal: ctl.signal });
    if (!r.ok) throw new Error('storage_http_' + r.status);
    const j = await r.json(); if (j.error || !Object.prototype.hasOwnProperty.call(j, 'result')) throw new Error('storage_command_failed');
    return j.result;
  } catch (e) { throw new Error(e.name === 'AbortError' ? 'storage_timeout' : e.message); }
  finally { clearTimeout(tm); }
}
async function rc(cmd, ms) { try { return await command(cmd, ms); } catch { return null; } }
async function read(key, ms) { const v = await command(['GET', key], ms); return v == null ? null : JSON.parse(v); }
async function rget(key, ms) { try { return await read(key, ms); } catch { return null; } }
async function rset(key, obj, exSec, ms) { const c = ['SET', key, JSON.stringify(obj)]; if (exSec) c.push('EX', exSec); return (await rc(c, ms || 4000)) === 'OK'; }
async function write(key, obj, exSec = 0) { if (!(await rset(key, obj, exSec))) throw new Error('storage_write_failed'); return obj; }
async function lock(key, seconds = 80) { const token = crypto.randomUUID(); return await command(['SET', key, token, 'NX', 'EX', seconds]) === 'OK' ? token : null; }
async function unlock(key, token) { return command(['EVAL', "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end", 1, key, token]); }

// ---- NFL calendar and scoreboard (ESPN public scoreboard; one request covers clock, score and possession) ----
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const ABB = { WSH: 'WAS', LAR: 'LA', LVR: 'LV', JAC: 'JAX', KAN: 'KC', NOR: 'NO', SFO: 'SF', TAM: 'TB', GBP: 'GB', NEP: 'NE', KCC: 'KC', TBB: 'TB', SDG: 'LAC', STL: 'LA' }; // canonical uppercase, matching the abbreviations Yahoo shows in lineups
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
  // Re-read finished games daily so official corrections can propagate.
  if (rec && rec.done && now - rec.fetchedAt < 86400000) return rec;
  if (rec && now - rec.fetchedAt <= (maxAgeS === undefined ? 20 : maxAgeS) * 1000) return rec;
  try {
    const j = await jfetch(week ? ESPN + '?dates=' + SEASON + '&seasontype=2&week=' + week : ESPN, 6000), b = parseBoard(j);
    if (b.season !== SEASON || !b.week || (week && b.week !== week) || !b.games.length) throw new Error('empty scoreboard');
    const allDone = b.games.every(g => g.state === 'post');
    const out = Object.assign(b, { fetchedAt: now, sourceUpdatedAt: now, done: !!week && allDone });
    await rset(key, out, week && allDone ? 0 : 30 * 86400);
    return out;
  } catch (e) { if (rec) return Object.assign({}, rec, { stale: true, error: String(e.message || e).slice(0, 80) }); return null; }
}
const isLive = b => !!b && b.games.some(g => g.state === 'in');
const soon = b => !!b && b.games.some(g => g.state === 'pre' && Date.parse(g.start) - Date.now() < 25 * 60000 && Date.parse(g.start) - Date.now() > -60000);

// ---- context: season, current week, and which weeks have stored data ----
async function context(options = {}) {
  let b = options.cachedOnly ? await rget('mb:cur') : await getBoard(null, 120);
  if (b && Date.now() - b.fetchedAt > 5 * 60000) b = { ...b, stale: true };
  let week = b && b.week, season = b && b.season, updated = b && b.sourceUpdatedAt;
  if (!week) { const c = await rget('mc:ctx'); if (c) { week = c.week; season = c.season; updated = c.updated; } }
  if (!week) return null;
  await rset('mc:ctx', { week, season, updated }, 30 * 86400);
  const h = (await rc(['HGETALL', 'mw:avail'])) || [], have = {};
  for (let i = 0; i + 1 < h.length; i += 2) { const [lg, w] = h[i].split(':'); (have[w] = have[w] || {})[lg] = h[i + 1]; }
  const weeks = [];
  for (let w = 1; w <= 14; w++) { const x = have[w] || {}; if (w === week ? Object.keys(x).length >= 1 : LGS.every(l => x[l])) weeks.push(w); }
  return { season, week, weeks, updated, stale: !b || !!b.stale, board: b };
}

// ---- stored weekly lineups ----
function mkOrig(matchups) { const o = {}; matchups.forEach(m => { m.L.forEach(r => { if (r[4] != null) o[m.ia + '|' + r[1]] = r[4]; }); m.R.forEach(r => { if (r[4] != null) o[m.ib + '|' + r[1]] = r[4]; }); }); return o; }
const RK = (lg, w) => 'mw:' + lg + ':' + w;
async function saveWeek(lg, week, matchups, partial, opts) {
  opts = opts || {}; const now = Date.now(), old = await read(RK(lg, week));
  if (old && old.final && !opts.force) return old; // finished weeks are never overwritten
  if (partial && old && !old.partial) { await noteFail(lg, week, 'partial_roster'); return old; } // never replace a complete read with a short one
  const orig = opts.final && !(old && old.orig) ? null : Object.assign(mkOrig(matchups), (old && old.orig) || {}); // first projection captured for each player this week
  const rec = { season: SEASON, lg, week, matchups, partial: !!partial, fetchedAt: now, sourceUpdatedAt: now, lastAttemptAt: now, lastError: null, final: !!opts.final && !partial, upcoming: !!opts.upcoming, orig };
  await write(RK(lg, week), rec, 0);
  if (!partial) await command(['HSET', 'mw:avail', lg + ':' + week, String(now)]);
  await rc(['DEL', 'mw:error:' + lg + ':' + week]);
  if (rec.final) await command(['HSET', 'mw:final', lg + ':' + week, String(now)]);
  // Await durable backups; serverless runtimes may stop after the response.
  const lastBackup = await rget('mw:backup:' + lg + ':' + week);
  if (rec.final || !lastBackup || now - lastBackup.at > 15 * 60000) {
    if (await backup(rec)) await rset('mw:backup:' + lg + ':' + week, { at: now }, 0);
  }
  return rec;
}
async function noteFail(lg, week, err) {
  // Failure metadata is separate: a slow failing request cannot roll back good scores.
  await write('mw:error:' + lg + ':' + week, { at: Date.now(), error: String(err || 'fetch_failed').slice(0, 100) }, 86400);
}
async function backup(rec) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return false;
  try {
    const { put } = require('@vercel/blob');
    await put('mobile/weeks/' + SEASON + '/' + rec.lg + '-' + rec.week + '.json', JSON.stringify(rec), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', abortSignal: AbortSignal.timeout(5000) });
    return true;
  } catch { console.error(JSON.stringify({ event: 'weekly_backup_failed', league: rec.lg, week: rec.week })); return false; }
}
async function restore(lg, week) {
  try { const { get } = require('@vercel/blob'); let r = await get('mobile/weeks/' + SEASON + '/' + lg + '-' + week + '.json', { access: 'private', useCache: false, abortSignal: AbortSignal.timeout(3500) }); if (!r || r.statusCode !== 200 || !r.stream) r = await get('mobile/weeks/' + lg + '-' + week + '.json', { access: 'private', useCache: false, abortSignal: AbortSignal.timeout(3500) }); if (!r || r.statusCode !== 200 || !r.stream) return null; const rec = JSON.parse(await new Response(r.stream).text()); if (rec && rec.lg === lg && rec.week === week && (!rec.season || rec.season === SEASON) && rec.matchups) { await rset(RK(lg, week), rec, 0); await rc(['HSET', 'mw:avail', lg + ':' + week, String(rec.fetchedAt)]); return rec; } } catch (e) {}
  return null;
}
const statusClean = s => String(s || '').replace(/&#?\w*;?\s*$/, '').trim();
// Games by canonical team code (live or final only).
function gamesByTeam(board) { const o = {}; if (board) board.games.forEach(g => { if (g.state === 'in' || g.state === 'post') { o[g.homeTeam] = g; o[g.awayTeam] = g; } }); return o; }
// Yahoo's own clock text is a little ahead of the scoreboard, so a live game shows Yahoo's clock when its status carries one; score and possession stay from the scoreboard.
function periodFor(g) { return g.period; } // clock, score and possession share one provider snapshot
function gameObj(g, status) { return { period: periodFor(g, status), homeTeam: g.homeTeam, awayTeam: g.awayTeam, homeScore: g.homeScore, awayScore: g.awayScore, possessionTeam: g.possessionTeam }; }
// Row decoration: canonical team code, cleaned status, optional ninth item with the live game.
function decorate(rec, board) {
  const byTeam = gamesByTeam(board);
  const fix = r => {
    const t = canon(r[3]), st = statusClean(r[6]), o = [r[0], r[1], r[2], t, r[4], r[5], st, r[7] || ''], g = byTeam[t];
    if (g) {
      const go = gameObj(g, st);
      if (!o[6]) o[6] = go.period + ', ' + (t === g.homeTeam ? g.homeScore + '-' + g.awayScore + ' vs ' + g.awayTeam : g.awayScore + '-' + g.homeScore + ' @ ' + g.homeTeam);
      o.push(go);
    }
    return o;
  };
  return rec.matchups.map(m => Object.assign({}, m, { L: m.L.map(fix), R: m.R.map(fix) }));
}
// Freshness thresholds: a live read older than 3 minutes is stale; outside games, older than 45 minutes.
function staleAfterS(live) { return live ? 180 : 2700; }
async function serveRaw(lg, week, ctx) {
  let rec, storageError;
  try { rec = await read(RK(lg, week)); } catch (e) { storageError = e; }
  if (!rec) rec = await restore(lg, week);
  if (!rec && storageError) throw storageError;
  if (!rec) return null;
  const board = ctx && week === ctx.week ? ctx.board : await rget('mb:' + week);
  const failure = await rget('mw:error:' + lg + ':' + week);
  if (failure && failure.at >= rec.fetchedAt) rec = Object.assign({}, rec, { lastError: failure.error, lastAttemptAt: failure.at });
  const age = Math.round((Date.now() - rec.fetchedAt) / 1000), live = ctx ? week === ctx.week && isLive(ctx.board) : isLive(board);
  const stale = rec.final ? false : age > (rec.upcoming ? 36 * 3600 : staleAfterS(live)) || !!rec.lastError && age > 120;
  const sv = {
    lg, week, season: rec.season || SEASON, scoreSource: 'yahoo', rosterSource: 'yahoo', at: new Date(rec.fetchedAt).toISOString(), partial: !!rec.partial, matchups: decorate(rec, board),
    fetchedAt: new Date(rec.fetchedAt).toISOString(), sourceUpdatedAt: new Date(rec.sourceUpdatedAt).toISOString(), cacheAgeSeconds: age,
    stale, final: !!rec.final, scoreboardUpdatedAt: board ? new Date(board.sourceUpdatedAt).toISOString() : null, scoreboardStale: !!(board && (board.stale || (isLive(board) && Date.now() - board.fetchedAt > 90000))),
    lastError: rec.lastError || undefined, upcoming: rec.upcoming || undefined
  };
  return { sv, rec, board };
}
async function serveWeek(lg, week, ctx) { const r = await serveRaw(lg, week, ctx); return r && r.sv; }
// A past week is final once the current NFL week has moved past it and its last game started at least 8 hours before this read.
async function finalEligible(week, ctx) {
  if (!ctx || week >= ctx.week) return false;
  const b = await getBoard(week, 3600); if (!b || !b.lastStart || !b.games.every(g => g.state === 'post')) return false;
  return Date.now() - b.lastStart > 8 * 3600000;
}
module.exports = { SEASON, command, read, write, lock, unlock, backup, serveRaw, gamesByTeam, gameObj, statusClean, mkOrig, finalEligible, LGS, sha, sleep, rc, rget, rset, canon, getBoard, parseBoard, isLive, soon, context, saveWeek, noteFail, serveWeek, decorate, restore, jfetch };
