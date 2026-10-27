/* ---------- Matchup recap screens (prediction-market style) ---------- */
var RC_STATE={};
function rcShort(n){ var t=String(n).split(' '); while(t.length>1&&/^(jr|sr|ii|iii|iv)\.?$/i.test(t[t.length-1])) t=t.slice(0,-1); if(t.length===1) return t[0]; return t[0].charAt(0)+'. '+t.slice(1).join(' '); }
function rcIni(s){ var w=String(s).replace('. ',' ').split(' '); return (w[0].charAt(0)+(w.length>1?w[w.length-1].charAt(0):'')).toUpperCase(); }
function rcPhoto(n){ return (typeof PHOTOS!=='undefined'&&PHOTOS[n])||null; }
function rcAvatar(k,mgr,tid){ var H=(k==='gl'&&ST_BIG.heads)||{}; if(H[mgr]) return H[mgr]; var L=ST_BIG.logos&&ST_BIG.logos[k]&&ST_BIG.logos[k][String(tid)]; return L||null; }
var RC_PF={'Roschon Johnson':10235,'Germie Bernard':13274,'Ted Hurst III':13317,'Braelon Allen':11576,'Kalif Raymond':3634,'Nico Collins':7569,'Ollie Gordon II':12495,'Tyler Allgeier':8132,'Ryan Flournoy':11783,'Pat Freiermuth':7600,"Wan'Dale Robinson":8126,'Konata Mumpfield':12718,'Michael Mayer':9482,'Bam Knight':8122,'Emanuel Wilson':11435,'Tyrone Tracy Jr.':11655,'Omar Cooper Jr.':13276};
var RC_ESPN={'Germie Bernard':4685261,'Ollie Gordon II':4711533,'Ollie Gordon':4711533};
function rcPfId(n){ return (typeof PF!=='undefined'&&PF[n])||RC_PF[n]||null; }
function rcSrcs(n){ var a=[], id=rcPfId(n); if(id) a.push('https://sleepercdn.com/content/nfl/players/'+id+'.jpg'); if(RC_ESPN[n]) a.push('https://a.espncdn.com/i/headshots/nfl/players/full/'+RC_ESPN[n]+'.png'); return a; }
function rcTry(srcs,i){ return new Promise(function(res){ if(i>=srcs.length) return res(null); var im=new Image(); im.crossOrigin='anonymous'; var t=setTimeout(function(){ res(rcTry(srcs,i+1)); },7000);
  im.onload=function(){ clearTimeout(t); try{ var w=Math.min(im.naturalWidth,300), h=Math.round(w*im.naturalHeight/im.naturalWidth), cv=document.createElement('canvas'); cv.width=w; cv.height=h; var x=cv.getContext('2d'); x.fillStyle='#1d2216'; x.fillRect(0,0,w,h); x.drawImage(im,0,0,w,h); res(cv.toDataURL('image/jpeg',.85)); }catch(e){ res(rcTry(srcs,i+1)); } };
  im.onerror=function(){ clearTimeout(t); res(rcTry(srcs,i+1)); }; im.src=srcs[i]; }); }
function rcLoadPhotos(names,done){ var todo=[]; names.forEach(function(n){ if(!rcPhoto(n)&&rcSrcs(n).length&&todo.indexOf(n)<0) todo.push(n); }); if(!todo.length) return Promise.resolve(false);
  return Promise.all(todo.map(function(n){ return rcTry(rcSrcs(n),0).then(function(u){ if(u){ PHOTOS[n]=u; return true; } return false; }); })).then(function(r){ return r.some(Boolean); }); }
function rcNames(I){ var a=[]; [I.A,I.B].forEach(function(S){ S.rows.forEach(function(r){ a.push(r[1]); }); a.push(S.star[0]); a.push(S.dud[0]); }); return a; }
var RC_REC=null;
function rcRec(k,team){ if(!RC_REC){ RC_REC={}; var C=(ST_BIG.cards||{}); Object.keys(C).forEach(function(l){ RC_REC[l]={}; (C[l].w4||[]).forEach(function(c){ RC_REC[l][c.a.t]=c.a.r; RC_REC[l][c.b.t]=c.b.r; }); }); } return (RC_REC[k]&&RC_REC[k][team])||''; }
function rcF(x){ return Number(x).toFixed(1); }
function rcEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function rcPh(full,cls,sz){ var s=rcPhoto(full), st=sz?' style="width:'+sz+'px;height:'+sz+'px"':''; return s?'<img class="rc-ph '+cls+'" src="'+s+'"'+st+' alt="">':'<div class="rc-ph '+cls+'"'+st+'>'+rcIni(rcShort(full))+'</div>'; }
function rcPos(p){ return p==='W/R/T'?'<div class="rc-ps FLX"><span class="cw">W</span><span class="cr2">R</span><span class="ct">T</span></div>':'<div class="rc-ps '+p+'">'+p+'</div>'; }
function rcLabel(d){ return d<3?'Photo finish':d<10?'Close one':d<30?'Solid win':'Blowout'; }
function rcFn(m){ return String(m).split(' ')[0].toUpperCase().slice(0,6); }
function rcInfo(k,i){
  var m=RCP.lg[k][i], T=ST_BIG.tid[k], inv={}; Object.keys(T).forEach(function(n){ inv[T[n]]=n; });
  var sides=[0,1].map(function(j){ var id=m.t[j], tm=inv[id]; return {team:tm,mgr:ST_BIG.mgr[k][tm],rec:rcRec(k,tm),id:id,rows:m.L[j],star:m.sd[j][0],dud:m.sd[j][1],s:m.s[j]}; });
  return {m:m,A:sides[0],B:sides[1]};
}
function rcPre(h){ return h.replace(/class="([^"]*)"/g,function(m,v){ return 'class="'+v.split(/\s+/).filter(Boolean).map(function(t){ return 'rc-'+t; }).join(' ')+'"'; }); }
function rcFit(w){
  function go(){ w.style.zoom=''; if(!w.isConnected||innerWidth<900) return; var H=w.offsetHeight; if(!H) return;
    var top=Math.max(0,w.getBoundingClientRect().top), avail=innerHeight-84; var z=Math.min(1,avail/H); if(z<1) w.style.zoom=z.toFixed(3); }
  if(!w._rcf){ w._rcf=1; addEventListener('resize',go); if(window.IntersectionObserver) new IntersectionObserver(function(e){ if(e[0].isIntersecting) go(); }).observe(w); }
  go(); setTimeout(go,50); setTimeout(go,400);
}
function rcView(k){
  var wrap=document.createElement('div'); wrap.className='rc'; wrap.id='rc-'+k;
  if(RC_STATE[k]==null) RC_STATE[k]=0;
  function draw(){
    var cur=RC_STATE[k], I=rcInfo(k,cur), A=I.A, B=I.B, sa=A.s, sb=B.s, wA=sa>=sb;
    var mx=0; A.rows.concat(B.rows).forEach(function(r){ if(r[2]>mx) mx=r[2]; }); if(mx<=0) mx=1;
    var chips=RCP.lg[k].map(function(_,i){ var q=rcInfo(k,i);
      return '<button class="chip'+(i===cur?' on':'')+'" data-i="'+i+'"><div class="cs">Final</div><div class="cr"><span>'+rcEsc(rcFn(q.A.mgr))+'</span><em class="'+(q.A.s>=q.B.s?'g':'')+'">'+rcF(q.A.s)+'</em></div><div class="cr"><span>'+rcEsc(rcFn(q.B.mgr))+'</span><em class="'+(q.B.s>q.A.s?'g':'')+'">'+rcF(q.B.s)+'</em></div></button>'; }).join('');
    function av(S,c){ var a=rcAvatar(k,S.mgr,S.id); return a?'<img class="hd '+c+(k==='gl'?'':' lg')+'" src="'+a+'" alt="">':'<div class="hd '+c+'">'+rcIni(S.mgr)+'</div>'; }
    function php(full,cls,t){ var s=rcPhoto(full); return s?'<img class="ph '+cls+'" src="'+s+'" alt="">':'<div class="ph '+cls+'">'+rcIni(t)+'</div>'; }
    function sd(S,c){ return '<div class="sdc '+c+'"><div class="sdr">'+php(S.star[0],'w'+c,rcShort(S.star[0]))+'<div class="sdh"><span class="tag s">STAR</span>'+rcEsc(rcShort(S.star[0]))+'</div></div><div class="sdv">'+rcF(S.star[1])+' <small>pts</small></div><div class="sdr d2">'+php(S.dud[0],'',rcShort(S.dud[0]))+'<div class="sdh"><span class="tag d">DUD</span>'+rcEsc(rcShort(S.dud[0]))+'</div></div><div class="sdv dd">'+rcF(S.dud[1])+' <small>vs '+rcF(S.dud[2])+' proj</small></div></div>'; }
    function pos(p){ return p==='W/R/T'?'<div class="ps FLX"><span class="cw">W</span><span class="cr2">R</span><span class="ct">T</span></div>':'<div class="ps '+p+'">'+p+'</div>'; }
    var rows=A.rows.map(function(a,i){ var b=B.rows[i], wa=a[2]>b[2], wb=b[2]>a[2];
      return '<div class="lr">'+php(a[1],wa?'wA':'',rcShort(a[1]))+'<div class="l '+(wa?'w':'')+'"><span class="nm">'+rcEsc(rcShort(a[1]))+'</span><b>'+rcF(a[2])+'</b><i style="width:'+Math.max(0,a[2]/mx*100)+'%"></i></div>'+pos(a[0])+'<div class="r '+(wb?'w':'')+'"><b>'+rcF(b[2])+'</b><span class="nm">'+rcEsc(rcShort(b[1]))+'</span><i style="width:'+Math.max(0,b[2]/mx*100)+'%"></i></div>'+php(b[1],wb?'wB':'',rcShort(b[1]))+'</div>'; }).join('');
    var h='<div class="side"><div class="sidehd">Week '+RCP.week+' matchups</div><div class="chips">'+chips+'</div></div><div class="main">'
     +'<div class="nav"><span class="bk">‹</span><div class="seg"><u>Matchup</u></div><span class="dots">···</span></div>'
     +'<div class="crumb">Fantasy <i>•</i> '+rcEsc(LGI[k].name)+' · Week '+RCP.week+'</div>'
     +'<h1>'+rcEsc(A.team.toUpperCase())+' VS '+rcEsc(B.team.toUpperCase())+'</h1>'
     +'<div class="score"><div class="tm"><div class="tr">'+av(A,'A')+'<div class="sc A'+(wA?'':' dim')+'">'+rcF(sa)+'</div></div><div class="mg">'+rcEsc(A.mgr.toUpperCase())+'</div>'+(A.rec?'<div class="rec">'+rcEsc(A.rec)+'</div>':'')+'</div>'
     +'<div class="mid"><div class="fin">Final</div><div class="mr">'+rcLabel(Math.abs(sa-sb))+'</div>'+(LG_LOGO[k]?'<img class="lgl" src="'+LG_LOGO[k]+'" alt="">':'')+(k==='bh'?'':'<div class="lgn">'+rcEsc(LGI[k].name)+'</div>')+'</div>'
     +'<div class="tm rt"><div class="tr"><div class="sc B'+(wA?' dim':'')+'">'+rcF(sb)+'</div>'+av(B,'B')+'</div><div class="mg">'+rcEsc(B.mgr.toUpperCase())+'</div>'+(B.rec?'<div class="rec">'+rcEsc(B.rec)+'</div>':'')+'</div></div>'
     +'<div class="sd">'+sd(A,'A')+sd(B,'B')+'</div>'
     +'<div class="tabs"><b>Stats</b><span class="on">Matchup</span></div>'
     +'<div class="lu">'+rows+'</div>'
     +'<div class="btns"><div class="bA" data-a="share">Share recap</div><div class="bB" data-a="next">Week '+(RCP.week+1)+' preview ›</div></div></div>';
    wrap.innerHTML=rcPre(h);
    wrap.querySelectorAll('.rc-chip').forEach(function(c){ c.onclick=function(){ var sx=wrap.querySelector('.rc-chips').scrollLeft; RC_STATE[k]=+c.dataset.i; draw(); rcLoadPhotos(rcNames(rcInfo(k,RC_STATE[k]))).then(function(ch){ if(ch&&RC_STATE[k]===+c.dataset.i) { var s2=wrap.querySelector('.rc-chips').scrollLeft; draw(); wrap.querySelector('.rc-chips').scrollLeft=s2; } }); wrap.querySelector('.rc-chips').scrollLeft=sx; }; });
    wrap.querySelector('[data-a="share"]').onclick=function(){ rcShare(k,RC_STATE[k]); };
    rcFit(wrap);
    wrap.querySelector('[data-a="next"]').onclick=function(){ var n=wrap.nextElementSibling; if(n) n.scrollIntoView({behavior:'smooth',block:'start'}); };
  }
  draw();
  rcLoadPhotos(rcNames(rcInfo(k,RC_STATE[k]))).then(function(ch){ if(ch&&document.body.contains(wrap)) draw(); });
  return wrap;
}
/* ---- share image (no star/dud) ---- */
async function rcCard(k,i){
  var BB="'Bebas Neue','Impact',sans-serif", IN="Inter,system-ui,sans-serif", AC='#acf910', BC='#4cc3ff', MUT='#8d9479';
  try{ await document.fonts.load("40px 'Bebas Neue'"); await document.fonts.load("700 24px Inter"); await document.fonts.load("500 24px Inter"); }catch(e){}
  var I=rcInfo(k,i), A=I.A, B=I.B, n=A.rows.length, u=2.4, CW=402, PADX=16, rowH=54;
  await rcLoadPhotos(rcNames(I));
  var CH=16+14+8+34+16+76+8+16+16+22+n*rowH+14+44+16;   /* card height in css px */
  var OUT=36, W=Math.round((CW+2*PADX)*u+2*OUT), H=Math.round(CH*u+2*OUT);
  var cv=document.createElement('canvas'); cv.width=W; cv.height=H; var c=cv.getContext('2d');
  c.fillStyle='#050604'; c.fillRect(0,0,W,H);
  var ox=OUT, oy=OUT, cw=(CW+2*PADX)*u, ch=CH*u, x0=ox+PADX*u, iw=CW*u;
  var g=c.createLinearGradient(0,oy,0,oy+ch); g.addColorStop(0,'#0e1109'); g.addColorStop(.4,'#090a07'); g.addColorStop(1,'#090a07');
  wvRR(c,ox,oy,cw,ch,30*u); c.fillStyle=g; c.fill(); c.lineWidth=2; c.strokeStyle='#22261a'; c.stroke();
  var imgs=await Promise.all([wvImg(CFN_LOGO), wvImg(LG_LOGO[k]), (k==='gl'?wvImg(rcAvatar(k,A.mgr,A.id)):fmLogo(k,A.id)), (k==='gl'?wvImg(rcAvatar(k,B.mgr,B.id)):fmLogo(k,B.id))]);
  var y=16;
  wvT(c,LGI[k].name+' · Week '+RCP.week,x0+2*u,oy+(y+10)*u,'500 '+(12.5*u)+'px '+IN,MUT,'left');
  y+=14+8;
  var title=(A.team+' VS '+B.team).toUpperCase();
  wvT(c,title,x0+2*u,oy+(y+26)*u,wvFit(c,title,iw-4*u,'#px '+BB,31*u,16*u),'#f2f4ea','left',.3);
  y+=34+16;
  var hd=76, r=hd/2*u, cyH=oy+(y+hd/2)*u, wA=A.s>=B.s;
  function head(im,S,cx,col){ if(im){ if(k==='gl'){ var s2=Math.min(2*r/im.width,2*r/im.height); c.drawImage(im,cx-im.width*s2/2,cyH-im.height*s2/2,im.width*s2,im.height*s2); } else { c.save(); wvRR(c,cx-r,cyH-r,2*r,2*r,14*u); c.clip(); var s3=Math.max(2*r/im.width,2*r/im.height); c.drawImage(im,cx-im.width*s3/2,cyH-im.height*s3/2,im.width*s3,im.height*s3); c.restore(); } } else { wvT(c,rcIni(S.mgr),cx,cyH+8*u,(24*u)+'px '+BB,MUT,'center'); } }
  head(imgs[2],A,x0+hd/2*u,AC); head(imgs[3],B,x0+iw-hd/2*u,BC);
  wvT(c,rcF(A.s),x0+(hd+8)*u,cyH+13*u,(44*u)+'px '+BB,wA?AC:'#759f10','left',1);
  wvT(c,rcF(B.s),x0+iw-(hd+8)*u,cyH+13*u,(44*u)+'px '+BB,wA?'#2f7ea3':BC,'right',1);
  var cx=x0+iw/2;
  wvT(c,'Final',cx,cyH-4*u,'600 '+(16*u)+'px '+IN,AC,'center');
  wvT(c,rcLabel(Math.abs(A.s-B.s)),cx,cyH+14*u,'500 '+(12.5*u)+'px '+IN,MUT,'center');
  if(imgs[1]) wvDraw(imgs[1],c,cx-15*u,cyH+22*u,30*u,30*u,'left');
  if(k!=='bh') wvT(c,LGI[k].name,cx,cyH+62*u,'500 '+(10*u)+'px '+IN,'#5d6350','center');
  y+=hd+8;
  wvT(c,A.mgr.toUpperCase(),x0+2*u,oy+(y+10)*u,'700 '+(12.5*u)+'px '+IN,MUT,'left',1.5);
  wvT(c,B.mgr.toUpperCase(),x0+iw-2*u,oy+(y+10)*u,'700 '+(12.5*u)+'px '+IN,MUT,'right',1.5);
  if(A.rec) wvT(c,A.rec,x0+2*u,oy+(y+28)*u,'500 '+(11.5*u)+'px '+IN,'#5d6350','left',.3);
  if(B.rec) wvT(c,B.rec,x0+iw-2*u,oy+(y+28)*u,'500 '+(11.5*u)+'px '+IN,'#5d6350','right',.3);
  y+=16+16+22;
  wvT(c,'Lineup',x0+2*u,oy+y*u,'500 '+(13*u)+'px '+IN,MUT,'left');
  wvT(c,'Week '+RCP.week+' · points',x0+iw-2*u,oy+y*u,'500 '+(13*u)+'px '+IN,MUT,'right');
  y+=8; c.strokeStyle='#22261a'; c.lineWidth=2; c.beginPath(); c.moveTo(x0,oy+y*u); c.lineTo(x0+iw,oy+y*u); c.stroke();
  var mx=0; A.rows.concat(B.rows).forEach(function(q){ if(q[2]>mx) mx=q[2]; }); if(mx<=0) mx=1;
  var PC={QB:'#5aa2ff',RB:'#2fd3a4',WR:'#ff9d2e',TE:'#ff5fa6'}, mid=x0+iw/2, pw=44*u, gap=6*u, cw2=(iw-2*36*u-pw-4*gap)/2;
  var lL=x0+36*u+gap, lR=lL+cw2, rL=lR+gap+pw+gap, rR=rL+cw2;
  async function ph(full,xc,cy,ring){ var src=rcPhoto(full), im=src?await wvImg(src):null, rr=18*u;
    c.save(); c.beginPath(); c.arc(xc,cy,rr,0,Math.PI*2); c.closePath(); c.clip();
    if(im){ var s2=Math.max(2*rr/im.width,2*rr/im.height); c.drawImage(im,xc-im.width*s2/2,cy-im.height*s2/2,im.width*s2,im.height*s2); } else { c.fillStyle='#1a1d14'; c.fillRect(xc-rr,cy-rr,2*rr,2*rr); wvT(c,rcIni(rcShort(full)),xc,cy+4*u,'700 '+(12*u)+'px '+IN,MUT,'center'); }
    c.restore(); }
  for(var q=0;q<n;q++){ var a=A.rows[q], b=B.rows[q], top=oy+(y+q*rowH)*u, cy=top+(rowH/2-3)*u;
    var wa=a[2]>b[2], wb=b[2]>a[2], DIM='#8d9479';
    await ph(a[1],x0+18*u,cy,wa?AC:null); await ph(b[1],x0+iw-18*u,cy,wb?BC:null);
    var ptsW=34*u;
    wvT(c,rcF(a[2]),lR,cy+4*u,(20*u)+'px '+BB,wa?AC:DIM,'right'); wvT(c,rcF(b[2]),rL,cy+4*u,(20*u)+'px '+BB,wb?BC:DIM,'left');
    var nf=wvFit(c,rcShort(a[1]),cw2-ptsW-6*u,'500 #px '+IN,12.5*u,9*u); wvT(c,rcShort(a[1]),lR-ptsW-6*u,cy+3*u,nf,wa?'#f2f4ea':DIM,'right');
    nf=wvFit(c,rcShort(b[1]),cw2-ptsW-6*u,'500 #px '+IN,12.5*u,9*u); wvT(c,rcShort(b[1]),rL+ptsW+6*u,cy+3*u,nf,wb?'#f2f4ea':DIM,'left');
    var bwA=Math.max(3*u,a[2]/mx*cw2), bwB=Math.max(3*u,b[2]/mx*cw2);
    c.globalAlpha=.55; c.fillStyle=AC; wvRR(c,lR-bwA,cy+14*u,bwA,3*u,1.5*u); c.fill(); c.fillStyle=BC; wvRR(c,rL,cy+14*u,bwB,3*u,1.5*u); c.fill(); c.globalAlpha=1;
    var p=a[0], pxl=lR+gap, pyt=cy-12*u; wvRR(c,pxl,pyt,pw,24*u,7*u); c.fillStyle=p==='W/R/T'?'#14170e':PC[p]+'1f'; c.fill(); c.lineWidth=u; c.strokeStyle=p==='W/R/T'?'#2e3322':PC[p]+'66'; c.stroke();
    var pcx=pxl+pw/2, pcy=cy+4*u;
    if(p==='W/R/T'){ wvT(c,'W',pcx-9*u,pcy,'700 '+(10.5*u)+'px '+IN,'#ff9d2e','center'); wvT(c,'R',pcx,pcy,'700 '+(10.5*u)+'px '+IN,'#2fd3a4','center'); wvT(c,'T',pcx+9*u,pcy,'700 '+(10.5*u)+'px '+IN,'#ff5fa6','center'); }
    else wvT(c,p,pcx,pcy,'700 '+(11*u)+'px '+IN,PC[p],'center',.6);
    c.strokeStyle='#15180f'; c.lineWidth=2; c.beginPath(); c.moveTo(x0,top+rowH*u-2*u); c.lineTo(x0+iw,top+rowH*u-2*u); c.stroke();
  }
  y+=n*rowH+14;
  if(imgs[0]) wvDraw(imgs[0],c,x0+2*u,oy+y*u,90*u,38*u,'left');
  wvT(c,'CUADZFANTASYNETWORK.COM',x0+iw-2*u,oy+(y+26)*u,(19*u)+'px '+BB,AC,'right',1.5);
  return cv;
}
async function rcShare(k,i){
  var ov=document.createElement('div'); ov.setAttribute('style','position:fixed;inset:0;z-index:99999;background:rgba(6,7,4,.88);display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto');
  ov.innerHTML='<div style="width:100%;max-width:520px;background:#14160f;border:1px solid #262a1b;border-radius:16px;padding:14px"><div id="rcBox"></div></div>';
  document.body.appendChild(ov); ov.addEventListener('click',function(e){ if(e.target===ov) ov.remove(); });
  var box=ov.querySelector('#rcBox');
  box.innerHTML='<div style="color:#9aa089;font:500 14px Inter,sans-serif;text-align:center;padding:40px 0">Building your recap card…</div>';
  var cv; try{ cv=await rcCard(k,i); }catch(e){ box.innerHTML='<div style="color:#ff8a80;font:500 14px Inter,sans-serif;text-align:center;padding:30px 0">Could not build the card.</div><button class="tc-ghost" id="rcX">Close</button>'; document.getElementById('rcX').onclick=function(){ ov.remove(); }; return; }
  var I=rcInfo(k,i), url, fn='cfn-recap-'+k+'-week-'+RCP.week+'-'+I.A.mgr.replace(/\W+/g,'')+'-vs-'+I.B.mgr.replace(/\W+/g,'')+'.png';
  try{ url=cv.toDataURL('image/png'); }catch(e){ box.innerHTML='<div style="color:#ff8a80;font:500 14px Inter,sans-serif;text-align:center;padding:30px 0">Could not export the card (a photo blocked it).</div><button class="tc-ghost" id="rcX">Close</button>'; document.getElementById('rcX').onclick=function(){ ov.remove(); }; return; }
  var blob=await new Promise(function(r){ cv.toBlob(r,'image/png'); }), file=null, can=false;
  try{ file=new File([blob],fn,{type:'image/png'}); can=!!(navigator.canShare&&navigator.canShare({files:[file]})); }catch(e){}
  box.innerHTML='<img alt="Matchup recap" src="'+url+'" style="width:100%;height:auto;border-radius:14px;border:1px solid #262a1b;display:block"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="tc-btn" id="rcGo" style="flex:1">'+(can?'Share':'Save image')+'</button>'+(can?'<button class="tc-ghost" id="rcDl">Save</button>':'')+'<button class="tc-ghost" id="rcCl">Close</button></div><div id="rcMsg" style="color:#9aa089;font:500 12px Inter,sans-serif;margin-top:8px"></div>';
  function save(){ var a=document.createElement('a'); a.href=url; a.download=fn; document.body.appendChild(a); a.click(); a.remove(); document.getElementById('rcMsg').textContent='Image saved. On a phone, press and hold the card to save it to Photos.'; }
  document.getElementById('rcCl').onclick=function(){ ov.remove(); };
  if(can){ document.getElementById('rcGo').onclick=function(){ navigator.share({files:[file],title:I.A.team+' vs '+I.B.team,text:'Week '+RCP.week+' · '+LGI[k].name+' on the Cuadz Fantasy Network'}).catch(function(){}); }; document.getElementById('rcDl').onclick=save; }
  else document.getElementById('rcGo').onclick=save;
}
