'use strict';
// No external delivery: real routes and member assignments, in-memory Redis.
const H=require('./mobile_harness'),{M,A,ok}=H;
const N=require('../client/api/_network'),P=require('../client/api/_mpush'),C=require('../client/api/_connected');
const crypto=require('crypto');
(async()=>{
 const snapshot=process.env.CFN_FBZ_AUDIT_SNAPSHOT?JSON.parse(require('fs').readFileSync(process.env.CFN_FBZ_AUDIT_SNAPSHOT,'utf8')):null;
 if(snapshot)await M.write('connected:v1:fb:2026:12',snapshot);
 M.context=async()=>({season:2026,week:12,stale:false,board:{games:[]}});
 const ids={Cuadz:12,Ed:1,Alexis:2,Kevin:9};let sends=0;
 for(const [i,m] of A.MEMBERS.entries()){
  const token='cfn_'+String(i+1).padStart(40,'0'),session=M.sha(token),req={headers:{authorization:'Bearer '+token}};
  await M.write('ms:'+session,{e:m.h,x:Date.now()+600000});
  const feed=await N.feed(req,true);
  ok(feed.status===200,`${m.name}: Network available`);
  ok(feed.json.posts.every(p=>p.leagueId==='network'||Number.isInteger(m.teams[p.leagueId])||(p.leagueId==='fb'&&C.assignedTeam(m,'fb'))),`${m.name}: feed only assigned leagues`);
  ok(P.allowed(m.h)&&N.eligible(m.h),`${m.name}: both alert categories eligible`);
  const post={id:crypto.randomUUID(),kind:'announcement',leagueId:Object.keys(m.teams)[0],title:'Release audit',body:'Offline test only.',notify:true};
  const publisher=require('../client/api/_networkrollout.json').publishers.includes(m.h);
  ok(feed.json.canPublish===publisher,`${m.name}: commissioner privilege unchanged`);
  if(!publisher)ok((await N.publish(req,post)).status===403,`${m.name}: cannot publish announcements`);
  const installation=crypto.randomUUID(),body={installation,revision:1,token:crypto.createHash('sha256').update(m.h).digest('hex'),environment:'production',enabled:'true',announcements:'true'};
  ok((await P.registration(req,body)).status===200,`${m.name}: registration succeeds`);
  const id=P.hashDevice('production',installation),device={id,...await M.read('push:v1:device:'+id)};
  const alert={...post,publishedAt:new Date(Date.now()+1).toISOString()};
  const opts={now:Date.now()+20,sender:async()=>{sends++;return {state:'sent'}}};
  const before=sends;
  const results=await Promise.all([N.deliver(alert,device,opts),N.deliver(alert,device,opts)]);
  ok(sends===before+1&&results.some(x=>x.state==='duplicate_suppressed'),`${m.name}: one delivery per device under concurrent retries`);
  const privatePost={...alert,id:crypto.randomUUID(),audience:'another-member'};
  ok((await N.deliver(privatePost,device,opts)).state==='not_eligible',`${m.name}: another member's private test excluded`);
  await P.registration(req,{...body,revision:2,enabled:'false',announcements:'false'});
  const off={id,...await M.read('push:v1:device:'+id)};
  ok(!off.enabled&&!off.announcements&&(await N.deliver({...alert,id:crypto.randomUUID()},off,opts)).state==='not_eligible',`${m.name}: explicit opt-outs honored`);
  const catalog=await C.catalog(req),expected=C.assignedTeam(m,'fb');
  ok(catalog.json.leagues.length===(expected?1:0),`${m.name}: connected access exact`);
  if(snapshot){
   const r=await C.snapshot(req,'fb',12);
   if(expected){ok(r.status===200&&r.json.teamId===expected,`${m.name}: correct FBZ assignment`);ok(r.json.matchups.some(x=>x.home.id===expected),`${m.name}: own team on left`);}
   else ok(r.status===403,`${m.name}: unassigned FBZ denied`);
  }
 }
 ok(!P.allowed('uninvited')&&!N.eligible('uninvited'),'uninvited identities denied');
 ok((await N.feed({headers:{}})).status===401,'Network still requires login');
 H.done();
})().catch(e=>{console.error(e);process.exit(1)});
