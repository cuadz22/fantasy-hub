'use strict';
// Additive read-only Yahoo resources. Never writes scoring, calendar, or official standings.
const M=require('./_m'), BASE=require('./_resources.json');
const KEY='league-resources:v1:2026', IDS={gl:101813,bh:100398,rb:101720,sts:101814};
const text=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/\s+/g,' ').trim();
function players(html){
 const re=/<a\b[^>]*class="[^"]*\bNowrap name\b[^>]*>([\s\S]*?)<\/a>/g,all=[...html.matchAll(re)];
 return all.map((m,i)=>({name:text(m[1]),segment:html.slice(m.index,all[i+1]?.index||html.length)}));
}
function cantcut(html){
 if(!/Can't Cut|Can’t Cut|Can&#39;t Cut/i.test(html))throw Error('wrong_cantcut_page');
 const names=players(html).map(p=>p.name);
 if(names.length<10||names.length>70||new Set(names).size!==names.length)throw Error('incomplete_cantcut_list');
 return names;
}
function quarterbacks(html){
 if(!new RegExp('value="S_S_'+M.SEASON+'" selected').test(html))throw Error('wrong_scoring_season');
 const rows=players(html).slice(0,10).map(p=>{
  if(!/ - QB</.test(p.segment))throw Error('wrong_player_position');
  const cell=/<td[^>]*class="[^"]*\bpts Selected\b[^>]*>([\s\S]*?)<\/td>/.exec(p.segment);
  const score=cell?Number(text(cell[1])):NaN;
  if(!Number.isFinite(score))throw Error('missing_fantasy_points');
  return {name:p.name,points:score};
 });
 if(rows.length!==10||new Set(rows.map(r=>r.name)).size!==10||rows.some((r,i)=>i&&r.points>rows[i-1].points))throw Error('invalid_qb_ranking');
 return rows;
}
function trades(html,lg){
 if(!html.includes('Tst-transaction-table'))throw Error('wrong_transactions_page');
 const rows=html.split(/<tr[\s>]/).filter(r=>/Traded to|Vetoed Trade to/.test(r)),blocks=[];
 for(const r of rows){
  if(/rowspan=.?2/.test(r)||!blocks.length)blocks.push([]);
  const cell=/<td class="No-pstart">([\s\S]*?)<\/td>/.exec(r)?.[1]||'';
  const id=Number(/class="Ta-end"[\s\S]*?href="(?:https:\/\/football.fantasysports.yahoo.com)?\/f1\/\d+\/(\d+)"/.exec(r)?.[1]);
  const t=BASE.tools.teams[lg]?.find(t=>t.id===id);
  const date=text(/class="Block F-timestamp[^>]*>([\s\S]*?)<\/span>/.exec(r)?.[1]).split(',')[0];
  const gets=[...cell.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m=>{
   const player=/<a href="https:\/\/sports.yahoo.com\/nfl\/(?:players\/\d+|teams\/[^"/]+\/?)"[^>]*>([\s\S]*?)<\/a>/.exec(m[1]);
   if(player)return text(player[1]);
   return text(m[1]).replace(/^Round (\d+)/,'Round $1 pick');
  }).filter(Boolean);
  blocks.at(-1).push({date,veto:/Vetoed Trade to/.test(r),side:t&&{mgr:t.mgr,team:t.team,gets}});
 }
 if(!blocks.length)throw Error('empty_transactions_page');
 return blocks.filter(b=>!b.some(r=>r.veto)).map(b=>{
  if(b.length!==2||b.some(r=>!r.side||!r.side.gets.length||!/^\w{3} \d{1,2}$/.test(r.date))||b[0].date!==b[1].date||b[0].side.team===b[1].side.team)throw Error('incomplete_trade');
  return {date:b[0].date,a:b[0].side,b:b[1].side};
 });
}
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const tradeKey=t=>JSON.stringify([t.date,[t.a,t.b].map(s=>[norm(s.team),s.gets.filter(x=>!x.includes('FAB')).map(x=>norm(x.replace(/\s*\(traded from.*$/i,''))).sort()]).sort((a,b)=>a[0].localeCompare(b[0]))]);
function mergeTrades(saved,live){const seen=new Set(saved.map(tradeKey));return [...live.filter(t=>!seen.has(tradeKey(t))),...saved];}
async function page(path){const r=await fetch('https://football.fantasysports.yahoo.com/f1/'+path,{headers:{'User-Agent':'Mozilla/5.0 (compatible; cfn-site)'},signal:AbortSignal.timeout(12000)});if(!r.ok||new URL(r.url).hostname!=='football.fantasysports.yahoo.com')throw Error('yahoo_unavailable');return r.text();}
async function refresh(kind){
 const lock=await M.lock(KEY+':lock',55);if(!lock)return {busy:true};
 try{
  const saved=await M.read(KEY)||{},now=new Date().toISOString();
  if(kind==='cantcut'){
   const [a,b]=await Promise.all([page(IDS.bh+'/cantcutlist'),page(IDS.rb+'/players?status=ALL&pos=QB&stat1=S_S_'+M.SEASON+'&sort=PTS&sdir=1')]);
   const list=cantcut(a),qbs=quarterbacks(b);
   saved.cc={list,qb10:qbs.map(p=>p.name),quarterbacks:qbs,asof:now.slice(0,10),sourceUpdatedAt:now};
  }else{
   const loaded=await Promise.allSettled(Object.keys(IDS).map(async lg=>[lg,trades(await page(IDS[lg]+'/transactions?transactionsfilter=trade&count=0'),lg)]));
   saved.tradeFreshness||={}; const failed=[];
   loaded.forEach((result,i)=>{
    const lg=Object.keys(IDS)[i];
    if(result.status==='rejected'){failed.push(lg);return;}
    const [,items]=result.value;saved.trades||={};saved.trades[lg]=mergeTrades(saved.trades[lg]||BASE.tools.trades[lg]||[],items);saved.tradeFreshness[lg]=now;
   });
   if(!failed.length)saved.tradesUpdatedAt=now;
   await M.write(KEY,saved);memo=null;
   if(failed.length)throw Error('trade_refresh_incomplete_'+failed.join('_'));
   return {kind,updatedAt:now,leagues:Object.keys(IDS)};
  }
  await M.write(KEY,saved);memo=null;return {kind,updatedAt:now};
 }finally{await M.unlock(KEY+':lock',lock)}
}
let memo=null;
async function resources(){
 if(memo&&Date.now()-memo.at<60000)return memo.body;
 const [saved,waivers]=await Promise.all([M.rget(KEY),require('./_waivers').reports()]);
 const body={...BASE,tools:{...BASE.tools,cc:saved?.cc||BASE.tools.cc,trades:{...BASE.tools.trades,...saved?.trades},waivers:Object.fromEntries(M.LGS.map(lg=>[lg,require('./_waivers').overlay(BASE.tools.waivers[lg]||[],waivers[lg])]))},resourceFreshness:{cantCut:saved?.cc?.sourceUpdatedAt||null,trades:saved?.tradesUpdatedAt||null,tradeLeagues:saved?.tradeFreshness||{},waiverLeagues:Object.fromEntries(M.LGS.map(lg=>[lg,waivers[lg]?.checkedAt||null]))}};
 memo={at:Date.now(),body};return body;
}
module.exports={cantcut,quarterbacks,trades,mergeTrades,refresh,resources};
