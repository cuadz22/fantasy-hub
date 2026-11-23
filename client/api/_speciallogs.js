'use strict';
// K/DST history is the selected league's recorded Yahoo result, never offensive
// scoring rules or another league's points. This reader cannot modify live data.
const M=require('./_m');
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const position=s=>/^(DEF|DST|D\/ST)$/i.test(s)?'DEF':String(s||'').toUpperCase();
const memo=new Map(),pending=new Map();
function build(records,{name,pos,league,team}){
 const target=position(pos), log=[], missingWeeks=[];
 for(let week=1;week<=18;week++){
  const rec=records[week-1];
  if(!rec||(rec.season!==M.SEASON && !(rec.season==null && M.SEASON===2026))||rec.lg!==league||rec.week!==week||rec.partial||rec.upcoming)continue;
  const rows=(rec.matchups||[]).flatMap(m=>[...(m.L||[]),...(m.R||[])]).filter(r=>position(r[2])===target&&(norm(r[1])===norm(name)||(target==='DEF'&&team&&M.canon(r[3])===M.canon(team))));
  if(!rows.length){missingWeeks.push(week);continue;}
  // Conflicting duplicate records cannot silently choose a score.
  if(new Set(rows.map(r=>JSON.stringify([r[5],r[6]]))).size!==1){missingWeeks.push(week);continue;}
  const r=rows[0],status=String(r[6]||''),bye=/\bbye\b/i.test(status),out=/^OUT$/i.test(status);
  const final=/^Final\b/i.test(status), pts=typeof r[5]==='number'&&Number.isFinite(r[5])?r[5]:null;
  const opp=/(?:\bvs?\s+|@\s*)([a-z]{2,3})\b/i.exec(status);
  if(!bye&&!final)continue;
  log.push({wk:week,opp:bye?'BYE':opp?(opp[0].startsWith('@')?'@':'vs ')+opp[1].toUpperCase():'—',line:bye?'BYE':out?'OUT':status,pts:bye||out?null:pts,fin:final&&!bye&&!out,bye,out,source:'yahoo-league-history'});
 }
 return {log:log.reverse(),wks:log.filter(r=>!r.bye).map(r=>r.wk).sort((a,b)=>a-b),ch:null,source:'yahoo-league-history',missingWeeks,statsAvailable:false};
}
async function history(query){
 if(!M.LGS.includes(query.league)||!['QB','RB','WR','TE','K','DEF'].includes(position(query.pos)))throw Error('unsupported_history');
 let records=memo.get(query.league);
 if(!records||Date.now()-records.at>300000){
  if(!pending.has(query.league))pending.set(query.league,(async()=>{
   const raw=await M.command(['MGET',...Array.from({length:18},(_,i)=>'mw:'+query.league+':'+(i+1))],6000);
   if(!Array.isArray(raw)||raw.length!==18)throw Error('history_unavailable');
   const entry={at:Date.now(),rows:raw.map(v=>v?JSON.parse(v):null)};memo.set(query.league,entry);return entry;
  })().finally(()=>pending.delete(query.league)));
  records=await pending.get(query.league);
 }
 const result=build(records.rows,query);
 if(!['K','DEF'].includes(position(query.pos)))return result;
 const queue=[...result.missingWeeks],signal=AbortSignal.timeout(10000);
 await Promise.all(Array.from({length:3},async()=>{while(queue.length&&!signal.aborted){
  const week=queue.shift(),rows=await require('./_specialweek').get(query.league,position(query.pos),week,signal,records.rows[week-1]?.final===true);
  const candidates=rows.filter(r=>norm(r.name)===norm(query.name)||(position(query.pos)==='DEF'&&query.team&&M.canon(r.team)===M.canon(query.team)));
  if(candidates.length!==1)continue;
  const row=candidates[0],final=/^Final\b/i.test(row.status),opp=/(?:\bvs?\s+|@\s*)([a-z]{2,3})\b/i.exec(row.status);
  if(!row.bye&&!(final&&row.played&&row.pts!=null))continue;
  result.log.push({wk:week,opp:row.bye?'BYE':opp?(opp[0].startsWith('@')?'@':'vs ')+opp[1].toUpperCase():'—',line:row.bye?'BYE':row.status,pts:row.bye?null:row.pts,fin:final&&!row.bye,bye:row.bye,source:'yahoo-weekly-statistics'});
  result.missingWeeks=result.missingWeeks.filter(w=>w!==week);
 }}));
 result.log.sort((a,b)=>b.wk-a.wk);result.wks=result.log.filter(r=>!r.bye).map(r=>r.wk).sort((a,b)=>a-b);
 return result;
}
module.exports={build,history,position};
