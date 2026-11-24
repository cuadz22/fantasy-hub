'use strict';
// Editorial snapshots are separate from scoring, roster, calendar and standings keys.
const M=require('./_m'), A=require('./_mauth'), MEDIA=require('./_media.json');
const names={gl:'Gentlemen’s League',bh:'Beaners & Husseins',rb:'Rebirth',sts:'Shoot the Shits'};
const INDEX='recaps:v1:'+M.SEASON+':index';
const BENCH=new Set(['BN','BE','BENCH','IR','IR+','RES','NA','PUP','TAXI']);
const counts={QB:1,RB:2,WR:4,TE:1};
const money=n=>n.toFixed(2), finite=n=>typeof n==='number'&&Number.isFinite(n);
const key=id=>'recaps:v1:edition:'+id;
const valid=id=>new RegExp('^recap:'+M.SEASON+':(gl|bh|rb|sts):([1-9]|1[0-8])$').test(id||'');
function derive(feed,table,media=MEDIA.teams[feed.leagueId]){
 const {leagueId,season,week}=feed;
 if(!names[leagueId]||season!==M.SEASON||!Number.isInteger(week)||week<1||week>14||feed.freshness?.final!==true||feed.freshness?.partial||feed.matchups?.length!==6)throw Error('final_results_required');
 if(table.leagueId!==leagueId||table.season!==season||table.throughWeek!==week||table.stale||table.rows?.length!==12)throw Error('matching_standings_required');
 const rows=leagueId==='sts'?table.customRows:table.rows;
 if(!rows||rows.length!==12)throw Error('league_ranking_required');
 const seen=new Set(),players=[],warnings=[];
 const matches=feed.matchups.map(m=>{
  if(m.teams?.length!==2||typeof m.matchupId!=='string'||!m.matchupId.startsWith(`${leagueId}-${season}-w${week}-`))throw Error('invalid_matchup');
  const teams=m.teams.map(t=>{
   if(!Array.isArray(t.lineup)||!Number.isInteger(t.teamId)||seen.has(t.teamId)||!finite(t.pointsToDate))throw Error('invalid_team');seen.add(t.teamId);
   const standing=rows.find(r=>r.teamId===t.teamId);if(!standing||standing.wins+standing.losses+standing.ties!==week)throw Error('invalid_record');
   const starters=t.lineup.filter(p=>!BENCH.has(String(p.slot||'').toUpperCase())).map(p=>{
    const position=['DST','D/ST'].includes(p.position)?'DEF':p.position;
    if(!['QB','RB','WR','TE','K','DEF'].includes(position))throw Error('unknown_position');
    if(p.points==null&&!/bye|out|inactive/i.test(p.gameStatus||''))throw Error('unresolved_starter');
    if(p.points!=null&&!finite(p.points))throw Error('invalid_points');
    return {id:String(p.playerId||`${t.teamId}:${p.name}`),name:p.name,position,points:p.points,photoURL:p.photoURL||null,owner:media?.[t.teamId]?.managerName||t.name,teamId:t.teamId,teamName:t.name,teamLogoURL:media?.[t.teamId]?.logoURL||null};
   });
   if(Math.abs(starters.reduce((s,p)=>s+(p.points??0),0)-t.pointsToDate)>.011)throw Error('starter_total_mismatch');
   const eligible=starters.filter(p=>p.points!=null).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name));players.push(...eligible);
   if(!eligible.length)throw Error('missing_starters');
   return {teamId:t.teamId,name:t.name,owner:media?.[t.teamId]?.managerName||t.name,logoURL:media?.[t.teamId]?.logoURL||null,points:t.pointsToDate,record:standing.record,rank:standing.rank,topPlayers:eligible.slice(0,3),leaders:eligible.filter(p=>p.points===eligible[0].points)};
  }).sort((a,b)=>b.points-a.points||a.teamId-b.teamId);
  const tied=teams[0].points===teams[1].points,margin=Math.round((teams[0].points-teams[1].points)*100)/100;
  if(tied)warnings.push(`Tied matchup: ${teams.map(t=>t.name).join(' / ')}`);
  const leaders=tied?[]:teams[0].leaders;
  const headline=tied?`${teams[0].name} and ${teams[1].name} finish level`:`${teams[0].owner} gets the win`;
  const body=tied?`Both sides finished on ${money(teams[0].points)} points.`:`${teams[0].name} beat ${teams[1].name}, ${money(teams[0].points)}–${money(teams[1].points)}. ${leaders.map(p=>p.name).join(' and ')} ${leaders.length===1?'led':'shared the lead for'} the winning lineup with ${money(leaders[0].points)} points${leaders.length>1?' each':''}. ${teams[0].owner} finishes Week ${week} at ${teams[0].record}; ${teams[1].owner} is ${teams[1].record}.`;
  return {id:m.matchupId,teams,margin,tied,leaders,headline,body};
 });
 if(seen.size!==12||rows.some(r=>!seen.has(r.teamId)))throw Error('missing_teams');
 const teamOfWeek=[];
 for(const [pos,count] of Object.entries(counts)){
  const pool=players.filter(p=>p.position===pos).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name));
  if(pool.length<count)throw Error('missing_position_'+pos);
  const cutoff=pool[count-1].points;const tied=pool.filter(p=>p.points===cutoff);
  if(pool[count]?.points===cutoff)warnings.push(`${pos} selection tie at ${money(cutoff)} points: ${tied.map(p=>p.name).join(', ')}`);
  teamOfWeek.push(...pool.slice(0,count));
 }
 const wins=matches.filter(m=>!m.tied),award=(kind,title,subtitle,score,max=false)=>{
  if(!wins.length)return null;const value=(max?Math.max:Math.min)(...wins.map(score));
  const selected=wins.filter(m=>Math.abs(score(m)-value)<.001);
  return {id:kind,title,subtitle,matchupIds:selected.map(m=>m.id)};
 };
 const awards=[award('close','Close call','The narrowest win',m=>m.margin),award('lucky','Lucky MF','Lowest score in a win',m=>m.teams[0].points),award('hardluck','Fantasy is all luck','Highest score in a loss',m=>m.teams[1].points,true),award('manager','Manager of the Week','The highest-scoring team',m=>m.teams[0].points,true)].filter(Boolean);
 const best=matches.flatMap(m=>m.teams).sort((a,b)=>b.points-a.points)[0];
 const standings=rows.map(r=>({teamId:r.teamId,name:r.name,rank:r.rank,record:r.record,pointsFor:r.pointsFor,customPoints:r.customPoints??null,logoURL:media?.[r.teamId]?.logoURL||null}));
 const lead=standings[0];
 let context=leagueId==='sts'?`${lead.name} leads the league table with ${lead.customPoints} league points. The table below includes the league’s win and top-six scoring system.`:`${lead.name} sits first at ${lead.record}, with ${money(lead.pointsFor)} points for. The table below includes every final result through Week ${week}.`;
 // Use only rules that explicitly state the field size; never infer a clinch.
 const rules=require('./_resources.json').tools.rules[leagueId]?.sections||[];
 const topSix=rules.some(s=>s.title==='Playoffs'&&s.content.some(x=>x.text==='Top 6 teams qualify for the playoffs.'));
 if(topSix&&week<14){const a=rows[5],b=rows[6];context+=` With ${14-week} regular-season weeks left, ${a.name} holds sixth at ${a.record}; ${b.name} sits seventh at ${b.record}. The top six qualify. These are current positions, not clinched places.`;}
 const facts={leagueId,season,week,teamOfWeek,matches,awards,standings};
 const sourceRevision=M.sha(JSON.stringify(facts));
 return {schemaVersion:1,id:`recap:${season}:${leagueId}:${week}`,leagueId,season,week,sourceRevision,title:`Week ${week} recap`,intro:`${best.owner} set the pace with ${money(best.points)} points. Here’s how the six matchups finished.`,standingsContext:context,standingsLabel:leagueId==='sts'?'League points':'Official standings',...facts,...require('./_recapcopy').compose(facts,{topSix}),reviewNotes:warnings,generatedAt:new Date().toISOString(),status:'draft'};
}
async function collect(lg,week,store=M){
 const records=await Promise.all(Array.from({length:week},(_,i)=>store.read('mw:'+lg+':'+(i+1))));
 const weeks=records.map(r=>r&&r.season==null&&new Date(r.sourceUpdatedAt).getUTCFullYear()===M.SEASON?{...r,season:M.SEASON}:r);
 const table=require('./_mstandings').compute({league:lg,season:M.SEASON,currentWeek:week+1,weeks});
 const rec=weeks.at(-1);if(!rec?.final||rec.partial)throw Error('final_results_required');
 const sv={lg,week,final:true,partial:false,stale:false,matchups:rec.matchups};
 const named=require('./_mnamed').build(sv,rec,null,M.SEASON,await require('./_ids').getMap());
 return derive(named,table);
}
async function prepare(lg,week,{store=M,collector=collect}={}){
 if(!names[lg]||!Number.isInteger(week)||week<1||week>14)throw Error('invalid_edition');
 const doc=await collector(lg,week,store),lock=await store.lock(INDEX+':lock',20);if(!lock)throw Error('busy');
 try{
  const existing=await store.read(key(doc.id));
  if(existing?.sourceRevision===doc.sourceRevision)return {id:doc.id,state:'unchanged'};
  const revision=M.sha(doc.sourceRevision+':'+Date.now());
  const draft={...doc,revision,previousPublishedRevision:existing?.publishedRevision||existing?.previousPublishedRevision||null};
  await store.write(key(doc.id),draft);
  const index=await store.read(INDEX)||[];
  const old=index.find(x=>x.id===doc.id)||{};
  await store.write(INDEX,[...index.filter(x=>x.id!==doc.id),{...old,id:doc.id,leagueId:lg,week,season:M.SEASON,draftRevision:revision}]);
  return {id:doc.id,state:'draft'};
 }finally{await store.unlock(INDEX+':lock',lock);}
}
async function authorized(req){const a=await A.authenticate(req);return a&&require('./_networkrollout.json').publishers.includes(a.member.h)?a:null;}
async function list(drafts=false,store=M){
 const index=await store.read(INDEX)||[];
 if(drafts)return (await Promise.all(index.map(x=>store.read(key(x.id))))).filter(Boolean);
 return index.filter(x=>x.post).map(x=>x.post).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
}
async function detail(id,draft=false,store=M){
 if(!valid(id))return null;
 if(draft)return store.read(key(id));
 const row=(await store.read(INDEX)||[]).find(x=>x.id===id&&x.publishedRevision);
 return row?store.read(key(id)+':published:'+row.publishedRevision):null;
}
async function edit(body,{store=M}={}){
 if(!valid(body.id))throw Error('invalid_edition');
 const lock=await store.lock(INDEX+':lock',20);if(!lock)throw Error('busy');
 try{
  const doc=await store.read(key(body.id));if(!doc||doc.revision!==body.revision)throw Error('revision_conflict');
  const clean=(s,n)=>{if(typeof s!=='string'||!s.trim()||s.length>n)throw Error('invalid_copy');return s.trim();};
  const updated={...doc,title:clean(body.title,100),intro:clean(body.intro,2000),standingsContext:clean(body.standingsContext,2000),matches:doc.matches.map(m=>{const copy=body.matches?.find(x=>x.id===m.id);if(!copy)throw Error('missing_matchup_copy');return {...m,headline:clean(copy.headline,150),body:clean(copy.body,1800)};}),revision:M.sha(doc.revision+JSON.stringify(body)),status:'draft'};
  await store.write(key(doc.id),updated);return updated;
 }finally{await store.unlock(INDEX+':lock',lock);}
}
async function publish(body,{store=M,collector=collect,now=Date.now()}={}){
 if(!valid(body.id)||body.reviewed!==true||typeof body.notify!=='boolean')throw Error('review_required');
 const draft=await store.read(key(body.id));if(!draft||draft.revision!==body.revision)throw Error('revision_conflict');
 const current=await collector(draft.leagueId,draft.week,store);
 if(current.sourceRevision!==draft.sourceRevision)throw Error('results_changed_regenerate');
 const lock=await store.lock(INDEX+':lock',20);if(!lock)throw Error('busy');
 try{
  const latest=await store.read(key(body.id));if(latest?.revision!==body.revision)throw Error('revision_conflict');
  const index=await store.read(INDEX)||[],old=index.find(x=>x.id===body.id);
  if(old?.publishedRevision===body.revision)return {duplicate:true,id:body.id};
  const publishedAt=old?.post?.publishedAt||new Date(now).toISOString();
  const doc={...latest,status:'published',publishedAt,updatedAt:new Date(now).toISOString()};
  const post={id:doc.id,kind:'recap',leagueId:doc.leagueId,week:doc.week,title:doc.title,body:doc.intro.slice(0,500),recapID:doc.id,publishedAt,url:'https://cuadzfantasynetwork.com/redesign/recap.html?id='+encodeURIComponent(doc.id),logoURL:require('./_network').logo(doc.leagueId),notify:old?.post?old.post.notify:body.notify};
  await store.write(key(doc.id)+':published:'+doc.revision,doc);
  await store.write(INDEX,[...index.filter(x=>x.id!==doc.id),{id:doc.id,leagueId:doc.leagueId,week:doc.week,season:doc.season,draftRevision:doc.revision,publishedRevision:doc.revision,post}]);
  await store.write(key(doc.id),{...doc,publishedRevision:doc.revision});
  return {id:doc.id,publishedAt};
 }finally{await store.unlock(INDEX+':lock',lock);}
}
async function scheduled(now=new Date(),store=M,{collector=collect}={}){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'numeric',hourCycle:'h23'}).formatToParts(now).map(x=>[x.type,x.value]));
 if(p.weekday!=='Tue'||Number(p.hour)<6)return {skipped:'outside_recap_window'};
 const c=await store.context({cachedOnly:true});if(!c||c.stale||c.season!==M.SEASON||c.week<2||c.week>15)throw Error('calendar_unavailable');
 // One successful league per pass. A missing league never blocks the others.
 const week=c.week-1,index=await store.read(INDEX)||[];
 const pending=[];
 for(const lg of Object.keys(names))if(!index.some(x=>x.id===`recap:${M.SEASON}:${lg}:${week}`)){
  try{return {...await prepare(lg,week,{store,collector}),pending};}
  catch(e){pending.push({leagueId:lg,reason:e.message});}
 }
 return pending.length?{skipped:'awaiting_validated_results',week,pending}:{skipped:'drafts_ready',week};
}
async function route(req,action,query,body){
 if(action==='recaps'&&req.method==='GET')return {status:200,json:{schemaVersion:1,posts:(await list()).map(({notify,...p})=>p)}};
 if(action==='recaps/detail'&&req.method==='GET'&&query.get('draft')!=='1'){const doc=await detail(query.get('id'));return {status:doc?200:404,json:doc||{error:'recap_unavailable'}};}
 const a=await authorized(req);if(!a)return {status:403,json:{error:'publisher_required'}};
 try{
  if(action==='recaps/detail'&&req.method==='GET'){const doc=await detail(query.get('id'),true);return {status:doc&&Number.isInteger(a.member.teams[doc.leagueId])?200:404,json:doc&&Number.isInteger(a.member.teams[doc.leagueId])?doc:{error:'recap_unavailable'}};}
  if(action==='recaps/drafts'&&req.method==='GET')return {status:200,json:{schemaVersion:1,drafts:(await list(true)).filter(x=>x&&Number.isInteger(a.member.teams[x.leagueId]))}};
  if(req.method!=='POST')return {status:405,json:{error:'method_not_allowed'}};
  const lg=body.leagueId||body.id?.split(':')[2];if(!Number.isInteger(a.member.teams[lg]))return {status:403,json:{error:'forbidden'}};
  const result=action==='recaps/prepare'?await prepare(lg,body.week):action==='recaps/edit'?await edit(body):action==='recaps/publish'?await publish(body):null;
  return {status:result?200:404,json:result||{error:'not_found'}};
 }catch(e){return {status:409,json:{error:e.message}};}
}
module.exports={derive,collect,prepare,list,detail,edit,publish,scheduled,route};
