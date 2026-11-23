'use strict';
const M=require('./_m'),media=require('./_feedmedia');
const KEY='news:player-headlines:v1',SOURCE='https://gist.githubusercontent.com/cuadz22/9727cb8f5b18fb3307b459b82214c15d/raw/player-cards.json';
let memo=null,pending=null;
function parse(root,now=Date.now()){
 if(!Array.isArray(root.players)||!root.players.length)throw Error('invalid_news');
 const articles=new Map();
 for(const p of root.players){
  if(typeof p.name!=='string'||!p.name)continue;
  for(const field of ['news_items','news','news_rotowire'])for(const n of (Array.isArray(p[field])?p[field]:p[field]?[p[field]]:[])){
   let url;try{url=new URL(n.link)}catch{continue}
   const publisher=['fantasypros.com','rotowire.com'].find(h=>url.hostname===h||url.hostname.endsWith('.'+h));
   const at=Date.parse(n.timestamp);if(!publisher||url.protocol!=='https:'||url.username||url.password||!Number.isFinite(at)||at>now+300000||at<now-14*86400000||typeof n.headline!=='string'||!n.headline.trim())continue;
   url.hash='';for(const k of [...url.searchParams.keys()])if(k.startsWith('utm_')||k==='ref')url.searchParams.delete(k);
   const old=articles.get(url.href),player=media.asset(p.name,p.position,p.team);
   // Keep every mentioned player so team filters do not miss multi-player stories.
   const players=old?.players||[];if(!players.some(x=>x.name===p.name))players.push(player);
   articles.set(url.href,{id:url.href,url:url.href,headline:n.headline,source:publisher==='fantasypros.com'?'FantasyPros':'RotoWire',publishedAt:new Date(at).toISOString(),players});
  }
 }
 return {schemaVersion:1,generatedAt:root.generated_at||null,articles:[...articles.values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,300)};
}
async function feed(){
 if(memo&&Date.now()-memo.at<600000)return memo.body;
 if(pending)return pending;
 pending=(async()=>{const saved=await M.rget(KEY);if(saved&&Date.now()-saved.checkedAt<600000){memo={at:Date.now(),body:saved.body};return saved.body;}
  try{const r=await fetch(SOURCE,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('news_unavailable');const body=parse(await r.json());await M.rset(KEY,{checkedAt:Date.now(),body},7*86400);memo={at:Date.now(),body};return body;}
  catch(e){if(saved?.body){const body={...saved.body,stale:true};memo={at:Date.now()-540000,body};return body;}throw e;}
 })().finally(()=>pending=null);return pending;
}
module.exports={feed,parse};
