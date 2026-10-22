/* ---------- Fraud Meter ---------- */
var FM_THEME='dark', FM_CACHE={};
var FM_YOU = {gl:'Cuadz',bh:'Cuadz',rb:'Cuadz',sts:'Cuadz'};
function fmAvatar(mgr){ var H=(typeof ST_BIG!=='undefined'&&ST_BIG.heads)||{}; return H[mgr]||null; }
function fmLogo(k,tid){ var L=(typeof ST_BIG!=='undefined'&&ST_BIG.logos&&ST_BIG.logos[k]&&ST_BIG.logos[k][String(tid)])||''; if(!L) return Promise.resolve(null); return new Promise(function(res){ var im=new Image(); im.crossOrigin='anonymous'; im.onload=function(){res(im);}; im.onerror=function(){res(null);}; setTimeout(function(){res(null);},6000); im.src=L; }); }
function fmFmt(n){ return (n>0?'+':n<0?'−':'')+Math.abs(n).toFixed(2).replace(/0$/,''); }
async function fmCard(k,theme){
  var P=(theme==='light')?{bg:'#f3f5f8',panel:'#ffffff',grid:'#e6e9ef',zero:'#9aa0ad',axis:'#6b7280',label:'#111827',name:'#374151',sub:'#6b7280',ring:'#d1d5db',avbg:'#e5e7eb',neu:'#c9ced8',green:'#1f9d57',red:'#d13a3a'}:{bg:'#0a0b07',panel:'#14160f',grid:'#262a1b',zero:'#6b7355',axis:'#9aa089',label:'#f1f4e6',name:'#cfd5bd',sub:'#9aa089',ring:'#3a3f2b',avbg:'#262a1b',neu:'#3a3f2b',green:'#3ddc84',red:'#ff5d5d'};
  var BB="'Bebas Neue','Impact',sans-serif", IN="Inter,system-ui,sans-serif", ACC='#acf910';
  try{ await document.fonts.load("40px 'Bebas Neue'"); await document.fonts.load("700 24px Inter"); await document.fonts.load("500 24px Inter"); }catch(e){}
  var F=FM[k], T=F.teams.slice().sort(function(a,b){return b.delta-a.delta;}), n=T.length;
  var W=1600, H=1180, hdr=210, ftr=100, PX=46, panelY=hdr+34, panelH=H-hdr-ftr-68;
  var cv=document.createElement('canvas'); cv.width=W; cv.height=H; var c=cv.getContext('2d');
  c.fillStyle=P.bg; c.fillRect(0,0,W,H);
  /* header */
  c.fillStyle='#0e0f0a'; c.fillRect(0,0,W,hdr); c.fillStyle=ACC; c.fillRect(0,hdr-6,W,6);
  var imgs=await Promise.all([wvImg(CFN_LOGO), wvImg(LG_LOGO[k])]);
  wvT(c,'THE FRAUD METER',PX+4,106,'92px '+BB,'#ffffff','left',3);
  wvT(c,'Rest-of-season wins vs. a typical team with the same record (all-play + matchup strength)',PX+6,158,'500 26px '+IN,'#aab08f','left');
  if(imgs[1]) wvDraw(imgs[1],c,W-PX-96,34,96,120,'left');
  if(imgs[0]) wvDraw(imgs[0],c,W-PX-96-30-210,40,210,110,'right');
  /* panel */
  wvRR(c,PX,panelY,W-2*PX,panelH,26); c.fillStyle=P.panel; c.fill();
  var R=Math.max(2,Math.ceil(Math.max.apply(null,T.map(function(t){return Math.abs(t.delta);}))*2+0.2)/2);
  var top=panelY+110, bot=panelY+panelH-110, y0=(top+bot)/2, sc=(bot-top)/2/R, x0=PX+120, x1=W-PX-34, slot=(x1-x0)/n, bw=Math.min(86,slot*.74);
  c.textAlign='right';
  for(var g=-R;g<=R+1e-6;g+=1){ var gy=y0-g*sc; c.strokeStyle=g===0?P.zero:P.grid; c.lineWidth=g===0?3:2; c.beginPath(); c.moveTo(x0-8,gy); c.lineTo(x1+8,gy); c.stroke(); wvT(c,(g>0?'+':g<0?'−':'')+Math.abs(g),x0-22,gy+8,'500 24px '+IN,P.axis,'right'); }
  c.save(); c.translate(PX+36,y0); c.rotate(-Math.PI/2); wvT(c,'Wins vs. a typical team with the same record this season',0,0,'700 24px '+IN,P.label,'center'); c.restore();
  var maxA=Math.max.apply(null,T.map(function(t){return Math.abs(t.delta);}))||1;
  for(var i=0;i<n;i++){
    var t=T[i], cx=x0+slot*(i+.5), bx=cx-bw/2, h=t.delta*sc, up=t.delta>=0, mag=Math.min(1,Math.abs(t.delta)/maxA);
    var col=up?['#1f9d57','#8fd6ad']:['#e0605f','#d13a3a']; var a=up?mix(col[0],col[1],1-mag):mix('#f0b3b2','#d13a3a',mag); if(Math.abs(t.delta)<0.5) a=P.neu;
    var by=up?y0-h:y0, bh=Math.max(4,Math.abs(h));
    c.fillStyle=a; c.beginPath(); wvRR(c,bx,by,bw,bh,5); c.fill();
    /* avatar */
    var av=fmAvatar(t.mgr), r=27, ay=up?by-r-12:by+bh+r+12, im=av?await wvImg(av):await fmLogo(k,t.tid), me=t.mgr===FM_YOU[k];
    c.save(); c.beginPath(); c.arc(cx,ay,r,0,Math.PI*2); c.closePath(); c.clip();
    if(im){ var s2=Math.max(2*r/im.width,2*r/im.height); c.drawImage(im,cx-im.width*s2/2,ay-im.height*s2/2,im.width*s2,im.height*s2); } else { c.fillStyle=P.avbg; c.fillRect(cx-r,ay-r,2*r,2*r); wvT(c,t.mgr.slice(0,2).toUpperCase(),cx,ay+9,'28px '+BB,P.name,'center'); }
    c.restore(); c.lineWidth=me?5:2; c.strokeStyle=me?'#7cc400':P.ring; c.beginPath(); c.arc(cx,ay,r,0,Math.PI*2); c.stroke();
    wvT(c,t.mgr,cx,up?ay-r-9:ay+r+24,'700 17px '+IN,P.name,'center');
    /* record + projected finish on the opposite side of the axis */
    var ly=up?y0+36:y0-105; wvT(c,fmtRec(t.w,t.l),cx,ly,'700 24px "DM Mono","Roboto Mono",ui-monospace,monospace',P.label,'center'); wvT(c,fmProj(t),cx,ly+27,'500 20px "DM Mono","Roboto Mono",ui-monospace,monospace',P.sub,'center'); wvT(c,Math.round((t.po||0)*100)+'%',cx,ly+54,'700 20px "DM Mono","Roboto Mono",ui-monospace,monospace',t.po>=.7?P.green:t.po<=.3?P.red:'#d99a2b','center'); wvT(c,'🏆'+(t.title>=.1?Math.round(t.title*100):t.title>=.005?(t.title*100).toFixed(1):'0')+'%',cx,ly+81,'600 18px "DM Mono","Roboto Mono",ui-monospace,monospace',P.sub,'center');
    if(bh>38) wvT(c,fmtD(t.delta),cx,up?by+bh-14:by+26,'700 20px '+IN,'rgba(255,255,255,.95)','center');
  }
  wvT(c,'RECORD / PROJECTED / PLAYOFFS / TITLE',x1,panelY+150,'500 20px "DM Mono",ui-monospace,monospace',P.sub,'right',2);
  wvT(c,'Potential frauds ↓',x1,panelY+206,'700 46px '+IN,P.red,'right');
  wvT(c,'↑ Better than their record',x0+4,panelY+panelH-40,'700 46px '+IN,P.green,'left');
  /* footer */
  c.fillStyle=ACC; c.fillRect(0,H-ftr,W,ftr);
  wvRR(c,PX,H-ftr+14,150,72,14); c.fillStyle='#0e0f0a'; c.fill(); if(imgs[0]) wvDraw(imgs[0],c,PX+10,H-ftr+20,130,60,'left');
  wvT(c,'cuadzfantasynetwork.com',PX+176,H-ftr+60,'800 32px '+IN,'#0e0f0a','left');
  wvT(c,'THROUGH WEEK '+F.week+' · '+LGI[k].name.toUpperCase(),W-PX,H-ftr+60,'800 26px '+IN,'#0e0f0a','right',3);
  return cv;
}
function mix(a,b,t){ function h(x){ return [1,3,5].map(function(i){return parseInt(x.slice(i,i+2),16);}); } var A=h(a),B=h(b); return 'rgb('+A.map(function(v,i){return Math.round(v+(B[i]-v)*t);}).join(',')+')'; }
function fmtRec(w,l,dec){ var f=function(x){ return Number.isInteger(x)?String(x):(dec?x.toFixed(0):x.toFixed(1)); }; return Math.round(w)+'-'+Math.round(l); }
function fmProj(t){ var g=Math.round(t.w+t.l+t.n), w=Math.round(t.proj_w); return w+'-'+(g-w); }
function fmtD(d){ return (d>0?'+':d<0?'−':'')+Math.abs(d).toFixed(1); }
async function shareFraud(k,theme){ theme=theme||FM_THEME;
  var ov=document.createElement('div'); ov.setAttribute('style','position:fixed;inset:0;z-index:99999;background:rgba(6,7,4,.88);display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto');
  ov.innerHTML='<div id="fmBoxW" style="max-width:720px;width:100%;margin:auto;display:flex;flex-direction:column;gap:12px;align-items:stretch"></div>';
  document.body.appendChild(ov); ov.addEventListener('click',function(e){ if(e.target===ov) ov.remove(); });
  var box=document.getElementById('fmBoxW');
  box.innerHTML='<div style="color:#9aa089;font:500 14px Inter,sans-serif;text-align:center;padding:40px 0">Building your Fraud Meter…</div>';
  var cv; try{ cv=await fmCard(k,theme); }catch(e){ box.innerHTML='<div style="color:#ff8a80;font:500 14px Inter,sans-serif;text-align:center;padding:30px 0">Could not build the card.</div><button class="tc-ghost" id="fmX">Close</button>'; document.getElementById('fmX').onclick=function(){ ov.remove(); }; return; }
  var url=cv.toDataURL('image/png'), fn='cfn-fraud-meter-'+k+'-week-'+FM[k].week+'-'+theme+'.png';
  var blob=await new Promise(function(r){ cv.toBlob(r,'image/png'); }), file=null, can=false;
  try{ file=new File([blob],fn,{type:'image/png'}); can=!!(navigator.canShare&&navigator.canShare({files:[file]})); }catch(e){}
  box.innerHTML='<img alt="Fraud Meter" src="'+url+'" style="width:100%;height:auto;border-radius:14px;border:1px solid #262a1b;display:block"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="tc-btn" id="fmGo" style="flex:1">'+(can?'Share':'Save image')+'</button>'+(can?'<button class="tc-ghost" id="fmDl" style="flex:1">Save image</button>':'')+'<button class="tc-ghost" id="fmCl">Close</button></div><div id="fmMsg" style="color:#9aa089;font:500 12px Inter,sans-serif;text-align:center"></div>';
  function save(){ var a=document.createElement('a'); a.href=url; a.download=fn; document.body.appendChild(a); a.click(); a.remove(); document.getElementById('fmMsg').textContent='Image saved. On a phone, press and hold the card to save it to Photos.'; }
  document.getElementById('fmCl').onclick=function(){ ov.remove(); };
  if(can){ document.getElementById('fmGo').onclick=function(){ navigator.share({files:[file],title:'Fraud Meter · '+LGI[k].name,text:'Week '+FM[k].week+' Fraud Meter on the Cuadz Fantasy Network'}).catch(function(){}); }; document.getElementById('fmDl').onclick=save; }
  else document.getElementById('fmGo').onclick=save;
}

function fmMobile(k,theme){
  var F=FM[k], T=F.teams.slice().sort(function(a,b){return b.delta-a.delta;});
  var P=(theme==='light')?{bg:'#ffffff',row:'#f3f5f8',line:'#e1e5ec',txt:'#111827',sub:'#6b7280',neu:'#c9ced8',green:'#1f9d57',red:'#d13a3a',amber:'#b7791f',av:'#e5e7eb'}:{bg:'#14160f',row:'#1b1e14',line:'#2b3020',txt:'#f1f4e6',sub:'#9aa089',neu:'#4a5037',green:'#3ddc84',red:'#ff5d5d',amber:'#e0a63a',av:'#262a1b'};
  var R=Math.max(1.5,Math.ceil(Math.max.apply(null,T.map(function(t){return Math.abs(t.delta);}))*2+0.2)/2);
  var ttl=function(t){ return (t.title>=.1?Math.round(t.title*100):(t.title*100).toFixed(1))+'%'; };
  var av=function(t){ var h=fmAvatar(t.mgr), L=(typeof ST_BIG!=='undefined'&&ST_BIG.logos&&ST_BIG.logos[k]&&ST_BIG.logos[k][String(t.tid)])||'', me=t.mgr===FM_YOU[k], src=h||L, ini=lgEsc(t.mgr.slice(0,2).toUpperCase());
    return '<div style="width:38px;height:38px;border-radius:50%;background:'+P.av+';border:'+(me?'3px solid #7cc400':'1px solid '+P.line)+';overflow:hidden;display:flex;align-items:center;justify-content:center;font:700 13px Inter,sans-serif;color:'+P.sub+';flex:none">'+(src?'<img src="'+src+'" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.textContent=\''+ini+'\'">':ini)+'</div>'; };
  var rows=T.map(function(t){ var d=t.delta, neu=Math.abs(d)<0.5, col=neu?P.neu:(d>0?P.green:P.red), w=Math.min(50,Math.abs(d)/R*50), pc=t.po>=.7?P.green:t.po<=.3?P.red:P.amber;
    return '<div style="display:grid;grid-template-columns:38px 1fr auto;gap:10px;align-items:center;padding:10px 10px;background:'+P.row+';border-radius:12px">'+av(t)+
     '<div style="min-width:0"><div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><span style="font:700 14px Inter,sans-serif;color:'+P.txt+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+lgEsc(t.mgr)+'</span><span style="font:700 14px Inter,sans-serif;color:'+(neu?P.sub:col)+'">'+fmtD(d)+'</span></div>'+
     '<div style="position:relative;height:12px;margin:6px 0 5px"><div style="position:absolute;left:50%;top:-3px;bottom:-3px;width:2px;background:'+P.line+'"></div><div style="position:absolute;top:1px;height:10px;border-radius:5px;background:'+col+';'+(d>=0?'left:50%':'right:50%')+';width:'+w+'%"></div></div>'+
     '<div style="font:500 11px Inter,sans-serif;color:'+P.sub+';white-space:nowrap">'+fmtRec(t.w,t.l)+' → proj '+fmProj(t)+'</div></div>'+
     '<div style="text-align:right;font:700 12px \'DM Mono\',ui-monospace,monospace;line-height:1.5"><div style="color:'+pc+'">'+Math.round((t.po||0)*100)+'%<span style="color:'+P.sub+';font-weight:500;font-size:9px"> PO</span></div><div style="color:'+P.sub+'">🏆'+ttl(t)+'</div></div></div>'; }).join('');
  return '<div style="background:'+P.bg+';border-radius:14px;padding:12px 10px 10px"><div style="display:flex;justify-content:space-between;font:700 11px Inter,sans-serif;letter-spacing:.04em;margin:0 4px 8px"><span style="color:'+P.red+'">← POTENTIAL FRAUD</span><span style="color:'+P.green+'">BETTER THAN RECORD →</span></div><div style="display:flex;flex-direction:column;gap:6px">'+rows+'</div><div style="font:500 10px Inter,sans-serif;color:'+P.sub+';margin:10px 4px 0;line-height:1.4">Bar = rest-of-season wins vs. a typical team with the same record. Gray = about as expected. PO = playoff odds, 🏆 = title odds.</div></div>';
}
function lgFraud(p,k){
  var F=FM[k]; if(!F){ p.innerHTML='<div style="color:var(--muted);font-size:12px">Fraud Meter appears after the first few weeks.</div>'; return; }
  var T=F.teams.slice().sort(function(a,b){return b.delta-a.delta;});
  var tb=function(th){ return '<button class="'+(FM_THEME===th?'st-btn':'tc-ghost')+'" data-fmth="'+th+'" style="padding:5px 12px;'+(FM_THEME===th?'background:#acf910;color:#0e0f0a;border-color:#acf910;font-weight:700':'')+'">'+(th==='dark'?'Dark':'Light')+'</button>'; };
  var h='<div class="subsec"><div class="subsec-hd" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span>Fraud Meter · through Week '+F.week+'</span><span style="display:flex;gap:6px;align-items:center">'+tb('dark')+tb('light')+'<button class="st-btn" id="fmShareBtn" style="padding:5px 10px">Share</button></span></div>'+
   '<div id="fmImgBox" style="min-height:220px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px">Building the Fraud Meter…</div>'+
   '<details style="margin-top:12px"><summary style="cursor:pointer;color:var(--muted);font-size:12px">How it works and the full numbers</summary>'+
   '<div style="font-size:12px;color:var(--muted);line-height:1.5;margin:10px 0">Each team is rated mostly on points on the board: all-play (its score vs. every team, every week), how often it finishes in each weekly tier (1–3, 4–6, 7–9, 10–12), and points vs. the league average, with one huge week capped. Healthy-lineup projections are a smaller adjustment (byes filled with a bench or waiver-level player). Every remaining game is weighed by the gap between the two teams’ ratings, and the rest of the season is simulated 6,000 times. Wins = rest-of-season wins vs. a typical team with the same record (gray = about as expected). PO = playoff odds (top 6), 🏆 = title odds. Finishes = weeks in each tier. Luck = actual wins minus all-play expected wins so far.</div>'+
   '<div style="border:1px solid var(--border,#262a1b);border-radius:10px;overflow:hidden"><div style="display:grid;grid-template-columns:22px 1fr 40px 44px 44px 40px 44px;gap:4px;padding:8px 8px;font-size:10px;letter-spacing:.08em;color:var(--dim);text-transform:uppercase;text-align:center"><span>#</span><span style="text-align:left">Team</span><span>Rec</span><span>Proj</span><span>Wins</span><span>PO</span><span>🏆</span></div>'+
   T.map(function(t,i){ var up=t.delta>=0; var cc=Math.abs(t.delta)<0.5?'var(--muted)':up?'#4cd964':'#ff6b6b'; return '<div style="display:grid;grid-template-columns:22px 1fr 40px 44px 44px 40px 44px;gap:4px;padding:9px 8px;border-top:1px solid var(--border,#262a1b);align-items:center;text-align:center;font-size:13px"><span style="color:var(--dim)">'+(i+1)+'</span><span style="text-align:left;min-width:0">'+lgEsc(t.name)+' <span style="color:var(--dim);font-size:11px">'+lgEsc(t.mgr)+'</span><br><span style="color:var(--dim);font-size:11px">finishes '+(t.tiers||[]).join('-')+' · luck '+fmtD(t.luck||0)+' · '+(t.sosr||'')+' sched</span></span><span>'+Math.round(t.w)+'-'+Math.round(t.l)+'</span><span>'+fmProj(t)+'</span><span style="font-weight:700;color:'+cc+'">'+fmtD(t.delta)+'</span><span>'+Math.round((t.po||0)*100)+'%</span><span>'+(t.title>=.1?Math.round(t.title*100):(t.title*100).toFixed(1))+'%</span></div>'; }).join('')+'</div></div></details></div>';
  p.innerHTML=h;
  var box=p.querySelector('#fmImgBox');
  function show(){ var nar=window.innerWidth<640;
    if(nar){ box.style.display='block'; box.innerHTML=fmMobile(k,FM_THEME); return; }
    var key=k+'|'+FM_THEME+'|'+F.week; box.style.display='block';
    if(FM_CACHE[key]){ box.innerHTML='<img alt="Fraud Meter" src="'+FM_CACHE[key]+'" style="width:100%;height:auto;border-radius:12px;display:block">'; return; } box.innerHTML='Building the Fraud Meter…';
    var th=FM_THEME; fmCard(k,th).then(function(cv){ FM_CACHE[k+'|'+th+'|'+F.week]=cv.toDataURL('image/png'); if(th===FM_THEME) show(); }).catch(function(){ box.innerHTML='Could not build the graphic. Open the full numbers below.'; }); }
  p.querySelectorAll('[data-fmth]').forEach(function(b){ b.onclick=function(){ FM_THEME=b.getAttribute('data-fmth'); lgFraud(p,k); }; });
  p.querySelector('#fmShareBtn').onclick=function(){ shareFraud(k,FM_THEME); };
  show();
}
