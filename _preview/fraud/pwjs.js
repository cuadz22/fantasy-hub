function pwEsc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); }
function pwWeight(G){ return Math.min(0.35, 0.15 + 0.02*Math.max(0,G-1)); }
function pwCalc(F){
  var T=F.teams, G=F.week, wR=pwWeight(G);
  var S=T.map(function(t){return t.strength;}), m=S.reduce(function(a,b){return a+b;},0)/S.length;
  var sd=Math.sqrt(S.reduce(function(a,b){return a+(b-m)*(b-m);},0)/S.length)||1;
  var P=T.map(function(t){ return (t.w+3)/(t.w+t.l+6); }), pm=P.reduce(function(a,b){return a+b;},0)/P.length;
  var ps=Math.sqrt(P.reduce(function(a,b){return a+(b-pm)*(b-pm);},0)/P.length)||1;
  var recOrd=T.slice().sort(function(a,b){ return (b.w-a.w)||(b.ppg-a.ppg); }), recRk={};
  recOrd.forEach(function(t,i){ recRk[t.tid]=i+1; });
  var rows=T.map(function(t,i){
    var z=(1-wR)*((t.strength-m)/sd)+wR*((P[i]-pm)/ps);
    return {t:t,z:z,score:Math.max(1,Math.min(99,Math.round(50+20*z))),rec:recRk[t.tid]};
  }).sort(function(a,b){ return b.z-a.z; });
  rows.forEach(function(r,i){ r.rank=i+1; r.move=r.rec-r.rank;
    var s=r.score; r.tier=s>=68?'Title favorite':s>=56?'Contender':s>=47?'Playoff bubble':s>=38?'Pretender':'Rebuilding'; });
  return {rows:rows,wR:wR};
}
function lgPower(p,k){
  var F=FM[k]; if(!F){ p.innerHTML='<div style="color:var(--muted);font-size:12px">Power rankings appear after the first few weeks.</div>'; return; }
  var C=pwCalc(F);
  var h='<div class="subsec"><div class="subsec-hd">Power Rankings · through Week '+F.week+'</div>'+
   '<div style="font-size:12px;color:var(--muted);line-height:1.5;margin:0 0 12px">Ranked by true team strength, with your actual head-to-head record counting for '+Math.round(C.wR*100)+'% (it grows as the season goes on). Arrows show how far a team’s power rank is from its standings spot.</div>';
  C.rows.forEach(function(r){
    var t=r.t, up=r.move>0, dn=r.move<0;
    var mv=up?'<span style="color:#1fa85a;font-weight:700">▲ '+r.move+' vs record</span>':dn?'<span style="color:#e04545;font-weight:700">▼ '+(-r.move)+' vs record</span>':'<span>in line with record</span>';
    var luck=t.luck>=1?'Lucky '+t.luck.toFixed(1)+' W':t.luck<=-1?'Unlucky '+Math.abs(t.luck).toFixed(1)+' W':'';
    var top=r.rank<=3;
    h+='<div style="display:grid;grid-template-columns:30px 1fr 74px;gap:10px;align-items:center;background:var(--surface);border:1px solid '+(top?'var(--accent)':'var(--border)')+';border-radius:12px;padding:10px 12px;margin-bottom:8px">'+
      '<div style="font-size:20px;font-weight:800;text-align:center">'+r.rank+'</div>'+
      '<div style="min-width:0"><div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+pwEsc(t.name)+'</div>'+
      '<div style="font-size:11px;color:var(--muted);margin-top:2px">'+t.w+'-'+t.l+' · '+t.ppg+' PPG · '+mv+'</div>'+
      '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:5px;font-size:10px">'+
        '<span style="padding:1px 7px;border-radius:999px;'+(r.rank<=2?'background:var(--accent);color:#0e0f0a;font-weight:700':'background:var(--bg3);color:var(--muted)')+'">'+r.tier+'</span>'+
        '<span style="padding:1px 7px;border-radius:999px;background:var(--bg3);color:var(--muted)">All-play '+Math.round(t.apw*100)+'%</span>'+
        (luck?'<span style="padding:1px 7px;border-radius:999px;background:var(--bg3);color:var(--muted)">'+luck+'</span>':'')+
        '<span style="padding:1px 7px;border-radius:999px;background:var(--bg3);color:var(--muted)">PO '+Math.round(t.po*100)+'% · 🏆 '+(t.title*100).toFixed(1).replace(/\.0$/,'')+'%</span></div></div>'+
      '<div><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:3px"><span>Power</span><b style="color:var(--text);font-size:14px">'+r.score+'</b></div><div style="height:7px;border-radius:5px;background:var(--bg3);overflow:hidden"><i style="display:block;height:100%;width:'+r.score+'%;background:var(--accent)"></i></div></div></div>';
  });
  h+='<details style="margin-top:10px"><summary style="cursor:pointer;color:var(--muted);font-size:12px">How the Power Score works</summary><div style="font-size:12px;color:var(--muted);line-height:1.5;margin:10px 0">Power Score blends the Fraud Meter’s strength rating (points on the board, all-play win %, weekly finish tiers, and roster strength going forward) with actual record. Record counts 15% in Week 1 and grows about 2 points a week up to 35%, because a record says little early and more later. Records are smoothed so a 1-0 start does not look like a dynasty. 50 is a league-average team. Playoff and title odds come from 6,000 simulations of the rest of the season.</div></details></div>';
  p.innerHTML=h;
}
