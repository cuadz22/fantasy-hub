'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const P=require('../client/api/_mpower');
const makeWeek=(week)=>({lg:'gl',season:2026,week,final:true,partial:false,sourceUpdatedAt:Date.UTC(2026,10,week),matchups:Array.from({length:6},(_,i)=>({ia:2*i+1,ib:2*i+2,an:'Team '+(2*i+1),bn:'Team '+(2*i+2),ya:[80+((i*37+week*29)%103),999],yb:[75+((i*13+week*31)%110),999]}))});
const input={league:'gl',season:2026,currentWeek:11,weeks:Array.from({length:10},(_,i)=>makeWeek(i+1))};
const before=JSON.stringify(input),r=P.compute(input);assert.equal(JSON.stringify(input),before);
assert.equal(r.throughWeek,10);assert.equal(r.rows.length,12);assert(r.rows.every(t=>t.wins+t.losses+t.ties===10));
assert(Math.abs(r.rows.reduce((n,t)=>n+t.luckWins,0))<0.03);assert(Math.abs(r.rows.reduce((n,t)=>n+t.allPlayWinPercent,0)-600)<0.3);
assert.deepEqual(P.compute({...input,weeks:[...input.weeks,{...makeWeek(11),final:false}]}),r,'ongoing week excluded');
assert.deepEqual(P.compute(input),r,'deterministic');
const correction=structuredClone(input);correction.weeks[9].matchups[0].ya[0]=-2;
assert.notDeepEqual(P.compute(correction).rows,r.rows,'correction recomputed, not added');
for(const edit of [x=>x.weeks.pop(),x=>x.weeks[0].partial=true,x=>x.weeks[0].final=false,x=>x.weeks[0].season=2025,x=>x.weeks[0].lg='rb',x=>x.weeks[0].matchups[0].ia=2,x=>x.weeks[0].matchups[0].ya[0]=NaN]){
 const x=structuredClone(input);edit(x);assert.throws(()=>P.compute(x));
}
const tied=structuredClone(input);for(const w of tied.weeks)for(const m of w.matchups){m.ya[0]=100;m.yb[0]=100;}
assert(P.compute(tied).rows.every(t=>t.score===50&&t.luckWins===0&&t.allPlayWinPercent===50&&t.ties===10));
for(const lg of ['gl','bh','rb','sts']){
 const x={...input,league:lg,weeks:input.weeks.map(w=>({...w,lg}))};assert.equal(P.compute(x).leagueId,lg);
}
// Independent Python reference: execute the original model's unmodified
// observed-performance calculations, without its obsolete projection/sim section.
const reference=String.raw`
import json,sys,statistics as st
x=json.load(sys.stdin)
s=open('_preview/fraud/fraud_model.py').read().split('    # reliability:')[0]
s+='    return {"raw":raw,"apw":apw,"tiers":tiers}\n'
ns={};exec(s,ns);ns['FIRST_REM']=x['currentWeek']
sched=[(w['week'],m['ia'],m['ib'],m['ya'][0],m['yb'][0]) for w in x['weeks'] for m in w['matchups']]
z=ns['run']('gl',list(range(1,13)),{},[{'id':i,'pl':[]} for i in range(1,13)],{}, {},sched)
raw=z['raw'];mu=st.mean(raw.values());sigma=st.pstdev(raw.values()) or 1
json.dump({'standard':{k:(v-mu)/sigma for k,v in raw.items()},'apw':z['apw']},sys.stdout)
`;
const ref=JSON.parse(cp.execFileSync('python3',['-c',reference],{input:JSON.stringify(input),encoding:'utf8'}));
const records=r.rows.map(t=>(t.wins+t.ties/2+3)/16),mean=records.reduce((a,b)=>a+b)/12,sd=Math.sqrt(records.reduce((n,x)=>n+(x-mean)**2,0)/12)||1;
for(const t of r.rows){const expected=(1-r.recordWeight)*ref.standard[t.teamId]+r.recordWeight*((t.wins+t.ties/2+3)/16-mean)/sd;assert(Math.abs(t.z-expected)<1e-7,'original performance formula parity');assert.equal(t.allPlayWinPercent,Number((ref.apw[t.teamId]*100).toFixed(1)));}
require('../client/public/redesign/data.js');const D=globalThis.CFNData,ctx={season:2026,currentWeek:11};D.validatePower(r,'gl',ctx);
assert.throws(()=>D.validatePower({...r,throughWeek:9},'gl',ctx));assert.throws(()=>D.validatePower(r,'rb',ctx));
assert.throws(()=>D.validatePower({...r,rows:r.rows.map(t=>({...t,teamId:1}))},'gl',ctx));
(async()=>{
 let cached=null,reads=0,writes=0,current={season:2026,week:11};
 const M={SEASON:2026,LGS:['gl','bh','rb','sts'],context:async()=>current,rget:async k=>{if(k.startsWith('mpower:'))return cached;reads++;return input.weeks[Number(k.split(':')[2])-1];},restore:async()=>null,write:async(k,v)=>{assert(k.startsWith('mpower:v2:'),'never mutate standings or calendar');cached=v;writes++;}};
 assert.deepEqual(await P.get('gl',M),r);assert.equal(reads,10);assert.equal(writes,1);
 assert.deepEqual(await P.get('gl',M),r);assert.equal(reads,10,'warm requests do not reread history');
 cached.at=0;current={...current,stale:true};assert.equal((await P.get('gl',M)).stale,true);
 current={season:2026,week:12};await assert.rejects(()=>P.get('gl',M),'missing completed week must not reuse prior week');
 current=null;await assert.rejects(()=>P.get('gl',M));
 // HTTP contract and isolation, with all mail/push/network intercepted.
 const T=require('./mobile_harness');
 await T.M.write('mb:cur',{season:2026,week:11,fetchedAt:Date.now(),sourceUpdatedAt:Date.now(),games:[]});
 for(const w of input.weeks)await T.M.write('mw:gl:'+w.week,w);
 const out=await T.call(T.mobile,'/?r=power&lg=gl');assert.equal(out.s,200);assert.equal(out.j.throughWeek,10);assert.deepEqual(out.j.rows,r.rows);
 assert.equal((await T.call(T.mobile,'/?r=power&lg=bad')).s,400);
 console.log('Power rankings: original observed-model parity, all four leagues, ties, corrections, week rollover, incomplete data, cache/read budget, frontend and HTTP contracts passed.');
})().catch(e=>{console.error(e);process.exit(1)});
