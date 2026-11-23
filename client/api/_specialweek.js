'use strict';
// Optional historical enrichment. Isolated from live score publishing and login.
const M=require('./_m'), IDS={gl:101813,bh:100398,rb:101720,sts:101814};
const text=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
function parse(html,league,pos,week){
 if(!html.includes('/f1/'+IDS[league]+'/players?')||!html.includes('stat1=S_W_'+week+'&')||!html.includes('pos='+pos+'&'))throw Error('wrong_history_page');
 const rows=[];
 for(const seg of html.split(/<tr\b/).slice(1)){
  const row=seg.split('</tr>')[0],name=/<a[^>]*class="[^"]*\bNowrap name\b[^>]*>([^<]+)<\/a>/.exec(row)?.[1];if(!name)continue;
  const tp=/\b([A-Z][A-Za-z]{1,2}) - (K|DEF)\b/.exec(text(row));if(!tp||tp[2]!==pos)throw Error('wrong_history_position');
  const score=/<td[^>]*class="[^"]*\bpts Selected\b[^>]*>([\s\S]*?)<\/td>/.exec(row)?.[1],raw=text(score);
  const status=text(/class="ysf-player-detail[^>]*>([\s\S]*?)<\/div>/.exec(row)?.[1]);
  const pts=/^-?\d+(\.\d+)?$/.test(raw)?Number(raw):null;
  const gp=/<td[^>]*class="[^"]*F-faded Bdrend[^>]*>([\s\S]*?)<\/td>/.exec(row)?.[1];
  // A zero is only a played game with GP=1. DNP is never a scored zero.
  const played=text(gp)==='1',bye=/\bBye\b/i.test(status);
  rows.push({name:text(name),pos,team:M.canon(tp[1]),pts:played?pts:null,status,played,bye});
 }
 if(!rows.length)throw Error('empty_history_page');return rows;
}
const memo=new Map(),pending=new Map();
async function get(league,pos,week,signal,completedWeek=false){
 const key=`special-log-week:v1:${M.SEASON}:${league}:${pos}:${week}`,old=memo.get(key)||await M.rget(key),age=old?Date.now()-old.at:Infinity;
 // Ongoing weeks may gain final results; never cache those for a whole day.
 if(old&&age<(completedWeek?86400000:300000))return old.rows;
 if(pending.has(key))return pending.get(key);
 const job=(async()=>{
  const all=[];
  for(const count of [0,25,50]){
   const u=`https://football.fantasysports.yahoo.com/f1/${IDS[league]}/players?status=ALL&pos=${pos}&stat1=S_W_${week}&count=${count}`;
   const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0 (compatible; cfn-site)'},signal:AbortSignal.any([signal,AbortSignal.timeout(6000)])});
   if(!r.ok||new URL(r.url).hostname!=='football.fantasysports.yahoo.com')throw Error('history_source_unavailable');
   const rows=parse(await r.text(),league,pos,week);all.push(...rows);
   if(rows.length<25)break;
  }
  const entry={at:Date.now(),rows:all};memo.set(key,entry);await M.rset(key,entry,30*86400);return all;
 })().catch(()=>old?.rows||[]).finally(()=>pending.delete(key));pending.set(key,job);return job;
}
module.exports={parse,get};
