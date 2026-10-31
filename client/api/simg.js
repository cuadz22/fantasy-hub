// Share-card image for a short link: /i/<id>.jpg
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json(); if (j.error) throw new Error(j.error); return j.result;
}
module.exports = async (req, res) => {
  try {
    const id = String(new URL(req.url, 'http://x').searchParams.get('id') || '').replace(/\.jpe?g$/i, '');
    if (!/^[A-Za-z0-9]{4,12}$/.test(id) || !URL_ || !TOKEN) { res.statusCode = 404; return res.end(); }
    const raw = await redis(['GET', 'share:' + id]);
    if (!raw) { res.statusCode = 404; return res.end(); }
    const rec = JSON.parse(raw);
    const buf = Buffer.from(rec.img.split(',')[1], 'base64');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    return res.end(buf);
  } catch (e) { res.statusCode = 500; return res.end(); }
};
