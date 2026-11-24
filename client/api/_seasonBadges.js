'use strict';
// Owner-confirmed season usage. Presentation only: never modify provider scores.
const used = {2026: {fb: [2, 10]}};
function superSaiyanUsedTeamIds(snapshot) {
 const ids = used[snapshot.season]?.[snapshot.leagueId] || [];
 const present = new Set((snapshot.standings?.rows || []).map(row => row.teamId));
 return ids.filter(id => present.has(id));
}
module.exports = {superSaiyanUsedTeamIds};
