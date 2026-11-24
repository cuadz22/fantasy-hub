/* Public, read-only news and league activity. Team choice is a local view filter. */
window.CFNUpdates=(()=>{
 const state={league:'gl',team:0,tab:'news',news:null,posts:[],checked:0,error:''};let pending=null;
 const safeURL=s=>{try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
 async function load(){
  if(pending)return pending;
  pending=(async()=>{const jobs=[CFNData.loadResources(state.league),CFNData.load('league',state.league,null)];
   if(Date.now()-state.checked>600000)jobs.push((async()=>{
    const results=await Promise.allSettled(['/api/mobile/news','/api/mobile/network-preview'].map(async path=>{const r=await fetch(path,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('unavailable');return r.json();}));
    state.error=results.some(r=>r.status==='rejected')?'Some updates couldn’t refresh. Previously loaded items remain visible.':'';
    if(results[0].status==='fulfilled'&&Array.isArray(results[0].value.articles))state.news=results[0].value;
    if(results[1].status==='fulfilled'&&Array.isArray(results[1].value.posts))state.posts=results[1].value.posts;
    state.checked=Date.now();
   })());await Promise.all(jobs);
  })().finally(()=>pending=null);return pending;
 }
 function teams(){const d=CFNData.state.lineups[state.league];return (d?.matchups||[]).flatMap(m=>[{id:m.ia,name:m.an,players:m.L.map(r=>r[1])},{id:m.ib,name:m.bn,players:m.R.map(r=>r[1])}]).sort((a,b)=>a.id-b.id);}
 const date=s=>new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric'});
 function asset(a){return `<div class="asset-row">${a.kind&&a.kind!=='player'?'<span class="avatar fallback" aria-hidden="true">↗</span>':CFNPolish.avatar(a.name,a.position||'',a.team||'',safeURL(a.photoURL))}<span>${esc(a.name)}</span></div>`;}
 function trade(p,compact){
  const sides=p.sides;if(sides?.length!==2)return `<p>${esc(p.body)}</p>`;
  return `<div class="trade-sides feed-trade">${sides.map((sender,i)=>{
   const receiver=sides[1-i],items=receiver.assets||receiver.players.map(name=>({name,kind:/FAB/i.test(name)?'budget':/pick/i.test(name)?'pick':'player'}));
   const picks=items.filter(a=>a.kind==='pick'),others=items.filter(a=>a.kind!=='pick');
   const round=a=>/^round\s+(\d+)\s*(?:pick)?$/i.exec(a.name)?.[1]||a.name;
   return `<section><div class="trade-owner"><b>${esc(sender.owner||sender.name)}</b> <span>sends</span></div>${sender.owner?`<small class="trade-team-name">${esc(sender.name)}</small>`:''}${others.slice(0,compact?2:others.length).map(asset).join('')}${compact&&others.length>2?`<small>+${others.length-2} more</small>`:''}${picks.length?`<div class="trade-picks"><small>${picks.length===1?'Pick round':'Pick rounds'}</small><strong>${picks.map(a=>esc(round(a))).join(' · ')}</strong></div>`:''}</section>`;
  }).join('<span class="trade-arrow" aria-hidden="true">⇄</span>')}</div>`;
 }
 function content(p,compact=false){if(p.kind==='trade')return trade(p,compact);if(p.claims)return p.claims.map(c=>`<div class="update-claim">${asset(c.asset||{name:c.player})}<div><b>${esc(c.team)}</b><small>Successful claim</small></div>${c.amount!=null?`<strong>$${esc(c.amount)}</strong>`:''}</div>`).join('');return `<p>${esc(p.body)}</p>`;}
 function page(){const choices=teams(),selected=choices.find(t=>t.id===state.team),keys=new Set(selected?.players.map(CFNPolish.norm)||[]);
 let news=(state.news?.articles||[]).filter(n=>!state.team||n.players.some(p=>keys.has(CFNPolish.norm(p.name))));
 let posts=state.posts.filter(p=>(p.leagueId===state.league||p.leagueId==='network')&&(!state.team||!p.sides||p.sides.some(s=>s.teamId===state.team)));
 const controls=`<div class="updates-controls"><label>League<select id="updates-league">${Object.entries(leagues).map(([k,n])=>`<option value="${k}" ${state.league===k?'selected':''}>${esc(n)}</option>`).join('')}</select></label><label>Team<select id="updates-team"><option value="0">All teams</option>${choices.map(t=>`<option value="${t.id}" ${state.team===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label></div><div class="tabs updates-tabs" role="tablist" aria-label="Update type">${[['news','Player news'],['network','League updates']].map(([k,n])=>`<button role="tab" aria-selected="${state.tab===k}" data-updates-tab="${k}" class="${state.tab===k?'active':''}">${n}</button>`).join('')}</div>`;
 const list=state.tab==='news'?news.slice(0,60).map(n=>`<a class="update-news" href="${esc(safeURL(n.url))}" target="_blank" rel="noopener"><div class="update-portraits">${n.players.slice(0,2).map(p=>CFNPolish.avatar(p.name,p.position,p.team,safeURL(p.photoURL))).join('')}</div><div><small>${esc(n.players.map(p=>p.name).join(' · '))}</small><h3>${esc(n.headline)}</h3><small>${esc(n.source)} · ${date(n.publishedAt)} ↗</small></div></a>`).join(''):posts.slice(0,40).map(p=>`<article class="update-post"><div class="update-meta">${img(safeURL(p.logoURL),'update-league-logo','')}<div><small>${esc(leagues[p.leagueId]||'CFN Network')} · ${date(p.publishedAt)}</small><h3>${esc(p.title)}</h3></div></div>${p.kind==='trade'?trade(p,true):`<p>${esc(p.body)}</p>`}<button class="text-link" data-update-id="${esc(p.id)}">${p.kind==='trade'?'View full trade':p.kind==='waivers'?'View waiver report':'Read update'} ↗</button></article>`).join('');
 return `<section class="hero"><div><div class="eyebrow">CFN · Updates</div><h1>Stay in the know.</h1><p>Player news and league activity, with room to breathe.</p></div></section>${controls}${state.error?`<p role="status" class="subnote">${esc(state.error)}</p>`:''}${state.news?.stale?'<p class="subnote">Showing saved player news.</p>':''}<section class="updates-list" aria-label="Updates">${list||'<p class="note-card">'+(state.checked?'No recent updates for this selection.':'Loading updates…')+'</p>'}</section>`;
 }
 document.addEventListener('change',e=>{if(e.target.id==='updates-league'){state.league=e.target.value;state.team=0;render(true);}if(e.target.id==='updates-team'){state.team=Number(e.target.value);render(true,true);}});
 document.addEventListener('click',e=>{const tab=e.target.closest('[data-updates-tab]');if(tab){state.tab=tab.dataset.updatesTab;render(true,true);}const item=e.target.closest('[data-update-id]');if(item){const p=state.posts.find(p=>p.id===item.dataset.updateId);if(!p)return;if(p.recapID){location.href="recap.html?id="+encodeURIComponent(p.recapID);return;}modal(p.title,`<div class="update-detail"><p class="subnote">${esc(leagues[p.leagueId]||'CFN Network')} · ${date(p.publishedAt)}</p>${content(p)}${safeURL(p.url)?`<a class="text-link" href="${esc(safeURL(p.url))}">Read on CFN ↗</a>`:''}</div>`);}});
 return {load,page,content,state};
})();
