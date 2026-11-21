'use strict';
// Official W-L standings are rebuilt from complete, final Yahoo totals. Live
// projections and BALLDONTLIE provisional scores never enter season records.
function compute({ league, season, currentWeek, weeks, teamCount = 12 }) {
  if (!['gl', 'bh', 'rb', 'sts'].includes(league) || !Number.isInteger(season) || !Number.isInteger(currentWeek) || currentWeek < 2 || currentWeek > 18) throw new Error('invalid_context');
  const throughWeek = Math.min(currentWeek - 1, 14), teams = new Map();
  let sourceUpdatedAt = 0; const topSix = {}; let customComplete = true;
  for (let week = 1; week <= throughWeek; week++) {
    const rec = weeks.find(r => r && r.week === week);
    if (!rec || rec.lg !== league || rec.season !== season || rec.final !== true || rec.partial || rec.matchups?.length !== teamCount / 2) throw new Error('incomplete_week_' + week);
    const seen = new Set();
    const add = (id, name, points, against) => {
      if (!Number.isInteger(id) || id < 1 || id > teamCount || seen.has(id) || typeof name !== 'string' || !name.trim() || typeof points !== 'number' || !Number.isFinite(points) || typeof against !== 'number' || !Number.isFinite(against)) throw new Error('invalid_team_' + week);
      seen.add(id);
      const t = teams.get(id) || { teamId: id, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, streakType: '', streakCount: 0 };
      t.name = name; // names can change; identity is the Yahoo team ID
      const pf = Math.round(points * 100), pa = Math.round(against * 100), result = pf > pa ? 'W' : pf < pa ? 'L' : 'T';
      t[result === 'W' ? 'wins' : result === 'L' ? 'losses' : 'ties']++;
      t.pf += pf; t.pa += pa;
      t.streakCount = t.streakType === result ? t.streakCount + 1 : 1; t.streakType = result;
      teams.set(id, t);
    };
    for (const m of rec.matchups) {
      add(m.ia, m.an, m.ya?.[0], m.yb?.[0]);
      add(m.ib, m.bn, m.yb?.[0], m.ya?.[0]);
    }
    if (seen.size !== teamCount) throw new Error('missing_teams');
    if (league === 'sts') {
      const scores = rec.matchups.flatMap(m => [[m.ia, m.ya[0]], [m.ib, m.yb[0]]]).sort((a,b)=>b[1]-a[1]);
      // Do not invent a tie-break rule at the top-six cutoff.
      if (scores[5][1] === scores[6][1]) customComplete = false;
      scores.slice(0,6).forEach(([id])=>{ topSix[id] = (topSix[id] || 0) + 1; });
    }
    const stamp = typeof rec.sourceUpdatedAt === 'number' ? rec.sourceUpdatedAt : Date.parse(rec.sourceUpdatedAt);
    if (!Number.isFinite(stamp)) throw new Error('invalid_timestamp');
    sourceUpdatedAt = Math.max(sourceUpdatedAt, stamp);
  }
  const rows = [...teams.values()].sort((a, b) => (b.wins + b.ties / 2) - (a.wins + a.ties / 2) || b.pf - a.pf || a.teamId - b.teamId).map((t, i) => ({
    teamId: t.teamId, name: t.name, rank: i + 1, wins: t.wins, losses: t.losses, ties: t.ties,
    record: `${t.wins}-${t.losses}-${t.ties}`, pointsFor: t.pf / 100, pointsAgainst: t.pa / 100,
    pointsPerGame: Math.round(t.pf / throughWeek) / 100, streak: `${t.streakType}-${t.streakCount}`
  }));
  if (rows.some(t => t.wins + t.losses + t.ties !== throughWeek) || rows.reduce((a,t)=>a+t.wins-t.losses,0) !== 0 || Math.abs(rows.reduce((a,t)=>a+t.pointsFor-t.pointsAgainst,0)) > 0.001) throw new Error('standings_invariant_failed');
  const customRows = league === 'sts' && customComplete ? rows.map(t => ({...t, topSixWeeks: topSix[t.teamId] || 0, customPoints: t.wins*4+t.ties*2+(topSix[t.teamId]||0)*3})).sort((a,b)=>b.customPoints-a.customPoints||b.pointsFor-a.pointsFor||a.teamId-b.teamId).map((t,i)=>({...t,rank:i+1})) : undefined;
  return { customRows, schemaVersion: 1, leagueId: league, season, currentWeek, throughWeek, source: 'yahoo_final_matchups', ranking: 'win_percentage_then_points_for', mode: league === 'sts' ? 'win_loss_reference' : 'standings', sourceUpdatedAt: new Date(sourceUpdatedAt).toISOString(), stale: false, rows };
}
async function get(league, M) {
  const ctx = await M.context({ cachedOnly: true }), key = 'mstandings:v1:' + M.SEASON + ':' + league;
  const cached = await M.rget(key);
  if (!ctx || ctx.season !== M.SEASON) {
    if (cached) return { ...cached.body, stale: true };
    throw new Error('context_unavailable');
  }
  if (cached && cached.body.currentWeek === ctx.week && Date.now() - cached.at < 60000) return { ...cached.body, stale: !!ctx.stale };
  try {
    const weeks = await Promise.all(Array.from({ length: Math.min(ctx.week - 1, 14) }, async (_, i) => (await M.rget('mw:' + league + ':' + (i + 1))) || await M.restore(league, i + 1)));
    const body = compute({ league, season: ctx.season, currentWeek: ctx.week, weeks });
    await M.write(key, { at: Date.now(), body });
    return { ...body, stale: !!ctx.stale };
  } catch (error) {
    console.error(JSON.stringify({ event: 'standings_refresh_failed', league, error: error.message }));
    if (cached) return { ...cached.body, stale: true };
    throw error;
  }
}
module.exports = { compute, get };
