// CFN service worker. The page itself is stale-while-revalidate: it opens instantly from the saved copy, then checks for a newer one
// in the background and reloads once if the build changed. Everything else is network first with the cache as an offline fallback.
var CACHE='cfn-v2', DOC='/cfn.html';
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
function tag(x){return x&&(x.headers.get('etag')||x.headers.get('last-modified')||x.headers.get('content-length'));}
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||u.pathname.indexOf('/api/')===0||u.pathname.indexOf('/s/')===0||u.pathname.indexOf('/i/')===0) return;
  if(u.pathname===DOC){
    e.respondWith(caches.open(CACHE).then(function(ch){
      return ch.match(DOC).then(function(m){
        var up=fetch(DOC,{cache:'no-cache'}).then(function(res){
          if(res&&res.ok){ var c=res.clone(), changed=m&&tag(m)!==tag(res);
            return ch.put(DOC,c).then(function(){ if(changed) self.clients.matchAll().then(function(cs){cs.forEach(function(x){x.postMessage('cfn-updated');});}); return res; }); }
          return res;
        }).catch(function(){ return null; });
        e.waitUntil(up);
        return m||up.then(function(res){ return res||new Response('Offline',{status:503}); });
      });
    }));
    return;
  }
  e.respondWith(fetch(r).then(function(res){
    if(res&&res.ok){var c=res.clone();caches.open(CACHE).then(function(ch){ch.put(r,c);});}
    return res;
  }).catch(function(){return caches.match(r).then(function(m){return m||caches.match(DOC);});}));
});
