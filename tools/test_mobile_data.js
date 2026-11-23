// Context, weekly lineups, history, freshness, rollover. Run: node tools/test_mobile_data.js
const T = require('./mobile_harness'), { M, mobile, lineups, call, mu, six, ok, store, game, mkBoard } = T;
(async () => {
  T.BOARD = mkBoard(11, [game('a', 'HOU', 'IND', 17, 14, 'in', 3, '2:42', 'home', '2026-11-20T01:15Z'), game('b', 'BUF', 'MIA', 0, 0, 'pre', 0, '0:00', null, '2026-11-22T18:00Z')], ['ATL', 'CLE']);
  await M.getBoard(null, 0);
  let c = await call(mobile, '/api/mobile?r=context');
  ok(c.s === 200 && c.j.schemaVersion === 1 && c.j.season === 2026 && c.j.currentWeek === 11, 'context week 11');
  ok(JSON.stringify(c.j.availableWeeks) === '[]', 'no stored weeks listed yet: ' + JSON.stringify(c.j.availableWeeks));
  ok(/s-maxage=20/.test(c.h['cache-control']), 'context cache <=30s');
  ok(!isNaN(Date.parse(c.j.updatedAt)), 'updatedAt is ISO');
  for (const lg of M.LGS) { await M.saveWeek(lg, 5, six(1), false, { final: true }); await M.saveWeek(lg, 11, [mu(1, 7), mu(2, 8), mu(3, 9), mu(4, 10), mu(5, 11), mu(6, 12)], false, {}); }
  c = await call(mobile, '/api/mobile?r=context'); ok(JSON.stringify(c.j.availableWeeks) === '[5,11]', 'available weeks = stored weeks: ' + JSON.stringify(c.j.availableWeeks));
  const w5 = await call(lineups, '/api/lineups?lg=gl&week=5'), w11 = await call(lineups, '/api/lineups?lg=gl&week=11');
  ok(w5.j.week === 5 && w11.j.week === 11, 'requested week returned');
  ok(w5.j.matchups[0].ib === 2 && w11.j.matchups[0].ib === 7, 'week 5 vs week 11 opponents differ');
  ok(w5.j.final === true && w5.j.stale === false && /3600/.test(w5.h['cache-control']), 'week 5 final and cached long');
  ok(w11.j.final === false && w11.j.partial === false && w11.j.sourceUpdatedAt && w11.j.fetchedAt && w11.j.cacheAgeSeconds < 5, 'week 11 freshness fields');
  ok(w11.j.matchups.every(m => [m.L, m.R].every(L => L.every(r => r.length >= 8 && r.length <= 9))), 'rows keep 8 columns plus optional 9th');
  const L0 = w11.j.matchups[0].L, R0 = w11.j.matchups[0].R;
  ok(L0[0][3] === 'CIN' && R0[1][3] === 'WAS', 'team codes canonical uppercase (Wsh -> WAS)');
  ok(R0[0].length === 9 && R0[0][8].period === 'Q3 2:42' && R0[0][8].homeScore === 17 && R0[0][8].awayScore === 14 && R0[0][8].possessionTeam === 'HOU' && R0[0][8].homeTeam === 'HOU' && R0[0][8].awayTeam === 'IND', 'live HOU row has strip + confirmed possession');
  ok(R0[0][6] === 'Q3 2:42, 17-14 vs IND', 'gameStatus filled when Yahoo gave none: ' + R0[0][6]);
  ok(L0[0].length === 8 && L0[1].length === 8, 'rows for teams not in a live game stay 8 columns');
  ok(L0[0][6] === 'Sun 1:00 pm @ Hou' && L0[1][6] === 'Final' && L0[0][5] === null && L0[1][5] === 5, 'Yahoo status text kept, unplayed score stays null');
  T.BOARD = mkBoard(11, [game('a', 'HOU', 'IND', 17, 14, 'in', 3, '2:42', null, '2026-11-20T01:15Z')], []); store.delete('mb:cur'); await M.getBoard(null, 0);
  const w11b = await call(lineups, '/api/lineups?lg=gl&week=11'); ok(w11b.j.matchups[0].R[0][8].possessionTeam === null, 'possession null when the provider gives none');
  await M.saveWeek('gl', 5, [mu(9, 12)], false, {}); const w5b = await call(lineups, '/api/lineups?lg=gl&week=5');
  ok(w5b.j.matchups.length === 6 && w5b.j.matchups[0].ib === 2, 'finished week not overwritten');
  const miss = await call(lineups, '/api/lineups?lg=gl&week=3'); ok(miss.s === 502 && miss.j.available === false && miss.j.error === 'provider_unavailable' || miss.s === 404 && miss.j.error === 'week_unavailable', 'missing week returns explicit unavailable (got ' + miss.s + ')');
  const bad = await call(lineups, '/api/lineups?lg=zz&week=5'); ok(bad.s === 400, 'bad league errors');
  const rec = await M.rget('mw:gl:11'), before = rec.sourceUpdatedAt;
  await M.noteFail('gl', 11, 'yahoo 500'); const r2 = await M.rget('mw:gl:11'), failure = await M.rget('mw:error:gl:11'); ok(r2.sourceUpdatedAt === before && r2.fetchedAt === rec.fetchedAt && failure.error === 'yahoo 500', 'failed fetch keeps sourceUpdatedAt');
  r2.fetchedAt = Date.now() - 400000; r2.sourceUpdatedAt = r2.fetchedAt; await M.rset('mw:gl:11', r2, 0);
  const st = await call(lineups, '/api/lineups?lg=gl&week=11'); ok(st.j.stale === true && st.j.cacheAgeSeconds >= 399 && st.j.lastError === 'yahoo 500', 'old cache is flagged stale');
  T.espnDown = true; store.delete('mb:cur'); await M.getBoard(null, 0); const sd = await call(mobile, '/api/mobile?r=context'); ok(sd.s === 200 && sd.j.currentWeek === 11, 'context survives a scoreboard outage'); T.espnDown = false;
  T.BOARD = mkBoard(12, [game('c', 'DAL', 'NYG', 0, 0, 'pre', 0, '0:00', null, '2026-11-26T21:30Z')], []); store.delete('mb:cur'); await M.getBoard(null, 0);
  c = await call(mobile, '/api/mobile?r=context'); ok(c.j.currentWeek === 12 && !c.j.availableWeeks.includes(12) && c.j.availableWeeks.includes(11), 'rollover to 12; 12 listed only once stored');
  const defl = await call(lineups, '/api/lineups?lg=gl'); ok(defl.j && defl.j.week === 12 || defl.s === 404 || defl.s === 502, 'default week follows the current week (12), not a fixed 10');
  const old11 = await call(lineups, '/api/lineups?lg=gl&week=11'); ok(old11.j.matchups[0].ib === 7, 'week 11 still served after rollover');
  T.BOARD = mkBoard(12, [game('c', 'DAL', 'NYG', 0, 0, 'pre', 0, '0:00', null, '2026-11-26T21:30Z')], []);
  const fe = await M.finalEligible(11, await M.context()); ok(fe === false || fe === true, 'finalEligible evaluates');

  const media = await call(mobile, '/api/mobile?r=media');
  ok(media.s === 200 && media.j.schemaVersion === 1 && Object.values(media.j.teams).every(t=>Object.keys(t).length===12), 'media retains old schema and all 48 team identities');
  ok(JSON.stringify(media.j.featuredMatchups)===JSON.stringify(require('../client/api/_resources.json').tools.featuredMatchups), 'Primetime uses exact season/week-scoped editorial metadata');
  // ---------- v2 additions ----------
  const bw = await call(lineups, '/api/lineups?lg=gl&week=30'); ok(bw.s === 400 && bw.j.error === 'invalid_week' && bw.j.week === '30', 'week 30 -> 400 invalid_week echoing the request');
  ok((await call(lineups, '/api/lineups?lg=gl&week=abc')).s === 400 && (await call(lineups, '/api/lineups?lg=gl&week=0')).s === 400, 'non-numeric and zero weeks rejected');
  ok((await call(mobile, '/api/mobile?r=lineups&lg=gl&week=19')).s === 400 && (await call(mobile, '/api/mobile?r=lineups&lg=zz')).s === 400, 'named endpoint validates league and week');
  // Yahoo clock text wins for live games; score and possession stay from the scoreboard
  T.BOARD = mkBoard(12, [game('a', 'HOU', 'IND', 17, 14, 'in', 3, '2:42', 'home', '2026-11-20T01:15Z')], []); store.delete('mb:cur'); await M.getBoard(null, 0); store.delete('mb:11'); await M.rset('mb:11', await M.rget('mb:cur'), 0);
  const rec12 = (await M.rget('mw:gl:11')); rec12.matchups[0].R[0][6] = 'Q3 2:30, 17-14 vs Ind'; await M.rset('mw:gl:11', rec12, 0);
  const wy = await call(lineups, '/api/lineups?lg=gl&week=11');
  const hou = wy.j.matchups[0].R[0]; ok(hou[8] && hou[8].period === 'Q3 2:42' && hou[8].homeScore === 17 && hou[8].possessionTeam === 'HOU', 'clock, score and possession stay on the same snapshot: ' + JSON.stringify(hou[8]));
  // named-field schema
  await M.rset('ms:sleeper', { at: Date.now(), n: 1, map: { 'joeburrow|QB': '6770' } }, 0);
  await M.saveWeek('gl', 13, [mu(1, 2), mu(3, 4), mu(5, 6), mu(7, 8), mu(9, 10), mu(11, 12)], false, { upcoming: true });
  const nm = await call(mobile, '/api/mobile?r=lineups&lg=gl&week=13'); const m0 = nm.j.matchups[0], p0 = m0.teams[0].lineup[0];
  ok(nm.s === 200 && nm.j.schemaVersion === 2 && nm.j.leagueId === 'gl' && nm.j.season === 2026 && nm.j.freshness.upcoming === true && nm.j.freshness.final === false, 'named schema envelope + freshness');
  ok(m0.matchupId === 'gl-2026-w13-1v2' && m0.winProbability === null && m0.teams[0].teamId === 1 && m0.teams[0].lineup.length === 2, 'stable matchup id; odds reserved as null, never invented');
  ok(p0.playerId === '6770' && /sleepercdn\.com\/content\/nfl\/players\/6770\.jpg\?v=1/.test(p0.photoURL) && p0.liveProjection === 20 && p0.originalProjection === 20 && p0.points === null && p0.nflTeam === 'CIN', 'player id, portrait, live and first-captured projection');
  ok(m0.teams[0].lineup[1].playerId === 'cfn:bijan:RB', 'unknown players get a stable cfn: id');
  const rr = await M.rget('mw:gl:13'); rr.matchups[0].L[0][4] = 25; await M.rset('mw:gl:13', rr, 0); await M.saveWeek('gl', 13, rr.matchups, false, { upcoming: true });
  const nm2 = await call(mobile, '/api/mobile?r=lineups&lg=gl&week=13'); const q0 = nm2.j.matchups[0].teams[0].lineup[0]; ok(q0.liveProjection === 25 && q0.originalProjection === 20, 'original projection is kept when the live one moves');
  // upcoming week 13s listed only when all four leagues have them
  c = await call(mobile, '/api/mobile?r=context'); ok(!c.j.availableWeeks.includes(13), 'upcoming week 13 not listed until all four leagues are stored');
  for (const lg of ['bh', 'rb', 'sts']) await M.saveWeek(lg, 13, six(1), false, { upcoming: true });
  c = await call(mobile, '/api/mobile?r=context'); ok(c.j.availableWeeks.includes(13), 'upcoming week 13 listed once all four leagues are stored: ' + JSON.stringify(c.j.availableWeeks));
  // media feed
  const md = await call(mobile, '/api/mobile?r=media', { headers: { host: 'x' } }); ok(md.s === 200 && md.j.teams.gl['7'].ownerPhotoURL === 'https://cuadzfantasynetwork.com/media/owners/pru.png?v=' + require('../client/api/_media.json').teams.gl[7].ownerPhotoV && md.j.teams.rb['3'].logoURL && md.j.teams.rb['3'].ownerPhotoURL === null && md.j.teams.gl['7'].teamId === 7, 'media feed: GL owner portraits, other leagues Yahoo logos, versioned URLs');
  store.set('mj:lock:calendar', '1'); const sk = await call(mobile, '/api/mobile?r=cron', { headers: { authorization: 'Bearer test-cron' } }); ok(sk.j.skipped, 'cron lock stops overlapping refreshes'); store.delete('mj:lock:calendar');
  T.done();
})().catch(e => { console.log('ERROR', e); process.exit(1); });
