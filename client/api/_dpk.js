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
  try {
    let teams = []; try { teams = require('./trades-base.json')[lg].teams; } catch (e) {}
    const rows = await liveFromTrades(lg, teams);
    if (!rows) throw new Error('unparsed');
    mem[lg] = { t: Date.now(), rows }; return rows;
  } catch (e) { mem._err = String((e && e.message) || e); return c ? c.rows : null; }
}

// ---- Pick ownership rebuilt from the league's public Trades list --------------------------------------------------
// Yahoo's own "Draft Picks" page needs a login, so the server cannot read it. The Transactions > Trades page is public.
// Each trade is a pair of rows (one per receiving team); a pick listed on a row came from the OTHER team's side unless the
// row says "(traded from <team>)". We replay every completed trade in order on top of "everyone owns their own picks"
// and refuse the result (return null, so the caller falls back to the snapshot) if any step does not line up.
const norm = (s) => String(s || '').replace(/&#?\w+;/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
function parseTrades(html, lg, teams) {
  const byName = {}; (teams || []).forEach((t) => { byName[norm(t.team)] = t.id; });
  const n = ROUNDS[lg]; if (!n) return null;
  const rows = String(html).split(/<tr[\s>]/).slice(1).filter((r) => /Traded to|Vetoed Trade to/.test(r));
  const blocks = []; let cur = null;
  for (const r of rows) {
    if (/xe037/.test(r) || !cur) { cur = []; blocks.push(cur); }
    const tid = /class="Ta-end"[\s\S]*?href="\/f1\/\d+\/(\d+)"/.exec(r);
    const picks = [];
    const re = /<p>\s*Round (\d+)([\s\S]*?)<\/p>/g; let m;
    while ((m = re.exec(r))) { const a = /traded from\s*([^<)]*)/i.exec(m[2]); picks.push({ round: +m[1], from: a ? byName[norm(a[1])] || -1 : 0 }); }
    cur.push({ to: tid ? +tid[1] : 0, veto: /Vetoed/.test(r), picks });
  }
  const own = Array.from({ length: n }, () => Array.from({ length: 12 }, (_, i) => i + 1));
  for (const b of blocks.slice().reverse()) {                    // oldest first
    if (b.some((x) => x.veto)) continue;
    if (b.length !== 2 || !b[0].to || !b[1].to || b[0].to === b[1].to) { if (b.some((x) => x.picks.length)) return null; continue; }
    for (let k = 0; k < 2; k++) {
      const recv = b[k], giver = b[1 - k].to;
      for (const p of recv.picks) {
        const orig = p.from === 0 ? giver : p.from;
        if (orig < 1 || orig > 12 || p.round < 1 || p.round > n) return null;
        if (own[p.round - 1][orig - 1] !== giver) return null;  // the giver must actually hold this pick right now
      }
    }
    for (let k = 0; k < 2; k++) {                                // apply after validating both sides (swap-safe)
      const recv = b[k], giver = b[1 - k].to;
      for (const p of recv.picks) own[p.round - 1][(p.from === 0 ? giver : p.from) - 1] = recv.to;
    }
  }
  return own;
}
async function liveFromTrades(lg, teams) {
  const id = IDS[lg]; if (!id) return null;
  let html = '';
  for (let off = 0; off < 150; off += 25) {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 5000);
    try {
      const r = await fetch('https://football.fantasysports.yahoo.com/f1/' + id + '/transactions?transactionsfilter=trade&count=' + off, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; cfn-site)', 'Accept-Language': 'en-US,en;q=0.9' } });
      const t = await r.text(); mem._dbg2 = { status: r.status, len: t.length, redirected: /login\.yahoo/.test(r.url) };
      if (!r.ok || /login\.yahoo/.test(r.url)) throw new Error('yahoo ' + r.status);
      const got = (t.match(/Traded to|Vetoed Trade to/g) || []).length;
      if (!got) break; html += t; if (got < 25) break;
    } finally { clearTimeout(tm); }
  }
  return html ? parseTrades(html, lg, teams) : null;
}

// GET /api/hw?dpk=1&lg=rb  -> { lg, source:'yahoo'|'none', rows }  (diagnostic)
async function route(req, res) {
  const q = new URL(req.url, 'http://x').searchParams, lg = String(q.get('lg') || '');
  const rows = await liveDpk(lg);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', rows && !q.get('debug') ? 'public, s-maxage=300, stale-while-revalidate=3600' : 'no-store');
  res.end(JSON.stringify({ lg, source: rows ? 'yahoo' : 'none', rows: rows || null, debug: q.get('debug') ? { err: mem._err || null, last: mem._dbg2 || null } : undefined }));
}
module.exports = route; module.exports.liveDpk = liveDpk; module.exports.parse = parse; module.exports.parseTrades = parseTrades;
