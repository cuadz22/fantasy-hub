'use strict';
const assert = require('node:assert/strict');
const R = require('../client/api/_weekrollover');
const at = s => Date.parse(s);
assert.equal(R.scheduledWeek(2026, at('2026-11-24T07:59:59Z')),11);
assert.equal(R.scheduledWeek(2026, at('2026-11-24T08:00:00Z')),12);
assert.equal(R.scheduledWeek(2026, at('2026-10-27T06:59:59Z')),7);
assert.equal(R.scheduledWeek(2026, at('2026-10-27T07:00:00Z')),8);
assert.equal(R.scheduledWeek(2026, at('2026-11-03T07:59:59Z')),8);
assert.equal(R.scheduledWeek(2026, at('2026-11-03T08:00:00Z')),9);
assert.equal(R.scheduledWeek(2026, at('2027-02-01T08:00:00Z')),18);
assert.throws(()=>R.scheduledWeek(2027),/unconfigured/);
const now=at('2026-11-24T08:00:00Z'), db=new Map(), leagues=['gl','bh','rb','sts'];
const board=w=>({season:2026,week:w,games:[{state:w===11?'post':'pre',start:w===11?'2026-11-24T01:15:00Z':'2026-11-26T17:00:00Z'}],sourceUpdatedAt:now,fetchedAt:now});
const matches=()=>Array.from({length:6},(_,i)=>({ia:2*i+1,ib:2*i+2,an:'A',bn:'B',ya:[100,120],yb:[90,110],L:Array(8).fill(['QB','P','QB','CIN',10,10,'Final','']),R:Array(8).fill(['QB','Q','QB','IND',10,10,'Final',''])}));
const record=(lg,w,final=false)=>({lg,week:w,season:2026,matchups:matches(),final,partial:false,sourceUpdatedAt:now,fetchedAt:now});
const M={SEASON:2026,LGS:leagues,read:async k=>db.get(k),write:async(k,v)=>db.set(k,v),getBoard:async w=>board(w)};
let calls=0;
async function prepare(lg,w,opts){calls++;db.set(`mw:${lg}:${w}`,record(lg,w,opts.final===true));}
(async()=>{
 for(const lg of leagues)for(let w=1;w<=11;w++)db.set(`mw:${lg}:${w}`,record(lg,w,w<11));
 const current=board(11);db.set('mb:cur',current);
 const before=await R.advance(M,current,prepare,now-1);assert.equal(before.state,'current');assert.equal(calls,0);
 const get=M.getBoard;M.getBoard=async w=>({...board(w),games:[{state:'in',start:'2026-11-24T01:15:00Z'}]});
 assert.equal((await R.advance(M,current,prepare,now)).state,'waiting_for_final_games');assert.equal(calls,0);
 M.getBoard=async w=>({...board(w),stale:true});assert.equal((await R.advance(M,current,prepare,now)).state,'waiting_for_final_games');M.getBoard=get;
 for(let i=0;i<8;i++){assert.equal((await R.advance(M,current,prepare,now)).state,'preparing');assert.equal(db.get('mb:cur').week,11);}
 const original=db.get('mw:gl:10');db.delete('mw:gl:10');
 await assert.rejects(R.advance(M,current,prepare,now),/incomplete_week_10/);assert.equal(db.get('mb:cur').week,11);db.set('mw:gl:10',original);
 M.getBoard=async w=>w===12?{...board(w),stale:true}:board(w);
 await assert.rejects(R.advance(M,current,prepare,now),/next_scoreboard/);assert.equal(db.get('mb:cur').week,11);M.getBoard=get;
 assert.equal((await R.advance(M,current,prepare,now)).state,'advanced');assert.equal(db.get('mb:cur').week,12);assert.equal(db.get('mc:ctx').week,12);
 assert.equal((await R.advance(M,db.get('mb:cur'),prepare,now)).state,'current');assert.equal(calls,8);
 for(const lg of leagues){const s=require('../client/api/_mstandings').compute({league:lg,season:2026,currentWeek:12,weeks:Array.from({length:11},(_,i)=>db.get(`mw:${lg}:${i+1}`))});assert.equal(s.throughWeek,11);assert(s.rows.every(t=>t.wins+t.losses+t.ties===11));}
 const bad=record('gl',12);bad.matchups[0].ia=3;assert.equal(R.validWeek(bad,'gl',12,2026),false);
 console.log('PASS: Tuesday 03:00 Eastern, DST, delayed games, stale board, staged publication, missing history, all league standings, idempotence and identity validation');
})().catch(e=>{console.error(e);process.exit(1)});
