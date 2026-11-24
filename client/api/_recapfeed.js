"use strict";
// Small publication-time snapshot; feed reads never fetch full recap articles.
function presentation(doc) {
 const team=doc.teamOfWeek||[];
 const selected=['QB','RB','WR'].map(position=>team.find(p=>p.position===position)).filter(Boolean);
 return {
  body:`Your Week ${doc.week} recap is ready. Tap to view Team of the Week, all six results and the stories behind them.`,
  recapPreview:{total:team.length,players:selected.map(p=>({name:p.name,kind:'player',position:p.position,photoURL:p.photoURL||null}))}
 };
}
module.exports={presentation};
