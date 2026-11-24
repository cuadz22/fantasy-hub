// Independent, bounded jobs. No viewer request needs to scrape Yahoo.
'use strict';
const M = require('./_m'), { scrapeLeague } = require('./_lscrape');
const crypto = require('crypto');
function authorized(req) {
  const supplied = String(req.headers.authorization || '');
  const a = crypto.createHash('sha256').update(supplied).digest();
  return [process.env.CRON_SECRET, process.env.MOBILE_OPERATIONS_KEY].filter(Boolean).some(secret => {
    const b = crypto.createHash('sha256').update('Bearer ' + secret).digest();
    return crypto.timingSafeEqual(a, b);
  });
}
async function run(name, work) {
  const key = 'mj:lock:' + name, token = await M.lock(key, 80);
  if (!token) return { status: 200, body: { job: name, skipped: 'already_running' } };
  const startedAt = Date.now();
  try {
    const details = await work();
    const body = { job: name, ok: true, startedAt, completedAt: Date.now(), ...details };
    await M.write('mj:health:' + name, body, 7 * 86400);
    console.log(JSON.stringify({ event: 'mobile_job', job: name, ok: true, ms: Date.now() - startedAt }));
    return { status: 200, body };
  } catch (e) {
    const body = { job: name, ok: false, startedAt, completedAt: Date.now(), error: String(e.message || 'job_failed').slice(0, 100) };
    await M.rset('mj:health:' + name, body, 7 * 86400);
    console.error(JSON.stringify({ event: 'mobile_job', ...body }));
    return { status: 503, body };
  } finally { await M.unlock(key, token).catch(() => {}); }
}
async function refreshLeague(lg, force = false) {
  const c = await M.context({ cachedOnly: true });
  if (!c || c.season !== M.SEASON) throw new Error('calendar_unavailable');
  const old = await M.read('mw:' + lg + ':' + c.week), active = M.isLive(c.board) || M.soon(c.board);
  if (!force && old && !old.partial && Date.now() - old.fetchedAt < (active ? 45000 : 5 * 60000)) return { week: c.week, skipped: 'fresh' };
  try {
    const sc = await scrapeLeague(lg, c.week);
    if (sc.partial || sc.matchups.length !== 6) throw new Error(sc.err || 'incomplete_lineup');
    const saved = await M.saveWeek(lg, c.week, sc.matchups, false, {});
    await require('./lineups').record(lg, c.week, saved.matchups);
    return { week: c.week, sourceUpdatedAt: saved.sourceUpdatedAt, matchups: saved.matchups.length };
  } catch (e) { await M.noteFail(lg, c.week, e.message); throw e; }
}
async function calendar() {
  const R = require('./_weekrollover');
  const old = await M.read('mb:cur') || await M.read('mc:ctx');
  if (old && old.season !== M.SEASON) throw Error('calendar_season_mismatch');
  let b = await M.getBoard(old?.week || null, 0);
  if (!b || b.stale) throw new Error('scoreboard_unavailable');
  b = { ...b, done: false, rolloverPolicy: R.POLICY };
  await M.write('mb:cur', b, 30 * 86400);
  await M.write('mc:ctx', { week: b.week, season: b.season, updated: b.sourceUpdatedAt }, 30 * 86400);
  const rollover = await R.advance(M, b, storeOne);
  if (rollover.state === 'advanced') b = await M.read('mb:cur');
  if (M.isLive(b)) {
    await M.sleep(18000);
    const fresh = await M.getBoard(b.week, 0);
    if (!fresh || fresh.stale) throw new Error('scoreboard_unavailable');
    b = { ...fresh, done: false, rolloverPolicy: R.POLICY };
    await M.write('mb:cur', b, 30 * 86400);
  }
  return { week: b.week, sourceUpdatedAt: b.sourceUpdatedAt, rollover };
}
async function maintenance() {
  const startedAt = Date.now();
  const c = await M.context({ cachedOnly: true }); if (!c) throw new Error('calendar_unavailable');
  const final = Object.fromEntries(pair(await M.command(['HGETALL', 'mw:final'])));
  // Recheck the most recently finished week daily for official stat corrections.
  for (let w = c.week - 1; w >= 1; w--) for (const lg of M.LGS) {
    if (Date.now() - startedAt > 15000) return { deferred: 'maintenance_time_budget' };
    if (final[lg + ':' + w] && (w !== c.week - 1 || Date.now() - Number(final[lg + ':' + w]) < 86400000)) continue;
    if (!(await M.finalEligible(w, c))) continue;
    return storeOne(lg, w, { final: true, force: true });
  }
  const avail = Object.fromEntries(pair(await M.command(['HGETALL', 'mw:avail'])));
  for (let w = c.week + 1; w <= 14; w++) for (const lg of M.LGS) {
    if (Date.now() - Number(avail[lg + ':' + w] || 0) > 86400000) return storeOne(lg, w, { upcoming: true });
  }
  return { skipped: 'nothing_due' };
}
function pair(a) { const out = []; for (let i = 0; i + 1 < a.length; i += 2) out.push([a[i], a[i + 1]]); return out; }
async function storeOne(lg, w, opts) {
  const sc = await scrapeLeague(lg, w); if (sc.partial || sc.matchups.length !== 6) throw new Error('incomplete_lineup_' + lg + '_' + w);
  if (!require('./_weekrollover').validWeek({lg,week:w,season:M.SEASON,matchups:sc.matchups,partial:sc.partial},lg,w,M.SEASON)) throw Error('invalid_week_totals_' + lg + '_' + w);
  await M.saveWeek(lg, w, sc.matchups, false, opts); return { league: lg, week: w };
}
async function health() {
  const c = await M.context({ cachedOnly: true });
  const jobs = ['calendar', ...M.LGS.map(l => 'lineups-' + l), 'ball', 'maintenance', 'portraits', 'push'];
  const jobState = Object.fromEntries(await Promise.all(jobs.map(async name => [name, await M.read('mj:health:' + name)])));
  const leagues = {};
  if (c) for (const lg of M.LGS) {
    const raw = await M.serveRaw(lg, c.week, c), backup = await M.rget('mw:backup:' + lg + ':' + c.week);
    leagues[lg] = raw ? { ageSeconds: raw.sv.cacheAgeSeconds, stale: raw.sv.stale, partial: raw.sv.partial, source: raw.sv.scoreSource, scoring: raw.sv.scoring, backedUpAt: backup && backup.at } : { unavailable: true };
  }
  const ball = c ? await M.rget('bdl:' + c.season + ':' + c.week + ':health') : null;
  return { schemaVersion: 1, currentWeek: c && c.week, calendarStale: !c || c.stale, scoreMode: (await M.rget('scoring:control:' + M.SEASON))?.mode || 'shadow', leagues, ball, jobs: jobState };
}
module.exports = { authorized, run, refreshLeague, calendar, maintenance, health };
