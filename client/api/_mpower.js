'use strict';
// Current, reproducible power rankings from validated completed-week results.
// Preserves the original model's observed-performance components and record
// blend. Removes its manually saved future-roster/bye projection dependency.
const standings = require('./_mstandings');
const mean = xs => xs.reduce((a,b)=>a+b,0)/xs.length;
const variance = xs => { const m=mean(xs); return mean(xs.map(x=>(x-m)**2)); };
const sd = xs => Math.sqrt(variance(xs));
const spread = xs => { const value=sd(xs); return value>1e-9?value:1; };
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const round = (x,n=2) => Number(x.toFixed(n));
const median = xs => { const a=[...xs].sort((a,b)=>a-b),i=Math.floor(a.length/2); return a.length%2?a[i]:(a[i-1]+a[i])/2; };
// Acklam's inverse normal CDF, error < 1.2e-9 over the bounded model inputs.
function normal(p) {
 const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924];
 const b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857];
 const c=[-0.00778489400243029,-0.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878];
 const d=[0.00778469570904146,0.32246712907004,2.445134137143,3.75440866190742];
 const poly=(cs,x)=>cs.reduce((v,n)=>v*x+n,0);
 if(p<0.02425||p>0.97575){const q=Math.sqrt(-2*Math.log(p<0.5?p:1-p));const v=poly(c,q)/(poly(d,q)*q+1);return p<0.5?v:-v;}
 const q=p-0.5,r=q*q;return poly(a,r)*q/(poly(b,r)*r+1);
}
function compute(input) {
 const official=standings.compute(input),G=official.throughWeek;
 const ts=[...official.rows].sort((a,b)=>a.teamId-b.teamId),N=ts.length;
 const weeks=Array.from({length:G},(_,i)=>input.weeks.find(w=>w.week===i+1));
 const scores=weeks.map(w=>Object.fromEntries(w.matchups.flatMap(m=>[[m.ia,Math.round(m.ya[0]*100)/100],[m.ib,Math.round(m.yb[0]*100)/100]])));
 const noise=mean(ts.map(t=>sd(scores.map(s=>s[t.teamId])))),cap=1.4*noise;
 const weights=weeks.map((_,i)=>0.8+0.4*i/Math.max(1,G-1));
 const metrics=ts.map(t=>{
  const devs=[],tiers=[0,0,0,0];let allPlay=0;
  for(const s of scores){
   const v=s[t.teamId],others=ts.filter(o=>o.teamId!==t.teamId).map(o=>s[o.teamId]);
   allPlay+=others.reduce((n,x)=>n+(v>x?1:v===x?0.5:0),0)/(N-1);
   const rank=1+others.filter(x=>x>v).length;
   tiers[Math.min(3,Math.floor((rank-1)*4/N))]++;
   devs.push(clamp(v-mean(Object.values(s)),-cap,cap));
  }
  const pdev=0.5*devs.reduce((n,v,i)=>n+v*weights[i],0)/weights.reduce((a,b)=>a+b,0)+0.5*median(devs);
  const apw=allPlay/G,hr=(3*tiers[0]+2*tiers[1]+tiers[2]+3)/(3*G+6);
  return {...t,pdev,apw,tiers,allPlayWins:allPlay,luck:t.wins+t.ties/2-allPlay,apZ:normal(clamp(apw,0.03,0.97)),tierZ:normal(clamp(hr,0.05,0.95))};
 });
 const devSD=spread(metrics.map(t=>t.pdev)),apSD=spread(metrics.map(t=>t.apZ)),tierSD=spread(metrics.map(t=>t.tierZ));
 const strengths=metrics.map(t=>0.40*t.pdev+0.35*t.apZ*devSD/apSD+0.25*t.tierZ*devSD/tierSD);
 const sm=mean(strengths),ss=spread(strengths);
 const records=metrics.map(t=>(t.wins+t.ties/2+3)/(G+6)),rm=mean(records),rs=spread(records);
 const recordWeight=Math.min(0.35,0.15+0.02*Math.max(0,G-1));
 const rows=metrics.map((t,i)=>{
  const z=(1-recordWeight)*(strengths[i]-sm)/ss+recordWeight*(records[i]-rm)/rs;
  return {teamId:t.teamId,name:t.name,record:t.record,wins:t.wins,losses:t.losses,ties:t.ties,pointsPerGame:t.pointsPerGame,
   score:clamp(Math.round(50+20*z),1,99),z,standingsRank:t.rank,allPlayWinPercent:round(t.apw*100,1),luckWins:round(t.luck),weeklyTiers:t.tiers};
 }).sort((a,b)=>b.z-a.z||a.teamId-b.teamId).map((t,i)=>({...t,rank:i+1,move:t.standingsRank-(i+1)}));
 return {schemaVersion:1,modelVersion:'cfn-earned-performance-v2',leagueId:input.league,season:input.season,currentWeek:input.currentWeek,
  throughWeek:G,source:'yahoo_final_matchups',sourceUpdatedAt:official.sourceUpdatedAt,recordWeight,stale:false,rows};
}
async function get(league,M) {
 if(!M.LGS.includes(league))throw Error('invalid_league');
 const c=await M.context({cachedOnly:true}),key=`mpower:v2:${M.SEASON}:${league}`;
 if(!c||c.season!==M.SEASON||!Number.isInteger(c.week)||c.week<2||c.week>18)throw Error('power_context_unavailable');
 const cached=await M.rget(key),valid=cached?.body?.currentWeek===c.week&&cached.body.season===c.season&&cached.body.modelVersion==='cfn-earned-performance-v2';
 if(valid&&Date.now()-cached.at<300000)return {...cached.body,stale:!!c.stale};
 try{
  if(c.stale)throw Error('power_calendar_delayed');
  const weeks=await Promise.all(Array.from({length:Math.min(c.week-1,14)},async(_,i)=>{
   const rec=await M.rget(`mw:${league}:${i+1}`)||await M.restore(league,i+1);
   if(!rec||rec.season!=null)return rec;
   const stamp=typeof rec.sourceUpdatedAt==='number'?rec.sourceUpdatedAt:Date.parse(rec.sourceUpdatedAt);
   return new Date(stamp).getUTCFullYear()===M.SEASON?{...rec,season:M.SEASON}:rec;
  }));
  const body=compute({league,season:c.season,currentWeek:c.week,weeks});
  await M.write(key,{at:Date.now(),body});return body;
 }catch(error){
  console.error(JSON.stringify({event:'power_refresh_failed',league,error:error.message}));
  if(valid)return {...cached.body,stale:true};
  throw error; // never call a prior week's rankings current
 }
}
module.exports={compute,get,normal};
