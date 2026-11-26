'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs');
const D=require('../client/api/_editorialdesk'),E=require('../client/api/_playereditorial'),M=require('../client/api/_m');
const now=Date.parse('2026-11-26T17:00:00Z');
const note={noteId:'test-corumpublished',playerId:'blakecorum',playerName:'Blake Corum',position:'RB',status:'published',revision:1,publishedAt:'2026-11-26T16:00:00Z',updatedAt:'2026-11-26T16:00:00Z',headline:'Original analysis',statLine:'Test stat line',body:'Test analysis only.',sources:[{label:'ESPN',url:'https://www.espn.com/nfl/'}],factCheck:{status:'passed',checkedAt:'2026-11-26T16:00:00Z'}};
const doc={schemaVersion:'1.0.0',generatedAt:'2026-11-26T16:00:00Z',notes:[note]};
const copy=()=>structuredClone(doc);let checks=0;const ok=(x)=>{assert(x);checks++};
const first=D.normalizeDesk(doc,null,now).next;
ok(first.items.length===1&&first.items[0].player.providerIds.espn==='4429096');
ok(first.items[0].body==='Test stat line\n\nTest analysis only.');
for(const change of [x=>x.notes[0].position='QB',x=>x.notes[0].playerName='Kyren Williams',x=>x.notes[0].providerIds={espn:'4430737'},x=>x.notes[0].providerIds={},x=>x.notes[0].factCheck.status='failed',x=>x.notes[0].publishedAt=null,x=>x.notes[0].publishedAt='2027-01-01T00:00:00Z',x=>x.notes[0].body='<script>bad</script>',x=>x.notes[0].sources[0].url='http://unsafe.example',x=>x.notes.push(x.notes[0]),x=>x.notes[0].status='approved',x=>x.schemaVersion=7,x=>x.notes[0].revision=-1]) {const x=copy();change(x);assert.throws(()=>D.normalizeDesk(x,null,now));checks++;}
const sample=copy();sample.notes[0].isSample=true;ok(D.normalizeDesk(sample,null,now).next.items.length===0);
const approvedSetup=copy();approvedSetup.notes[0].noteId='2026-wk12-401873079-blakecorum';ok(D.normalizeDesk(approvedSetup,null,now).next.items.length===1);
const publishedAfterCheck=copy();delete publishedAfterCheck.notes[0].updatedAt;publishedAfterCheck.notes[0].publishedAt='2026-11-26T16:10:00Z';publishedAfterCheck.generatedAt='2026-11-26T16:10:00Z';
ok(D.normalizeDesk(publishedAfterCheck,null,now).next.items[0].updatedAt==='2026-11-26T16:10:00Z');
publishedAfterCheck.notes[0].updatedAt='2026-11-26T15:00:00Z';assert.throws(()=>D.normalizeDesk(publishedAfterCheck,null,now),/invalid_editorial_content/);checks++;
const draft=copy();draft.notes[0].status='draft';draft.notes[0].publishedAt=null;ok(D.normalizeDesk(draft,null,now).next.items.length===0);
const unknown=copy();unknown.notes[0].playerId='new-slug';assert.throws(()=>D.normalizeDesk(unknown,null,now),/provider_id_required/);checks++;
unknown.notes[0].providerIds={espn:'4429096'};ok(D.normalizeDesk(unknown,null,now).next.items.length===1);
const rotated={...doc,generatedAt:'2026-11-26T16:10:00Z',notes:[]};ok(D.normalizeDesk(rotated,first,now).next.items.length===1);
const correction=copy();correction.generatedAt='2026-11-26T16:10:00Z';correction.notes[0].updatedAt=correction.generatedAt;correction.notes[0].body='Corrected.';
assert.throws(()=>D.normalizeDesk(correction,first,now),/revision_rollback/);checks++;
correction.notes[0].revision=2;ok(D.normalizeDesk(correction,first,now).next.items[0].revision===2);
const moved=structuredClone(correction);moved.notes[0].playerId='kyrenwilliams';moved.notes[0].playerName='Kyren Williams';assert.throws(()=>D.normalizeDesk(moved,first,now),/identity_change/);checks++;
const retracted=structuredClone(correction);retracted.notes[0].status='retracted';ok(D.normalizeDesk(retracted,first,now).next.items[0].status==='retracted');
assert.throws(()=>D.normalizeDesk(draft,first,now),/explicit_retraction/);checks++;
assert.throws(()=>D.normalizeDesk({...doc,generatedAt:'2026-11-25T12:00:00Z'},first,now),/rollback/);checks++;
(async()=>{
 const original=M.command;const store=new Map();let writes=0;
 M.command=async c=>{if(c[0]==='GET')return store.get(c[1])||null;if(c[0]==='EVAL'){if((store.get(c[3])||'')!==c[5]||(store.get(c[4])||'')!==c[6])return 0;store.set(c[3],c[7]);store.set(c[4],c[8]);writes++;return 1;}throw Error('unexpected command '+c[0]);};
 try {
  const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{etag:'"v1"'}});
  const result=await D.synchronize({now,fetcher:async(url,opts)=>{ok(url===D.SOURCE&&opts.redirect==='error');return response(doc);}});
  ok(result.published===1&&writes===1);
  await D.synchronize({now,fetcher:async(url,opts)=>{ok(opts.headers['If-None-Match']==='"v1"');return new Response(null,{status:304});}});ok(writes===1);
  const oldState=JSON.parse(store.get(D.STATE));delete oldState.importerVersion;store.set(D.STATE,JSON.stringify(oldState));
  await D.synchronize({now,fetcher:async(url,opts)=>{ok(!opts.headers['If-None-Match']&&!opts.headers['If-Modified-Since']);return response(doc);}});
  ok(writes===2&&JSON.parse(store.get(D.STATE)).importerVersion===D.IMPORTER_VERSION);writes=1;
  for(const fetcher of [async()=>response({},503),async()=>{throw Error('offline')},async()=>new Response('broken'),async()=>new Response('{}',{headers:{'content-length':'9000000'}}),async()=>response({...doc,generatedAt:'2026-11-25T12:00:00Z'}),async()=>response({...doc,notes:[]})]){await assert.rejects(D.synchronize({now,fetcher}));checks++;ok(writes===1);}
  await D.synchronize({now,fetcher:async()=>response(rotated)});ok(JSON.parse(store.get(E.KEY)).items.length===1);
  M.command=async c=>c[0]==='GET'?(store.get(c[1])||null):0;
  await assert.rejects(D.synchronize({now,fetcher:async()=>response({...rotated,generatedAt:'2026-11-26T16:20:00Z'})}),/concurrent_change/);checks++;
 }finally{M.command=original;}
 for(const f of ['_news.js','_network.js','_mpush.js'])ok(!fs.readFileSync('client/api/'+f,'utf8').includes('_editorialdesk'));
 const config=JSON.parse(fs.readFileSync('client/vercel.json'));ok(config.crons.some(c=>c.path==='/api/mobile/cron-editorial'&&c.schedule==='*/10 * * * *'));
 console.log(checks+' desk checks passed: identities, samples/drafts, approval, revisions, immutable player mapping, rolling history, retractions, unchanged fetches, bounded responses, source failure, concurrency and feed isolation.');
})().catch(e=>{console.error(e);process.exitCode=1});
