import sys,json,re
src,dst,pvx=sys.argv[1],sys.argv[2],sys.argv[3]
h=open(src).read()
X=json.load(open(pvx))
def rep(old,new,cnt=1):
    global h
    assert h.count(old)==cnt,(old[:80],h.count(old))
    h=h.replace(old,new)
# ---------------- CSS
css='''
.wp-card.wp-pt{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),0 0 16px rgba(172,249,16,.16)}
.wp-ptl{color:var(--accent);font-weight:800;letter-spacing:.14em}
.wp-sh{padding:1px 9px;line-height:1.35}
'''
rep(".wp-hint i{font-style:normal;display:inline-block;transition:transform .15s}",css+".wp-hint i{font-style:normal;display:inline-block;transition:transform .15s}")
# ---------------- wpCard
rep('''function wpCard(k,m,i,live){
  var p=m.p, fa=p>=50, A=m.a, B=m.b;
  return '<div class="wp-card" tabindex="0"''','''function wpCard(k,m,i,live){
  var p=m.p, fa=p>=50, A=m.a, B=m.b, pt=!live&&pvPt(k,m);
  return '<div class="wp-card'+(pt?' wp-pt':'')+'" tabindex="0"''')
rep("""'<div class="wp-top"><span>Matchup '+(i+1)+(live?""","""'<div class="wp-top"><span>'+(pt?'<b class="wp-ptl">Primetime Matchup</b>':'Matchup '+(i+1))+(live?""")
rep("""+(live?'<button type="button" class="wp-sh" onclick="event.stopPropagation();shareMatch(\\''+k+'\\','+i+')" onkeydown="event.stopPropagation()">Share matchup</button>':'')+""","""+'<button type="button" class="wp-sh" onclick="event.stopPropagation();'+(live?'shareMatch':'sharePrevMatch')+'(\\''+k+'\\','+i+')" onkeydown="event.stopPropagation()">Share matchup</button>'+""")

# ---------------- consolidate tabs: Matchups = preview cards + (live cards while games are live) + old detail view
rep("tabs = ['Standings','Live Matchups','Matchups','Weekly Preview','Power Rankings'","tabs = ['Standings','Matchups','Weekly Preview','Power Rankings'")
rep("function lgRender(){\n  var k = lgState.k,","function lgRender(){\n  if(lgState.tab==='Live Matchups') lgState.tab='Matchups';\n  var k = lgState.k,")
rep("    try{ p.appendChild(rcView(k)); }catch(e){ console.error(e); }","    try{ if((PVL[k]||[]).some(function(m){return m.left>0&&!lvDec(m);})) lgLive(p,k); }catch(e){ console.error(e); }\n    try{ p.appendChild(rcView(k)); }catch(e){ console.error(e); }")

# ---------------- expanded card: position colors + bigger numbers (matches the old matchup view)
rep("""'<em class="wp-slot">'+r[0]+'</em>'""","""'<em class="wp-slot wp-s-'+r[0]+'">'+(r[0]==='FLX'?'<i class="w">W</i><i class="r">R</i><i class="t">T</i>':r[0])+'</em>'""")
rep(".wp-c b{font-weight:600;color:var(--muted);font-variant-numeric:tabular-nums}",""".wp-c b{font-weight:600;color:var(--muted);font-variant-numeric:tabular-nums}
.wp-full .wp-c b{font-family:'Bebas Neue','Impact',sans-serif;font-weight:400;font-size:21px;line-height:1;letter-spacing:.02em}
.wp-full .wp-slot{font-size:11px;padding:5px 0;border:1px solid transparent;border-radius:7px}
.wp-full .wp-slot i{font-style:normal}
.wp-slot.wp-s-QB{color:#5aa2ff;background:#5aa2ff1f;border-color:#5aa2ff55}
.wp-slot.wp-s-RB{color:#2fd3a4;background:#2fd3a41f;border-color:#2fd3a455}
.wp-slot.wp-s-WR{color:#ff9d2e;background:#ff9d2e1f;border-color:#ff9d2e55}
.wp-slot.wp-s-TE{color:#ff5fa6;background:#ff5fa61f;border-color:#ff5fa655}
.wp-slot.wp-s-FLX{background:#1a1d24;border-color:#2e3440;letter-spacing:1px}
.wp-slot.wp-s-FLX .w{color:#ff9d2e}.wp-slot.wp-s-FLX .r{color:#2fd3a4}.wp-slot.wp-s-FLX .t{color:#ff5fa6}
.wp-slot.wp-s-K,.wp-slot.wp-s-DEF{border-color:var(--border)}""")

# ---------------- mobile fit (names on one line) + desktop sizing
rep(".wp-slot.wp-s-K,.wp-slot.wp-s-DEF{border-color:var(--border)}",""".wp-slot.wp-s-K,.wp-slot.wp-s-DEF{border-color:var(--border)}
.wp-full .wp-c span:not(.wp-ph){text-overflow:clip}
@media(max-width:640px){
 .wp-full .wp-fr{grid-template-columns:1fr 38px 1fr;gap:4px}
 .wp-full .wp-c{gap:4px}
 .wp-full .wp-c .wp-ph{width:22px;height:22px}
 .wp-full .wp-c span:not(.wp-ph){font-size:11px}
 .wp-full .wp-c b{font-size:17px}
 .wp-full .wp-slot{font-size:9.5px;padding:4px 0;border-radius:6px}
 .wp-full .wp-au{display:none}
 .wp-full .wp-c span span{display:none}
 .wp-full .wp-c .wp-ph{width:20px;height:20px}
 .wp-full .wp-c b{font-size:16px}
}
@media(min-width:900px){
 .wp-full .wp-fr{grid-template-columns:1fr 64px 1fr;padding:8px 0;font-size:14px}
 .wp-full .wp-c .wp-ph{width:32px;height:32px}
 .wp-full .wp-c b{font-size:28px}
 .wp-full .wp-slot{font-size:13px;padding:7px 0}
}""")
js_fit="""
function wpFit(card){ try{ card.querySelectorAll('.wp-full .wp-c > span:not(.wp-ph)').forEach(function(sp){ sp.style.fontSize=''; var fs=parseFloat(getComputedStyle(sp).fontSize); while(sp.scrollWidth>sp.clientWidth+0.5&&fs>8){ fs-=0.5; sp.style.fontSize=fs+'px'; } }); }catch(_e){} }
"""

js_fit="""function wpFit(card){ try{ card.querySelectorAll('.wp-full .wp-c > span:not(.wp-ph)').forEach(function(sp){ var tn=sp.firstChild; if(!tn||tn.nodeType!==3) return; if(tn.__full===undefined) tn.__full=tn.nodeValue; tn.nodeValue=tn.__full; sp.style.fontSize=''; var fs=parseFloat(getComputedStyle(sp).fontSize), min=9; while(sp.scrollWidth>sp.clientWidth+0.5&&fs>min){ fs-=0.5; sp.style.fontSize=fs+'px'; } if(sp.scrollWidth>sp.clientWidth+0.5){ var w=tn.__full.trim().split(/\\s+/); if(w.length>1&&w[0].length>2){ tn.nodeValue=w[0].charAt(0)+'. '+w.slice(1).join(' '); fs=Math.max(fs,11); sp.style.fontSize=fs+'px'; while(sp.scrollWidth>sp.clientWidth+0.5&&fs>min){ fs-=0.5; sp.style.fontSize=fs+'px'; } } if(sp.scrollWidth>sp.clientWidth+0.5){ tn.nodeValue=tn.nodeValue.replace(/\\s+(Jr\\.?|Sr\\.?|II|III|IV)\\s*$/,''); } } }); }catch(_e){} }
function wpToggle(el){ var o=el.classList.toggle('open'); el.setAttribute('aria-expanded',o?'true':'false'); if(o) wpFit(el); }"""
rep("function wpToggle(el){ var o=el.classList.toggle('open'); el.setAttribute('aria-expanded',o?'true':'false'); }",js_fit)

# ---------------- podcast blurbs on the player detail card
import json as _j
_bl=_j.load(open('/tmp/lt/pt/podcast_blurbs.json'))
def _sec(t):
    a=t.split(':'); a=[int(x) for x in a]; return a[0]*3600+a[1]*60+a[2] if len(a)==3 else a[0]*60+a[1]
POD={n:[{"e":"Yahoo Fantasy Football · Josh & Hayden (with Matt Harmon)","d":"Week 10 show, Nov 10","ts":"2026-11-10T18:00:00-05:00","t":v["t"],"s":_sec(v["t"]),"v":"y_bLEh_MrCI","b":v["b"]}] for n,v in _bl.items()}
podjs="var POD_BL="+_j.dumps(POD,separators=(',',':'),ensure_ascii=False)+";\nfunction podBlock(n){ var a=POD_BL[n]; if(!a) return ''; return '<div class=\"pod-bl\"><div class=\"pod-h\">FROM THE SHOW</div>'+a.map(function(x){ return '<div class=\"pod-i\"><div class=\"pod-b\">'+esc(x.b)+'</div><div class=\"pod-s\">'+esc(x.e)+' \u00b7 '+esc(x.d)+' \u00b7 <a href=\"https://www.youtube.com/watch?v='+x.v+'&t='+x.s+'s\" target=\"_blank\" rel=\"noopener\">'+esc(x.t)+'</a></div></div>'; }).join('')+'</div>'; }\n"
rep("function detail(){var d=S.det;if(!d)return '';",podjs+"function detail(){var d=S.det;if(!d)return '';")
rep("  h+=buyBlock(p,lg,li,t);","  h+=podBlock(p.n);\n  h+=buyBlock(p,lg,li,t);")
rep(".wp-hint i{font-style:normal;display:inline-block;transition:transform .15s}",""".pod-bl{margin:12px 0 4px;border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:10px;padding:10px 12px;background:var(--bg3)}
.pod-h{font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--accent);margin-bottom:6px}
.pod-b{font-size:13px;line-height:1.5;color:var(--text)}
.pod-s{font-size:11px;color:var(--muted);margin-top:6px}
.pod-s a{color:var(--accent);text-decoration:none}
.wp-hint i{font-style:normal;display:inline-block;transition:transform .15s}""")

# ---------------- Hayden Winks feed (embedded snapshot + live refresh from the public gist)
_hw=_j.load(open('/tmp/lt/pt/hw_feed.json'))
_posts=[{"i":x["id"],"x":x["text"],"d":x["published_at"],"u":x["url"],"p":x.get("players",[]),"a":x.get("article_url",""),"au":x.get("author",""),"hd":x.get("handle","")} for x in _hw["posts"]]
_ranks=[{"pos":r["position"],"wk":r["week"],"u":r.get("article_url") or r.get("post_url"),"ts":r.get("published_at",""),"t":r.get("title",""),"r":[[q["rank"],q["player"],q.get("opponent",""),q.get("proj_total_yards"),q.get("blurb",""),q.get("blurb_url","")] for q in r["ranks"]]} for r in _hw.get("weekly_ranks",[])]
hwjs="var HW_FEED="+_j.dumps({"posts":_posts,"ranks":_ranks,"gen":_hw.get("generated_at","")},separators=(',',':'),ensure_ascii=False)+";\n"+r"""var HW_URL='https://gist.githubusercontent.com/cuadz22/1d8a87d05a2a13104516e02326cf8dca/raw/hayden-winks.json';
(function(){ try{ fetch(HW_URL+'?t='+Math.floor(Date.now()/600000),{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(j){ if(!j||!j.posts||!j.posts.length) return;
  HW_FEED={posts:j.posts.map(function(x){return {i:x.id,x:x.text,d:x.published_at,u:x.url,p:x.players||[],a:x.article_url||'',au:x.author||'',hd:x.handle||''};}),ranks:(j.weekly_ranks||[]).map(function(r){return {pos:r.position,wk:r.week,u:r.article_url||r.post_url,ts:r.published_at||'',t:r.title||'',r:(r.ranks||[]).map(function(q){return [q.rank,q.player,q.opponent||'',q.proj_total_yards,q.blurb||'',q.blurb_url||''];})};}),gen:j.generated_at||''}; }).catch(function(){}); }catch(e){} })();
function hwClean(t){ return String(t||'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/https?:\/\/t\.co\/\S+/g,'').replace(/[ \t]+\n/g,'\n').trim(); }
function hwDate(s){ var d=new Date(s); if(isNaN(d)) return ''; return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+' '+d.getDate(); }
function hwBlock(n){ try{
  var key=NRM(n), full=String(n).toLowerCase(), out=[];
  HW_FEED.posts.forEach(function(x){ var hit=(x.p||[]).some(function(q){return NRM(q)===key;}); if(!hit&&full.split(' ').length>1&&NRM(x.x).indexOf(key)>=0) hit=true; var tx=hwClean(x.x); if(hit&&tx.length>=18) out.push({x:x,t:tx}); });
  out.sort(function(a,b){return new Date(b.x.d)-new Date(a.x.d);}); out=out.slice(0,3);
  var rk=''; HW_FEED.ranks.forEach(function(g){ (g.r||[]).forEach(function(q){ if(NRM(q[1])===key) rk='<div class="pod-rk"><b>'+esc(g.pos)+' #'+q[0]+'</b> in Hayden\u2019s Week '+g.wk+' ranks'+(q[2]?' \u00b7 '+esc(q[2]):'')+(q[3]!=null?' \u00b7 '+q[3]+' proj. yds':'')+' \u00b7 <a href="'+esc(g.u)+'" target="_blank" rel="noopener">Blueprint</a>'+(q[4]?'<div class="pod-b" style="margin-top:6px">'+esc(q[4])+'</div>':'')+'</div>'; }); });
  if(!out.length&&!rk) return '';
  var nm=[]; out.forEach(function(o){ var a=o.x.au||'Hayden Winks'; if(nm.indexOf(a)<0) nm.push(a); }); if(rk&&nm.indexOf('Hayden Winks')<0) nm.unshift('Hayden Winks'); var mixed=nm.length>1;
  return '<div class="pod-bl"><div class="pod-h">'+esc(nm.join(' \u00b7 ').toUpperCase())+'</div>'+rk+out.map(function(o){ return '<div class="pod-i"><div class="pod-b">'+esc(o.t).replace(/\n/g,'<br>')+'</div><div class="pod-s">'+(mixed?'<b>'+esc(o.x.au||'Hayden Winks')+'</b> \u00b7 ':'')+hwDate(o.x.d)+' \u00b7 <a href="'+esc(o.x.u)+'" target="_blank" rel="noopener">View post</a>'+(o.x.a?' \u00b7 <a href="'+esc(o.x.a)+'" target="_blank" rel="noopener">Article</a>':'')+'</div></div>'; }).join('')+'</div>'; }catch(e){ return ''; } }
"""
rep("function detail(){var d=S.det;if(!d)return '';",hwjs+"function detail(){var d=S.det;if(!d)return '';")
rep("  h+=podBlock(p.n);\n","  h+=podBlock(p.n);\n  h+=hwBlock(p.n);\n")
rep(".pod-s a{color:var(--accent);text-decoration:none}",".pod-s a{color:var(--accent);text-decoration:none}\n.pod-bl .pod-i+.pod-i{margin-top:10px;padding-top:10px;border-top:1px solid var(--border)}\n.pod-rk{font-size:12.5px;color:var(--text);margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)}.pod-rk b{color:var(--accent)}.pod-rk a{color:var(--accent);text-decoration:none}")

# ---------------- new-blurb alert badges
badgejs=r"""
function hwStamp(n){ var key=NRM(n),m=0,t;
  try{ HW_FEED.posts.forEach(function(x){ var hit=(x.p||[]).some(function(q){return NRM(q)===key;}); if(!hit&&String(n).indexOf(' ')>0&&NRM(x.x).indexOf(key)>=0) hit=true; if(hit&&hwClean(x.x).length>=18){ t=Date.parse(x.d); if(t>m) m=t; } });
    HW_FEED.ranks.forEach(function(g){ (g.r||[]).forEach(function(q){ if(NRM(q[1])===key){ t=Date.parse(g.ts||''); if(!(t>0)) t=Date.parse(HW_FEED.gen||''); if(t>m) m=t; } }); }); }catch(e){}
  try{ (POD_BL[n]||[]).forEach(function(x){ t=Date.parse(x.ts||''); if(t>m) m=t; }); }catch(e){}
  return m; }
function hwSeen(){ try{ return JSON.parse(localStorage.getItem('cfn_seen_v1')||'{}'); }catch(e){ return {}; } }
function hwSave(o){ try{ localStorage.setItem('cfn_seen_v1',JSON.stringify(o)); }catch(e){} }
function hwBadges(root){
  var seen=hwSeen(), els=root.querySelectorAll('.cm-card[data-det],.pl-main[data-det]');
  els.forEach(function(e){ if(e.closest('.sc-modal')) return; var n=e.dataset.det, st=hwStamp(n); if(st>(seen[n]||0)&&!e.querySelector('.cm-new')){ var b=document.createElement('span'); b.className='cm-new'; b.title='New blurb or ranking posted'; b.textContent='!'; e.appendChild(b); } });
  if(S&&S.det){ var d=S.det.n, sv=hwSeen(), s2=hwStamp(d); if(s2>(sv[d]||0)){ sv[d]=s2; hwSave(sv); } }
  var mine=[]; try{ Object.keys(C.rosters).forEach(function(lg){ ((C.rosters[lg]||{}).Cuadz||[]).forEach(function(x){ if(mine.indexOf(x[1])<0) mine.push(x[1]); }); }); }catch(e){}
  var fresh=mine.filter(function(n){ return hwStamp(n)>(seen[n]||0); });
  var old=root.querySelector('.cm-newbar'); if(old) old.remove();
  if(fresh.length&&!(S&&S.det)){ var bar=document.createElement('div'); bar.className='cm-newbar'; bar.innerHTML='<span class="cm-new" style="position:static">!</span><span><b>'+fresh.length+'</b> of your players '+(fresh.length===1?'has':'have')+' a new blurb or ranking: '+fresh.slice(0,4).map(esc).join(', ')+(fresh.length>4?' +'+(fresh.length-4)+' more':'')+'</span><button type="button" class="cm-chip">Mark all read</button>';
    bar.querySelector('button').onclick=function(){ var sv=hwSeen(); (C.players||[]).forEach(function(p){ var t=hwStamp(p.n); if(t) sv[p.n]=t; }); hwSave(sv); render(); };
    var first=root.querySelector('.cm-intro')||root.firstChild; if(first&&first.nextSibling) root.insertBefore(bar,first.nextSibling); else root.appendChild(bar); }
}
"""
rep("function hwBlock(n){ try{",badgejs+"function hwBlock(n){ try{")
rep("  var y=window.scrollY; root.innerHTML=h; wire(); ","  var y=window.scrollY; root.innerHTML=h; wire(); try{hwBadges(root);}catch(_e){}\n")
rep(".pod-rk{font-size:12.5px",""".cm-card[data-det],.pl-main[data-det]{position:relative}
.cm-new{position:absolute;top:-7px;right:-7px;width:20px;height:20px;border-radius:50%;background:#ff9f1c;color:#111;font:800 13px/20px Inter,sans-serif;text-align:center;border:2px solid var(--bg);z-index:3;box-sizing:content-box;display:inline-block}
.cm-newbar{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px 10px;margin:10px 0;padding:10px 12px;border:1px solid #ff9f1c66;background:#ff9f1c14;border-radius:10px;font-size:12.5px;color:var(--text)}
.cm-newbar .cm-new{top:auto;right:auto;margin-right:2px}
.cm-newbar button{grid-column:1/-1;justify-self:end}
.pod-rk{font-size:12.5px""")

# ---------------- Hayden's weekly ranks vs my lineup (My lineup tab)
rankjs=r"""
function hwRanks(){ try{
  var lists={}; HW_FEED.ranks.forEach(function(g){ if(!lists[g.pos]||g.wk>lists[g.pos].wk) lists[g.pos]=g; });
  var poss=['QB','RB','WR','TE','K','DEF'].filter(function(x){return lists[x];});
  var h='<div class="cm-box hw-box"><div class="cm-lab" style="margin-bottom:4px">Hayden Winks weekly ranks vs your lineup</div>';
  if(!poss.length) return h+'<div class="cm-sub2">No weekly ranks in the feed yet.</div></div>';
  if(!S.hwpos||!lists[S.hwpos]) S.hwpos=poss[0];
  var g=lists[S.hwpos], rk={}; (g.r||[]).forEach(function(q){ rk[NRM(q[1])]={r:q[0],o:q[2],y:q[3],n:q[1]}; });
  var byN={}; C.players.forEach(function(p){byN[p.n]=p;});
  var mine=(C.roster[S.mlg]||[]).map(function(x){ var p=byN[x[1]]; return p&&p.p===S.hwpos?{n:x[1],slot:x[0],q:rk[NRM(x[1])]||null}:null; }).filter(Boolean);
  mine.sort(function(a,b){ return (a.q?a.q.r:999)-(b.q?b.q.r:999); });
  var isS=function(x){return x.slot!=='BN'&&x.slot!=='IR';};
  h+='<div class="hw-chips">'+poss.map(function(x){ return '<button type="button" class="cm-chip'+(x===S.hwpos?' on':'')+'" data-hwpos="'+x+'">'+x+'<small> Wk '+lists[x].wk+'</small></button>'; }).join('')+'</div>';
  if(poss.length<4) h+='<div class="cm-sub2" style="margin:2px 0 6px">Only '+poss.join(', ')+' ranks are in the feed so far. The other positions appear here as soon as Hayden’s Blueprint for them is added.</div>';
  if(!mine.length){ return h+'<div class="cm-sub2">You have no '+S.hwpos+' on this roster.</div></div>'; }
  var swaps=[]; mine.forEach(function(b){ if(isS(b)||!b.q) return; mine.forEach(function(a){ if(isS(a)&&a.q&&b.q.r<a.q.r) swaps.push([b,a]); }); });
  h+=mine.map(function(m){ var st=isS(m);
    return '<div class="hw-r'+(st?' st':'')+'" data-det="'+esc(m.n)+'" data-dlg="'+S.mlg+'" role="button" tabindex="0"><span class="hw-n">'+(m.q?'#'+m.q.r:'—')+'</span><span class="hw-p">'+esc(m.n)+'<small>'+(m.q&&m.q.o?esc(m.q.o)+(m.q.y!=null?' · '+m.q.y+' proj yds':''):(m.q?'':'Not ranked by Hayden'))+'</small></span><span class="hw-s">'+(st?esc(m.slot):'Bench')+'</span></div>'; }).join('');
  if(swaps.length) h+='<div class="hw-sw"><b>Check your lineup:</b> '+swaps.slice(0,3).map(function(x){ return 'Hayden has <b>'+esc(x[0].n)+'</b> (#'+x[0].q.r+', bench) above <b>'+esc(x[1].n)+'</b> (#'+x[1].q.r+', starting)'; }).join('; ')+'.</div>';
  h+='<div class="cm-sub2" style="margin-top:6px">From <a href="'+esc(g.u)+'" target="_blank" rel="noopener" style="color:var(--accent)">'+esc(g.t||('Hayden Winks '+S.hwpos+' Blueprint'))+'</a>. Green rows are in your Yahoo starting lineup.</div></div>';
  return h; }catch(e){ return ''; } }
"""
rep("function hwBlock(n){ try{",rankjs+"function hwBlock(n){ try{")
rep("  var alerts=[];\n","  h+=hwRanks();\n  var alerts=[];\n")
rep("function hwBadges(root){\n","function hwBadges(root){\n  root.querySelectorAll('[data-hwpos]').forEach(function(b){ b.onclick=function(){ S.hwpos=b.dataset.hwpos; render(); }; });\n")
rep(".cm-newbar button{grid-column:1/-1;justify-self:end}",""".cm-newbar button{grid-column:1/-1;justify-self:end}
.hw-chips{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 8px}
.hw-chips small{opacity:.7;font-size:10px}
.hw-r{display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:10px;margin-bottom:6px;cursor:pointer;background:var(--bg3)}
.hw-r.st{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 9%,var(--bg3))}
.hw-n{font:400 22px 'Bebas Neue','Impact',sans-serif;color:var(--accent);text-align:center}
.hw-p{font-weight:600;font-size:13.5px;display:flex;flex-direction:column;min-width:0}.hw-p small{font-weight:400;font-size:11px;color:var(--muted)}
.hw-s{font-size:10.5px;font-weight:800;letter-spacing:.08em;color:var(--muted);text-transform:uppercase}
.hw-r.st .hw-s{color:var(--accent)}
.hw-sw{margin-top:8px;padding:8px 10px;border:1px solid #ff9f1c88;background:#ff9f1c14;border-radius:10px;font-size:12.5px}""")
# ---------------- My team cards clickable + League Outlook team roster dropdown
rep("""function prow(r){var isW=weak[r.p.p]===r;return '<div class="cm-card'+(isW?' me':'')+'">""","""function prow(r){var isW=weak[r.p.p]===r;return '<div class="cm-card'+(isW?' me':'')+'" data-det="'+dq(r.p.n)+'" data-dlg="'+S.mlg+'" tabindex="0" role="button">""")
rep("""pk+='<div class="cm-card"><div class="cm-top">'+photo(i.p.n)""","""pk+='<div class="cm-card" data-det="'+dq(i.p.n)+'" data-dlg="'+S.mlg+'" tabindex="0" role="button"><div class="cm-top">'+photo(i.p.n)""")
rep("""return '<div class="cm-top">'+photo(g.p.n)""","""return '<div class="cm-top" data-det="'+dq(g.p.n)+'" data-dlg="'+S.mlg+'" tabindex="0" role="button">'+photo(g.p.n)""")
rep("""<div class="cm-top">'+photo(x.t.p.n)""","""<div class="cm-top" data-det="'+dq(x.t.p.n)+'" data-dlg="'+S.mlg+'" tabindex="0" role="button">'+photo(x.t.p.n)""")
otjs=r"""
function otRoster(lg){ try{
  var rows=teamRows(lg), sel=(S.otm&&S.otm[lg])||'Cuadz'; if(!rows.some(function(r){return r.ow===sel;})) sel='Cuadz';
  var li=LG.indexOf(lg), B=byNm(), ros=ownerRoster(lg,sel)||[];
  var me=rows.filter(function(r){return r.ow===sel;})[0]||{};
  var opts=rows.slice().sort(function(a,b){ return a.me?-1:b.me?1:String(a.team||a.ow).localeCompare(String(b.team||b.ow)); }).map(function(r){ return '<option value="'+esc(r.ow)+'"'+(r.ow===sel?' selected':'')+'>'+esc(r.team||r.ow)+' — '+esc(r.ow)+(r.ow==='Cuadz'?' (you)':'')+'</option>'; }).join('');
  function card(x){ var p=B[x[1]]; if(!p) return ''; var i=pinfo(p,li), sl=x[0]==='BN'?'Bench':x[0];
    return '<div class="cm-card" data-det="'+dq(p.n)+'" data-dlg="'+lg+'" tabindex="0" role="button"><div class="cm-top">'+photo(p.n)+'<div class="cm-grow"><div class="cm-nm">'+esc(p.n)+badge(p.n)+'</div><div class="cm-sub2">'+(sl===p.p?'':esc(sl)+' · ')+p.p+' · '+p.t+(C.inj&&C.inj[p.n]?' · <b style="color:#ff9f1c">'+(C.inj[p.n]==='O'?'OUT':C.inj[p.n]==='Q'?'Q':esc(C.inj[p.n]))+'</b>':'')+'</div></div><div class="cm-val"><b style="color:var(--text)">'+(i&&i.ok?i.exp.toFixed(1):'–')+'</b><span>exp pts/game</span></div></div></div>'; }
  var st=ros.filter(function(x){return x[0]!=='BN'&&x[0]!=='IR';}), bn=ros.filter(function(x){return x[0]==='BN';}), ir=ros.filter(function(x){return x[0]==='IR';});
  var grid=function(a){ return '<div class="cm-grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">'+(a.map(card).join('')||'<div class="cm-sub2">None</div>')+'</div>'; };
  return '<div class="cm-box"><div class="cm-lab" style="margin-bottom:6px">Team roster</div><select class="ot-sel" data-otm="'+lg+'" aria-label="Choose a team">'+opts+'</select>'+(me.team?'<div class="cm-sub2" style="margin-top:6px">'+esc(me.team)+' · '+esc(sel)+'</div>':'')+'</div>'+
    '<div class="cm-sec">Starters</div>'+grid(st)+'<div class="cm-sec">Bench</div>'+grid(bn)+(ir.length?'<div class="cm-sec">Injured reserve</div>'+grid(ir):''); }catch(e){ return ''; } }
"""
rep("function outlook(){\n",otjs+"function outlook(){\n")
rep("  var all=[];oth.forEach(function(r){r.pl.forEach(function(x){all.push({x:x,ow:r.ow});});});","  h+=otRoster(lg);\n  var all=[];oth.forEach(function(r){r.pl.forEach(function(x){all.push({x:x,ow:r.ow});});});")
rep("function hwBadges(root){\n","function hwBadges(root){\n  root.querySelectorAll('[data-otm]').forEach(function(sl){ sl.onchange=function(){ S.otm=S.otm||{}; S.otm[sl.dataset.otm]=sl.value; render(); }; });\n")
rep(".hw-chips{display:flex",""".ot-sel{width:100%;max-width:420px;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font:600 14px inherit}
.cm-top[data-det]{cursor:pointer}
.hw-chips{display:flex""")


# ---------------- Chip assistant
_chip=open('/tmp/lt/pt/chip.js').read()
rep("function checker(){\n",_chip+"\nfunction checker(){\n")
rep("]];\nfunction grpOf(t)","""],
 ['k','Chip','Ask about trades and lineups',[['k','Ask Chip']],'ask <i>Chip</i> a question in plain words, by typing or talking. Try a trade (<i>In Gentlemen\\u2019s, I send A and B for C, should I do it?</i>), a player, or your weak lineup spots. Chip uses the same values and lineup math as the rest of Commish Tools and can read the answer out loud.']];
function grpOf(t)""")
rep("S.tab==='c'?S.clg:S.tab==='w'","S.tab==='c'?S.clg:S.tab==='k'?(S.chipLg||'gl'):S.tab==='w'")
rep("S.tab==='c'?checker():","S.tab==='k'?chipView():S.tab==='c'?checker():")
rep("function hwBadges(root){\n","function hwBadges(root){\n  try{chipMount(root);}catch(_c){}\n")
rep(".ot-sel{width:100%",""".chip-box{border:1px solid var(--border);border-radius:16px;padding:14px;background:var(--bg3)}
.chip-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.chip-av{width:40px;height:40px;border-radius:12px;background:var(--accent);color:#0b0d0a;display:grid;place-items:center;font:400 26px 'Bebas Neue','Impact',sans-serif;flex:none}
.chip-id{display:flex;flex-direction:column;min-width:0;flex:1}.chip-id b{font-size:17px}.chip-id small{color:var(--muted);font-size:12px}
.chip-tg{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);background:transparent;color:var(--muted);border-radius:999px;padding:7px 11px;font:600 12px inherit;cursor:pointer}
.chip-tg.on{border-color:var(--accent);color:var(--accent)}
.chip-in{display:flex;gap:8px;margin-top:12px}
.chip-in input{flex:1;min-width:0;padding:13px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text);font:500 16px inherit}
.chip-in input:focus{outline:2px solid var(--accent);outline-offset:0}
.chip-mic,.chip-send{width:48px;flex:none;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text);display:grid;place-items:center;cursor:pointer}
.chip-send{background:var(--accent);border-color:var(--accent);color:#0b0d0a}
.chip-mic.live{background:#e53935;border-color:#e53935;color:#fff;animation:chipPulse 1.1s infinite}
@keyframes chipPulse{0%{box-shadow:0 0 0 0 rgba(229,57,53,.5)}100%{box-shadow:0 0 0 14px rgba(229,57,53,0)}}
.chip-hint{font-size:12px;color:var(--muted);margin:8px 2px 0}
.chip-sug{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.chip-s,.chip-btn{border:1px solid var(--border);background:transparent;color:var(--text);border-radius:999px;padding:8px 12px;font:500 12.5px inherit;cursor:pointer;text-align:left}
.chip-btn{border-color:var(--accent);color:var(--accent);font-weight:700}
.chip-th{display:flex;flex-direction:column;gap:10px;margin-top:14px}
.chip-m{display:flex}.chip-m.u{justify-content:flex-end}
.chip-b{max-width:100%;border-radius:14px;padding:11px 13px;font-size:14px;line-height:1.45}
.chip-m.u .chip-b{background:var(--accent);color:#0b0d0a;font-weight:600;max-width:88%}
.chip-m.c{flex-direction:column;align-items:flex-start;gap:6px}.chip-m.c .chip-b{background:var(--bg);border:1px solid var(--border);width:100%;box-sizing:border-box}
.chip-hd2{font:600 11.5px inherit;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.chip-ln{margin:5px 0}
.chip-deal{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:start;margin:4px 0 10px}
.chip-deal span:first-child{display:block;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.chip-arrow{align-self:center;color:var(--muted);font-size:18px}
.chip-pl{display:inline-block;border:1px solid var(--border);border-radius:8px;padding:5px 9px;margin:0 6px 6px 0;font-weight:600;font-size:13px;cursor:pointer;background:var(--bg3)}
.chip-pl:hover{border-color:var(--accent)}
.chip-verd{display:inline-block;font:600 17px inherit;padding:6px 12px;border-radius:10px;margin:2px 0 6px;border:1px solid}
.chip-verd.g{color:#78c83c;border-color:rgba(120,200,60,.6);background:rgba(120,200,60,.1)}.chip-verd.a{color:#f5a623;border-color:rgba(245,166,35,.6);background:rgba(245,166,35,.1)}.chip-verd.r{color:#ff6b61;border-color:rgba(229,57,53,.6);background:rgba(229,57,53,.1)}
.chip-take{margin:10px 0 4px;padding:10px 12px;border-left:3px solid var(--accent);background:color-mix(in srgb,var(--accent) 8%,transparent);border-radius:0 10px 10px 0}
.chip-note{font-size:12px;color:var(--muted);margin-top:8px}
.chip-act{margin-top:10px;display:flex;gap:6px;flex-wrap:wrap}
.chip-play{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);background:transparent;color:var(--muted);border-radius:999px;padding:6px 12px;font:600 12px inherit;cursor:pointer}
.chip-play.on{border-color:var(--accent);color:var(--accent)}
@media (max-width:520px){.chip-deal{grid-template-columns:1fr}.chip-arrow{transform:rotate(90deg);justify-self:start}.chip-tg span{display:none}.chip-tg{padding:8px}}
.ot-sel{width:100%""")


# ---------------- FAAB shown as cash in trade cards
rep("""<span class="tc-v">'+(d.v==null?(o?'n/a':'not valued'):fmt(d.v))""","""<span class="tc-v">'+(/FAAB/i.test(n)?'FAAB':d.v==null?(o?'n/a':'not valued'):fmt(d.v))""")
rep("""'+t.a.gets.length+'-for-'+t.b.gets.length+'""","""'+t.a.gets.filter(function(x){return !/FAAB/i.test(x);}).length+'-for-'+t.b.gets.filter(function(x){return !/FAAB/i.test(x);}).length+(t.a.gets.concat(t.b.gets).some(function(x){return /FAAB/i.test(x);})?' + FAAB':'')+'""")


# ---------------- Lineup Watch
_lw=open('/tmp/lt/pt/lw.js').read()
rep("function checker(){\n",_lw+"\nfunction checker(){\n")
rep("  h+='<div class=\"cm-use\"><b>Use this to:</b> '+g[4]+'</div>';","  h+=lwBanner();\n  h+='<div class=\"cm-use\"><b>Use this to:</b> '+g[4]+'</div>';")
rep("  h+=hwRanks();\n","  h+=lwSection(S.mlg);\n  h+=hwRanks();\n")
rep("function hwBadges(root){\n","function hwBadges(root){\n  root.querySelectorAll('[data-lw]').forEach(function(b){ b.onclick=function(){ S.mlg=b.dataset.lw; S.tab='m'; S.det=null; render(); window.scrollTo({top:0}); setTimeout(function(){ var e=document.getElementById('lw-'+S.mlg); if(e) e.scrollIntoView({behavior:'smooth',block:'start'}); },60); }; });\n")
rep(".chip-box{border:1px",".lw-fa{display:flex;flex-wrap:wrap;gap:4px}.lw-fa small{color:var(--muted);font-weight:400;margin-left:4px}.lw-wk+.lw-wk{margin-top:10px;padding-top:10px;border-top:1px solid var(--border)}\n.chip-box{border:1px")
rep("    if(weak||(!P.length&&","    if(/\\b(bye|byes|zero|empty|open spots?|holes?|short|alert|alerts)\\b/.test(lowt)&&!P.length)return lwAnswer(lg);\n    if(weak||(!P.length&&")

rep('Week 9 outlook','Week 10 outlook')
# ---------------- Week 10 live (Thursday night snapshot)
_pvl=json.load(open('/tmp/lt/l10/pvl10.json'))
_m=re.search(r'var PVL=\{.*?\};(?=var PVL_AT)',h,re.S); assert _m
h=h[:_m.start()]+'var PVL='+json.dumps(_pvl,ensure_ascii=False)+';'+h[_m.end():]
rep('PVL_AT="Nov 10, all Week 9 games final";','PVL_AT="Friday, Nov 13, after Thursday Night Football";')
rep("""<div class="subsec-hd">Week 9 Results &middot; Final</div>""","""<div class="subsec-hd">Week 10 &middot; Live</div>""")
_a=h.index("<p class=\"lv-note\">All '+M.length+' Week 9 matchups are final")
_b=h.index("Career and season highs",_a)
h=h[:_a]+"<p class=\"lv-note\">Week 10 is under way, so these are early scores. '+alive+' of '+M.length+' matchups are still undecided. Scores and projections from Yahoo, '+PVL_AT+'. Win odds are recalculated from each team&rsquo;s live projected total, so they move as games finish. Players marked live or to play show their projection (~) until they score. "+h[_b:]
# ---------------- live card style: no green box, "in play" tag + subtle proj label
rep(".wp-c.tp,.wp-pl>div.tp{box-shadow:inset 0 0 0 1px var(--accent);border-radius:7px;background:rgba(172,249,16,.10)}\n",".wp-c.tp,.wp-pl>div.tp{}\n")
rep(".wp-c.tp b,.wp-pl>div.tp b{font-style:italic;color:var(--accent)}\n",".wp-c.tp b,.wp-pl>div.tp b{font-style:normal}\n.wp-pj{font-family:Inter,system-ui,sans-serif;font-size:9px;font-weight:500;letter-spacing:.05em;text-transform:uppercase;color:var(--dim);margin-right:4px;vertical-align:3px}\n")
rep(" .wp-full .wp-au{display:none}\n"," .wp-full .wp-au{display:block;width:max-content;margin:2px 0 0;font-size:8px;line-height:1.5;letter-spacing:.05em}\n .wp-full .wp-c.r .wp-au{margin-left:auto}\n .wp-full .wp-pj{font-size:8px;margin-right:3px}\n")
rep("(au===4?'live':au>=3?'to play':au===2?'final':'auto')","(au>=3?'in play':au===2?'final':'auto')")
rep("(au>=3?'~':'')+v.toFixed(1)","(au===3?'<small class=\"wp-pj\">proj</small>':'')+v.toFixed(1)")
# ---------------- live card colors: white numbers, final vs projection green/orange
rep("rows.push([a[0]||b[0],a[1],a[2],b[1],b[2],a[3],b[3]]);","rows.push([a[0]||b[0],a[1],a[2],b[1],b[2],a[3],b[3],a[4],b[4]]);")
rep("rows.push(['K',m.ka[0],m.ka[1],m.kb[0],m.kb[1],m.ka[2],m.kb[2]]); rows.push(['DEF',m.da[0],m.da[1],m.db[0],m.db[1],m.da[2],m.db[2]]);","rows.push(['K',m.ka[0],m.ka[1],m.kb[0],m.kb[1],m.ka[2],m.kb[2],m.ka[3],m.kb[3]]); rows.push(['DEF',m.da[0],m.da[1],m.db[0],m.db[1],m.da[2],m.db[2],m.da[3],m.db[3]]);")
rep("wpCell(r[1],r[2],r[2]>r[4],'l',r[0]==='K'||r[0]==='DEF',r[5])","wpCell(r[1],r[2],r[2]>r[4],'l',r[0]==='K'||r[0]==='DEF',r[5],r[7])")
rep("wpCell(r[3],r[4],r[4]>r[2],'r',r[0]==='K'||r[0]==='DEF',r[6])","wpCell(r[3],r[4],r[4]>r[2],'r',r[0]==='K'||r[0]==='DEF',r[6],r[8])")
rep("function wpCell(n,v,hi,al,nop,au){ var ok=n&&n!=='—'&&n!=='None'; return '<div class=\"wp-c '+al+(hi?' hi':'')+(au>=3?' tp':'')+'\">'","function wpCell(n,v,hi,al,nop,au,pj){ var ok=n&&n!=='—'&&n!=='None'; var pc=(ok&&au===2&&pj!=null&&pj!==undefined)?(v>pj?' ov':v<pj?' un':''):''; return '<div class=\"wp-c '+al+(hi?' hi':'')+(au>=3?' tp':'')+pc+'\">'")
rep(".wp-pj{font-family",".wp-full .wp-c b,.wp-full .wp-c.hi b{color:var(--text)}\n.wp-full .wp-c.ov b{color:var(--accent)}\n.wp-full .wp-c.un b{color:#ff7a59}\n.wp-pj{font-family")
rep('<div class="subsec-hd">Week 10 &middot; Live</div>','<div class="subsec-hd" style="display:flex;align-items:center;gap:8px">Week 10 &middot; Live <span class="lv-pill"><i></i>LIVE</span></div>')
rep("@keyframes cfnIn{","@keyframes lvDot{0%{box-shadow:0 0 0 0 rgba(255,59,48,.6)}70%,100%{box-shadow:0 0 0 5px rgba(255,59,48,0)}}\n.lv-pill{display:inline-flex;align-items:center;gap:5px;padding:2px 8px 2px 6px;border-radius:99px;border:1px solid rgba(255,59,48,.45);background:rgba(255,59,48,.12);color:var(--text);font-size:8.5px;font-weight:800;letter-spacing:.14em}\n.lv-pill i{width:6px;height:6px;border-radius:50%;background:#ff3b30;animation:lvDot 1.6s ease-out infinite}\n@media (prefers-reduced-motion:reduce){.lv-pill i{animation:none}}\n@keyframes cfnIn{")
rep("pt=!live&&pvPt(k,m);","pt=pvPt(k,m);")
rep("' · Week 9 final';","' · Week 10 live';")
rep("  <!-- Road to the Playoffs card -->","""  <!-- Week 10 live matchups card -->
  <div id="live-card-wrap">
    <div class="feat-card rd-feat" onclick="showLive()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showLive();}">
      <div class="feat-bar"></div>
      <div class="rd-fb"><img class="rd-flogo" alt="" id="lv-flogo"><div class="rd-ftx"><span class="feat-eye" style="display:flex;align-items:center;gap:8px">Cuadz Fantasy Network &middot; Week 10 <span class="lv-pill"><i></i>LIVE</span></span><div class="feat-title">Week 10 Matchups</div><div class="feat-desc" style="max-width:none" id="lv-fdesc">Live scores, win odds and full lineups for every matchup in all four leagues, primetime games included.</div></div><span class="feat-cta">View &rarr;</span></div>
    </div>
  </div>

  <!-- Road to the Playoffs card -->""")
rep("<!-- ROAD TO THE PLAYOFFS VIEW -->","""<style>.lvh-sec{display:flex;flex-direction:column;gap:10px}.lvh-hd{display:flex;align-items:center;gap:10px;padding-bottom:4px;border-bottom:.5px solid var(--border);font-size:13px;font-weight:700;letter-spacing:.02em;color:var(--text)}.lvh-hd .lvh-n{margin-left:auto;font-size:9.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}.lvh-hd img{height:26px;width:auto;max-width:56px;object-fit:contain}#view-live .rd-hdr .art-title{display:flex;align-items:center;gap:12px;flex-wrap:wrap}#lv-list{display:flex;flex-direction:column;gap:26px;margin-top:6px}</style>
<!-- WEEK 10 LIVE MATCHUPS VIEW -->
<div id="view-live" class="page" hidden>
  <div><button class="art-back" onclick="showHome()">&larr; Network Home</button></div>
  <div class="rd-hdr"><img class="rd-hlogo" alt="Cuadz Fantasy Network" id="lv-hlogo"><div><div class="art-eye">Cuadz Fantasy Network &middot; Week 10</div><div class="art-title" style="margin-bottom:4px">Week 10 Matchups <span class="lv-pill" style="font-size:10px;padding:3px 10px 3px 8px"><i></i>LIVE</span></div><div class="art-meta" id="lv-meta"></div></div></div>
  <p class="lv-note" id="lv-note" style="margin:12px 0 4px"></p>
  <div id="lv-list"></div>
</div>

<!-- ROAD TO THE PLAYOFFS VIEW -->""")
rep("</script>\n</body></html>","""function liveAlive(k){ return (PVL[k]||[]).filter(function(m){return m.left>0&&!lvDec(m);}).length; }
function liveRender(){
  var ks=['gl','bh','rb','sts'], tot=0, al=0, out='';
  ks.forEach(function(k){ var M=PVL[k]||[], a=liveAlive(k); tot+=M.length; al+=a;
    out+='<div class="lvh-sec"><div class="lvh-hd">'+lgLogoImg(k).replace('height:1.05em;width:auto;max-width:2.4em;','height:26px;width:auto;max-width:56px;')+'<span>'+lgEsc(LGI[k].name)+'</span><span class="lvh-n">'+a+' of '+M.length+' undecided</span></div><div class="wp-grid">'+M.map(function(m,i){return wpCard(k,m,i,true);}).join('')+'</div></div>'; });
  document.getElementById('lv-list').innerHTML=out;
  document.getElementById('lv-meta').textContent='All four leagues \\u00b7 '+tot+' matchups \\u00b7 '+al+' undecided';
  document.getElementById('lv-note').innerHTML='Scores and projections from Yahoo, '+PVL_AT+'. Win odds are recalculated from each team&rsquo;s live projected total, so they move as games finish. Players marked in play show their projection until they score; finished players are green above projection and orange below. Tap any matchup for full lineups.';
}
function showLive(){
  document.querySelectorAll('[id^="view-"]').forEach(function(v){ v.hidden=true; });
  document.getElementById('view-live').hidden=false;
  try{ setNav('ntab-net'); }catch(e){}
  liveRender(); try{ history.replaceState(null,'','#live'); }catch(e){}
  window.scrollTo({top:0,behavior:'smooth'});
}
(function(){
  var im=document.querySelector('#app-header .logo img'); if(im){ ['lv-flogo','lv-hlogo'].forEach(function(id){ var e=document.getElementById(id); if(e) e.src=im.src; }); }
  function off(){ var v=document.getElementById('view-live'); if(v) v.hidden=true; if(location.hash==='#live'){ try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){} } }
  ['showHome','showArticle','showStudio','showLeague','showTab','showNoRecap','showRoad'].forEach(function(n){
    var f=window[n]; if(typeof f!=='function') return;
    window[n]=function(){ off(); return f.apply(this,arguments); };
  });
  var hd=document.getElementById('app-header'); if(hd) hd.addEventListener('click',off,true);
  var w=document.getElementById('live-card-wrap'); if(w&&!(['gl','bh','rb','sts'].some(function(k){return liveAlive(k)>0;}))) w.hidden=true;
  var d=document.getElementById('lv-fdesc'); if(d){ var t=0,a=0; ['gl','bh','rb','sts'].forEach(function(k){ t+=(PVL[k]||[]).length; a+=liveAlive(k); }); d.textContent='Live scores, win odds and full lineups for all '+t+' matchups across the four leagues, primetime games included. '+a+' still undecided.'; }
  if(location.hash==='#live') showLive();
})();
</script>\n</body></html>""")
rep('<span class="badge">Week 9 Final</span>','<span class="badge">Week 10 Live</span>')
# ---------------- data + share code
js=open('/tmp/lt/pt/ptshare.js').read().replace('__PVX__',json.dumps(X,separators=(',',':')))
rep("function wpCard(k,m,i,live){",js+"\nfunction wpCard(k,m,i,live){")
import re as _re
_rb=json.load(open('/tmp/lt/pod/LG_LOGO_rb.json'))['rb']
_n=len(h); h=_re.sub(r'(var LG_LOGO = \{.*?"rb": ")data:image/png;base64,[A-Za-z0-9+/=]+',lambda m:m.group(1)+_rb,h,count=1,flags=_re.S); assert len(h)!=_n
open(dst,'w').write(h)
print('ok',len(h))

