'use strict';
// Read-only release gate: use the server's current week; never a hard-coded week.
const assert=require('node:assert/strict');
async function get(path){
 let body;
 if(process.env.CFN_VERCEL_DEPLOYMENT){const s=require('node:child_process').execFileSync('vercel',['curl',path,'--deployment',process.env.CFN_VERCEL_DEPLOYMENT,'--','--silent','--show-error','--max-time','20','--write-out','\n%{http_code}'],{encoding:'utf8',maxBuffer:4e6,stdio:['ignore','pipe','pipe']});const i=s.lastIndexOf('\n');assert.equal(Number(s.slice(i+1)),200,path);body=JSON.parse(s.slice(0,i));}
 else {const r=await fetch((process.env.CFN_BASE_URL||'https://cuadzfantasynetwork.com')+path,{signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,path);body=await r.json();}return body;
}
(async()=>{const c=await get('/api/mobile/context');assert.equal(c.stale,false,'Current week must be fresh');
 let selected=[];
 for(const week of [c.currentWeek,c.currentWeek-1].filter(w=>w>0)){
  const j=await get('/api/lineups?lg=gl&week='+week);assert.equal(j.week,week);
  for(const row of j.matchups.flatMap(m=>[...m.L,...m.R]))if(['QB','RB','WR','TE','K','DEF'].includes(row[2])&&/^Final\b/i.test(row[6])&&typeof row[5]==='number'&&!selected.some(p=>p.row[2]===row[2]))selected.push({week,row});
 }
 assert.equal(selected.length,6,'Require completed examples for every position');
 for(const {week,row} of selected){const q=new URLSearchParams({player:row[1],pos:row[2],lg:'gl',team:row[3]}),j=await get('/api/mobile/player-log?'+q),record=j.log.find(r=>r.wk===week);
  assert(record,'Missing latest completed week for '+row[1]);assert.equal(record.fin,true);assert.equal(record.pts,row[5],'League-scored point mismatch for '+row[1]);assert.equal(new Set(j.log.map(r=>r.wk)).size,j.log.length);console.log(row[2],row[1],'latest completed week',week,'points',record.pts,'verified');
 }
 console.log('All six position histories match recorded league results.');
})().catch(e=>{console.error(e.message);process.exit(1)});
