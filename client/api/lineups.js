// Live lineups for one league, read from the public Yahoo matchup pages (no login).
// GET /api/lineups?lg=gl&week=10  ->  { lg, week, at, matchups:[{ia,ib,an,bn,L:[[slot,name,pos,team,proj,pts,status]...],R:[...]}] }
// Edge-cached for a minute so many viewers share one Yahoo read.
const { fetchPage, parsePage } = require('./_ysweep');
const LGS = ['gl', 'bh', 'rb', 'sts'];
const clean = s => String(s || '').replace(/&#x[0-9a-f]+;|&#\d+;/gi, '').replace(/\s+/g, ' ').trim();
const row = x => [x.slot, x.name, x.pos, x.team, x.proj, x.pts, clean(x.status)];
module.exports = async (req, res) => {
  const t0 = Date.now();
  try {
    const q = new URL(req.url, 'http://x').searchParams;
    const lg = String(q.get('lg') || ''); if (!LGS.includes(lg)) throw new Error('bad league');
    const week = Math.min(18, Math.max(1, parseInt(q.get('week'), 10) || 10));
    const seen = new Set(), matchups = [];
    for (let mid = 1; mid <= 14 && matchups.length < 7; mid++) {
      if (seen.has(mid)) continue;
      const p = parsePage(await fetchPage(lg, week, mid));
      if (p.teams.length < 2 || (!p.L.length && !p.R.length)) { seen.add(mid); continue; }
      const [a, b] = p.teams; seen.add(a.id); seen.add(b.id);
      // left side of the page is the team in mid1
      matchups.push({ ia: a.id, ib: b.id, an: a.name, bn: b.name, L: p.L.map(row), R: p.R.map(row) });
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ lg, week, at: new Date().toISOString(), ms: Date.now() - t0, matchups }));
  } catch (e) {
    res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: String(e.message || e) }));
  }
};
