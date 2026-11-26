'use strict';
// Additive, private imports. Never write CFN's calendar, scoring, or standings keys.
const M=require('./_m'), A=require('./_mauth');
const OWNER='007b50c7e3b100b7703abbe7873b408454d06dfbe44ec34e91717eb3ac36e136';
const CONFIG={sl:{id:'sl',name:'Sleepers',provider:'sleeper',providerId:'1397634144770469888',ownerId:'79237951498108928',teamId:1},fb:{id:'fb',name:'Fantasy Ball Z',provider:'yahoo',providerId:'697400',logoURL:'https://cuadzfantasynetwork.com/redesign/assets/leagues/fb.png'}};
// Explicit owner-confirmed assignments. Names may change; Yahoo team IDs do not.
const FB_MEMBERS={
 [OWNER]:12,
 'ca97f8e8e0f0f0577d99dc058bf72b01fa2b90643978e2c9dcaccba8561ff507':1, // Ed — Commissioner Shenron
 'f96127b215ec9c7d2610c4721a2ca82cc440dea425ae76da1bc89ff8290968bc':2, // Alexis — KRILLIN EM
 'b2e48d94882d516e3ab591e7c057e0b1e156cb354062d5911966779c3a375812':9 // Kevin — HA-HA-HA Haaland!
};
const SL_MEMBERS={
 [OWNER]:1,
 'ca97f8e8e0f0f0577d99dc058bf72b01fa2b90643978e2c9dcaccba8561ff507':7, // Ed — Cup Of Coffee
 'f96127b215ec9c7d2610c4721a2ca82cc440dea425ae76da1bc89ff8290968bc':2, // Alexis — Team VARG
 'b2e48d94882d516e3ab591e7c057e0b1e156cb354062d5911966779c3a375812':6 // Kevin — GuruKev
};
const assignedTeam=(member,lg)=>lg==='fb'?FB_MEMBERS[member.h]:undefined;
const safeURL=s=>{try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const requireValue=(ok,why)=>{if(!ok)throw Error(why)};
function normalizeSleeper({league,users,rosters,matchups,players,board,week,observedAt=Date.now()}){
 const cfg=CONFIG.sl;
 requireValue(league?.league_id===cfg.providerId&&league.season===String(M.SEASON)&&league.sport==='nfl','wrong_league');
 requireValue(Number.isInteger(week)&&week>=1&&week<=18,'invalid_week');
 requireValue(Array.isArray(users)&&Array.isArray(rosters)&&Array.isArray(matchups)&&rosters.length===league.total_rosters&&matchups.length===rosters.length,'incomplete_rosters');
 const ids=new Set(rosters.map(r=>r.roster_id));requireValue(ids.size===rosters.length&&[...ids].every(Number.isInteger),'invalid_rosters');
 const mine=rosters.find(r=>r.owner_id===cfg.ownerId);requireValue(mine?.roster_id===cfg.teamId,'ownership_changed');
 const byUser=new Map(users.map(u=>[u.user_id,u])),byRoster=new Map(rosters.map(r=>[r.roster_id,r]));
 const slots=league.roster_positions.filter(s=>s!=='BN'&&s!=='IR');
 const pairs=new Map(),seen=new Set();
 const stateFor=team=>{
  if(!board||board.week!==week||board.season!==M.SEASON||board.stale)return {status:'Game status unavailable'};
  if(board.byes?.includes(M.canon(team)))return {status:'Bye'};
  const g=board.games?.find(g=>[g.homeTeam,g.awayTeam].includes(M.canon(team)));
  if(!g)return {status:'Game status unavailable'};
  const opp=g.homeTeam===M.canon(team)?'vs '+g.awayTeam:'@ '+g.homeTeam;
  if(g.state==='pre')return {status:new Date(g.start).toLocaleString('en-US',{weekday:'short',hour:'numeric',minute:'2-digit',timeZone:'America/New_York'})+' '+opp,pre:true};
  return {status:g.period+' '+opp,game:finite(g.homeScore)&&finite(g.awayScore)?{period:g.period,homeTeam:g.homeTeam,awayTeam:g.awayTeam,homeScore:g.homeScore,awayScore:g.awayScore,possessionTeam:g.possessionTeam||null}:null};
 };
 const teamFor=m=>{
  requireValue(ids.has(m.roster_id)&&!seen.has(m.roster_id)&&Array.isArray(m.starters)&&m.starters.length===slots.length&&Array.isArray(m.players)&&finite(m.custom_points??m.points),'invalid_matchup');seen.add(m.roster_id);
  const roster=byRoster.get(m.roster_id),user=byUser.get(roster.owner_id);requireValue(user,'missing_owner');
  const starters=m.starters.filter(id=>id!=='0');requireValue(new Set(starters).size===starters.length&&starters.every(id=>m.players.includes(id)),'invalid_starters');
  const player=(id,slot,index)=>{
   if(id==='0')return {id:`sl:empty:${m.roster_id}:${index}`,name:'Empty',position:slot,team:'',points:null,projection:null,status:'Empty slot',footballPosition:slot};
   const raw=players[id];const p=raw&&{...raw,full_name:raw.full_name||[raw.first_name,raw.last_name].filter(Boolean).join(' ')};requireValue(p&&p.position&&p.full_name,'unknown_player');
   const st=stateFor(p.team),value=m.players_points?.[id];
   requireValue(value==null||finite(value),'invalid_points');
   return {id:'sl:'+id,name:p.full_name,position:slot,team:p.team||'',footballPosition:p.position==='DST'?'DEF':p.position,points:st.pre?null:(value??null),projection:null,status:st.status,game:st.game||null};
  };
  const lineup=m.starters.map((id,i)=>player(id,({FLEX:'FLX',SUPER_FLEX:'SFX',REC_FLEX:'FLX',WRRB_FLEX:'FLX'})[slots[i]]||slots[i],i));
  for(const id of m.players.filter(id=>!starters.includes(id)))lineup.push(player(id,week===league.settings.leg&&roster.reserve?.includes(id)?'IR':'BN',lineup.length));
  const s=roster.settings;
  return {id:m.roster_id,name:user.metadata?.team_name||user.display_name||'Team '+m.roster_id,manager:user.display_name||'',record:`${s.wins}-${s.losses}-${s.ties||0}`,players:lineup,logoURL:safeURL(user.metadata?.avatar)|| (user.avatar&&/^[\w-]+$/.test(user.avatar)?'https://sleepercdn.com/avatars/'+user.avatar:null),reportedScore:m.custom_points??m.points};
 };
 for(const m of matchups){const team=teamFor(m);requireValue(Number.isInteger(m.matchup_id),'unpaired_matchup');const pair=pairs.get(m.matchup_id)||[];pair.push(team);pairs.set(m.matchup_id,pair);}
 requireValue([...pairs.values()].every(p=>p.length===2),'incomplete_pairs');
 const normalized=[...pairs.entries()].map(([id,p])=>({id:`sl-${week}-${id}`,league:'sl',leagueName:league.name,week,home:p[0],away:p[1],history:'',updatedAt:new Date(observedAt).toISOString(),sourceStale:false}));
 const through=league.settings.last_scored_leg;
 requireValue(Number.isInteger(through)&&through>=0&&through<=18,'invalid_standings_week');
 const rows=rosters.map(r=>{const s=r.settings,u=byUser.get(r.owner_id);requireValue(['wins','losses','fpts','fpts_against'].every(k=>finite(s[k])),'invalid_standings');return {teamId:r.roster_id,name:u?.metadata?.team_name||u?.display_name||'Team '+r.roster_id,wins:s.wins,losses:s.losses,ties:s.ties||0,record:`${s.wins}-${s.losses}-${s.ties||0}`,pointsFor:s.fpts+(s.fpts_decimal||0)/100,pointsAgainst:s.fpts_against+(s.fpts_against_decimal||0)/100,streak:r.metadata?.streak||'—'};}).sort((a,b)=>(b.wins+b.ties/2)-(a.wins+a.ties/2)||b.pointsFor-a.pointsFor||a.teamId-b.teamId).map((r,i)=>({...r,rank:i+1,pointsPerGame:through?r.pointsFor/through:0}));
 requireValue(rows.every(r=>r.wins+r.losses+r.ties===through),'standings_not_finalized');
 return {schemaVersion:1,leagueId:'sl',leagueName:league.name,provider:'sleeper',season:M.SEASON,week,teamId:mine.roster_id,observedAt:new Date(observedAt).toISOString(),stale:false,projectionsAvailable:false,matchups:normalized,standings:{throughWeek:through,ranking:'record_then_points_for',rows},capabilities:['matchups','rosters','standings']};
}
let playersMemo=null;
async function playerDictionary(){
 if(playersMemo&&Date.now()-playersMemo.at<86400000)return playersMemo.players;
 const cached=await M.read('connected:v1:sleeper:players');
 if(cached&&Date.now()-cached.at<86400000){playersMemo=cached;return cached.players}
 const all=await M.jfetch('https://api.sleeper.app/v1/players/nfl',20000),players={};
 requireValue(all&&Object.keys(all).length>800,'invalid_player_dictionary');
 for(const [id,p] of Object.entries(all))if(p?.position&&(p.full_name||p.first_name))players[id]={full_name:p.full_name||[p.first_name,p.last_name].filter(Boolean).join(' '),position:p.position,team:p.team};
 const value={at:Date.now(),players};await M.write('connected:v1:sleeper:players',value,3*86400);playersMemo=value;return players;
}
async function refreshSleeper(week){
 const key=`connected:v1:sl:${M.SEASON}:${week}`,lock=await M.lock(key+':lock',45);if(!lock)return {busy:true};
 try{
  const base='https://api.sleeper.app/v1/league/'+CONFIG.sl.providerId;
  const [league,users,rosters,matchups,players,board]=await Promise.all([M.jfetch(base),M.jfetch(base+'/users'),M.jfetch(base+'/rosters'),M.jfetch(base+'/matchups/'+week),playerDictionary(),M.getBoard(week, 120)]);
  const body=normalizeSleeper({league,users,rosters,matchups,players,board,week});
  await M.write(key,body,180*86400);return {league:'sl',week,matchups:body.matchups.length};
 }finally{await M.unlock(key+':lock',lock)}
}
async function catalog(req){
 const a=await A.authenticate(req);if(!a)return {status:401,json:{error:'unauthorized'}};
 const leagues=Object.keys(CONFIG).filter(lg=>assignedTeam(a.member,lg)!=null).map(lg=>({...CONFIG[lg],ownerId:undefined,teamId:assignedTeam(a.member,lg),state:'connected'}));
 return {status:200,json:{schemaVersion:1,leagues}};
}
async function snapshot(req,lg,week){
 const a=await A.authenticate(req);if(!a)return {status:401,json:{error:'unauthorized'}};
 const teamId=assignedTeam(a.member,lg);
 if(teamId==null||!CONFIG[lg])return {status:403,json:{error:'forbidden'}};
 if(!Number.isInteger(week)||week<1||week>18)return {status:400,json:{error:'invalid_week'}};
 const body=await M.read(`connected:v1:${lg}:${M.SEASON}:${week}`);
 if(!body)return {status:404,json:{error:'week_unavailable'}};
 const context=await M.context({cachedOnly:true});
 const maxAge=context&&!context.stale&&week!==context.week?86400000:lg==='fb'&&context&&!context.stale&&!M.isLive(context.board)?600000:180000;
 const stale=!Number.isFinite(Date.parse(body.observedAt))||Date.now()-Date.parse(body.observedAt)>maxAge;
 // Orient only this member's response. Shared snapshots and stable matchup IDs
 // retain provider order, so one member cannot change another member's view.
 return {status:200,json:{...body,superSaiyanUsedTeamIds:require('./_seasonBadges').superSaiyanUsedTeamIds(body),teamId,stale,matchups:body.matchups.map(m=>({...m,...(m.away.id===teamId?{home:m.away,away:m.home}:{}),sourceStale:stale}))}};
}
// Schedules are derived from independently validated weekly snapshots. Never
// change the global current week or fill missing weeks with another week's games.
const scheduleCache=new Map();
async function schedule(req,lg){
 const a=await A.authenticate(req);if(!a)return {status:401,json:{error:'unauthorized'}};
 const teamId=assignedTeam(a.member,lg);
 if(teamId==null||!CONFIG[lg])return {status:403,json:{error:'forbidden'}};
 let cached=scheduleCache.get(lg);
 if(!cached||Date.now()-cached.at>60000){
 const weeks=[];
 const raw=await M.command(['MGET',...Array.from({length:18},(_,i)=>`connected:v1:${lg}:${M.SEASON}:${i+1}`)]);
 requireValue(Array.isArray(raw)&&raw.length===18,'schedule_unavailable');
 for(let week=1;week<=18;week++){
  const s=raw[week-1]?JSON.parse(raw[week-1]):null;
  if(!s||s.leagueId!==lg||s.week!==week||s.season!==M.SEASON)continue;
  const matches=s.matchups.map(m=>({id:m.id,home:{id:m.home.id,name:m.home.name,logoURL:m.home.logoURL||null,score:m.home.reportedScore},away:{id:m.away.id,name:m.away.name,logoURL:m.away.logoURL||null,score:m.away.reportedScore}}));
  weeks.push({week,observedAt:s.observedAt,matches});
 }
 cached={at:Date.now(),weeks};scheduleCache.set(lg,cached);
 }
 return {status:200,json:{schemaVersion:1,leagueId:lg,season:M.SEASON,teamId,weeks:cached.weeks}};
}
async function refreshSleeperScheduled(week){
 requireValue(Number.isInteger(week)&&week>=1&&week<=18,'invalid_week');
 const current=await refreshSleeper(week);
 // One additional week per run: rotate historical AND upcoming regular-season weeks.
 // Upcoming rosters are provisional provider snapshots, never copied from this week.
 const candidates=Array.from({length:Math.max(14,week)},(_,i)=>i+1).filter(w=>w!==week);
 const extra=candidates[Math.floor(Date.now()/60000)%candidates.length];
 if(extra){
  const saved=await M.read(`connected:v1:sl:${M.SEASON}:${extra}`);
  if(!saved||!Number.isFinite(Date.parse(saved.observedAt))||Date.now()-Date.parse(saved.observedAt)>(extra>week?3600000:86400000)){
   try{return {current,history:await refreshSleeper(extra)}}catch{return {current,history:{week:extra,unavailable:true}}}
  }
 }
 return {current};
}
async function refreshYahooScheduled(week){
 requireValue(Number.isInteger(week)&&week>=1&&week<=18,'invalid_week');
 const Y=require('./_connectedYahoo'),context=await M.context({cachedOnly:true});
 const saved=await M.read(`connected:v1:fb:${M.SEASON}:${week}`);
 const age=Date.now()-Date.parse(saved?.observedAt);
 const interval=context&&!context.stale&&!M.isLive(context.board)?300000:55000;
 const current=Number.isFinite(age)&&age<interval?{league:'fb',week,cached:true}:await Y.refresh(week);
 const candidates=Array.from({length:Math.max(14,week)},(_,i)=>i+1).filter(w=>w!==week);
 const extra=candidates[Math.floor(Date.now()/60000)%candidates.length];
 if(extra){
  const old=await M.read(`connected:v1:fb:${M.SEASON}:${extra}`),oldAge=Date.now()-Date.parse(old?.observedAt);
  if(!Number.isFinite(oldAge)||oldAge>(extra>week?3600000:86400000)){
   try{return {current,history:await Y.refresh(extra)}}catch(error){return {current,history:{week:extra,unavailable:true,error:error.message}}}
  }
 }
 return {current};
}
async function refreshScheduled(week){
 // Retired Sleeper league: retain archives, but stop polling and member exposure.
 const results=await Promise.allSettled([refreshYahooScheduled(week),require('./_connectedUpdates').refreshScheduled(week)]);
 if(results[0].status==='rejected')throw Error('connected_refresh_failed fb:'+results[0].reason.message);
 return {yahoo:results[0].value,transactions:results[1].status==='fulfilled'?results[1].value:{unavailable:true}};
}
module.exports={CONFIG,catalog,snapshot,refreshSleeper,refreshScheduled,normalizeSleeper,schedule,assignedTeam,playerDictionary};
