// Stable player IDs and portraits from the Sleeper player list (refreshed daily by the cron, cached in Redis).
'use strict';
const { rget, rset, canon } = require('./_m');
const nn = x => String(x || '').toLowerCase().replace(/’/g, "'").replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '').replace(/[^a-z]/g, '');
let mem = null, memAt = 0;
async function refresh(force) {
  const rec = await rget('ms:sleeper');
  if (!force && rec && Date.now() - rec.at < 20 * 3600000) return rec;
  const bo = await rget('ms:sleeper:fail'); if (!force && bo && Date.now() - bo.at < 15 * 60000) return rec; // back off after a failed download
  try {
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 20000);
    const r = await fetch('https://api.sleeper.app/v1/players/nfl', { headers: { 'User-Agent': 'cfn-site' }, signal: ac.signal }); clearTimeout(t);
    if (!r.ok) throw new Error('http ' + r.status);
    const all = await r.json(), map = {}; let n = 0;
    Object.keys(all).forEach(id => { const p = all[id]; if (!p || !p.full_name || !p.team && p.status !== 'Active') return; const pos = (p.fantasy_positions || [p.position])[0]; if (!['QB', 'RB', 'WR', 'TE', 'K'].includes(pos)) return; const key = nn(p.full_name) + '|' + pos; if (!map[key] || p.team) { map[key] = id; n++; } });
    if (n < 800) throw new Error('player list too small');
    const out = { at: Date.now(), n, map }; await rset('ms:sleeper', out, 3 * 86400); return out;
  } catch (e) { await rset('ms:sleeper:fail', { at: Date.now(), why: String(e.message || e).slice(0, 60) }, 3600); return rec || null; }
}
async function getMap() { if (mem && Date.now() - memAt < 600000) return mem; const r = await rget('ms:sleeper'); mem = (r && r.map) || {}; memAt = Date.now(); return mem; }
// Returns { id, photoURL } for a lineup or market player. DEF ids are the team code.
function idFor(map, name, pos, team) {
  pos = String(pos || '').toUpperCase(); if (pos === 'DST') pos = 'DEF';
  if (pos === 'DEF') { const t = canon(team); return { id: 'def:' + t, photoURL: null }; }
  const sid = map[nn(name) + '|' + pos];
  return sid ? { id: sid, photoURL: 'https://sleepercdn.com/content/nfl/players/' + sid + '.jpg?v=1' } : { id: 'cfn:' + nn(name) + ':' + pos, photoURL: null };
}
module.exports = { refresh, getMap, idFor, nn };
