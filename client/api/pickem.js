// Pick'em API for the Gentlemen's League. Votes live in Upstash Redis (free tier).
// Env vars: PICKEM_SECRET (any long random string), and the Redis REST URL/token that
// the Vercel Upstash integration adds (KV_REST_API_URL / KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_*).
const crypto = require('crypto');
const HASHES = require('./pickem-hashes.json');

const MANAGERS = { 1:'Cuadz', 2:'Gio', 3:'Jeff', 4:'Vic', 5:'Ramon', 6:'Ed', 7:'Pru', 8:'Oscar', 9:'Julio Z', 10:'Kevin', 11:'Alexis', 12:'John' };
// week -> { lock: ISO time picks close, pairs: [[teamIdA, teamIdB], ...] }
const WEEKS = {
  5: { lock: '2026-10-11T17:00:00Z', pairs: [[1,7],[2,11],[3,8],[4,12],[5,10],[6,9]] },
  6: { lock: '2026-10-18T17:00:00Z', pairs: [[1,11],[2,9],[3,6],[4,5],[7,12],[8,10]] },
  7: { lock: '2026-10-25T17:00:00Z', pairs: [[1,9],[2,3],[4,7],[5,8],[6,10],[11,12]] },
  8: { lock: '2026-11-01T18:00:00Z', pairs: [[1,3],[2,10],[4,11],[5,7],[6,8],[9,12]] },
  9: { lock: '2026-11-08T18:00:00Z', pairs: [[1,10],[2,8],[3,12],[4,9],[5,6],[7,11]] }
};

// Mid-season Fantasy MVP vote (temporary). Closes Nov 4 9:00pm ET; change MVP_LOCK to move it.
const MVP_LOCK = '2026-11-05T02:00:00Z';
const MVP_KEY = 'mvp:gl:mid26';
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

function json(res, code, body) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); }

function pinOk(name, pin) {
  const secret = process.env.PICKEM_SECRET;
  if (!secret || !HASHES[name] || !/^\d{4}$/.test(String(pin))) return false;
  const h = crypto.createHmac('sha256', secret).update(name + ':' + pin).digest('hex');
  const a = Buffer.from(h), b = Buffer.from(HASHES[name]);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let s = ''; for await (const c of req) s += c;
  try { return JSON.parse(s || '{}'); } catch (e) { return {}; }
}

function weekInfo(w) {
  const cfg = WEEKS[w]; if (!cfg) return null;
  return { week: w, lockAt: cfg.lock, locked: Date.now() >= Date.parse(cfg.lock), pairs: cfg.pairs };
}

module.exports = async (req, res) => {
  try {
    if (!URL_ || !TOKEN || !process.env.PICKEM_SECRET) return json(res, 503, { error: 'not_configured' });
    const q = new URL(req.url, 'http://x').searchParams;
    const body = req.method === 'POST' ? await readBody(req) : {};

    if (q.get('mvp') || body.mvp) {
      const locked = Date.now() >= Date.parse(MVP_LOCK);
      if (req.method === 'GET') {
        const all = (await redis(['HKEYS', MVP_KEY])) || [];
        return json(res, 200, { lockAt: MVP_LOCK, locked, voted: all.sort() });
      }
      if (req.method !== 'POST') return json(res, 405, { error: 'method' });
      const nm = String(body.name || '');
      if (!HASHES[nm]) return json(res, 400, { error: 'bad_name' });
      const rl2 = 'pickem:rl:' + nm;
      const tr = parseInt((await redis(['GET', rl2])) || '0', 10);
      if (tr >= 8) return json(res, 429, { error: 'too_many_tries' });
      if (!pinOk(nm, body.pin)) { await redis(['INCR', rl2]); await redis(['EXPIRE', rl2, 600]); return json(res, 401, { error: 'bad_pin' }); }
      if (body.action === 'all') {
        if (nm !== 'Cuadz') return json(res, 403, { error: 'forbidden' });
        const raw = (await redis(['HGETALL', MVP_KEY])) || [];
        const out = {}; for (let i = 0; i < raw.length; i += 2) out[raw[i]] = JSON.parse(raw[i + 1]);
        return json(res, 200, { ok: true, votes: out });
      }
      if (body.action === 'mine') {
        const m = await redis(['HGET', MVP_KEY, nm]);
        return json(res, 200, { ok: true, vote: m ? JSON.parse(m) : null, locked, lockAt: MVP_LOCK });
      }
      if (locked) return json(res, 403, { error: 'locked' });
      const player = String(body.player || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      const why = String(body.why || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      if (!player) return json(res, 400, { error: 'no_player' });
      const v = { player, why, t: new Date().toISOString() };
      await redis(['HSET', MVP_KEY, nm, JSON.stringify(v)]);
      return json(res, 200, { ok: true, vote: v });
    }

    const w = parseInt(req.method === 'POST' ? body.week : q.get('week'), 10);
    const info = weekInfo(w);
    if (!info) return json(res, 404, { error: 'unknown_week' });
    const key = 'pickem:gl:' + w;

    if (req.method === 'GET') {
      const all = (await redis(['HGETALL', key])) || [];
      const picks = {}; for (let i = 0; i < all.length; i += 2) picks[all[i]] = JSON.parse(all[i + 1]);
      const out = { week: w, lockAt: info.lockAt, locked: info.locked, voted: Object.keys(picks).sort() };
      if (info.locked) out.picks = picks; // picks stay hidden until the lock
      return json(res, 200, out);
    }

    if (req.method !== 'POST') return json(res, 405, { error: 'method' });
    const name = String(body.name || '');
    if (!HASHES[name]) return json(res, 400, { error: 'bad_name' });

    // throttle PIN guessing: 8 wrong tries per 10 minutes per name
    const rl = 'pickem:rl:' + name;
    const tries = parseInt((await redis(['GET', rl])) || '0', 10);
    if (tries >= 8) return json(res, 429, { error: 'too_many_tries' });
    if (!pinOk(name, body.pin)) {
      await redis(['INCR', rl]); await redis(['EXPIRE', rl, 600]);
      return json(res, 401, { error: 'bad_pin' });
    }

    if (body.action === 'mine') {
      const mine = await redis(['HGET', key, name]);
      return json(res, 200, { ok: true, picks: mine ? JSON.parse(mine) : {}, locked: info.locked, lockAt: info.lockAt });
    }

    if (info.locked) return json(res, 403, { error: 'locked' });
    const picks = body.picks || {};
    const clean = {};
    info.pairs.forEach((p, i) => {
      const v = parseInt(picks[i], 10);
      if (v === p[0] || v === p[1]) clean[i] = v;
    });
    if (!Object.keys(clean).length) return json(res, 400, { error: 'no_picks' });
    await redis(['HSET', key, name, JSON.stringify(clean)]);
    return json(res, 200, { ok: true, picks: clean });
  } catch (e) {
    return json(res, 500, { error: 'server' });
  }
};
