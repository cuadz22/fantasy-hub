// Daily market-value history. Kept in one private Blob file (market/history.json).
//   /api/hw?snap=1  (daily cron) -> reads the live market feed and appends today's snapshot (at most once per 20 hours)
//   /api/hw?hist=1  -> the stored history, for the Market page's movers
const { put, get } = require('@vercel/blob');
const PATH = 'market/history.json', KEEP = 60, GAP_MS = 20 * 3600 * 1000;

async function readHist() {
  let r;
  try { r = await get(PATH, { access: 'private', useCache: false }); }
  catch (e) { if (e && /not.?found|404/i.test(e.name + ' ' + e.message)) return { snaps: [] }; throw e; }
  if (!r || r.statusCode !== 200 || !r.stream) return { snaps: [] };
  const j = JSON.parse(await new Response(r.stream).text());
  return j && Array.isArray(j.snaps) ? j : { snaps: [] };
}

module.exports = async (req, res) => {
  try {
    if (req.query && req.query.hist) {
      const h = await readHist();
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
      return res.status(200).json(h);
    }
    const h = await readHist();
    const last = h.snaps[h.snaps.length - 1];
    if (last && Date.now() - Date.parse(last.t) < GAP_MS) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ skipped: 'recent snapshot', last: last.t, n: h.snaps.length });
    }
    const r = await fetch('https://' + req.headers.host + '/api/hw?market=1&nocache=' + Date.now(), { headers: { 'User-Agent': 'cfn-snap' } });
    if (!r.ok) throw new Error('market feed ' + r.status);
    const m = await r.json();
    if (!m || !m.players || (m.ok || []).length < 4 || (m.n || 0) < 300) throw new Error('market feed failed its checks');
    const v = {};
    Object.keys(m.players).forEach((k) => {
      const o = {};
      Object.keys(m.players[k]).forEach((s) => { const x = m.players[k][s]; if (isFinite(x)) o[s] = Math.round(x); });
      if (Object.keys(o).length) v[k] = o;
    });
    h.snaps.push({ t: new Date().toISOString(), d: new Date().toISOString().slice(0, 10), ok: m.ok, v });
    h.snaps = h.snaps.slice(-KEEP);
    await put(PATH, JSON.stringify(h), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ saved: true, n: h.snaps.length, players: Object.keys(v).length });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).json({ error: String(e && e.message || e).slice(0, 200) });
  }
};
