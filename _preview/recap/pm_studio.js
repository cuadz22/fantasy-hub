/* ---------- Studio: Polymarket-style slides ---------- */
var PM_POS={QB:'#5aa2ff',RB:'#2fd3a4',WR:'#ff9d2e',TE:'#ff5fa6'};
var PM_LOAD={};
function pmEnsure(k){ if(PM_LOAD[k]) return; PM_LOAD[k]=1; var names=[]; RCP.lg[k].forEach(function(m){ m.L.forEach(function(L){ L.forEach(function(r){ names.push(r[1]); }); }); });
  rcLoadPhotos(names).then(function(ch){ if(ch&&typeof stState!=='undefined'&&stState.unlocked&&!stState.busy&&!document.getElementById('view-studio').hidden) stRender(); }); }
function pmImg(name,sz){ var s=rcPhoto(name); if(s) return '<img src="'+s+'" style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;object-fit:cover;object-position:top;background:#1a1d14;display:block;flex:none">';
  return '<div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:#1a1d14;color:#8d9479;font-weight:700;font-size:'+Math.round(sz*.34)+'px;display:flex;align-items:center;justify-content:center;flex:none">'+stEsc(rcIni(rcShort(name)))+'</div>'; }
function pmHead(k,mgr,id,sz,col){
  var H=k==='gl'?(ST_BIG.heads||{})[mgr]:null, u=((ST_BIG.logos||{})[k]||{})[String(id)], d=u&&BIG_LOGO_DATA[u];
  if(H) return '<img src="'+H+'" style="width:'+sz+'px;height:'+sz+'px;object-fit:contain;display:block;flex:none">';
  if(d) return '<img src="'+d+'" style="width:'+sz+'px;height:'+sz+'px;border-radius:14px;object-fit:cover;display:block;flex:none">';
  return '<div style="width:'+sz+'px;height:'+sz+'px;color:'+col+';font-weight:700;font-size:'+Math.round(sz*.34)+'px;display:flex;align-items:center;justify-content:center;flex:none">'+stEsc(rcIni(mgr))+'</div>'; }
function pmFrame(d,kick,inner){
  var lg=LG_LOGO[d.id];
  return '<div style="width:540px;height:675px;background:linear-gradient(180deg,#0e1109,#090a07 42%);color:#f2f4ea;font-family:Inter,\'Helvetica Neue\',Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box;padding:18px 20px 12px;display:flex;flex-direction:column"><div style="position:absolute;left:0;top:0;width:540px;height:230px;background:radial-gradient(circle at 50% 0%,#1a2705 0%,rgba(11,12,10,0) 70%)"></div>'
   +'<div style="position:relative;display:flex;align-items:center;justify-content:space-between;height:40px;flex:none"><div style="display:flex;align-items:center;gap:9px;height:40px">'+(lg?'<img src="'+lg+'" alt="" style="height:36px;width:auto;max-width:90px;object-fit:contain;display:block">':'')+'<div style="font-size:12px;font-weight:600;color:#8d9479;letter-spacing:.04em">'+stEsc(d.name)+'</div></div>'
   +'<div style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;letter-spacing:.1em;color:#acf910;line-height:1">'+kick+'</div></div>'
   +inner
   +'<div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:8px;flex:none"><img src="'+CFN_LOGO+'" alt="CFN" style="height:26px;width:auto;display:block"><div style="font-family:\'Bebas Neue\',sans-serif;font-size:16px;letter-spacing:.1em;color:#acf910">CUADZFANTASYNETWORK.COM</div></div></div>';
}
function pmPill(p){ if(p==='W/R/T') return '<div style="width:40px;height:22px;border-radius:7px;background:#14170e;border:1px solid #2e3322;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;letter-spacing:.5px;flex:none"><span style="color:#ff9d2e">W</span><span style="color:#2fd3a4">R</span><span style="color:#ff5fa6">T</span></div>';
  var c=PM_POS[p]||'#8d9479'; return '<div style="width:40px;height:22px;border-radius:7px;background:'+c+'1f;border:1px solid '+c+'66;color:'+c+';display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:700;letter-spacing:.5px;flex:none">'+p+'</div>'; }
function pmMatchSlide(d,i){
  var k=d.id; pmEnsure(k);
  var id=ST_BIG.cards[k].w4[i-1].a.id, idx=0; RCP.lg[k].forEach(function(m,j){ if(m.t[0]===id||m.t[1]===id) idx=j; });
  var I=rcInfo(k,idx), A=I.A, B=I.B, wA=A.s>=B.s, n=A.rows.length, mx=1; A.rows.concat(B.rows).forEach(function(r){ if(r[2]>mx) mx=r[2]; });
  var title=(A.team+' vs '+B.team).toUpperCase(), tfs=title.length>34?24:title.length>28?27:31;
  function tm(S,col,win,right){
    var sc='<div style="font-family:\'Bebas Neue\',sans-serif;font-size:50px;line-height:.9;color:'+col+';opacity:'+(win?1:.62)+'">'+rcF(S.s)+'</div>', hd=pmHead(k,S.mgr,S.id,64,col);
    return '<div style="display:flex;flex-direction:column;align-items:'+(right?'flex-end':'flex-start')+';width:190px"><div style="display:flex;align-items:center;gap:8px">'+(right?sc+hd:hd+sc)+'</div>'
     +'<div style="font-size:12px;font-weight:700;letter-spacing:.1em;color:#8d9479;margin-top:6px">'+stEsc(S.mgr.toUpperCase())+'</div><div style="font-size:11.5px;color:#5d6350;margin-top:2px">'+stEsc(S.rec||'')+'</div></div>'; }
  var rows=A.rows.map(function(a,q){ var b=B.rows[q], wa=a[2]>b[2], wb=b[2]>a[2];
    function cell(r,win,right,col){ var nm='<span style="font-size:12.5px;font-weight:500;color:'+(win?'#f2f4ea':'#8d9479')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">'+stEsc(rcShort(r[1]))+'</span>', pt='<span style="font-family:\'Bebas Neue\',sans-serif;font-size:20px;line-height:1;color:'+(win?col:'#8d9479')+';flex:none">'+rcF(r[2])+'</span>';
      var bw=Math.max(3,r[2]/mx*100);
      return '<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:'+(right?'flex-start':'flex-end')+'"><div style="display:flex;align-items:baseline;gap:6px;max-width:100%">'+(right?pt+nm:nm+pt)+'</div><div style="width:100%;display:flex;justify-content:'+(right?'flex-start':'flex-end')+';margin-top:3px"><div style="width:'+bw+'%;height:3px;border-radius:2px;background:'+col+';opacity:.55"></div></div></div>'; }
    return '<div style="display:flex;align-items:center;gap:8px;height:48px;border-bottom:1px solid #15180f">'+pmImg(a[1],34)+cell(a,wa,false,'#acf910')+pmPill(a[0])+cell(b,wb,true,'#4cc3ff')+pmImg(b[1],34)+'</div>'; }).join('');
  var inner='<div style="font-family:\'Bebas Neue\',sans-serif;font-size:'+tfs+'px;letter-spacing:.3px;line-height:1.05;margin-top:8px;white-space:nowrap">'+stEsc(title)+'</div>'
   +'<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-top:12px">'+tm(A,'#acf910',wA,false)
   +'<div style="flex:1;text-align:center;padding-top:4px"><div style="font-size:15px;font-weight:600;color:#acf910">Final</div><div style="font-size:11.5px;color:#8d9479;margin-top:3px">'+rcLabel(Math.abs(A.s-B.s))+'</div></div>'+tm(B,'#4cc3ff',!wA,true)+'</div>'
   +'<div style="display:flex;justify-content:space-between;font-size:12px;color:#8d9479;border-bottom:1px solid #22261a;padding:14px 2px 6px;margin-bottom:2px"><span>Lineup</span><span>Week '+RCP.week+' · points</span></div>'
   +'<div style="display:flex;flex-direction:column">'+rows+'</div>';
  return pmFrame(d,'WEEK '+RCP.week+' · FINAL',inner);
}
function pmWeekly(d){
  var r=stReport(d), mo=stMotm(d), lg=d.id, mg=function(t){ return bigMg(lg,t); };
  function pimg(name){ return bigPhoto(name,36); }
  function two(a,b){ return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">'+bigTeamImg(lg,a,24)+bigTeamImg(lg,b,24)+'</div>'; }
  var motm=mo.map(function(x){ var win=x.team, mt=x.a===win?'<span style="color:#fff;font-weight:700">'+stEsc(x.a)+'</span> vs '+stEsc(x.b):stEsc(x.a)+' vs <span style="color:#fff;font-weight:700">'+stEsc(x.b)+'</span>';
    return '<div style="width:246px;height:60px;box-sizing:border-box;background:#121a07;border:1px solid #2d4a0c;border-radius:14px;padding:6px 12px 0 8px;display:flex;flex-direction:column;margin:0 3px 6px">'
    +'<div style="display:flex;align-items:center;gap:9px">'+bigPhoto(x.p.name,34)
    +'<div style="flex:1;min-width:0"><div style="font-size:13.5px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+stEsc(rcShort(x.p.name))+'</div><div style="font-size:8px;color:#acf910;opacity:.85;letter-spacing:.14em;margin-top:1px">'+stEsc(x.p.position)+' · TOP SCORER</div></div>'
    +'<div style="font-family:\'Bebas Neue\',sans-serif;font-size:28px;color:#acf910;line-height:1;flex:none;text-shadow:0 0 12px rgba(172,249,16,.45)">'+Number(x.p.points).toFixed(1)+'</div></div>'
    +'<div style="font-size:9px;color:#8d9479;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px;padding-left:2px">'+mt+'</div></div>'; }).join('');
  function tile(label,img,head,sub,val,tone,two2){
    var col=tone==='bad'?'#ff7a66':'#acf910', bg=tone==='bad'?'#1a110f':(tone==='hi'?'#121a07':'#11130e'), bd=tone==='bad'?'#4a2620':(tone==='hi'?'#2d4a0c':'#22261a');
    return '<div style="width:246px;height:66px;box-sizing:border-box;background:'+bg+';border:1px solid '+bd+';border-left:3px solid '+(tone==='n'?'#2e3322':col)+';border-radius:14px;padding:0 12px 0 9px;display:flex;align-items:center;gap:9px;margin:0 3px 6px"><div style="width:38px;display:flex;align-items:center;justify-content:center;flex:none">'+img+'</div>'
    +'<div style="flex:1;min-width:0"><div style="font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:'+(tone==='n'?'#5d6350':col)+';opacity:'+(tone==='n'?1:.85)+';font-weight:700;white-space:nowrap">'+label+'</div>'
    +(two2?'<div style="font-size:11.5px;font-weight:700;color:#fff;line-height:1.2;margin-top:2px;overflow:hidden;max-height:28px">'+stEsc(two2[0])+'<br><span style="color:#8d9479;font-weight:500">def. </span>'+stEsc(two2[1])+'</div>'
      :'<div style="font-size:12.5px;font-weight:700;color:#fff;line-height:1.15;max-height:29px;overflow:hidden;margin-top:2px">'+stEsc(head)+'</div><div style="font-size:9px;color:#8d9479;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">'+sub+'</div>')+'</div>'
    +'<div style="font-family:\'Bebas Neue\',sans-serif;font-size:27px;color:'+col+';line-height:1;flex:none;'+(tone==='n'?'':'text-shadow:0 0 12px '+col+'66')+'">'+val+'</div></div>'; }
  var tiles=[
    tile('MVP of the week',pimg(r.mvp[1]),rcShort(r.mvp[1]),stEsc(mg(r.mvp[3]))+' · '+r.mvp[0],Number(r.mvp[2]).toFixed(1),'hi'),
    tile('Dud of the week',pimg(r.dud[1]),rcShort(r.dud[1]),stEsc(mg(r.dud[3]))+' · '+r.dud[0],Number(r.dud[2]).toFixed(1),'bad'),
    tile('Lineup of the week',bigTeamImg(lg,r.lineup.name,38),r.lineup.name,stEsc(mg(r.lineup.name)),r.lineup.score.toFixed(1),'hi'),
    tile('Dart throw',pimg(r.def.name),rcShort(r.def.name),stEsc(r.def.mgr)+' · '+r.def.fan.toFixed(1)+' vs '+r.def.proj.toFixed(1)+' proj','+'+r.def.pct+'%','hi'),
    tile('Closest game',two(r.closest.winner.name,r.closest.loser.name),'','',stF(r.closest.margin),'n',[r.closest.winner.name,r.closest.loser.name]),
    tile('Biggest blowout',two(r.blow.winner.name,r.blow.loser.name),'','',stF(r.blow.margin),'n',[r.blow.winner.name,r.blow.loser.name]),
    tile('Lucky winner',bigTeamImg(lg,r.lucky.name,38),r.lucky.name,stEsc(mg(r.lucky.name))+' · low score',r.lucky.score.toFixed(1),'n'),
    tile('Unlucky loser',bigTeamImg(lg,r.unl.name,38),r.unl.name,stEsc(mg(r.unl.name))+' · high score',r.unl.score.toFixed(1),'bad')].join('');
  function sec(t){ return '<div style="font-size:12.5px;font-weight:800;letter-spacing:.16em;color:#acf910;text-transform:uppercase;margin:9px 3px 7px;display:flex;align-items:center;gap:8px"><span>'+t+'</span><span style="flex:1;height:1px;background:#2d4a0c"></span></div>'; }
  var inner='<div style="position:relative;display:flex;flex-direction:column;flex:1">'
   +sec('Man of the match')+'<div style="display:flex;flex-wrap:wrap;justify-content:center;margin:0 -3px">'+motm+'</div>'
   +sec('Weekly awards')+'<div style="display:flex;flex-wrap:wrap;justify-content:center;margin:0 -3px">'+tiles+'</div></div>';
  return pmFrame(d,'WEEK '+d.week+' RECAP',inner);
}

function pmSquare(d,i){
  var k=d.id; pmEnsure(k);
  var id=ST_BIG.cards[k].w4[i-1].a.id, idx=0; RCP.lg[k].forEach(function(m,j){ if(m.t[0]===id||m.t[1]===id) idx=j; });
  var I=rcInfo(k,idx), A=I.A, B=I.B, wA=A.s>=B.s, mx=1; A.rows.concat(B.rows).forEach(function(r){ if(r[2]>mx) mx=r[2]; });
  var lg=LG_LOGO[k];
  function tb(S,col,win,right){
    var sc='<div style="font-family:\'Bebas Neue\',sans-serif;font-size:46px;line-height:.95;margin-top:3px;color:'+col+';opacity:'+(win?1:.6)+'">'+rcF(S.s)+'</div>';
    var hd='<div style="display:flex;flex-direction:column;align-items:center;gap:3px;width:76px;flex:none">'+pmHead(k,S.mgr,S.id,76,col)+'<div style="font-size:10.5px;font-weight:700;letter-spacing:.1em;color:#8d9479;white-space:nowrap">'+stEsc(S.mgr.toUpperCase())+'</div></div>';
    var inf='<div style="flex:1;min-width:0;text-align:'+(right?'right':'left')+'"><div style="font-size:12.5px;font-weight:700;line-height:1.15;max-height:29px;overflow:hidden">'+stEsc(S.team)+'</div><div style="font-size:10.5px;color:#8d9479;margin-top:3px;letter-spacing:.04em">'+stEsc(S.rec||'')+' · <b style="letter-spacing:.08em;color:'+(win?col:'#ff7a66')+'">'+(win?'WIN':'LOSS')+'</b></div>'+sc+'</div>';
    return '<div style="display:flex;gap:7px;width:200px;align-items:flex-start">'+(right?inf+hd:hd+inf)+'</div>'; }
  var rows=A.rows.map(function(a,q){ var b=B.rows[q], wa=a[2]>b[2], wb=b[2]>a[2];
    function cell(r,win,right,col){ var nm='<span style="font-size:13.5px;color:'+(win?'#f2f4ea':'#8d9479')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">'+stEsc(rcShort(r[1]))+'</span>', pt='<span style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;line-height:1;color:'+(win?col:'#8d9479')+';flex:none">'+rcF(r[2])+'</span>';
      var bw=Math.max(3,r[2]/mx*100);
      return '<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:'+(right?'flex-start':'flex-end')+'"><div style="display:flex;align-items:baseline;gap:6px;max-width:100%">'+(right?pt+nm:nm+pt)+'</div><div style="width:100%;display:flex;justify-content:'+(right?'flex-start':'flex-end')+';margin-top:4px"><div style="width:'+bw+'%;height:3px;border-radius:2px;background:'+col+';opacity:.55"></div></div></div>'; }
    return '<div style="display:flex;align-items:center;gap:8px;height:54px;border-bottom:1px solid #15180f">'+pmImg(a[1],40)+cell(a,wa,false,'#acf910')+pmPill(a[0])+cell(b,wb,true,'#4cc3ff')+pmImg(b[1],40)+'</div>'; }).join('');
  var mid='<div style="flex:1;text-align:center;padding-top:4px;display:flex;flex-direction:column;align-items:center"><div style="font-size:16px;font-weight:700;color:#acf910;letter-spacing:.04em">Final</div>'+(lg?'<img src="'+lg+'" alt="" style="height:40px;width:auto;max-width:96px;object-fit:contain;display:block;margin-top:8px">':'')+(k==='bh'?'':'<div style="font-size:9.5px;color:#5d6350;line-height:1.2;margin-top:5px">'+stEsc(d.name)+'</div>')+'</div>';
  return '<div style="width:540px;height:675px;background:linear-gradient(180deg,#0f130a,#090a07 45%);color:#f2f4ea;font-family:Inter,\'Helvetica Neue\',Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box;padding:20px 18px 14px;display:flex;flex-direction:column">'
   +'<div style="display:flex;align-items:center;justify-content:space-between;height:30px;flex:none"><img src="'+CFN_LOGO+'" alt="CFN" style="height:38px;width:auto;display:block"><div style="font-family:\'Bebas Neue\',sans-serif;font-size:20px;letter-spacing:.12em;color:#acf910;line-height:1">WEEK '+RCP.week+' RECAP</div></div>'
   +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:12px;padding-bottom:12px;border-bottom:1px solid #22261a;flex:none">'+tb(A,'#acf910',wA,false)+mid+tb(B,'#4cc3ff',!wA,true)+'</div>'
   +'<div style="display:flex;flex-direction:column;margin-top:4px">'+rows+'</div>'
   +'<div style="margin-top:auto;text-align:center;padding-top:6px;font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:.14em;color:#fff">CUADZFANTASYNETWORK.COM</div>';
}
/* hook into Studio */
var _stSlideHTML=stSlideHTML;
stSlideHTML=function(d,i){ if(stState.style!=='classic'){ var m=d.matchups.length; if(i===0) return pmWeekly(d); if(i<=m) return pmSquare(d,i); } return _stSlideHTML(d,i); };
var _stRender=stRender;
stRender=function(){ _stRender(); var side=document.querySelector('#studio-root .st-side'); if(!side) return; var lbls=side.querySelectorAll('.st-lbl'); var slides=null; lbls.forEach(function(l){ if(l.textContent==='Slides') slides=l; }); if(!slides) return;
  var wrap=document.createElement('div'); var cl=stState.style==='classic';
  wrap.innerHTML='<div class="st-lbl">Recap style</div><button class="st-btn'+(cl?'':' on')+'" onclick="pmStyle(\'pm\')">Matchup card</button><button class="st-btn'+(cl?' on':'')+'" onclick="pmStyle(\'classic\')">Classic</button>';
  while(wrap.firstChild) side.insertBefore(wrap.firstChild,slides); };
function pmStyle(s){ stState.style=s; stState.imgs=[]; stRender(); }
var _stExport=stExport;
stExport=async function(){ try{ var k=stState.league, names=[]; RCP.lg[k].forEach(function(m){ m.L.forEach(function(L){ L.forEach(function(r){ names.push(r[1]); }); }); }); await rcLoadPhotos(names); }catch(e){} return _stExport(); };
