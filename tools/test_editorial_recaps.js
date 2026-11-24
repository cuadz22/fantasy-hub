'use strict';
const assert=require('node:assert/strict'),R=require('../client/api/_recaps');
const clone=x=>JSON.parse(JSON.stringify(x));
const source=lg=>require('./recaps/fixtures/final/'+lg+'.json'),table=lg=>require('./recaps/fixtures/standings/'+lg+'.json');
const docs={};
for(const lg of ['gl','bh','rb','sts']){
 const doc=R.derive(source(lg),table(lg));docs[lg]=doc;
 assert.equal(doc.matches.length,6);assert.equal(doc.teamOfWeek.length,8);assert.equal(doc.standings.length,12);
 for(const [pos,n] of Object.entries({QB:1,RB:2,WR:4,TE:1}))assert.equal(doc.teamOfWeek.filter(p=>p.position===pos).length,n);
 for(const p of doc.teamOfWeek){const original=source(lg).matchups.flatMap(m=>m.teams).find(t=>t.teamId===p.teamId).lineup.find(x=>x.playerId===p.id);assert(original);assert(!['BN','IR'].includes(original.slot));assert.equal(original.position,p.position);}
 assert.equal(doc.sourceRevision,R.derive(source(lg),table(lg)).sourceRevision);
}
assert(docs.bh.standingsContext.includes('top six'));assert(!docs.gl.standingsContext.includes('qualify'));assert(docs.sts.standings.every(t=>typeof t.customPoints==='number'));
for(const mutate of [f=>f.freshness.final=false,f=>f.freshness.partial=true,f=>f.season--,f=>f.matchups.pop(),f=>f.matchups[0].teams[0].pointsToDate++,f=>f.matchups[0].teams[0].lineup[0].points=null,f=>f.matchups[0].teams[0].lineup[0].position='UNKNOWN']){const f=clone(source('gl'));mutate(f);assert.throws(()=>R.derive(f,table('gl')));}
const wrong=clone(table('gl'));wrong.throughWeek--;assert.throws(()=>R.derive(source('gl'),wrong));
const bench=clone(source('gl'));bench.matchups[0].teams[0].lineup.push({slot:'BN',position:'QB',name:'Benched high scorer',points:999,playerId:'bench'});assert(!R.derive(bench,table('gl')).teamOfWeek.some(p=>p.id==='bench'));
// Entire transaction suite is in memory: cannot touch production or send notifications.
const db=new Map(),writes=[],locks=new Set();const store={read:async k=>clone(db.get(k)??null),write:async(k,v)=>{assert(k.startsWith('recaps:v1:'));writes.push(k);db.set(k,clone(v));},lock:async k=>{if(locks.has(k))return null;locks.add(k);return 'token'},unlock:async k=>locks.delete(k),context:async()=>({season:2026,week:12,stale:false})};
(async()=>{
 const collector=async lg=>clone(docs[lg]);
 const auth=require('../client/api/_mauth'),original=auth.authenticate;
 auth.authenticate=async()=>null;
 for(const action of ['recaps/drafts','recaps/prepare','recaps/edit','recaps/publish'])assert.equal((await R.route({method:action==='recaps/drafts'?'GET':'POST'},action,new URLSearchParams(),{})).status,403);
 auth.authenticate=async()=>({member:{h:'not-a-publisher',teams:{gl:1}}});
 assert.equal((await R.route({method:'GET'},'recaps/drafts',new URLSearchParams(),{})).status,403);
 auth.authenticate=original;
 await R.prepare('gl',11,{store,collector});assert.equal((await R.list(false,store)).length,0);
 let d=(await R.list(true,store))[0];assert.equal(await R.detail(d.id,false,store),null);
 assert.equal((await R.prepare('gl',11,{store,collector})).state,'unchanged');
 await assert.rejects(()=>R.publish({id:d.id,revision:d.revision,notify:false},{store,collector}),/review_required/);
 await assert.rejects(()=>R.publish({id:d.id,revision:'old',notify:false,reviewed:true},{store,collector}),/revision_conflict/);
 const change=async()=>({...d,sourceRevision:'new-data'});
 await assert.rejects(()=>R.publish({id:d.id,revision:d.revision,notify:false,reviewed:true},{store,collector:change}),/results_changed/);
 const first=await R.publish({id:d.id,revision:d.revision,notify:false,reviewed:true},{store,collector});
 assert.equal((await R.list(false,store)).length,1);assert.equal((await R.detail(d.id,false,store)).status,'published');
 assert((await R.publish({id:d.id,revision:d.revision,notify:true,reviewed:true},{store,collector})).duplicate);
 const edited=await R.edit({...d,intro:'Reviewed copy.'},{store});
 assert.notEqual((await R.detail(d.id,false,store)).intro,edited.intro);
 await R.publish({id:edited.id,revision:edited.revision,notify:true,reviewed:true},{store,collector});
 const p=(await R.list(false,store))[0];assert(p.body.startsWith('Your Week 11 recap is ready.'));assert.equal(p.recapPreview.total,8);assert.deepEqual(p.recapPreview.players.map(x=>x.position),['QB','RB','WR']);assert(p.recapPreview.players.every(x=>docs.gl.teamOfWeek.some(t=>t.name===x.name&&t.photoURL===x.photoURL)));assert.equal(p.publishedAt,first.publishedAt);assert.equal(p.notify,false);assert.equal((await R.list(false,store)).length,1);
 for(const time of ['2026-11-24T10:59:00Z','2026-11-25T12:00:00Z','2026-07-07T09:59:00Z'])assert.equal((await R.scheduled(new Date(time),store)).skipped,'outside_recap_window');
 const tick=await R.scheduled(new Date('2026-11-24T12:00:00Z'),store,{collector:async(lg)=>{if(lg==='bh')throw Error('missing_results');return collector(lg);}});
 assert.equal(tick.id,'recap:2026:rb:11');assert.equal(tick.pending[0].leagueId,'bh');assert.equal((await R.list(false,store)).length,1);
 assert(writes.every(k=>k.startsWith('recaps:v1:')));console.log('Recaps: four real leagues, totals, positions, benches, standings, review gate, immutable public revisions, source changes, duplicate publication and Eastern schedule passed.');
})().catch(e=>{console.error(e);process.exit(1)});
// One story per match, with every award attached to its existing result. Copy
// uses validated final totals and explicit playoff rules, never probabilities.
for(const [lg,d] of Object.entries(docs)){
 assert.equal(new Set(d.matches.map(m=>m.id)).size,6);
 for(const a of d.awards)for(const id of a.matchupIds)assert.equal(d.matches.filter(m=>m.id===id).length,1);
 assert(d.intro.includes(d.standings[0].name));
 assert(!/chance|probability|%/.test(d.intro+d.matches.map(m=>m.body).join('')));
 assert(!d.matches.some(m=>m.body.includes('undefined')));
 if(['gl','sts'].includes(lg))assert(!d.intro.includes('playoff places'));
 else assert(d.intro.includes('six playoff places'));
}
