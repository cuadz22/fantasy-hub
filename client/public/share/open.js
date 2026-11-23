// Crawlers read the initial HTML metadata; people open the corresponding public view.
const route=document.body.dataset.route;
const source=new URLSearchParams(location.search),target=new URL('/redesign/index.html',location.origin);
const week=Number(source.get('week')),matchup=source.get('matchup');
if(Number.isInteger(week)&&week>=1&&week<=18)target.searchParams.set('week',week);
if(/^(gl|bh|rb|sts)-\d+-\d+$/.test(matchup||'')&&route.startsWith('league-'+matchup.split('-')[0]))target.searchParams.set('matchup',matchup);
target.hash=route;
document.querySelector('#open-page').href=target.href;
location.replace(target.href);
