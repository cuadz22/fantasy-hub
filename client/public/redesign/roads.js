/* Read-only team-season schedules. Never changes owner records, scores or standings. */
const CFNRoads = (() => {
  const archives = {}, issues = {}, checked = {}, pending = {};
  const leagues = ['gl','bh','rb','sts'];
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function validate(a, league) {
    const need = v => { if (!v) throw new Error('Invalid champion schedule'); };
    const score = s => { need(typeof s === 'string' && /^-?\d{1,6}(\.\d{1,4})?$/.test(s)); return Number(s); };
    need(a && a.schemaVersion === 1 && leagues.includes(league) && a.leagueKey === league && a.revision && Array.isArray(a.seasons));
    const years = new Set();
    for (const r of a.seasons) {
      need(Number.isInteger(r.season) && r.season >= 1990 && r.season <= 2100 && !years.has(r.season)); years.add(r.season);
      need(typeof r.teamName === 'string' && r.teamName && Array.isArray(r.games) && r.games.length && Array.isArray(r.missingWeeks));
      const ids = new Set(), weeks = new Set(), record = [0,0,0];
      for (const g of r.games) {
        need(typeof g.id === 'string' && g.id && !ids.has(g.id)); ids.add(g.id);
        need(['regular','playoff'].includes(g.stage) && Number.isInteger(g.weekStart) && Number.isInteger(g.weekEnd) && g.weekStart > 0 && g.weekEnd <= 22 && g.weekEnd >= g.weekStart);
        need(g.teamName && Array.isArray(g.sourceIDs) && g.sourceIDs.length && g.sourceIDs.every(s => typeof s === 'string' && s));
        for (let w=g.weekStart;w<=g.weekEnd;w++) { need(!weeks.has(w)); weeks.add(w); }
        if (g.result === 'BYE') need(g.stage === 'playoff' && !g.isFinal && g.score == null && g.opponentScore == null && g.opponentName == null);
        else {
          const x=score(g.score), y=score(g.opponentScore); need(g.opponentName && g.result === (x>y?'W':x<y?'L':'T'));
          if(g.stage === 'regular') record[['W','L','T'].indexOf(g.result)]++;
        }
      }
      const finals = r.games.filter(g => g.isFinal); need(finals.length===1 && finals[0].result==='W' && finals[0].stage==='playoff');
      const end=finals[0].weekEnd; need(r.games.every(g=>g.weekEnd<=end));
      const missing=Array.from({length:end},(_,i)=>i+1).filter(w=>!weeks.has(w));need(JSON.stringify([...r.missingWeeks].sort((a,b)=>a-b))===JSON.stringify(missing));
      need(record.join('-')===r.regularRecord);
      const start=Math.min(...r.games.filter(g=>g.stage==='playoff').map(g=>g.weekStart));need(r.games.filter(g=>g.stage==='regular').every(g=>g.weekEnd<start));
    }
    return a;
  }
  async function load(league) {
    if (!leagues.includes(league)) return;
    if(pending[league]) return pending[league];
    if(Date.now()-(checked[league]||0)<(issues[league]?60000:43200000))return;
    pending[league]=(async()=>{try {
      const response=await fetch(`/data/roads/v1/${league}.json`,{signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Unavailable');
      archives[league]=validate(await response.json(),league);delete issues[league];
    } catch { issues[league]=true; } finally { checked[league]=Date.now();delete pending[league]; }})();
    return pending[league];
  }
  function disclosure(league,year) {
    const r=archives[league]?.seasons.find(s=>s.season===Number(year));
    if(!r)return `<p class="subnote">${issues[league]?'Champion’s schedule is temporarily unavailable.':'Checking the champion’s schedule…'}</p>`;
    return `<details class="champion-road"><summary><span aria-hidden="true">♛</span> Road to the Ring</summary><p class="road-record">${escape(r.teamName)} · ${escape(r.regularRecord)} regular season</p>${['regular','playoff'].map(stage=>`<h4>${stage==='regular'?'Regular season':'The playoff run'}</h4><div class="road-games">${r.games.filter(g=>g.stage===stage).sort((a,b)=>a.weekStart-b.weekStart).map(g=>{
      const week=g.weekStart===g.weekEnd?`Week ${g.weekStart}`:`Weeks ${g.weekStart}–${g.weekEnd}`;
      return `<div class="road-game ${g.isFinal?'road-final':''}"><div class="road-teams"><small>${g.isFinal?'The Final · ':''}${week}</small><b>${escape(g.result==='BYE'?'Playoff bye':g.teamName)}</b>${g.opponentName?`<span>${escape(g.opponentName)}</span>`:''}</div>${g.result==='BYE'?'':`<div class="road-scores"><b>${escape(g.score)}</b><span>${escape(g.opponentScore)}</span></div>`}<span class="road-result road-${g.result.toLowerCase()}">${g.result}</span></div>`;
    }).join('')}</div>`).join('')}${r.missingWeeks.length?`<p class="subnote">No verified result for weeks ${r.missingWeeks.join(', ')}.</p>`:''}</details>`;
  }
  return {load,disclosure,validate,archives};
})();
if(typeof module !== 'undefined')module.exports=CFNRoads;
