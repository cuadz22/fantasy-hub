// Offseason Trade Desk API (Beaners & Rebirth). Yahoo can't process trades in the offseason,
// so managers propose here, the other manager accepts, then the commish (Cuadz) approves.
// Storage: Upstash Redis (same as Pick'em/share). PINs: HMAC with PICKEM_SECRET.
// Cuadz signs in with his Pick'em PIN. Other managers get PINs issued by Cuadz (action "issue").
const crypto = require('crypto');
const PH = require('./pickem-hashes.json');
const BASE = require('./trades-base.json');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const LOCKED = { bh: [15, 16] };      // Beaners rounds 15-16 are keeper slots: never tradeable
const ROUNDS = { bh: 16, rb: 17 };
const COMMISH = 'Cuadz';

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
function json(res, code, body) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); }
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let s = ''; for await (const c of req) { s += c; if (s.length > 60000) break; }
  try { return JSON.parse(s || '{}'); } catch (e) { return {}; }
}
const hmac = (s) => crypto.createHmac('sha256', process.env.PICKEM_SECRET).update(s).digest('hex');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);

function teamByName(lg, name) { return BASE[lg].teams.find((t) => t.mgr === name); }
function teamById(lg, id) { return BASE[lg].teams.find((t) => t.id === id); }

async function pinOk(lg, name, pin) {
  if (!/^\d{4}$/.test(String(pin))) return false;
  if (name === COMMISH) {
    if (!PH[name]) return false;
    return same(hmac(name + ':' + pin), PH[name]);
  }
  const h = await redis(['HGET', 'trades:pins:' + lg, name]);
  return !!h && same(hmac('trades:' + lg + ':' + name + ':' + pin), h);
}

async function loadTrades(lg) {
  const all = (await redis(['HGETALL', 'trades:' + lg])) || [];
  const out = [];
  for (let i = 0; i < all.length; i += 2) { try { out.push(JSON.parse(all[i + 1])); } catch (e) {} }
  return out.sort((a, b) => b.created - a.created);
}

// Pick ownership = Yahoo snapshot + approved offseason trades (applied only while the pick is still with the giver, so a later Yahoo refresh can't double-apply).
function owners(lg, trades) {
  const rows = BASE[lg].dpk.map((r) => r.slice());
  trades.filter((t) => t.status === 'approved').sort((a, b) => (a.approved || 0) - (b.approved || 0)).forEach((t) => {
    (t.send.pk || []).forEach((p) => { if (rows[p[0] - 1] && rows[p[0] - 1][p[1] - 1] === t.from) rows[p[0] - 1][p[1] - 1] = t.to; });
    (t.get.pk || []).forEach((p) => { if (rows[p[0] - 1] && rows[p[0] - 1][p[1] - 1] === t.to) rows[p[0] - 1][p[1] - 1] = t.from; });
  });
  return rows;
}

function cleanSide(lg, raw) {
  const pl = (Array.isArray(raw && raw.pl) ? raw.pl : []).slice(0, 12).map((x) => clean(x, 40)).filter(Boolean);
  const pk = (Array.isArray(raw && raw.pk) ? raw.pk : []).slice(0, 12).map((p) => [parseInt(p && p[0], 10), parseInt(p && p[1], 10)]);
  for (const p of pk) {
    if (!(p[0] >= 1 && p[0] <= ROUNDS[lg] && p[1] >= 1 && p[1] <= 12)) return null;
    if ((LOCKED[lg] || []).includes(p[0])) return { locked: p[0] };
  }
  return { pl, pk };
}
function ownsAll(rows, id, pk) { return pk.every((p) => rows[p[0] - 1] && rows[p[0] - 1][p[1] - 1] === id); }

module.exports = async (req, res) => {
  try {
    if (!URL_ || !TOKEN || !process.env.PICKEM_SECRET) return json(res, 503, { error: 'not_configured' });
    const q = new URL(req.url, 'http://x').searchParams;
    const body = req.method === 'POST' ? await readBody(req) : {};
    const lg = String(req.method === 'POST' ? body.lg : q.get('lg'));
    if (!BASE[lg]) return json(res, 404, { error: 'unknown_league' });

    if (req.method === 'GET') {
      const trades = await loadTrades(lg);
      return json(res, 200, { lg, trades, rows: owners(lg, trades), locked: LOCKED[lg] || [] });
    }
    if (req.method !== 'POST') return json(res, 405, { error: 'method' });

    const name = String(body.name || '');
    const me = teamByName(lg, name);
    if (!me) return json(res, 400, { error: 'bad_name' });
    const rl = 'trades:rl:' + name;
    const tries = parseInt((await redis(['GET', rl])) || '0', 10);
    if (tries >= 8) return json(res, 429, { error: 'too_many_tries' });
    if (!(await pinOk(lg, name, body.pin))) { await redis(['INCR', rl]); await redis(['EXPIRE', rl, 600]); return json(res, 401, { error: 'bad_pin' }); }
    const isCommish = name === COMMISH;
    const act = String(body.action || '');

    if (act === 'whoami') return json(res, 200, { ok: true, name, id: me.id, commish: isCommish });

    if (act === 'issue') {
      if (!isCommish) return json(res, 403, { error: 'commish_only' });
      const only = body.only ? String(body.only) : '';
      const pins = {};
      for (const t of BASE[lg].teams) {
        if (t.mgr === COMMISH || (only && t.mgr !== only)) continue;
        const pin = String(crypto.randomInt(0, 10000)).padStart(4, '0');
        await redis(['HSET', 'trades:pins:' + lg, t.mgr, hmac('trades:' + lg + ':' + t.mgr + ':' + pin)]);
        pins[t.mgr] = pin;
      }
      return json(res, 200, { ok: true, pins });
    }

    const trades = await loadTrades(lg);
    const rows = owners(lg, trades);
    const save = async (t) => { await redis(['HSET', 'trades:' + lg, t.id, JSON.stringify(t)]); return t; };
    const stamp = (t, by, a) => { t.updated = Date.now(); (t.log = t.log || []).push({ t: t.updated, by, a }); };

    if (act === 'propose') {
      const to = teamById(lg, parseInt(body.to, 10));
      if (!to || to.id === me.id) return json(res, 400, { error: 'bad_partner' });
      const send = cleanSide(lg, body.send), get = cleanSide(lg, body.get);
      if (!send || !get) return json(res, 400, { error: 'bad_pick' });
      if (send.locked || get.locked) return json(res, 400, { error: 'keeper_round_locked' });
      if (!(send.pl.length + send.pk.length) || !(get.pl.length + get.pk.length)) return json(res, 400, { error: 'empty_side' });
      if (!ownsAll(rows, me.id, send.pk) || !ownsAll(rows, to.id, get.pk)) return json(res, 409, { error: 'pick_not_owned' });
      if (trades.filter((t) => t.from === me.id && (t.status === 'pending' || t.status === 'accepted')).length >= 10) return json(res, 429, { error: 'too_many_open' });
      const t = { id: Date.now().toString(36) + crypto.randomBytes(2).toString('hex'), lg, from: me.id, to: to.id, send, get, note: clean(body.note, 200), status: 'pending', created: Date.now(), log: [] };
      stamp(t, name, 'proposed');
      return json(res, 200, { ok: true, trade: await save(t) });
    }

    const t = trades.find((x) => x.id === String(body.id || ''));
    if (!t) return json(res, 404, { error: 'no_trade' });

    if (act === 'respond') {
      if (t.to !== me.id) return json(res, 403, { error: 'not_recipient' });
      if (t.status !== 'pending') return json(res, 409, { error: 'not_pending' });
      if (body.accept && (!ownsAll(rows, t.from, t.send.pk) || !ownsAll(rows, t.to, t.get.pk))) return json(res, 409, { error: 'pick_not_owned' });
      t.status = body.accept ? 'accepted' : 'declined'; stamp(t, name, t.status);
      return json(res, 200, { ok: true, trade: await save(t) });
    }
    if (act === 'cancel') {
      if (t.from !== me.id && !isCommish) return json(res, 403, { error: 'not_yours' });
      if (t.status !== 'pending' && t.status !== 'accepted') return json(res, 409, { error: 'closed' });
      t.status = 'cancelled'; stamp(t, name, 'cancelled');
      return json(res, 200, { ok: true, trade: await save(t) });
    }
    if (act === 'approve' || act === 'reject') {
      if (!isCommish) return json(res, 403, { error: 'commish_only' });
      if (t.status !== 'accepted') return json(res, 409, { error: 'not_accepted' });
      if (act === 'approve') {
        if (!ownsAll(rows, t.from, t.send.pk) || !ownsAll(rows, t.to, t.get.pk)) return json(res, 409, { error: 'pick_not_owned' });
        t.status = 'approved'; t.approved = Date.now();
      } else t.status = 'rejected';
      stamp(t, name, t.status);
      return json(res, 200, { ok: true, trade: await save(t) });
    }
    return json(res, 400, { error: 'bad_action' });
  } catch (e) {
    return json(res, 500, { error: 'server', msg: String(e.message || e).slice(0, 120) });
  }
};
