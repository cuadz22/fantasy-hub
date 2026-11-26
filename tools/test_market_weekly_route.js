'use strict';
const assert=require('node:assert/strict'),H=require('./mobile_harness'),MV=require('../client/api/_mmovers');
const data=require('../client/api/_marketweekly.json');
const entry=data.players.joeburrow;
const body={model:data.model,modelVersion:data.modelVersion,players:[],rankings:[{id:'joeburrow',position:entry.position,playerId:entry.playerId,currentValue:4138,history:[]}],computedAt:'2026-11-26T13:20:00Z'};
(async()=>{
 H.M.context=async()=>({week:12});H.M.rget=async()=>({v:4,at:Date.now(),week:12,body});
 let writes=0;H.M.rset=async()=>writes++;
 for(const r of ['market','market-movers']){
  const reply=await H.call(H.mobile,'/api/mobile?r='+r);
  assert.equal(reply.s,200);assert(reply.j.rankings[0].history.length>=14);assert.equal(reply.j.rankings[0].currentValue,4138);
 }
 assert.equal(writes,0);assert.equal(body.rankings[0].history.length,0);
 H.M.rget=async()=>({v:4,at:0,week:12,body});MV.compute=async()=>({ok:false,error:'unavailable'});
 require('../client/api/_ids').getMap=async()=>({});
 const stale=await H.call(H.mobile,'/api/mobile?r=market');assert.equal(stale.s,200);assert(stale.j.stale);assert(stale.j.rankings[0].history.length>=14);assert.equal(writes,0);
 H.M.rget=async()=>null;MV.compute=async()=>({ok:true,key:'test',body});
 const fresh=await H.call(H.mobile,'/api/mobile?r=market');assert.equal(fresh.s,200);assert(fresh.j.rankings[0].history.length>=14);assert.equal(writes,1);assert.equal(body.rankings[0].history.length,0);
 console.log('Market endpoints: fresh cache, stale fallback and fresh computation retain history without storing reconstructed values.');
})().catch(e=>{console.error(e);process.exit(1)});
