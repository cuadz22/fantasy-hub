'use strict';
// Isolated read-only presentation channel. Never writes scores, standings or membership.
const M=require('./_m'),A=require('./_mauth'),AP=require('./_apns'),crypto=require('crypto');
const NS='activity:v1:',names={gl:'Gentlemen’s League',bh:'Beaners & Husseins',rb:'Rebirth',sts:'Shoot the Shits',fb:'Fantasy Ball Z'};
const allowed=h=>require('./_pushrollout.json').memberHashes.includes(h);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function stateFrom(body,lg,teamId){
 if(!body||body.stale||body.partial||body.season!==M.SEASON)throw Error('scores_unavailable');
 const m=body.matchups?.find(m=>(m.ia??m.home?.id)===teamId||(m.ib??m.away?.id)===teamId);if(!m)throw Error('matchup_unavailable');
 let homeName,awayName,homeScore,awayScore,homeProjection,awayProjection,final;
 if(lg==='fb'){
  const a=m.home.id===teamId?m.home:m.away,b=m.home.id===teamId?m.away:m.home;
  [homeName,awayName,homeScore,awayScore,homeProjection,awayProjection]=[a.name,b.name,a.reportedScore,b.reportedScore,a.reportedForecast??null,b.reportedForecast??null];
  const starters=[...a.players,...b.players].filter(p=>!['BN','IR'].includes(p.position));
  final=starters.length>0&&starters.every(p=>/^(final|bye|no game)/i.test(p.status));
 }else{
  const own=m.ia===teamId,wp=m.winProbability;
  [homeName,awayName]=own?[m.an,m.bn]:[m.bn,m.an];
  [homeScore,awayScore]=own?[m.ya?.[0],m.yb?.[0]]:[m.yb?.[0],m.ya?.[0]];
  [homeProjection,awayProjection]=own?[wp?.homeProjected??null,wp?.awayProjected??null]:[wp?.awayProjected??null,wp?.homeProjected??null];
  final=body.final===true||['final','tie'].includes(wp?.status);
 }
 if(!finite(homeScore)||!finite(awayScore))throw Error('incomplete_scores');
 const sourceAt=Date.parse(body.sourceUpdatedAt||body.observedAt||body.at);if(!Number.isFinite(sourceAt))throw Error('missing_timestamp');
 const at=Math.max(sourceAt,Number.isFinite(body.scoring?.scoreUpdatedAt)?body.scoring.scoreUpdatedAt:0);
 return {league:lg,leagueName:names[lg],teamId,week:body.week,season:M.SEASON,homeName,awayName,homeScore,awayScore,homeProjection:finite(homeProjection)?homeProjection:null,awayProjection:finite(awayProjection)?awayProjection:null,updatedAt:at/1000,final};
}
async function valid(record){
 const s=record&&await M.read('ms:'+record.session);
 const member=A.MEMBERS.find(m=>m.h===record?.member);
 return !!(s&&s.x>Date.now()&&s.e===record.member&&member&&allowed(member.h)&&(member.teams[record.league]??require('./_connected').assignedTeam(member,record.league))===record.teamId);
}
async function snapshot(record){
 const c=await M.context({cachedOnly:true});if(!c||c.stale)throw Error('calendar_unavailable');
 const week=record.kind==='widget'?c.week:record.week;
 const body=record.league==='fb'?await M.read(`connected:v1:fb:${M.SEASON}:${week}`):await M.serveWeek(record.league,week,c);
 if(record.league==='fb'&&body&&Date.now()-Date.parse(body.observedAt)>600000)throw Error('scores_delayed');
 return stateFrom(body,record.league,record.teamId);
}
async function register(req,b){
 const a=await A.authenticate(req);if(!a)return {status:401,json:{error:'unauthorized'}};
 if(!allowed(a.member.h))return {status:403,json:{error:'private_rollout'}};
 const teamId=a.member.teams[b.league]??require('./_connected').assignedTeam(a.member,b.league);
 if(!names[b.league]||!teamId||!['widget','live'].includes(b.kind)||!Number.isInteger(b.week)||b.week<1||b.week>18)return {status:400,json:{error:'invalid_selection'}};
 if(b.kind==='live'&&(!/^[a-f0-9]{64,256}$/.test(b.token||'')||!['sandbox','production'].includes(b.environment)))return {status:400,json:{error:'invalid_token'}};
 const secret=b.kind==='widget'?crypto.randomBytes(32).toString('hex'):b.token,id=M.sha(secret);
 const record={kind:b.kind,league:b.league,week:b.week,teamId,session:a.th,member:a.member.h,token:b.token,environment:b.environment,createdAt:Date.now()};
 const state=await snapshot(record);
 await M.write(NS+id,record,b.kind==='live'?9*3600:35*86400);
 if(b.kind==='live')await M.command(['SADD',NS+'active',id]);
 return {status:200,json:{id,accessToken:b.kind==='widget'?secret:undefined,state}};
}
async function read(req){
 const token=String(req.headers?.authorization||'').replace(/^Bearer /,'');
 if(!/^[a-f0-9]{64}$/.test(token))return {status:401,json:{error:'unauthorized'}};
 const record=await M.read(NS+M.sha(token));if(record?.kind!=='widget'||!await valid(record))return {status:401,json:{error:'unauthorized'}};
 return {status:200,json:await snapshot(record)};
}
async function remove(req,b){
 const a=await A.authenticate(req);if(!a)return {status:401,json:{error:'unauthorized'}};
 if(!/^[a-f0-9]{64}$/.test(b.id||''))return {status:400,json:{error:'invalid_id'}};
 const r=await M.read(NS+b.id);if(r&&r.member!==a.member.h)return {status:403,json:{error:'forbidden'}};
 await M.command(['DEL',NS+b.id]);await M.command(['SREM',NS+'active',b.id]);return {status:200,json:{ok:true}};
}
async function tick(){
 if(!AP.configured())return {configured:false};
 const ids=await M.command(['SMEMBERS',NS+'active']);let sent=0;
 for(const id of ids.slice(0,100)){
  const lock=await M.lock(NS+'lock:'+id,60);if(!lock)continue;
  try {
  const r=await M.read(NS+id);if(!r){await M.command(['SREM',NS+'active',id]);continue}
  if(Date.now()-r.createdAt>8*3600000||!await valid(r)){await M.command(['DEL',NS+id]);await M.command(['SREM',NS+'active',id]);continue}
  try{
   const state=await snapshot(r),fingerprint=M.sha(JSON.stringify(state));
   if(r.last===fingerprint)continue;
   const now=Math.floor(Date.now()/1000),payload={aps:{timestamp:now,event:state.final?'end':'update','content-state':state,'stale-date':now+300,...(state.final?{'dismissal-date':now+3600}:{})}};
   const result=await AP.send(r,payload,'cfn-live-'+id.slice(0,24),'liveactivity');
   if(result.state==='sent'){sent++;await M.write(NS+id,{...r,last:fingerprint},9*3600)}
   if(result.invalid||state.final&&result.state==='sent'){await M.command(['DEL',NS+id]);await M.command(['SREM',NS+'active',id])}
  }catch{} // Last visible score expires via stale-date; never replace it with fabricated zeroes.
  } finally { await M.unlock(NS+'lock:'+id,lock); }
 }
 return {sent,active:ids.length};
}
module.exports={stateFrom,register,read,remove,tick,valid};
