// Server-only transport. A truncated page sequence is a failure, never a fresh snapshot.
'use strict';
const BASE = 'https://api.balldontlie.io/nfl/v1/';
async function page(path, params, options = {}) {
  if (!process.env.BALLDONTLIE_API_KEY) throw new Error('bdl_key_missing');
  const u = new URL(path, BASE);
  for (const [k, v] of Object.entries(params || {})) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach(x => u.searchParams.append(k + '[]', x)); else u.searchParams.set(k, v);
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(6000)]) : AbortSignal.timeout(6000);
    let r;
    try {
      r = await fetch(u, { headers: { Authorization: process.env.BALLDONTLIE_API_KEY, Accept: 'application/json' }, signal });
      if (r.ok) { const body = await r.json(); if (!Array.isArray(body.data)) throw new Error('bdl_invalid_response'); return body; }
      if (r.status === 429) throw new Error('bdl_rate_limited'); // next job retries; never hammer the provider
      if (r.status < 500 || attempt) throw new Error('bdl_http_' + r.status);
    } catch (e) {
      if (attempt || options.signal?.aborted || /bdl_/.test(e.message)) throw e;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('bdl_unavailable');
}
async function all(path, params, options = {}) {
  const data = [], cursors = new Set(); let cursor;
  for (let n = 0; n < (options.maxPages || 20); n++) {
    const body = await page(path, { ...params, per_page: 100, cursor }, options);
    data.push(...body.data);
    const next = body.meta && body.meta.next_cursor;
    if (next == null) return data;
    if (cursors.has(String(next))) throw new Error('bdl_repeated_cursor');
    cursors.add(String(next)); cursor = next;
  }
  throw new Error('bdl_incomplete_pagination');
}
module.exports = { page, all };
