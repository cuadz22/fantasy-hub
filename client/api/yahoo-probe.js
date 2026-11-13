// Probe: can a Vercel function read a PUBLIC Yahoo league matchup page without login?
// GET /api/yahoo-probe?lg=gl&week=10&mid1=1&mid2=8   (lg: gl|bh|rb|sts|fb). Read-only; only fetches the fixed Yahoo host.
const IDS = { gl: 101813, bh: 100398, rb: 101720, sts: 101814, fb: 697400 };
const strip = s => s.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
module.exports = async (req, res) => {
  const t0 = Date.now();
  try {
    const q = new URL(req.url, 'http://x').searchParams;
    const lg = String(q.get('lg') || 'gl'); if (!IDS[lg]) throw new Error('bad lg');
    const n = x => String(parseInt(q.get(x), 10) || 1);
    const url = 'https://football.fantasysports.yahoo.com/f1/' + IDS[lg] + '/matchup?week=' + n('week') + '&mid1=' + n('mid1') + '&mid2=' + n('mid2');
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' }, redirect: 'follow' });
    const html = await r.text();
    const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map(m => m[0]);
    const rowsOf = t => [...t.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(m => [...m[0].matchAll(/<t[dh][\s\S]*?<\/t[dh]>/gi)].map(c => strip(c[0]).replace(/\n+/g, ' / ')));
    const parsed = tables.map(rowsOf).filter(rs => rs.length > 5).sort((a, b) => b.length - a.length)[0] || [];
    const title = (/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1];
    res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({
      ok: r.ok, status: r.status, finalUrl: r.url, ms: Date.now() - t0, bytes: html.length, title,
      looksLikeLogin: /login\.yahoo\.com|Sign in to Yahoo/i.test(r.url + html.slice(0, 5000)),
      tableCount: tables.length, rowCount: parsed.length, rows: parsed.slice(0, 40),
      textSample: parsed.length ? undefined : strip(html).slice(0, 1500)
    }));
  } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: String(e.message || e), ms: Date.now() - t0 })); }
};
