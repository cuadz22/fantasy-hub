/* ---------- Studio: Polymarket-style slides ---------- */
var PM_POS={QB:'#5aa2ff',RB:'#2fd3a4',WR:'#ff9d2e',TE:'#ff5fa6',SFX:'#c58bff'};
var PM_LOAD={};
function pmEnsure(k){ if(PM_LOAD[k]) return; PM_LOAD[k]=1; var names=[]; RCP.lg[k].forEach(function(m){ m.L.forEach(function(L){ L.forEach(function(r){ names.push(r[1]); }); }); });
  rcLoadPhotos(names).then(function(ch){ if(ch&&typeof stState!=='undefined'&&stState.unlocked&&!stState.busy&&!document.getElementById('view-studio').hidden) stRender(); }); }
function pmImg(name,sz){ var s=rcPhoto(name); if(s) return '<img src="'+s+'" style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;object-fit:cover;object-position:top;background:#1a1d14;display:block;flex:none">';
  return '<div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:#1a1d14;color:#8d9479;font-weight:700;font-size:'+Math.round(sz*.34)+'px;display:flex;align-items:center;justify-content:center;flex:none">'+stEsc(rcIni(rcShort(name)))+'</div>'; }
function pmHead(k,mgr,id,sz,col){
  var H=k==='gl'?(ST_BIG.heads||{})[mgr]:null, u=((ST_BIG.logos||{})[k]||{})[String(id)], d=u&&BIG_LOGO_DATA[u];
  if(H) return '<img src="'+H+'" style="width:'+sz+'px;height:'+sz+'px;object-fit:contain;display:block;flex:none">';
  if(d) return '<img src="'+d+'" style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;object-fit:cover;display:block;flex:none">';
  return '<div style="width:'+sz+'px;height:'+sz+'px;color:'+col+';font-weight:700;font-size:'+Math.round(sz*.34)+'px;display:flex;align-items:center;justify-content:center;flex:none">'+stEsc(rcIni(mgr))+'</div>'; }
function pmFrame(d,kick,inner){
  var lg=LG_LOGO[d.id];
  return '<div style="width:540px;height:675px;background:linear-gradient(180deg,#0e1109,#090a07 42%);color:#f2f4ea;font-family:Inter,\'Helvetica Neue\',Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box;padding:18px 20px 12px;display:flex;flex-direction:column"><div style="position:absolute;left:0;top:0;width:540px;height:230px;background:radial-gradient(circle at 50% 0%,#1a2705 0%,rgba(11,12,10,0) 70%)"></div>'
   +'<div style="position:relative;display:flex;align-items:center;justify-content:space-between;height:40px;flex:none"><div style="display:flex;align-items:center;gap:9px;height:40px">'+(lg?'<img src="'+lg+'" alt="" style="height:36px;width:auto;max-width:90px;object-fit:contain;display:block">':'')+'<div style="font-size:12px;font-weight:600;color:#8d9479;letter-spacing:.04em">'+stEsc(rcLg(d.id))+'</div></div>'
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
  var lg=LG_LOGO[k], tr=rcTrail(k,idx), RH=tr?(A.rows.length>8?39:43):(A.rows.length>8?48:54), RS=tr?(A.rows.length>8?31:34):(A.rows.length>8?36:40);
  function tb(S,col,win,right){
    var sc='<div style="font-family:\'Bebas Neue\',sans-serif;font-size:46px;line-height:.95;margin-top:3px;color:'+col+';opacity:'+(win?1:.6)+'">'+rcF(S.s)+'</div>';
    var hd='<div style="display:flex;flex-direction:column;align-items:center;gap:3px;width:76px;flex:none">'+pmHead(k,S.mgr,S.id,76,col)+'<div style="font-size:10.5px;font-weight:700;letter-spacing:.1em;color:#8d9479;white-space:nowrap">'+stEsc(S.mgr.toUpperCase())+'</div></div>';
    var inf='<div style="flex:1;min-width:0;text-align:'+(right?'right':'left')+'"><div style="font-size:12.5px;font-weight:700;line-height:1.15;max-height:29px;overflow:hidden">'+stEsc(S.team)+'</div><div style="font-size:10.5px;color:#8d9479;margin-top:3px;letter-spacing:.04em">'+stEsc(S.rec||'')+' · <b style="letter-spacing:.08em;color:'+(win?col:'#ff7a66')+'">'+(win?'WIN':'LOSS')+'</b></div>'+sc+'</div>';
    return '<div style="display:flex;gap:7px;width:200px;align-items:flex-start">'+(right?inf+hd:hd+inf)+'</div>'; }
  var rows=A.rows.map(function(a,q){ var b=B.rows[q], wa=a[2]>b[2], wb=b[2]>a[2];
    function cell(r,win,right,col){ var nm='<span style="font-size:13.5px;color:'+(win?'#f2f4ea':'#8d9479')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">'+stEsc(rcShort(r[1]))+'</span>', pt='<span style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;line-height:1;color:'+(win?col:'#8d9479')+';flex:none">'+rcF(r[2])+'</span>';
      var bw=Math.max(3,r[2]/mx*100);
      return '<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:'+(right?'flex-start':'flex-end')+'"><div style="display:flex;align-items:baseline;gap:6px;max-width:100%">'+(right?pt+nm:nm+pt)+'</div><div style="width:100%;display:flex;justify-content:'+(right?'flex-start':'flex-end')+';margin-top:4px"><div style="width:'+bw+'%;height:3px;border-radius:2px;background:'+col+';opacity:.55"></div></div></div>'; }
    return '<div style="display:flex;align-items:center;gap:8px;height:'+RH+'px;border-bottom:1px solid #15180f">'+pmImg(a[1],RS)+cell(a,wa,false,'#acf910')+pmPill(a[0])+cell(b,wb,true,'#4cc3ff')+pmImg(b[1],RS)+'</div>'; }).join('');
  var mid='<div style="flex:1;text-align:center;padding-top:4px;display:flex;flex-direction:column;align-items:center"><div style="font-size:16px;font-weight:700;color:#acf910;letter-spacing:.04em">Final</div>'+(lg?'<img src="'+lg+'" alt="" style="height:40px;width:auto;max-width:96px;object-fit:contain;display:block;margin-top:8px">':'')+(k==='bh'?'':'<div style="font-size:9.5px;color:#5d6350;line-height:1.2;margin-top:5px">'+stEsc(rcLg(d.id))+'</div>')+'</div>';
  return '<div style="width:540px;height:675px;background:linear-gradient(180deg,#0f130a,#090a07 45%);color:#f2f4ea;font-family:Inter,\'Helvetica Neue\',Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box;padding:20px 18px 14px;display:flex;flex-direction:column">'
   +'<div style="display:flex;align-items:center;justify-content:space-between;height:30px;flex:none"><img src="'+CFN_LOGO+'" alt="CFN" style="height:38px;width:auto;display:block"><div style="font-family:\'Bebas Neue\',sans-serif;font-size:20px;letter-spacing:.12em;color:#acf910;line-height:1">WEEK '+RCP.week+' RECAP</div></div>'
   +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:12px;padding-bottom:12px;border-bottom:1px solid #22261a;flex:none">'+tb(A,'#acf910',wA,false)+mid+tb(B,'#4cc3ff',!wA,true)+'</div>'
   +(tr?'<div style="flex:none;margin-top:8px;padding:8px 6px 0;border-bottom:1px solid #22261a"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:9.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#5d6350">Win probability · '+stEsc(tr.S.team)+'</span><span style="font-size:9.5px;font-weight:700;color:'+tr.col+';background:'+tr.col+'1a;border-radius:6px;padding:3px 7px">'+stEsc(tr.tag)+'</span></div>'+rcTrailHTML(tr,{h:70,m:34,t:19,b:19,fs:10,ax:8.5,ay:6})+'</div>':'')
   +'<div style="display:flex;flex-direction:column;margin-top:4px">'+rows+'</div>'
   +'<div style="margin-top:auto;text-align:center;padding-top:6px;font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:.14em;color:#fff">CUADZFANTASYNETWORK.COM</div>';
}
function pmEnsureP(k){ var names=[]; ST_BIG.cards[k].w5.forEach(function(c,i){ names=names.concat(rcNamesP(rcPrevInfo(k,i))); }); rcLoadPhotos(names).then(function(ch){ if(ch&&typeof stState!=='undefined'&&stState.unlocked&&!stState.busy&&!document.getElementById('view-studio').hidden) stRender(); }); }
var PM_PL={};
function pmPreviewHTML(k,i){
  var I=rcPrevInfo(k,i), A=I.A, B=I.B, favA=I.wp>=50, oA=rcAm(I.wp), oB=rcAm(100-I.wp), lg=LG_LOGO[k], n=A.rows.length, RH=n>8?44:48, RS=n>8?34:36, mx=1;
  A.rows.concat(B.rows).forEach(function(r){ if(r[2]>mx) mx=r[2]; });
  function tb(S,col,fav,right,odd){
    var sc='<div style="font-family:\'Bebas Neue\',sans-serif;font-size:46px;line-height:.95;margin-top:3px;color:'+col+';opacity:'+(fav?1:.6)+'">'+rcF(S.s)+'</div>';
    var hd='<div style="display:flex;flex-direction:column;align-items:center;gap:3px;width:76px;flex:none">'+pmHead(k,S.mgr,S.id,76,col)+'<div style="font-size:10.5px;font-weight:700;letter-spacing:.1em;color:#8d9479;white-space:nowrap">'+stEsc(S.mgr.toUpperCase())+'</div></div>';
    var inf='<div style="flex:1;min-width:0;text-align:'+(right?'right':'left')+'"><div style="font-size:12.5px;font-weight:700;line-height:1.15;max-height:29px;overflow:hidden">'+stEsc(S.team)+'</div><div style="font-size:10.5px;color:#8d9479;margin-top:3px;letter-spacing:.04em">'+stEsc(S.rec||'')+' · <b style="letter-spacing:.04em;color:'+col+'">'+odd+'</b></div>'+sc+'</div>';
    return '<div style="display:flex;gap:7px;width:200px;align-items:flex-start">'+(right?inf+hd:hd+inf)+'</div>'; }
  var rows=A.rows.map(function(a,q){ var b=B.rows[q], wa=a[2]>b[2], wb=b[2]>a[2];
    function cell(r,win,right,col){ var em=r[1]==='\u2014', nm='<span style="font-size:13.5px;color:'+(win?'#f2f4ea':'#8d9479')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">'+stEsc(em?'Empty slot':rcShort(r[1]))+'</span>', pt='<span style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;line-height:1;color:'+(win?col:'#8d9479')+';flex:none">'+rcF(r[2])+'</span>';
      var bw=Math.max(3,r[2]/mx*100);
      return '<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:'+(right?'flex-start':'flex-end')+'"><div style="display:flex;align-items:baseline;gap:6px;max-width:100%">'+(right?pt+nm:nm+pt)+'</div><div style="width:100%;display:flex;justify-content:'+(right?'flex-start':'flex-end')+';margin-top:4px"><div style="width:'+bw+'%;height:3px;border-radius:2px;background:'+col+';opacity:.55"></div></div></div>'; }
    function ph(r){ return r[1]==='\u2014'?'<div style="width:'+RS+'px;height:'+RS+'px;border-radius:50%;background:#1a1d14;flex:none"></div>':pmImg(r[1],RS); }
    return '<div style="display:flex;align-items:center;gap:8px;height:'+RH+'px;border-bottom:1px solid #15180f">'+ph(a)+cell(a,wa,false,'#acf910')+pmPill(a[0])+cell(b,wb,true,'#4cc3ff')+ph(b)+'</div>'; }).join('');
  var mid='<div style="flex:1;text-align:center;padding-top:4px;display:flex;flex-direction:column;align-items:center"><div style="font-size:16px;font-weight:700;color:#acf910;letter-spacing:.04em">Week '+(RCP.week+1)+'</div><div style="font-size:11px;color:#8d9479;margin-top:2px">Projected</div>'+(lg?'<img src="'+lg+'" alt="" style="height:36px;width:auto;max-width:96px;object-fit:contain;display:block;margin-top:8px">':'')+(k==='bh'?'':'<div style="font-size:9.5px;color:#5d6350;line-height:1.2;margin-top:5px">'+stEsc(rcLg(k))+'</div>')+'</div>';
  var band='<div style="flex:none;margin-top:8px"><div style="display:flex;justify-content:space-between;align-items:baseline;font-size:10px;color:#8d9479"><span><b style="font-family:\'Bebas Neue\',sans-serif;font-size:21px;letter-spacing:.02em;color:#acf910">'+oA+'</b> &nbsp;'+I.wp+'% to win</span><span>'+(100-I.wp)+'% to win &nbsp;<b style="font-family:\'Bebas Neue\',sans-serif;font-size:21px;letter-spacing:.02em;color:#4cc3ff">'+oB+'</b></span></div>'
    +'<div style="display:flex;height:6px;border-radius:3px;overflow:hidden;margin-top:3px;background:#15180f"><div style="width:'+I.wp+'%;background:#acf910"></div><div style="width:'+(100-I.wp)+'%;background:#4cc3ff"></div></div></div>';
  var foot=(I.h2h?'<div style="font-size:9.5px;color:#8d9479;text-align:center;margin-bottom:6px">'+stEsc(I.h2h.replace(/^\ud83d\udd25 /,''))+(I.riv?' <span style="color:#ff9d2e;font-weight:700;letter-spacing:.08em"> · RIVALRY</span>':'')+'</div>':'')+'<div style="text-align:center;font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:.14em;color:#fff">CUADZFANTASYNETWORK.COM</div>';
  return '<div style="width:540px;height:675px;background:linear-gradient(180deg,#0f130a,#090a07 45%);color:#f2f4ea;font-family:Inter,\'Helvetica Neue\',Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box;padding:20px 18px 12px;display:flex;flex-direction:column">'
   +'<div style="display:flex;align-items:center;justify-content:space-between;height:30px;flex:none"><img src="'+CFN_LOGO+'" alt="CFN" style="height:38px;width:auto;display:block"><div style="font-family:\'Bebas Neue\',sans-serif;font-size:20px;letter-spacing:.12em;color:#acf910;line-height:1">WEEK '+(RCP.week+1)+' PREVIEW</div></div>'
   +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:12px;flex:none">'+tb(A,'#acf910',favA,false,oA)+mid+tb(B,'#4cc3ff',!favA,true,oB)+'</div>'
   +band
   +'<div style="display:flex;flex-direction:column;margin-top:8px;border-top:1px solid #22261a">'+rows+'</div>'
   +'<div style="margin-top:auto;padding-top:6px">'+foot+'</div></div>';
}
function pmPreview(d,i){ pmEnsureP(d.id); return pmPreviewHTML(d.id,i); }

/* ---------- Mr. October (month award v2: record, points, margin, all-play + 3 MVPs) ---------- */
function awCard2(k,a){
  var G=ST_GREEN, L=rcLg(k), M='MR. '+a.month.toUpperCase();
  var ord=function(n){return n+(n%10==1&&n!=11?'st':n%10==2&&n!=12?'nd':n%10==3&&n!=13?'rd':'th');};
  var tile=function(lbl,val,sub){return '<div style="flex:1;background:'+G+'0d;border:.5px solid '+G+'25;border-radius:7px;padding:5px 3px;text-align:center"><div style="font-size:7.5px;color:#ffffff55;letter-spacing:.12em">'+lbl+'</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:23px;color:#fff;line-height:1.1">'+val+'</div><div style="font-size:7.5px;color:#ffffff55">'+sub+'</div></div>';};
  var mv=a.players.map(function(p){ return '<div style="flex:1;text-align:center">'+stAv(p[0],p[1],72)+'<div style="font-size:11px;font-weight:700;color:#fff;margin-top:5px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+stEsc(p[0])+'</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:21px;color:'+G+';line-height:1.05">'+p[2].toFixed(1)+' <span style="font-size:10px;color:#ffffff70;font-family:system-ui">PTS</span></div><div style="font-size:8px;color:#ffffff50">'+p[1]+' · '+p[3]+' games</div></div>'; }).join('');
  var wk=a.wk.map(function(w){ var win=w[0]>w[2]; return '<div style="flex:1;min-width:0;border:.5px solid #ffffff18;border-radius:6px;padding:4px 5px;text-align:center;background:#ffffff06"><div style="font-size:7.5px;color:'+(win?G:'#ff7a66')+';letter-spacing:.14em">WEEK '+w[4]+' · '+(win?'W':'L')+'</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:19px;color:#fff;line-height:1.1">'+w[0].toFixed(2)+'</div><div style="font-size:7.5px;color:#ffffff60;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(win?'def. ':'lost to ')+stEsc(w[1])+' '+w[2].toFixed(2)+'</div><div style="font-size:7.5px;color:#ffffff40">'+ord(w[3])+' in league scoring</div></div>'; }).join('');
  var bd=a.board.map(function(b,i){return '<div style="display:flex;align-items:center;gap:8px;padding:3px 0;border-bottom:.5px solid #ffffff0d"><span style="font-family:\'Bebas Neue\',sans-serif;font-size:15px;width:16px;color:'+(i?'#ffffff60':G)+'">'+(i+1)+'</span><span style="flex:1;font-size:10.5px;color:'+(i?'#ffffffc0':'#fff')+';font-weight:'+(i?500:700)+'">'+stEsc(b[0])+' <span style="color:#ffffff55;font-weight:400">· '+stEsc(b[1])+'</span></span><span style="font-family:\'Bebas Neue\',sans-serif;font-size:15px;color:'+(i?'#fff':G)+'">'+b[2].toFixed(1)+'</span></div>';}).join('');
  var inner='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><img src="'+CFN_LOGO+'" alt="CFN" style="height:28px;width:auto"><div style="font-size:9px;color:#ffffff55;letter-spacing:.14em;text-transform:uppercase">'+stEsc(L)+' · '+a.weeks+'</div></div>'
   +'<div style="height:1px;background:'+G+'30;margin-bottom:8px"></div>'
   +'<div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:8px">'+(LG_LOGO[k]?'<img src="'+LG_LOGO[k]+'" alt="" style="height:56px;width:auto;max-width:90px;object-fit:contain">':'')
   +'<div style="text-align:center"><div style="font-size:15px;line-height:1">🏆</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:26px;color:'+G+';letter-spacing:.08em;line-height:1.05">'+M+'</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:36px;color:#fff;letter-spacing:.03em;line-height:1">'+stEsc(a.mgr.toUpperCase())+'</div><div style="font-size:10px;color:#ffffff90;margin-top:1px">'+stEsc(a.team)+'</div></div>'
   +'<div style="text-align:center;width:90px"><div style="font-size:7.5px;color:#ffffff55;letter-spacing:.14em">AWARD SCORE</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:40px;color:'+G+';line-height:1">'+a.score.toFixed(1)+'</div><div style="font-size:7.5px;color:#ffffff55">out of 100</div></div></div>'
   +'<div style="font-size:7.5px;color:'+G+';letter-spacing:.14em;margin-bottom:5px;text-align:center">MONTH MVPs</div><div style="display:flex;gap:6px;margin-bottom:9px">'+mv+'</div>'
   +'<div style="display:flex;gap:6px;margin-bottom:7px">'+tile('RECORD',a.rec,a.weeks)+tile('POINTS FOR',a.pf.replace(/0$/,''),ord(a.pfRank)+' in league')+tile('AVG MARGIN','+'+a.margin.toFixed(1),'per game')+tile('ALL-PLAY',a.ap,'vs whole league')+'</div>'
   +'<div style="display:flex;gap:5px;margin-bottom:7px">'+wk+'</div>'
   +'<div style="font-size:11px;line-height:1.45;color:#ffffffd0;margin-bottom:7px">'+stEsc(a.note||'')+'</div>'
   +'<div style="font-size:7.5px;color:'+G+';letter-spacing:.14em;margin-bottom:1px">TOP 3 THIS MONTH</div>'+bd
   +'<div style="font-size:6.5px;color:#ffffff40;letter-spacing:.04em;margin:4px 0 4px;line-height:1.35">Award score = record 30% · points scored 30% · average margin of victory 20% · all-play 20%, each scaled within the league. Winning record required. MVPs are the winner’s top three scorers while in his starting lineup.</div>'+stFooter(L);
  return stCardBase(inner,'14px 22px 10px');
}
var _awCard=awCard; awCard=function(k,a){ return a&&a.v===2?awCard2(k,a):_awCard(k,a); };
if(RCP.oct) Object.keys(RCP.oct).forEach(function(k){ if(AWARDS[k]&&!AWARDS[k].some(function(x){ return x.month==='October'; })) AWARDS[k].push(RCP.oct[k]); });
/* hook into Studio */
var _stSlideHTML=stSlideHTML;
stSlideHTML=function(d,i){ if(stState.style!=='classic'){ var m=d.matchups.length; if(i===0) return pmWeekly(d); if(i<=m) return pmSquare(d,i); if(i<=2*m) return pmPreview(d,i-m-1); } return _stSlideHTML(d,i); };
var _stRender=stRender;
stRender=function(){ _stRender(); var side=document.querySelector('#studio-root .st-side'); if(!side) return; var lbls=side.querySelectorAll('.st-lbl'); var slides=null; lbls.forEach(function(l){ if(l.textContent==='Slides') slides=l; }); if(!slides) return;
  var wrap=document.createElement('div'); var cl=stState.style==='classic';
  wrap.innerHTML='<div class="st-lbl">Recap style</div><button class="st-btn'+(cl?'':' on')+'" onclick="pmStyle(\'pm\')">Matchup card</button><button class="st-btn'+(cl?' on':'')+'" onclick="pmStyle(\'classic\')">Classic</button>';
  while(wrap.firstChild) side.insertBefore(wrap.firstChild,slides); };
function pmStyle(s){ stState.style=s; stState.imgs=[]; stRender(); }
var _stExport=stExport;
stExport=async function(){ try{ var k=stState.league, names=[]; RCP.lg[k].forEach(function(m){ m.L.forEach(function(L){ L.forEach(function(r){ names.push(r[1]); }); }); }); await rcLoadPhotos(names); }catch(e){} return _stExport(); };
