// Live NFL feed via BallDontLie (key stays server-side in BALLDONTLIE_API_KEY).
// GET /api/live-stats?week=11[&season=2026]  -> games + player stats for games in progress / finished
// GET /api/live-stats?plays=<gameId>          -> play-by-play for one game (GOAT tier only)
// GET /api/live-stats?ping=1                  -> checks the key / tier (no secrets returned)
// Edge-cached, so any number of viewers share the same upstream calls.
const BASE = 'https://api.balldontlie.io/nfl/v1/';
// Per-league scoring, fitted to each league's real Week 9 scores (nflverse stats): bonuses are flat adds.
const SCORING = {
  gl: { py: 0.05, ptd: 6, it: -2, fl: -2, two: 2, r100: 3, c100: 2, p300: 2, rc40: 0 },
  bh: { py: 0.05, ptd: 6, it: -1, fl: -2, two: 2, r100: 0, c100: 0, p300: 0, rc40: 0 },
  rb: { py: 0.04, ptd: 6, it: -2, fl: -2, two: 2, r100: 2, c100: 1, p300: 2, rc40: 1 },
  sts: { py: 0.05, ptd: 6, it: -2.5, fl: -2, two: 2, r100: 3, c100: 1, p300: 2, rc40: 0 }
};
let CAREER = {}; try { CAREER = require('./career-highs.json'); } catch (e) {}
function scoreRow(r, lg) {
  const c = SCORING[lg] || SCORING.gl;
  return Math.round((r.py * c.py + r.ptd * c.ptd + r.it * c.it + r.ry * 0.1 + r.rtd * 6 + r.rec + r.cy * 0.1 + r.ctd * 6 + r.fl * c.fl + r.two * c.two + r.st * 6 +
    (r.ry >= 100 ? c.r100 : 0) + (r.cy >= 100 ? c.c100 : 0) + (r.py >= 300 ? c.p300 : 0) + r.c40 * c.rc40) * 100) / 100;
}
function parseCsvLine(l) {
  const o = []; let cur = '', q = false;
  for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; } else if (ch === '"') q = true; else if (ch === ',') { o.push(cur); cur = ''; } else cur += ch; }
  o.push(cur); return o;
}
let NFL = null, NFL_T = 0;
async function nfl() {
  if (NFL && Date.now() - NFL_T < 600000) return NFL;
  const r = await fetch('https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2026.csv.gz', { headers: { 'User-Agent': 'cfn-site' } });
  if (!r.ok) throw new Error('nflverse ' + r.status);
  const txt = require('zlib').gunzipSync(Buffer.from(await r.arrayBuffer())).toString('utf8').split('\n');
  const H = parseCsvLine(txt[0]), ix = {}; H.forEach((h, i) => { ix[h] = i; });
  const num = (a, k) => { const v = a[ix[k]]; return v === '' || v == null || v === 'NA' ? 0 : +v; };
  const byName = {}, teamWks = {};
  for (let i = 1; i < txt.length; i++) {
    if (!txt[i]) continue; const a = parseCsvLine(txt[i]); if (a[ix.season_type] !== 'REG') continue;
    const team = a[ix.team], wk = +a[ix.week]; (teamWks[team] = teamWks[team] || new Set()).add(wk);
    const pos = a[ix.position]; if (!/^(QB|RB|WR|TE)$/.test(pos)) continue;
    const row = { nm: a[ix.player_display_name], pos, team, wk, opp: a[ix.opponent_team], gid: a[ix.game_id], cmp: num(a, 'completions'), att: num(a, 'attempts'), py: num(a, 'passing_yards'), ptd: num(a, 'passing_tds'), it: num(a, 'passing_interceptions'),
      car: num(a, 'carries'), ry: num(a, 'rushing_yards'), rtd: num(a, 'rushing_tds'), rec: num(a, 'receptions'), tgt: num(a, 'targets'), cy: num(a, 'receiving_yards'), ctd: num(a, 'receiving_tds'),
      fl: num(a, 'sack_fumbles_lost') + num(a, 'rushing_fumbles_lost') + num(a, 'receiving_fumbles_lost'), two: num(a, 'passing_2pt_conversions') + num(a, 'rushing_2pt_conversions') + num(a, 'receiving_2pt_conversions'), st: num(a, 'special_teams_tds'), c40: num(a, 'receiving_40'), ts: num(a, 'target_share') };
    (byName[normN(a[ix.player_display_name])] = byName[normN(a[ix.player_display_name])] || []).push(row);
  }
  NFL = { byName, teamWks }; NFL_T = Date.now(); return NFL;
}
const CARDS_URL = 'https://gist.githubusercontent.com/cuadz22/9727cb8f5b18fb3307b459b82214c15d/raw/player-cards.json';
const normN = x => String(x || '').toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '').replace(/[^a-z]/g, '');
let CARDS = null, CARDS_T = 0;
const TEAMG = {};
async function cards() {
  if (CARDS && Date.now() - CARDS_T < 120000) return CARDS;
  const r = await fetch(CARDS_URL + '?t=' + Math.floor(Date.now() / 120000), { headers: { 'User-Agent': 'cfn-site' } });
  if (!r.ok) throw new Error('cards ' + r.status);
  const j = await r.json(), idx = {};
  (j.players || []).forEach(x => { (idx[normN(x.name)] = idx[normN(x.name)] || []).push(x); });
  const dvp = {};
  (j.players || []).forEach(x => { const m = x.matchup; if (m && !m.bye && m.opponent && m.tier && m.defense_rank_vs_position) { (dvp[x.position] = dvp[x.position] || {})[m.opponent] = { r: m.defense_rank_vs_position, t: m.tier, c: m.color }; } });
  const DV = j.defense_vs_position && j.defense_vs_position.positions;
  if (DV) Object.keys(DV).forEach(pos => { const o = {}; (DV[pos] || []).forEach(t => { o[t.team] = { r: t.rank, t: t.tier, c: t.color }; }); if (Object.keys(o).length) dvp[pos] = o; });
  CARDS = { gen: j.generated_at, wk: j.week, idx, dvp }; CARDS_T = Date.now();
  return CARDS;
}
const BDL = require('./_bdl');
async function bdl(path, params) { return { status: 200, body: await BDL.page(path, params) }; }
async function pages(path, params, max) { return { status: 200, data: await BDL.all(path, params, { maxPages: max || 20, signal: AbortSignal.timeout(25000) }) }; }
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'POST') {
    // Member sign-in for the My Team tab. PINs live only in the CFN_MEMBERS env var: {"Gio":"1234",...}
    res.setHeader('Cache-Control', 'no-store');
    let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};
    let M = {}; try { M = JSON.parse(process.env.CFN_MEMBERS || '{}'); } catch (e) { M = {}; }
    if (!Object.keys(M).length) return res.status(503).json({ error: 'not configured' });
    const nm = String(b.name || ''), want = Object.prototype.hasOwnProperty.call(M, nm) ? String(M[nm]) : '';
    const h = x => require('crypto').createHash('sha256').update(String(x)).digest();
    const ok = want.length > 0 && require('crypto').timingSafeEqual(h(b.pin || ''), h(want));
    if (!ok) { await new Promise(r => setTimeout(r, 600)); return res.status(401).json({ error: 'bad login' }); }
    return res.status(200).json({ ok: true, name: nm });
  }
  const q = req.query || {};
  if (q.pw) {
    // Whole-season box scores for every QB/RB/WR/TE, for the Commish player cards.
    // Primary: nflverse weekly stats. Fallback: BallDontLie box scores for games that are Final but not in nflverse yet.
    try {
      const N = await nfl(), out = [], tw = {}, have = {};
      Object.keys(N.teamWks).forEach(t => { tw[t] = Array.from(N.teamWks[t]).sort((x, y) => x - y); tw[t].forEach(w => { have[t + '|' + w] = 1; }); });
      Object.keys(N.byName).forEach(k => {
        N.byName[k].forEach(r => {
          if (!(r.att || r.car || r.tgt || r.rec)) return;
          const g = String(r.gid).split('_');
          out.push([k, r.pos, r.team, r.wk, r.opp, g[3] === r.team ? 1 : 0, r.cmp, r.att, r.py, r.ptd, r.it, r.car, r.ry, r.rtd, r.tgt, r.rec, r.cy, r.ctd, r.fl, r.two, r.st, Math.round((r.ts || 0) * 1000) / 1000, 0, r.nm]);
        });
      });
      let prov = 0;
      if (process.env.BALLDONTLIE_API_KEY) {
        try {
          const BA = { WSH: 'WAS', LAR: 'LA', JAC: 'JAX' }, ab = x => BA[x] || x;
          const gm = await pages('games', { seasons: ['2026'] }, 4);
          const fin = (gm.data || []).filter(x => /final/i.test(x.status_state || x.status || '') && x.home_team && x.visitor_team)
            .filter(x => !have[ab(x.home_team.abbreviation) + '|' + x.week] || !have[ab(x.visitor_team.abbreviation) + '|' + x.week]).slice(0, 8);
          if (fin.length) {
            const st = await pages('stats', { game_ids: fin.map(x => x.id) }, 8), by = {};
            (st.data || []).forEach(x => {
              const pos = x.player && x.player.position_abbreviation; if (!/^(QB|RB|WR|TE)$/.test(pos || '')) return;
              const g = x.game, h = ab(g.home_team.abbreviation), v = ab(g.visitor_team.abbreviation), tm = ab(x.team.abbreviation), n0 = v => +v || 0;
              const row = { nm: (x.player.first_name + ' ' + x.player.last_name), pos, tm, wk: g.week, opp: tm === h ? v : h, home: tm === h ? 1 : 0, cmp: n0(x.passing_completions), att: n0(x.passing_attempts), py: n0(x.passing_yards), ptd: n0(x.passing_touchdowns), it: n0(x.passing_interceptions), car: n0(x.rushing_attempts), ry: n0(x.rushing_yards), rtd: n0(x.rushing_touchdowns), tgt: n0(x.receiving_targets), rec: n0(x.receptions), cy: n0(x.receiving_yards), ctd: n0(x.receiving_touchdowns), fl: n0(x.fumbles_lost) };
              if (!(row.att || row.car || row.tgt || row.rec)) return;
              const gk = g.id + '|' + tm; by[gk] = by[gk] || { tg: 0, rows: [] }; by[gk].tg += row.tgt; by[gk].rows.push(row);
            });
            Object.keys(by).forEach(gk => by[gk].rows.forEach(r => {
              if (have[r.tm + '|' + r.wk]) return;
              out.push([normN(r.nm), r.pos, r.tm, r.wk, r.opp, r.home, r.cmp, r.att, r.py, r.ptd, r.it, r.car, r.ry, r.rtd, r.tgt, r.rec, r.cy, r.ctd, r.fl, 0, 0, by[gk].tg ? Math.round(r.tgt / by[gk].tg * 1000) / 1000 : 0, 1, r.nm]); prov++;
            }));
            fin.forEach(x => [ab(x.home_team.abbreviation), ab(x.visitor_team.abbreviation)].forEach(t => { if (!have[t + '|' + x.week]) { (tw[t] = tw[t] || []).push(x.week); } }));
          }
        } catch (e) { console.error('pw bdl', e && e.message); }
      }
      let last = 0; Object.keys(tw).forEach(t => tw[t].forEach(w => { if (w > last) last = w; }));
      res.setHeader('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=900');
      return res.status(200).json({ gen: Date.now(), last, tw, prov, r: out });
    } catch (e) {
      console.error('live-stats pw', e && e.message);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'stats unavailable' });
    }
  }
  if (!process.env.BALLDONTLIE_API_KEY) { res.setHeader('Cache-Control', 'no-store'); return res.status(503).json({ error: 'no key configured' }); }
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
      const seen = {}, news = [].concat(x.news_items || [], x.news || [], x.news_rotowire || []).filter(n => { const k = n && (n.link || n.headline); if (!k || seen[k]) return false; seen[k] = 1; return true; }).sort((p1, p2) => Date.parse(p2.timestamp || 0) - Date.parse(p1.timestamp || 0)).slice(0, 4);
      return res.status(200).json({ gen: C.gen, wk: C.wk, p: { rank: x.rank || null, rs: x.rank_source || null, fpMin: e.rank_min || null, fpMax: e.rank_max || null, fpN: e.total_experts || null, sr: x.sleeper_rank || null, pts: sp.pts_ppr == null ? null : sp.pts_ppr, news, mu: x.matchup || null, dvp: C.dvp[x.position] || {} } });
    }
    if (q.player) {
      const nm = String(q.player).slice(0, 60), pos = String(q.pos || '').toUpperCase(), lg = SCORING[q.lg] ? q.lg : 'gl';
      const N = await nfl(), k0 = normN(nm), rows = (N.byName[k0] || []).filter(r => !pos || r.pos === pos);
      res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
      const hist = CAREER[k0 + '|' + (pos || (rows[0] && rows[0].pos) || '')] || null;
      let ch = hist && hist[lg] ? { pts: hist[lg][0], yr: hist[lg][1], wk: hist[lg][2], opp: hist[lg][3] } : null;
      const log = [];
      rows.sort((x, y) => y.wk - x.wk).forEach(r => {
        const pts = scoreRow(r, lg), parts = [];
        if (r.att) parts.push(r.cmp + '/' + r.att + ' ' + r.py + ' yds' + (r.ptd ? ' ' + r.ptd + ' TD' : '') + (r.it ? ' ' + r.it + ' INT' : ''));
        if (r.car) parts.push(r.car + ' car ' + r.ry + ' yds' + (r.rtd ? ' ' + r.rtd + ' TD' : ''));
        if (r.rec || r.tgt) parts.push(r.rec + '/' + r.tgt + ' ' + r.cy + ' yds' + (r.ctd ? ' ' + r.ctd + ' TD' : ''));
        if (!parts.length) return;
        const g = String(r.gid).split('_'), home = g[3] === r.team;
        log.push({ wk: r.wk, opp: (home ? 'vs ' : '@') + r.opp, line: parts.join(' · '), pts, fin: true });
        if (!ch || pts > ch.pts) ch = { pts, yr: 2026, wk: r.wk, opp: (home ? 'vs ' : '@') + r.opp };
      });
      const team = rows.length ? rows.sort((x, y) => y.wk - x.wk)[0].team : null;
      const wks = team && N.teamWks[team] ? Array.from(N.teamWks[team]).sort((x, y) => x - y) : undefined;
      if (ch && /^[A-Z]/.test(ch.opp) && !/^(vs|@)/.test(ch.opp)) ch.opp = ch.opp;
      return res.status(200).json({ wks, ch, log: log.slice(0, 12) });
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
    console.error('live-stats', e && e.message);
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'upstream failed' });
  }
};
