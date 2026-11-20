// Invited-member email-code sign-in for the iPhone app. Only SHA-256 hashes of invited emails live in _members.json.
'use strict';
const crypto = require('crypto');
const { sha, rc, rget, rset } = require('./_m');
let MEMBERS = []; try { MEMBERS = require('./_members.json'); } catch (e) {}
const LGS = ['gl', 'bh', 'rb', 'sts'];
const SESSION_DAYS = 30, CODE_TTL_S = 600, MAX_ATTEMPTS = 5;
const PEPPER = process.env.MOBILE_AUTH_PEPPER || process.env.RESEND_API_KEY || 'cfn-mobile-v1';
const normEmail = e => String(e || '').trim().toLowerCase();
const validEmail = e => e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const memberFor = email => MEMBERS.find(m => m.h === sha(email)) || null;
const memberships = m => LGS.filter(l => m.teams[l] != null).map(l => ({ leagueId: l, teamId: m.teams[l] }));
const memberOut = m => ({ displayName: m.name, memberships: memberships(m) });
const codeHash = (email, code) => crypto.createHmac('sha256', PEPPER).update(email + ':' + code).digest('hex');
const eq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const ip = req => String((req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')).split(',')[0].trim() || 'unknown';
// Fixed-window counter; returns the new count (null when storage is down, which fails closed for callers that check).
async function hit(key, windowS) { const n = await rc(['INCR', key]); if (n === 1) await rc(['EXPIRE', key, windowS]); return n; }

async function sendMail(to, code) {
  const key = process.env.RESEND_API_KEY; if (!key) return { ok: false, why: 'mail not configured' };
  const from = process.env.MOBILE_MAIL_FROM || 'Cuadz Fantasy Network <onboarding@resend.dev>';
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [to], subject: 'Your CFN sign-in code: ' + code, text: 'Your Cuadz Fantasy Network sign-in code is ' + code + '.\n\nIt expires in 10 minutes and works once. If you did not ask for it, ignore this email.' }) });
    return r.ok ? { ok: true } : { ok: false, why: 'mail http ' + r.status };
  } catch (e) { return { ok: false, why: 'mail error' }; }
}
async function requestCode(req, body, mailer) {
  const email = normEmail(body && body.email);
  if (!validEmail(email)) return { status: 400, json: { error: 'invalid_email' } };
  const a = await hit('ma:rq:e:' + sha(email), 600), b = await hit('ma:rq:i:' + sha(ip(req)), 3600);
  if (a == null || b == null) return { status: 503, json: { error: 'unavailable' } };
  if (a > 3 || b > 20) return { status: 429, json: { error: 'rate_limited' }, retryAfter: 600 };
  const m = memberFor(email);
  if (m) { // generic response either way; the code goes only to invited members
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    await rset('ma:code:' + sha(email), { h: codeHash(email, code), tries: 0 }, CODE_TTL_S);
    const r = await (mailer || sendMail)(email, code);
    if (!r.ok) console.error('mobile auth: code not delivered (' + r.why + ')');
  }
  return { status: 200, json: { ok: true } };
}
async function newSession(email) {
  const token = 'cfn_' + crypto.randomBytes(32).toString('base64url'), th = sha(token), now = Date.now(), exp = now + SESSION_DAYS * 86400000;
  await rset('ms:' + th, { e: sha(email), c: now, x: exp }, SESSION_DAYS * 86400);
  await rc(['SADD', 'msu:' + sha(email), th]);
  return token;
}
async function verifyCode(req, body) {
  const email = normEmail(body && body.email), code = String((body && body.code) || '').trim();
  if (!validEmail(email) || !/^\d{6}$/.test(code)) return { status: 400, json: { error: 'invalid_code' } };
  const c = await hit('ma:vf:i:' + sha(ip(req)), 3600); if (c == null) return { status: 503, json: { error: 'unavailable' } };
  if (c > 30) return { status: 429, json: { error: 'rate_limited' }, retryAfter: 3600 };
  const key = 'ma:code:' + sha(email), rec = await rget(key), m = memberFor(email);
  if (!rec || !m) return { status: 400, json: { error: 'invalid_code' } };
  if (rec.tries >= MAX_ATTEMPTS) { await rc(['DEL', key]); return { status: 400, json: { error: 'invalid_code' } }; }
  if (!eq(rec.h, codeHash(email, code))) { rec.tries++; const ttl = await rc(['TTL', key]); if (rec.tries >= MAX_ATTEMPTS) await rc(['DEL', key]); else await rset(key, rec, ttl > 0 ? ttl : CODE_TTL_S); return { status: 400, json: { error: 'invalid_code' } }; }
  await rc(['DEL', key]); // single use
  return { status: 200, json: { accessToken: await newSession(email), member: memberOut(m) } };
}
// Resolve a Bearer token to its member. Memberships come from the server list each time, so cached client copies never authorize anything.
async function authenticate(req) {
  const h = String(req.headers.authorization || ''), mt = /^Bearer\s+(cfn_[A-Za-z0-9_-]{20,80})$/.exec(h); if (!mt) return null;
  const th = sha(mt[1]), s = await rget('ms:' + th); if (!s || s.x < Date.now()) return null;
  const m = MEMBERS.find(x => x.h === s.e); if (!m) return null; // removed from the allowlist => session dead
  return { member: m, th };
}
async function logout(req) { const a = await authenticate(req); if (!a) return { status: 401, json: { error: 'unauthorized' } }; await rc(['DEL', 'ms:' + a.th]); await rc(['SREM', 'msu:' + a.member.h, a.th]); return { status: 200, json: { ok: true } }; }
async function revokeAll(emailHash) { const set = (await rc(['SMEMBERS', 'msu:' + emailHash])) || []; for (const th of set) await rc(['DEL', 'ms:' + th]); await rc(['DEL', 'msu:' + emailHash]); return set.length; }
function canAccess(member, lg, teamId) { return member.teams[lg] != null && Number(member.teams[lg]) === Number(teamId); }
module.exports = { requestCode, verifyCode, authenticate, logout, revokeAll, memberOut, canAccess, normEmail, memberFor, MEMBERS };
