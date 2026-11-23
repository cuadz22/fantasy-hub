'use strict';
// Public Yahoo mirror for Fantasy Ball Z. Isolated from CFN scoring/calendar keys.
const M = require('./_m'), Y = require('./_ysweep');
const LEAGUE = '697400', NAME = 'Fantasy Ball Z', COUNT = 12;
const requireValue = (ok, reason) => { if (!ok) throw Error(reason); };
const finite = n => typeof n === 'number' && Number.isFinite(n);
function logo(html) {
  const src = /<img\b[^>]*src="([^"]+)"[^>]*alt="logo"/.exec(html)?.[1];
  if (!src) return null;
  try { const u = new URL(src.replace(/&amp;/g, '&')); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; }
}
function parseStandings(html) {
  requireValue(new RegExp('rel="canonical"[^>]*href="https://football.fantasysports.yahoo.com/f1/' + LEAGUE + '(?:[?"/])').test(html), 'wrong_league');
  const table = /<table\b[^>]*id="standingstable"[^>]*>([\s\S]*?)<\/table>/.exec(html)?.[1];
  requireValue(table, 'standings_missing');
  const rows = [];
  for (const match of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]);
    if (!cells.length) continue;
    const link = new RegExp('href="[^"<>]*/f1/' + LEAGUE + '/(\\d+)(?:\\?[^"<>]*)?"[^>]*>([^<]+)</a>').exec(cells[1] || '');
    const record = /^(\d+)-(\d+)-(\d+)$/.exec(Y.text(cells[2] || ''));
    requireValue(cells.length >= 6 && link && record, 'invalid_standings_row');
    const number = cell => { const value = Y.text(cell).replace(/,/g, ''); requireValue(/^\d+(?:\.\d+)?$/.test(value), 'invalid_standings_number'); return Number(value); };
    const wins = +record[1], losses = +record[2], ties = +record[3], played = wins + losses + ties;
    rows.push({ teamId: +link[1], name: Y.text(link[2]), rank: number(cells[0]), wins, losses, ties, record: record[0], pointsFor: number(cells[3]), pointsAgainst: number(cells[4]), streak: Y.text(cells[5]), pointsPerGame: played ? number(cells[3]) / played : 0, logoURL: logo(cells[1]) });
  }
  const throughWeek = rows[0] ? rows[0].wins + rows[0].losses + rows[0].ties : -1;
  requireValue(rows.length === COUNT && new Set(rows.map(r => r.teamId)).size === COUNT && rows.every(r => r.teamId >= 1 && r.teamId <= COUNT && r.name), 'incomplete_standings');
  requireValue(new Set(rows.map(r => r.rank)).size === COUNT && rows.every(r => r.rank >= 1 && r.rank <= COUNT), 'invalid_ranks');
  requireValue(throughWeek >= 0 && throughWeek <= 18 && rows.every(r => r.wins + r.losses + r.ties === throughWeek), 'standings_not_finalized');
  requireValue(rows.reduce((s,r) => s + r.wins - r.losses, 0) === 0 && Math.abs(rows.reduce((s,r) => s + r.pointsFor - r.pointsAgainst, 0)) < 0.02, 'standings_unbalanced');
  return { throughWeek, ranking: 'yahoo_official', rows };
}
function parseRoster(html, teamID, week) {
  requireValue(Number.isInteger(week) && week >= 1 && week <= 18, 'invalid_week');
  requireValue(new RegExp('rel="canonical"[^>]*href="https://football.fantasysports.yahoo.com/f1/' + LEAGUE + '/' + teamID + '\\?week=' + week + '(?:&|\")').test(html), 'wrong_team_or_week');
  const start = html.indexOf('<div id="team-card-matchup"');
  requireValue(start >= 0 && new RegExp('^Week ' + week + ' vs\\b').test(Y.text(html.slice(start, start + 1000))), 'wrong_matchup_week');
  const team = Y.parseTeam(html, teamID);
  requireValue(team.name && team.rows.length >= 8 && team.tot?.length === 2 && team.tot.every(finite) && team.opp !== teamID && Number.isInteger(team.opp), 'incomplete_roster');
  requireValue(team.rows.length === [...html.matchAll(/class="[^"<>]*\bysf-player-name\b[^"<>]*"/g)].length, 'missing_player_rows');
  const ids = new Set();
  const players = team.rows.map(p => {
    const position = p.pos === 'DST' ? 'DEF' : p.pos;
    requireValue(['QB','RB','WR','TE','K','DEF'].includes(position) && p.name && p.team, 'unknown_player_position');
    const id = 'fb:' + position + ':' + p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    requireValue(!ids.has(id) && (p.pts == null || finite(p.pts)) && (p.proj == null || finite(p.proj)), 'invalid_player'); ids.add(id);
    const status = p.status.replace(/\s*&#x[eE][0-9a-fA-F]{3};?/g, '').trim();
    const bye = /^bye\b/i.test(status);
    const slot = ({'W/R/T':'FLX','W/R':'FLX','W/T':'FLX','R/T':'FLX','Q/W/R/T':'SFX'})[p.slot] || p.slot;
    return { id, name: p.name, position: slot, footballPosition: position, team: M.canon(p.team), points: bye ? null : p.pts, projection: bye ? null : p.proj, injuryStatus: p.inj, status: bye ? 'Bye' : status };
  });
  return { ...team, players };
}
function normalize({ standings, teams, week, observedAt = Date.now() }) {
  requireValue(Number.isInteger(week) && week >= 1 && week <= 18 && teams.length === COUNT && new Set(teams.map(t => t.id)).size === COUNT, 'incomplete_teams');
  const byID = new Map(teams.map(t => [t.id,t])), rows = new Map(standings.rows.map(t => [t.teamId,t]));
  const output = t => {
    const row = rows.get(t.id); requireValue(row, 'missing_standing');
    return { id: t.id, name: t.name, manager: '', record: row.record, players: t.players, logoURL: row.logoURL, reportedScore: t.tot[0], reportedForecast: t.tot[1] };
  };
  const seen = new Set(), matchups = [], stamp = new Date(observedAt).toISOString();
  for (const t of teams) {
    const opponent = byID.get(t.opp);
    requireValue(opponent && opponent.opp === t.id, 'opponents_do_not_match');
    if (seen.has(t.id)) continue;
    seen.add(t.id); seen.add(opponent.id);
    matchups.push({ id: `fb-${week}-${Math.min(t.id,opponent.id)}-${Math.max(t.id,opponent.id)}`, league: 'fb', leagueName: NAME, week, home: output(t), away: output(opponent), history: '', updatedAt: stamp, sourceStale: false });
  }
  requireValue(matchups.length === COUNT / 2, 'incomplete_pairs');
  return { schemaVersion: 1, leagueId: 'fb', leagueName: NAME, provider: 'yahoo', scoreSource: 'yahoo_public', season: M.SEASON, week, teamId: 12, observedAt: stamp, stale: false, projectionsAvailable: true, matchups, standings, capabilities: ['matchups','rosters','standings'] };
}
async function refresh(week) {
  requireValue(Number.isInteger(week) && week >= 1 && week <= 18, 'invalid_week');
  const key = `connected:v1:fb:${M.SEASON}:${week}`, lock = await M.lock(key + ':lock', 55);
  if (!lock) return { league: 'fb', week, busy: true };
  try {
    const signal = AbortSignal.timeout(40000);
    const response = await fetch('https://football.fantasysports.yahoo.com/f1/' + LEAGUE, { headers: {'User-Agent':'Mozilla/5.0'}, signal });
    requireValue(response.ok && !response.url.includes('login.yahoo.com'), 'yahoo_unavailable');
    const standings = parseStandings(await response.text()), teams = [];
    let next = 0;
    // Bound concurrency; the app only reads the published complete snapshot.
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (next < standings.rows.length) {
        const id = standings.rows[next++].teamId;
        const html = await Y.fetchTeam('fb', week, id, signal);
        teams.push(parseRoster(html, id, week));
      }
    }));
    teams.sort((a,b) => a.id - b.id);
    const body = normalize({ standings, teams, week });
    // A failed/partial scrape never overwrites a last-known complete snapshot.
    await M.write(key, body, 180 * 86400);
    return { league: 'fb', week, matchups: body.matchups.length, throughWeek: standings.throughWeek };
  } finally { await M.unlock(key + ':lock', lock); }
}
module.exports = { parseStandings, parseRoster, normalize, refresh };
