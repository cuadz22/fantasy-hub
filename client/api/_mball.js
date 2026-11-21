// Continuous BALLDONTLIE ingestion + Yahoo comparison. Displayed scores stay Yahoo
// until identity, every scoring category, roster timing, and live latency are proven.
'use strict';
const M = require('./_m'), B = require('./_bdl'), S = require('./_scoring'), { nn } = require('./_ids');
const key = (season, week) => 'bdl:' + season + ':' + week;
const active = g => ['in_progress', 'inprogress', 'live'].includes(g.status_state) || /quarter|halftime|^[1-4](st|nd|rd|th)/i.test(g.status || '');
const finished = g => g.status_state === 'final' || /^final/i.test(g.status || '');
const pos = x => x === 'PK' ? 'K' : x;
async function collect() {
  const started = Date.now(), signal = AbortSignal.timeout(45000);
  const c = await M.context({ cachedOnly: true });
  if (!c || c.season !== M.SEASON) throw new Error('calendar_unavailable');
  const prefix = key(c.season, c.week), prior = await M.read(prefix + ':health');
  // During games collect twice per minute; between games recheck final corrections hourly.
  if (!M.isLive(c.board) && !M.soon(c.board) && prior?.ok && started - prior.checkedAt < 5 * 60000) return { skipped: 'outside_game_window', week: c.week };
  const games = await B.all('games', { seasons: [c.season], weeks: [c.week] }, { signal, maxPages: 3 });
  if (!games.length || games.some(g => g.season !== c.season || g.week !== c.week || g.postseason)) throw new Error('bdl_invalid_schedule');
  await M.write(prefix + ':schedule', { observedAt: Date.now(), games }, 0);
  const due = games.filter(g => active(g) || finished(g) || Date.parse(g.date) <= Date.now() + 5 * 60000);
  const results = []; let index = 0;
  await Promise.all(Array.from({ length: Math.min(4, due.length) }, async () => {
    while (index < due.length && !signal.aborted) {
      const game = due[index++];
      try {
        const previous = await M.read(prefix + ':game:' + game.id);
        if (finished(game) && previous && previous.game.status === game.status && Date.now() - previous.observedAt < 3600000) { results.push({ gameId: game.id, ok: true, cached: true }); continue; }
        results.push(await ingestGame(game, prefix, signal));
      } catch (e) { results.push({ gameId: game.id, ok: false, error: String(e.message).slice(0, 80) }); }
    }
  }));
  for (const g of due.slice(index)) results.push({ gameId: g.id, ok: false, error: 'collector_deadline' });
  if (games.some(active) && Date.now() - started < 18000) {
    await M.sleep(15000);
    for (const g of games.filter(active)) {
      if (signal.aborted || Date.now() - started > 38000) break;
      try { await ingestGame(g, prefix, signal); } catch (e) { results.push({ gameId: g.id, ok: false, error: String(e.message).slice(0, 80) }); }
    }
  }
  const comparison = await compare(c, games, started + 50000);
  const health = { ok: results.every(r => r.ok), checkedAt: Date.now(), season: c.season, week: c.week, mode: 'shadow', games: results, comparison, ms: Date.now() - started };
  await M.write(prefix + ':health', health, 0);
  if (!health.ok) throw new Error('bdl_partial_collection');
  return health;
}
async function ingestGame(game, prefix, signal) {
  // Full cumulative snapshots, including re-reading plays: corrections can remove
  // or alter a prior event. Never add a touchdown twice after a retry.
  const [stats, teamStats, plays] = await Promise.all([
    B.all('stats', { game_ids: [game.id] }, { signal }),
    B.all('team_stats', { game_ids: [game.id] }, { signal }),
    B.all('plays', { game_id: game.id }, { signal })
  ]);
  if (stats.some(s => s.game?.id !== game.id || !s.player?.id) || teamStats.some(s => s.game?.id !== game.id) || plays.some(p => p.game?.id !== game.id || !p.id)) throw new Error('bdl_wrong_game');
  if (finished(game) && (!stats.length || teamStats.length !== 2 || !plays.length)) throw new Error('bdl_empty_final');
  const observedAt = Date.now(), snapshot = { schemaVersion: 1, game, observedAt, stats, teamStats, plays, revision: M.sha(JSON.stringify([stats, teamStats, plays])) };
  await M.write(prefix + ':game:' + game.id, snapshot, 0);
  return { gameId: game.id, ok: true, observedAt, stats: stats.length, plays: plays.length };
}
async function compare(c, games, deadline = Date.now() + 15000) {
  const checkTime = () => { if (Date.now() > deadline) throw new Error('comparison_deadline'); };
  const byName = new Map(), snapshots = [];
  for (const g of games) {
    checkTime();
    const snap = await M.read(key(c.season, c.week) + ':game:' + g.id); if (!snap) continue;
    snapshots.push(snap);
    for (const s of snap.stats) {
      const k = nn(s.player.first_name + ' ' + s.player.last_name) + '|' + pos(s.player.position_abbreviation) + '|' + M.canon(s.team.abbreviation);
      const entries = byName.get(k) || []; entries.push({ stat: s, snapshot: snap }); byName.set(k, entries);
    }
  }
  const summary = { matched: 0, unmapped: 0, ambiguous: 0, knownSubtotalMatches: 0, knownSubtotalDifferences: 0, fullyVerified: 0, readyForLiveScoring: false };
  for (const lg of M.LGS) {
    checkTime();
    const rec = await M.read('mw:' + lg + ':' + c.week); if (!rec) continue;
    const rows = [];
    for (const m of rec.matchups) for (const [tid, lineup] of [[m.ia, m.L], [m.ib, m.R]]) for (const r of lineup) {
      if (['BN', 'IR'].includes(r[0]) || r[5] == null) continue;
      const k = nn(r[1]) + '|' + pos(r[2]) + '|' + M.canon(r[3]), found = byName.get(k) || [];
      if (found.length !== 1) { summary[found.length ? 'ambiguous' : 'unmapped']++; rows.push({ teamId: tid, name: r[1], status: found.length ? 'ambiguous' : 'unmapped' }); continue; }
      const { stat, snapshot } = found[0], normalized = S.normalize(stat, snapshot.plays), scored = S.score(lg, normalized.stats);
      const supportedPosition = ['QB', 'RB', 'WR', 'TE'].includes(r[2]);
      summary.matched++;
      const difference = supportedPosition ? S.round(scored.knownSubtotal - r[5]) : null;
      if (difference !== null) summary[Math.abs(difference) < .02 ? 'knownSubtotalMatches' : 'knownSubtotalDifferences']++;
      rows.push({ teamId: tid, name: r[1], bdlPlayerId: stat.player.id, gameId: stat.game.id, yahooPoints: r[5], knownSubtotal: supportedPosition ? scored.knownSubtotal : null, difference, missing: supportedPosition ? scored.missing : ['kicker_or_defense_not_validated'], assumptions: normalized.assumptions, eligible: false, bdlObservedAt: snapshot.observedAt });
    }
    await M.write(key(c.season, c.week) + ':comparison:' + lg, { at: Date.now(), league: lg, rulesVersion: S.version, rosterObservedAt: rec.sourceUpdatedAt, rows }, 0);
  }
  return summary;
}
module.exports = { collect, ingestGame, compare, active, finished };
