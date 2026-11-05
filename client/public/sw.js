// CFN service worker: network first so updates always arrive; cache is only an offline fallback.
var CACHE='cfn-v1';
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||u.pathname.indexOf('/api/')===0||u.pathname.indexOf('/s/')===0||u.pathname.indexOf('/i/')===0) return;
  e.respondWith(fetch(r).then(function(res){
    if(res&&res.ok){var c=res.clone();caches.open(CACHE).then(function(ch){ch.put(r,c);});}
    return res;
  }).catch(function(){return caches.match(r).then(function(m){return m||caches.match('/cfn.html');});}));
});
