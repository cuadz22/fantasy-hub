/* Independent, static draft archive. Never reads or writes app state or feed APIs. */
(() => {
  let catalogPromise;
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mediaOrigin = 'https://0qa2diffmldkqahu.public.blob.vercel-storage.com';
  const safeEdition = s => typeof s === 'string' && s.startsWith(mediaOrigin+'/studio/drafts/') && /^[-a-zA-Z0-9/]+$/.test(s.slice(mediaOrigin.length)) && !s.includes('..');
  const safePath = s => typeof s === 'string' && /^[-a-zA-Z0-9_./]+$/.test(s) && !s.includes('..');
  async function mount() {
    const root = document.getElementById('weekly-recaps');
    if (!root || root.dataset.mounted) return;
    root.dataset.mounted = 'true';
    root.innerHTML = '<p class="subnote" role="status">Loading weekly recap drafts…</p>';
    try {
      catalogPromise ||= fetch(mediaOrigin+'/studio/index.json', {cache:'no-cache'}).then(r => {if (!r.ok) throw Error('Archive unavailable'); return r.json();}).catch(e=>{catalogPromise=null;throw e;});
      const catalog = await catalogPromise;
      if (!root.isConnected) return;
      const editions = catalog.editions.filter(x => safeEdition(x.path));
      if (!editions.length) {root.innerHTML='<p>No completed-week drafts yet.</p>';return;}
      root.innerHTML = `<div class="recap-heading"><div><div class="eyebrow">Weekly recaps</div><h2>Your week, ready to share.</h2><p>Nine slides per league. Review the results and artwork, then download.</p></div><span class="recap-draft">Drafts · Awaiting your review</span></div><div class="recap-controls"><label>Edition <select id="recap-edition">${editions.map((x,i)=>`<option value="${i}">${escape(x.season)} · Week ${escape(x.week)}</option>`).join('')}</select></label><nav class="recap-leagues" aria-label="Recap league"></nav><a class="pill recap-bundle" download>Download league ZIP ↓</a></div><p class="subnote recap-info">4320 × 5760 PNGs · No posts are sent automatically.</p><div class="recap-slides" aria-label="Weekly recap slides"></div><p class="subnote">Review here before posting. These downloads do not publish to Instagram, the website feed, or the app.</p>`;
      let league='gl', request=0;
      async function show() {
        const seq=++request, edition=editions[Number(root.querySelector('#recap-edition').value)];
        root.querySelector('.recap-slides').textContent='Loading edition…';
        try {
          const res=await fetch(edition.path+'/manifest.json');if(!res.ok)throw Error('Unavailable');
          const entries=await res.json();if(seq!==request||!root.isConnected)return;
          const entry=entries.find(x=>x.id===league)||entries[0];league=entry.id;
          if (!safePath(entry.zip) || !entry.slides.every(s=>safePath(s.png)&&safePath(s.preview))) throw Error('Invalid archive');
          root.querySelector('.recap-leagues').innerHTML=entries.map(x=>`<button class="pill" data-recap-league="${escape(x.id)}" aria-pressed="${x.id===league}">${escape(x.name)}</button>`).join('');
          root.querySelector('.recap-bundle').href=edition.path+'/'+entry.zip;
          root.querySelector('.recap-info').textContent=`${entry.name} · Week ${entry.week} · ${entry.slides.length} slides · 4320 × 5760 PNGs`;
          root.querySelector('.recap-slides').innerHTML=entry.slides.map((s,i)=>`<article class="recap-slide"><a href="${edition.path}/${s.png}" target="_blank" rel="noopener" aria-label="Open ${escape(s.title)} at full resolution"><img src="${edition.path}/${s.preview}" loading="lazy" width="1080" height="1440" alt="${escape(entry.name+' · '+s.title)}"></a><div><h3>${i+1}. ${escape(s.title)}</h3><a href="${edition.path}/${s.png}?download=1" download>PNG ↓</a></div></article>`).join('');
        } catch {if(seq===request)root.querySelector('.recap-slides').textContent='This edition could not load. Please refresh to try again.';}
      }
      root.addEventListener('click',e=>{const b=e.target.closest('[data-recap-league]');if(b){league=b.dataset.recapLeague;show();}});
      root.querySelector('#recap-edition').addEventListener('change',show);
      await show();
    } catch {root.innerHTML='<p class="subnote">The recap archive is temporarily unavailable. Your other Studio tools are still available.</p>';}
  }
  new MutationObserver(mount).observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
  mount();
})();
