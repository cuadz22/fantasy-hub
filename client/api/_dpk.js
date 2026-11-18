// Live draft-pick ownership, read from each league's public Yahoo "Draft Picks" page (no login).
// Used by /api/trades as the starting point for the Draft Picks & Keepers board, so the board follows Yahoo trades
// automatically instead of relying on a snapshot someone has to remember to refresh. If Yahoo can't be read (or the
// page doesn't look right) the caller falls back to the snapshot in trades-base.json.
const IDS = { bh: 100398, rb: 101720 };
const ROUNDS = { bh: 16, rb: 17 };
const TTL = 10 * 60 * 1000;
const mem = {};

// rows[round-1][originalTeamId-1] = id of the team that holds that pick now
function parse(html, lg) {
  const parts = String(html).split(/<th colspan="2">Round (\d+)<\/th>/);
  const rows = [];
  for (let i = 1; i < parts.length; i += 2) {
    const rd = parseInt(parts[i], 10), seg = parts[i + 1].split('</table>')[0];
    const holder = [];
    const re = /<tr class="(?:odd|even)[^"]*"[^>]*>\s*<td class="team">[\s\S]*?<\/td>\s*<td class="owned">([\s\S]*?)<\/td>\s*<\/tr>/g;
    let m;
    while ((m = re.exec(seg))) holder.push(m[1]);
    if (holder.length !== 12) return null;
    const out = Array(12).fill(0);
    holder.forEach((cell, hi) => {
      const a = /href="\/f1\/\d+\/(\d+)"/g; let x;
      while ((x = a.exec(cell))) { const o = parseInt(x[1], 10); if (o >= 1 && o <= 12 && !out[o - 1]) out[o - 1] = hi + 1; else return; }
    });
    if (out.some((v) => !v)) return null;           // every original pick must be held by exactly one team
    rows[rd - 1] = out;
  }
  const n = ROUNDS[lg];
  for (let r = 0; r < n; r++) if (!rows[r]) return null;
  return rows.slice(0, n);
}

async function liveDpk(lg) {
  const id = IDS[lg]; if (!id) return null;
  const c = mem[lg]; if (c && Date.now() - c.t < TTL) return c.rows;
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 5000);
  try {
    const r = await fetch('https://football.fantasysports.yahoo.com/f1/' + id + '/showtradedpicks', { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; cfn-site)', 'Accept-Language': 'en-US,en;q=0.9' } });
    if (!r.ok) throw new Error('yahoo ' + r.status);
    const rows = parse(await r.text(), lg);
    if (!rows) throw new Error('unparsed');
    mem[lg] = { t: Date.now(), rows }; return rows;
  } catch (e) { return c ? c.rows : null; }
  finally { clearTimeout(tm); }
}

// GET /api/hw?dpk=1&lg=rb  -> { lg, source:'yahoo'|'none', rows }  (diagnostic)
async function route(req, res) {
  const q = new URL(req.url, 'http://x').searchParams, lg = String(q.get('lg') || '');
  const rows = await liveDpk(lg);
  res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  res.end(JSON.stringify({ lg, source: rows ? 'yahoo' : 'none', rows: rows || null }));
}
module.exports = route; module.exports.liveDpk = liveDpk; module.exports.parse = parse;
