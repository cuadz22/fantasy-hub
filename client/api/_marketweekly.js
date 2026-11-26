'use strict';
// Immutable historical reconstruction. This decorates chart history only; it
// never participates in today's valuation, movers, scoring, or snapshot writes.
const archive = require('./_marketweekly.json');
const valid = (p, now) => typeof p?.date === 'string' && Number.isFinite(Date.parse(p.date)) && Date.parse(p.date) <= now && Number.isFinite(p.value) && p.value >= 0 && p.value <= 15000;
function attach(body, now = Date.now(), data = archive) {
  if (!body || body.model !== data.model || body.modelVersion !== data.modelVersion || !Array.isArray(body.rankings)) return body;
  const rankings = body.rankings.map(player => {
    const entry = data.players?.[player.id];
    if (!entry || entry.position !== player.position || String(entry.playerId) !== String(player.playerId)) return player;
    const existing = (player.history || []).filter(p => valid(p, now));
    // A saved observation wins over a reconstructed checkpoint on the same day.
    // Preserve every existing intraday observation and its original timestamp.
    const days = new Set(existing.map(p => p.date.slice(0, 10)));
    const points = entry.points.filter(p => valid(p, now) && !days.has(p.date.slice(0, 10)));
    return { ...player, history: [...points, ...existing].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)), historyBasis: 'recorded-and-reconstructed-v1' };
  });
  return { ...body, rankings, historyVersion: data.version, historyAnchorAt: data.anchorTimestamp, historyMethodology: data.methodology };
}
module.exports = { attach };
