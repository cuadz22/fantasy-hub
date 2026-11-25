'use strict';
const H=require('./mobile_harness'),{M,A,ok}=H,AP=require('../client/api/_apns'),L=require('../client/api/_liveactivity');
(async()=>{
 const member=A.MEMBERS.find(m=>require('../client/api/_pushrollout.json').memberHashes.includes(m.h));
 const token='cfn_'+'c'.repeat(40),req={headers:{authorization:'Bearer '+token}},session=M.sha(token);
 await M.write('ms:'+session,{e:member.h,x:Date.now()+600000});
 let week=11,body={season:M.SEASON,week:11,sourceUpdatedAt:new Date().toISOString(),matchups:[{ia:2,ib:1,an:'Opponent',bn:'Mine',ya:[99],yb:[101],winProbability:{homeProjected:120,awayProjected:130}}]};
 M.context=async()=>({week,stale:false});M.serveWeek=async()=>body;
 const state=L.stateFrom(body,'gl',1);
 ok(state.homeName==='Mine'&&state.homeScore===101&&state.homeProjection===130,'own team orientation and live forecast');
 for(const bad of [{...body,partial:true},{...body,season:2025},{...body,sourceUpdatedAt:null},{...body,matchups:[{ia:1,ib:2,ya:[null],yb:[10]}]}]){let threw=false;try{L.stateFrom(bad,'gl',1)}catch{threw=true}ok(threw,'reject invalid snapshot');}
 ok((await L.register({headers:{}},{kind:'widget',league:'gl',week:11})).status===401,'registration requires session');
 ok((await L.register(req,{kind:'widget',league:'sl',week:11})).status===400,'retired league unavailable');
 const widget=await L.register(req,{kind:'widget',league:'gl',week:11});ok(widget.status===200&&widget.json.accessToken.length===64,'scoped widget capability');
 const wr={headers:{authorization:'Bearer '+widget.json.accessToken}};
 ok((await L.read(wr)).json.homeName==='Mine','scoped read works');
 week=12;body={...body,week:12};ok((await L.read(wr)).json.week===12,'widget follows calendar rollover');
 let sends=0,last;
 AP.configured=()=>true;AP.send=async(...args)=>{sends++;last=args;return {state:'sent'}};
 const live=await L.register(req,{kind:'live',league:'gl',week:12,token:'d'.repeat(64),environment:'production'});
 ok(live.status===200&&!live.json.accessToken,'live token distinct from widget capability');
 await Promise.all([L.tick(),L.tick()]);ok(sends===1,'overlapping cron sends only one unchanged update');
 ok(last[3]==='liveactivity'&&last[1].aps['content-state'].homeScore===101&&!last[1].aps.alert,'activity push correct type and no touchdown alert');
 await L.tick();ok(sends===1,'unchanged poll suppressed');
 body={...body,matchups:[{...body.matchups[0],yb:[107]}]};await L.tick();ok(sends===2,'score change sends update');
 body={...body,final:true};await L.tick();ok(sends===3&&last[1].aps.event==='end','final ends activity');await L.tick();ok(sends===3,'final not repeated');
 const other=A.MEMBERS.find(m=>m.h!==member.h),otherToken='cfn_'+'e'.repeat(40);await M.write('ms:'+M.sha(otherToken),{e:other.h,x:Date.now()+60000});
 const otherReq={headers:{authorization:'Bearer '+otherToken}};
 // Every invited member receives the same read-only features, scoped to their own team.
 for(const [i,m] of A.MEMBERS.entries()){
  const t='cfn_'+String(i+30).padStart(40,'0'),r={headers:{authorization:'Bearer '+t}},sh=M.sha(t);
  await M.write('ms:'+sh,{e:m.h,x:Date.now()+60000});
  const lg=Object.keys(m.teams)[0],team=m.teams[lg];
  body={season:M.SEASON,week:12,sourceUpdatedAt:new Date().toISOString(),matchups:[{ia:team,ib:999,an:'Own',bn:'Other',ya:[12],yb:[13]}]};
  const w=await L.register(r,{kind:'widget',league:lg,week:12});
  ok(w.status===200&&w.json.state.teamId===team,'invited member widget uses assigned team');
  const l=await L.register(r,{kind:'live',league:lg,week:12,token:String(i+1).padStart(64,'0'),environment:'production'});
  ok(l.status===200&&l.json.state.teamId===team,'invited member Live Activity uses assigned team');
  if(!require('../client/api/_connected').assignedTeam(m,'fb'))ok((await L.register(r,{kind:'widget',league:'fb',week:12})).status===400,'unassigned FBZ activity denied');
  await M.command(['DEL','ms:'+sh]);
  ok((await L.read({headers:{authorization:'Bearer '+w.json.accessToken}})).status===401,'revoked member widget denied');
 }
 const unknown='cfn_'+'f'.repeat(40);await M.write('ms:'+M.sha(unknown),{e:'uninvited',x:Date.now()+60000});
 ok((await L.register({headers:{authorization:'Bearer '+unknown}},{kind:'widget',league:'gl',week:12})).status===401,'uninvited identity denied');
 ok((await L.remove(otherReq,{id:widget.json.id})).status===403,'other member cannot remove capability');
 await M.command(['DEL','ms:'+session]);ok((await L.read(wr)).status===401,'logout revokes widget access');
 // Market provider failure must preserve the last successful published result.
 const MV=require('../client/api/_mmovers'),Ids=require('../client/api/_ids');Ids.getMap=async()=>({});
 const old={body:{sourceUpdatedAt:'prior'}};await M.write('mm:cache',old);
 MV.compute=async()=>({ok:false,error:'source_down'});let failed=false;try{await require('../client/api/_marketrefresh').refresh()}catch{failed=true}
 ok(failed&&JSON.stringify(await M.read('mm:cache'))===JSON.stringify(old),'failed market refresh preserves source timestamp and data');
 MV.compute=async()=>({ok:true,key:'new',body:{sourceUpdatedAt:'new',computedAt:'now'}});await require('../client/api/_marketrefresh').refresh();ok((await M.read('mm:cache')).body.sourceUpdatedAt==='new','successful market refresh publishes');
 H.done();
})().catch(e=>{console.error(e);process.exit(1)});
