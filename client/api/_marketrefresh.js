'use strict';
const M=require('./_m'),MV=require('./_mmovers'),Ids=require('./_ids');
async function refresh(){
 const c=await M.context({cachedOnly:true});if(!c||c.stale)throw Error('context_unavailable');
 const key='mm:cache',locked=await M.lock('mm:refresh:lock',55);if(!locked)return {busy:true};
 try{
  const hj=async u=>{const r=await fetch(u,{headers:{'User-Agent':'cfn-market-refresh'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('market_http_'+r.status);return r.json()};
  const m=await MV.compute('cuadzfantasynetwork.com',c.week,hj,undefined,await Ids.getMap());
  if(!m.ok)throw Error(m.error||'market_unavailable');
  await M.rset(key,{v:3,at:Date.now(),week:c.week,key:m.key,body:m.body},86400);
  return {updated:true,sourceUpdatedAt:m.body.sourceUpdatedAt,computedAt:m.body.computedAt};
 }finally{await M.unlock('mm:refresh:lock',locked)}
}
module.exports={refresh};
