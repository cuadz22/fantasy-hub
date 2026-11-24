'use strict';
const H=require('./mobile_harness'),{M,A,mobile,call,ok}=H,C=require('../client/api/_connected'),N=require('../client/api/_network');
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 const users=[],rosters=[],matchups=[];
 for(let id=1;id<=12;id++){
  const owner=id===1?C.CONFIG.sl.ownerId:'user'+id;
  users.push({user_id:owner,display_name:'Owner '+id,metadata:{team_name:'Team '+id}});
  rosters.push({roster_id:id,owner_id:owner,settings:{wins:5,losses:5,ties:0,fpts:1000,fpts_decimal:45,fpts_against:1000,fpts_against_decimal:45},metadata:{streak:'W3'}});
  matchups.push({roster_id:id,matchup_id:Math.ceil(id/2),points:36,custom_points:null,starters:['100','PIT'],players:['100','PIT','200'],players_points:{100:30,PIT:6,200:8}});
 }
 return {league:{league_id:C.CONFIG.sl.providerId,season:'2026',sport:'nfl',name:'Sleepers',total_rosters:12,roster_positions:['QB','DEF','BN'],settings:{last_scored_leg:10,leg:11}},users,rosters,matchups,players:{100:{full_name:'Test Quarterback',position:'QB',team:'CIN'},200:{full_name:'Test Receiver',position:'WR',team:'DAL'},PIT:{first_name:'Pittsburgh',last_name:'Steelers',position:'DEF',team:'PIT'}},week:11};
}
(async()=>{
 const input=fixture(),s=C.normalizeSleeper(input),mine=s.matchups[0].home;
 ok(s.matchups.length===6&&s.standings.rows.length===12,'complete import');
 ok(mine.reportedScore===36&&mine.players[2].position==='BN','provider total excludes bench');
 ok(mine.players[1].footballPosition==='DEF'&&mine.players[0].footballPosition==='QB','defense and QB identities');
 ok(mine.players.every(p=>p.projection===null),'no invented projections');
 const scheduled=clone(input);scheduled.board={season:2026,week:11,byes:['DAL'],games:[{homeTeam:'CIN',awayTeam:'PIT',state:'pre',start:'2026-11-24T01:15:00Z'}]};
 let ps=C.normalizeSleeper(scheduled).matchups[0].home.players;
 ok(ps[0].status.includes('vs PIT')&&ps[0].points===null&&ps[2].status==='Bye','scheduled games and byes');
 scheduled.board.games[0]={...scheduled.board.games[0],state:'in',period:'Q2 8:12',homeScore:14,awayScore:7,possessionTeam:'CIN'};
 ps=C.normalizeSleeper(scheduled).matchups[0].home.players;
 ok(ps[0].game.possessionTeam==='CIN'&&ps[0].points===30,'live game retains scores and possession');
 scheduled.board.games[0].state='post';scheduled.board.games[0].period='Final';
 ok(C.normalizeSleeper(scheduled).matchups[0].home.players[0].status==='Final vs PIT','finished status');
 scheduled.board.week=12;ok(C.normalizeSleeper(scheduled).matchups[0].home.players[0].status==='Game status unavailable','wrong week not substituted');
 ok(s.standings.throughWeek===10&&s.standings.rows[0].pointsFor===1000.45,'official scoring week and decimals');
 let d=clone(input);d.matchups[0].custom_points=39;ok(C.normalizeSleeper(d).matchups[0].home.reportedScore===39,'commissioner override');
 d=clone(input);d.matchups[0].starters[0]='0';ok(C.normalizeSleeper(d).matchups[0].home.players[0].name==='Empty','empty starting slot retained');
 for(const [label,edit] of [
 ['wrong season',x=>x.league.season='2025'],['wrong league',x=>x.league.league_id='other'],
 ['changed owner',x=>x.rosters[0].owner_id='other'],['missing matchup',x=>x.matchups.pop()],
 ['duplicate roster',x=>x.matchups[1].roster_id=1],['missing player',x=>delete x.players['100']],
 ['inconsistent standings',x=>x.rosters[0].settings.wins=6],['invalid score',x=>x.matchups[0].points=null]]){
  d=clone(input);edit(d);let rejected=false;try{C.normalizeSleeper(d)}catch{rejected=true}ok(rejected,label+' rejected');
 }
 const token='cfn_'+'a'.repeat(40),member=A.MEMBERS[0];await M.write('ms:'+M.sha(token),{e:member.h,x:Date.now()+600000});
 const req={headers:{authorization:'Bearer '+token}};
 ok((await C.catalog(req)).json.leagues.length===1,'Only Fantasy Ball Z remains in connected catalog');
 ok((await C.catalog({headers:{}})).status===401,'private catalog');
 ok((await C.snapshot(req,'fb',11)).json.error==='week_unavailable','missing Yahoo week not faked');
 await M.write('connected:v1:sl:2026:11',s);
 ok((await C.snapshot(req,'sl',11)).status===403,'retired Sleeper cannot be read even with cached data');
 const before=H.store.size;await C.snapshot(req,'sl',11);ok(H.store.size===before,'read does not write or scrape');
 const oldMe=await call(mobile,'/?r=me',{headers:req.headers});ok(oldMe.j.memberships.length===4,'old app memberships unchanged');
 ok(M.LGS.length===4,'existing scoring jobs still four leagues');
 const otherToken='cfn_'+'b'.repeat(40);await M.write('ms:'+M.sha(otherToken),{e:A.MEMBERS[1].h,x:Date.now()+600000});
 ok((await C.snapshot({headers:{authorization:'Bearer '+otherToken}},'sl',11)).status===403,'other testers excluded');
 const posts=N.staticPosts(),waivers=posts.filter(p=>p.kind==='waivers');
 ok(new Set(waivers.map(p=>p.leagueId+':'+p.week)).size===waivers.length,'one waiver report per week');
 ok(posts.filter(p=>p.kind==='trade').every(p=>p.sides.length===2&&p.body.includes('receives')),'trade direction explicit');
 ok((await N.feed({headers:{}})).status===401,'feed authenticated');
 ok((await N.feed({headers:{authorization:'Bearer '+otherToken}})).status===403,'network private rollout');
 const body={id:require('crypto').randomUUID(),kind:'announcement',leagueId:'gl',title:'Private test',body:'No actual notification is sent by this test.',notify:true};
 const post=N.validate(body,member);ok(post.leagueId==='gl'&&N.payload(post).cfn.imageURL.endsWith('/gl-v1.png'),'league logo and destination');
 for(const change of [{leagueId:'sl'},{url:'https://evil.test/'},{notify:'true'},{body:''}]){let rejected=false;try{N.validate({...body,...change},member)}catch{rejected=true}ok(rejected,'reject invalid publication '+JSON.stringify(change));}
 ok((await N.publish(req,body)).status===201,'durable publication');ok((await N.publish(req,body)).json.duplicate===true,'publication retry idempotent');
 let sends=0;const device={id:'test-phone',member:member.h,session:M.sha(token),token:'fake-token',environment:'production',announcements:true,announcementsEnabledAt:Date.now()-60000};
 await M.write('push:v1:device:'+device.id,device);
 const options={sender:async()=>{sends++;return {state:'sent'}}};
 const results=await Promise.all([N.deliver(post,device,options),N.deliver(post,device,options)]);
 ok(sends===1&&results.some(r=>r.state==='duplicate_suppressed'),'concurrent worker suppresses duplicates');
 const off={...device,id:'off',announcements:false};ok((await N.deliver({...post,id:'second'},off,options)).state==='not_eligible'&&sends===1,'opt out');
 const testPost={...post,id:'one-device',deliveryDeviceID:'another-device'};ok((await N.deliver(testPost,device,options)).state==='not_eligible','test limited to its target device');
 await M.write('push:v1:device:'+device.id,{...device,announcements:false});ok((await N.deliver({...post,id:'third'},device,options)).state==='revoked'&&sends===1,'opt out revalidated');
 const other={...device,member:A.MEMBERS[1].h};ok((await N.deliver({...post,id:'fourth'},other,options)).state==='not_eligible','no other tester push');
 H.done();
})().catch(e=>{console.error(e);process.exit(1)});
