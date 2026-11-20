// Market movers math and filters. Run: node tools/test_mobile_movers.js
const MV = require('../client/api/_mmovers'); let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
(async () => {
  const P = MV.MM.players, ks = Object.keys(P), v = {}, now = Date.now();
  // snapshot 7 days old: scale every series by a per-player factor, one player with a zero baseline
  ks.forEach((k, i) => { const f = [0.8, 1.25, 1, 0.95, 1.1][i % 5]; const o = {}; ['ros1', 'ros2', 'dyn1', 'dyn2', 'dp1', 'dp2'].forEach(s => { if (P[k].s[s] != null) o[s] = Math.round(P[k].s[s] * f); }); v[k] = o; });
  const zero = ks.find(k => MV.value(P[k].s) > 4000); v[zero] = { ros1: 0, ros2: 0, dyn1: 0, dyn2: 0, dp1: 0, dp2: 0, };
  const hist = { snaps: [{ t: new Date(now - 7 * 864e5).toISOString(), v }, { t: new Date(now - 30 * 36e5).toISOString(), v: {} }] };
  const r = await MV.compute('example.test', 11, async () => { throw new Error('no live'); }, hist);
  ok(r.ok, 'compute ok'); const b = r.body, up = b.players.filter(p => p.change > 0), dn = b.players.filter(p => p.change < 0);
  ok(up.length >= 5 && dn.length >= 5, 'at least five risers and five fallers: ' + up.length + '/' + dn.length);
  ok(b.players.every(p => p.change === p.currentValue - p.priorValue && Math.abs(p.percentChange - p.change / p.priorValue * 100) < 0.006), 'change and percentChange (7.14 means 7.14%) are exact');
  ok(b.players.every(p => p.priorValue > 0 && Math.max(p.currentValue, p.priorValue) >= 1500 && p.id && p.name && p.position && 'photoURL' in p), 'zero/invalid baselines and sub-1500 values excluded; fields present');
  ok(b.players.every(p => !p.team || /^[A-Z]{2,3}$/.test(p.team) && !['LVR','GBP','NEP','TAM','SFO','KAN','NOR'].includes(p.team)), 'team codes canonical');
  ok(up.every((p, i) => i === 0 || up[i - 1].percentChange >= p.percentChange), 'risers sorted by percentChange');
  ok(MV.value({}) === null && MV.value({ ros1: 0, dp1: 0, sp1: 0, km1: 0, kt1: 0 }) === 0, 'no series -> null value (excluded); all-zero -> 0 (excluded by the filters)');
  ok(/^Week 11 · /.test(b.label) && b.baselineAt && b.modelVersion, 'label names the week; baseline date + model version present: ' + b.label);
  const none = await MV.compute('x', 11, async () => { throw 1; }, { snaps: [{ t: new Date(now - 3600e3).toISOString(), v }] }); ok(!none.ok && none.error === 'no_baseline', 'no usable baseline -> explicit error, nothing invented');
  console.log(JSON.stringify(b.players[0])); console.log(pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
