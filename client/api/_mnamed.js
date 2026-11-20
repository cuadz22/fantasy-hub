// Named-field lineups (schemaVersion 2): stable player/team/game IDs, freshness inside the payload, first-captured and live projections.
'use strict';
const M = require('./_m'), I = require('./_ids');
function build(sv, rec, board, season, idmap) {
  const byTeam = M.gamesByTeam(board);
  const player = (r, teamId) => {
    const t = M.canon(r[3]), st = M.statusClean(r[6]), g = byTeam[t], id = I.idFor(idmap, r[1], r[2], r[3]);
    return { playerId: id.id, name: r[1], position: r[2], slot: r[0], nflTeam: t || null, injuryStatus: r[7] || null, gameStatus: st || null, points: r[5], liveProjection: r[4], originalProjection: rec.orig && rec.orig[teamId + '|' + r[1]] != null ? rec.orig[teamId + '|' + r[1]] : null, photoURL: id.photoURL, game: g ? Object.assign({ gameId: g.id, state: g.state }, M.gameObj(g, st)) : null };
  };
  return {
    schemaVersion: 2, leagueId: sv.lg, season, week: sv.week,
    freshness: { fetchedAt: sv.fetchedAt, sourceUpdatedAt: sv.sourceUpdatedAt, cacheAgeSeconds: sv.cacheAgeSeconds, stale: sv.stale, partial: sv.partial, final: sv.final, upcoming: !!sv.upcoming, scoreboardUpdatedAt: sv.scoreboardUpdatedAt, scoreboardStale: sv.scoreboardStale, lastError: sv.lastError || null },
    matchups: rec.matchups.map(m => ({
      matchupId: sv.lg + '-' + season + '-w' + sv.week + '-' + m.ia + 'v' + m.ib,
      teams: [[m.ia, m.an, m.L, m.ya], [m.ib, m.bn, m.R, m.yb]].map(([id, name, rows, tot]) => ({ teamId: id, name, pointsToDate: tot ? tot[0] : null, yahooProjection: tot ? tot[1] : null, lineup: rows.map(r => player(r, id)) })),
      winProbability: null // reserved: no week-specific odds model is published yet, never reused from another week
    }))
  };
}
module.exports = { build };
