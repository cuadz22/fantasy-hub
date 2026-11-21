'use strict';
const assert = require('node:assert/strict'), fs=require('fs'),zlib=require('zlib');
const T=require('./mobile_harness');
const S=require('../client/api/_scoring'),G=require('../client/api/_scoregame'),P=require('../client/api/_mscores');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
const load=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(__dirname+'/fixtures/'+n+'.json.gz')));
const clone=x=>structuredClone(x), now=Date.now();
let exact=0,fallback=0,teams=0;
for(const week of [9,10]){
 const f=load('scoring-week'+week);
 for(const [lg,raw] of Object.entries(f.records)){
  const rec={...raw,sourceUpdatedAt:now,season:2026},calculated=P.calculate(lg,f.snapshots.map(s=>({...s,observedAt:now}))),control={mode:'guarded',season:2026,weeks:[week],leagues:[lg],rulesVersion:S.version};
  const bundle={...calculated,season:2026,week,league:lg};
  for(const m of rec.matchups)for(const rows of [m.L,m.R])for(const r of rows){
   if(P.reserve(r)||r[5]==null)continue;const e=bundle.entries[P.identity(r)];
   if(Number.isFinite(e?.points)){ok(Math.abs(e.points-r[5])<.011,`${lg} w${week} ${r[1]} ${e.points} != ${r[5]}`);exact++;}else fallback++;
  }
  const out=P.overlay(rec,bundle,control,now);
  for(let i=0;i<rec.matchups.length;i++)for(const k of ['ya','yb']){ok(out.rec.matchups[i][k][0]===rec.matchups[i][k][0],'full team with fallback matches official total');teams++;}
  ok(P.overlay(rec,bundle,{...control,mode:'shadow'},now).rec===rec,'kill switch leaves Yahoo source untouched');
  ok(P.overlay(rec,{...bundle,week:99},control,now).rec===rec,'wrong week cannot bleed through');
  ok(P.overlay(rec,bundle,{...control,rulesVersion:'old'},now).rec===rec,'rules version gate');
 }
}
const snap=load('scoring-thursday'), game=G.scoreGame('gl',snap), rb=G.scoreGame('rb',snap);
ok(game.defenses[10].points===22,'Houston safety, block and fourth-down scoring');
ok(game.defenses[12].breakdown.pointsAllowed===24,'safety excluded from Yahoo points allowed');
ok(rb.players[725].points===16.8,'Nico long reception plus long TD bonuses');
ok(game.players[1828].points===5.7,'field goal yardage plus XP');
const replay=clone(snap);replay.plays.push(clone(replay.plays[0]));ok(G.scoreGame('gl',replay).players[57].points===game.players[57].points,'identical replay does not duplicate points');
replay.plays[replay.plays.length-1].text='conflicting revision';ok(G.scoreGame('gl',replay).players[57].points===null,'conflicting event revisions rejected');
const missing=clone(snap);missing.plays=missing.plays.filter(p=>p.type_slug!=='passing-touchdown');ok(G.scoreGame('gl',missing).players[57].points===null,'truncated scoring events cannot publish');
const wrong=clone(snap);wrong.stats[0].game.id=-1;ok(G.scoreGame('gl',wrong).players[57].points===null,'wrong game stats rejected');
const nullStats=clone(snap);delete nullStats.stats.find(s=>s.player.id===57).passing_yards;ok(G.scoreGame('gl',nullStats).players[57].points===null,'missing required stat is not zero');
const incomplete=clone(snap);incomplete.stats.find(s=>s.player.id===57).passing_touchdowns=2;ok(G.scoreGame('gl',incomplete).players[57].points===null,'out-of-sync plays and box score held');
const corrected=clone(snap);corrected.stats.find(s=>s.player.id===57).passing_yards-=10;ok(G.scoreGame('gl',corrected).players[57].points===S.round(game.players[57].points-.5),'downward yardage correction recomputed');
// A published, verified in-progress score changes without a Yahoo score change.
const live=clone(snap);live.game.status_state='in_progress';live.game.status='4th';live.observedAt=now;
const lg='gl',week=11,control={mode:'guarded',season:2026,weeks:[week],leagues:[lg],rulesVersion:S.version};
const calc=P.calculate(lg,[live]),bundle={...calc,season:2026,week,league:lg};
const row=['QB','C.J. Stroud','QB','HOU',22,null,'Q4',''];
const rec={season:2026,lg,week,sourceUpdatedAt:now,partial:false,matchups:[{ia:1,ib:2,L:[row,['BN','Nico Collins','WR','HOU',12,0,'Q4','']],R:[['QB','Daniel Jones','QB','IND',20,0,'Q4','']],ya:[0,100],yb:[0,100]}]};
const out=P.overlay(rec,bundle,control,now),points=game.players[57].points;
ok(out.rec.matchups[0].L[0][5]===points&&out.rec.matchups[0].ya[0]===points,'live score and team total advance independently of Yahoo');
ok(rec.matchups[0].ya[0]===0&&rec.matchups[0].L[0][5]===null,'overlay cannot mutate stored Yahoo authority');
ok(out.rec.matchups[0].ya[1]===100,'Yahoo projection is not relabeled as a BDL projection');
ok(out.rec.matchups[0].L[1][5]!==0&&out.rec.matchups[0].ya[0]===points,'bench stats may update but do not count');
ok(P.overlay(rec,bundle,control,now+91000).rec.matchups[0].ya[0]===0,'delayed provider falls back');
ok(P.overlay({...rec,sourceUpdatedAt:now-181000},bundle,control,now).source==='yahoo','unconfirmed roster cannot be masked by fresh stats');
ok(P.overlay({...rec,sourceUpdatedAt:now-240000},{...bundle,live:false},control,now).stats.used>0,'idle roster interval does not trigger premature fallback');
ok(P.overlay({...rec,sourceUpdatedAt:now-361000},{...bundle,live:false},control,now).source==='yahoo','idle roster freshness is still bounded');
ok(P.overlay({...rec,partial:true},bundle,control,now).source==='yahoo','partial roster fails closed');
const badTotal=clone(rec);badTotal.matchups[0].ya[0]=100;ok(P.overlay(badTotal,bundle,control,now).rec.matchups[0].ya[0]===100,'unreconciled official team total retained');
const duplicate=clone(rec);duplicate.matchups[0].L.push(clone(row));ok(P.overlay(duplicate,bundle,control,now).rec.matchups[0].ya[0]===0,'duplicate starter cannot be counted twice');
const swapped=clone(rec);swapped.matchups[0].L[0][0]='BN';swapped.matchups[0].L[1][0]='WR';ok(P.overlay(swapped,bundle,control,now).rec.matchups[0].ya[0]===game.players[725].points,'latest Yahoo slot assignment selects the actual starter');
ok(P.fingerprint(swapped)!==P.fingerprint(rec),'roster change evidence records slot changes');
const conflict=P.calculate(lg,[live],{[P.identity(row)]:{providerId:999,firstSeenAt:1}});ok(conflict.entries[P.identity(row)].points===null&&conflict.conflicts.length===1,'stable identity cannot silently change');
const both=P.calculate(lg,[live,live]);ok(both.entries[P.identity(row)].points===null,'ambiguous duplicate game identity cannot score');
const unknown=clone(live);unknown.plays.find(p=>p.scoring_play).type_slug='new-unknown-score';ok(G.scoreGame(lg,unknown).players[57].points===null,'new event kind falls back');
const removed=clone(bundle);delete removed.entries[P.identity(row)];ok(P.overlay(rec,removed,control,now).rec.matchups[0].ya[0]===0,'unmapped player retains Yahoo');
// Named and legacy HTTP contracts must publish the same scores, not raw Yahoo.
(async()=>{
 await T.M.write('scoring:control:2026',control); await T.M.write(P.key(2026,11,'gl'),bundle);
 await T.M.write('mw:gl:11',{...rec,fetchedAt:now,orig:{}});
 const legacy=await T.call(T.lineups,'/api/lineups?lg=gl&week=11');
 const named=await T.call(T.mobile,'/api/mobile?r=lineups&lg=gl&week=11');
 ok(legacy.s===200&&legacy.j.matchups[0].L[0][5]===points,'legacy native app endpoint delivers BDL score');
 ok(named.s===200&&named.j.matchups[0].teams[0].pointsToDate===points&&named.j.matchups[0].teams[0].lineup[0].points===points,'named endpoint delivers identical BDL score and total');
 ok(named.j.matchups[0].teams[0].lineup[0].scoring.source==='balldontlie','source attribution survives named endpoint');
 ok((await T.call(T.mobile,'/api/mobile?r=scoring-replay&week=11&game=1392366')).s===401,'replay endpoint protected');
 await T.M.write('scoring:control:2026',{...control,mode:'shadow'});
 ok((await T.call(T.lineups,'/api/lineups?lg=gl&week=11')).j.matchups[0].ya[0]===0,'rollback works through public endpoint');
 console.log(`${checks} scoring checks passed; ${exact} exact starter comparisons, ${fallback} safe fallback entries, ${teams} team totals reconciled.`);
})().catch(e=>{console.error(e);process.exitCode=1});
