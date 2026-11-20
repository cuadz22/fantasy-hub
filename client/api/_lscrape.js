// Reads one league-week from the public Yahoo team pages (shared by /api/lineups, the cron refresh and backfill).
const { fetchPage, parsePage, fetchTeam, parseTeam } = require('./_ysweep');
const clean = s => String(s || '').replace(/&#x[0-9a-f]+;|&#\d+;/gi, '').replace(/\s+/g, ' ').trim();
const row = x => [x.slot, x.name, x.pos, x.team, x.proj, x.pts, clean(x.status), x.inj || ''];
async function scrapeLeague(lg, week) {
  const seen = new Set(), matchups = [], diag = {}; let diagT = null;
  try {
    const ids = Array.from({ length: 12 }, (_, i) => i + 1), T = {}; diagT = T; let next = 0;
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (next < ids.length) {
        const id = ids[next++]; let last = null;
        for (let n = 0; n < 3; n++) { try { const pt = parseTeam(await fetchTeam(lg, week, id), id); if (pt.rows.length >= 8) { T[id] = pt; last = null; break; } last = 'rows ' + pt.rows.length; } catch (e) { last = String(e.message || e).slice(0, 60); } await new Promise(r => setTimeout(r, 350 * (n + 1))); }
        if (last) { T[id] = T[id] || null; diag[id] = last; }
      }
    }));
    const done = new Set();
    ids.forEach(id => {
      const a = T[id]; if (!a || !a.opp || done.has(id) || done.has(a.opp)) return;
      const b = T[a.opp]; if (!b || !a.rows.length || !b.rows.length) return;
      done.add(id); done.add(a.opp);
      const [x, y] = id < a.opp ? [a, b] : [b, a];
      matchups.push({ ia: x.id, ib: y.id, an: x.name, bn: y.name, L: x.rows.map(row), R: y.rows.map(row), ya: x.tot, yb: y.tot });
    });
  } catch (e) { matchups.length = 0; }
  const useOld = !matchups.length; let err = null;
  try { for (let mid = 1; useOld && mid <= 14 && matchups.length < 7; mid++) {
    if (seen.has(mid)) continue;
    const p = parsePage(await fetchPage(lg, week, mid));
    if (p.teams.length < 2 || (!p.L.length && !p.R.length)) { seen.add(mid); continue; }
    const [a, b] = p.teams; seen.add(a.id); seen.add(b.id);
    matchups.push({ ia: a.id, ib: b.id, an: a.name, bn: b.name, L: p.L.map(row), R: p.R.map(row) });
  } } catch (e) { err = String(e.message || e).slice(0, 80); }
  const partial = useOld ? matchups.length < 6 : matchups.length < 6 || matchups.some(m => m.L.length < 8 || m.R.length < 8);
  return { matchups, partial, useOld, diag, diagT, err };
}
module.exports = { scrapeLeague };
