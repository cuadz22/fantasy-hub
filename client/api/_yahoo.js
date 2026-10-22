// Shared helpers for the Yahoo Fantasy connection (owner-only, one saved login).
// Env vars (Vercel): YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET, YAHOO_ADMIN_KEY (any long random string),
// plus the Upstash Redis vars the Vercel integration already adds (KV_REST_API_URL / KV_REST_API_TOKEN).
const crypto = require('crypto');

const SITE = process.env.SITE_ORIGIN || 'https://cuadzfantasynetwork.com';
const REDIRECT = SITE + '/api/yahoo/callback';
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'yahoo:owner';

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
function json(res, code, body) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); }
function html(res, code, body) { res.statusCode = code; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(body); }
function sign(s) { return crypto.createHmac('sha256', process.env.YAHOO_ADMIN_KEY || '').update(s).digest('hex'); }
function adminOk(k) {
  const a = Buffer.from(String(k || '')), b = Buffer.from(process.env.YAHOO_ADMIN_KEY || '');
  return b.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}
function basic() { return 'Basic ' + Buffer.from(process.env.YAHOO_CLIENT_ID + ':' + process.env.YAHOO_CLIENT_SECRET).toString('base64'); }

async function tokenCall(params) {
  const r = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
    method: 'POST',
    headers: { Authorization: basic(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Yahoo token error: ' + JSON.stringify(j));
  return j;
}
async function saveTokens(j, prev) {
  const rec = { access_token: j.access_token, refresh_token: j.refresh_token || (prev && prev.refresh_token), expires_at: Date.now() + (j.expires_in - 60) * 1000, saved_at: Date.now() };
  await redis(['SET', KEY, JSON.stringify(rec)]);
  return rec;
}
async function getAccessToken() {
  const raw = await redis(['GET', KEY]);
  if (!raw) throw new Error('not_connected');
  let rec = JSON.parse(raw);
  if (Date.now() < rec.expires_at) return rec.access_token;
  const j = await tokenCall({ grant_type: 'refresh_token', refresh_token: rec.refresh_token, redirect_uri: REDIRECT });
  rec = await saveTokens(j, rec);
  return rec.access_token;
}
// GET a Yahoo Fantasy path, e.g. "users;use_login=1/games;game_codes=nfl/leagues"
async function yahooGet(path) {
  const t = await getAccessToken();
  const r = await fetch('https://fantasysports.yahooapis.com/fantasy/v2/' + path + (path.includes('?') ? '&' : '?') + 'format=json', { headers: { Authorization: 'Bearer ' + t } });
  const text = await r.text();
  if (!r.ok) throw new Error('Yahoo API ' + r.status + ': ' + text.slice(0, 300));
  return JSON.parse(text);
}
module.exports = { SITE, REDIRECT, redis, json, html, sign, adminOk, tokenCall, saveTokens, getAccessToken, yahooGet, KEY };
