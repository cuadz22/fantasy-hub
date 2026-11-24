'use strict';
// CFN's week boundary is independent of a provider's default scoreboard week.
// Explicit season calendar: Week 2 opens Tuesday September 15 at 03:00 Eastern.
// Evaluate local wall time so daylight saving changes never move the cutoff.
const POLICY = 'tuesday-0300-america-new_york-v1';
function scheduledWeek(season, now = Date.now()) {
  if (season !== 2026) throw Error('season_calendar_unconfigured');
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(now)).map(x => [x.type, x.value]));
  const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour);
  return Math.max(1, Math.min(18, 2 + Math.floor((local - Date.UTC(2026, 8, 15, 3)) / (7 * 86400000))));
}
function validWeek(rec, league, week, season) {
  if (!rec || rec.lg !== league || rec.week !== week || rec.season !== season || rec.partial || rec.matchups?.length !== 6) return false;
  const ids = rec.matchups.flatMap(m => [m.ia, m.ib]);
  return new Set(ids).size === 12 && ids.every(id => Number.isInteger(id) && id >= 1 && id <= 12) && rec.matchups.every(m => m.L?.length >= 8 && m.R?.length >= 8 && [m.ya?.[0], m.yb?.[0]].every(Number.isFinite));
}
function completed(board, now = Date.now()) {
  return !!board && !board.stale && board.games?.length > 0 && board.games.every(g => g.state === 'post' && Date.parse(g.start) < now);
}
// One Yahoo fetch per pass keeps this resumable inside the server's time limit.
// All four leagues are prepared before the shared current-week pointer changes.
async function advance(M, current, prepare, now = Date.now()) {
  const desired = scheduledWeek(M.SEASON, now), next = current.week + 1;
  if (desired <= current.week) return { state: 'current', desiredWeek: desired };
  const closed = await M.getBoard(current.week, 60);
  if (!completed(closed, now)) return { state: 'waiting_for_final_games', desiredWeek: desired, closingWeek: current.week };
  for (const league of M.LGS) {
    const old = await M.read(`mw:${league}:${current.week}`);
    if (!validWeek(old, league, current.week, M.SEASON) || !old.final) {
      await prepare(league, current.week, { final: true, force: true });
      const saved = await M.read(`mw:${league}:${current.week}`);
      if (!validWeek(saved, league, current.week, M.SEASON) || !saved.final) throw Error('rollover_invalid_final_' + league);
      return { state: 'preparing', prepared: league, closingWeek: current.week, desiredWeek: desired };
    }
    const upcoming = await M.read(`mw:${league}:${next}`);
    if (!validWeek(upcoming, league, next, M.SEASON) || upcoming.upcoming || now - upcoming.fetchedAt > 3600000) {
      await prepare(league, next, {});
      const saved = await M.read(`mw:${league}:${next}`);
      if (!validWeek(saved, league, next, M.SEASON)) throw Error('rollover_invalid_upcoming_' + league);
      return { state: 'preparing', prepared: league, openingWeek: next, desiredWeek: desired };
    }
  }
  const board = await M.getBoard(next, 0);
  if (!board || board.stale || board.week !== next || board.season !== M.SEASON) throw Error('rollover_next_scoreboard_unavailable');
  // Validate official records before publishing. Legacy archives predate season.
  for (const league of M.LGS) {
    const weeks = await Promise.all(Array.from({length: Math.min(next - 1, 14)}, async (_, i) => {
      const r = await M.read(`mw:${league}:${i + 1}`);
      if (r && r.season == null && new Date(r.sourceUpdatedAt).getUTCFullYear() === M.SEASON) return {...r, season: M.SEASON};
      return r;
    }));
    require('./_mstandings').compute({league, season: M.SEASON, currentWeek: next, weeks});
  }
  const out = {...board, done: false, rolloverPolicy: POLICY};
  // mb:cur is the single publication point. Do not delete caches or historical data.
  await M.write('mb:cur', out, 30 * 86400);
  await M.write('mc:ctx', {week: next, season: M.SEASON, updated: out.sourceUpdatedAt}, 30 * 86400);
  await M.write(`week-rollover:${M.SEASON}:${next}`, {from: current.week, to: next, at: now, policy: POLICY});
  return {state: 'advanced', from: current.week, week: next, desiredWeek: desired};
}
module.exports = {POLICY, scheduledWeek, validWeek, completed, advance};
