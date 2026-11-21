'use strict';
const assert=require('node:assert/strict'), P=require('../client/api/_mprobability');
const row=(name,proj,pts=null,status='Sun 1:00 pm vs PIT',slot='QB')=>[slot,name,slot,'CIN',proj,pts,status,''];
const match=(a,b)=>({ia:1,ib:6,L:a,R:b});
const base=()=>match([row('A',102.37)],[row('B',111.61)]);
let m=base(), p=P.build(m); assert(p.homePercent<50); assert.equal(p.homePercent+p.awayPercent,100);
assert.equal(P.build(match(m.R,m.L)).homePercent,p.awayPercent,'side reversal is symmetric');
assert.equal(P.build(match(m.L,m.L)).homePercent,50);
let prev=0; for(let points=0;points<=100;points+=5){const q=P.build(match([row('A',20,points,'Q3 7:30')],[row('B',40)]));assert(q.homePercent>=prev);prev=q.homePercent;}
assert.equal(P.build(m,{stale:true}),null);assert.equal(P.build(m,{partial:true}),null);
assert.equal(P.build(match([row('A',null)],m.R)),null);
assert.equal(P.build(match([row('A',20,null,'Q2 10:00')],m.R)),null,'unknown live score is not zero');
assert.equal(P.build(match([row('A',20,3,'Status unavailable')],m.R)),null);
m=match([row('A',20,10,'Final')],[row('B',22,9,'Final')]);assert.equal(P.build(m).homePercent,100);assert.equal(P.build(m).status,'final');
m.R[0][5]=10;assert.equal(P.build(m).status,'tie');assert.equal(P.build(m).homePercent,50);
m.L[0][5]=8;assert.equal(P.build(m).homePercent,0,'stat correction reverses final outcome');
m=base();m.L.push(row('Bench',1000,1000,'Final','BN'),row('Bye',100,100,'Bye','RB'));assert.deepEqual(P.build(m),p,'bench and bye ignored');
m=base();m.L[0][8]={period:'Q3 15:00'};m.L[0][5]=10;assert.equal(P.build(m).homeProjected,61.19,'shared game clock drives live forecast');
m.L[0][8].period='Final';assert.equal(P.build(m).homeProjected,10);
m=base();m.ya=[2,102.37];assert.equal(P.build(m).homeProjected,104.37,'official total corrections carried into forecast');
m=match([row('DEF',10,8,'Q3 15:00, 0-7 vs PIT','DEF')],[row('B',20)]);assert(Number.isFinite(P.build(m).homeProjected));
const original=JSON.stringify(m);P.build(m);assert.equal(JSON.stringify(m),original,'read-only model');
// Both endpoint formats carry precisely the same published estimate.
const named=require('../client/api/_mnamed'); const est=P.build(m);
const sv={lg:'gl',week:11,matchups:[{...m,winProbability:est}]};
const result=named.build(sv,{matchups:[m],sourceUpdatedAt:0},null,2026,{});
assert.deepEqual(result.matchups[0].winProbability,est);
// Website applies the server values verbatim, even with reversed team order.
const fs=require('fs'),vm=require('vm'),html=fs.readFileSync('client/public/cfn.html','utf8');
const code=html.slice(html.indexOf('function ysApply(k,data){'),html.indexOf('function ysClock()'));
function website(reversed){
 const e={ia:reversed?6:1,ib:reversed?1:6,a:['A','A','',0,0,40],b:['B','B','',0,0,40],ra:[],rb:[]};
 const ctx={PVL:{gl:[e]},PV8:{gl:[{...e,a:e.a.slice(),b:e.b.slice()}]},YS:{},ysNorm:x=>x,ysSide:()=>({R:[['QB','Test',0]],pj:999,left:1,n:1,sc:0,base:10}),console};
 vm.runInNewContext(code,ctx);ctx.ysApply('gl',{matchups:[{...m,winProbability:est}]});
 assert.equal(e.p,reversed?est.awayPercent:est.homePercent);assert.equal(e.a[3],reversed?est.awayProjected:est.homeProjected);
 ctx.ysApply('gl',{matchups:[m]});assert(Number.isNaN(e.p),'missing estimate clears old odds');
}
website(false);website(true);
assert(!html.includes('ysApply(k,ysPre(j))'),'live rosters not optimized');
assert(html.includes('c.p=m.p;'),'early-look renderer preserves server probability');
console.log('CFN probability: symmetry, score changes, clock, finals, ties, corrections, missing data, reserves, endpoint parity, browser parity and source guards passed.');
