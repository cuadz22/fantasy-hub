// Live NFL feed via BallDontLie (key stays server-side in BALLDONTLIE_API_KEY).
// GET /api/live-stats?week=11[&season=2026]  -> games + player stats for games in progress / finished
// GET /api/live-stats?plays=<gameId>          -> play-by-play for one game (GOAT tier only)
// GET /api/live-stats?ping=1                  -> checks the key / tier (no secrets returned)
// Edge-cached, so any number of viewers share the same upstream calls.
const BASE = 'https://api.balldontlie.io/nfl/v1/';
// Per-league scoring fitted to each league's real Week 9 scores: [pass yd, pass TD, INT, rush yd, rush TD, rec, rec yd, rec TD, fumble lost]
const SCORING = { gl: [0.05, 6, -2, 0.1, 6, 1, 0.1, 6, -2], bh: [0.05, 6, -1, 0.1, 6, 1, 0.1, 6, -2], rb: [0.04, 6, -2, 0.1, 6, 1, 0.1, 6, -2], sts: [0.05, 6, -2, 0.1, 6, 1, 0.1, 6, -2] };
const CARDS_URL = 'https://gist.githubusercontent.com/cuadz22/9727cb8f5b18fb3307b459b82214c15d/raw/player-cards.json';
const normN = x => String(x || '').toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '').replace(/[^a-z]/g, '');
let CARDS = null, CARDS_T = 0;
async function cards() {
  if (CARDS && Date.now() - CARDS_T < 120000) return CARDS;
  const r = await fetch(CARDS_URL + '?t=' + Math.floor(Date.now() / 120000), { headers: { 'User-Agent': 'cfn-site' } });
  if (!r.ok) throw new Error('cards ' + r.status);
  const j = await r.json(), idx = {};
  (j.players || []).forEach(x => { (idx[normN(x.name)] = idx[normN(x.name)] || []).push(x); });
  CARDS = { gen: j.generated_at, wk: j.week, idx }; CARDS_T = Date.now();
  return CARDS;
}
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
    if (q.card) {
      const C = await cards(), a = C.idx[normN(q.card)] || [], x = (q.team && a.find(y => y.team === q.team)) || a[0];
      res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
      if (!x) return res.status(200).json({ gen: C.gen, wk: C.wk, p: null });
      const e = x.fantasypros_ecr || {}, sp = x.sleeper_projection_rank || {};
      return res.status(200).json({ gen: C.gen, wk: C.wk, p: { rank: x.rank || null, fp: x.fp_consensus_rank || null, fpMin: e.rank_min || null, fpMax: e.rank_max || null, fpN: e.total_experts || null, pts: sp.pts_half_ppr == null ? null : sp.pts_half_ppr, news: [x.news, x.news_rotowire].filter(Boolean), mu: x.matchup || null } });
    }
    if (q.player) {
      const nm = String(q.player).slice(0, 60), last = nm.split(' ').slice(-1)[0].replace(/[^A-Za-z'\-]/g, '');
      const norm = x => String(x || '').toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '').replace(/[^a-z]/g, '');
      const f = await bdl('players', { search: last, per_page: 25 });
      const hit = ((f.body && f.body.data) || []).find(x => norm(x.first_name + x.last_name) === norm(nm));
      if (!hit) { res.setHeader('Cache-Control', 'public, s-maxage=600'); return res.status(200).json({ log: [], note: 'no match', status: f.status }); }
      const r = await pages('stats', { player_ids: [hit.id], seasons: ['2026'] }, 2);
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');
      const n0 = v => (v == null ? 0 : v), log = [];
      r.data.forEach(x => {
        const g = x.game || {}, tm = x.team || {};
        if (g.postseason || !g.date || Date.parse(g.date) < Date.parse('2026-09-01')) return;
        const home = g.home_team && g.home_team.id === tm.id, o = home ? g.visitor_team : g.home_team;
        const parts = [];
        if (x.passing_attempts) parts.push(n0(x.passing_completions) + '/' + x.passing_attempts + ' ' + n0(x.passing_yards) + ' yds' + (x.passing_touchdowns ? ' ' + x.passing_touchdowns + ' TD' : '') + (x.passing_interceptions ? ' ' + x.passing_interceptions + ' INT' : ''));
        if (x.rushing_attempts) parts.push(x.rushing_attempts + ' car ' + n0(x.rushing_yards) + ' yds' + (x.rushing_touchdowns ? ' ' + x.rushing_touchdowns + ' TD' : ''));
        if (x.receptions || x.receiving_targets) parts.push(n0(x.receptions) + '/' + n0(x.receiving_targets) + ' ' + n0(x.receiving_yards) + ' yds' + (x.receiving_touchdowns ? ' ' + x.receiving_touchdowns + ' TD' : ''));
        if (x.field_goal_attempts || x.extra_points_made) parts.push(n0(x.field_goals_made) + '/' + n0(x.field_goal_attempts) + ' FG' + (x.extra_points_made ? ' ' + x.extra_points_made + ' XP' : ''));
        if (!parts.length) return;
        const sc = SCORING[q.lg] || SCORING.gl, v = [x.passing_yards, x.passing_touchdowns, x.passing_interceptions, x.rushing_yards, x.rushing_touchdowns, x.receptions, x.receiving_yards, x.receiving_touchdowns, x.fumbles_lost];
        const pts = Math.round(v.reduce((a, b, i) => a + n0(b) * sc[i], 0) * 100) / 100;
        log.push({ wk: g.week, opp: (home ? 'vs ' : '@') + (o && o.abbreviation || ''), line: parts.join(' · '), pts, fin: g.status_state === 'final' });
      });
      log.sort((a, b) => b.wk - a.wk);
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');
      return res.status(200).json({ id: hit.id, log: log.slice(0, 10) });
    }
    if (q.plays) {
      const r = await pages('plays', { game_id: String(q.plays).replace(/\D/g, '') }, 6);
      res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
      return res.status(r.status === 200 ? 200 : r.status).json({ plays: r.data });
    }
    const season = q.season || '2026', week = String(q.week || '').replace(/\D/g, '');
    const g = await pages('games', { seasons: [season], weeks: week ? [week] : undefined }, 2);
    if (g.status !== 200) { res.setHeader('Cache-Control', 'no-store'); return res.status(g.status).json({ error: 'games ' + g.status }); }
    const active = g.data.filter(x => x.date && Date.parse(x.date) <= Date.now() + 10 * 60000); // kicked off (or about to)
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
