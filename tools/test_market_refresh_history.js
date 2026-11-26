const assert=require('node:assert/strict');
const M=require('../client/api/_m'), MV=require('../client/api/_mmovers'), Ids=require('../client/api/_ids'), Archive=require('../client/api/_marketarchive');
let writes=0,unlocks=0;
M.context=async()=>({week:12});M.lock=async()=>true;M.unlock=async()=>unlocks++;M.rset=async()=>writes++;
Ids.getMap=async()=>({});
MV.compute=async()=>({ok:true,key:'confirmed',body:{stale:false,sourceUpdatedAt:new Date().toISOString()}});
Archive.save=async()=>{throw Error('storage unavailable')};
(async()=>{
 const saved=await require('../client/api/_marketrefresh').refresh();
 assert.equal(saved.updated,true);assert.equal(saved.history.saved,false);assert.equal(writes,1);assert.equal(unlocks,1);
 MV.compute=async()=>({ok:true,body:{stale:true}});
 await assert.rejects(require('../client/api/_marketrefresh').refresh());
 assert.equal(writes,1);assert.equal(unlocks,2);
 console.log('History failure preserves market refresh; unconfirmed values never replace cache.');
})().catch(e=>{console.error(e);process.exit(1)});
