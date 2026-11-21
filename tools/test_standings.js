'use strict';
const assert = require('node:assert/strict'), { compute, get } = require('../client/api/_mstandings');
const makeWeek = (week, scores = [100,90,80,70,60,50,40,30,20,10,0,-1]) => ({lg:'gl',season:2026,week,final:true,partial:false,sourceUpdatedAt:Date.UTC(2026,10,week), matchups:Array.from({length:6},(_,i)=>({ia:2*i+1,ib:2*i+2,an:'Team '+(2*i+1),bn:'Team '+(2*i+2),ya:[scores[2*i],999],yb:[scores[2*i+1],999]}))});
const input = {league:'gl',season:2026,currentWeek:3,weeks:[makeWeek(1),makeWeek(2)]};
const result = compute(input); assert.equal(result.throughWeek,2); assert.equal(result.rows[0].record,'2-0-0'); assert.equal(result.rows[0].pointsFor,200); assert.equal(result.rows[0].streak,'W-2');
assert.deepEqual(compute({...input,weeks:[...input.weeks,{...makeWeek(3),final:false}]}),result); // live ignored
assert.deepEqual(compute(input),result); // recalculation never double-counts
const corrected=structuredClone(input);corrected.weeks[1].matchups[0].ya[0]=80;
assert.equal(compute(corrected).rows.find(r=>r.teamId===1).record,'1-1-0');
assert.equal(compute(corrected).rows.find(r=>r.teamId===1).pointsFor,180);
const tie=structuredClone(input);tie.weeks[1].matchups[0].ya[0]=90;
assert.equal(compute(tie).rows.find(r=>r.teamId===1).record,'1-0-1');
assert.equal(compute(tie).rows.find(r=>r.teamId===1).streak,'T-1');
for(const change of [w=>w.pop(),w=>w[0].partial=true,w=>w[0].final=false,w=>w[0].lg='rb',w=>w[0].season=2025,w=>w[0].matchups.pop(),w=>w[0].matchups[0].ya[0]=null,w=>w[0].matchups[0].ia=2,w=>w[0].matchups[0].ia=13,w=>w[0].sourceUpdatedAt=null]) {
 const bad=structuredClone(input);change(bad.weeks);assert.throws(()=>compute(bad));
}
(async()=>{
 const logs=console.error;console.error=()=>{};
 const cached={at:0,body:result};const fake={SEASON:2026,context:async()=>({season:2026,week:4}),rget:async k=>k.startsWith('mstandings:')?cached:null,restore:async()=>null,write:async()=>{throw Error('must not publish incomplete')}};
 const saved=await get('gl',fake);assert.equal(saved.stale,true);assert.equal(saved.throughWeek,2);
 fake.context=async()=>null;assert.equal((await get('gl',fake)).stale,true);
 console.error=logs;console.log('Standings: final-only, full coverage, ties, corrections, identity, invariants, and safe fallback passed.');
})().catch(e=>{console.error(e);process.exit(1)});
const sts = {...input,league:'sts',weeks:input.weeks.map(w=>({...structuredClone(w),lg:'sts'}))};
const custom = compute(sts);assert.equal(custom.customRows.length,12);assert.equal(custom.customRows[0].customPoints,14);assert.equal(custom.customRows.reduce((n,t)=>n+t.topSixWeeks,0),12);
const ambiguous = structuredClone(sts);ambiguous.weeks[1].matchups[2].yb[0]=40;
assert.equal(compute(ambiguous).customRows,undefined); // cannot silently invent a sixth-place tie rule
