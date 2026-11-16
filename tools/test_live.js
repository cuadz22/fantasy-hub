// Regression tests for the live-lineup pipeline. Run before every push:  node tools/test_live.js
// 1) the Yahoo team-page reader (both page variants Yahoo serves), 2) the client math/rendering helpers in cfn.html.
const fs = require('fs'), path = require('path'), assert = require('assert');
const { parseTeam } = require('../client/api/_ysweep');
let pass = 0; const T = (name, fn) => { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { console.error('FAIL  ' + name + '\n      ' + (e && e.message)); process.exitCode = 1; } };

/* ---------- 1. reader fixtures ---------- */
const weather = "<table class='Tst-current Tst-weather-table'><tr><td>Forecast: clear</td><td>Powered by X</td></tr></table>";
const pcell = (name, tm, pos, status, inj) => `<td class="Ta-start player Bdrstart"><div class="Ov-h"><div class="D-f"><img alt="${name}"><div><div class="Ta-start Truncate"><div class="ysf-player-name Nowrap Relative Lh-xs"><a class="Nowrap name F-link playernote" href="https://sports.yahoo.com/nfl/players/1" target="_blank">${name}</a>${inj ? `<span class="F-injury">${inj}</span>` : ''}<span>Player Note</span></div></div><span>${tm} - ${pos}</span> <span>${status}</span>${weather}</div></div></div></td>`;
const nums = n => Array.from({ length: n }, () => '<td>-</td>').join('');
function teamPage(variant, rows, opp) {
  const body = rows.map(r => variant === 'browser'
    ? `<tr><td class="pos headcol"><span>${r.slot}</span></td><td class="edit Js-hid">${r.slot}BN</td>${pcell(r.name, r.tm, r.pos, r.status, r.inj)}<td>8</td><td>${r.pts}</td><td>${r.proj}</td>${nums(20)}</tr>`
    : `<tr class="First"><td class="Alt Ta-c pos headcol"><div><span class="pos-label" data-pos="${r.pos}">${r.slot}</span></div></td>${pcell(r.name, r.tm, r.pos, r.status, r.inj)}<td></td><td></td><td>9</td><td>${r.pts}</td><td>${r.proj}</td>${nums(18)}</tr>`).join('');
  return `<html><body><div id="team-card-matchup"><a href="/f1/101813/1">Mine</a><a href="/f1/101813/${opp}">Them</a><div>Week 10 vs X</div><a>View Matchup</a><span>58.65</span><span>125.13</span> vs <span>10.80</span><span>122.04</span></div><table id="statTable0"><thead><tr><th>x</th></tr></thead><tbody>${body}</tbody></table></body></html>`;
}
const R = (slot, name, pos, proj, pts, status, inj) => ({ slot, name, pos, tm: 'Pit', proj, pts, status: status || 'Sun 8:20 pm vs Cin', inj });
const base = [R('QB', 'Aaron Rodgers', 'QB', '23.12', '-'), R('RB', 'Jahmyr Gibbs', 'RB', '24.54 27.87', '7.30', 'Q3 5:00, 21-7 vs NE'), R('WR', 'Hurt Guy', 'WR', '10.1', '0', 'Sun 1:00 pm @ Dal', 'O'), R('BN', 'Bench Man', 'WR', '4.2', '-')];
for (const v of ['browser', 'server']) {
  T('reader (' + v + ' variant) finds every starter/bench row', () => {
    const t = parseTeam(teamPage(v, base, 7), 1);
    assert.strictEqual(t.rows.length, 4, 'rows ' + t.rows.length + ' ' + t.dbgc.join('/'));
    assert.strictEqual(t.opp, 7);
    assert.deepStrictEqual(t.tot, [58.65, 125.13]); assert.deepStrictEqual(t.otot, [10.8, 122.04]);
    const g = t.rows.find(r => r.name === 'Jahmyr Gibbs');
    assert.strictEqual(g.slot, 'RB'); assert.strictEqual(g.proj, 24.54); assert.strictEqual(g.pts, 7.3); assert.ok(/^Q3/.test(g.status), g.status);
    assert.strictEqual(t.rows.find(r => r.name === 'Hurt Guy').inj, 'O');
    assert.strictEqual(t.rows.find(r => r.name === 'Aaron Rodgers').pts, null);
  });
}
T('reader ignores weather/notes tables nested in player cells', () => { const t = parseTeam(teamPage('server', base, 7), 1); assert.ok(t.rows.every(r => !/Forecast|Powered/.test(r.name + r.status))); });
T('reader returns zero rows (not a crash) on an unrelated page', () => { assert.strictEqual(parseTeam('<html><body>nothing</body></html>', 1).rows.length, 0); });

/* ---------- 2. client helpers pulled straight out of cfn.html ---------- */
const html = fs.readFileSync(path.join(__dirname, '../client/public/cfn.html'), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a); assert.ok(i >= 0, 'missing ' + a); const j = html.indexOf(b, i); assert.ok(j > i, 'missing ' + b); return html.slice(i, j); };
const code = "var GI={},GI0={pt:{},sc:{},wk:10},PVL_WK=10;var YS={};function lgEsc(x){return String(x)}function giTime(st){var m=/\\b(\\d{1,2}:\\d\\d)\\s*([ap]m)/i.exec(st);return m?m[1]+m[2].toLowerCase():''}function giTier(){return 1}function bigNN(n){return n}\n"
  + cut('function ysNorm', 'function ysNn') + cut('function ysFrac', 'function ysErf') + cut('function ysGi', 'function giFor') + 'function giFor(n){return GI[ysNorm(n)]||null}\n'
  + cut('function ysStat', 'function ysErf') + cut('var YS_OUT=YS_OUT', 'function ysApply') + cut('function ysErf', 'function ysSide').replace(/^/, '') + cut('function ysApply', 'function ysClock') + cut('function wpTot', 'function wpTeam')
  + '\nmodule.exports={wpsProb,ysDefFin,YS_DP,ysSide,ysApply,wpPace,wpOut,wpTot,ysFrac,ysGi,GI,YS,YS_OUT,setW:function(p,q){PVL=p;PV8=q}};';
const sandbox = { module: { exports: {} }, console, Math };
let L; try { new Function('module', 'PVL', 'PV8', code + '\nreturn module.exports;'); const f = new Function('module', 'var PVL={},PV8={};' + code); f(sandbox.module); L = sandbox.module.exports; } catch (e) { console.error('FAIL  cannot load client helpers: ' + e.message); process.exit(1); }
const row = (slot, name, pos, tm, proj, pts, status, inj) => [slot, name, pos, tm, proj, pts, status, inj || ''];
T('live player: projection shrinks toward points by clock; lime/red pace', () => {
  L.ysGi('Qb A', row('QB', 'Qb A', 'QB', 'NE', 20, 15, 'Q3 5:00, 10-28 @ Det'));
  assert.strictEqual(L.wpPace('Qb A', 15, 4, 20), ' lo');
  L.ysGi('Wr B', row('WR', 'Wr B', 'WR', 'Pit', 10, 2, 'Q4 2:00, 3-20 vs Cin'));
  assert.strictEqual(L.wpPace('Wr B', 2, 4, 10), ' lu');
  assert.strictEqual(L.wpPace('Nobody', 2, 4, 10), '');
});
T('Out player keeps his score, no projection, cross shown', () => {
  const s = L.ysSide([row('QB', 'Qb A', 'QB', 'NE', 20, 15, 'Q3 5:00, 10-28 @ Det'), row('RB', 'Hurt Guy', 'RB', 'Pit', 12, 3, 'Sun 4:25 pm vs Cin', 'O')], {});
  const h = s.R.find(r => r[1] === 'Hurt Guy'); assert.deepStrictEqual(h.slice(2), [3, 2]);
  assert.ok(L.wpOut('Hurt Guy').includes('wp-out')); assert.strictEqual(L.wpOut('Qb A'), '');
  assert.strictEqual(s.left, 1);
});
T('ysSide survives nulls, byes, finals, odd statuses, K/DEF', () => {
  const rows = [row('QB', 'A', 'QB', 'X', null, null, ''), row('RB', 'B', 'RB', 'X', 5, 5, 'Bye'), row('WR', 'C', 'WR', 'X', 8, 9, 'Final W 24-10 vs Y'), row('TE', 'D', 'TE', 'X', 3, 0, 'Halftime, 3-0 vs Z'), row('K', 'E', 'K', 'X', 7, 0, 'Sun 1:00 pm @ T'), row('DEF', 'Jets', 'DEF', 'NYJ', 6, 0, 'Q1 9:00, 0-0 vs Q'), row('FOO', 'F', 'WR', 'X', 1, 1, undefined)];
  const s = L.ysSide(rows, {}); assert.ok(isFinite(s.pj) && isFinite(s.sc) && isFinite(s.base));
});
T('ysApply: new lineup replaces the old one, one bad matchup cannot sink the league', () => {
  const mk = (ia, ib) => ({ ia, ib, a: ['A' + ia, 'm', '1-0', 100, 80, 120, []], b: ['B' + ib, 'n', '0-1', 90, 70, 110, []], ra: [['QB', 'Old QB', 20, 3]], rb: [['QB', 'Other QB', 18, 3]], ka: ['K', 0, 2], kb: ['K', 0, 2], da: ['D', 0, 2], db: ['D', 0, 2], left: 18 });
  const PVL = { gl: [mk(1, 2), mk(3, 4)] }, PV8 = { gl: [mk(1, 2), mk(3, 4)] };
  L.setW(PVL, PV8);
  const rows1 = [row('QB', 'New QB', 'QB', 'Pit', 21, null, 'Sun 8:20 pm vs Cin'), row('WR', 'W1', 'WR', 'Pit', 11, null, 'Sun 8:20 pm vs Cin')];
  const rows2 = [row('QB', 'Q2', 'QB', 'Pit', 19, null, 'Sun 8:20 pm vs Cin'), row('WR', 'W2', 'WR', 'Pit', 9, null, 'Sun 8:20 pm vs Cin')];
  const bad = { ia: 3, ib: 4, L: null, R: rows2 }; // malformed matchup
  const n = L.ysApply('gl', { matchups: [{ ia: 1, ib: 2, L: rows1, R: rows2 }, bad] });
  assert.strictEqual(n, 1); assert.ok(PVL.gl[0].ra.some(r => r[1] === 'New QB') && !PVL.gl[0].ra.some(r => r[1] === 'Old QB'), 'lineup not replaced');
  const w = L.wpTot('gl', PVL.gl[0]); assert.ok(/wp-tt a/.test(w.a) && /class="pj"/.test(w.b) && !/orig|Yahoo/.test(w.a));
});
T('Defense live projection follows the scoreboard (points + yards allowed tiers)', () => {
  const f = (pts, p0, st) => L.ysDefFin(pts, p0, st);
  console.log('    DEF samples:', ['Q1 15:00, 0-0 @ Tn', 'Q2 0:22, 10-17 vs Hou', 'Q2 0:22, 10-3 vs Hou', 'Q3 5:00, 7-28 @ Det', 'Q4 0:30, 20-10 vs Ind'].map((st, i) => f([16, 6, 15, 2, 12][i], 8.1, st).toFixed(2)).join(' | '));
  assert.strictEqual(f(5, 8, 'Sun 8:20 pm vs Cin'), null); assert.strictEqual(f(5, 8, 'Final W 24-10 vs Y'), null);
  const kick = f(16, 8.4, 'Q1 15:00, 0-0 @ Tn'); assert.ok(kick > 6 && kick < 12, 'kickoff ~ pregame projection, got ' + kick);
  const losing = f(6, 8.13, 'Q2 0:22, 10-17 vs Hou'), winning = f(15, 8.13, 'Q2 0:22, 10-3 vs Hou');
  assert.ok(losing < 8.13 + 2 && losing > -3, 'losing defense should fall, got ' + losing); assert.ok(winning > losing, 'shutout pace beats trailing');
  assert.ok(Math.abs(f(12, 8, 'Q4 0:30, 20-10 vs Ind') - 12) < 1.2, 'late game barely moves');
  assert.ok(f(2, 8, 'Q3 5:00, 7-28 @ Det') < f(6, 8, 'Q3 5:00, 7-10 @ Det'), 'more points allowed lowers it');
  assert.ok(isFinite(f(null, null, 'Halftime, 3-0 vs X')) && isFinite(f(2, 8, 'End of Q1, 0-7 vs X')));
  const s = L.ysSide([row('DEF', 'Browns', 'DEF', 'Cle', 8.13, 6, 'Q2 0:22, 10-17 vs Hou')], {}); assert.ok(Math.abs(s.pj - losing) < 1e-9 && L.YS_DP.browns != null);
});
T('Win probability: even at kickoff, decisive late, never NaN', () => {
  const w = L.wpsProb; assert.ok(Math.abs(w(0, 120, 0, 120) - 0.5) < 0.01);
  assert.ok(w(0, 130, 0, 110) > 0.7 && w(0, 110, 0, 130) < 0.3);
  assert.ok(w(100, 105, 60, 62) > 0.99 && w(60, 62, 100, 105) < 0.01, 'late and far behind');
  assert.strictEqual(w(120, 120, 100, 100), 1); assert.strictEqual(w(90, 90, 100, 100), 0); assert.strictEqual(w(90, 90, 90, 90), 0.5);
  assert.ok(w(60, 130, 60, 129) > w(60, 129, 60, 130)); assert.ok(isFinite(w(0, 0, 0, 0)) && isFinite(w(null, null, null, null) || 0));
});
console.log(pass + ' passed' + (process.exitCode ? ', FAILURES above' : ''));
