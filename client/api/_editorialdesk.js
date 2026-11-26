'use strict';
// Fixed, public, owner-supplied source. Never executed and never used by general news/push.
const crypto = require('node:crypto');
const E = require('./_playereditorial'), M = require('./_m');
const registry = require('./_editorial-identities.json');
const SOURCE = 'https://gist.githubusercontent.com/cuadz22/7ea9626d0b3bcf0248ecc432536cb863/raw/cfn-desk-feed.json';
const STATE = 'editorial:desk-sync:v1';
// Re-read an unchanged source once when normalization rules change.
const IMPORTER_VERSION = 2;
// Explicitly reviewed producer IDs, not a fuzzy name matcher. New players supply providerIds.
const aliases = {
 kyrenwilliams: ['Kyren Williams','RB','4430737'], konatamumpfield: ['Konata Mumpfield','WR','4710855'],
 jordanlove: ['Jordan Love','QB','4036378'], kalebjohnson: ['Kaleb Johnson','RB','4819231'],
 blakecorum: ['Blake Corum','RB','4429096'], christianwatson: ['Christian Watson','WR','4248528'],
 matthewgolden: ['Matthew Golden','WR','4701936'], tuckerkraft: ['Tucker Kraft','TE','4572680']
};
// Jose approved the eight initial desk notes for readers on November 26.
// Future samples must remain isSample:true or draft; publication is driven by the desk.
const key = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const validTime = (s, now) => typeof s === 'string' && /T.*(?:Z|[+-]\d\d:\d\d)$/.test(s) && Number.isFinite(Date.parse(s)) && Date.parse(s) <= now + 300000;
const safeText = (s,max) => typeof s === 'string' && s.trim().length > 0 && s.length <= max && !/<[^>]+>/.test(s);
function identity(n) {
 const position = ['DST','D/ST'].includes(n.position) ? 'DEF' : n.position;
 const record = registry[key(n.playerName)+'|'+position];
 if (!record) throw Error('desk_unknown_player');
 let providerIds = n.providerIds;
 if (providerIds == null) {
  const a = aliases[n.playerId];
  if (!a || a[0] !== n.playerName || a[1] !== position || record.espn !== a[2]) throw Error('desk_provider_id_required');
  providerIds = {espn:a[2]};
 }
 return {name:n.playerName, position, providerIds};
}
function normalizeDesk(doc, previous, now=Date.now()) {
 if (Buffer.byteLength(JSON.stringify(doc)||'')>8000000 || doc?.schemaVersion !== '1.0.0' || !validTime(doc.generatedAt,now) || !Array.isArray(doc.notes) || doc.notes.length>2000) throw Error('invalid_desk_document');
 if (previous && Date.parse(doc.generatedAt)<Date.parse(previous.updatedAt)) throw Error('desk_snapshot_rollback');
 const items = new Map((previous?.items || []).map(x=>[x.id,x]));
 const seen = new Set(); let drafts=0,samples=0;
 for (const n of doc.notes) {
  if (!safeText(n.noteId,140) || seen.has(n.noteId) || !['draft','published','retracted'].includes(n.status)) throw Error('invalid_desk_note');
  seen.add(n.noteId);
  if (n.isSample === true) { samples++; continue; }
  const id = 'desk:'+n.noteId, old = items.get(id);
  if (n.status === 'draft') {
   if (old?.status === 'published') throw Error('desk_explicit_retraction_required');
   drafts++; continue;
  }
  // A note may be fact-checked before it is published. If the producer omits
  // updatedAt on its first publication, use the later real source timestamp.
  const revision = n.revision ?? 1, updatedAt = n.updatedAt ||
   (Date.parse(n.publishedAt) > Date.parse(n.factCheck?.checkedAt) ? n.publishedAt : n.factCheck?.checkedAt);
  if (!Number.isSafeInteger(revision) || revision<1 || !validTime(updatedAt,now) || Date.parse(updatedAt)>Date.parse(doc.generatedAt)) throw Error('invalid_desk_revision');
  if (n.status === 'retracted') {
   if (!old) throw Error('desk_unknown_retraction');
   items.set(id,{...old,status:'retracted',revision,updatedAt}); continue;
  }
  if (n.factCheck?.status !== 'passed' || !validTime(n.factCheck.checkedAt,now) || Date.parse(n.factCheck.checkedAt)>Date.parse(doc.generatedAt) || !validTime(n.publishedAt,now)) throw Error('desk_not_approved');
  if (!safeText(n.headline,200) || !safeText(n.body,12000) || (n.statLine != null && !safeText(n.statLine,300)) || !Array.isArray(n.sources) || !n.sources.length || n.sources.length>10) throw Error('invalid_desk_content');
  const player = identity(n);
  const sources = n.sources.map(s=>({publisher:String(s.publisher || s.label || '').slice(0,100),url:s.url,...(s.publishedAt?{publishedAt:s.publishedAt}:{})}));
  items.set(id,{id,revision,status:'published',placement:'player_card_only',player,headline:n.headline,body:[n.statLine,n.body].filter(Boolean).join('\n\n'),author:'CFN Desk',publishedAt:n.publishedAt,updatedAt,sources});
 }
 const next = E.validate({schemaVersion:1,updatedAt:doc.generatedAt,items:[...items.values()]},now);
 E.assertForward(previous,next);
 return {next,drafts,samples};
}
async function boundedJSON(response) {
 if (Number(response.headers.get('content-length'))>8000000) throw Error('desk_response_too_large');
 const reader=response.body?.getReader(); if(!reader) throw Error('desk_empty_response');
 let bytes=0; const chunks=[];
 try { while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>8000000)throw Error('desk_response_too_large');chunks.push(Buffer.from(value));} }
 catch(e){await reader.cancel().catch(()=>{});throw e;}
 try {return JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {throw Error('desk_invalid_json');}
}
async function synchronize({fetcher=fetch,now=Date.now()}={}) {
 const stateRaw=await M.command(['GET',STATE]);
 const state=stateRaw?JSON.parse(stateRaw):null;
 const before=await M.command(['GET',E.KEY]);
 const previous=before?E.validate(JSON.parse(before),now):null;
 const headers={Accept:'application/json', 'User-Agent':'CFN-Editorial/1.0'};
 if (state?.importerVersion===IMPORTER_VERSION && state.etag) headers['If-None-Match']=state.etag;
 if (state?.importerVersion===IMPORTER_VERSION && state.lastModified) headers['If-Modified-Since']=state.lastModified;
 const response=await fetcher(SOURCE,{headers,redirect:'error',signal:AbortSignal.timeout(12000)});
 if (response.status===304) {if(!state || !before)throw Error('desk_unexpected_not_modified');return {unchanged:true,published:previous.items.filter(x=>x.status==='published').length};}
 if (!response.ok) throw Error('desk_source_http_'+response.status);
 const doc=await boundedJSON(response);
 if (state && Date.parse(doc.generatedAt)<Date.parse(state.generatedAt)) throw Error('desk_source_rollback');
 const hash=crypto.createHash('sha256').update(JSON.stringify(doc)).digest('hex');
 if(state?.generatedAt===doc.generatedAt && state.hash!==hash) throw Error('desk_timestamp_not_advanced');
 const {next,drafts,samples}=normalizeDesk(doc,previous,now);
 const nextState={importerVersion:IMPORTER_VERSION,generatedAt:doc.generatedAt,hash,etag:response.headers.get('etag'),lastModified:response.headers.get('last-modified')};
 const script="if (redis.call('GET',KEYS[1]) or '')~=ARGV[1] or (redis.call('GET',KEYS[2]) or '')~=ARGV[2] then return 0 end; redis.call('SET',KEYS[1],ARGV[3]); redis.call('SET',KEYS[2],ARGV[4]); return 1";
 const result=await M.command(['EVAL',script,2,E.KEY,STATE,before||'',stateRaw||'',JSON.stringify(next),JSON.stringify(nextState)]);
 if(result!==1)throw Error('desk_concurrent_change');
 return {published:next.items.filter(x=>x.status==='published').length,drafts,samples,sourceUpdatedAt:doc.generatedAt};
}
module.exports={SOURCE,STATE,IMPORTER_VERSION,normalizeDesk,synchronize};
