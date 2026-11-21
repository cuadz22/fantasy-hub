// Yahoo public-page reader. Leagues are publicly viewable, so no login is needed.
// Raw server HTML layout (verified Nov 13): lineup rows are <tr> with 11 cells:
// 1 left player, 2 left proj, 3 left pts, 4 slot, 7 right pts, 8 right proj, 9 right player.
const IDS = { gl: 101813, bh: 100398, rb: 101720, sts: 101814, fb: 697400 };
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const dec = s => s.replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = h => dec(h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const num = s => { s = String(s || '').trim(); if (/^[\u2013\u2014-]+$/.test(s)) return null; const m = /^-?\d+(?:\.\d+)?/.exec(s); return m ? parseFloat(m[0]) : null; };
const SLOTS = /^(QB|RB|WR|TE|K|DEF|BN|IR|W\/R\/T|Q\/W\/R\/T|W\/R|W\/T|R\/T|FLX|SFX|DL|LB|DB|D)$/;

async function fetchPage(lg, week, mid1, signal) {
  if (!IDS[lg]) throw new Error('bad league');
  const url = 'https://football.fantasysports.yahoo.com/f1/' + IDS[lg] + '/matchup?week=' + (parseInt(week, 10) || 1) + '&mid1=' + (parseInt(mid1, 10) || 1);
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' }, redirect: 'follow', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(6500)]) : AbortSignal.timeout(6500) });
  if (!r.ok) throw new Error('yahoo ' + r.status);
  const html = await r.text();
  if (/login\.yahoo\.com/i.test(r.url)) throw new Error('login wall');
  return html;
}

function player(cell) {
  const nm = /class="(?:[^"]*\s)?name(?:\s[^"]*)?"[^>]*>([^<]+)</.exec(cell);
  if (!nm) return null;
  const name = dec(nm[1]).trim();
  const t = text(cell);
  const tp = /\b([A-Z][A-Za-z]{1,2}) - (QB|RB|WR|TE|K|DEF|DST)\b/.exec(t);
  const after = tp ? t.slice(t.indexOf(tp[0]) + tp[0].length).trim() : '';
  const inj = /\b(IR|NA|PUP|SUSP|Q|D|O)\b(?=\s+(?:Video|Player|New))/.exec(t.slice(name.length));
  return { name, team: tp ? tp[1] : null, pos: tp ? tp[2] : null, inj: inj ? inj[1] : null, status: after.replace(/This game is inside.*/i, '').trim().slice(0, 30) };
}

function parsePage(html) {
  // Weather popups are small tables nested inside player cells; their </tr> would cut a lineup row short. Drop them.
  html = html.replace(/<table\b(?:(?!<table\b)[\s\S])*?<\/table>/gi, m => (/Forecast:|Powered by/.test(m) ? '' : m));
  const teams = []; const seen = new Set();
  for (const m of html.matchAll(/<a\b[^>]*href="[^"]*\/f1\/\d+\/(\d+)(?:\?[^"]*)?"[^>]*>([\s\S]*?)<\/a>/g)) {
    const nm = text(m[2]); if (nm && !seen.has(m[1])) { seen.add(m[1]); teams.push({ id: +m[1], name: nm }); }
  }
  const L = [], R = []; let skipped = 0; const dbg = [];
  for (const seg of html.split(/<tr\b/).slice(1)) {
    const row = seg.split('</tr>')[0];
    if (!/ysf-player-name/.test(row)) continue;
    const cells = row.split(/<td\b/).slice(1).map(c => '<td' + c);
    if (cells.length < 10) { skipped++; dbg.push('c' + cells.length + ':' + cells.map(c => text(c).slice(0, 7)).join('~')); continue; }
    const slot = text(cells[4]);
    if (!SLOTS.test(slot)) { skipped++; dbg.push('s:' + slot.slice(0, 14) + '/' + cells.length); continue; }
    const l = player(cells[1]), r = player(cells[9]);
    if (l) L.push({ slot, ...l, proj: num(text(cells[2])), pts: num(text(cells[3])) });
    if (r) R.push({ slot, ...r, proj: num(text(cells[8])), pts: num(text(cells[7])) });
  }
  return { teams: teams.slice(0, 2), L, R, skipped, dbg };
}

// Team page reader (verified Nov 15): Yahoo now builds the current week's matchup pages in the browser, so the raw
// matchup HTML has no lineups. The team page (/f1/<league>/<teamId>?week=N) still ships the full roster in the HTML:
// rows are <tr> cells [0]=slot [2]=player [4]=Fan Pts [5]=Proj Pts, in the Offense, Kickers and Defense tables.
async function fetchTeam(lg, week, tid, signal) {
  if (!IDS[lg]) throw new Error('bad league');
  const url = 'https://football.fantasysports.yahoo.com/f1/' + IDS[lg] + '/' + (parseInt(tid, 10) || 1) + '?week=' + (parseInt(week, 10) || 1);
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' }, redirect: 'follow', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(6500)]) : AbortSignal.timeout(6500) });
  if (!r.ok) throw new Error('yahoo ' + r.status);
  const html = await r.text();
  if (/login\.yahoo\.com/i.test(r.url)) throw new Error('login wall');
  return html;
}
function teamRows(html) {
  // Depth-aware row/cell reader: player cells contain nested tables (weather, notes) with their own <tr>/<td>.
  const out = [], rowsAt = [], cellStart = [];
  let depth = 0;
  for (const m of html.matchAll(/<(\/?)(table|tr|td|th)\b[^>]*>/gi)) {
    const close = m[1] === '/', tag = m[2].toLowerCase(), end = m.index + m[0].length;
    if (tag === 'table') { if (close) { depth = Math.max(0, depth - 1); rowsAt.length = depth + 1; } else { depth++; } continue; }
    if (tag === 'tr') { if (!close) rowsAt[depth] = []; else { const r = rowsAt[depth]; if (r && r.length) out.push(r); rowsAt[depth] = null; } continue; }
    const row = rowsAt[depth]; if (!row) continue;
    if (!close) { cellStart[depth] = end; }
    else if (cellStart[depth] != null) { row.push(html.slice(cellStart[depth], m.index)); cellStart[depth] = null; }
  }
  return out;
}
function parseTeam(html, tid) {
  const _i = html.indexOf('ysf-player-name'); const info = { len: html.length, pn: (html.match(/ysf-player-name/g) || []).length, st: html.includes('statTable0'), tr: (html.match(/<tr\b/g) || []).length, row0: (() => { const k = html.indexOf('statTable0'); const t = html.indexOf('<tbody', k); return t < 0 ? '' : html.slice(t, t + 1800).replace(/\s+/g, ' ').replace(/[^a-zA-Z0-9<>\/ =_-]/g, '.'); })(), ctx: _i < 0 ? '' : html.slice(Math.max(0, _i - 260), _i + 60).replace(/[^a-zA-Z0-9<>\/ =_-]/g, '.') };
  const nm = /([^<>]{1,60}?)(?:'|&#0?39;|&#x27;|’|&rsquo;)s\s+(?:Offense|Kickers|Defense)/i.exec(html);
  let opp = null, oppName = '';
  const i = html.indexOf('team-card-matchup');
  if (i >= 0) {
    for (const m of html.slice(i, i + 6000).matchAll(/href="[^"]*\/f1\/\d+\/(\d+)(?:\?[^"]*)?"[^>]*>([\s\S]*?)<\/a>/g)) {
      if (+m[1] !== +tid) { opp = +m[1]; const t = text(m[2]); if (t && !oppName) oppName = t; }
    }
  }
  // Yahoo's own totals for this matchup: "<pts> <proj> vs <pts> <proj>" in the matchup card.
  let tot = null, otot = null;
  if (i >= 0) {
    const tt = text(html.slice(i, i + 4000)), mt = /View Matchup\s+(-?[\d.]+)\s+(-?[\d.]+)\s+vs\s+(-?[\d.]+)\s+(-?[\d.]+)/i.exec(tt);
    if (mt) { tot = [Number(mt[1]), Number(mt[2])]; otot = [Number(mt[3]), Number(mt[4])]; }
  }
  const rows = [], dbgc = [];
  for (const cells of teamRows(html)) {
    const pi = cells.findIndex(c => /ysf-player-name/.test(c)); if (cells.length < 6 || pi < 1 || pi > 2) { if (pi >= 0 && cells.length >= 6) dbgc.push('x' + cells.length + 'p' + pi); continue; }
    const slot = text(cells[0]);
    if (!SLOTS.test(slot)) { dbgc.push('s' + slot.slice(0, 6)); continue; }
    const wx = c => c.replace(/<table\b(?:(?!<table\b)[\s\S])*?<\/table>/gi, m => (/Forecast:|Powered by/.test(m) ? '' : m));
    const pl = player(wx(cells[pi]));
    if (!pl) { dbgc.push('p'); continue; }
    if (!dbgc.length || dbgc.length < 30) dbgc.push('c' + pi + ':' + cells.slice(pi + 1, pi + 6).map(c => text(c).slice(0, 12)).join('|'));
    rows.push({ slot, ...pl, proj: num(text(cells[pi === 1 ? 6 : 5])), pts: num(text(cells[pi === 1 ? 5 : 4])) });
  }
  return { id: +tid, name: nm ? text(nm[1]) : '', opp, oppName, rows, dbgc, info, tot, otot };
}

module.exports = { IDS, fetchPage, parsePage, text, fetchTeam, parseTeam };
