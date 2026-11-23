// Static share landing pages: no database writes, no scoring/auth dependencies.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../client/public'),out=path.join(root,'share');fs.mkdirSync(out,{recursive:true});
const leagues={gl:'Gentlemen’s League',bh:'Beaners & Husseins',rb:'Rebirth',sts:'Shoot the Shits'};
const tabs={overview:'Matchups',lineups:'Lineups',team:'Teams',standings:'Standings',trades:'Trades',waivers:'Waivers',history:'History',alltime:'All-time records',rules:'Rulebook',awards:'Awards',picks:'Draft picks',keepers:'Keepers',prices:'Keeper prices',cantcut:'Can’t cut list',draft:'Draft board',power:'Power rankings',fraud:'Fraud meter',weekly:'Weekly preview',desk:'Trade desk',traderules:'Trade rules',vote:'MVP voting'};
const pages={};
function add(route,title,subtitle,league=null){ const slug=route.replaceAll('/','-');pages[route]={route,slug,title,subtitle,league,url:'/share/'+slug+'.html',image:'/redesign/assets/previews/'+slug+'.jpg'}; }
for(const [lg,name] of Object.entries(leagues)) {
 add('league-'+lg,name,'Matchups · Standings · League history',lg);
 for(const [tab,title] of Object.entries(tabs)) {
  if(['picks','keepers','desk','traderules'].includes(tab)&&!['bh','rb'].includes(lg))continue;
  if(tab==='prices'&&lg!=='rb'||tab==='vote'&&lg!=='gl')continue;
  add('league-'+lg+'/'+tab,title,name,lg);
 }
}
for(const [r,t,s] of [['network','Your leagues. All here.','Cuadz Fantasy Network'],['market','The player market.','Risers, fallers and player values'],['exposure','Player exposure.','Your players across the network'],['studio','CFN Studio.','Matchups, awards and share cards'],['pickem','Make your picks.','Weekly league Pick’em'],['archive','The weekly edition.','Stories and recaps from around the network']])add(r,t,s);
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const origin='https://cuadzfantasynetwork.com';
for(const p of Object.values(pages)){
const title=p.league ? p.title+' · '+(p.title===leagues[p.league]?'CFN':leagues[p.league]):p.title+' · CFN';
fs.writeFileSync(path.join(out,p.slug+'.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(p.subtitle)}"><link rel="canonical" href="${origin+p.url}"><meta property="og:type" content="website"><meta property="og:site_name" content="Cuadz Fantasy Network"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(p.subtitle)}"><meta property="og:url" content="${origin+p.url}"><meta property="og:image" content="${origin+p.image}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:image" content="${origin+p.image}"><link rel="stylesheet" href="/share/landing.css"><script defer src="/share/open.js"></script></head><body data-route="${p.route}"><main><img src="${p.image}" alt="${esc(title)}"><h1>${esc(p.title)}</h1><p>${esc(p.subtitle)}</p><a id="open-page" href="/redesign/index.html#${p.route}">Open in CFN →</a></main></body></html>`);
}
fs.writeFileSync(path.join(root,'redesign/share-pages.js'),'window.CFN_SHARE_PAGES='+JSON.stringify(pages)+';\n');
console.log('Generated '+Object.keys(pages).length+' share pages.');
