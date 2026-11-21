// Audited against public Yahoo settings, 2026-11-21. See docs/scoring.
// Shadow mode only: unsupported event coverage is explicit, never treated as verified zero.
'use strict';
const version = 'yahoo-2026-11-21-v1';
const rules = {
  gl: { passYards: .05, interception: -2, passBonus: 2, rushBonus: 3, receiveBonus: 2, returnTD: 6, longReception: 0, longReceiveTD: 0 },
  bh: { passYards: .05, interception: -1, passBonus: 0, rushBonus: 0, receiveBonus: 0, returnTD: 0, longReception: 0, longReceiveTD: 0 },
  rb: { passYards: .04, interception: -2, passBonus: 2, rushBonus: 2, receiveBonus: 1, returnTD: 6, longReception: 1, longReceiveTD: 1 },
  sts: { passYards: .05, interception: -2.5, passBonus: 2, rushBonus: 3, receiveBonus: 1, returnTD: 6, longReception: 0, longReceiveTD: 0 }
};
const round = n => Math.round(n * 100) / 100;
function score(lg, s) {
  const r = rules[lg]; if (!r) throw new Error('unknown_scoring_rules');
  const required = ['passingYards', 'passingTD', 'interceptions', 'rushingYards', 'rushingTD', 'receptions', 'receivingYards', 'receivingTD', 'fumblesLost', 'twoPoint', 'offensiveFumbleTD'];
  if (r.returnTD) required.push('returnTD');
  if (r.longReception) required.push('longReceptions', 'longReceivingTD');
  const missing = required.filter(k => s[k] == null || !Number.isFinite(s[k]));
  const n = k => Number.isFinite(s[k]) ? s[k] : 0;
  const points = n('passingYards') * r.passYards + n('passingTD') * 6 + n('interceptions') * r.interception +
    n('rushingYards') * .1 + n('rushingTD') * 6 + n('receptions') + n('receivingYards') * .1 + n('receivingTD') * 6 +
    n('fumblesLost') * -2 + n('twoPoint') * 2 + n('offensiveFumbleTD') * 6 + n('returnTD') * r.returnTD +
    (n('passingYards') >= 325 ? r.passBonus : 0) + (n('rushingYards') >= 100 ? r.rushBonus : 0) +
    (n('receivingYards') >= 100 ? r.receiveBonus : 0) + n('longReceptions') * r.longReception + n('longReceivingTD') * r.longReceiveTD;
  return { points: missing.length ? null : round(points), knownSubtotal: round(points), missing, rulesVersion: version };
}
function normalize(stat, plays) {
  const fields = { passingYards: 'passing_yards', passingTD: 'passing_touchdowns', interceptions: 'passing_interceptions', rushingYards: 'rushing_yards', rushingTD: 'rushing_touchdowns', receptions: 'receptions', receivingYards: 'receiving_yards', receivingTD: 'receiving_touchdowns', fumblesLost: 'fumbles_lost' };
  const out = {}, assumptions = [];
  // BDL box scores use null for categories without recorded activity. Keep this
  // assumption visible in every comparison until event coverage has been verified.
  for (const [k, field] of Object.entries(fields)) {
    if (!(field in stat)) out[k] = null;
    else { out[k] = stat[field] == null ? 0 : Number(stat[field]); if (stat[field] == null) assumptions.push(field); }
  }
  out.returnTD = (stat.kick_return_touchdowns || 0) + (stat.punt_return_touchdowns || 0);
  out.twoPoint = null; out.offensiveFumbleTD = null;
  // Exact-ID participants only. No fuzzy name matching in play descriptions.
  const seen = new Map((plays || []).map(p => [p.id, p]));
  const catches = [...seen.values()].filter(p => (p.participants || []).some(x => x.player_id === stat.player.id && x.type === 'receiver') && /^(pass-completion|pass-reception|passing-touchdown)$/.test(p.type_slug || '') && !/no play|nullified/i.test(p.text || ''));
  out.longReceptions = catches.filter(p => p.stat_yardage >= 40).length;
  out.longReceivingTD = catches.filter(p => p.stat_yardage >= 40 && p.type_slug === 'passing-touchdown').length;
  // Two-point and offensive fumble attribution require more fixtures; a subtotal
  // is useful for diagnosis but is not eligible to replace a Yahoo score.
  return { stats: out, assumptions, coverageVerified: false };
}
module.exports = { version, rules, score, normalize, round };
