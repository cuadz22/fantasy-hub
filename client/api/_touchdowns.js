// Pure, replayable alert selection. NFL player identity and roster slot are distinct.
'use strict';
const { identity } = require('./_mscores');
const leagues = { gl: 'Gentlemen’s League', bh: 'Beaners & Husseins', rb: 'Rebirth', sts: 'Shoot the Shits' };
const slots = new Set(['QB','RB','WR','TE','K','PK','DEF','DST','D/ST','W/R','W/T','W/R/T','Q/W/R/T','W/R/T/Q','SUPERFLEX','SF','FLEX','FLX']);
const nullified = p => /\bno play\b|\bnullified\b|\boverturned\b/i.test(p.text || '');
function events(snapshot) {
 const g=snapshot?.game;if(!g||!g.id||!Number.isInteger(g.season)||!Number.isInteger(g.week)||!Array.isArray(snapshot.stats)||!Array.isArray(snapshot.plays))return [];
 const stats=snapshot.stats,plays=snapshot.plays,seen=new Map();
 const unique=plays.filter(p=>{if(seen.has(p.id)){if(JSON.stringify(seen.get(p.id))!==JSON.stringify(p))seen.set(p.id,null);return false;}seen.set(p.id,p);return true;});
 return unique.flatMap(p=>{
  if(!p.id || seen.get(p.id)===null || p.game?.id!==g.id || !p.scoring_play || nullified(p))return [];
  const roles=p.type_slug==='passing-touchdown'?['passer','receiver']:p.type_slug==='rushing-touchdown'?['rusher']:[];
  if(!roles.length)return []; // Uncommon returns stay suppressed until attribution is validated.
  const people=[];
  for(const role of roles){
   const ids=[...new Set((p.participants||[]).filter(x=>x.type===role).map(x=>x.player_id))];
   if(ids.length!==1)return [];
   const matches=stats.filter(s=>s.player?.id===ids[0] && s.team?.id===p.team?.id && s.game?.id===g.id);
   if(matches.length!==1)return [];
   const s=matches[0];if(!s.player.first_name||!s.player.last_name||!s.player.position_abbreviation||!s.team.abbreviation)return [];
   const field={passer:'passing_touchdowns',receiver:'receiving_touchdowns',rusher:'rushing_touchdowns'}[role];
   const count=unique.filter(x=>seen.get(x.id)!==null && !nullified(x) && x.scoring_play && x.type_slug===p.type_slug && (x.participants||[]).some(y=>y.type===role&&y.player_id===s.player.id)).length;
   if(s[field]!==count)return []; // Wait for box score and play feed to agree.
   people.push({id:s.player.id,name:s.player.first_name+' '+s.player.last_name,identity:identity(['',s.player.first_name+' '+s.player.last_name,s.player.position_abbreviation,s.team.abbreviation]),role});
  }
  const at=Date.parse(p.wallclock);if(!Number.isFinite(at))return [];
  return [{id:`${g.season}:${g.id}:${p.id}`,gameId:g.id,season:g.season,week:g.week,at,people,yards:Number.isFinite(p.stat_yardage)?p.stat_yardage:null}];
 });
}
function recipients(event, records, members, now=Date.now()) {
 return members.flatMap(member=>{
  const targets=[], players=new Map();
  for(const [lg,teamId] of Object.entries(member.teams)){
   const rec=records[lg];
   if(!rec || rec.lg!==lg || rec.season!==event.season || rec.week!==event.week || rec.partial || !Array.isArray(rec.matchups) || !Number.isFinite(rec.sourceUpdatedAt) || now-rec.sourceUpdatedAt>180000 || rec.sourceUpdatedAt>now+5000 || rec.sourceUpdatedAt<event.at)continue;
   const matches=rec.matchups.filter(m=>m.ia===teamId||m.ib===teamId);if(matches.length!==1)continue;
   const m=matches[0],rows=m.ia===teamId?m.L:m.R;
   if(!Array.isArray(rows)||rows.some(r=>!Array.isArray(r)))continue;
   const found=event.people.filter(p=>{const rs=rows.filter(r=>identity(r)===p.identity);return rs.length===1&&slots.has(String(rs[0][0]).toUpperCase());});
   if(!found.length)continue;
   found.forEach(p=>players.set(p.id,p));targets.push({leagueId:lg,teamId,week:event.week,season:event.season});
  }
  if(!targets.length)return [];
  return [{member:member.h,targets,players:[...players.values()]}];
 });
}
function payload(event, recipient) {
 const names=recipient.players.map(p=>p.name), passing=recipient.players.length===1&&recipient.players[0].role==='passer';
 const action=passing?'touchdown pass':recipient.players.length===1&&recipient.players[0].role==='rusher'?'rushing touchdown':recipient.players.length===1?'receiving touchdown':'touchdown';
 const detail=(event.yards!=null?event.yards+'-yard ':'')+action;
 return {aps:{alert:{title:(passing?'Touchdown pass · ':'Touchdown · ')+names.join(' & '),body:detail.charAt(0).toUpperCase()+detail.slice(1)+'\n'+recipient.targets.map(t=>leagues[t.leagueId]).join(' · ')},sound:'default','thread-id':'cfn-touchdowns'},cfn:{type:'touchdown',eventId:event.id,targets:recipient.targets}};
}
module.exports={events,recipients,payload,slots};
