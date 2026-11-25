// Independent alert worker. Never participates in score publication.
'use strict';
const M=require('./_m'), A=require('./_mauth'), TD=require('./_touchdowns'), AP=require('./_apns'), I=require('./_ids');
const NS='push:v1:', TTL=35*86400, MAX_AGE=180000;
// Invited-member rollout; removed/uninvited identities always fail closed.
const rollout=require('./_pushrollout.json');
const allowed=member=>A.MEMBERS.some(m=>m.h===member)&&(rollout.allInvitedMembers===true||(Array.isArray(rollout.memberHashes)&&rollout.memberHashes.includes(member)));
const hashDevice=(env,installation)=>M.sha(env+':'+installation);
async function notificationPayload(event,recipient) {
 let photoURL=null;
 // Existing ten-minute process cache; lookup only for an actual send, never on idle ticks.
 if(recipient.players.length===1)try {
  const p=recipient.players[0];
  photoURL=I.idFor(await I.getMap(),p.name,p.position,p.nflTeam).photoURL;
 }catch{} // A missing portrait must never prevent the touchdown alert.
 return TD.payload(event,recipient,photoURL);
}
async function registration(req,body){
 const a=await A.authenticate(req);if(!a)return {status:401,json:{error:'unauthorized'}};
 const token=String(body.token||'').toLowerCase(),environment=body.environment,installation=String(body.installation||'').toLowerCase(),revision=Number(body.revision);
 if((body.announcements!=null&&!['true','false'].includes(body.announcements))||!/^[a-f0-9]{64,200}$/.test(token)||!['sandbox','production'].includes(environment)||!['true','false'].includes(body.enabled)||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(installation)||!Number.isSafeInteger(revision)||revision<1)return {status:400,json:{error:'invalid_device'}};
 const id=hashDevice(environment,installation),key=NS+'device:'+id;
 const lock=await M.lock(key+':lock',15);if(!lock)return {status:409,json:{error:'device_busy'}};
 try {
  const session=await M.read('ms:'+a.th);if(!session||session.x<=Date.now()||session.e!==a.member.h)return {status:401,json:{error:'unauthorized'}};
  const old=await M.read(key),now=Date.now();
  if(old&&old.revision>=revision)return {status:409,json:{error:'superseded_settings'}};
  // A stable installation ID and monotonic revision also protect account switches
  // and APNs token rotation from delayed requests and duplicate deliveries.
  const device={token,environment,member:a.member.h,session:a.th,revision,announcements:body.announcements==='true',announcementsEnabledAt:old?.member===a.member.h&&old.announcements?old.announcementsEnabledAt:now,enabled:body.enabled==='true',enabledAt:old?.member===a.member.h&&old.enabled?old.enabledAt:now,updatedAt:now};
  await M.write(key,device,TTL);await M.command(['SADD',NS+'devices',id]);
  return {status:200,json:{enabled:device.enabled,ready:allowed(a.member.h)&&environment==='production'&&AP.configured()&&process.env.CFN_PUSH_ENABLED==='true'}};
 } finally {await M.unlock(key+':lock',lock);}
}
async function testDevice(req,body){
 const a=await A.authenticate(req);if(!a)return {status:401,json:{error:'unauthorized'}};
 const id=hashDevice('production',String(body.installation||'').toLowerCase()),d=await M.read(NS+'device:'+id);
 if(!d?.enabled||d.member!==a.member.h||d.session!==a.th)return {status:403,json:{error:'device_not_enabled'}};
 if(!allowed(a.member.h))return {status:403,json:{error:'private_rollout'}};
 if(!AP.configured()||process.env.CFN_PUSH_ENABLED!=='true')return {status:503,json:{error:'delivery_unavailable'}};
 const c=await M.context({cachedOnly:true});
 if(!c||c.stale||c.season!==M.SEASON)return {status:503,json:{error:'matchup_unavailable'}};
 const lg=body.leagueId||Object.keys(a.member.teams)[0],teamId=a.member.teams[lg];
 if(!M.LGS.includes(lg)||!Number.isInteger(teamId))return {status:403,json:{error:'forbidden'}};
 const rec=await M.read('mw:'+lg+':'+c.week);
 const matches=rec?.lg===lg&&rec.season===c.season&&rec.week===c.week&&!rec.partial&&Array.isArray(rec.matchups)?rec.matchups.filter(m=>m.ia===teamId||m.ib===teamId):[];
 if(matches.length!==1)return {status:503,json:{error:'matchup_unavailable'}};
 const match=matches[0],rows=match.ia===teamId?match.L:match.R;
 const player=Array.isArray(rows)&&rows.find(r=>Array.isArray(r)&&TD.slots.has(String(r[0]).toUpperCase())&&['QB','RB','WR','TE'].includes(String(r[2]).toUpperCase())&&typeof r[1]==='string'&&r[1]);
 if(!player)return {status:503,json:{error:'starter_unavailable'}};
 const event={id:'test:'+Date.now()+':'+id,season:c.season,week:c.week,yards:20};
 const recipient={targets:[{leagueId:lg,teamId,season:c.season,week:c.week}],players:[{name:player[1],position:player[2],nflTeam:player[3],role:String(player[2]).toUpperCase()==='QB'?'passer':String(player[2]).toUpperCase()==='RB'?'rusher':'receiver'}]};
 const payload=await notificationPayload(event,recipient);
 payload.aps.alert.title='TEST · '+payload.aps.alert.title;
 payload.aps.alert.body='Simulated · '+payload.aps.alert.body;
 payload.cfn.test=true;
 const claimed=await M.command(['SET',NS+'test:'+id,'1','NX','EX',60]);if(!claimed)return {status:429,json:{error:'please_wait'}};
 const result=await AP.send(d,payload,'cfn-self-test');
 if(result.invalid)await M.command(['DEL',NS+'device:'+id]);
 return {status:result.state==='sent'?200:503,json:{accepted:result.state==='sent'}};
}
async function unregisterSession(th){
 const ids=await M.command(['SMEMBERS',NS+'devices']);
 for(const id of ids){const key=NS+'device:'+id,d=await M.read(key);if(d?.session===th)await M.command(['DEL',key]);}
}
async function devices(now){
 const ids=await M.command(['SMEMBERS',NS+'devices']),out=[];
 for(const id of ids){
  const d=await M.read(NS+'device:'+id);
  if(!d){await M.command(['SREM',NS+'devices',id]);continue;}
  if(!d.enabled||d.environment!=='production'||!allowed(d.member))continue;
  const s=await M.read('ms:'+d.session);
  if(s&&s.x>now&&s.e===d.member&&A.MEMBERS.some(m=>m.h===d.member))out.push({id,...d});
 }
 return out;
}
// A single durable claim per event/league/device survives worker retries. Ambiguous transport
// outcomes are not retried: a missed alert is preferable to duplicate touchdown alerts.
async function deliver({event,recipient,device,now=Date.now(),store=M,sender=AP.send}){
 if(!allowed(device.member)||device.member!==recipient.member)return {state:'recipient_not_enabled'};
 const target=recipient.targets[0];
 if(recipient.targets.length!==1||!target)return {state:'invalid_destination'};
 const deliveryId=event.id+':'+target.leagueId+':'+target.teamId;
 const k=NS+'delivery:'+M.sha(deliveryId+':'+device.id),old=await store.read(k);
 if(old&&old.state!=='retry')return {state:'duplicate_suppressed'};
 if(old&&old.nextAttemptAt>now)return {state:'backoff'};
 if(event.at<device.enabledAt||now-event.at>MAX_AGE)return {state:'expired'};
 const lock=await store.lock(k+':lock',30);if(!lock)return {state:'busy'};
 try{
  const check=await store.read(k);if(check&&check.state!=='retry')return {state:'duplicate_suppressed'};
  if(check&&check.nextAttemptAt>now)return {state:'backoff'};
  const attempt=(check?.attempt||0)+1;
  await store.write(k,{state:'sending',attempt,at:now},TTL);
  let result;try{result=await sender(device,await notificationPayload(event,recipient),M.sha(deliveryId).slice(0,60));}catch{result={state:'uncertain'};}
  await store.write(k,{...result,attempt,at:now,nextAttemptAt:now+Math.min(60000,15000*attempt)},TTL);
  if(result.invalid)await store.command(['DEL',NS+'device:'+device.id]);
  return result;
 }finally{await store.unlock(k+':lock',lock);}
}
async function tick({deadline=Date.now()+48000}={}){
 if(process.env.CFN_PUSH_ENABLED!=='true'||!AP.configured())return {enabled:false};
 const now=Date.now(),ds=await devices(now);if(!ds.length)return {enabled:true,devices:0};
 const c=await M.context({cachedOnly:true});if(!c||c.stale||c.season!==M.SEASON)throw Error('push_calendar_unavailable');
 const window=require('./_gamewindow'),prefix=`bdl:${c.season}:${c.week}`;
 const schedule=await M.read(prefix+':schedule');
 if(!schedule?.games?.length||!window.recent(schedule.observedAt,now,window.LIVE_SCHEDULE_MS)){
  const health=await M.read(prefix+':health');
  if(!window.idleSchedule(schedule,health,c,now))throw Error('push_schedule_delayed');
  const idle={enabled:true,devices:ds.length,events:0,sent:0,suppressed:0,idle:true,reason:'outside_game_window'};
  await M.write(NS+'health',{...idle,checkedAt:now},86400);return idle;
 }
 const records={};for(const lg of M.LGS)records[lg]=await M.read('mw:'+lg+':'+c.week);
 const totals={enabled:true,devices:ds.length,events:0,sent:0,suppressed:0};
 for(const g of schedule.games){
  if(Date.now()>deadline-10000)break;
  const snap=await M.read(`bdl:${c.season}:${c.week}:game:${g.id}`);
  if(!snap?.game||!Number.isFinite(snap.observedAt)||snap.game.season!==c.season||snap.game.week!==c.week||now-snap.observedAt>90000)continue;
  const eligible=TD.events(snap).filter(e=>now-e.at>=20000&&now-e.at<=MAX_AGE);
  for(const e of eligible){
   totals.events++;
   for(const r of TD.recipients(e,records,A.MEMBERS,now))for(const d of ds.filter(x=>x.member===r.member)){
    if(Date.now()>deadline-10000)break;
    // Recheck active session immediately before sending; revocations take effect between ticks.
    const current=await M.read(NS+'device:'+d.id),session=await M.read('ms:'+d.session);
    if(!current?.enabled||!allowed(current.member)||current.member!==r.member||current.session!==d.session||!session||session.x<=Date.now()||session.e!==r.member)continue;
    const result=await deliver({event:e,recipient:r,device:d,now});
    if(result.state==='sent')totals.sent++;else totals.suppressed++;
   }
  }
 }
 await M.write(NS+'health',{...totals,checkedAt:Date.now()},86400);return totals;
}
async function collect(){
 const start=Date.now(),out=[];
 for(const offset of [0,15000,30000,45000]){
  if(Date.now()-start>48000)break;
  const wait=start+offset-Date.now();if(wait>0)await M.sleep(wait);
  const result=await tick({deadline:start+55000});out.push(result);
  if(!result.enabled||!result.devices||result.idle)break;
 }
 return {checks:out};
}
module.exports={allowed,testDevice,registration,unregisterSession,deliver,tick,collect,hashDevice};
