'use strict';
const assert=require('node:assert/strict'), {attach}=require('../client/api/_marketweekly'), data=require('../client/api/_marketweekly.json');
const fs=require('fs');
const baseline=JSON.parse(fs.readFileSync(process.argv[2]));
const before=JSON.stringify(baseline), now=Date.parse('2026-11-26T15:00:00Z'), next=attach(baseline,now);
assert.equal(JSON.stringify(baseline),before,'source response never mutated');
assert.equal(next.rankings.length,baseline.rankings.length);
assert.deepEqual(next.players,baseline.players,'movers unchanged');
assert.equal(next.computedAt,baseline.computedAt);assert.equal(next.sourceUpdatedAt,baseline.sourceUpdatedAt);
let expanded=0;
for(let i=0;i<next.rankings.length;i++){
 const a=baseline.rankings[i], b=next.rankings[i];
 for(const k of Object.keys(a).filter(k=>!['history','historyBasis'].includes(k)))assert.deepEqual(b[k],a[k],k);
 for(const old of a.history||[])assert(b.history.some(p=>p.date===old.date&&p.value===old.value),'saved observation preserved');
 assert.equal(new Set(b.history.map(p=>p.date)).size,b.history.length);
 assert(b.history.every(p=>Number.isFinite(p.value)&&p.value>=0&&p.value<=15000&&Date.parse(p.date)<=now));
 if(b.history.length>a.history.length)expanded++;
}
const burrow=next.rankings.find(p=>p.id==='joeburrow');
assert.equal(burrow.history[0].date,'2026-09-01');assert.equal(burrow.history[0].value,2035);
assert.equal(burrow.history.filter(p=>p.date.startsWith('2026-11-17')).length,1);
assert.equal(burrow.history.find(p=>p.date.startsWith('2026-11-17')).value,3957);
assert.equal(burrow.currentValue,4138);
assert.deepEqual(attach(next,now),next,'idempotent serving');
assert.equal(attach({...baseline,modelVersion:'future'},now).historyVersion,undefined);
for(const change of [{position:'K'},{playerId:'wrong-id'}]){
 const changed={...baseline,rankings:[{...baseline.rankings.find(p=>p.id==='joeburrow'),...change}]};
 assert.deepEqual(attach(changed,now).rankings,changed.rankings,'position and provider identity required');
}
assert(attach(baseline,Date.parse('2026-09-01T23:59:59Z')).rankings.find(p=>p.id==='joeburrow').history.every(p=>Date.parse(p.date)<=Date.parse('2026-09-01T23:59:59Z')));
const stale=attach({...baseline,stale:true},now);assert.equal(stale.stale,true);
assert.equal(data.players.kennygainwell.points[0].date,'2026-10-06','missing intervals not bridged');
console.log(`Weekly history: ${expanded} player charts expanded; current values, rankings, movers, timestamps and recorded observations unchanged.`);
