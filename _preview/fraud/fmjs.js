/* ---------- Fraud Meter ---------- */
var FM_YOU = {gl:'Cuadz',bh:'Cuadz',rb:'Cuadz',sts:'Cuadz'};
function fmAvatar(mgr){ var H=(typeof ST_BIG!=='undefined'&&ST_BIG.heads)||{}; return H[mgr]||null; }
function fmLogo(k,tid){ var L=(typeof ST_BIG!=='undefined'&&ST_BIG.logos&&ST_BIG.logos[k]&&ST_BIG.logos[k][String(tid)])||''; if(!L) return Promise.resolve(null); return new Promise(function(res){ var im=new Image(); im.crossOrigin='anonymous'; im.onload=function(){res(im);}; im.onerror=function(){res(null);}; setTimeout(function(){res(null);},6000); im.src=L; }); }
function fmFmt(n){ return (n>0?'+':n<0?'−':'')+Math.abs(n).toFixed(2).replace(/0$/,''); }
async function fmCard(k){
  var BB="'Bebas Neue','Impact',sans-serif", IN="Inter,system-ui,sans-serif", ACC='#acf910';
  try{ await document.fonts.load("40px 'Bebas Neue'"); await document.fonts.load("700 24px Inter"); await document.fonts.load("500 24px Inter"); }catch(e){}
  var F=FM[k], T=F.teams.slice().sort(function(a,b){return b.delta-a.delta;}), n=T.length;
  var W=1600, H=1180, hdr=210, ftr=100, PX=46, panelY=hdr+34, panelH=H-hdr-ftr-68;
  var cv=document.createElement('canvas'); cv.width=W; cv.height=H; var c=cv.getContext('2d');
  c.fillStyle='#f3f5f8'; c.fillRect(0,0,W,H);
  /* header */
  c.fillStyle='#0e0f0a'; c.fillRect(0,0,W,hdr); c.fillStyle=ACC; c.fillRect(0,hdr-6,W,6);
  var imgs=await Promise.all([wvImg(CFN_LOGO), wvImg(LG_LOGO[k])]);
  wvT(c,'THE FRAUD METER',PX+4,106,'92px '+BB,'#ffffff','left',3);
  wvT(c,'Rest-of-season wins vs. a typical team with the same record (all-play + matchup strength)',PX+6,158,'500 26px '+IN,'#aab08f','left');
  if(imgs[1]) wvDraw(imgs[1],c,W-PX-96,34,96,120,'left');
  if(imgs[0]) wvDraw(imgs[0],c,W-PX-96-30-210,40,210,110,'right');
  /* panel */
  wvRR(c,PX,panelY,W-2*PX,panelH,26); c.fillStyle='#ffffff'; c.fill();
  var R=Math.max(2,Math.ceil(Math.max.apply(null,T.map(function(t){return Math.abs(t.delta);}))*2+0.2)/2);
  var top=panelY+110, bot=panelY+panelH-110, y0=(top+bot)/2, sc=(bot-top)/2/R, x0=PX+120, x1=W-PX-34, slot=(x1-x0)/n, bw=Math.min(86,slot*.74);
  c.textAlign='right';
  for(var g=-R;g<=R+1e-6;g+=1){ var gy=y0-g*sc; c.strokeStyle=g===0?'#9aa0ad':'#e6e9ef'; c.lineWidth=g===0?3:2; c.beginPath(); c.moveTo(x0-8,gy); c.lineTo(x1+8,gy); c.stroke(); wvT(c,(g>0?'+':g<0?'−':'')+Math.abs(g),x0-22,gy+8,'500 24px '+IN,'#6b7280','right'); }
  c.save(); c.translate(PX+36,y0); c.rotate(-Math.PI/2); wvT(c,'Wins vs. a typical team with the same record this season',0,0,'700 24px '+IN,'#111827','center'); c.restore();
  var maxA=Math.max.apply(null,T.map(function(t){return Math.abs(t.delta);}))||1;
  for(var i=0;i<n;i++){
    var t=T[i], cx=x0+slot*(i+.5), bx=cx-bw/2, h=t.delta*sc, up=t.delta>=0, mag=Math.min(1,Math.abs(t.delta)/maxA);
    var col=up?['#1f9d57','#8fd6ad']:['#e0605f','#d13a3a']; var a=up?mix(col[0],col[1],1-mag):mix('#f0b3b2','#d13a3a',mag); if(Math.abs(t.delta)<0.5) a='#c9ced8';
    var by=up?y0-h:y0, bh=Math.max(4,Math.abs(h));
    c.fillStyle=a; c.beginPath(); wvRR(c,bx,by,bw,bh,5); c.fill();
    /* avatar */
    var av=fmAvatar(t.mgr), r=27, ay=up?by-r-12:by+bh+r+12, im=av?await wvImg(av):await fmLogo(k,t.tid), me=t.mgr===FM_YOU[k];
    c.save(); c.beginPath(); c.arc(cx,ay,r,0,Math.PI*2); c.closePath(); c.clip();
    if(im){ var s2=Math.max(2*r/im.width,2*r/im.height); c.drawImage(im,cx-im.width*s2/2,ay-im.height*s2/2,im.width*s2,im.height*s2); } else { c.fillStyle='#e5e7eb'; c.fillRect(cx-r,ay-r,2*r,2*r); wvT(c,t.mgr.slice(0,2).toUpperCase(),cx,ay+9,'28px '+BB,'#374151','center'); }
    c.restore(); c.lineWidth=me?5:2; c.strokeStyle=me?'#7cc400':'#d1d5db'; c.beginPath(); c.arc(cx,ay,r,0,Math.PI*2); c.stroke();
    wvT(c,t.mgr,cx,up?ay-r-9:ay+r+24,'700 17px '+IN,'#374151','center');
    /* record + projected finish on the opposite side of the axis */
    var ly=up?y0+36:y0-105; wvT(c,fmtRec(t.w,t.l),cx,ly,'700 24px "DM Mono","Roboto Mono",ui-monospace,monospace','#111827','center'); wvT(c,fmProj(t),cx,ly+27,'500 20px "DM Mono","Roboto Mono",ui-monospace,monospace','#6b7280','center'); wvT(c,Math.round((t.po||0)*100)+'%',cx,ly+54,'700 20px "DM Mono","Roboto Mono",ui-monospace,monospace',t.po>=.7?'#1f9d57':t.po<=.3?'#d13a3a':'#b7791f','center'); wvT(c,'🏆'+(t.title>=.1?Math.round(t.title*100):t.title>=.005?(t.title*100).toFixed(1):'0')+'%',cx,ly+81,'600 18px "DM Mono","Roboto Mono",ui-monospace,monospace','#6b7280','center');
    if(bh>38) wvT(c,fmtD(t.delta),cx,up?by+bh-14:by+26,'700 20px '+IN,'rgba(255,255,255,.95)','center');
  }
  wvT(c,'RECORD / PROJECTED / PLAYOFFS / TITLE',x1,panelY+150,'500 20px "DM Mono",ui-monospace,monospace','#6b7280','right',2);
  wvT(c,'Potential frauds ↓',x1,panelY+206,'700 46px '+IN,'#d13a3a','right');
  wvT(c,'↑ Better than their record',x0+4,panelY+panelH-40,'700 46px '+IN,'#1f9d57','left');
  /* footer */
  c.fillStyle=ACC; c.fillRect(0,H-ftr,W,ftr);
  wvRR(c,PX,H-ftr+14,150,72,14); c.fillStyle='#0e0f0a'; c.fill(); if(imgs[0]) wvDraw(imgs[0],c,PX+10,H-ftr+20,130,60,'left');
  wvT(c,'fantasy-hub-bice.vercel.app',PX+176,H-ftr+60,'800 32px '+IN,'#0e0f0a','left');
  wvT(c,'THROUGH WEEK '+F.week+' · '+LGI[k].name.toUpperCase(),W-PX,H-ftr+60,'800 26px '+IN,'#0e0f0a','right',3);
  return cv;
}
function mix(a,b,t){ function h(x){ return [1,3,5].map(function(i){return parseInt(x.slice(i,i+2),16);}); } var A=h(a),B=h(b); return 'rgb('+A.map(function(v,i){return Math.round(v+(B[i]-v)*t);}).join(',')+')'; }
function fmtRec(w,l,dec){ var f=function(x){ return Number.isInteger(x)?String(x):(dec?x.toFixed(0):x.toFixed(1)); }; return Math.round(w)+'-'+Math.round(l); }
function fmProj(t){ var g=Math.round(t.w+t.l+t.n), w=Math.round(t.proj_w); return w+'-'+(g-w); }
function fmtD(d){ return (d>0?'+':d<0?'−':'')+Math.abs(d).toFixed(1); }
async function shareFraud(k){
  var ov=document.createElement('div'); ov.setAttribute('style','position:fixed;inset:0;z-index:99999;background:rgba(6,7,4,.88);display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto');
  ov.innerHTML='<div id="fmBoxW" style="max-width:720px;width:100%;margin:auto;display:flex;flex-direction:column;gap:12px;align-items:stretch"></div>';
  document.body.appendChild(ov); ov.addEventListener('click',function(e){ if(e.target===ov) ov.remove(); });
  var box=document.getElementById('fmBoxW');
  box.innerHTML='<div style="color:#9aa089;font:500 14px Inter,sans-serif;text-align:center;padding:40px 0">Building your Fraud Meter…</div>';
  var cv; try{ cv=await fmCard(k); }catch(e){ box.innerHTML='<div style="color:#ff8a80;font:500 14px Inter,sans-serif;text-align:center;padding:30px 0">Could not build the card.</div><button class="tc-ghost" id="fmX">Close</button>'; document.getElementById('fmX').onclick=function(){ ov.remove(); }; return; }
  var url=cv.toDataURL('image/png'), fn='cfn-fraud-meter-'+k+'-week-'+FM[k].week+'.png';
  var blob=await new Promise(function(r){ cv.toBlob(r,'image/png'); }), file=null, can=false;
  try{ file=new File([blob],fn,{type:'image/png'}); can=!!(navigator.canShare&&navigator.canShare({files:[file]})); }catch(e){}
  box.innerHTML='<img alt="Fraud Meter" src="'+url+'" style="width:100%;height:auto;border-radius:14px;border:1px solid #262a1b;display:block"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="tc-btn" id="fmGo" style="flex:1">'+(can?'Share':'Save image')+'</button>'+(can?'<button class="tc-ghost" id="fmDl" style="flex:1">Save image</button>':'')+'<button class="tc-ghost" id="fmCl">Close</button></div><div id="fmMsg" style="color:#9aa089;font:500 12px Inter,sans-serif;text-align:center"></div>';
  function save(){ var a=document.createElement('a'); a.href=url; a.download=fn; document.body.appendChild(a); a.click(); a.remove(); document.getElementById('fmMsg').textContent='Image saved. On a phone, press and hold the card to save it to Photos.'; }
  document.getElementById('fmCl').onclick=function(){ ov.remove(); };
  if(can){ document.getElementById('fmGo').onclick=function(){ navigator.share({files:[file],title:'Fraud Meter · '+LGI[k].name,text:'Week '+FM[k].week+' Fraud Meter on the Cuadz Fantasy Network'}).catch(function(){}); }; document.getElementById('fmDl').onclick=save; }
  else document.getElementById('fmGo').onclick=save;
}
function lgFraud(p,k){
  var F=FM[k]; if(!F){ p.innerHTML='<div style="color:var(--muted);font-size:12px">Fraud Meter appears after the first few weeks.</div>'; return; }
  var T=F.teams.slice().sort(function(a,b){return b.delta-a.delta;});
  var h='<div class="subsec"><div class="subsec-hd" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span>Fraud Meter · through Week '+F.week+'</span><button class="st-btn" style="padding:5px 10px" onclick="shareFraud(\''+k+'\')">Share Fraud Meter</button></div>'+
   '<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:10px">Rest-of-season wins compared with a typical team that has the same record. Each team is rated mainly on points on the board (all-play and scoring vs. the league each week), with healthy-lineup projections as a smaller adjustment (byes filled by the bench or a waiver-level player). Every remaining game is weighed by the gap between the two teams’ ratings. Consistency counts too: ratings include how often a team finishes in each weekly tier (1–3, 4–6, 7–9, 10–12), and one huge week is capped. Wins = rest-of-season wins vs. a typical team with the same record. Finishes = weeks in each tier (top 3 – 4-6 – 7-9 – bottom 3). PO = playoff odds (top 6), 🏆 = title odds. Luck = actual wins minus all-play expected wins so far.</div>'+
   '<div style="border:1px solid var(--border,#262a1b);border-radius:10px;overflow:hidden"><div style="display:grid;grid-template-columns:22px 1fr 40px 44px 44px 40px 44px;gap:4px;padding:8px 8px;font-size:10px;letter-spacing:.08em;color:var(--dim);text-transform:uppercase;text-align:center"><span>#</span><span style="text-align:left">Team</span><span>Rec</span><span>Proj</span><span>Wins</span><span>PO</span><span>🏆</span></div>'+
   T.map(function(t,i){ var up=t.delta>=0; var cc=Math.abs(t.delta)<0.5?'var(--muted)':up?'#4cd964':'#ff6b6b'; return '<div style="display:grid;grid-template-columns:22px 1fr 40px 44px 44px 40px 44px;gap:4px;padding:9px 8px;border-top:1px solid var(--border,#262a1b);align-items:center;text-align:center;font-size:13px"><span style="color:var(--dim)">'+(i+1)+'</span><span style="text-align:left;min-width:0">'+lgEsc(t.name)+' <span style="color:var(--dim);font-size:11px">'+lgEsc(t.mgr)+'</span><br><span style="color:var(--dim);font-size:11px">finishes '+(t.tiers||[]).join('-')+' · luck '+fmtD(t.luck||0)+' · '+(t.sosr||'')+' sched</span></span><span>'+Math.round(t.w)+'-'+Math.round(t.l)+'</span><span>'+fmProj(t)+'</span><span style="font-weight:700;color:'+cc+'">'+fmtD(t.delta)+'</span><span>'+Math.round((t.po||0)*100)+'%</span><span>'+(t.title>=.1?Math.round(t.title*100):(t.title*100).toFixed(1))+'%</span></div>'; }).join('')+'</div></div>';
  p.innerHTML=h;
}
