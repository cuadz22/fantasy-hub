// Same-origin copy of the Hayden Winks feed so visitors' browsers never contact GitHub.
// GET /api/hw -> the feed JSON (read server-side, edge-cached 5 minutes).
const SRC = 'https://gist.githubusercontent.com/cuadz22/1d8a87d05a2a13104516e02326cf8dca/raw/hayden-winks.json';
module.exports = async (req, res) => {
  // /api/hw?market=1 serves the live market values (kept in this file's route: the Hobby plan allows 12 functions)
  if (req.query && req.query.market) return require('./_market')(req, res);
  try {
    const r = await fetch(SRC + '?t=' + Math.floor(Date.now() / 300000), { headers: { 'User-Agent': 'cfn-site' } });
    if (!r.ok) throw new Error('upstream ' + r.status);
    const t = await r.text(); JSON.parse(t);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');
    res.status(200).send(t);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'feed unavailable' });
  }
};
