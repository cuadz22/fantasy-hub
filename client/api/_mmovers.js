// Market movers for the app: the website's own Trade Calculator model (gl league, 1QB), not a second formula.
// detail(k,'gl') in cfn.html blends stored series with weights {ros .34, dp .11, sp .20, km .21, kt .14}; the site overlays the live market feed,
// and compares against the daily snapshot closest to 7 days old (20 hours to 10 days). Model data comes from tools/export_mobile_model.js.
'use strict';
const MM = require('./_mm.json');
const { get } = (() => { try { return require('@vercel/blob'); } catch (e) { return {}; } })();
const W = { ros: .34, dyn: 0, dp: .11, sp: .20, km: .21, kt: .14 }, IDS = ['ros', 'dyn', 'pj', 'kt', 'dp', 'sp', 'km'], KEYS = ['ros1', 'ros2', 'dyn1', 'dyn2', 'dp1', 'dp2'];
const { canon } = require('./_m');
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

// Reconstruct older comparisons only from real archived source observations.
// Their unsnapshotted model inputs are held constant, as in the existing movers.
function portfolioHistory(k, p, series, hist, best, live, lv, now) {
  const validSources = sources => Object.fromEntries(Object.entries(sources || {}).filter(([key,v]) => IDS.some(id=>key===id+"1") && Number.isFinite(v) && v>=0));
  const rawPrior = best?.v?.[k] || best?.v?.[nn(p.n)];
  const prior = rawPrior && Object.keys(validSources(rawPrior)).length ? validSources(rawPrior) : null;
  const exactBaseline = best?.modelVersion === MM.v ? best?.values?.[k] : null;
  const baseline = Number.isFinite(exactBaseline) ? exactBaseline : prior ? value(Object.assign({}, series, prior)) : null;
  const current = value(series), sourceDate = live && (live.updated || live.dpAsOf);
  const history = [];
  const seen = new Set();
  for (const snap of (hist.snaps || []).slice().sort((a,b)=>Date.parse(a.t)-Date.parse(b.t))) {
    const stamp = Date.parse(snap.t), sources = snap.v?.[k] || snap.v?.[nn(p.n)];
    if (!sources || !Number.isFinite(stamp) || stamp > now || seen.has(stamp)) continue;
    if (!Object.entries(sources).some(([key,v])=>Number.isFinite(v) && v >= 0 && W[key.replace(/1$/, '')] > 0)) continue;
    const v = value(Object.assign({}, series, validSources(sources)));
    if (Number.isFinite(v) && v >= 0) { history.push({date:new Date(stamp).toISOString(),value:v});seen.add(stamp); }
  }
  for (const snap of hist.exact || []) {
    const stamp=Date.parse(snap.t), v=snap.values?.[k];
    if(snap.modelVersion!==MM.v || !Number.isFinite(stamp) || stamp>now || !Number.isFinite(v) || v<0 || v>15000)continue;
    const row={date:new Date(stamp).toISOString(),value:v};
    const index=history.findIndex(q=>Date.parse(q.date)===stamp);
    if(index>=0)history[index]=row;else history.push(row);
  }
  const stamp = Date.parse(sourceDate);
  if (lv.used.length && Number.isFinite(stamp) && stamp <= now && Number.isFinite(current)) {
    // Never append a current value with a made-up timestamp during a provider outage.
    const index = history.findIndex(q=>Date.parse(q.date)===stamp);
    if (index>=0) history[index]={date:new Date(stamp).toISOString(),value:current};
    else history.push({date:new Date(stamp).toISOString(),value:current});
  }
  const change = Number.isFinite(baseline) && baseline >= 0 ? current-baseline : null;
  return { history:history.sort((a,b)=>Date.parse(a.date)-Date.parse(b.date)).slice(-60),
    historyBasis:'saved-source-model', change, percentChange:baseline>0 && change!==null? Math.round(change/baseline*10000)/100:null };
}

async function readHist() {
  if (!get) return { snaps: [] };
  try { const r = await get('market/history.json', { access: 'private', useCache: false }); if (!r || r.statusCode !== 200 || !r.stream) return { snaps: [] }; const j = JSON.parse(await new Response(r.stream).text()); return j && Array.isArray(j.snaps) ? j : { snaps: [] }; } catch (e) { return { snaps: [] }; }
}
const ET = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' });
const fd = t => ET.format(new Date(t));
// Returns { ok, body, key } or { ok:false, error }.
async function compute(host, week, fetchJson, hist, idmap, options = {}) {
  let live = null;
  try { live = await fetchJson('https://' + host + '/api/hw?market=1'); } catch (e) {}
  const lv = live && live.players ? liveSeries(live.players) : { out: {}, used: [] };
  if (!hist) {
    hist = await readHist();
    try { hist.exact = (await require("./_marketarchive").read()).snaps; } catch (_) { hist.exact = []; }
  }
  const now = Date.now(); let best = null;
  (hist.snaps || []).forEach(q => { const age = now - Date.parse(q.t); if (age >= 20 * 36e5 && age <= 10 * 864e5 && (!best || Math.abs(age - 7 * 864e5) < Math.abs(now - Date.parse(best.t) - 7 * 864e5))) best = q; });
  if (!best && !options.allowWithoutBaseline) return { ok: false, error: 'no_baseline' };
  // The complete market is independent of a historical comparison. Use exactly the
  // same valuation model/accepted provider series as the movers and website.
  const rankings = Object.entries(MM.players).map(([k, p]) => {
    const sid = (idmap && idmap[nn(p.n) + '|' + p.p]) || MM.sid[k];
    return { id: k, name: p.n, position: p.p, team: canon(p.t) || null,
      currentValue: value(Object.assign({}, p.s, lv.out[k] || {})),
      playerId: sid || 'cfn:' + k + ':' + p.p,
      photoURL: sid ? 'https://sleepercdn.com/content/nfl/players/' + sid + '.jpg?v=1' : null,
      ...portfolioHistory(k, p, Object.assign({}, p.s, lv.out[k] || {}), hist, best, live, lv, now) };
  }).filter(p => Number.isFinite(p.currentValue) && p.currentValue >= 0)
    .sort((a,b) => b.currentValue-a.currentValue || a.name.localeCompare(b.name));
  const rows = [];
  Object.keys(MM.players).forEach(k => {
    const p = MM.players[k], sNow = Object.assign({}, p.s, lv.out[k] || {}), sv = best && best.v && best.v[k]; if (!sv) return;
    const b0 = value(Object.assign({}, sNow, sv)), n0 = value(sNow); // baseline = snapshot over today's series, as the site does
    if (!b0 || !n0 || Math.max(n0, b0) < 1500) return;
    const d = n0 - b0; rows.push({ k, p, b0, n0, d, pc: d / b0 * 100 });
  });
  rows.sort((a, b) => b.pc - a.pc);
  const pid = r => { const sid = (idmap && idmap[nn(r.p.n) + '|' + r.p.p]) || MM.sid[r.k]; return sid || 'cfn:' + r.k + ':' + r.p.p; };
  const photo = r => { const sid = (idmap && idmap[nn(r.p.n) + '|' + r.p.p]) || MM.sid[r.k]; return sid ? 'https://sleepercdn.com/content/nfl/players/' + sid + '.jpg?v=1' : null; };
  const out = r => ({ id: r.k, name: r.p.n, position: r.p.p, team: canon(r.p.t) || null, currentValue: r.n0, change: r.d, percentChange: Math.round(r.pc * 100) / 100, priorValue: r.b0, playerId: pid(r), photoURL: photo(r) });
  const up = rows.filter(r => r.d > 0).slice(0, 10).map(out), down = rows.filter(r => r.d < 0).slice(-10).reverse().map(out);
  const feedAt = lv.used.length && live && (live.updated || live.dpAsOf);
  const body = { label: 'Week ' + week + ' · ' + (best ? fd(best.t) + ' to ' : '') + fd(feedAt && /^\d{4}-\d\d-\d\d$/.test(feedAt) ? feedAt + 'T12:00:00Z' : now), players: up.concat(down), rankings, baselineAt: best ? best.t : null, stale: !lv.used.length, partial: lv.used.length < KEYS.length, sources: { refreshed: lv.used, stored: ['sp1', 'km1', 'kt1'], dynastyProcessAsOf: live?.dpAsOf || null }, sourceUpdatedAt: feedAt || null, liveSeriesUsed: lv.used, model: 'cfn-gl-1qb', modelVersion: MM.v, computedAt: new Date(now).toISOString() };
  return { ok: true, body, key: [MM.v, feedAt, best?.t, week, lv.used.join('')].join('|') };
}
module.exports = { compute, value, liveSeries, MM };
