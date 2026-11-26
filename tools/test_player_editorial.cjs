'use strict';
const assert=require('node:assert/strict'),E=require('../client/api/_playereditorial'),M=require('../client/api/_m');
const now=Date.parse('2026-11-26T15:00:00Z');
const item={id:'test:burrow',revision:1,status:'published',placement:'player_card_only',player:{name:'Joe Burrow',position:'QB',providerIds:{yahoo:'32671'}},headline:'Test analysis',body:'Original CFN analysis.\nSecond paragraph.',publishedAt:'2026-11-26T14:00:00Z',updatedAt:'2026-11-26T14:00:00Z',author:'CFN Editorial',sources:[{publisher:'Example',url:'https://example.com/source'}]};
const registry=require('../client/api/_editorial-identities.json');item.player.providerIds=registry['joeburrow|QB'];
const doc={schemaVersion:1,updatedAt:'2026-11-26T14:00:00Z',items:[item]};
const copy=()=>JSON.parse(JSON.stringify(doc));
assert.equal(E.validate(doc,now).items.length,1);
for(const mutate of [x=>x.items[0].player.position='K',x=>x.items[0].player.name='Joe Mixon',x=>x.items[0].player.providerIds.yahoo='999',x=>x.items[0].placement='network',x=>x.items[0].body='<script>x</script>',x=>x.items[0].sources[0].url='javascript:alert(1)',x=>x.items[0].updatedAt='2027-01-01T00:00:00Z',x=>x.items.push(x.items[0]),x=>x.items[0].revision=0,x=>x.schemaVersion=2]){
 const x=copy();mutate(x);assert.throws(()=>E.validate(x,now));
}
const prior=E.validate(doc,now),next=copy();next.items[0].revision=2;next.items[0].status='retracted';
E.assertForward(prior,E.validate(next,now));
assert.throws(()=>E.assertForward(prior,E.validate({...doc,items:[]},now)),/missing_previous/);
const bad=copy();bad.items[0].body='Changed without revision';assert.throws(()=>E.assertForward(prior,E.validate(bad,now)),/revision/);
(async()=>{
 const read=M.read;try{
  M.read=async()=>{throw Error('offline')};await assert.rejects(E.feed(),/offline/);
  const x=copy();x.items.push({...item,id:'draft',status:'draft'},{...item,id:'retracted',status:'retracted'});M.read=async()=>x;
  const feed=await E.feed();assert.equal(feed.items.length,1);assert.equal(feed.items[0].status,'published');
 }finally{M.read=read}
 assert(!require('fs').readFileSync('client/api/_news.js','utf8').includes('_playereditorial'));
 assert(!require('fs').readFileSync('client/api/_network.js','utf8').includes('_playereditorial'));
 console.log('Editorial: verified identities, position isolation, schema, safe sources, content, revisions, retractions, drafts, outages and news/push separation passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
