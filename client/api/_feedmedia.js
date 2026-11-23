'use strict';
// Presentation metadata only; preserve the existing string assets for older apps.
const photos=require('../public/redesign/player-photo-ids.json'), players=require('./_resources.json').tools.players;
const norm=s=>String(s||'').toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g,'').replace(/[^a-z0-9]/g,'');
const teams={cardinals:'ARI',falcons:'ATL',ravens:'BAL',bills:'BUF',panthers:'CAR',bears:'CHI',bengals:'CIN',browns:'CLE',cowboys:'DAL',broncos:'DEN',lions:'DET',packers:'GB',texans:'HOU',colts:'IND',jaguars:'JAX',chiefs:'KC',raiders:'LV',chargers:'LAC',rams:'LAR',dolphins:'MIA',vikings:'MIN',patriots:'NE',saints:'NO',giants:'NYG',jets:'NYJ',eagles:'PHI',steelers:'PIT','49ers':'SF',seahawks:'SEA',buccaneers:'TB',titans:'TEN',commanders:'WAS'};
function asset(name,position='',team=''){
 if(/\b(?:pick|FAB)\b/i.test(name))return {name,kind:/FAB/i.test(name)?'budget':'pick'};
 const key=norm(name),p=Object.values(players).find(p=>norm(p.n)===key),def=teams[key]||Object.keys(teams).find(t=>key.endsWith(t));
 position=position||p?.p|| (def?'DEF':'');team=team||p?.t||teams[def]||teams[key]||'';
 let photoURL=null;
 if(['DEF','DST','D/ST'].includes(position))photoURL=team?'https://a.espncdn.com/i/teamlogos/nfl/500/'+({WAS:'wsh',WSH:'wsh',JAC:'jax'}[team]||team.toLowerCase())+'.png':null;
 else {const candidates=Object.entries(photos).filter(([k])=>k.split('|')[0]===key&&(!position||k.endsWith('|'+position)));if(candidates.length===1){photoURL=candidates[0][1];position=position||candidates[0][0].split('|')[1];}}
 return {name,kind:'player',position,team,photoURL};
}
module.exports={asset};
