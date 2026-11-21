// CFN estimate v1: a shared, heuristic forecast, not Yahoo's published odds.
// Normal approximation; uncertainty scales with expected scoring still to come.
// Version the model so saved estimates can be audited without changing old scores.
'use strict';
const VERSION = 'cfn-remaining-points-v1';
const finite = Number.isFinite;
const round = x => Math.round(x * 100) / 100;
const bench = r => ['BN','IR','IR+','NA'].includes(r[0]);
function fraction(status) {
  const s = String(status || '').toLowerCase();
  if (/^half/.test(s)) return .5;
  if (/^ot/.test(s)) return .05;
  let m = /^end\s*(?:of\s*)?q?([1-4])/.exec(s);
  if (m) return (4 - Number(m[1])) / 4;
  m = /^q([1-4])\s+(\d{1,2}):(\d{2})/.exec(s);
  if (!m || Number(m[2]) > 15 || Number(m[3]) >= 60) return null;
  return ((4-Number(m[1]))*900 + Number(m[2])*60 + Number(m[3])) / 3600;
}
function defense(points, prior, rem, row) {
  const g=row[8], team=String(row[3]).toUpperCase();
  const match=/^(?:Q[1-4]|OT\d?|Half\w*|End\s*(?:of\s*)?Q?[1-4])\s*(?:\d+:\d\d)?\s*,?\s*(\d+)-(\d+)/i.exec(row[6]||'');
  const opp=g && team===g.homeTeam ? g.awayScore : g && team===g.awayTeam ? g.homeScore : match ? Number(match[2]) : null;
  if (!finite(opp)) return null;
  const elapsed=1-rem, base=Math.min(28,Math.max(15,22-1.5*(prior-7.5))), w=Math.min(.6,elapsed*.6);
  const rate=Math.min(38,Math.max(10,(1-w)*base+w*(elapsed>.04?opp/elapsed:base))), mean=rate*rem;
  const yards=Math.max(15*opp,200*elapsed), pt=p=>p<=0?8:p<7?5:p<14?3:p<21?1:p<28?0:p<35?-1:-3;
  const yt=y=>y<100?8:y<200?5:y<300?3:y<400?1:y<500?0:-2;
  const poisson=(n,l)=>{let v=Math.exp(-l);for(let i=1;i<=n;i++)v*=l/i;return v;};
  let ps=0,pw=0,ys=0,yw=0;
  for(let td=0;td<=6;td++)for(let fg=0;fg<=6;fg++){const v=poisson(td,.62*mean/7)*poisson(fg,.38*mean/3);ps+=v*pt(opp+7*td+3*fg);pw+=v;}
  for(let step=-6;step<=6;step++){const k=step/2,v=Math.exp(-.5*k*k);ys+=v*yt(yards+15.5*mean+k*(60*Math.sqrt(rem)+8));yw+=v;}
  return points+ps/pw-pt(opp)+ys/yw-yt(yards)+6*Math.sqrt(Math.max(.3,prior/8.5))*rem;
}
function side(rows, total, final) {
  if (!Array.isArray(rows)) return null;
  const starters=rows.filter(r=>!bench(r)); if (!starters.length) return null;
  let forecast=0, remaining=0, sum=0, unfinished=0;
  for(const r of starters){
    const status=String(r[8]?.period || r[6] || ''), bye=/^(bye|no game)/i.test(r[6]||'');
    if(bye)continue;
    const points=finite(r[5])?r[5]:0; sum+=points;
    if(final || /^final/i.test(status)){if(!finite(r[5]))return null;forecast+=points;continue;}
    if(['O','SUSP'].includes(r[7]) && fraction(status)===null){forecast+=points;continue;}
    if(!finite(r[4]))return null;
    const rem=fraction(status); let value=r[4];
    if(rem!==null){
      if(!finite(r[5]))return null;
      value=/^(DEF|DST|D\/ST)$/.test(r[2])?defense(points,r[4],rem,r):points+Math.max(0,r[4])*rem;
      if(!finite(value))return null;
    } else if(!/^(sun|mon|tue|wed|thu|fri|sat)\b|^\d{1,2}:\d{2}/i.test(status)) return null;
    forecast+=value; remaining+=Math.max(0,value-points); unfinished++;
  }
  const score=finite(total?.[0])?total[0]:sum;
  forecast+=score-sum; // retain official total corrections without altering player rows
  return {score:round(score),forecast:round(forecast),remaining,unfinished};
}
function erf(x){const s=x<0?-1:1; x=Math.abs(x);const t=1/(1+.3275911*x);return s*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x));}
function build(m, options={}) {
  if(options.partial || options.stale)return null;
  const a=side(m.L,m.ya,options.final), b=side(m.R,m.yb,options.final); if(!a||!b)return null;
  const final=a.unfinished+b.unfinished===0;
  let p;
  if(final)p=a.score===b.score?50:a.score>b.score?100:0;
  else {
    const sd=Math.max(2.5,2.2*Math.sqrt(a.remaining+b.remaining));
    p=Math.max(1,Math.min(99,100*.5*(1+erf((a.forecast-b.forecast)/(Math.SQRT2*sd)))));
  }
  // Whole percentages sum to 100; both clients display these exact values.
  p=Math.round(p);
  return {source:'cfn',modelVersion:VERSION,homeTeamId:m.ia,awayTeamId:m.ib,homePercent:p,awayPercent:100-p,
    homeProjected:a.forecast,awayProjected:b.forecast,status:final?(a.score===b.score?'tie':'final'):'estimate',
    updatedAt:options.updatedAt || null};
}
module.exports={VERSION,build,side,fraction};
