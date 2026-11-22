'use strict';
const T=require('./mobile_harness'),{ok,store}=T,TD=require('../client/api/_touchdowns'),P=require('../client/api/_mpush'),M=require('../client/api/_m'),A=require('../client/api/_mauth');
const snap=JSON.parse(require('zlib').gunzipSync(require('fs').readFileSync(__dirname+'/fixtures/scoring-thursday.json.gz')));
const es=TD.events(snap),e=es[0],now=e.at+60000;
const clone=x=>JSON.parse(JSON.stringify(x));
const row=p=>['WR',p.name,p.role==='passer'?'QB':'WR','HOU',20,0,'',''];
const record=(lg,team=1,rows=e.people.map(row))=>({lg,season:e.season,week:e.week,sourceUpdatedAt:now,matchups:[{ia:team,ib:12,L:rows,R:[]}],partial:false});
const member={h:'owner',teams:{gl:1,bh:1}};
(async()=>{
 ok(es.length>0&&e.people.some(p=>p.name==='Nico Collins')&&e.people.some(p=>p.name==='C.J. Stroud'),'real Thursday TD attributes QB and receiver');
 let rs=TD.recipients(e,{gl:record('gl'),bh:record('bh')},[member],now);
 ok(rs.length===1&&rs[0].targets.length===2&&rs[0].players.length===2,'QB plus receiver across leagues generates one owner payload');
 const recipients=rs[0];
 const bench=e.people.map(p=>{const r=row(p);r[0]='BN';return r;});
 ok(TD.recipients(e,{gl:record('gl',1,bench)},[member],now).length===0,'bench excluded');
 for(const slot of ['IR','IR+','NA','BE','unknown']){const rows=e.people.map(p=>{const r=row(p);r[0]=slot;return r;});ok(TD.recipients(e,{gl:record('gl',1,rows)},[member],now).length===0,'exclude '+slot);}
 for(const slot of ['QB','WR','FLEX','W/R/T','SUPERFLEX']){const r=row(e.people[0]);r[0]=slot;ok(TD.recipients(e,{gl:record('gl',1,[r])},[member],now).length===1,'starter slot '+slot);}
 for(const patch of [{partial:true},{sourceUpdatedAt:now-180001},{sourceUpdatedAt:e.at-1},{week:10},{season:2025}])ok(TD.recipients(e,{gl:{...record('gl'),...patch}},[member],now).length===0,'unsafe roster '+JSON.stringify(patch));
 ok(TD.recipients(e,{gl:record('gl')},[{h:'other',teams:{gl:2}}],now).length===0,'wrong owner excluded');
 const dup=record('gl');dup.matchups[0].L.push(...clone(dup.matchups[0].L));ok(TD.recipients(e,{gl:dup},[member],now).length===0,'ambiguous roster identity excluded');
 let modified=clone(snap);modified.plays.find(p=>e.id.endsWith(':'+p.id)).text+=' NO PLAY';ok(!TD.events(modified).some(x=>x.id===e.id),'nullified touchdown excluded');
 modified=clone(snap);modified.stats.find(s=>s.player.id===e.people.find(p=>p.role==='receiver').id).receiving_touchdowns=99;ok(!TD.events(modified).some(x=>x.id===e.id),'box/play disagreement excluded');
 modified=clone(snap);modified.plays.push({...clone(modified.plays.find(p=>e.id.endsWith(':'+p.id))),text:'different revision'});ok(!TD.events(modified).some(x=>x.id===e.id),'conflicting duplicate play excluded');
 for(const m of A.MEMBERS){const records={};for(const [lg,id] of Object.entries(m.teams))records[lg]=record(lg,id);const got=TD.recipients(e,records,A.MEMBERS,now);ok(got.length===1&&got[0].member===m.h,'actual team assignments: '+m.name);}
 let sent=0;const sender=async()=>{sent++;return {state:'sent'};};
 const d={id:'test-device',enabledAt:e.at-10000};
 const args={event:e,recipient:recipients,device:d,now,sender};
 await Promise.all([P.deliver(args),P.deliver(args),P.deliver(args)]);ok(sent===1,'concurrent workers send once');
 await P.deliver(args);ok(sent===1,'retry after persisted delivery suppressed');
 let uncertain=0;const a2={...args,device:{...d,id:'uncertain'},sender:async()=>{uncertain++;return {state:'uncertain'};}};await P.deliver(a2);await P.deliver(a2);ok(uncertain===1,'ambiguous timeout never retried');
 let count=0;const a3={...args,device:{...d,id:'retry'},sender:async()=>{count++;return count===1?{state:'retry'}:{state:'sent'};}};await P.deliver(a3);await P.deliver(a3);ok(count===1,'known rejection respects backoff');await P.deliver({...a3,now:now+16000});ok(count===2,'known rejection can safely retry');
 ok((await P.deliver({...args,device:{...d,id:'old'},now:e.at+180001})).state==='expired','old events suppressed');
 ok((await P.deliver({...args,device:{...d,id:'new',enabledAt:e.at+1}})).state==='expired','no pre-opt-in alerts');
 const payload=TD.payload(e,recipients);ok(payload.cfn.targets.length===2&&payload.aps.alert.title.includes('Nico Collins'),'multi-league tap destinations and text');
 // Authenticated device registration through the real route and fake Redis, no email sends.
 const m=A.MEMBERS[0],token='cfn_'+('a'.repeat(32)),th=M.sha(token);await M.write('ms:'+th,{e:m.h,c:Date.now(),x:Date.now()+86400000});
 const req={headers:{authorization:'Bearer '+token}},body={installation:'12345678-1234-1234-1234-123456789abc',revision:1,token:'f'.repeat(64),environment:'production',enabled:'true',member:'attacker',teams:{gl:99}};
 ok((await P.registration({headers:{}},body)).status===401,'registration requires login');
 ok((await P.registration(req,{...body,token:'bad'})).status===400,'invalid token rejected');
 ok((await P.registration(req,body)).status===200,'authenticated registration accepted');
 const id=P.hashDevice('production',body.installation);ok((await M.read('push:v1:device:'+id)).member===m.h,'client cannot spoof owner');
 await P.registration(req,{...body,enabled:'false',revision:2});ok(!(await M.read('push:v1:device:'+id)).enabled,'opt out stored');
 const m2=A.MEMBERS[1],t2='cfn_'+('b'.repeat(32)),h2=M.sha(t2);await M.write('ms:'+h2,{e:m2.h,c:Date.now(),x:Date.now()+86400000});
 await P.registration({headers:{authorization:'Bearer '+t2}},{...body,revision:3});ok((await M.read('push:v1:device:'+id)).member===m2.h,'device account switch replaces old owner');
 ok((await P.registration(req,{...body,revision:2})).status===409,'late old-account request cannot replace new owner');
 await A.logout({headers:{authorization:'Bearer '+t2}});ok((await P.registration({headers:{authorization:'Bearer '+t2}},{...body,revision:3})).status===401,'revoked session cannot register');

 // Whole worker: saved real play -> active device -> one alert; no provider or email calls.
 const AP=require('../client/api/_apns');AP.configured=()=>true;let actual=0;AP.send=async()=>{actual++;return {state:'sent'};};process.env.CFN_PUSH_ENABLED='true';
 const realNow=Date.now(),live=clone(snap),play=live.plays.find(p=>e.id.endsWith(':'+p.id));play.wallclock=new Date(realNow-60000).toISOString();live.observedAt=realNow;
 await M.write('mb:cur',{season:e.season,week:e.week,fetchedAt:realNow,sourceUpdatedAt:realNow,games:[]});
 await M.write(`bdl:${e.season}:${e.week}:schedule`,{observedAt:realNow,games:[{id:live.game.id}]});
 await M.write(`bdl:${e.season}:${e.week}:game:${live.game.id}`,live);
 for(const lg of M.LGS)await M.write('mw:'+lg+':'+e.week,{...record(lg,m.teams[lg]||99),sourceUpdatedAt:realNow});
 await P.registration(req,{...body,revision:4});let device=await M.read('push:v1:device:'+id);device.enabledAt=realNow-120000;await M.write('push:v1:device:'+id,device);
 await P.tick();await P.tick();ok(actual===1,'whole worker routes real TD exactly once');
 // Use another real TD as a fresh event after disabling, revoking, and expiring.
 const second=es[1];live.plays.find(p=>second.id.endsWith(':'+p.id)).wallclock=new Date(realNow-30000).toISOString();await M.write(`bdl:${e.season}:${e.week}:game:${live.game.id}`,live);
 await P.registration(req,{...body,revision:5,enabled:'false'});await P.tick();ok(actual===1,'disabled device receives nothing');
 await P.registration(req,{...body,revision:6});await A.logout(req);await P.tick();ok(actual===1,'revoked session receives nothing');
 await M.write('ms:'+th,{e:m.h,x:Date.now()-1});await P.tick();ok(actual===1,'expired session receives nothing');
 let failSent=0;try{await P.deliver({...args,device:{...d,id:'store-down'},store:{...M,write:async()=>{throw Error('down');}},sender:async()=>{failSent++;return {state:'sent'};}});}catch{}ok(failSent===0,'failed durable claim prevents delivery');
 T.done();
})().catch(e=>{console.error(e);process.exit(1)});
