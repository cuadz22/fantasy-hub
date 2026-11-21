// Publication boundary: Yahoo supplies membership/slots; independently computed
// BALLDONTLIE points can replace only individually verified, fresh entries.
'use strict';
const M = require('./_m'), S = require('./_scoring'), G = require('./_scoregame'), { nn } = require('./_ids');
const pos = p => p === 'PK' ? 'K' : /^(DST|D\/ST|DEF)$/.test(p) ? 'DEF' : p;
const identity = r => pos(r[2]) === 'DEF' ? 'DEF|' + M.canon(r[3]) : nn(r[1]) + '|' + pos(r[2]) + '|' + M.canon(r[3]);
const reserve = r => ['BN', 'IR', 'IR+', 'NA'].includes(r[0]);
const fingerprint = rec => M.sha(JSON.stringify(rec.matchups.map(m => [m.ia, m.ib, m.L.map(r => [r[0],identity(r)]), m.R.map(r => [r[0],identity(r)])])));
const key = (season, week, lg) => `bdl:${season}:${week}:scores:${lg}`;
function calculate(lg, snapshots, mapping = {}, now = Date.now()) {
  const entries = {}, conflicts = [], nextMapping = {...mapping};
  const put = (id, e) => {
    if (entries[id]) { entries[id] = {...e, points: null, missing: ['ambiguous_game_identity']}; return; }
    const old = nextMapping[id];
    if (old && old.providerId !== e.providerId) { e = {...e, points: null, missing: [...e.missing, 'identity_changed']}; conflicts.push(id); }
    else nextMapping[id] = { providerId: e.providerId, firstSeenAt: old?.firstSeenAt || now, lastSeenAt: now };
    entries[id] = e;
  };
  for (const snap of snapshots) {
    const out = G.scoreGame(lg, snap), final = snap.game.status_state === 'final' || /^final/i.test(snap.game.status || '');
    const meta = { gameId: snap.game.id, observedAt: snap.observedAt, final, rulesVersion: S.version };
    for (const s of snap.stats) {
      const scored = out.players[s.player.id]; if (!scored) continue;
      put(identity(['', s.player.first_name + ' ' + s.player.last_name, pos(s.player.position_abbreviation), s.team.abbreviation]), {...meta, ...scored, providerId: s.player.id});
    }
    for (const t of [snap.game.home_team, snap.game.visitor_team]) put('DEF|' + M.canon(t.abbreviation), {...meta, ...out.defenses[t.id], providerId: t.id});
  }
  return { entries, mapping: nextMapping, conflicts, generatedAt: now, rulesVersion: S.version };
}
async function publish(c, snapshots) {
  const mappingKey = 'bdl:' + c.season + ':identities', mappings = await M.read(mappingKey) || {};
  let nextMapping = mappings; const report = {};
  for (const lg of M.LGS) {
    const scores = calculate(lg, snapshots, nextMapping); nextMapping = scores.mapping;
    const rec = await M.read('mw:' + lg + ':' + c.week);
    const bundle = { season: c.season, week: c.week, league: lg, ...scores, mapping: undefined,
      rosterObservedAt: rec?.sourceUpdatedAt || null, rosterFingerprint: rec ? fingerprint(rec) : null };
    await M.write(key(c.season, c.week, lg), bundle);
    report[lg] = { eligible: Object.values(scores.entries).filter(e => Number.isFinite(e.points)).length, ineligible: Object.values(scores.entries).filter(e => !Number.isFinite(e.points)).length, conflicts: scores.conflicts.length };
  }
  await M.write(mappingKey, nextMapping);
  return report;
}
function enabled(control, rec) {
  return control?.mode === 'guarded' && control.season === rec.season && control.rulesVersion === S.version && control.weeks?.includes(rec.week) && control.leagues?.includes(rec.lg);
}
function overlay(rec, bundle, control, now = Date.now()) {
  const stats = { used: 0, fallback: 0, reasons: {}, scoreUpdatedAt: null };
  const reason = k => { stats.fallback++; stats.reasons[k] = (stats.reasons[k] || 0) + 1; };
  if (!enabled(control, rec) || !bundle || bundle.season !== rec.season || bundle.week !== rec.week || bundle.league !== rec.lg || bundle.rulesVersion !== S.version) return { rec, source: 'yahoo', stats };
  // Allow at most three minutes of unconfirmed roster state during games. A late
  // lineup swap cannot be hidden by a newly fetched scoring timestamp.
  if (rec.partial || now - rec.sourceUpdatedAt > 180000) { reason('roster_unconfirmed'); return { rec, source: 'yahoo', stats }; }
  const copy = { ...rec, matchups: rec.matchups.map(m => ({...m})) };
  for (const m of copy.matchups) for (const [side, totalKey] of [['L','ya'], ['R','yb']]) {
    const rows = m[side], baseline = rows.filter(r=>!reserve(r)).reduce((sum,r)=>sum+(Number.isFinite(r[5])?r[5]:0),0), official = m[totalKey]?.[0];
    if (!Number.isFinite(official) || Math.abs(baseline - official) > .02) { reason('yahoo_total_not_reconciled'); continue; }
    const details = [], seen = new Set(); let total = 0;
    // Duplicate starter identities can otherwise be counted twice after bad parsing.
    const starterIds = rows.filter(r=>!reserve(r)).map(identity);
    if (new Set(starterIds).size !== starterIds.length) { reason('duplicate_starter'); continue; }
    m[side] = rows.map(r => {
      const o = [...r], id = identity(r), e = bundle.entries[id];
      let why = !e ? 'identity_or_stats_missing' : !Number.isFinite(e.points) ? e.missing?.[0] || 'unverified_score' : e.rulesVersion !== S.version ? 'rules_mismatch' : null;
      if (!why && (now - e.observedAt > (e.final ? 2 * 3600000 : 90000) || e.observedAt > now + 5000)) why = 'stats_delayed';
      // Once a game is final and Yahoo has settled it, official fantasy corrections
      // take precedence over a disagreement. In-progress scores never depend on Yahoo.
      if (!why && e.final && /final/i.test(r[6] || '') && Number.isFinite(r[5]) && Math.abs(e.points-r[5]) > .02) why = 'final_reconciliation';
      if (!why) {
        o[5] = e.points;
        if (!reserve(r)) { stats.used++; stats.scoreUpdatedAt = stats.scoreUpdatedAt == null ? e.observedAt : Math.min(stats.scoreUpdatedAt,e.observedAt); }
        details.push({source:'balldontlie',providerId:e.providerId,gameId:e.gameId,observedAt:e.observedAt,rulesVersion:e.rulesVersion});
      } else {
        if (!reserve(r) && e) reason(why);
        details.push({source:'yahoo',reason:why,observedAt:rec.sourceUpdatedAt});
      }
      if (!reserve(r)) { total += Number.isFinite(o[5]) ? o[5] : 0; seen.add(id); }
      return o;
    });
    m[side + 'ScoreDetails'] = details;
    m[totalKey] = [S.round(total), ...m[totalKey].slice(1)];
  }
  // Projections continue to be Yahoo projections, independent of actual-score source.
  const sources = copy.matchups.flatMap(m=>['L','R'].flatMap(side=>(m[side+'ScoreDetails']||[]).filter((_,i)=>!reserve(m[side][i]) && Number.isFinite(m[side][i][5])).map(d=>d.source)));
  return { rec: copy, source: stats.used ? sources.includes('yahoo') ? 'mixed' : 'balldontlie' : 'yahoo', stats };
}
async function apply(rec) {
  try {
    const control = await M.read('scoring:control:' + M.SEASON);
    if (!enabled(control, rec)) return { rec, source: 'yahoo', stats: null };
    return overlay(rec, await M.read(key(rec.season, rec.week, rec.lg)), control);
  } catch { return { rec, source: 'yahoo', stats: { fallback: 1, reasons: { scoring_store_unavailable: 1 } } }; }
}
module.exports = { identity, fingerprint, calculate, publish, enabled, overlay, apply, key, reserve };
