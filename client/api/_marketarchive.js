'use strict';
// Exact blended values, captured only by the existing twice-daily refresh.
const PATH='market/cfn-values-v1.json', MAX=730;
async function read(storage=require('@vercel/blob')) {
 let r;
 try { r=await storage.get(PATH,{access:'private',useCache:false}); }
 catch(e) { if(/not.?found|404/i.test(e.name+' '+e.message))return {version:1,snaps:[]}; throw e; }
 if(!r || r.statusCode===404)return {version:1,snaps:[]};
 if(r.statusCode!==200 || !r.stream)throw Error('value_history_read_failed');
 const data=JSON.parse(await new Response(r.stream).text());
 if(data.version!==1 || !Array.isArray(data.snaps))throw Error('value_history_invalid');
 return data;
}
function appended(archive,body,now=Date.now()) {
 const time=Date.parse(body.sourceUpdatedAt);
 if(body.stale || !Number.isFinite(time) || time>now || now-time>25*3600000 || body.rankings.length<100)throw Error('value_history_source_unverified');
 if(archive.snaps.some(s=>s.t===new Date(time).toISOString() && s.modelVersion===body.modelVersion))return null;
 const values={};
 for(const p of body.rankings){ if(!Number.isFinite(p.currentValue)||p.currentValue<0||p.currentValue>15000||values[p.id]!==undefined)throw Error('value_history_invalid_values'); values[p.id]=p.currentValue; }
 return {version:1,snaps:[...archive.snaps,{t:new Date(time).toISOString(),modelVersion:body.modelVersion,values}].sort((a,b)=>Date.parse(a.t)-Date.parse(b.t)).slice(-MAX)};
}
async function save(body,storage=require('@vercel/blob')) {
 const archive=await read(storage), next=appended(archive,body);
 if(!next)return {saved:false,reason:'source_already_saved'};
 await storage.put(PATH,JSON.stringify(next),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json'});
 return {saved:true,observations:next.snaps.length};
}
module.exports={read,save,appended};
