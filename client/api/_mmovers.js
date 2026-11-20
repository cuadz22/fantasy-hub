// Market movers for the app: the website's own Trade Calculator model (gl league, 1QB), not a second formula.
// detail(k,'gl') in cfn.html blends stored series with weights {ros .34, dp .11, sp .20, km .21, kt .14}; the site overlays the live market feed,
// and compares against the daily snapshot closest to 7 days old (20 hours to 10 days). Model data comes from tools/export_mobile_model.js.
'use strict';
const MM = require('./_mm.json');
const { get } = (() => { try { return require('@vercel/blob'); } catch (e) { return {}; } })();
const W = { ros: .34, dyn: 0, dp: .11, sp: .20, km: .21, kt: .14 }, IDS = ['ros', 'dyn', 'pj', 'kt', 'dp', 'sp', 'km'], KEYS = ['ros1', 'ros2', 'dyn1', 'dyn2', 'dp1', 'dp2'];
const nn = x => String(x || '').toLowerCase().replace(/’/g, "'").replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '').replace(/[^a-z]/g, '');
function value(s) { let num = 0, den = 0; IDS.forEach(id => { const v = s[id + '1']; if (v != null && W[id] > 0) { num += v * W[id]; den += W[id]; } }); return den ? Math.round(num / den) : null; }
// Same acceptance checks as the site: only use a live series when enough players overlap and its scale matches the stored one.
function liveSeries(live) {
  const out = {}, used = [];
  KEYS.forEach(key => {
    const pairs = []; Object.keys(MM.players).forEach(id => { const b = MM.players[id].s[key], l = (live[nn(MM.players[id].n)] || {})[key]; if (b >= 500 && l >= 0 && isFinite(l)) pairs.push(l / b); });
    pairs.sort((a, b) => a - b); const med = pairs.length ? pairs[pairs.length >> 1] : 0;
    if (pairs.length < 60 || med < 0.4 || med > 2.5) return; used.push(key);
    Object.keys(MM.players).forEach(id => { const l = (live[nn(MM.players[id].n)] || {})[key]; if (l >= 0 && isFinite(l)) (out[id] = out[id] || {})[key] = l; });
  });
  return { out, used };
}
async function readHist() {
  if (!get) return { snaps: [] };
  try { const r = await get('market/history.json', { access: 'private', useCache: false }); if (!r || r.statusCode !== 200 || !r.stream) return { snaps: [] }; const j = JSON.parse(await new Response(r.stream).text()); return j && Array.isArray(j.snaps) ? j : { snaps: [] }; } catch (e) { return { snaps: [] }; }
}
const ET = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' });
const fd = t => ET.format(new Date(t));
// Returns { ok, body, key } or { ok:false, error }.
async function compute(host, week, fetchJson, hist) {
  let live = null;
  try { live = await fetchJson('https://' + host + '/api/hw?market=1'); } catch (e) {}
  const lv = live && live.players ? liveSeries(live.players) : { out: {}, used: [] };
  hist = hist || await readHist();
  const now = Date.now(); let best = null;
  (hist.snaps || []).forEach(q => { const age = now - Date.parse(q.t); if (age >= 20 * 36e5 && age <= 10 * 864e5 && (!best || Math.abs(age - 7 * 864e5) < Math.abs(now - Date.parse(best.t) - 7 * 864e5))) best = q; });
  if (!best) return { ok: false, error: 'no_baseline' };
  const rows = [];
  Object.keys(MM.players).forEach(k => {
    const p = MM.players[k], sNow = Object.assign({}, p.s, lv.out[k] || {}), sv = best.v && best.v[k]; if (!sv) return;
    const b0 = value(Object.assign({}, sNow, sv)), n0 = value(sNow); // baseline = snapshot over today's series, as the site does
    if (!b0 || !n0 || Math.max(n0, b0) < 1500) return;
    const d = n0 - b0; rows.push({ k, p, b0, n0, d, pc: d / b0 * 100 });
  });
  rows.sort((a, b) => b.pc - a.pc);
  const out = r => ({ id: r.k, name: r.p.n, position: r.p.p, team: String(r.p.t || '').toUpperCase() || null, currentValue: r.n0, change: r.d, percentChange: Math.round(r.pc * 100) / 100, priorValue: r.b0, photoURL: MM.sid[r.k] ? 'https://sleepercdn.com/content/nfl/players/' + MM.sid[r.k] + '.jpg?v=1' : null });
  const up = rows.filter(r => r.d > 0).slice(0, 10).map(out), down = rows.filter(r => r.d < 0).slice(-10).reverse().map(out);
  const feedAt = live && (live.updated || live.dpAsOf);
  const body = { label: 'Week ' + week + ' · ' + fd(best.t) + ' to ' + fd(feedAt && /^\d{4}-\d\d-\d\d$/.test(feedAt) ? feedAt + 'T12:00:00Z' : now), players: up.concat(down), baselineAt: best.t, sourceUpdatedAt: feedAt || null, liveSeriesUsed: lv.used, model: 'cfn-gl-1qb', modelVersion: MM.v, computedAt: new Date(now).toISOString() };
  return { ok: true, body, key: [MM.v, feedAt, best.t, week, lv.used.join('')].join('|') };
}
module.exports = { compute, value, liveSeries, MM };
