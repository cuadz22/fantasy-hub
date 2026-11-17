// Live market values for the Market page. GET /api/market
// FantasyCalc (redraft + dynasty, 1QB and Superflex) and DynastyProcess (open CSV, 1QB and Superflex),
// read server-side, checked, and edge-cached. The page falls back to its stored values if this is down or looks wrong.
const FC = 'https://api.fantasycalc.com/values/current';
const DP = 'https://raw.githubusercontent.com/dynastyprocess/data/master/files/values.csv';

function nn(x) { return String(x || '').toLowerCase().replace(/’/g, "'").replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '').replace(/[^a-z]/g, ''); }

async function get(url, ms = 12000) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'cfn-site' }, signal: ac.signal });
    if (!r.ok) throw new Error(url.split('?')[0] + ' ' + r.status);
    return await r.text();
  } finally { clearTimeout(t); }
}

function csvRows(t) {
  const out = []; let row = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.length > 1 || row[0]) out.push(row); row = []; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); out.push(row); }
  return out;
}

// A series is only used if it looks like a real value list: enough players, finite numbers, sane range, a real top end.
function sane(map) {
  const v = Object.values(map);
  return v.length >= 250 && v.every((x) => Number.isFinite(x) && x >= 0 && x <= 15000) && Math.max(...v) >= 5000;
}

async function fcSeries(isDynasty, numQbs) {
  const j = JSON.parse(await get(`${FC}?isDynasty=${isDynasty}&numQbs=${numQbs}&numTeams=12&ppr=1`));
  const m = {};
  (Array.isArray(j) ? j : []).forEach((e) => { const k = nn(e && e.player && e.player.name); if (k && Number.isFinite(+e.value)) m[k] = Math.round(+e.value); });
  return m;
}

module.exports = async (req, res) => {
  try {
    const players = {}, ok = [], failed = [], meta = {};
    const put = (key, map) => { if (!sane(map)) { failed.push(key); return; } ok.push(key); Object.keys(map).forEach((k) => { (players[k] = players[k] || {})[key] = map[k]; }); };
    const jobs = [
      ['ros1', () => fcSeries(false, 1)], ['ros2', () => fcSeries(false, 2)],
      ['dyn1', () => fcSeries(true, 1)], ['dyn2', () => fcSeries(true, 2)],
    ].map(([key, fn]) => fn().then((m) => put(key, m)).catch(() => failed.push(key)));
    jobs.push(get(DP).then((t) => {
      const rows = csvRows(t), h = rows[0], ix = (n) => h.indexOf(n), a = ix('player'), p = ix('pos'), v1 = ix('value_1qb'), v2 = ix('value_2qb'), d = ix('scrape_date');
      if ([a, p, v1, v2].some((i) => i < 0)) throw new Error('DynastyProcess columns changed');
      const m1 = {}, m2 = {};
      rows.slice(1).forEach((r) => { if (r[p] === 'PICK') return; const k = nn(r[a]); if (!k) return; m1[k] = +r[v1]; m2[k] = +r[v2]; if (d >= 0 && r[d]) meta.dpAsOf = r[d]; });
      put('dp1', m1); put('dp2', m2);
    }).catch(() => failed.push('dp1', 'dp2')));
    await Promise.all(jobs);
    if (!ok.length) throw new Error('no source passed its checks');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=7200');
    res.status(200).json({ updated: new Date().toISOString(), dpAsOf: meta.dpAsOf || '', ok: ok.sort(), failed: failed.sort(), n: Object.keys(players).length, players });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'market feed unavailable' });
  }
};
module.exports.nn = nn; module.exports.csvRows = csvRows; module.exports.sane = sane;
