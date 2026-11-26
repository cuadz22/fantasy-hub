// One function for the iPhone app: GET /api/mobile/context, /me, /market-movers, /access; POST /auth/request-code, /auth/verify-code, /auth/logout.
// Also the cron entry (/api/mobile/cron): keeps the scoreboard and current-week lineups fresh and backfills finished weeks, independent of visitors.
'use strict';
const M = require('./_m'), A = require('./_mauth'), MV = require('./_mmovers');
const { scrapeLeague } = require('./_lscrape'), Ids = require('./_ids'), Named = require('./_mnamed');
const PUBLIC_BASE = process.env.MOBILE_PUBLIC_BASE || 'https://cuadzfantasynetwork.com';
const J = (res, status, obj, cache, extra) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.setHeader('Cache-Control', cache || 'no-store'); if (extra) Object.keys(extra).forEach(k => res.setHeader(k, extra[k])); res.end(JSON.stringify(obj)); };
const bodyOf = req => { const b = req.body; if (b && typeof b === 'object') return b; try { return JSON.parse(b || '{}'); } catch (e) { return {}; } };
const AUTH = { status: 401, json: { error: 'unauthorized' } };

module.exports = async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return J(res, 204, {});
    const q = new URL(req.url, 'http://x').searchParams, r = String(q.get('r') || '').replace(/^\/+|\/+$/g, '');
    if (r === 'seasonal-theme') { const x = await require('./_seasonal').handle(req, bodyOf(req)); return J(res, x.status, x.json, 'no-store'); }
    if (r === 'scoring-replay') {
      if (!require('./_mjobs').authorized(req)) return J(res, 401, { error: 'unauthorized' });
      if (req.method !== 'POST') return J(res, 405, { error: 'method_not_allowed' });
      const week = Number(q.get('week')), id = Number(q.get('game'));
      if (!Number.isInteger(week) || week < 1 || week > 18 || !Number.isSafeInteger(id) || id < 0) return J(res, 400, { error: 'invalid_game' });
      const B = require('./_bdl'), signal = AbortSignal.timeout(40000);
      const games = await B.all('games', { seasons: [M.SEASON], weeks: [week] }, { signal, maxPages: 3 });
      if (!id) return J(res, 200, { games });
      const game = games.find(g => g.id === id && g.season === M.SEASON && g.week === week && !g.postseason);
      if (!game || !require('./_mball').finished(game)) return J(res, 400, { error: 'finished_game_required' });
      const [stats, teamStats, plays] = await Promise.all(['stats', 'team_stats', 'plays'].map(path => B.all(path, path === 'plays' ? { game_id: id } : { game_ids: [id] }, { signal })));
      if (!stats.length || teamStats.length !== 2 || !plays.length || [...stats, ...teamStats, ...plays].some(x => x.game?.id !== id)) return J(res, 503, { error: 'incomplete_game' });
      return J(res, 200, { schemaVersion: 1, game, observedAt: Date.now(), stats, teamStats, plays });
    }
    if (r === 'cron' || r.startsWith('cron-') || r === 'health') {
      const jobs = require('./_mjobs');
      if (!jobs.authorized(req)) return J(res, 401, { error: 'unauthorized' });
      if (r === 'health') return J(res, 200, await jobs.health());
      let name, work;
      if (r === 'cron' || r === 'cron-calendar') { name = 'calendar'; work = jobs.calendar; }
      else if (r === 'cron-lineups' && M.LGS.includes(q.get('lg'))) { name = 'lineups-' + q.get('lg'); work = () => jobs.refreshLeague(q.get('lg'), q.get('force') === '1'); }
      else if (r === 'cron-maintenance') { name = 'maintenance'; work = jobs.maintenance; }
      else if (r === 'cron-portraits') { name = 'portraits'; work = async () => { const v = await Ids.refresh(false); if (!v) throw new Error('portraits_unavailable'); return { count: v.n }; }; }
      else if (r === 'cron-push') { name = 'push'; work = () => require('./_mpush').collect(); }
      else if (r === 'cron-recaps') { name = 'recaps'; work = () => require('./_recaps').scheduled(); }
      else if (r === 'cron-network') { name = 'network'; work = () => require('./_network').tick(); }
      else if (r === 'cron-connected') { name = 'connected'; work = async () => { const c = await M.context({cachedOnly:true}); if (!c || c.stale) throw Error('context_unavailable'); return require('./_connected').refreshScheduled(c.week); }; }
      else if (r === 'cron-cantcut' || r === 'cron-trades') { name=r.slice(5); work=()=>require('./_leagueupdates').refresh(name); }
      else if (r === 'cron-waivers') { name='waivers'; work=()=>require('./_waivers').scheduled({force:q.get('force')==='1'}); }
      else if (r === 'cron-activities') { name='activities'; work=()=>require('./_liveactivity').tick(); }
      else if (r === 'cron-editorial') { name='editorial'; work=()=>require('./_editorialdesk').synchronize(); }
      else if (r === 'cron-market') { name='market'; work=()=>require('./_marketrefresh').refresh(); }
      else if (r === 'cron-ball') { name = 'ball'; work = () => require('./_mball').collect({ force: q.get('force') === '1' }); }
      else return J(res, 400, { error: 'invalid_job' });
      const result = await jobs.run(name, work); return J(res, result.status, result.body);
    }
    if (r === 'player-log' && req.method === 'GET') {       const league=q.get('lg'),pos=require('./_speciallogs').position(q.get('pos'));       if(!M.LGS.includes(league)||!['QB','RB','WR','TE','K','DEF'].includes(pos)||!q.get('player')) return J(res,400,{error:'invalid_player_history'});       return J(res,200,await require('./_speciallogs').history({name:q.get('player').slice(0,60),pos,league,team:q.get('team')}),'public, s-maxage=300, stale-while-revalidate=600');     }
    if (r === 'player-editorial' && req.method === 'GET') return J(res, 200, await require('./_playereditorial').feed(), 'public, s-maxage=60, stale-while-revalidate=30');
    if (r === 'news' && req.method === 'GET') return J(res, 200, await (q.get('player') ? require('./_news').playerFeed(q.get('player').slice(0,80)) : require('./_news').feed()), 'public, s-maxage=600, stale-while-revalidate=60');
    if (r === 'resources' && req.method === 'GET') return J(res, 200, await require('./_leagueupdates').resources(), 'public, s-maxage=60, stale-while-revalidate=60');
    if (r === 'context' && req.method === 'GET') {
      const c = await M.context({ cachedOnly: true }); if (!c) return J(res, 503, { error: 'context_unavailable' });
      return J(res, 200, { schemaVersion: 1, season: c.season, currentWeek: c.week, availableWeeks: c.weeks, updatedAt: new Date(c.updated || Date.now()).toISOString(), stale: c.stale, live: M.isLive(c.board), byes: c.board ? c.board.byes : [] }, 'public, s-maxage=20, stale-while-revalidate=10');
    }
    if (r === 'auth/request-code' && req.method === 'POST') { const x = await A.requestCode(req, bodyOf(req)); return J(res, x.status, x.json, 'no-store', x.retryAfter ? { 'Retry-After': x.retryAfter } : null); }
    if (r === 'auth/verify-code' && req.method === 'POST') { const x = await A.verifyCode(req, bodyOf(req)); return J(res, x.status, x.json, 'no-store', x.retryAfter ? { 'Retry-After': x.retryAfter } : null); }
    if (r === 'auth/logout' && req.method === 'POST') { const x = await A.logout(req); return J(res, x.status, x.json); }
    if (r === 'activity/register' && req.method === 'POST') { const x=await require('./_liveactivity').register(req,bodyOf(req)); return J(res,x.status,x.json); }
    if (r === 'activity/remove' && req.method === 'POST') { const x=await require('./_liveactivity').remove(req,bodyOf(req)); return J(res,x.status,x.json); }
    if (r === 'widget' && req.method === 'GET') { const x=await require('./_liveactivity').read(req); return J(res,x.status,x.json); }
    if (r === 'push/test' && req.method === 'POST') { const x = await require('./_mpush').testDevice(req, bodyOf(req)); return J(res, x.status, x.json); }
    if (r === 'push/device' && req.method === 'POST') { const x = await require('./_mpush').registration(req, bodyOf(req)); return J(res, x.status, x.json); }
    if (r === 'recaps' || r.startsWith('recaps/')) { const x=await require('./_recaps').route(req,r,q,bodyOf(req)); return J(res,x.status,x.json); }
    if (r === 'network-preview' && req.method === 'GET') return J(res, 200, {schemaVersion:1,canPublish:false,posts:await require('./_network').publicFeed()}, 'public, s-maxage=300');
    if (r === 'network' && req.method === 'GET') { const x = await require('./_network').feed(req,q.get('connected')==='1'); return J(res,x.status,x.json); }
    if (r === 'network/publish' && req.method === 'POST') { const x = await require('./_network').publish(req,bodyOf(req)); return J(res,x.status,x.json); }
    if (r === 'network/test' && req.method === 'POST') { const x = await require('./_network').test(req,bodyOf(req)); return J(res,x.status,x.json); }
    if (r === 'connected' && req.method === 'GET') { const x=await require('./_connected').catalog(req); return J(res,x.status,x.json); }
    if (r === 'connected/schedule' && req.method === 'GET') { const x=await require('./_connected').schedule(req,q.get('lg')); return J(res,x.status,x.json); }
    if (r === 'connected/snapshot' && req.method === 'GET') { const x=await require('./_connected').snapshot(req,q.get('lg'),Number(q.get('week'))); return J(res,x.status,x.json); }
    if (r === 'me' && req.method === 'GET') { const a = await A.authenticate(req); return a ? J(res, 200, A.memberOut(a.member)) : J(res, AUTH.status, AUTH.json); }
    if (r === 'access' && req.method === 'GET') { // guard for every future private route: a session may only touch its own teams
      const a = await A.authenticate(req); if (!a) return J(res, 401, AUTH.json);
      const lg = String(q.get('leagueId') || ''), t = Number(q.get('teamId'));
      return A.canAccess(a.member, lg, t) ? J(res, 200, { ok: true, leagueId: lg, teamId: t }) : J(res, 403, { error: 'forbidden' });
    }
    if (r === 'lineups' && req.method === 'GET') {
      const lg = String(q.get('lg') || ''); if (!M.LGS.includes(lg)) return J(res, 400, { error: 'invalid_league' });
      const c = await M.context({ cachedOnly: true });
      const wr = q.get('week');
      if ((wr == null || wr === '') && !c) return J(res, 503, { error: 'context_unavailable' });
      const week = wr == null || wr === '' ? c.week : Number(wr);
      if (!Number.isInteger(week) || week < 1 || week > 18) return J(res, 400, { error: 'invalid_week', leagueId: lg, week: wr });
      let raw = await M.serveRaw(lg, week, c);
      if (!raw) return J(res, 404, { leagueId: lg, week, available: false, error: 'week_unavailable' });
      const body = Named.build(raw.sv, raw.rec, raw.board, c ? c.season : M.SEASON, await Ids.getMap());
      return J(res, 200, body, raw.sv.stale || raw.sv.partial ? 'no-store' : raw.sv.final ? 'public, s-maxage=3600, max-age=60' : 'public, s-maxage=' + (c && M.isLive(c.board) && week === c.week ? 10 : 60));
    }
    if (r === 'power' && req.method === 'GET') {
      const lg = q.get('lg'); if (!M.LGS.includes(lg)) return J(res, 400, { error: 'invalid_league' });
      const body = await require('./_mpower').get(lg, M);
      return J(res, 200, body, body.stale ? 'no-store' : 'public, s-maxage=60, max-age=0');
    }
    if (r === 'standings' && req.method === 'GET') {
      const lg = q.get('lg'); if (!M.LGS.includes(lg)) return J(res, 400, { error: 'invalid_league' });
      const body = await require('./_mstandings').get(lg, M);
      return J(res, 200, body, body.stale ? 'no-store' : 'public, s-maxage=30, max-age=0');
    }
    if (r === 'media' && req.method === 'GET') {
      const MEDIA = require('./_media.json'), teams = {};
      Object.keys(MEDIA.teams).forEach(lg => { teams[lg] = {}; Object.keys(MEDIA.teams[lg]).forEach(id => { const t = MEDIA.teams[lg][id]; teams[lg][id] = { teamId: Number(id), managerName: t.managerName, logoURL: t.logoURL, ownerPhotoURL: t.ownerPhotoPath ? PUBLIC_BASE + t.ownerPhotoPath + '?v=' + t.ownerPhotoV : null }; }); });
      return J(res, 200, { schemaVersion: 1, version: MEDIA.v, featuredMatchups: require('./_resources.json').tools.featuredMatchups, note: 'ownerPhotoURL is only set for Gentlemen\'s League; other leagues use the Yahoo team logo. URLs are versioned: they change when an image changes.', teams }, 'public, s-maxage=3600, stale-while-revalidate=86400');
    }
    if (['market-movers', 'market'].includes(r) && req.method === 'GET') {
      const c = await M.context({ cachedOnly: true }); if (!c) return J(res, 503, { error: 'context_unavailable' });
      const hj = async u => { const x = await fetch(u, { headers: { 'User-Agent': 'cfn-mobile' }, signal: AbortSignal.timeout(20000) }); if (!x.ok) throw new Error('http ' + x.status); return x.json(); };
      const cached = await M.rget('mm:cache');
      const history = body => require('./_marketweekly').attach(body);
      if (cached && Date.now() - cached.at < 12 * 60 * 60000 && cached.week === c.week && cached.v === 4) return J(res, 200, history(cached.body), 'public, s-maxage=300, stale-while-revalidate=600');
      const m = await MV.compute(new URL(PUBLIC_BASE).host, c.week, hj, undefined, await Ids.getMap(), { allowWithoutBaseline: r === 'market' });
      if (!m.ok || (m.body.stale && cached?.body?.rankings)) { if (cached) return J(res, 200, history(Object.assign({}, cached.body, { stale: true })), 'public, s-maxage=60'); return J(res, 503, { error: m.error || 'unavailable' }); }
      await M.rset('mm:cache', { v: 4, at: Date.now(), week: c.week, key: m.key, body: m.body }, 259200);
      return J(res, 200, history(m.body), 'public, s-maxage=300, stale-while-revalidate=600');
    }
    J(res, 404, { error: 'not_found' });
  } catch (e) { J(res, 503, { error: 'service_unavailable' }); }
};
