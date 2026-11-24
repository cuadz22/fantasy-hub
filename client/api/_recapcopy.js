'use strict';
// Editorial context is built only from the validated edition. It never reads or
// changes the current week, scores, standings, or projections.
const pts=n=>n.toFixed(2);
function compose(doc,{topSix=false}={}){
 const wins=doc.matches.filter(m=>!m.tied),best=[...wins].sort((a,b)=>b.teams[0].points-a.teams[0].points)[0];
 const closest=[...wins].sort((a,b)=>a.margin-b.margin)[0],lead=doc.standings[0];
 const intro=[best?`${best.teams[0].owner} set the scoring pace with ${pts(best.teams[0].points)}, led by ${best.leaders.map(p=>p.name).join(' and ')}.`:`Week ${doc.week} ended with all six matchups level.`,closest?`The closest result separated ${closest.teams[0].owner} and ${closest.teams[1].owner} by ${pts(closest.margin)}.`:'',doc.leagueId==='sts'?`${lead.name} leads the league-points table; head-to-head records and top-six scoring both contribute to that order.`:`${lead.name} ends Week ${doc.week} at the top of the table with a ${lead.record} record.`];
 if(topSix&&doc.week<14){const sixth=doc.standings[5],seventh=doc.standings[6];intro.push(`With ${14-doc.week} regular-season weeks left and six playoff places, ${sixth.name} is sixth at ${sixth.record} and ${seventh.name} seventh at ${seventh.record}. Those are current positions, not clinched berths.`);}
 const matches=doc.matches.map(m=>{
  if(m.tied)return m;
  const [w,l]=m.teams,parts=[];
  const support=w.topPlayers.filter(p=>!m.leaders.some(x=>x.id===p.id)).slice(0,2);
  parts.push(`${m.leaders.map(p=>p.name).join(' and ')} ${m.leaders.length===1?'led':'shared the lead for'} the winning lineup with ${pts(m.leaders[0].points)} points${m.leaders.length>1?' each':''}.`);
  if(support.length)parts.push(`${support.map(p=>`${p.name} added ${pts(p.points)}`).join('; ')}.`);
  parts.push(`${w.name} won by ${pts(m.margin)} and finishes ${w.rank}${suffix(w.rank)} at ${w.record}. ${l.name} is ${l.rank}${suffix(l.rank)} at ${l.record}.`);
  const awards=doc.awards.filter(a=>a.matchupIds.includes(m.id));
  if(awards.some(a=>a.id==='hardluck')){const others=wins.filter(x=>x.id!==m.id&&x.teams[0].points<l.points).length;parts.push(`${l.name} had the highest losing total this week${others?`, enough to beat ${others} of the other winning teams`:''}.`);}
  if(topSix&&doc.week<14&&[w,l].some(t=>t.rank===6||t.rank===7))parts.push(`Sixth is the final qualifying position. The table is still open to change over the ${14-doc.week} remaining regular-season weeks.`);
  if(doc.leagueId==='sts')parts.push('League-points placement also reflects the top-six scoring system; record alone does not determine the order.');
  return {...m,body:parts.join(' ')};
 });
 return {intro:intro.filter(Boolean).join(' '),matches};
}
function suffix(n){return n%100>=11&&n%100<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th');}
module.exports={compose};
