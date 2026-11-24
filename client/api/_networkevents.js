'use strict';
// New feed publications only. No calendar, lineup, score, or standings writes.
const M = require('./_m');
const KEY = 'network:v1:automatic-publications';
async function observe(posts, {store=M, now=Date.now()}={}) {
 const lock = await store.lock(KEY+':lock',30);
 if (!lock) return [];
 try {
  const previous = await store.read(KEY);
  const candidates = posts.filter(p=>['trade','waivers'].includes(p.kind)&&M.LGS.includes(p.leagueId)&&Number.isFinite(Date.parse(p.publishedAt))&&Date.parse(p.publishedAt)<=now);
  // First successful run is a baseline, never a burst of historical alerts.
  const seen = new Set(previous?.seen || []);
  const queue = (previous?.queue || []).filter(p=>now-Date.parse(p.publishedAt)<86400000);
  for (const post of candidates) {
   if (seen.has(post.id)) continue;
   seen.add(post.id);
   // Ignore backfills. Yahoo often supplies dates without a time, so allow 48h.
   if (previous && now-Date.parse(post.publishedAt)<=2*86400000) {
    queue.push({...post,notify:true,sourcePublishedAt:post.publishedAt,publishedAt:new Date(now).toISOString()});
   }
  }
  // Keep IDs for the season, even if an upstream request temporarily omits a post.
  if (!previous || seen.size!==previous.seen.length || queue.length!==previous.queue.length)
   await store.write(KEY,{seen:[...seen],queue,checkedAt:now},365*86400);
  return queue;
 } finally { await store.unlock(KEY+':lock',lock); }
}
module.exports={observe};
