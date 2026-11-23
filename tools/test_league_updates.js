'use strict';
const H=require('./mobile_harness'),{M,ok}=H,U=require('../client/api/_leagueupdates');
const roster=Array.from({length:12},(_,i)=>`<a class="Nowrap name F-link">Player ${i}</a><span>KC - QB</span><td class="pts Selected">${300-i}</td>`).join('');
const cc="Can't Cut List"+roster,qb='<option value="S_S_2026" selected>'+roster;
(async()=>{
 ok(U.cantcut(cc).length===12,'complete list');ok(U.quarterbacks(qb).length===10,'top ten only');
 for(const [fn,input] of [['trades','Tst-transaction-table'],['cantcut','Login'],['cantcut',"Can't Cut List"],['quarterbacks',qb.replace('2026','2025')],['quarterbacks',qb.replace('KC - QB','KC - K')],['quarterbacks',qb.replace('300</td>','1</td>')]]){let failed=false;try{U[fn](input)}catch{failed=true}ok(failed,'reject invalid '+fn);}
 const original=require('../client/api/_resources.json').tools.trades.rb[1];
 const duplicate=JSON.parse(JSON.stringify(original));duplicate.b.gets=duplicate.b.gets.filter(x=>!x.includes('FAB'));duplicate.b.gets=duplicate.b.gets.map(x=>x==='Round 8 pick'?x+' (traded from Manifested It)':x);
 ok(U.mergeTrades([original],[duplicate]).length===1,'live trade merges without duplicating or dropping manually recorded FAB');
 ok(U.mergeTrades([original],[duplicate])[0].b.gets.includes('$35 FAB'),'FAB preserved');
 const old={cc:{list:['Saved'],qb10:[],sourceUpdatedAt:'2026-11-17T12:00:00Z'}};await M.write('league-resources:v1:2026',old);
 let failed=false;try{await U.refresh('cantcut')}catch{failed=true}ok(failed,'provider failure propagated');
 ok((await M.read('league-resources:v1:2026')).cc.sourceUpdatedAt===old.cc.sourceUpdatedAt,'failed fetch never advances source date');
 ok((await U.resources()).tools.cc.list[0]==='Saved','last verified snapshot preserved');
 ok((await H.call(H.mobile,'/?r=cron-cantcut')).s===401,'refresh job protected');
 H.done();
})().catch(e=>{console.error(e);process.exit(1)});
