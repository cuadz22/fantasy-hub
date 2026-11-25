'use strict';
const H=require('./mobile_harness'),{ok,M}=H,W=require('../client/api/_waivers'),T=require('../client/api/_connectedUpdates'),N=require('../client/api/_network'),E=require('../client/api/_networkevents'),R=require('../client/api/_resources.json'),fs=require('fs');
const now=Date.parse('2026-11-25T11:21:00Z'),load=async lg=>fs.readFileSync(__dirname+'/fixtures/waivers/'+lg+'-2026-11-25.html','utf8');
async function rejects(fn,label){let failed=false;try{await fn()}catch{failed=true}ok(failed,label)}
(async()=>{
 for(const [time,expected] of [['2026-11-25T10:59Z',false],['2026-11-25T11:00Z',true],['2026-11-25T17:00Z',true],['2026-11-25T18:00Z',false],['2026-11-26T11:00Z',true],['2026-11-26T12:00Z',false],['2026-10-14T10:00Z',true],['2026-10-14T16:00Z',true],['2026-10-14T17:00Z',false]])ok(W.due(Date.parse(time))===expected,'Eastern/DST schedule '+time);
 const expected={gl:9,bh:2,rb:6,sts:4},before=new Map(H.store);
 for(const lg of M.LGS){
  const r=await W.collect(lg,12,{now,load});ok(r.items.length===expected[lg],lg+' verified claims');
  ok(r.items.every(i=>i.id.startsWith(lg+':claim:')&&i.teamId>=1&&i.teamId<=12),lg+' isolated league and team ids');
  ok(r.items.every(i=>i.publishedAt.startsWith('2026-11-25')),lg+' exclude past week');
  ok(!r.items.some(i=>i.player==='Browns'),lg+' free agents excluded');
  await W.refreshLeague(lg,12,{now,load});const saved=await M.read(W.key(lg));
  ok(saved.rows.every(r=>r.week===12&&r.suppressNotification),lg+' recovery is silent and correctly weeked');
  await W.refreshLeague(lg,12,{now:now+3600000,load});ok((await M.read(W.key(lg))).rows.length===expected[lg],lg+' no duplicates after rescan');
  const exact=JSON.stringify(await M.read(W.key(lg)));
  await rejects(()=>W.refreshLeague(lg,12,{now:now+7200000,load:()=>{throw Error('provider down')}}),lg+' source error reported');
  ok(JSON.stringify(await M.read(W.key(lg)))===exact,lg+' failure preserves report AND freshness');
 }
 const gl=await W.collect('gl',12,{now,load});
 ok(gl.items.find(i=>i.player==='Drew Stevens').teamId===1&&gl.items.find(i=>i.player==='Drew Stevens').amount===0,'zero dollar kicker correctly assigned');
 ok(gl.items.find(i=>i.player==='Dalton Kincaid').amount===25,'winning FAB bid exact');
 ok(gl.items.find(i=>i.player==='Commanders').asset.photoURL.includes('wsh.png'),'defense logo');
 await rejects(()=>W.collect('gl',11,{now,load}),'wrong calendar cannot mislabel week');
 await rejects(()=>W.collect('gl',12,{now,load:()=>load('rb')}),'cross league page rejected');
 await rejects(()=>W.collect('gl',12,{now,load:async()=>'<html>Sign in</html>'}),'sign-in page rejected');
 await rejects(()=>W.collect('gl',12,{now,load:async()=> (await load('gl')).replaceAll('Nov 25','Nov 26')}),'future transaction rejected');
 const many=(await load('gl')).replaceAll(/Nov \d+/g,'Nov 25');
 await rejects(()=>W.collect('gl',12,{now,load:async()=>many}),'page cap cannot silently publish partial report');
 const saved=await M.read(W.key('gl')),duplicate={...saved.rows[0],bids:[...saved.rows[0].bids,{manager:'Other',amount:0,won:false}]};
 const combined=W.overlay([duplicate],saved);ok(combined.length===9&&combined.find(r=>r.id===duplicate.id).bids.length===2,'preserve older losing-bid details without duplicating');
 const resource=await require('../client/api/_leagueupdates').resources();
 for(const lg of M.LGS)ok(resource.tools.waivers[lg].filter(r=>r.week===12).length===expected[lg],lg+' resource consumers including older apps');
 const posts=N.staticPosts(now,resource).filter(p=>p.kind==='waivers'&&p.week===12);
 ok(posts.length===4&&new Set(posts.map(p=>p.id)).size===4,'one report per league in feed');
 ok(posts.every(p=>p.notify===false&&p.dateOnly===false),'honest source time and silent recovery');
 await E.observe([], {now});ok((await E.observe(posts,{now})).length===0,'backfill sends no alerts');
 const published=posts.map(p=>({...p,id:p.id.replace(':12',':13'),notify:undefined}));
 ok((await E.observe(published,{now})).length===4,'future editions eligible once');
 ok((await E.observe(published,{now})).length===4,'repeated observation never queues duplicates');
 const publicPosts=await N.publicFeed();ok(publicPosts.filter(p=>p.kind==='waivers'&&p.week===12).length===4,'website public feed includes all editions');
 const member=H.A.MEMBERS.find(m=>m.teams.gl===1),token='cfn_'+'waivers'.padEnd(40,'x');await M.write('ms:'+M.sha(token),{e:member.h,x:Date.now()+600000});
 const feed=await N.feed({headers:{authorization:'Bearer '+token}});
 ok(feed.status===200&&feed.json.posts.filter(p=>p.kind==='waivers'&&p.week===12).length===4,'signed-in old/new app feed sees reports');
 ok((await H.call(H.mobile,'/?r=cron-waivers')).s===401,'scheduled scan requires cron authorization');
 ok([...H.store.keys()].every(k=>/^(waiver-reports:|network:v1:automatic-publications|ms:)/.test(k)||before.has(k)),'no score, roster, calendar, standings or touchdown keys written');
 // Exercise the actual next-week collector, rather than editing notification flags.
 const nextNow=Date.parse('2026-12-02T11:21:00Z');
 const nextLoad=async lg=>(await load(lg)).replaceAll('Nov 25','Dec 2');
 const nextResource=JSON.parse(JSON.stringify(R));
 for(const lg of M.LGS){
  await W.refreshLeague(lg,13,{now:nextNow,load:nextLoad});
  const next=await M.read(W.key(lg));
  ok(next.rows.filter(r=>r.week===13).length===expected[lg]&&next.rows.filter(r=>r.week===13).every(r=>!r.suppressNotification),lg+' actual next-week scan clears recovery-only silence');
  ok(next.rows.filter(r=>r.week===12).every(r=>r.suppressNotification),lg+' historical recovery stays silent');
  nextResource.tools.waivers[lg]=W.overlay(R.tools.waivers[lg],next);
 }
 const nextPosts=N.staticPosts(nextNow,nextResource).filter(p=>p.kind==='waivers'&&p.week===13);
 ok(nextPosts.length===4&&nextPosts.every(p=>p.notify!==false),'new reports are notification-eligible end to end');
 await M.command(['DEL','network:v1:automatic-publications']);
 await E.observe(posts,{now:nextNow-60000});
 const fresh=await E.observe(nextPosts,{now:nextNow});
 ok(fresh.length===4,'newly scanned editions queue one alert per league');
 const active=H.A.MEMBERS.find(m=>N.eligible(m.h)),session='waiver-next-week-test';
 await M.write('ms:'+session,{e:active.h,x:nextNow+86400000});
 const devices=['phone','ipad'].map(id=>({id:'waiver-'+id,member:active.h,session,token:'test-token',environment:'production',announcements:true,announcementsEnabledAt:nextNow-60000}));
 for(const d of devices)await M.write('push:v1:device:'+d.id,d);
 let sent=0;const options={now:nextNow,sender:async()=>{sent++;return {state:'sent'}}};
 for(const p of fresh)for(const d of devices)await Promise.all([N.deliver(p,d,options),N.deliver(p,d,options)]);
 ok(sent===8,'four reports deliver exactly once to each enabled phone and iPad');
 for(const p of await E.observe(nextPosts,{now:nextNow+60000}))for(const d of devices)await N.deliver(p,d,options);
 ok(sent===8,'repeat scan and cron cannot duplicate waiver notifications');
 H.done();
})().catch(e=>{console.error(e);process.exit(1)});
