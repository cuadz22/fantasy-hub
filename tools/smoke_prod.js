// Post-deploy check against the live site:  node tools/smoke_prod.js [https://cuadzfantasynetwork.com]
// Every league must return all 6 matchups with full rosters and not be flagged partial.
const base = process.argv[2] || 'https://cuadzfantasynetwork.com'; let bad = 0;
(async () => {
  for (const lg of ['gl', 'bh', 'rb', 'sts']) {
    try {
      const r = await fetch(`${base}/api/lineups?lg=${lg}&week=${process.env.WEEK || 10}&v=${Date.now()}`, { cache: 'no-store' }); const j = await r.json();
      const m = j.matchups || [], short = m.filter(x => x.L.length < 9 || x.R.length < 9).length;
      const good = r.status === 200 && m.length === 6 && !short && !j.partial; if (!good) bad++;
      console.log((good ? '  ok  ' : 'FAIL  ') + lg + ': ' + m.length + ' matchups, ' + short + ' short lineups, partial=' + !!j.partial + ', ' + j.ms + 'ms');
    } catch (e) { bad++; console.log('FAIL  ' + lg + ': ' + e.message); }
  }
  process.exit(bad ? 1 : 0);
})();
