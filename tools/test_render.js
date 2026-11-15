// End-to-end check in a real browser: feeds the page a changed lineup through its own refresh path and verifies what actually renders.
// Needs Playwright:  NODE_PATH=$(npm root -g) node tools/test_render.js [path/to/cfn.html]
const { chromium } = require('playwright'); const path = require('path');
const file = process.argv[2] || path.join(__dirname, '../client/public/cfn.html');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : 'FAIL  ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 430, height: 900 } }), errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.addInitScript(() => {
    try { localStorage.setItem('cfn_member', 'Cuadz'); } catch (e) {}
    const real = window.fetch;
    window.fetch = function (u) {
      u = String(u); const m = /\/api\/lineups\?lg=(\w+)/.exec(u);
      if (!m) return Promise.reject(new Error('offline'));
      const k = m[1], st = { 3: 'Sun 8:20 pm vs Cin', 2: 'Final W 24-10 vs Cin', 4: 'Q3 5:00, 10-28 vs Cin' };
      const slot = s => ({ FLX: 'W/R/T', SFX: 'Q/W/R/T' })[s] || s;
      const rows = (rs, k2, d2) => rs.map(r => [slot(r[0]), r[1], r[0], 'Pit', r[3] === 3 ? r[2] : (r[4] == null ? 0 : r[4]), r[3] === 3 ? null : r[2], st[r[3]] || st[3], ''])
        .concat([['K', k2[0], 'K', 'Pit', 7, null, st[3], ''], ['DEF', d2[0], 'DEF', 'Pit', 6, null, st[3], '']]);
      window.__base = window.__base || JSON.parse(JSON.stringify(window.PVL)); // always build from the untouched schedule, like Yahoo would
      const ms = (window.__base[k] || []).map((x, i) => {
        const L = rows(x.ra, x.ka, x.da), Rr = rows(x.rb, x.kb, x.db);
        if (k === 'bh' && i === 0) { L[0][1] = 'Sentinel QB'; }
        // injury / game state belong to the player, so every league reports the same thing for him
        [L, Rr].forEach(side => side.forEach(r => { if (r[1] === 'Christian McCaffrey') { r[7] = 'O'; r[5] = 3.2; } if (r[1] === 'Audric Estime') { r[6] = st[4]; r[5] = 9.9; r[4] = 12; } }));
        return { ia: x.ia, ib: x.ib, an: x.a[0], bn: x.b[0], L, R: Rr, ya: [10.8, 122.04], yb: [58.65, 125.13] };
      });
      return Promise.resolve(new Response(JSON.stringify({ lg: k, week: 10, matchups: ms }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    };
  });
  await pg.goto('file://' + path.resolve(file) + '?app=1'); await pg.waitForTimeout(800);
  await pg.evaluate(() => { window.ysRefresh = window.ysRefresh; });
  await pg.evaluate(() => ysRefresh()); await pg.waitForTimeout(1200);
  const r = await pg.evaluate(() => { showLive(); const m = PVL.bh[0], ids = [m.ra, m.rb].map(a => a.map(x => x[1]).join('|')).join('|');
    const card = document.querySelector('#lv-list [data-lg="bh"]'); return { ok: YS.ok, errs: YS.errs || 0, sentinel: ids.includes('Sentinel QB'), out: !!card.querySelector('.wp-out'), chip: !!card.querySelector('.gi-sb'), tt: card.querySelectorAll('.wp-tt').length, ml: !!card.querySelector('.wp-proj'), logo: !!card.querySelector('.wp-vslg'), tab: card.querySelector('.wp-tt') && card.querySelector('.wp-tt').closest('.wp-tm2') != null }; });
  ok(r.ok === 4, 'all four leagues refreshed'); ok(r.errs === 0, 'no matchup errors'); ok(r.sentinel, 'changed lineup replaced the old lineup');
  ok(r.out, 'Out player shows the cross'); ok(r.chip, 'live player shows the scoreboard chip'); ok(r.tt === 2 && r.tab, 'team score/projection sit inside both team boxes'); ok(!r.ml, 'old now/proj line removed'); ok(r.logo, 'league logo by the VS');
  const x = await pg.evaluate(async () => {
    const o = {}; o.rf = !!document.getElementById('ys-rf'); o.hlCards = document.querySelectorAll('#hl-list .wp-card').length; o.hlExpect = ['gl','bh','rb','sts'].reduce((n,k)=>n+PVL[k].filter(m=>pvPt(k,m)).length,0);
    o.bar = [...document.querySelectorAll('#app-tabbar button')].map(b=>b.textContent.trim());
    showHome(); o.bar = [...document.querySelectorAll('#app-tabbar button')].map(b=>b.textContent.trim());
    showMine(); o.mineCards = document.querySelectorAll('#mine-body .wp-card').length; o.mineOn = !document.getElementById('view-mine').hidden; o.barMine = document.querySelector('#app-tabbar button.on') && document.querySelector('#app-tabbar button.on').textContent.trim();
    const c = document.querySelector('#mine-body .wp-card'); c.classList.add('open'); c.setAttribute('aria-expanded', 'true'); await ysRefresh(true); await new Promise(r => setTimeout(r, 400));
    const c2 = document.querySelector('#mine-body .wp-card'); o.keptOpen = !!(c2 && c2.classList.contains('open'));
    showHome(); o.mineHidden = document.getElementById('view-mine').hidden; return o; });
  ok(x.rf, 'refresh button present'); ok(x.hlCards > 0 && x.hlCards === x.hlExpect, 'headliners show every primetime matchup (' + x.hlCards + ')');
  ok(x.bar.length === 5 && /My Matchups/.test(x.bar.join('|')), 'home bar has five tabs: ' + x.bar.join(' / '));
  ok(x.mineOn && x.mineCards >= 1 && /My Matchups/.test(x.barMine || ''), 'My Matchups lists my games (' + x.mineCards + ') and the tab is highlighted');
  ok(x.keptOpen, 'an open card stays open through a refresh'); ok(x.mineHidden, 'leaving My Matchups hides it');
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' ; ') : ''));
  try { await (await pg.$('#lv-list [data-lg="bh"]')).screenshot({ path: '/tmp/render_card.png', timeout: 5000 }); } catch (e) { console.log('  (screenshot skipped)'); }
  await b.close(); console.log(bad ? 'FAILED' : 'all render checks passed'); process.exit(bad ? 1 : 0);
})();
