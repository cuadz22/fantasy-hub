'use strict';
// Independent, durable waiver reports. Never writes scores, rosters or the current week.
const M=require('./_m'), R=require('./_resources.json'), T=require('./_connectedUpdates'), W=require('./_weekrollover');
const IDS={gl:101813,bh:100398,rb:101720,sts:101814};
const key=lg=>`waiver-reports:v1:${M.SEASON}:${lg}`;
function due(now=Date.now()){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',hourCycle:'h23'}).formatToParts(now).map(x=>[x.type,x.value]));
 return +p.hour===6 || (p.weekday==='Wed' && +p.hour>=7 && +p.hour<=12);
}
async function page(lg,count){
 const url=`https://football.fantasysports.yahoo.com/f1/${IDS[lg]}/transactions?transactionsfilter=all&count=${count}`;
 const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; cfn-site)'},signal:AbortSignal.timeout(8000)});
 if(!r.ok||new URL(r.url).hostname!=='football.fantasysports.yahoo.com')throw Error('waivers_source_unavailable');
 return r.text();
}
async function collect(lg,week,{now=Date.now(),load=page}={}){
 if(!IDS[lg]||!Number.isInteger(week)||week<1||week>18||W.scheduledWeek(M.SEASON,now)!==week)throw Error('waivers_invalid_scope');
 const teams=new Map(R.tools.teams[lg].map(t=>[t.id,{id:t.id,name:t.team}]));
 const items=[];let complete=false,pages=0;
 for(let count=0;count<100;count+=25){
  const parsed=T.yahooClaims(await load(lg,count),teams,{providerId:IDS[lg],leagueId:lg});pages++;
  for(const item of parsed.items){
   const at=Date.parse(item.publishedAt);if(at>now)throw Error('waivers_future_claim');
   if(W.scheduledWeek(M.SEASON,at)===week)items.push(item);
  }
  if(!parsed.hasNext || (parsed.oldestAt && W.scheduledWeek(M.SEASON,Date.parse(parsed.oldestAt))<week)){complete=true;break;}
 }
 if(!complete)throw Error('waivers_pagination_incomplete');
 return {items:T.merge([],items),pages};
}
async function refreshLeague(lg,week,{now=Date.now(),store=M,load=page}={}){
 const k=key(lg),token=await store.lock(k+':lock',55);if(!token)return {busy:true};
 try{
  const saved=await store.read(k);
  if(saved?.week===week&&now-Date.parse(saved.checkedAt)<30*60000)return {cached:true,claims:saved.rows.filter(r=>r.week===week).length};
  const {items,pages}=await collect(lg,week,{now,load});
  // The first import is a silent recovery, not a burst of historical push alerts.
  const silentWeeks=saved?.silentWeeks||[week];
  const rows=items.map(i=>({id:i.id,week,date:new Date(i.publishedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'America/New_York'}),publishedAt:i.publishedAt,player:i.player,position:i.position,nflTeam:i.nflTeam,winner:i.teamName,teamId:i.teamId,asset:i.asset,bids:i.amount==null?[]:[{manager:i.teamName,amount:i.amount,won:true}],suppressNotification:silentWeeks.includes(week)}));
  // Preserve all earlier editions and confirmed claims on partial provider regressions.
  const merged=[...new Map([...(saved?.rows||[]),...rows].map(r=>[r.id,r])).values()].sort((a,b)=>(b.publishedAt||b.date).localeCompare(a.publishedAt||a.date));
  const report={schemaVersion:1,season:M.SEASON,leagueId:lg,week,rows:merged,silentWeeks,checkedAt:new Date(now).toISOString(),sourceURL:`https://football.fantasysports.yahoo.com/f1/${IDS[lg]}/transactions`};
  await store.write(k,report);return {week,claims:merged.filter(r=>r.week===week).length,pages,checkedAt:report.checkedAt};
 }finally{await store.unlock(k+':lock',token)}
}
async function scheduled({force=false,now=Date.now()}={}){
 if(!force&&!due(now))return {skipped:'outside_waiver_window'};
 const context=await M.context({cachedOnly:true});
 if(!context||context.season!==M.SEASON||context.week!==W.scheduledWeek(M.SEASON,now))throw Error('waivers_calendar_not_ready');
 const results=await Promise.allSettled(M.LGS.map(lg=>refreshLeague(lg,context.week,{now})));
 const leagues=Object.fromEntries(results.map((r,i)=>[M.LGS[i],r.status==='fulfilled'?r.value:{error:r.reason.message}]));
 const failed=M.LGS.filter(lg=>leagues[lg].error);
 if(failed.length)throw Error('waivers_refresh_failed_'+failed.join('_'));
 return {week:context.week,leagues};
}
async function reports(){
 try{
  const raw=await M.command(['MGET',...M.LGS.map(key)]);
  return Object.fromEntries(M.LGS.map((lg,i)=>{const r=raw[i]?JSON.parse(raw[i]):null;return [lg,r?.season===M.SEASON&&r.leagueId===lg&&Array.isArray(r.rows)?r:null]}));
 }catch{return {}} // Optional report outage must never block scores or login.
}
function overlay(base,report){
 if(!report)return base;
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const identity=r=>[r.week,norm(r.player),norm(r.winner)].join(':');
 const out=new Map(base.map(r=>[identity(r),r]));
 for(const r of report.rows){const old=out.get(identity(r));out.set(identity(r),old?{...old,...r,bids:old.bids?.length>r.bids.length?old.bids:r.bids}:r);}
 return [...out.values()].sort((a,b)=>b.week-a.week||(b.publishedAt||b.date).localeCompare(a.publishedAt||a.date));
}
module.exports={IDS,key,due,collect,refreshLeague,scheduled,reports,overlay};
