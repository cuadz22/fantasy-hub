// Continuous BALLDONTLIE ingestion, scoring and reconciliation. Publication is
// separately controlled and requires verified per-player coverage and freshness.
'use strict';
const M = require('./_m'), B = require('./_bdl'), S = require('./_scoring'), { nn } = require('./_ids');
const key = (season, week) => 'bdl:' + season + ':' + week;
const active = g => ['in_progress', 'inprogress', 'live'].includes(g.status_state) || /quarter|halftime|^[1-4](st|nd|rd|th)/i.test(g.status || '');
const finished = g => g.status_state === 'final' || /^final/i.test(g.status || '');
const pos = x => x === 'PK' ? 'K' : x;
async function collect({ force = false } = {}) {
  const started = Date.now(), signal = AbortSignal.timeout(52000);
  const c = await M.context({ cachedOnly: true });
  if (!c || c.season !== M.SEASON) throw new Error('calendar_unavailable');
  const prefix = key(c.season, c.week), prior = await M.read(prefix + ':health');
  // During games collect at ~15-second offsets within one minute job;
  // between games recheck final corrections hourly.
  if (!force && !M.isLive(c.board) && !M.soon(c.board) && prior?.ok && !prior.live && !(prior.nextStartAt && prior.nextStartAt - started < 25 * 60000 && started - prior.nextStartAt < 8 * 3600000) && started - prior.checkedAt < 5 * 60000) return { skipped: 'outside_game_window', week: c.week };
  const games = await B.all('games', { seasons: [c.season], weeks: [c.week] }, { signal, maxPages: 3 });
  if (!games.length || games.some(g => g.season !== c.season || g.week !== c.week || g.postseason)) throw new Error('bdl_invalid_schedule');
  await M.write(prefix + ':schedule', { observedAt: Date.now(), games }, 0);
  const due = games.filter(g => active(g) || finished(g) || Date.parse(g.date) <= Date.now() + 5 * 60000);
  const results = [], persisted = new Map(); let index = 0;
  await Promise.all(Array.from({ length: Math.min(4, due.length) }, async () => {
    while (index < due.length && !signal.aborted) {
      const game = due[index++];
      try {
        const previous = !force && finished(game) ? await M.read(prefix + ':game:' + game.id) : null;
        if (!force && finished(game) && previous && previous.game.status === game.status && Date.now() - previous.observedAt < 3600000) { persisted.set(game.id, previous); results.push({ gameId: game.id, ok: true, cached: true }); continue; }
        results.push(await ingestGame(game, prefix, signal, persisted));
      } catch (e) { results.push({ gameId: game.id, ok: false, error: String(e.message).slice(0, 80) }); }
    }
  }));
  for (const g of due.slice(index)) results.push({ gameId: g.id, ok: false, error: 'collector_deadline' });
  let publication = await publishStored(c, games, persisted);
  for (const offset of [15000, 30000, 45000]) {
    if (!games.some(active) || signal.aborted || Date.now() - started > 44000) break;
    if (Date.now() - started > offset + 2000) continue;
    const wait = started + offset - Date.now(); if (wait > 0) await M.sleep(wait);
    // Reuse only this pass: other games must still pick up stored corrections.
    const passSnapshots = new Map(), live = games.filter(active); let next = 0;
    await Promise.all(Array.from({length: Math.min(4, live.length)}, async () => {
      while (next < live.length && !signal.aborted && Date.now() - started < 49000) {
        const g = live[next++];
        try { await ingestGame(g, prefix, signal, passSnapshots); } catch(e) { results.push({gameId:g.id,ok:false,error:String(e.message).slice(0,80)}); }
      }
    }));
    publication = await publishStored(c, games, passSnapshots);
  }
  const comparison = await compare(c, games, started + 55000);
  const upcoming = games.filter(g=>!finished(g)&&!active(g)).map(g=>Date.parse(g.date)).filter(Number.isFinite);
  const nextStartAt = upcoming.length ? Math.min(...upcoming) : null;
  const health = { ok: results.every(r => r.ok), checkedAt: Date.now(), season: c.season, week: c.week, mode: 'guarded-capable', live: games.some(active), nextStartAt, games: results, publication, comparison, ms: Date.now() - started };
  await M.write(prefix + ':health', health, 0);
  if (!health.ok) throw new Error('bdl_partial_collection');
  return health;
}
async function ingestGame(game, prefix, signal, persisted) {
  // Full cumulative snapshots, including re-reading plays: corrections can remove
  // or alter a prior event. Never add a touchdown twice after a retry.
  const [stats, teamStats, plays] = await Promise.all([
    B.all('stats', { game_ids: [game.id] }, { signal }),
    B.all('team_stats', { game_ids: [game.id] }, { signal }),
    B.all('plays', { game_id: game.id }, { signal })
  ]);
  if (stats.some(s => s.game?.id !== game.id || !s.player?.id) || teamStats.some(s => s.game?.id !== game.id) || plays.some(p => p.game?.id !== game.id || !p.id)) throw new Error('bdl_wrong_game');
  if (finished(game) && (!stats.length || teamStats.length !== 2 || !plays.length)) throw new Error('bdl_empty_final');
  const observedAt = Date.now();
  // The plays response may be newer than the schedule fetched at the start of
  // the job. Use its game metadata; scoring still checks box/play agreement.
  const latestGame = plays.length && plays[plays.length - 1].game || game;
  const snapshot = { schemaVersion: 1, game: latestGame, observedAt, stats, teamStats, plays, revision: M.sha(JSON.stringify([stats, teamStats, plays])) };
  await M.write(prefix + ':game:' + game.id, snapshot, 0);
  // Only successfully persisted data can bypass the immediate read-back.
  if (persisted) persisted.set(game.id, snapshot);
  return { gameId: game.id, ok: true, observedAt, stats: stats.length, plays: plays.length };
}
async function publishStored(c, games, persisted = new Map()) {
  const snapshots = (await Promise.all(games.map(g => persisted.has(g.id) ? persisted.get(g.id) : M.read(key(c.season,c.week)+':game:'+g.id)))).filter(Boolean);
  return require('./_mscores').publish(c, snapshots);
}
async function compare(c, games, deadline = Date.now() + 15000) {
  const summary = { matched: 0, unmapped: 0, ineligible: 0, exactMatches: 0, differences: 0, readyForLiveScoring: false, scoringVersion: S.version };
  const P = require('./_mscores');
  for (const lg of M.LGS) {
    if (Date.now() > deadline) throw new Error('comparison_deadline');
    const [rec, bundle] = await Promise.all([M.read('mw:' + lg + ':' + c.week), M.read(P.key(c.season,c.week,lg))]);
    if (!rec || !bundle) continue;
    const rows = [];
    for (const m of rec.matchups) for (const [tid,lineup] of [[m.ia,m.L],[m.ib,m.R]]) for (const r of lineup) {
      if (P.reserve(r) || r[5] == null) continue;
      const e = bundle.entries[P.identity(r)];
      if (!e) { summary.unmapped++; continue; }
      if (!Number.isFinite(e.points)) summary.ineligible++;
      else { summary.matched++; summary[Math.abs(e.points-r[5]) < .02 ? 'exactMatches' : 'differences']++; }
      rows.push({ teamId:tid,name:r[1],providerId:e.providerId,gameId:e.gameId,yahooPoints:r[5],bdlPoints:e.points,difference:Number.isFinite(e.points)?S.round(e.points-r[5]):null,missing:e.missing,eligible:Number.isFinite(e.points),bdlObservedAt:e.observedAt });
    }
    await M.write(key(c.season,c.week)+':comparison:'+lg, { at:Date.now(),league:lg,rulesVersion:S.version,rosterObservedAt:rec.sourceUpdatedAt,rows });
  }
  // Per-entry eligibility is not a claim that every lineup or live window is proven.
  return summary;
}

module.exports = { collect, ingestGame, compare, publishStored, active, finished };
