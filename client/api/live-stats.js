// Live NFL feed via BallDontLie (key stays server-side in BALLDONTLIE_API_KEY).
// GET /api/live-stats?week=11[&season=2026]  -> games + player stats for games in progress / finished
// GET /api/live-stats?plays=<gameId>          -> play-by-play for one game (GOAT tier only)
// GET /api/live-stats?ping=1                  -> checks the key / tier (no secrets returned)
// Edge-cached, so any number of viewers share the same upstream calls.
const BASE = 'https://api.balldontlie.io/nfl/v1/';
async function bdl(path, params) {
  const u = new URL(BASE + path);
  for (const [k, v] of Object.entries(params || {})) {
    if (Array.isArray(v)) v.forEach(x => u.searchParams.append(k + '[]', x)); else u.searchParams.set(k, v);
  }
  const r = await fetch(u, { headers: { Authorization: process.env.BALLDONTLIE_API_KEY } });
  const body = await r.json().catch(() => ({}));
  return { status: r.status, body };
}
async function pages(path, params, max) {
  let out = [], cursor, n = 0;
  do {
    const p = Object.assign({ per_page: 100 }, params);
    if (cursor) p.cursor = cursor;
    const { status, body } = await bdl(path, p);
    if (status !== 200) return { status, data: out };
    out = out.concat(body.data || []);
    cursor = body.meta && body.meta.next_cursor; n++;
  } while (cursor && n < (max || 8));
  return { status: 200, data: out };
}
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!process.env.BALLDONTLIE_API_KEY) { res.setHeader('Cache-Control', 'no-store'); return res.status(503).json({ error: 'no key configured' }); }
  const q = req.query || {};
  try {
    if (q.ping) {
      const g = await bdl('games', { per_page: 1 });
      const s = await bdl('stats', { per_page: 1 });
      const p = await bdl('plays', { game_id: 1 });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ games: g.status, stats: s.status, plays: p.status });
    }
    if (q.plays) {
      const r = await pages('plays', { game_id: String(q.plays).replace(/\D/g, '') }, 6);
      res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
      return res.status(r.status === 200 ? 200 : r.status).json({ plays: r.data });
    }
    const season = q.season || '2026', week = String(q.week || '').replace(/\D/g, '');
    const g = await pages('games', { seasons: [season], weeks: week ? [week] : undefined }, 2);
    if (g.status !== 200) { res.setHeader('Cache-Control', 'no-store'); return res.status(g.status).json({ error: 'games ' + g.status }); }
    const active = g.data.filter(x => x.status && !/scheduled/i.test(x.status) && !/^\d{4}-/.test(x.status));
    let stats = [];
    if (active.length) {
      const ids = active.map(x => x.id);
      const s = await pages('stats', { game_ids: ids }, 8);
      stats = s.data;
    }
    res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=60');
    res.status(200).json({ t: Date.now(), games: g.data, stats });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'upstream failed' });
  }
};
