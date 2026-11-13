// Yahoo public-page reader. Leagues are publicly viewable, so no login is needed.
// Raw server HTML layout (verified Nov 13): lineup rows are <tr> with 11 cells:
// 1 left player, 2 left proj, 3 left pts, 4 slot, 7 right pts, 8 right proj, 9 right player.
const IDS = { gl: 101813, bh: 100398, rb: 101720, sts: 101814, fb: 697400 };
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const dec = s => s.replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = h => dec(h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const num = s => { s = String(s || '').trim(); if (/^[\u2013\u2014-]+$/.test(s)) return null; const m = /^-?\d+(?:\.\d+)?/.exec(s); return m ? parseFloat(m[0]) : null; };
const SLOTS = /^(QB|RB|WR|TE|K|DEF|BN|IR|W\/R\/T|Q\/W\/R\/T|W\/R|W\/T|R\/T|FLX|SFX|DL|LB|DB|D)$/;

async function fetchPage(lg, week, mid1) {
  if (!IDS[lg]) throw new Error('bad league');
  const url = 'https://football.fantasysports.yahoo.com/f1/' + IDS[lg] + '/matchup?week=' + (parseInt(week, 10) || 1) + '&mid1=' + (parseInt(mid1, 10) || 1);
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' }, redirect: 'follow' });
  if (!r.ok) throw new Error('yahoo ' + r.status);
  const html = await r.text();
  if (/login\.yahoo\.com/i.test(r.url)) throw new Error('login wall');
  return html;
}

function player(cell) {
  const nm = /class="[^"]*\bname\b[^"]*"[^>]*>([^<]+)</.exec(cell);
  if (!nm) return null;
  const name = dec(nm[1]).trim();
  const t = text(cell);
  const tp = /\b([A-Z][A-Za-z]{1,2}) - (QB|RB|WR|TE|K|DEF|DST)\b/.exec(t);
  const after = tp ? t.slice(t.indexOf(tp[0]) + tp[0].length).trim() : '';
  const inj = /\b(IR|NA|PUP|SUSP|Q|D|O)\b(?=\s+(?:Video|Player|New))/.exec(t.slice(name.length));
  return { name, team: tp ? tp[1] : null, pos: tp ? tp[2] : null, inj: inj ? inj[1] : null, status: after.replace(/This game is inside.*/i, '').trim().slice(0, 30) };
}

function parsePage(html) {
  const teams = []; const seen = new Set();
  for (const m of html.matchAll(/<a\b[^>]*href="[^"]*\/f1\/\d+\/(\d+)(?:\?[^"]*)?"[^>]*>([\s\S]*?)<\/a>/g)) {
    const nm = text(m[2]); if (nm && !seen.has(m[1])) { seen.add(m[1]); teams.push({ id: +m[1], name: nm }); }
  }
  const L = [], R = []; let skipped = 0; const dbg = [];
  for (const seg of html.split(/<tr\b/).slice(1)) {
    const row = seg.split('</tr>')[0];
    if (!/ysf-player-name/.test(row)) continue;
    const cells = row.match(/<td\b[\s\S]*?<\/td>/g) || [];
    if (cells.length < 10) { skipped++; dbg.push('c' + cells.length); continue; }
    const slot = text(cells[4]);
    if (!SLOTS.test(slot)) { skipped++; dbg.push('s:' + slot.slice(0, 14) + '/' + cells.length); continue; }
    const l = player(cells[1]), r = player(cells[9]);
    if (l) L.push({ slot, ...l, proj: num(text(cells[2])), pts: num(text(cells[3])) });
    if (r) R.push({ slot, ...r, proj: num(text(cells[8])), pts: num(text(cells[7])) });
  }
  return { teams: teams.slice(0, 2), L, R, skipped, dbg };
}

module.exports = { IDS, fetchPage, parsePage, text };
