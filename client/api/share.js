// Share-link API. The site uploads the share card (JPEG) here and gets back a short link
// (/s/<id>) whose page carries Open Graph tags so chat apps preview the card.
// Storage: the same Upstash Redis the Pick'em feature uses (KV_REST_API_URL / KV_REST_API_TOKEN).
const crypto = require('crypto');
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const TTL = 60 * 60 * 24 * 120; // links live 120 days
const MAX_IMG = 900000;          // characters of base64 data URL

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
function json(res, code, body) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); }
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let s = ''; for await (const c of req) { s += c; if (s.length > 1500000) break; }
  try { return JSON.parse(s || '{}'); } catch (e) { return {}; }
}
function originOk(req) {
  const o = req.headers.origin || '';
  if (!o) return false;
  try { const h = new URL(o).hostname; return h === 'cuadzfantasynetwork.com' || h === 'www.cuadzfantasynetwork.com' || h.endsWith('.vercel.app') || h === 'localhost'; } catch (e) { return false; }
}
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').slice(0, n);

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'method' });
    if (!URL_ || !TOKEN) return json(res, 503, { error: 'not_configured' });
    if (!originOk(req)) return json(res, 403, { error: 'origin' });
    const b = await readBody(req);
    const img = String(b.img || '');
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(img) || img.length > MAX_IMG) return json(res, 400, { error: 'bad_image' });
    const go = String(b.go || '');
    if (!/^[A-Za-z0-9%._~-]{1,200}$/.test(go)) return json(res, 400, { error: 'bad_target' });

    const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
    const rl = 'share:rl:' + ip;
    const n = parseInt(await redis(['INCR', rl]), 10);
    if (n === 1) await redis(['EXPIRE', rl, 3600]);
    if (n > 40) return json(res, 429, { error: 'slow_down' });

    const id = crypto.randomBytes(6).toString('base64url').replace(/[-_]/g, 'x').slice(0, 8);
    const rec = { img, go, title: clean(b.title, 120), desc: clean(b.desc, 200), w: Math.min(4000, parseInt(b.w, 10) || 1080), h: Math.min(8000, parseInt(b.h, 10) || 1350), t: Date.now() };
    await redis(['SET', 'share:' + id, JSON.stringify(rec), 'EX', TTL]);
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return json(res, 200, { id, url: 'https://' + host + '/s/' + id });
  } catch (e) {
    return json(res, 500, { error: 'server' });
  }
};
