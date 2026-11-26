'use strict';
// CFN-authored analysis only. Nothing here enters _news, _network or push jobs.
const M=require('./_m');
const registry=require('./_editorial-identities.json');
const KEY='editorial:player-cards:v1';
const key=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const pos=s=>['DST','D/ST'].includes(String(s).toUpperCase())?'DEF':String(s||'').toUpperCase();
const text=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n&&!/<[^>]+>/.test(v);
const date=s=>typeof s==='string'&&/T.*(?:Z|[+-]\d\d:\d\d)$/.test(s)&&Number.isFinite(Date.parse(s));
function validate(doc,now=Date.now()){
 if(Buffer.byteLength(JSON.stringify(doc)||'')>8000000)throw Error('editorial_too_large');
 if(doc?.schemaVersion!==1||!date(doc.updatedAt)||Date.parse(doc.updatedAt)>now+300000||!Array.isArray(doc.items)||doc.items.length>2000)throw Error('invalid_editorial_document');
 const ids=new Set();
 const items=doc.items.map(x=>{
  if(!text(x.id,160)||ids.has(x.id)||!Number.isSafeInteger(x.revision)||x.revision<1||!['draft','published','retracted'].includes(x.status)||x.placement!=='player_card_only')throw Error('invalid_editorial_item');
  ids.add(x.id);
  if(!text(x.player?.name,80)||!['QB','RB','WR','TE','K','DEF'].includes(pos(x.player?.position)))throw Error('invalid_editorial_player');
  const record=registry[key(x.player.name)+'|'+pos(x.player.position)],providers=x.player.providerIds;
  if(!record||!providers||!Object.keys(providers).length||Object.entries(providers).some(([k,v])=>!['yahoo','sleeper','espn'].includes(k)||typeof v!=='string'||!record[k]||record[k]!==v))throw Error('unverified_editorial_identity');
  if(!text(x.headline,200)||!text(x.body,12000)||!text(x.author,100)||!date(x.publishedAt)||!date(x.updatedAt)||Date.parse(x.updatedAt)<Date.parse(x.publishedAt)||Date.parse(x.updatedAt)>Date.parse(doc.updatedAt)||Date.parse(x.publishedAt)>now+300000)throw Error('invalid_editorial_content');
  if(!Array.isArray(x.sources)||x.sources.length>10||x.sources.some(s=>{try{const u=new URL(s.url);return !text(s.publisher,100)||u.protocol!=='https:'||!!u.username||!!u.password||s.publishedAt!=null&&!date(s.publishedAt)}catch{return true}}))throw Error('invalid_editorial_sources');
  return {id:x.id,revision:x.revision,status:x.status,placement:x.placement,player:{name:x.player.name,position:pos(x.player.position),providerIds:providers},headline:x.headline.trim(),body:x.body.trim(),author:x.author.trim(),publishedAt:x.publishedAt,updatedAt:x.updatedAt,sources:x.sources.map(s=>({publisher:s.publisher,url:s.url,...(s.publishedAt?{publishedAt:s.publishedAt}:{})}))};
 });
 return {schemaVersion:1,updatedAt:doc.updatedAt,items};
}
function assertForward(previous,next){
 if(!previous)return;
 if(Date.parse(next.updatedAt)<Date.parse(previous.updatedAt))throw Error('editorial_snapshot_rollback');
 const old=new Map(previous.items.map(x=>[x.id,x]));
 for(const x of next.items){const p=old.get(x.id);if(p&&JSON.stringify(p.player)!==JSON.stringify(x.player))throw Error('editorial_identity_change');if(p&&(x.revision<p.revision||(x.revision===p.revision&&JSON.stringify(x)!==JSON.stringify(p))))throw Error('editorial_revision_rollback');old.delete(x.id)}
 // Retractions must be explicit and remain in the complete document.
 if(old.size)throw Error('editorial_missing_previous_ids');
}
let memo,pending;
async function feed(){
 if(memo&&Date.now()-memo.at<600000)return memo.body;
 if(pending)return pending;
 pending=(async()=>{
  const raw=await M.read(KEY);
  const doc=raw?validate(raw):{schemaVersion:1,updatedAt:null,items:[]};
  const body={...doc,items:doc.items.filter(x=>x.status==='published'),stale:false};
  memo={at:Date.now(),body};return body;
 })().finally(()=>pending=null);
 // Fail closed on unavailable storage: cached notes are not shown indefinitely
 // after a possible retraction. Existing publisher news is independent.
 return pending;
}
module.exports={KEY,validate,assertForward,feed};
