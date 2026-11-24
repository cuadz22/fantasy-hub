'use strict';
// Current-player metadata uses the same committed week as matchups and standings.
const M = require('./_m');
function metadata(card, providerWeek, context, team) {
  if (!context || context.season !== M.SEASON) return {week:providerWeek, card, stale:true};
  const week=context.week, out={...card};
  if(providerWeek!==week) for(const key of ['rank','rs','fpMin','fpMax','fpN','sr','pts'])out[key]=null;
  const code=M.canon(team),board=context.board;
  const game=board?.week===week?board.games.find(g=>g.homeTeam===code||g.awayTeam===code):null;
  if(game){
    const home=game.homeTeam===code, opponent=home?game.awayTeam:game.homeTeam;
    // A previous week's opponent/ranking must not masquerade as this week's.
    const same=providerWeek===week && M.canon(out.mu?.opponent)===opponent;
    out.mu={...(same?out.mu:{}),week,opponent,home,bye:false,date:game.start,status:game.state};
  }else if(board?.week===week && board.byes?.includes(code))out.mu={week,bye:true};
  else if(providerWeek!==week)out.mu=null;
  return {week,card:out,stale:!!context.stale,rankWeek:providerWeek};
}
function mergeLogs(provider, recorded) {
  const rows=new Map(provider.map(r=>[r.wk,r]));
  for(const r of recorded){const previous=rows.get(r.wk);rows.set(r.wk,{...previous,...r,line:previous?.line||r.line});}
  return [...rows.values()].sort((a,b)=>b.wk-a.wk);
}
module.exports={metadata,mergeLogs};
