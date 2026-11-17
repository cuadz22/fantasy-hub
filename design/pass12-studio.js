/* ---- Studio pass 12: cover, circular team logos, quieter Man of the Match, projections on matchup recap ---- */
bigTeamImg=function(lg,team,sz){
  var m=bigMg(lg,team), tid=(ST_BIG.tid[lg]||{})[team];
  if(lg==='gl'&&ST_BIG.heads[m]) return '<img src="'+ST_BIG.heads[m]+'" style="width:'+sz+'px;height:'+sz+'px;object-fit:contain;display:block;flex:none">';
  var u=(ST_BIG.logos[lg]||{})[tid], d=u&&BIG_LOGO_DATA[u];
  if(d) return '<img src="'+d+'" style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;object-fit:cover;display:block;flex:none">';
  var ini=m.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase();
  return '<div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;border:2px solid #00DFCE;background:#282c37;color:#00DFCE;font-family:\'Bebas Neue\',sans-serif;font-size:'+Math.round(sz*.45)+'px;display:flex;align-items:center;justify-content:center;flex:none;box-sizing:border-box">'+stEsc(ini)+'</div>';
};
pmHead=function(k,mgr,id,sz,col){
  var H=k==='gl'?(ST_BIG.heads||{})[mgr]:null, u=((ST_BIG.logos||{})[k]||{})[String(id)], d=u&&BIG_LOGO_DATA[u];
  if(H) return '<img src="'+H+'" style="width:'+sz+'px;height:'+sz+'px;object-fit:contain;display:block;flex:none">';
  if(d) return '<img src="'+d+'" style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;object-fit:cover;display:block;flex:none">';
  return '<div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;border:2px solid '+col+';background:#282c37;box-sizing:border-box;color:'+col+';font-weight:700;font-size:'+Math.round(sz*.34)+'px;display:flex;align-items:center;justify-content:center;flex:none">'+stEsc(rcIni(mgr))+'</div>';
};
window.cfnCoverHTML=function(d){
  var k=d.id, lg=LG_LOGO[k]||'', name=(d.name||'').toUpperCase(), BBF='font-family:\'Bebas Neue\',Impact,sans-serif';
  var logo='', SZ={gl:[232,300],bh:[462,260],rb:[204,260],sts:[223,260]};
  if(lg&&SZ[k]){ var w0=SZ[k][0], h0=SZ[k][1], sc=Math.min(280/w0,215/h0)*0.72, lw=Math.round(w0*sc), lh=Math.round(h0*sc);
    var im='<img src="'+lg+'" alt="" width="'+lw+'" height="'+lh+'" style="width:'+lw+'px;height:'+lh+'px;max-width:none;display:block;flex:none">';
    logo=(k==='rb')?'<div style="width:'+lw+'px;height:'+Math.round(lh*224/260)+'px;overflow:hidden;flex:none">'+im+'</div>':im; }
  return '<div style="width:540px;height:675px;background:#14161b;border-top:5px solid #00DFCE;border-bottom:5px solid #00DFCE;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;font-family:Inter,system-ui,sans-serif;position:relative;overflow:hidden">'
   +'<div style="margin-top:36px;font-size:13px;font-weight:800;letter-spacing:4px;color:#dfe2e8;text-align:center">'+stEsc(name)+'</div>'
   +'<div style="margin-top:20px;height:170px;display:flex;align-items:center;justify-content:center">'+logo+'</div>'
   +'<div style="'+BBF+';font-size:136px;line-height:.9;color:#fff;letter-spacing:2px;margin-top:22px;white-space:nowrap">WEEK '+d.week+'</div>'
   +'<div style="'+BBF+';font-size:80px;line-height:1;color:#00DFCE;letter-spacing:3px;margin-top:4px">RECAP</div>'
   +'<div style="width:60px;height:2px;background:#2a2f38;margin-top:20px"></div>'
   +'<div style="margin-top:20px;font-size:12px;font-weight:700;letter-spacing:3px;color:#c5c7cd">SWIPE FOR THE FULL BREAKDOWN</div>'
   +'<img src="'+CFN_LOGO+'" alt="CFN" style="position:absolute;bottom:44px;left:50%;margin-left:-24px;width:48px;height:auto">'
   +'<div style="position:absolute;bottom:20px;left:0;right:0;text-align:center;font-size:9px;font-weight:700;letter-spacing:2.5px;color:#dfe2e8">CUADZFANTASYNETWORK.COM</div></div>';
};
(function(){
  var _w=pmWeekly;
  pmWeekly=function(d){
    var h=_w(d), lg=d.id, mo=stMotm(d);
    /* rebuild only the Man of the Match block: quieter cards, matchup as one small line, owner beside the position */
    function line(t,o,right){ var nm=bigMg(lg,t.name); var sp='<span style="font-size:9.5px;font-weight:600;color:#c9cdd6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">'+stEsc(nm)+'</span><span style="font-family:\'Bebas Neue\',sans-serif;font-size:14px;line-height:1;color:#fff;flex:none">'+stF(t.score)+'</span>';
      return '<div style="flex:1;min-width:0;display:flex;align-items:center;gap:3px;justify-content:'+(right?'flex-end':'flex-start')+'">'+(right?sp+bigTeamImg(lg,t.name,15):bigTeamImg(lg,t.name,15)+sp)+'</div>'; }
    var cards=mo.map(function(x){
      var m=null; d.matchups.forEach(function(q){ if(q.teamA.name===x.a&&q.teamB.name===x.b) m=q; }); if(!m) m=d.matchups[0];
      var pos=x.p.position==='SFLX'||x.p.position==='SFX'?'FLEX':x.p.position;
      return '<div style="width:246px;height:84px;box-sizing:border-box;background:#1f232a;border:1px solid #31363f;border-radius:14px;padding:7px 10px 6px;display:flex;flex-direction:column;margin:0 3px 6px">'
       +'<div style="display:flex;align-items:center;gap:9px">'+bigPhoto(x.p.name,40)
       +'<div style="flex:1;min-width:0"><div style="font-size:14.5px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+stEsc(rcShort(x.p.name))+'</div><div style="font-size:8.5px;color:#00DFCE;letter-spacing:.1em;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+stEsc(pos)+' – '+stEsc(bigMg(lg,x.team).toUpperCase())+'</div></div>'
       +'<div style="font-family:\'Bebas Neue\',sans-serif;font-size:32px;color:#00DFCE;line-height:1;flex:none">'+Number(x.p.points).toFixed(1)+'</div></div>'
       +'<div style="display:flex;align-items:center;gap:6px;margin-top:auto;border-top:1px solid #2a2f38;padding-top:4px">'+line(m.teamA,m.teamB,false)+'<span style="font-size:7.5px;color:#808797;font-weight:700;letter-spacing:.1em;flex:none">VS</span>'+line(m.teamB,m.teamA,true)+'</div></div>'; }).join('');
    var a=h.indexOf('MAN OF THE MATCH'); if(a<0) a=h.toLowerCase().indexOf('man of the match');
    var s1=h.indexOf('<div style="display:flex;flex-wrap:wrap;justify-content:center;margin:0 -3px">',a), s2=h.indexOf('Weekly awards'); if(s2<0) s2=h.toLowerCase().indexOf('weekly awards');
    var e1=h.lastIndexOf('<div style="font-size:12px;font-weight:800',s2);
    if(s1<0||e1<s1) return h;
    return h.slice(0,s1)+'<div style="display:flex;flex-wrap:wrap;justify-content:center;margin:0 -3px">'+cards+'</div>'+h.slice(e1);
  };
})();
pmSquare=function(d,i){
  var k=d.id; pmEnsure(k);
  var id=ST_BIG.cards[k].w4[i-1].a.id, idx=0; RCP.lg[k].forEach(function(m,j){ if(m.t[0]===id||m.t[1]===id) idx=j; });
  var I=rcInfo(k,idx), A=I.A, B=I.B, wA=A.s>=B.s, n=Math.max(1,A.rows.length), lg=LG_LOGO[k];
  var RH=Math.max(38,Math.min(62,Math.floor(420/n))), RS=Math.min(50,RH-8);
  function tb(S,win,right){
    var hd='<div style="display:flex;flex-direction:column;align-items:center;gap:3px;width:70px;flex:none">'+pmHead(k,S.mgr,S.id,66,'#00DFCE')+'<div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#dfe2e8;white-space:nowrap">'+stEsc(S.mgr.toUpperCase())+'</div></div>';
    var inf='<div style="flex:1;min-width:0;text-align:'+(right?'right':'left')+'"><div style="font-size:'+pmNameFs(S.team)+'px;font-weight:700;line-height:16px;height:16px;white-space:nowrap;overflow:hidden">'+stEsc(S.team)+'</div><div style="font-size:10.5px;color:#9aa1af;margin-top:2px">'+stEsc(S.rec||'')+'</div>'
     +'<div style="font-family:\'Bebas Neue\',sans-serif;font-size:46px;line-height:.95;margin-top:3px;color:'+(win?'#fff':'#9aa1af')+'">'+rcF(S.s)+'</div></div>';
    return '<div style="display:flex;gap:7px;width:206px;align-items:flex-start">'+(right?inf+hd:hd+inf)+'</div>'; }
  var rows=A.rows.map(function(a,q){ var b=B.rows[q], wa=a[2]>b[2], wb=b[2]>a[2];
    function nm(r,win,right){ return '<div style="flex:1;min-width:0;text-align:'+(right?'left':'right')+';font-size:13.5px;font-weight:'+(win?'600':'500')+';color:'+(win?'#fff':'#9aa1af')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+stEsc(rcShort(r[1]))+cfnSh(r[1])+'</div>'; }
    function pt(r,win){ var pj=r[3], pc=(pj==null)?'':'<div style="font-size:9.5px;font-weight:600;line-height:1;margin-top:2px;color:'+(r[2]>=pj?'#2fd3a4':'#ff5a52')+'">'+Number(pj).toFixed(1)+'</div>'; return '<div style="width:46px;flex:none;text-align:center"><div style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;line-height:1;color:'+(win?'#fff':'#9aa1af')+'">'+rcF(r[2])+'</div>'+pc+'</div>'; }
    return '<div style="display:flex;align-items:center;gap:6px;height:'+RH+'px;border-bottom:1px solid #1b1e25">'+pmImg(a[1],RS)+nm(a,wa,false)+pt(a,wa)+pmPill(a[0])+pt(b,wb)+nm(b,wb,true)+pmImg(b[1],RS)+'</div>'; }).join('');
  var mid='<div style="flex:1;text-align:center;padding-top:6px"><div style="font-size:15px;font-weight:700;color:#00DFCE;letter-spacing:.04em">Final</div><div style="font-size:10.5px;color:#9aa1af;margin-top:4px">'+rcLabel(Math.abs(A.s-B.s))+'</div></div>';
  return '<div style="width:540px;height:675px;background:linear-gradient(180deg,#171a20,#121419 45%);color:#edeef1;font-family:Inter,\'Helvetica Neue\',Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box;padding:16px 18px 12px;display:flex;flex-direction:column">'
   +'<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;height:44px;flex:none"><img src="'+CFN_LOGO+'" alt="CFN" style="height:40px;width:auto;display:block;justify-self:start"><div style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;letter-spacing:.12em;color:#ff9f1c;line-height:1">WEEK '+RCP.week+'</div>'+(lg?'<img src="'+lg+'" alt="" style="height:42px;width:auto;max-width:96px;object-fit:contain;display:block;justify-self:end">':'<span></span>')+'</div>'
   +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:24px;padding-bottom:12px;border-bottom:1px solid #262a34;flex:none">'+tb(A,wA,false)+mid+tb(B,!wA,true)+'</div>'
   +'<div style="display:flex;flex-direction:column;margin-top:2px">'+rows+'</div>'+'<div style="margin-top:auto;text-align:center;padding-top:6px;flex:none;font-size:9px;font-weight:600;letter-spacing:.18em;color:#00DFCE;opacity:.9">CUADZFANTASYNETWORK.COM</div></div>';
};
