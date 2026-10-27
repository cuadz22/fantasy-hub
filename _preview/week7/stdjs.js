/* ---------- Standings share card ---------- */
function stdRows(k){
  var rows=[], F=FM[k]||{teams:[]}, byName={}; F.teams.forEach(function(t){ byName[t.name]=t; });
  var box=document.createElement('div');
  if(k==='sts'){
    var src=document.querySelectorAll('#view-article .lg-sec')[LGI.sts.idx], sub=null;
    if(src) src.querySelectorAll('.subsec').forEach(function(s){ if(s.querySelector('.subsec-hd').textContent.indexOf('STS Custom')===0) sub=s; });
    if(!sub) return {rows:[],mode:'sts'};
    sub.querySelectorAll('.sts-row').forEach(function(r){ var c=r.children, nm=c[1].textContent, t=byName[nm]||{};
      rows.push({rk:+c[0].textContent,team:nm,mgr:t.mgr||'',tid:t.tid,a:c[2].textContent,b:c[3].textContent,c:c[4].textContent,d:c[5].textContent}); });
    return {rows:rows,mode:'sts'};
  }
  box.innerHTML=LGD.stand[k];
  box.querySelectorAll('.lgs-row').forEach(function(r){ var c=r.children, nm=c[1].querySelector('b').textContent, t=byName[nm]||{};
    rows.push({rk:+c[0].textContent,team:nm,mgr:c[1].querySelector('.mg-lg')?c[1].querySelector('.mg-lg').textContent:(t.mgr||''),tid:t.tid,a:c[2].textContent,b:c[3].textContent,c:c[4].textContent,d:c[5].textContent}); });
  return {rows:rows,mode:'std'};
}
async function stdCard(k){
  var BB="'Bebas Neue','Impact',sans-serif", IN="Inter,system-ui,sans-serif", ACC='#acf910';
  try{ await document.fonts.load("40px 'Bebas Neue'"); await document.fonts.load("700 24px Inter"); await document.fonts.load("500 24px Inter"); }catch(e){}
  var D=stdRows(k), R=D.rows, n=R.length, sts=D.mode==='sts';
  var W=1600, hdr=210, ftr=124, PX=46, rowH=84, top=hdr+30, colH=44, H=top+colH+n*rowH+40+ftr;
  var cv=document.createElement('canvas'); cv.width=W; cv.height=H; var c=cv.getContext('2d');
  c.fillStyle='#0a0b07'; c.fillRect(0,0,W,H);
  c.fillStyle='#0e0f0a'; c.fillRect(0,0,W,hdr); c.fillStyle=ACC; c.fillRect(0,hdr-6,W,6);
  var imgs=await Promise.all([wvImg(CFN_LOGO), wvImg(LG_LOGO[k])]);
  wvT(c,sts?'STS STANDINGS':'STANDINGS',PX+4,106,'92px '+BB,'#ffffff','left',3);
  wvT(c,sts?'4 points per win + 3 points for a top-6 score. Top 6 make the playoffs.':'Ranked by wins, then points for. Top 6 make the playoffs.',PX+6,158,'500 26px '+IN,'#aab08f','left');
  if(imgs[1]) wvDraw(imgs[1],c,W-18,30,140,150,'right');
  /* column layout */
  var xr=PX+30, xa=PX+112, xn=PX+190, cols=sts?[['PTS',1010],['W-L',1180],['TOP 6',1330],['PF',1520]]:[['W-L',1000],['PF',1200],['PA',1380],['STRK',1520]];
  var y=top+colH-12;
  wvT(c,'#',xr,y,'700 20px '+IN,'#7d8466','center',2); wvT(c,'TEAM',xn,y,'700 20px '+IN,'#7d8466','left',2);
  cols.forEach(function(q){ wvT(c,q[0],q[1],y,'700 20px '+IN,'#7d8466','right',2); });
  var me=(typeof FM_YOU!=='undefined'&&FM_YOU[k])||'Cuadz';
  for(var i=0;i<n;i++){
    var r=R[i], ry=top+colH+i*rowH, cy=ry+rowH/2, inP=r.rk<=6, mine=r.mgr===me;
    wvRR(c,PX,ry+5,W-2*PX,rowH-10,16); c.fillStyle=mine?'#1d2410':(i%2?'#101208':'#14160f'); c.fill();
    if(mine){ c.lineWidth=2; c.strokeStyle='#7cc400'; c.stroke(); }
    wvT(c,String(r.rk),xr,cy+14,'800 40px '+BB,inP?ACC:'#8a9170','center',1);
    var av=fmAvatar(r.mgr), im=av?await wvImg(av):(r.tid!=null?await fmLogo(k,r.tid):null), rad=28;
    c.save(); c.beginPath(); c.arc(xa,cy,rad,0,Math.PI*2); c.closePath(); c.clip();
    if(im){ var s2=Math.max(2*rad/im.width,2*rad/im.height); c.drawImage(im,xa-im.width*s2/2,cy-im.height*s2/2,im.width*s2,im.height*s2); } else { c.fillStyle='#262a1b'; c.fillRect(xa-rad,cy-rad,2*rad,2*rad); wvT(c,(r.mgr||r.team).slice(0,2).toUpperCase(),xa,cy+9,'28px '+BB,'#cfd5bd','center'); }
    c.restore(); c.lineWidth=2; c.strokeStyle=mine?'#7cc400':'#3a3f2b'; c.beginPath(); c.arc(xa,cy,rad,0,Math.PI*2); c.stroke();
    var nameFont=wvFit(c,r.team,640,'700 #px '+IN,32,20);
    wvT(c,r.team,xn,cy+(r.mgr?2:11),nameFont,'#f1f4e6','left');
    if(r.mgr) wvT(c,r.mgr,xn,cy+30,'500 20px '+IN,'#9aa089','left');
    var vals=[r.a,r.b,r.c,r.d], mono='700 32px "DM Mono","Roboto Mono",ui-monospace,monospace';
    vals.forEach(function(v,j){ var col=(j===0?(sts?ACC:'#f1f4e6'):(j===3&&!sts?(/^W/.test(v)?'#3ddc84':/^L/.test(v)?'#ff5d5d':'#9aa089'):'#cfd5bd')); wvT(c,v,cols[j][1],cy+11,j===0?'800 36px "DM Mono","Roboto Mono",ui-monospace,monospace':mono,col,'right'); });
    if(i===5){ c.strokeStyle=ACC; c.setLineDash([10,8]); c.lineWidth=2; c.beginPath(); c.moveTo(PX+10,ry+rowH-2); c.lineTo(W-PX-10,ry+rowH-2); c.stroke(); c.setLineDash([]); }
  }
  (function(){ var ly=top+colH+6*rowH-2; c.fillStyle='#0a0b07'; c.fillRect(W/2-90,ly-12,180,24); wvT(c,'PLAYOFF LINE',W/2,ly+6,'700 16px '+IN,ACC,'center',3); })();
  c.fillStyle='#000000'; c.fillRect(0,H-ftr,W,ftr); c.fillStyle=ACC; c.fillRect(0,H-ftr,W,4);
  if(imgs[0]) wvDraw(imgs[0],c,PX,H-ftr+12,260,100,'left');
  var wk=(FM[k]&&FM[k].week)||'';
  wvT(c,'THROUGH WEEK '+wk+' · '+LGI[k].name.toUpperCase(),W-PX,H-ftr+72,'800 26px '+IN,ACC,'right',3);
  return cv;
}
async function shareStand(k){
  var ov=document.createElement('div'); ov.setAttribute('style','position:fixed;inset:0;z-index:99999;background:rgba(6,7,4,.88);display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto');
  ov.innerHTML='<div style="width:100%;max-width:560px;background:#14160f;border:1px solid #262a1b;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:12px"><div id="sdBox"></div></div>';
  document.body.appendChild(ov); ov.addEventListener('click',function(e){ if(e.target===ov) ov.remove(); });
  var box=ov.querySelector('#sdBox');
  box.innerHTML='<div style="color:#9aa089;font:500 14px Inter,sans-serif;text-align:center;padding:40px 0">Building your standings card…</div>';
  var cv; try{ cv=await stdCard(k); }catch(e){ box.innerHTML='<div style="color:#ff8a80;font:500 14px Inter,sans-serif;text-align:center;padding:30px 0">Could not build the card.</div><button class="tc-ghost" id="sdX">Close</button>'; document.getElementById('sdX').onclick=function(){ ov.remove(); }; return; }
  var url=cv.toDataURL('image/png'), fn='cfn-standings-'+k+'-week-'+((FM[k]&&FM[k].week)||'')+'.png';
  var blob=await new Promise(function(r){ cv.toBlob(r,'image/png'); }), file=null, can=false;
  try{ file=new File([blob],fn,{type:'image/png'}); can=!!(navigator.canShare&&navigator.canShare({files:[file]})); }catch(e){}
  box.innerHTML='<img alt="Standings" src="'+url+'" style="width:100%;height:auto;border-radius:14px;border:1px solid #262a1b;display:block"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="tc-btn" id="sdGo" style="flex:1">'+(can?'Share':'Save image')+'</button>'+(can?'<button class="tc-ghost" id="sdDl">Save</button>':'')+'<button class="tc-ghost" id="sdCl">Close</button></div><div id="sdMsg" style="color:#9aa089;font:500 12px Inter,sans-serif;margin-top:8px"></div>';
  function save(){ var a=document.createElement('a'); a.href=url; a.download=fn; document.body.appendChild(a); a.click(); a.remove(); document.getElementById('sdMsg').textContent='Image saved. On a phone, press and hold the card to save it to Photos.'; }
  document.getElementById('sdCl').onclick=function(){ ov.remove(); };
  if(can){ document.getElementById('sdGo').onclick=function(){ navigator.share({files:[file],title:'Standings · '+LGI[k].name,text:'Week '+((FM[k]&&FM[k].week)||'')+' standings on the Cuadz Fantasy Network'}).catch(function(){}); }; document.getElementById('sdDl').onclick=save; }
  else document.getElementById('sdGo').onclick=save;
}
