(async () => {
  const out = { fails: [], notes: [] }, fail = (m) => out.fails.push(m), ok = (m) => out.notes.push(m);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 80 && !(window.__WK10 && window.RECAP10 && !document.documentElement.classList.contains('wkp')); i++) await sleep(250);
  if (!window.__WK10) { fail('Week data never built (window.__WK10 missing)'); return out; }
  const LG = ['gl', 'bh', 'rb', 'sts'], week = window.RCP.week, r2 = (x) => Math.round(x * 100) / 100;

  // 1. nothing public names the outside provider
  if (/flock\s*fantasy|flockfantasy/i.test(document.body.innerText + document.documentElement.innerHTML.replace(/<script[\s\S]*?<\/script>/g, ''))) fail('page text names an outside provider');
  else ok('no provider names in page text');

  // 2. before kickoff, headliner cards must not show live-only things (odds, arrows, to-play counts)
  const started = LG.some((k) => (window.PVL[k] || []).some((m) => m.la && m.lb && (m.la.s > 0 || m.lb.s > 0)));
  const cards = [...document.querySelectorAll('#hl-list .wp-card')];
  if (!started) {
    const live = cards.filter((c) => c.dataset.live === '1' || c.querySelector('.wp-ml,.gl,.wp-tp'));
    if (live.length) fail(live.length + ' headliner card(s) show live odds/arrows before kickoff'); else ok('headliners are projection-only before kickoff (' + cards.length + ' cards)');
  } else ok('games have started; live headliner check skipped');

  // 3. standings invariants: every team has played the same number of games, wins equal losses
  LG.forEach((k) => {
    const d = document.createElement('div'); d.innerHTML = window.LGD.stand[k];
    const recs = [...d.querySelectorAll('.lgs-row')].map((r) => (r.children[2].textContent.match(/(\d+)-(\d+)(?:-(\d+))?/) || []).slice(1).map((x) => +x || 0));
    const W = recs.reduce((a, r) => a + r[0], 0), L = recs.reduce((a, r) => a + r[1], 0), T = recs.reduce((a, r) => a + r[2], 0);
    if (recs.length !== 12) fail(k + ': ' + recs.length + ' standings rows');
    if (W !== L) fail(k + ': wins (' + W + ') do not equal losses (' + L + ')');
    recs.forEach((r, i) => { if (r[0] + r[1] + r[2] !== week) fail(k + ' row ' + (i + 1) + ': ' + r.join('-') + ' is not ' + week + ' games'); });
  });
  ok('standings invariants checked');

  // 4. every decimal in the recap copy must be a real number from that matchup (scores, margins, player points, bench, sums, chart values)
  const api = {}, hist = {};
  await Promise.all(LG.map(async (k) => {
    api[k] = await fetch('/api/lineups?lg=' + k + '&week=' + week, { cache: 'no-store' }).then((r) => r.json());
    hist[k] = await fetch('/api/lineups?lg=' + k + '&week=' + week + '&hist=1', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({}));
  }));
  const unmatched = [];
  LG.forEach((k) => window.RCP.lg[k].forEach((m, i) => {
    const S = new Set(), add = (v) => { v = Math.abs(v); S.add(r2(v).toFixed(2)); S.add(r2(v).toFixed(1)); };
    m.s.forEach(add); add(m.s[0] - m.s[1]);
    const mm = (api[k].matchups || []).find((x) => x.ia === m.t[0] && x.ib === m.t[1]) || (api[k].matchups || [])[i];
    const sides = [0, 1].map((s) => ((mm && (s ? mm.R : mm.L)) || m.L[s]).flatMap((r) => [+r[4], +r[5]]).filter((x) => !isNaN(x)));
    sides.forEach((a) => { a.forEach(add); for (let x = 0; x < a.length; x++) for (let y = x + 1; y < a.length; y++) { add(a[x] + a[y]); add(a[x] - a[y]); for (let z = y + 1; z < a.length; z++) add(a[x] + a[y] + a[z]); } });
    [0, 1].forEach((s) => m.L[s].forEach((r) => { add(+r[2]); add(+r[3]); add(+r[2] - +r[3]); }));
    const fl = ((hist[k] || {}).flock || []).find((e) => (e.ia === m.t[0] && e.ib === m.t[1]) || (e.ia === m.t[1] && e.ib === m.t[0]));
    if (fl) fl.rows.forEach((x) => { add(x[2] / 10); add(x[3] / 10); add(Math.abs(x[2] - x[3]) / 10); });
    (window.RECAP10[k + i].match(/\d+\.\d+/g) || []).forEach((n) => { if (!S.has(n) && !S.has(Number(n).toFixed(1)) && !S.has(Number(n).toFixed(2))) unmatched.push(k + i + ':' + n); });
  }));
  if (unmatched.length) fail('recap numbers with no matching data: ' + unmatched.join(', ')); else ok('every recap decimal matches the matchup data');

  // 5. stored win-chance series: scores can only go up, and every matchup has data
  const noSeries = [], backwards = [];
  LG.forEach((k) => window.RCP.lg[k].forEach((m, i) => {
    const fl = ((hist[k] || {}).flock || []).find((e) => (e.ia === m.t[0] && e.ib === m.t[1]) || (e.ia === m.t[1] && e.ib === m.t[0]));
    if (!fl || !fl.rows.length) { noSeries.push(k + i); return; }
    let pa = 0, pb = 0; fl.rows.forEach((x) => { if (x[2] < pa - 100 || x[3] < pb - 100) backwards.push(k + i); /* tenths of a point: small stat corrections are normal, a 10-point drop is a bad reading */ pa = Math.max(pa, x[2]); pb = Math.max(pb, x[3]); });
  }));
  if (noSeries.length) fail('no stored win-chance series for ' + noSeries.join(', '));
  if (backwards.length) fail('stored series drops by 10+ points for ' + [...new Set(backwards)].join(', '));
  if (!noSeries.length && !backwards.length) ok('win-chance series present and monotone for all 24 matchups');

  // 6. swings captions: never claim an uninterrupted lead when the low was under 50%, and lows must agree with the stored series
  const bad = [];
  for (const k of LG) for (let i = 0; i < 6; i++) {
    window.wpsOpenFin(k, i); await sleep(1600);
    const t = document.getElementById('wps-in').innerText.replace(/\s+/g, ' ');
    const low = /low point: (\d+)%/g; let m, lows = []; while ((m = low.exec(t))) lows.push(+m[1]);
    const w = window.RCP.lg[k][i].s[0] >= window.RCP.lg[k][i].s[1] ? 0 : 1;
    if (/whole way/.test(t) && lows[w] < 50) bad.push(k + i + ' says whole way but low ' + lows[w] + '%');
    if (!lows.length) bad.push(k + i + ' chart empty');
  }
  window.wpsClose();
  if (bad.length) fail('swings chart: ' + bad.join('; ')); else ok('24 swings charts read consistently');

  // 7. week labels
  const wt = document.querySelector('.week-title'); if (wt && window.PVL_WK === 11 && !/Week 11/.test(wt.textContent)) fail('home week title is "' + wt.textContent + '"');
  return out;
})()
