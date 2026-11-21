// Deterministic, cumulative BALLDONTLIE scoring. Unknown/unsynchronised events
// produce an ineligible result, never a guessed zero or a partially counted total.
'use strict';
const S = require('./_scoring');
const numeric = (v, nullable = true) => v === null && nullable ? 0 : typeof v === 'number' && Number.isFinite(v) ? v : null;
const norm = s => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
const alias = p => norm(p.first_name[0] + p.last_name.replace(/\s+(Jr\.?|Sr\.?|II|III|IV)$/i, ''));
const noPlay = p => /\bno play\b|\bnullified\b/i.test(p.text || '');
const ids = (p, role) => (p.participants || []).filter(x => x.type === role).map(x => x.player_id);
const unique = a => [...new Set(a)];
function analyze(snap) {
  const errors = [], byId = new Map(), map = new Map(), teams = new Map();
  const g = snap.game, teamIds = [g.home_team.id, g.visitor_team.id];
  for (const t of teamIds) teams.set(t, { two: new Map(), xp: new Map(), fumbleTD: new Map(), errors: [], defensiveTD: 0, returnTD: 0, safety: 0, block: 0, twoReturn: 0, excluded: 0 });
  for (const s of snap.stats) {
    if (s.game?.id !== g.id || !s.player?.id || byId.has(s.player.id) || !teams.has(s.team?.id)) errors.push('invalid_player_identity');
    byId.set(s.player.id, s);
  }
  if (snap.teamStats.length !== 2 || new Set(snap.teamStats.map(t => t.team?.id)).size !== 2 || snap.teamStats.some(t => t.game?.id !== g.id || !teams.has(t.team?.id))) errors.push('invalid_team_stats');
  for (const p of snap.plays) {
    if (!p.id || p.game?.id !== g.id) errors.push('invalid_play_identity');
    if (map.has(p.id) && JSON.stringify(map.get(p.id)) !== JSON.stringify(p)) errors.push('conflicting_play_revision');
    map.set(p.id, p);
  }
  const plays = [...map.values()];
  if (!plays.length) errors.push('no_plays');
  const totals = new Map(teamIds.map(id => [id, 0]));
  const resolve = (token, teamId) => {
    const a = snap.stats.filter(s => s.team.id === teamId && alias(s.player) === norm(token));
    return a.length === 1 ? a[0].player.id : null;
  };
  for (const p of plays) {
    if (noPlay(p)) continue;
    const text = p.text || '', slug = p.type_slug || '', tid = p.team?.id, t = teams.get(tid);
    // Completed conversion descriptions identify the conversion's actual players,
    // which can differ from the TD participants. Exact unique team alias only.
    if (/two[- ]point|two-pt|2-point/i.test(text) || /two.point|conversion/.test(slug)) {
      const part = text.split(/TWO[- ]POINT CONVERSION ATTEMPT\.?\s*/i).slice(1).join(' ');
      if (!t || !part) { errors.push('unrecognised_conversion'); }
      else if (/ATTEMPT SUCCEEDS/i.test(part)) {
        let m = part.match(/([\w.'’\-]+) pass to ([\w.'’\-]+) is complete/i);
        let who = m ? [resolve(m[1], tid), resolve(m[2], tid)] : [];
        if (!m) { m = part.match(/([\w.'’\-]+) (?:rushes|runs)\b/i); if (m) who = [resolve(m[1], tid)]; }
        if (!who.length || who.some(x => !x)) t.errors.push('conversion_attribution');
        else for (const id of unique(who)) t.two.set(id, (t.two.get(id) || 0) + 1);
      } else if (!/ATTEMPT FAILS/i.test(part)) t.errors.push('conversion_result');
    }
    // Fail closed on uncommon returns/try events until their precise semantics
    // are represented; never assign a touchdown to the original TD participants.
    if (/two.point.*return|extra.point.*return|one.point.safety/.test(slug)) errors.push('unvalidated_try_return');
    if (/blocked/.test(slug) || /\bBLOCKED\b/.test(text)) {
      if (!t || !/^(blocked-field-goal|blocked-punt|blocked-extra-point)$/.test(slug)) errors.push('unvalidated_block');
      else t.block++;
    }
    if (p.scoring_play) {
      if (!t) { errors.push('scoring_team_missing'); continue; }
      if (slug === 'field-goal-good') totals.set(tid, totals.get(tid) + 3);
      else if (slug === 'safety') { t.safety++; t.excluded += 2; totals.set(tid, totals.get(tid) + 2); }
      else if (/touchdown/.test(slug) || /TOUCHDOWN/i.test(text)) {
        if (slug === 'passing-touchdown' || slug === 'rushing-touchdown') { /* ordinary offense */ }
        else if (slug === 'interception-return-touchdown' || slug === 'sack-opp-fumble-recovery' || slug === 'fumble-recovery-opponent' || slug === 'fumble-return-touchdown') { t.defensiveTD++; t.excluded += 6; }
        else if (slug === 'kickoff-return-touchdown' || slug === 'punt-return-touchdown') t.returnTD++;
        else if (slug === 'fumble-recovery-own') {
          const who = ids(p, 'recoverer');
          if (who.length !== 1 || byId.get(who[0])?.team.id !== tid) t.errors.push('offensive_fumble_td_attribution');
          else t.fumbleTD.set(who[0], (t.fumbleTD.get(who[0]) || 0) + 1);
        } else errors.push('unvalidated_scoring_play:' + slug);
        const extra = /ATTEMPT SUCCEEDS/i.test(text) ? 2 : /extra point is GOOD/i.test(text) || /\([^()]+ Kick\)/.test(text) ? 1 : 0;
        if (extra === 1) {
          let who = ids(p, 'xp_kicker');
          if (who.length !== 1) {
            const m = text.match(/([\w.'’\-]+) extra point is GOOD/i), short = text.match(/\(([^()]+) Kick\)/);
            const found = m ? resolve(m[1], tid) : null;
            who = found ? [found] : short ? snap.stats.filter(s => s.team.id === tid && norm(s.player.first_name + s.player.last_name) === norm(short[1])).map(s => s.player.id) : [];
          }
          if (who.length !== 1) t.errors.push('xp_attribution');
          else t.xp.set(who[0], (t.xp.get(who[0]) || 0) + 1);
        }
        totals.set(tid, totals.get(tid) + 6 + extra);
      } else errors.push('unvalidated_scoring_play:' + slug);
    }
  }
  // The score fields on timeout/penalty rows can retain the pre-PAT score. Count
  // scoring events instead, then require agreement with the cumulative scoreboard.
  if (totals.get(teamIds[0]) !== g.home_team_score || totals.get(teamIds[1]) !== g.visitor_team_score) errors.push('box_play_score_mismatch');
  return { errors: unique(errors), plays, teams, byId, game: g };
}
function offense(lg, stat, a) {
  const n = S.normalize(stat, a.plays), t = a.teams.get(stat.team.id), problems = [...a.errors, ...t.errors];
  n.stats.twoPoint = t.errors.length ? null : t.two.get(stat.player.id) || 0;
  n.stats.offensiveFumbleTD = t.errors.length ? null : t.fumbleTD.get(stat.player.id) || 0;
  for (const f of ['kick_return_touchdowns', 'punt_return_touchdowns']) if (!(f in stat)) problems.push('missing_' + f);
  if (numeric(stat.fumbles_touchdowns) !== n.stats.offensiveFumbleTD) problems.push('unattributed_fumble_touchdown');
  // Cumulative TD and reception counts establish that plays and box score have
  // reached the same revision before awarding play-derived bonus categories.
  const relevant = a.plays.filter(p => !noPlay(p));
  const ptd = relevant.filter(p => p.type_slug === 'passing-touchdown' && ids(p, 'passer').includes(stat.player.id)).length;
  const ctd = relevant.filter(p => p.type_slug === 'passing-touchdown' && ids(p, 'receiver').includes(stat.player.id)).length;
  const rtd = relevant.filter(p => p.type_slug === 'rushing-touchdown' && ids(p, 'rusher').includes(stat.player.id)).length;
  if (ptd !== n.stats.passingTD || ctd !== n.stats.receivingTD || rtd !== n.stats.rushingTD) problems.push('box_play_td_mismatch');
  // A fumble/lateral catch may have no receiver participant. We cannot safely
  // reconstruct long-catch bonuses for that player from total play yardage.
  if (S.rules[lg].longReception) {
    const catches = relevant.filter(p => /^(pass-reception|pass-completion|passing-touchdown)$/.test(p.type_slug) && ids(p, 'receiver').includes(stat.player.id));
    if (numeric(stat.long_reception, false) !== null && stat.long_reception < 40) { n.stats.longReceptions = 0; n.stats.longReceivingTD = 0; }
    else if (catches.length !== n.stats.receptions || catches.some(p => /lateral/i.test(p.text || ''))) problems.push('long_catch_coverage');
  }
  const scored = S.score(lg, n.stats);
  return { ...scored, points: problems.length ? null : scored.points, missing: unique([...scored.missing, ...problems]), breakdown: n.stats };
}
function kicker(stat, a) {
  const problems = [...a.errors];
  if (['passing_yards','passing_touchdowns','passing_interceptions','rushing_yards','rushing_touchdowns','receptions','receiving_yards','receiving_touchdowns','fumbles_lost','kick_return_touchdowns','punt_return_touchdowns','fumbles_touchdowns'].some(k => numeric(stat[k]) !== 0)) problems.push('kicker_non_kicking_stats');
  const made = numeric(stat.field_goals_made, false), xp = numeric(stat.extra_points_made, false);
  if (made === null || xp === null) problems.push('missing_kicking_stats');
  const fgs = a.plays.filter(p => !noPlay(p) && p.type_slug === 'field-goal-good' && ids(p, 'field_goal_kicker').includes(stat.player.id));
  if (fgs.length !== made || fgs.some(p => numeric(p.stat_yardage, false) === null || p.stat_yardage < 1 || p.stat_yardage > 100)) problems.push('field_goal_yardage_coverage');
  // The provider's total_points disagrees with its FG/XP fields in a real Week
  // 10 fixture. Verify the actual XP events; don't use that derived field.
  const t = a.teams.get(stat.team.id);
  if (t.errors.includes('xp_attribution') || (t.xp.get(stat.player.id) || 0) !== xp) problems.push('kicking_box_mismatch');
  const breakdown = { fieldGoalYards: fgs.reduce((n, p) => n + p.stat_yardage, 0), extraPoints: xp };
  const points = S.round(breakdown.fieldGoalYards * .1 + (xp || 0));
  return { points: problems.length ? null : points, knownSubtotal: points, missing: unique(problems), breakdown, rulesVersion: S.version };
}
const pa = n => n === 0 ? 8 : n <= 6 ? 5 : n <= 13 ? 3 : n <= 20 ? 1 : n <= 27 ? 0 : n <= 34 ? -1 : -3;
const ya = n => n < 100 ? 8 : n < 200 ? 5 : n < 300 ? 3 : n < 400 ? 1 : n < 500 ? 0 : -2;
function defense(teamId, snap, a) {
  const own = snap.teamStats.find(t => t.team.id === teamId), opp = snap.teamStats.find(t => t.team.id !== teamId);
  const t = a.teams.get(teamId), other = a.teams.get(opp?.team.id), problems = [...a.errors];
  const needed = ['sacks', 'interceptions_thrown', 'fumbles_lost', 'total_yards', 'fourth_down_attempts', 'fourth_down_conversions'];
  for (const k of needed) if (numeric(opp?.[k], false) === null) problems.push('missing_defense_' + k);
  if (!own || !opp || !other || !t) return { points: null, missing: ['missing_team_stats'], rulesVersion: S.version };
  if (numeric(own.defensive_touchdowns, false) !== t.defensiveTD) problems.push('defensive_td_mismatch');
  const recoveries = opp.fumbles_lost;
  // Team losses cover muffed kicks and lateral plays whose play slug is not a
  // fumble. Out-of-bounds end-zone losses do not credit a defense recovery.
  if (a.plays.some(p => !noPlay(p) && /fumble/i.test(p.text || '') && /touchback/i.test(p.text || '') && !/recovered by/i.test(p.text || ''))) problems.push('fumble_touchback_coverage');
  const allowed = (a.game.home_team.id === teamId ? a.game.visitor_team_score : a.game.home_team_score) - other.excluded;
  if (allowed < 0) problems.push('negative_points_allowed');
  const breakdown = { sacks: opp.sacks, interceptions: opp.interceptions_thrown, recoveries, defensiveTD: t.defensiveTD, returnTD: t.returnTD, safeties: t.safety, blockedKicks: t.block, fourthDownStops: opp.fourth_down_attempts - opp.fourth_down_conversions, pointsAllowed: allowed, yardsAllowed: opp.total_yards, twoPointReturns: t.twoReturn };
  const points = S.round(breakdown.sacks + breakdown.interceptions * 2 + recoveries * 2 + (t.defensiveTD + t.returnTD) * 6 + t.safety * 4 + t.block * 3 + breakdown.fourthDownStops + pa(allowed) + ya(opp.total_yards) + t.twoReturn * 2);
  return { points: problems.length ? null : points, knownSubtotal: points, missing: unique(problems), breakdown, rulesVersion: S.version };
}
function scoreGame(lg, snap) {
  const a = analyze(snap), players = {}, defenses = {};
  for (const s of snap.stats) {
    const p = s.player.position_abbreviation;
    if (/^(QB|RB|WR|TE)$/.test(p)) players[s.player.id] = offense(lg, s, a);
    else if (/^(K|PK)$/.test(p)) players[s.player.id] = kicker(s, a);
  }
  for (const id of a.teams.keys()) defenses[id] = defense(id, snap, a);
  return { players, defenses, errors: a.errors, rulesVersion: S.version };
}
module.exports = { analyze, offense, kicker, defense, scoreGame, pa, ya };
