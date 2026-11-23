// Preserve the supplied artwork; use a deliberate ink palette on light surfaces.
const CFNLeagueArt = {gl:"assets/leagues/gl.svg",rb:"assets/leagues/rb.svg",sts:"assets/leagues/sts.svg"};
window.SNAPSHOT.cards.forEach(c => { if(CFNLeagueArt[c.league]) c.leagueLogo = CFNLeagueArt[c.league]; });
function themedLeagueArt(src) {
 return src === CFNLeagueArt.sts && document.documentElement.dataset.theme === "light" ? "assets/leagues/sts-light.svg" : src;
}
function syncLeagueArt() {
 document.querySelectorAll('img[data-league-art]').forEach(i=>{i.src=themedLeagueArt(i.dataset.leagueArt)});
}
new MutationObserver(syncLeagueArt).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
