// Independent alert worker. Never participates in score publication.
'use strict';
const M=require('./_m'), A=require('./_mauth'), TD=require('./_touchdowns'), AP=require('./_apns');
const NS='push:v1:', TTL=35*86400, MAX_AGE=180000;
const hashDevice=(env,installation)=>M.sha(env+':'+installation);
async function registration(req,body){
 const a=await A.authenticate(req);if(!a)return {status:401,json:{error:'unauthorized'}};
 const token=String(body.token||'').toLowerCase(),environment=body.environment,installation=String(body.installation||'').toLowerCase(),revision=Number(body.revision);
 if(!/^[a-f0-9]{64,200}$/.test(token)||!['sandbox','production'].includes(environment)||!['true','false'].includes(body.enabled)||!/^[a-f0-9-]{36}$/.test(installation)||!Number.isSafeInteger(revision)||revision<1)return {status:400,json:{error:'invalid_device'}};
 const id=hashDevice(environment,installation),key=NS+'device:'+id;
 const lock=await M.lock(key+':lock',15);if(!lock)return {status:409,json:{error:'device_busy'}};
 try {
  const session=await M.read('ms:'+a.th);if(!session||session.x<=Date.now()||session.e!==a.member.h)return {status:401,json:{error:'unauthorized'}};
  const old=await M.read(key),now=Date.now();
  if(old&&old.revision>=revision)return {status:409,json:{error:'superseded_settings'}};
  // A stable installation ID and monotonic revision also protect account switches
  // and APNs token rotation from delayed requests and duplicate deliveries.
  const device={token,environment,member:a.member.h,session:a.th,revision,enabled:body.enabled==='true',enabledAt:old?.member===a.member.h&&old.enabled?old.enabledAt:now,updatedAt:now};
  await M.write(key,device,TTL);await M.command(['SADD',NS+'devices',id]);
  return {status:200,json:{enabled:device.enabled,ready:environment==='production'&&AP.configured()&&process.env.CFN_PUSH_ENABLED==='true'}};
 } finally {await M.unlock(key+':lock',lock);}
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
  if(!d.enabled||d.environment!=='production')continue;
  const s=await M.read('ms:'+d.session);
  if(s&&s.x>now&&s.e===d.member&&A.MEMBERS.some(m=>m.h===d.member))out.push({id,...d});
 }
 return out;
}
// A single durable claim per event/device survives worker retries. Ambiguous transport
// outcomes are not retried: a missed alert is preferable to duplicate touchdown alerts.
async function deliver({event,recipient,device,now=Date.now(),store=M,sender=AP.send}){
 const k=NS+'delivery:'+M.sha(event.id+':'+device.id),old=await store.read(k);
 if(old&&old.state!=='retry')return {state:'duplicate_suppressed'};
 if(old&&old.nextAttemptAt>now)return {state:'backoff'};
 if(event.at<device.enabledAt||now-event.at>MAX_AGE)return {state:'expired'};
 const lock=await store.lock(k+':lock',30);if(!lock)return {state:'busy'};
 try{
  const check=await store.read(k);if(check&&check.state!=='retry')return {state:'duplicate_suppressed'};
  if(check&&check.nextAttemptAt>now)return {state:'backoff'};
  const attempt=(check?.attempt||0)+1;
  await store.write(k,{state:'sending',attempt,at:now},TTL);
  let result;try{result=await sender(device,TD.payload(event,recipient),M.sha(event.id).slice(0,60));}catch{result={state:'uncertain'};}
  await store.write(k,{...result,attempt,at:now,nextAttemptAt:now+Math.min(60000,15000*attempt)},TTL);
  if(result.invalid)await store.command(['DEL',NS+'device:'+device.id]);
  return result;
 }finally{await store.unlock(k+':lock',lock);}
}
async function tick({deadline=Date.now()+48000}={}){
 if(process.env.CFN_PUSH_ENABLED!=='true'||!AP.configured())return {enabled:false};
 const now=Date.now(),ds=await devices(now);if(!ds.length)return {enabled:true,devices:0};
 const c=await M.context({cachedOnly:true});if(!c||c.stale||c.season!==M.SEASON)throw Error('push_calendar_unavailable');
 const schedule=await M.read(`bdl:${c.season}:${c.week}:schedule`);if(!schedule||now-schedule.observedAt>180000)throw Error('push_schedule_delayed');
 const records={};for(const lg of M.LGS)records[lg]=await M.read('mw:'+lg+':'+c.week);
 const totals={enabled:true,devices:ds.length,events:0,sent:0,suppressed:0};
 for(const g of schedule.games){
  if(Date.now()>deadline-10000)break;
  const snap=await M.read(`bdl:${c.season}:${c.week}:game:${g.id}`);
  if(!snap||snap.game.season!==c.season||snap.game.week!==c.week||now-snap.observedAt>90000)continue;
  const eligible=TD.events(snap).filter(e=>now-e.at>=20000&&now-e.at<=MAX_AGE);
  for(const e of eligible){
   totals.events++;
   for(const r of TD.recipients(e,records,A.MEMBERS,now))for(const d of ds.filter(x=>x.member===r.member)){
    if(Date.now()>deadline-10000)break;
    // Recheck active session immediately before sending; revocations take effect between ticks.
    const current=await M.read(NS+'device:'+d.id),session=await M.read('ms:'+d.session);
    if(!current?.enabled||current.member!==r.member||current.session!==d.session||!session||session.x<=Date.now()||session.e!==r.member)continue;
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
  if(!result.enabled||!result.devices)break;
 }
 return out;
}
module.exports={registration,unregisterSession,deliver,tick,collect,hashDevice};
