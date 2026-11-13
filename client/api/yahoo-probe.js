// Probe: read one public Yahoo matchup page and return parsed lineups. GET /api/yahoo-probe?lg=gl&week=10&mid1=1
const { fetchPage, parsePage } = require('./_ysweep');
module.exports = async (req, res) => {
  const t0 = Date.now();
  try {
    const q = new URL(req.url, 'http://x').searchParams;
    const html = await fetchPage(String(q.get('lg') || 'gl'), q.get('week') || 10, q.get('mid1') || 1);
    const p = parsePage(html);
    res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ ms: Date.now() - t0, bytes: html.length, teams: p.teams, nL: p.L.length, nR: p.R.length, skipped: p.skipped, dbg: p.dbg, L: p.L.map(x => [x.slot, x.name, x.team, x.pos, x.inj, x.proj, x.pts, x.status].join('|')), R: p.R.map(x => [x.slot, x.name, x.team, x.pos, x.inj, x.proj, x.pts, x.status].join('|')) }));
  } catch (e) { res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ error: String(e.message || e), ms: Date.now() - t0 })); }
};
