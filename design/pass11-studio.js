/* ---- Studio pass 11: recap slides (bigger Man of the Match with its matchup, fewer awards, small footer, share-style matchup recap) ---- */
function pmFoot(){ return '<div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:6px;flex:none"><img src="'+CFN_LOGO+'" alt="CFN" style="height:20px;width:auto;display:block"><div style="font-size:8.5px;font-weight:600;letter-spacing:.16em;color:#00DFCE;opacity:.85">CUADZFANTASYNETWORK.COM</div></div>'; }
pmFrame=function(d,kick,inner){
  var lg=LG_LOGO[d.id];
  return '<div style="width:540px;height:675px;background:linear-gradient(180deg,#16181e,#121419 42%);color:#edeef1;font-family:Inter,\'Helvetica Neue\',Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box;padding:16px 20px 12px;display:flex;flex-direction:column"><div style="position:absolute;left:0;top:0;width:540px;height:230px;background:radial-gradient(circle at 50% 0%,#1d2229 0%,rgba(11,12,10,0) 70%)"></div>'
   +'<div style="position:relative;display:flex;align-items:center;justify-content:space-between;height:40px;flex:none"><div style="display:flex;align-items:center;gap:9px;height:40px">'+(lg?'<img src="'+lg+'" alt="" style="height:36px;width:auto;max-width:90px;object-fit:contain;display:block">':'')+'<div style="font-size:12px;font-weight:600;color:#dfe2e8;letter-spacing:.04em">'+stEsc(rcLg(d.id))+'</div></div>'
   +'<div style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;letter-spacing:.1em;color:#00DFCE;line-height:1">'+kick+'</div></div>'
   +inner+pmFoot()+'</div>';
};
pmWeekly=function(d){
  var r=stReport(d), mo=stMotm(d), lg=d.id, mg=function(t){ return bigMg(lg,t); };
  function pimg(name){ return bigPhoto(name,36); }
  function two(a,b){ return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">'+bigTeamImg(lg,a,22)+bigTeamImg(lg,b,22)+'</div>'; }
  function side(t,o,right,mine){
    var win=t.score>o.score, nm=bigMg(lg,t.name);
    var col='<div style="min-width:0;text-align:'+(right?'right':'left')+'"><div style="font-size:9.5px;font-weight:700;letter-spacing:.06em;color:'+(win?'#fff':'#9aa1af')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+stEsc(nm.toUpperCase())+'</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:17px;line-height:1;color:'+(win?'#fff':'#9aa1af')+'">'+stF(t.score)+'</div></div>';
    var img=bigTeamImg(lg,t.name,26);
    return '<div style="flex:1;min-width:0;display:flex;align-items:center;gap:6px;justify-content:'+(right?'flex-end':'flex-start')+';padding:3px 6px;border-radius:9px;'+(mine?'background:rgba(0,223,206,.13);box-shadow:inset 0 0 0 1px rgba(0,223,206,.55)':'')+'">'+(right?col+img:img+col)+'</div>';
  }
  var motm=mo.map(function(x){
    var m=null; d.matchups.forEach(function(q){ if(q.teamA.name===x.a&&q.teamB.name===x.b) m=q; }); if(!m) m=d.matchups[0];
    var col=BIG_POS[x.p.position]||'#00DFCE';
    return '<div style="width:246px;height:98px;box-sizing:border-box;background:#1f232a;border:1px solid #31363f;border-radius:14px;padding:7px 8px 6px;display:flex;flex-direction:column;margin:0 3px 5px">'
     +'<div style="display:flex;align-items:center;gap:9px">'+bigPhoto(x.p.name,44)
     +'<div style="flex:1;min-width:0"><div style="font-size:14.5px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+stEsc(rcShort(x.p.name))+'</div><div style="font-size:8px;color:#00DFCE;letter-spacing:.14em;margin-top:2px;white-space:nowrap">'+stEsc(x.p.position==='SFLX'||x.p.position==='SFX'?'FLEX':x.p.position)+' · TOP SCORER</div></div>'
     +'<div style="font-family:\'Bebas Neue\',sans-serif;font-size:34px;color:#00DFCE;line-height:1;flex:none">'+Number(x.p.points).toFixed(1)+'</div></div>'
     +'<div style="display:flex;align-items:center;gap:4px;margin-top:auto;border-top:1px solid #31363f;padding-top:5px">'+side(m.teamA,m.teamB,false,x.team===m.teamA.name)+'<div style="font-size:8px;color:#808797;font-weight:700;letter-spacing:.1em;flex:none">VS</div>'+side(m.teamB,m.teamA,true,x.team===m.teamB.name)+'</div></div>'; }).join('');
  function tile(label,img,head,sub,val,tone,two2){
    var col=tone==='bad'?'#ff7a66':'#00DFCE', bg=tone==='bad'?'#1a110f':(tone==='hi'?'#1f232a':'#191b22'), bd=tone==='bad'?'#4a2620':(tone==='hi'?'#31363f':'#262a34');
    return '<div style="width:246px;height:58px;box-sizing:border-box;background:'+bg+';border:1px solid '+bd+';border-left:3px solid '+(tone==='n'?'#2e3440':col)+';border-radius:14px;padding:0 12px 0 9px;display:flex;align-items:center;gap:9px;margin:0 3px 5px"><div style="width:38px;display:flex;align-items:center;justify-content:center;flex:none">'+img+'</div>'
    +'<div style="flex:1;min-width:0"><div style="font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:'+(tone==='n'?'#b0b6c2':col)+';font-weight:700;white-space:nowrap">'+label+'</div>'
    +(two2?'<div style="font-size:11px;font-weight:700;color:#fff;line-height:1.2;margin-top:2px;overflow:hidden;max-height:27px">'+stEsc(two2[0])+'<br><span style="color:#dfe2e8;font-weight:500">def. </span>'+stEsc(two2[1])+'</div>'
      :'<div style="font-size:12.5px;font-weight:700;color:#fff;line-height:1.15;max-height:29px;overflow:hidden;margin-top:2px">'+stEsc(head)+'</div><div style="font-size:9px;color:#dfe2e8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">'+sub+'</div>')+'</div>'
    +'<div style="font-family:\'Bebas Neue\',sans-serif;font-size:27px;color:'+col+';line-height:1;flex:none">'+val+'</div></div>'; }
  var tiles=[
    tile('MVP of the week',pimg(r.mvp[1]),rcShort(r.mvp[1]),stEsc(mg(r.mvp[3]))+' · '+r.mvp[0],Number(r.mvp[2]).toFixed(1),'hi'),
    tile('Dud of the week',pimg(r.dud[1]),rcShort(r.dud[1]),stEsc(mg(r.dud[3]))+' · '+r.dud[0],Number(r.dud[2]).toFixed(1),'bad'),
    tile('Lineup of the week',bigTeamImg(lg,r.lineup.name,38),r.lineup.name,stEsc(mg(r.lineup.name)),r.lineup.score.toFixed(1),'hi'),
    tile('Closest game',two(r.closest.winner.name,r.closest.loser.name),'','',stF(r.closest.margin),'n',[r.closest.winner.name,r.closest.loser.name]),
    tile('Lucky winner',bigTeamImg(lg,r.lucky.name,38),r.lucky.name,stEsc(mg(r.lucky.name))+' · low score',r.lucky.score.toFixed(1),'n'),
    tile('Unlucky loser',bigTeamImg(lg,r.unl.name,38),r.unl.name,stEsc(mg(r.unl.name))+' · high score',r.unl.score.toFixed(1),'bad')].join('');
  function sec(t){ return '<div style="font-size:12px;font-weight:800;letter-spacing:.16em;color:#00DFCE;text-transform:uppercase;margin:6px 3px 6px;display:flex;align-items:center;gap:8px"><span>'+t+'</span><span style="flex:1;height:1px;background:#31363f"></span></div>'; }
  var inner='<div style="position:relative;display:flex;flex-direction:column;flex:1">'
   +sec('Man of the match')+'<div style="display:flex;flex-wrap:wrap;justify-content:center;margin:0 -3px">'+motm+'</div>'
   +sec('Weekly awards')+'<div style="display:flex;flex-wrap:wrap;justify-content:center;margin:0 -3px">'+tiles+'</div></div>';
  return pmFrame(d,'WEEK '+d.week+' RECAP',inner);
};
pmSquare=function(d,i){
  var k=d.id; pmEnsure(k);
  var id=ST_BIG.cards[k].w4[i-1].a.id, idx=0; RCP.lg[k].forEach(function(m,j){ if(m.t[0]===id||m.t[1]===id) idx=j; });
  var I=rcInfo(k,idx), A=I.A, B=I.B, wA=A.s>=B.s, n=Math.max(1,A.rows.length), lg=LG_LOGO[k];
  var RH=Math.max(38,Math.min(62,Math.floor(440/n))), RS=Math.min(50,RH-8);
  function tb(S,win,right){
    var hd='<div style="display:flex;flex-direction:column;align-items:center;gap:3px;width:70px;flex:none">'+pmHead(k,S.mgr,S.id,66,'#00DFCE')+'<div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#dfe2e8;white-space:nowrap">'+stEsc(S.mgr.toUpperCase())+'</div></div>';
    var inf='<div style="flex:1;min-width:0;text-align:'+(right?'right':'left')+'"><div style="font-size:'+pmNameFs(S.team)+'px;font-weight:700;line-height:16px;height:16px;white-space:nowrap;overflow:hidden">'+stEsc(S.team)+'</div><div style="font-size:10.5px;color:#9aa1af;margin-top:2px">'+stEsc(S.rec||'')+'</div>'
     +'<div style="font-family:\'Bebas Neue\',sans-serif;font-size:46px;line-height:.95;margin-top:3px;color:'+(win?'#fff':'#9aa1af')+'">'+rcF(S.s)+'</div></div>';
    return '<div style="display:flex;gap:7px;width:206px;align-items:flex-start">'+(right?inf+hd:hd+inf)+'</div>'; }
  var rows=A.rows.map(function(a,q){ var b=B.rows[q], wa=a[2]>b[2], wb=b[2]>a[2];
    function nm(r,win,right){ return '<div style="flex:1;min-width:0;text-align:'+(right?'left':'right')+';font-size:13.5px;font-weight:'+(win?'600':'500')+';color:'+(win?'#fff':'#9aa1af')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+stEsc(rcShort(r[1]))+cfnSh(r[1])+'</div>'; }
    function pt(r,win){ return '<div style="width:46px;flex:none;text-align:center;font-family:\'Bebas Neue\',sans-serif;font-size:22px;line-height:1;color:'+(win?'#fff':'#9aa1af')+'">'+rcF(r[2])+'</div>'; }
    return '<div style="display:flex;align-items:center;gap:6px;height:'+RH+'px;border-bottom:1px solid #1b1e25">'+pmImg(a[1],RS)+nm(a,wa,false)+pt(a,wa)+pmPill(a[0])+pt(b,wb)+nm(b,wb,true)+pmImg(b[1],RS)+'</div>'; }).join('');
  var mid='<div style="flex:1;text-align:center;padding-top:6px"><div style="font-size:15px;font-weight:700;color:#00DFCE;letter-spacing:.04em">Final</div><div style="font-size:10.5px;color:#9aa1af;margin-top:4px">'+rcLabel(Math.abs(A.s-B.s))+'</div></div>';
  return '<div style="width:540px;height:675px;background:linear-gradient(180deg,#171a20,#121419 45%);color:#edeef1;font-family:Inter,\'Helvetica Neue\',Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box;padding:16px 18px 12px;display:flex;flex-direction:column">'
   +'<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;height:44px;flex:none"><img src="'+CFN_LOGO+'" alt="CFN" style="height:40px;width:auto;display:block;justify-self:start"><div style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;letter-spacing:.12em;color:#ff9f1c;line-height:1">WEEK '+RCP.week+'</div>'+(lg?'<img src="'+lg+'" alt="" style="height:42px;width:auto;max-width:96px;object-fit:contain;display:block;justify-self:end">':'<span></span>')+'</div>'
   +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:10px;padding-bottom:12px;border-bottom:1px solid #262a34;flex:none">'+tb(A,wA,false)+mid+tb(B,!wA,true)+'</div>'
   +'<div style="display:flex;flex-direction:column;margin-top:2px">'+rows+'</div>'+pmFoot()+'</div>';
};
