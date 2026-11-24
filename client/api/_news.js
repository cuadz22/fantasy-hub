'use strict';
const M=require('./_m'),media=require('./_feedmedia');
const KEY='news:player-headlines:v2',SOURCE='https://gist.githubusercontent.com/cuadz22/9727cb8f5b18fb3307b459b82214c15d/raw/player-cards.json';
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
   const old=articles.get(url.href),player={...media.asset(p.name,p.position,p.team),sleeperID:p.sleeper_player_id?String(p.sleeper_player_id):null};
   // Keep every mentioned player so team filters do not miss multi-player stories.
   const players=old?.players||[];if(!players.some(x=>x.name===p.name))players.push(player);
   articles.set(url.href,{id:url.href,url:url.href,headline:n.headline,source:publisher==='fantasypros.com'?'FantasyPros':'RotoWire',publishedAt:new Date(at).toISOString(),summary:excerpt(n.blurb),players});
  }
 }
 return {schemaVersion:1,generatedAt:root.generated_at||null,articles:[...articles.values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,300)};
}

function clean(value){return String(value||'').replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const c=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return c>0&&c<=0x10ffff?String.fromCodePoint(c):''}).replace(/&(amp|quot|apos|nbsp|lt|gt|rsquo|lsquo|rdquo|ldquo);/g,(_,n)=>({amp:'&',quot:'"',apos:"'",nbsp:' ',lt:'<',gt:'>',rsquo:"'",lsquo:"'",rdquo:'"',ldquo:'"'}[n])).replace(/\s+/g,' ').trim();}
function excerpt(value){const s=clean(value);return s.length>320?s.slice(0,317).replace(/\s+\S*$/,'')+'…':s;}
function fpDate(value,now){
 const m=clean(value).match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{1,2}):(\d{2})(am|pm)\s+(EST|EDT)/i);if(!m)return null;
 const year=new Date(now).getUTCFullYear(),hours=Number(m[3])%12+(m[5].toLowerCase()==='pm'?12:0);
 for(const y of [year,year-1]){const t=Date.parse(`${m[1]} ${m[2]} ${y} ${hours}:${m[4]}:00 ${m[6]}`);if(Number.isFinite(t)&&t<=now+300000&&t>=now-14*86400000)return new Date(t).toISOString();}return null;
}
function fantasyPros(html,now=Date.now()){
 const blocks=String(html).match(/<div class="player-news-item">[\s\S]*?<!--\s*\.player-news-item\s*-->/g);if(!blocks?.length)throw Error('invalid_publisher_news');
 const articles=[];
 for(const b of blocks){
  const image=b.match(/<img\b[^>]*\balt="([^"]+)"/),link=b.match(/<a href="(\/nfl\/news\/\d+\/[^"\s]+)"[^>]*>([\s\S]*?)<\/a>/),pos=b.match(/>\s*(QB|RB|WR|TE|K|DST|DEF)\s*-\s*([A-Z]{2,3})\s*<\/p>/),publishedAt=fpDate(b,now);
  if(!image||!link||!pos||!publishedAt)continue;
  const name=clean(image[1]),headline=clean(link[2]);if(!name||!headline)continue;
  const url='https://www.fantasypros.com'+link[1],after=b.slice(b.indexOf(link[0])+link[0].length),blurb=after.match(/<\/div>\s*<\/div>\s*<p>([\s\S]*?)<\/p>/)?.[1]||'';
  articles.push({id:url,url,headline,source:'FantasyPros',publishedAt,summary:excerpt(blurb.replace(/\(Source:[\s\S]*$/,'')),players:[media.asset(name,pos[1],pos[2])]});
 }
 return articles;
}
function combine(batches,now=Date.now()){
 const map=new Map();
 for(const batch of batches)for(const a of batch||[]){
  const at=Date.parse(a.publishedAt);if(!Number.isFinite(at)||at<now-14*86400000||at>now+300000)continue;
  const old=map.get(a.id);const players=[...(old?.players||[])];for(const p of a.players||[])if(!players.some(x=>x.name===p.name))players.push(p);
  map.set(a.id,{...old,...a,summary:a.summary||old?.summary||'',players});
 }
 return [...map.values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.id.localeCompare(b.id)).slice(0,2000);
}
// Shared by website and app. Collection is isolated from scoring and account data.
// A bounded catch-up stops at the saved overlap, retaining a rolling 14-day archive.
async function collect(saved,fetcher=fetch,now=Date.now()){
 const batches=[saved?.body?.articles||[]],failures=[];let successes=0;
 const signal=AbortSignal.timeout(12000);
 const extras=(async()=>{const values=await M.rc(['HVALS',KEY+':extras']);for(const v of values||[]){try{batches.push(JSON.parse(v));}catch{}}})();
 const cards=(async()=>{try{const r=await fetcher(SOURCE,{signal});if(!r.ok)throw Error('status');const parsed=parse(await r.json(),now);batches.push(parsed.articles);successes++;}catch{failures.push('RotoWire / player collection');}})();
 const known=new Set((saved?.body?.articles||[]).filter(a=>a.source==='FantasyPros').map(a=>a.id));
 let overlap=false;
 for(let page=1;page<=10&&!overlap;page+=4){
  const results=await Promise.allSettled(Array.from({length:Math.min(4,11-page)},(_,i)=>page+i).map(async n=>{
   const r=await fetcher('https://www.fantasypros.com/nfl/player-news.php?page='+n,{signal});if(!r.ok)throw Error('publisher_status');const rows=fantasyPros(await r.text(),now);return rows;
  }));
  let valid=0;
  for(const result of results){if(result.status==='fulfilled'){valid++;successes++;batches.push(result.value);if(result.value.some(a=>known.has(a.id))||!result.value.length)overlap=true;}else failures.push('FantasyPros');}
  if(!valid)break;
 }
 await Promise.all([cards,extras]);
 if(!successes)throw Error('news_unavailable');
 return {schemaVersion:1,generatedAt:new Date(now).toISOString(),checkedAt:new Date(now).toISOString(),partial:failures.length>0,articles:combine(batches,now)};
}

function playerPage(html,player,now=Date.now()){
 const description=clean(String(html).match(/<meta name="description" content="([^"]*)"/)?.[1]);
 if(!description.startsWith('Get the latest news for '+player.name+' ('))throw Error('player_identity_mismatch');
 const blocks=String(html).split(/<div class="subsection feature-stretch\s*">/).slice(1);if(!blocks.length)throw Error('invalid_player_news');
 const rows=[];
 for(const b of blocks){
  const link=b.match(/<a href="(\/nfl\/news\/\d+\/[^"\s]+)"[^>]*>\s*<b>([\s\S]*?)<\/b>\s*<\/a>\s*<p>([\s\S]*?)<\/p>/);
  const dateText=clean(b.match(/class="pull-right timestamp">([^<]+)/)?.[1]);
  // Relative dates are too imprecise for retention or ordering; do not invent a time.
  if(!link||!/^\w{3} \d{1,2}, \d{4}$/.test(dateText))continue;
  const at=Date.parse(dateText+' 00:00:00 GMT'),url='https://www.fantasypros.com'+link[1];
  if(!Number.isFinite(at)||at>now+300000||at<now-14*86400000)continue;
  rows.push({id:url,url,headline:clean(link[2]),source:'FantasyPros',publishedAt:new Date(at).toISOString(),dateOnly:true,summary:excerpt(link[3]),players:[player]});
 }
 return rows;
}
const playerPending=new Map(),playerMemo=new Map();
async function playerFeed(name){
 const base=await feed();
 const keyName=String(name||'').trim().toLowerCase();
 const matches=Object.values(require('./_resources.json').tools.players).filter(p=>p.n.toLowerCase()===keyName);
 if(matches.length!==1)return {...base,playerNewsUnavailable:true};
 const p=matches[0],key=KEY+':player:'+keyName.replace(/[^a-z0-9]/g,'');
 const known=base.articles.filter(a=>a.players?.some(x=>x.name.toLowerCase()===keyName));
 // Recent indexed coverage already provides a useful note; no publisher request needed.
 if(known.length)return base;
 const cached=playerMemo.get(key);if(cached&&Date.now()-cached.at<3600000)return {...base,...cached.flags,articles:combine([base.articles,cached.articles])};
 if(playerPending.has(key))return playerPending.get(key);
 const promise=(async()=>{
  const saved=await M.rget(key);if(saved&&Date.now()-saved.checkedAt<3600000){playerMemo.set(key,{at:saved.checkedAt,articles:saved.articles});return {...base,articles:combine([base.articles,saved.articles])};}
  try{
   const slug=p.n.toLowerCase().replace(/['.]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
   const r=await fetch('https://www.fantasypros.com/nfl/news/'+slug+'.php',{signal:AbortSignal.timeout(7000)});if(!r.ok)throw Error('player_news_unavailable');
   // A news-only identity must not assign a stale NFL team from archived rankings.
   const articles=playerPage(await r.text(),{...media.asset(p.n,p.p),team:''});
   try{await M.rset(key,{checkedAt:Date.now(),articles},21*86400);await M.rc(['HSET',KEY+':extras',keyName,JSON.stringify(articles)]);await M.rc(['EXPIRE',KEY+':extras',21*86400]);}catch{}
   if(memo)memo.body={...memo.body,articles:combine([memo.body.articles,articles])};
   playerMemo.set(key,{at:Date.now(),articles});
   return {...base,articles:combine([base.articles,articles])};
  }catch{const articles=saved?.articles||[],flags={playerNewsUnavailable:true};playerMemo.set(key,{at:Date.now()-3540000,articles,flags});return {...base,...flags,articles:combine([base.articles,articles])};}
 })().finally(()=>playerPending.delete(key));playerPending.set(key,promise);return promise;
}
async function feed(){
 if(memo&&Date.now()-memo.at<600000)return memo.body;
 if(pending)return pending;
 pending=(async()=>{const saved=await M.rget(KEY);if(saved&&Date.now()-saved.checkedAt<600000){memo={at:Date.now(),body:saved.body};return saved.body;}
  try{const body=await collect(saved);try{await M.rset(KEY,{checkedAt:Date.now(),body},21*86400);}catch{}memo={at:Date.now(),body};return body;}
  catch(e){if(saved?.body){const body={...saved.body,stale:true};memo={at:Date.now()-540000,body};return body;}throw e;}
 })().finally(()=>pending=null);return pending;
}
module.exports={feed,playerFeed,parse,fantasyPros,playerPage,fpDate,combine,collect};
