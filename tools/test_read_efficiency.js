'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), zlib = require('node:zlib');
const T = require('./mobile_harness'), M = T.M;
const B = require('../client/api/_bdl'), C = require('../client/api/_mball');
const P = require('../client/api/_mscores');
const fixture = JSON.parse(zlib.gunzipSync(fs.readFileSync(__dirname + '/fixtures/scoring-thursday.json.gz')));
let checks = 0; const ok = (v, message) => { assert.ok(v, message); checks++; };
const fetchBase = global.fetch, commands = [];
global.fetch = async (url, options) => {
  if (String(url).startsWith('https://fake-redis')) commands.push(JSON.parse(options.body));
  return fetchBase(url, options);
};
const gets = key => commands.filter(c => c[0] === 'GET' && c[1] === key).length;
(async () => {
  const now = Date.now(), board = { season: 2026, week: 11, games: [], fetchedAt: now, sourceUpdatedAt: now };
  await M.write('mb:cur', board);
  await M.write('mc:ctx', { week: 11, season: 2026, updated: now }, 30 * 86400);
  commands.length = 0;
  const context = await M.context({ cachedOnly: true });
  await M.context({ cachedOnly: true });
  ok(context.week === 11 && !context.stale, 'cached context preserves current week');
  ok(commands.some(c => c[0] === 'SET' && c[1] === 'mc:ctx'), 'calendar recovery persistence is preserved');
  T.store.delete('mb:cur');
  ok((await M.context({ cachedOnly: true })).stale, 'recovery week remains explicitly stale');
  await M.write('mb:cur', { ...board, week: 12 });
  ok((await M.context({ cachedOnly: true })).week === 12, 'new calendar week is visible without process cache');
  await M.write('mb:cur', board);
  T.BOARD = T.mkBoard(11, [T.game('1','HOU','IND',10,7,'post',4,'0:00',null,new Date(now).toISOString())]);
  await require('../client/api/_mjobs').calendar();
  ok(JSON.parse(T.store.get('mc:ctx')).week === 11, 'calendar still persists recovery context');

  // Both legacy request forms retain their response contract with one context read.
  const serveWeek = M.serveWeek;
  M.serveWeek = async (lg, week, c) => ({ lg, week, contextWeek: c.week, matchups: [], stale: false, partial: false });
  for (const query of ['lg=gl', 'lg=gl&week=9']) {
    commands.length = 0;
    const r = await T.call(T.lineups, '/api/lineups?' + query);
    ok(r.s === 200 && r.j.week === (query.includes('week') ? 9 : 11), 'lineup week selection unchanged');
    ok(gets('mb:cur') === 1, 'lineup handler reads calendar once');
  }
  M.serveWeek = serveWeek;

  const c = { season: 2026, week: 11 }, prefix = 'bdl:2026:11';
  const snap = structuredClone(fixture), game = snap.game;
  const key = prefix + ':game:' + game.id;
  const originalAll = B.all, originalPublish = P.publish;
  B.all = async endpoint => ({ stats: snap.stats, team_stats: snap.teamStats, plays: snap.plays })[endpoint];
  const publications = [];
  P.publish = async (_, snapshots) => { publications.push(snapshots); return P.calculate('gl', snapshots, {}, now); };
  const persisted = new Map();
  await C.ingestGame(game, prefix, undefined, persisted);
  commands.length = 0;
  const optimized = await C.publishStored(c, [game], persisted);
  ok(gets(key) === 0, 'successfully saved snapshot has no immediate download');
  const baseline = await C.publishStored(c, [game]);
  assert.deepEqual(optimized, baseline); checks++;
  ok(gets(key) === 1, 'storage-only publication reads the saved snapshot');
  const bytes = Buffer.byteLength(T.store.get(key));

  // Failed persistence must never publish fresh data from memory.
  const write = M.write; M.write = async () => { throw new Error('storage unavailable'); };
  const failed = new Map();
  await assert.rejects(C.ingestGame(game, prefix, undefined, failed), /storage unavailable/); checks++;
  ok(failed.size === 0, 'failed writes cannot bypass persisted source of truth');
  M.write = write;
  const corrected = { ...persisted.get(game.id), revision: 'correction' };
  await M.write(key, corrected);
  await C.publishStored(c, [game], new Map());
  ok(publications.at(-1)[0].revision === 'correction', 'later passes read stored corrections rather than old memory');

  // Exercise all four real collector passes without waiting or contacting providers.
  const realNow = Date.now, sleep = M.sleep, contextFn = M.context;
  let clock = now; Date.now = () => clock; M.sleep = async ms => { clock += ms; };
  const live = { ...game, season: 2026, week: 11, status_state: 'in_progress', status: '4th' };
  const final = { ...game, id: game.id + 1, season: 2026, week: 11, status_state: 'final', status: 'Final' };
  const upcoming = { ...game, id: game.id + 2, season: 2026, week: 11, status_state: 'scheduled', status: 'Scheduled', date: new Date(now + 86400000).toISOString() };
  await M.write(prefix + ':game:' + final.id, { ...snap, game: final, observedAt: now });
  M.context = async () => ({ ...c, board: { games: [{ state: 'in' }] } });
  B.all = async endpoint => endpoint === 'games' ? [live, final, upcoming] :
    ({ stats: snap.stats, team_stats: snap.teamStats, plays: snap.plays.map(p => ({ ...p, game: live })) })[endpoint];
  commands.length = 0;
  try {
    await C.collect();
    ok(gets(key) === 0, 'collector avoids unused live prior read and all four immediate read-backs');
    ok(gets(prefix + ':game:' + final.id) === 4, 'final gate read reused initially; subsequent passes still check corrections');
    ok(gets(prefix + ':game:' + upcoming.id) === 4, 'uncollected games retain storage fallback on each pass');
    ok(commands.filter(cmd => cmd[0] === 'SET' && cmd[1] === key).length === 4, 'live snapshot persistence still occurs every 15 seconds');
  } finally {
    Date.now = realNow; M.sleep = sleep; M.context = contextFn; B.all = originalAll; P.publish = originalPublish;
  }
  console.log(`${checks} read-efficiency checks passed. Fixture snapshot: ${bytes} bytes; avoided immediate download per successful publication: ${bytes} bytes (payload only).`);
})().catch(e => { console.error(e); process.exitCode = 1; });
