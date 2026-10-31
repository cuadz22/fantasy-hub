// Short-link landing page: /s/<id>. Chat apps read the Open Graph tags (the card image);
// people are forwarded to the exact view on the site.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json(); if (j.error) throw new Error(j.error); return j.result;
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

module.exports = async (req, res) => {
  try {
    const id = String(new URL(req.url, 'http://x').searchParams.get('id') || '');
    if (!/^[A-Za-z0-9]{4,12}$/.test(id) || !URL_ || !TOKEN) { res.statusCode = 302; res.setHeader('Location', '/cfn.html'); return res.end(); }
    const raw = await redis(['GET', 'share:' + id]);
    if (!raw) { res.statusCode = 302; res.setHeader('Location', '/cfn.html'); return res.end(); }
    const rec = JSON.parse(raw);
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const base = 'https://' + host;
    const title = rec.title || 'Cuadz Fantasy Network';
    const desc = rec.desc || 'Cuadz Fantasy Network';
    const target = '/cfn.html#s=' + rec.go;
    const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + esc(title) + '</title>' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta property="og:type" content="website"><meta property="og:site_name" content="Cuadz Fantasy Network">' +
      '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '">' +
      '<meta property="og:url" content="' + base + '/s/' + id + '">' +
      '<meta property="og:image" content="' + base + '/i/' + id + '.jpg"><meta property="og:image:type" content="image/jpeg">' +
      '<meta property="og:image:width" content="' + rec.w + '"><meta property="og:image:height" content="' + rec.h + '">' +
      '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '">' +
      '<meta name="twitter:description" content="' + esc(desc) + '"><meta name="twitter:image" content="' + base + '/i/' + id + '.jpg">' +
      '<meta name="theme-color" content="#14161b">' +
      '<noscript><meta http-equiv="refresh" content="0;url=' + esc(target) + '"></noscript>' +
      '<style>body{margin:0;background:#14161b;color:#ebecef;font:500 16px system-ui,sans-serif;display:grid;place-items:center;min-height:100vh}a{color:#acf910}</style>' +
      '<script>location.replace(' + JSON.stringify(target) + ');</script></head>' +
      '<body><p>Opening the Cuadz Fantasy Network… <a href="' + esc(target) + '">Tap here if nothing happens</a></p></body></html>';
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.end(html);
  } catch (e) {
    res.statusCode = 302; res.setHeader('Location', '/cfn.html'); return res.end();
  }
};
