'use strict';
// Read-only transactions for imported leagues. Separate keys, locks and clocks;
// never change the scoring calendar, standings, or push-delivery state.
const M=require('./_m'), C=require('./_connected'), F=require('./_feedmedia'), Y=require('./_ysweep');
const key=lg=>`connected:updates:v1:${M.SEASON}:${lg}`;
const check=(ok,why)=>{if(!ok)throw Error(why)};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const stamp=s=>Y.text(/class="Block F-timestamp[^>]*>([\s\S]*?)<\/span>/.exec(s)?.[1]||'');
function yahooDate(value){
 const m=/^(\w{3}) (\d{1,2}),\s*(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(value);
 check(m,'invalid_transaction_date');
 const month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m[1]);
 check(month>=0&&+m[2]<=31&&+m[3]>=1&&+m[3]<=12&&+m[4]<60,'invalid_transaction_date');
 const local=Date.UTC(month===0?M.SEASON+1:M.SEASON,month,+m[2],+m[3]%12+(m[5].toLowerCase()==='pm'?12:0),+m[4]);
 let utc=local+5*3600000;
 for(let i=0;i<2;i++){
  const offset=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',timeZoneName:'shortOffset'}).formatToParts(utc).find(p=>p.type==='timeZoneName').value;
  const hours=Number(/GMT([+-]\d+)/.exec(offset)?.[1]);check(finite(hours),'invalid_timezone');utc=local-hours*3600000;
 }
 return new Date(utc).toISOString();
}
function yahooTable(html,providerId=697400){
 check(Number.isSafeInteger(providerId)&&providerId>0,'invalid_provider_id');
 check(new RegExp('rel="canonical"[^>]*href="https://football.fantasysports.yahoo.com/f1/'+providerId+'/transactions').test(html),'wrong_transactions_league');
 const table=/<table\b[^>]*Tst-transaction-table[^>]*>([\s\S]*?)<\/table>/.exec(html)?.[1];
 check(table,'missing_transactions');
 return table;
}
function teamMap(snapshot){
 check(snapshot?.season===M.SEASON&&['fb'].includes(snapshot.leagueId)&&snapshot.matchups?.length===6,'missing_transaction_teams');
 const teams=new Map(snapshot.matchups.flatMap(m=>[m.home,m.away]).map(t=>[t.id,t]));
 check(teams.size===12,'incomplete_transaction_teams');return teams;
}
function recipient(row,teams,providerId=697400){
 const cell=/<td[^>]*class="Ta-end"[^>]*>([\s\S]*?)<\/td>/.exec(row)?.[1];
 const id=Number(new RegExp('href="(?:https://football.fantasysports.yahoo.com)?/f1/'+providerId+'/(\\d+)"').exec(cell||'')?.[1]);
 check(teams.has(id),'unknown_transaction_team');return teams.get(id);
}
function yahooClaims(html,teams,{providerId=697400,leagueId='fb'}={}){
 check(['fb',...M.LGS].includes(leagueId),'invalid_claim_league');
 const table=yahooTable(html,providerId),items=[];
 for(const row of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)){
  if(!/title="Added Player"/.test(row[1]))continue;
  for(const part of row[1].matchAll(/<div class="Pbot-xs">([\s\S]*?)<\/div>/g)){
   const label=Y.text(/<h6[^>]*>([\s\S]*?)<\/h6>/.exec(part[1])?.[1]||'');
   const bid=/^(?:\$(\d+)\s+)?Waiver$/.exec(label);if(!bid)continue;
   const name=Y.text(/<a href="https:\/\/sports.yahoo.com\/nfl\/(?:players\/\d+|teams\/[^"/]+\/?)"[^>]*>([\s\S]*?)<\/a>/.exec(part[1])?.[1]||'');
   const pos=/^([\w]+) - (QB|RB|WR|TE|K|DEF)$/.exec(Y.text(/class="F-position[^>]*>([\s\S]*?)<\/span>/.exec(part[1])?.[1]||''));
   check(name&&pos,'invalid_waiver_player');const team=recipient(row[1],teams,providerId),at=yahooDate(stamp(row[1]));
   const asset=F.asset(name,pos[2],pos[1].toUpperCase());
   items.push({id:leagueId+':claim:'+M.sha([at,team.id,name].join('|')).slice(0,24),kind:'waiver',publishedAt:at,teamId:team.id,player:name,teamName:Y.text(/class="Tst-team-name"[^>]*>([\s\S]*?)<\/a>/.exec(row[1])?.[1]||team.name),position:pos[2],nflTeam:pos[1].toUpperCase(),amount:bid[1]==null?null:+bid[1],asset});
  }
 }
 const dates=[...table.matchAll(/class="Block F-timestamp[^>]*>([\s\S]*?)<\/span>/g)].map(m=>yahooDate(Y.text(m[1])));
 check(dates.length||/No recent transactions/.test(table),'unrecognized_claim_table');
 return {items,oldestAt:dates.sort()[0]||null,hasNext:/href="\?transactionsfilter=all(?:&amp;|&)count=\d+"[^>]*>Next 25<\/a>/.test(html)};
}
function yahooTrades(html,teams){
 const table=yahooTable(html),groups=[];
 for(const row of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)){
  const r=row[1];if(!/Traded to|Vetoed Trade to/.test(r))continue;
  if(/rowspan=["']?2/.test(r)||!groups.length)groups.push([]);
  const cell=/<td[^>]*class="No-pstart"[^>]*>([\s\S]*?)<\/td>/.exec(r)?.[1]||'';
  const assets=[...cell.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m=>{
   const name=Y.text(/<a href="https:\/\/sports.yahoo.com\/nfl\/(?:players\/\d+|teams\/[^"/]+\/?)"[^>]*>([\s\S]*?)<\/a>/.exec(m[1])?.[1]||m[1]).replace(/^Round (\d+)(?!\d)/,'Round $1 pick');return F.asset(name);
  });
  groups.at(-1).push({teamId:recipient(r,teams).id,assets,at:yahooDate(stamp(r)),veto:/Vetoed Trade to/.test(r)});
 }
 if(!groups.length)check(/No recent transactions/.test(table),'unrecognized_trade_table');
 return groups.filter(g=>!g.some(s=>s.veto)).map(g=>{
  check(g.length===2&&g[0].teamId!==g[1].teamId&&g.every(s=>s.assets.length&&s.assets.every(a=>a.name)&&s.at===g[0].at),'incomplete_trade');
  const sides=g.map(s=>({teamId:s.teamId,assets:s.assets})).sort((a,b)=>a.teamId-b.teamId),at=g[0].at;
  return {id:'fb:trade:'+M.sha(JSON.stringify([at,sides])).slice(0,24),kind:'trade',publishedAt:at,sides};
 });
}
function sleeperTransactions(rows,teams,players,week){
 check(Array.isArray(rows),'invalid_transactions');const items=[];
 const asset=id=>{const p=players[id];check(p?.full_name&&p.position,'unknown_transaction_player');return F.asset(p.full_name,p.position==='DST'?'DEF':p.position,p.team||'')};
 for(const t of rows){
  if(t.status!=='complete'||!['trade','waiver'].includes(t.type))continue;
  check(/^\d+$/.test(t.transaction_id)&&t.leg===week&&finite(t.status_updated)&&Array.isArray(t.roster_ids)&&t.roster_ids.every(id=>teams.has(id)),'invalid_transaction');
  const at=new Date(t.status_updated).toISOString(),id='sl:'+t.type+':'+t.transaction_id;
  if(t.type==='waiver'){
   for(const [p,teamId] of Object.entries(t.adds||{})){check(teams.has(teamId),'invalid_claim_owner');const a=asset(p);items.push({id:id+':'+p,kind:'waiver',week,publishedAt:at,teamId,player:a.name,asset:a,amount:finite(t.settings?.waiver_bid)?t.settings.waiver_bid:null});}
  }else{
   const sides=t.roster_ids.map(teamId=>({teamId,assets:[]}));const side=id=>{const s=sides.find(s=>s.teamId===id);check(s,'invalid_trade_owner');return s};
   for(const [p,teamId] of Object.entries(t.adds||{})){check(t.drops?.[p]!=null&&t.drops[p]!==teamId,'invalid_trade_direction');side(t.drops[p]);side(teamId).assets.push(asset(p));}
   for(const p of t.draft_picks||[]){check(Number.isInteger(p.round)&&p.round>0&&/^\d{4}$/.test(p.season)&&teams.has(p.roster_id)&&p.previous_owner_id!==p.owner_id,'invalid_pick');side(p.previous_owner_id);side(p.owner_id).assets.push({name:`${p.season} Round ${p.round} pick (${teams.get(p.roster_id).name})`,kind:'pick'});}
   for(const b of t.waiver_budget||[]){check(finite(b.amount)&&b.amount>=0,'invalid_budget');side(b.sender);side(b.receiver).assets.push({name:`$${b.amount} FAB`,kind:'budget'});}
   check(sides.length>=2&&sides.every(s=>s.assets.length),'incomplete_trade');items.push({id,kind:'trade',week,publishedAt:at,sides});
  }
 }
 return items;
}
const merge=(old,items)=>[...new Map([...old,...items].map(t=>[t.id,t])).values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
async function page(filter,count=0){
 const url=`https://football.fantasysports.yahoo.com/f1/697400/transactions?transactionsfilter=${filter}&count=${count}`;
 const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; cfn-site)'},signal:AbortSignal.timeout(10000)});
 check(r.ok&&new URL(r.url).hostname==='football.fantasysports.yahoo.com','transactions_unavailable');return r.text();
}
async function refresh(lg,week,{force=false}={}){
 check(['fb'].includes(lg)&&Number.isInteger(week)&&week>=1&&week<=18,'invalid_scope');
 const k=key(lg),saved=await M.read(k)||{items:[],cursor:0,backfilled:[]};
 if(!force&&Date.now()-Date.parse(saved.observedAt)<900000)return {cached:true};
 const lock=await M.lock(k+':lock',55);if(!lock)return {busy:true};
 try{
  const snapshot=await M.read(`connected:v1:${lg}:${M.SEASON}:${week}`),teams=teamMap(snapshot);check(snapshot.leagueId===lg,'wrong_transaction_snapshot');
  let items=[],next={...saved};
  if(lg==='fb'){
   const [trades,head]=await Promise.all([page('trade'),page('all')]);
   items.push(...yahooTrades(trades,teams),...yahooClaims(head,teams).items);
   // Two historical pages per run; resume after success. No unbounded scrape.
   if(!saved.historyComplete){let cursor=saved.cursor||25;for(let i=0;i<2;i++){const result=yahooClaims(await page('all',cursor),teams);items.push(...result.items);cursor+=25;if(!result.hasNext){next.historyComplete=true;break}}next.cursor=cursor;}
   // Recheck page two after bootstrap to cover busy waiver days (>25 moves).
   else items.push(...yahooClaims(await page('all',25),teams).items);
  }else{
   const players=await C.playerDictionary(),past=Array.from({length:week},(_,i)=>week-i).find(w=>w!==week&&!saved.backfilled.includes(w));
   for(const w of [week,past].filter(Boolean)){
    const rows=await M.jfetch(`https://api.sleeper.app/v1/league/${C.CONFIG.sl.providerId}/transactions/${w}`,10000);
    items.push(...sleeperTransactions(rows,teams,players,w));next.backfilled=[...new Set([...next.backfilled,w])];
   }
  }
  next={...next,schemaVersion:1,leagueId:lg,season:M.SEASON,items:merge(saved.items,items),observedAt:new Date().toISOString()};
  await M.write(k,next,180*86400);return {items:next.items.length,historyComplete:next.historyComplete??next.backfilled.length>=week};
 }finally{await M.unlock(k+':lock',lock)}
}
async function refreshScheduled(week){
 const results=await Promise.allSettled(['fb'].map(lg=>refresh(lg,week)));
 let calendarReady=true;try{await calendar()}catch{calendarReady=false}
 return {...Object.fromEntries(results.map((r,i)=>[['fb'][i],r.status==='fulfilled'?r.value:{unavailable:true,error:r.reason.message}])),calendarReady};
}
async function calendar(){
 const k=`connected:updates:calendar:${M.SEASON}`,saved=await M.read(k);if(saved)return saved;
 const j=await M.jfetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${M.SEASON}&seasontype=2&week=1`);
 const entries=j.leagues?.[0]?.calendar?.find(c=>c.value==='2')?.entries;
 check(j.season?.year===M.SEASON&&entries?.length===18&&entries.every(e=>Number(e.value)>=1&&Number(e.value)<=18&&Date.parse(e.startDate)<Date.parse(e.endDate)),'invalid_transaction_calendar');
 await M.write(k,entries,86400);return entries;
}
function posts(lg,saved,teams,entries,now=Date.now()){
 const out=[],groups=new Map();
 const side=s=>{const t=teams.get(s.teamId);check(t,'unknown_feed_team');return {teamId:t.id,name:t.name,owner:t.manager||undefined,logoURL:t.logoURL||null,assets:s.assets,players:s.assets.map(a=>a.name)}};
 for(const item of saved.items){
  if(Date.parse(item.publishedAt)>now)continue;
  if(item.kind==='trade')out.push({id:item.id,kind:'trade',leagueId:lg,title:'Completed trade',body:item.sides.map(s=>`${teams.get(s.teamId)?.name||'Team '+s.teamId} receives ${s.assets.map(a=>a.name).join(', ')}`).join(' · '),publishedAt:item.publishedAt,sides:item.sides.map(side)});
  else {
   const week=item.week||Number(entries.find(e=>Date.parse(item.publishedAt)>=Date.parse(e.startDate)&&Date.parse(item.publishedAt)<=Date.parse(e.endDate)+60000)?.value);
   // Preseason or unmapped claims retain their actual date, never a guessed week.
   const group=week?`week-${week}`:item.publishedAt.slice(0,10),g=groups.get(group)||{week:week||null,items:[]};g.items.push(item);groups.set(group,g);
  }
 }
 for(const [group,g] of groups){const claims=g.items.map(i=>({player:i.player,team:teams.get(i.teamId)?.name||'Team '+i.teamId,amount:i.amount,asset:i.asset}));out.push({id:`waivers:${M.SEASON}:${lg}:${group}`,kind:'waivers',leagueId:lg,week:g.week,title:g.week?`Week ${g.week} waiver report`:'Waiver report',body:`${claims.length} successful claims · one report`,publishedAt:g.items.map(i=>i.publishedAt).sort().at(-1),claims});}
 return out;
}
async function memberPosts(member){
 const leagues=['fb'].filter(lg=>C.assignedTeam(member,lg)!=null);if(!leagues.length)return [];
 const context=await M.context({cachedOnly:true});if(!context)return [];
 const entries=await M.rget(`connected:updates:calendar:${M.SEASON}`)||[];
 const results=await Promise.allSettled(leagues.map(async lg=>{const [saved,snapshot]=await Promise.all([M.rget(key(lg)),M.rget(`connected:v1:${lg}:${M.SEASON}:${context.week}`)]);if(!saved||!snapshot)return [];return posts(lg,saved,teamMap(snapshot),entries);}));
 return results.flatMap(r=>r.status==='fulfilled'?r.value:[]);
}
module.exports={yahooDate,yahooClaims,yahooTrades,sleeperTransactions,teamMap,merge,posts,refresh,refreshScheduled,memberPosts,calendar};
