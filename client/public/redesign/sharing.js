function currentSharePage(matchup) {
 let route=matchup ? `league-${matchup.split('-')[0]}/overview` : (location.hash.slice(1)||'network');
 if(/^league(?:-(gl|bh|rb|sts))?$/.test(route))route=`league-${league}/${leagueTab}`;
 return CFN_SHARE_PAGES[route] || CFN_SHARE_PAGES[`league-${league}/${leagueTab}`] || CFN_SHARE_PAGES.network;
}
function pageShareURL(matchup) {
 const p=currentSharePage(matchup),url=new URL(p.url,'https://cuadzfantasynetwork.com');
 if(matchup || /^(network|league-.*(?:overview|lineups|team|weekly))$/.test(p.route))url.searchParams.set('week',requestedWeek());
 if(matchup && /^(gl|bh|rb|sts)-\d+-\d+$/.test(matchup))url.searchParams.set('matchup',matchup);
 return url.href;
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('#share-page,[data-share-matchup]');if(!b)return;
 const matchup=b.dataset.shareMatchup,p=currentSharePage(matchup),url=pageShareURL(matchup);
 const status=document.querySelector('#share-status');
 try {
  if(navigator.share){await navigator.share({title:p.title,text:p.subtitle,url});status.textContent='';}
  else {await navigator.clipboard.writeText(url);status.textContent='Link copied';b.textContent='Link copied ✓';setTimeout(()=>{b.textContent=matchup?'Share ↗':'Share page ↗'},2500);}
 }catch(error){
  if(error.name==='AbortError')return;
  // A selectable link remains usable when clipboard permission is unavailable.
  const wrap=document.createElement('div');wrap.className='share-fallback';
  const input=document.createElement('input');input.readOnly=true;input.value=url;input.setAttribute('aria-label','Share link');
  const close=document.createElement('button');close.textContent='Close';close.onclick=()=>wrap.remove();
  wrap.append(input,close);b.insertAdjacentElement('afterend',wrap);input.select();
 }
});
const leagueMenu=document.querySelector('#leagues-menu');
let closeLeagueMenu;
leagueMenu.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){clearTimeout(closeLeagueMenu);leagueMenu.open=true;}});
leagueMenu.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')closeLeagueMenu=setTimeout(()=>{if(!leagueMenu.contains(document.activeElement))leagueMenu.open=false},180);});
leagueMenu.addEventListener('focusout',()=>setTimeout(()=>{if(!leagueMenu.contains(document.activeElement))leagueMenu.open=false},0));
leagueMenu.addEventListener('click',e=>{if(e.target.closest('a'))leagueMenu.open=false});
syncLeagueArt();
// Open shared matchups only after their selected week's data has loaded.
(async()=>{
 const id=new URLSearchParams(location.search).get('matchup');
 if(!/^(gl|bh|rb|sts)-\d+-\d+$/.test(id||''))return;
 const lg=id.split('-')[0];
 if(!location.hash.startsWith('#league-'+lg))return;
 await CFNData.load('league',lg,selectedWeek);
 if(currentCards(lg).some(c=>c.id===id))detail(id);
 else document.querySelector('#share-status').textContent='This matchup is unavailable for the selected week.';
})();
