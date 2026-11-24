'use strict';
// Network updates are independent of calendar, scoring, and official standings.
const M=require('./_m'), A=require('./_mauth'), crypto=require('node:crypto');
const RES=require('./_resources.json'), MEDIA=require('./_media.json');
const CONFIG=require('./_networkrollout.json');
const KEY='network:v1:posts', names={gl:'Gentlemen’s League',bh:'Beaners & Husseins',rb:'Rebirth',sts:'Shoot the Shits'};
const eligible=h=>CONFIG.memberHashes.includes(h);
const admin=h=>CONFIG.publishers.includes(h);
const logo=lg=>'https://cuadzfantasynetwork.com/notification-media/'+lg+'-v1.png';
const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
function dated(value,season){
 if(typeof value!=='string')return null;
 const s=/^\d{4}-\d{2}-\d{2}T/.test(value)?value:(/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T17:00:00Z':String(value)+' '+season+' 17:00:00 GMT');
 const n=Date.parse(s);return Number.isFinite(n)?new Date(n).toISOString():null;
}
function side(lg,s){
 const candidates=(RES.tools.teams[lg]||[]).filter(t=>norm(t.team)===norm(s.team)||norm(t.mgr)===norm(s.mgr));
 const id=candidates.length===1?candidates[0].id:null;
 return {teamId:id,name:s.team,logoURL:id?MEDIA.teams?.[lg]?.[id]?.logoURL||null:null,owner:s.mgr,players:(s.gets||[]).filter(x=>typeof x==='string'),assets:(s.gets||[]).filter(x=>typeof x==='string').map(n=>require('./_feedmedia').asset(n))};
}
function staticPosts(now=Date.now(),resources=RES){
 const out=[];
 for(const lg of M.LGS){
  for(const t of resources.tools.trades[lg]||[]){
   if(!t.a?.team||!t.b?.team)continue;
   const at=dated(t.date,RES.season);if(!at||Date.parse(at)>now)continue;
   const sides=[side(lg,t.a),side(lg,t.b)];
   const id='trade:'+lg+':'+M.sha(JSON.stringify([at,sides.map(x=>[x.name,x.players])])).slice(0,20);
   out.push({id,kind:'trade',leagueId:lg,title:'Completed trade',body:sides.map(s=>s.name+' receives '+s.players.join(', ')).join('\n'),publishedAt:at,dateOnly:true,sides,url:'https://cuadzfantasynetwork.com/share/league-'+lg+'-trades.html',logoURL:logo(lg)});
  }
  const groups=new Map();
  for(const r of resources.tools.waivers[lg]||[]){if(!Number.isInteger(r.week)||r.week<1||r.week>18)continue;const rows=groups.get(r.week)||[];rows.push(r);groups.set(r.week,rows);}
  for(const [week,rows] of groups){
   const at=rows.map(x=>dated(x.date,RES.season)).filter(Boolean).sort().at(-1);if(!at||Date.parse(at)>now)continue;
   const claims=rows.map(r=>({player:r.player,team:r.winner,amount:r.bids?.find(b=>b.won)?.amount??null,asset:require('./_feedmedia').asset(r.player,r.position,r.nflTeam)}));
   out.push({id:`waivers:${RES.season}:${lg}:${week}`,kind:'waivers',leagueId:lg,week,title:`Week ${week} waiver report`,body:`${claims.length} successful claims · one weekly report`,publishedAt:at,dateOnly:true,claims,url:'https://cuadzfantasynetwork.com/share/league-'+lg+'-waivers.html',logoURL:logo(lg)});
  }
 }
 // Published edition only. Future recaps enter through the commissioner publisher.
 out.push({id:'recap:2026:10',kind:'recap',leagueId:'network',week:10,title:'Week 10 Final & Week 11 Early Look',body:'Final scores, recaps and win-odds swings across CFN’s four leagues, plus an early look at Week 11.',publishedAt:'2026-11-17T12:00:00Z',dateOnly:true,url:'https://cuadzfantasynetwork.com/l/week-10-recap.html'});
 return out.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||a.id.localeCompare(b.id));
}
let cache=null,cacheAt=0,pending=null;
async function stored(){
 if(cache&&Date.now()-cacheAt<30000)return cache;
 if(pending)return pending;
 pending=(async()=>{const rows=await M.read(KEY);cache=Array.isArray(rows)?rows:[];cacheAt=Date.now();return cache;})().finally(()=>{pending=null});
 return pending;
}
function publicPost(p){const {audience,notify,createdBy,deliveryDeviceID,...out}=p;return out;}
function visible(p,member,now){return (p.leagueId==='network'||Number.isInteger(member.teams[p.leagueId]))&&(!p.audience||p.audience===member.h)&&Date.parse(p.publishedAt)<=now&&(!p.expiresAt||Date.parse(p.expiresAt)>now);}
// A recap-store outage must not take trades, login or touchdown delivery down.
async function recapPosts(){try{return await require('./_recaps').list()}catch{return []}}
async function publicFeed(){return [...staticPosts(Date.now(),await require('./_leagueupdates').resources()),...await recapPosts()].map(publicPost).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));}
async function feed(req,includeConnected=false){
 const a=await A.authenticate(req);if(!a)return {status:401,json:{error:'unauthorized'}};
 if(!eligible(a.member.h))return {status:403,json:{error:'private_rollout'}};
 const now=Date.now(),posts=[...staticPosts(now,await require('./_leagueupdates').resources()),...await stored(),...await recapPosts()].filter(p=>visible(p,a.member,now)).map(publicPost).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||a.id.localeCompare(b.id));
 // Explicit client opt-in preserves old builds. These imports never enter the
 // announcement publisher or touchdown-delivery pipeline.
 if(includeConnected){posts.push(...await require('./_connectedUpdates').memberPosts(a.member));posts.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||a.id.localeCompare(b.id));}
 return {status:200,json:{schemaVersion:1,canPublish:admin(a.member.h),posts,checkedAt:new Date(now).toISOString()}};
}
function validate(body,member,now=Date.now()){
 if(!/^[a-f0-9-]{36}$/i.test(body.id||'')||!['announcement','recap'].includes(body.kind)||!M.LGS.includes(body.leagueId)||!Number.isInteger(member.teams[body.leagueId]))throw Error('invalid_post');
 const title=String(body.title||'').trim(),text=String(body.body||'').trim();
 if(!title||title.length>100||!text||text.length>1600||typeof body.notify!=='boolean')throw Error('invalid_post');
 const week=body.week==null?undefined:Number(body.week);if(week!=null&&(!Number.isInteger(week)||week<1||week>18))throw Error('invalid_week');
 const url=body.url||undefined;
 if(url){let u;try{u=new URL(url)}catch{throw Error('invalid_url')}if(u.origin!=='https://cuadzfantasynetwork.com'||u.username||u.password)throw Error('invalid_url');}
 return {id:body.id.toLowerCase(),kind:body.kind,leagueId:body.leagueId,title,body:text,week,url,publishedAt:new Date(now).toISOString(),expiresAt:new Date(now+30*86400000).toISOString(),notify:body.notify,createdBy:member.h,logoURL:logo(body.leagueId)};
}
async function save(post){
 const lock=await M.lock(KEY+':lock',15);if(!lock)return {status:409,json:{error:'busy'}};
 try{
  const rows=await M.read(KEY)||[],existing=rows.find(p=>p.id===post.id);
  if(existing)return {status:200,json:{post:publicPost(existing),duplicate:true}};
  const kept=rows.filter(p=>!p.expiresAt||Date.parse(p.expiresAt)>Date.now()).slice(-199);
  kept.push(post);await M.write(KEY,kept,180*86400);cache=kept;cacheAt=Date.now();
  return {status:201,json:{post:publicPost(post)}};
 }finally{await M.unlock(KEY+':lock',lock);}
}
async function publish(req,body){
 const a=await A.authenticate(req);if(!a)return {status:401,json:{error:'unauthorized'}};
 if(!eligible(a.member.h)||!admin(a.member.h))return {status:403,json:{error:'forbidden'}};
 let post;try{post=validate(body,a.member)}catch(e){return {status:400,json:{error:e.message}};}
 return save(post);
}
function payload(post){
 const icon=['trade','waivers'].includes(post.kind)?'https://cuadzfantasynetwork.com/notification-media/'+post.kind+'-v1.png':logo(post.leagueId);
 const summary=post.kind==='trade'&&post.sides?.length===2 ? post.sides.map(s=>s.name).join(' ↔ ') : post.body;
 return {aps:{alert:{title:post.test?'TEST · League announcement':'📣 '+post.title,body:names[post.leagueId]+' · '+summary.slice(0,130)},sound:'default','mutable-content':1,'thread-id':'cfn-announcements-'+post.leagueId},cfn:{type:'announcement',postId:post.id,leagueId:post.leagueId,imageURL:icon,kind:post.kind,test:post.test===true}};
}
async function deliver(post,device,{store=M,sender=require('./_apns').send,now=Date.now()}={}){
 const member=A.MEMBERS.find(m=>m.h===device.member);
 if(post.deliveryDeviceID&&post.deliveryDeviceID!==device.id)return {state:'not_eligible'};
 if(!member||!eligible(member.h)||!visible(post,member,now)||!post.notify||!device.announcements||device.environment!=='production')return {state:'not_eligible'};
 if(Date.parse(post.publishedAt)<(device.announcementsEnabledAt||Infinity)||now-Date.parse(post.publishedAt)>86400000)return {state:'expired'};
 const key='network:v1:delivery:'+M.sha(post.id+':'+device.id);
 const claimed=await store.command(['SET',key,'sending','NX','EX',180*86400]);if(!claimed)return {state:'duplicate_suppressed'};
 // Revalidate registration + session after claiming. Never send on a stale opt-in/account snapshot.
 const current=await store.read('push:v1:device:'+device.id),session=await store.read('ms:'+device.session);
 if(!current?.announcements||current.member!==device.member||current.session!==device.session||current.token!==device.token||current.environment!==device.environment||!session||session.x<=now||session.e!==device.member){await store.write(key,{state:'revoked'},180*86400);return {state:'revoked'};}
 let result;try{result=await sender(device,payload(post),M.sha('announcement:'+post.id).slice(0,60));}catch{result={state:'uncertain'}};
 // No blind retries after an ambiguous APNs result: one delivery claim per post/device.
 await store.write(key,result,180*86400);if(result.invalid)await store.command(['DEL','push:v1:device:'+device.id]);return result;
}
async function tick(){
 const AP=require('./_apns');if(process.env.CFN_PUSH_ENABLED!=='true'||!AP.configured())return {enabled:false};
 const automatic=await require('./_networkevents').observe(staticPosts(Date.now(),await require('./_leagueupdates').resources()));
 const posts=[...await stored(),...automatic,...await recapPosts()].filter(p=>p.notify&&Date.now()-Date.parse(p.publishedAt)<=86400000&&(!p.expiresAt||Date.parse(p.expiresAt)>Date.now()));
 if(!posts.length)return {enabled:true,posts:0,sent:0};
 const ids=await M.command(['SMEMBERS','push:v1:devices']);let sent=0;const deadline=Date.now()+15000;
 for(const id of ids){if(Date.now()>deadline)break;const d=await M.read('push:v1:device:'+id);if(!d?.announcements||!eligible(d.member))continue;for(const p of posts){if(Date.now()>deadline)break;const r=await deliver(p,{id,...d});if(r.state==='sent')sent++;}}
 return {enabled:true,posts:posts.length,sent};
}
async function test(req,body){
 const a=await A.authenticate(req);if(!a)return {status:401,json:{error:'unauthorized'}};
 if(!eligible(a.member.h))return {status:403,json:{error:'private_rollout'}};
 const P=require('./_mpush'),AP=require('./_apns'),id=P.hashDevice('production',String(body.installation||'').toLowerCase());
 const d=await M.read('push:v1:device:'+id);
 if(!d?.announcements||d.member!==a.member.h||d.session!==a.th)return {status:403,json:{error:'device_not_enabled'}};
 if(!AP.configured()||process.env.CFN_PUSH_ENABLED!=='true')return {status:503,json:{error:'delivery_unavailable'}};
 const league=body.leagueId||Object.keys(a.member.teams)[0];if(!M.LGS.includes(league)||!Number.isInteger(a.member.teams[league]))return {status:403,json:{error:'forbidden'}};
 if(!await M.command(['SET','network:v1:test:'+id,'1','NX','EX',60]))return {status:429,json:{error:'please_wait'}};
 const post={id:crypto.randomUUID(),kind:'announcement',leagueId:league,title:'Your league, in the loop',body:'This is a private test. League announcements will open right here.',publishedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString(),notify:true,deliveryDeviceID:id,audience:a.member.h,logoURL:logo(league),test:true};
 await save(post);const result=await deliver(post,{id,...d});
 return {status:result.state==='sent'?200:503,json:{accepted:result.state==='sent'}};
}
module.exports={publicFeed,feed,publish,staticPosts,validate,visible,payload,deliver,tick,test,eligible,logo};
