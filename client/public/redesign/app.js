const S = window.SNAPSHOT;
const leagues = {
  gl: "Gentlemen’s League",
  bh: "Beaners & Husseins",
  rb: "Rebirth",
  sts: "Shoot the Shits",
};
let league = "gl",
  leagueTab = "overview",
  selectedWeek = (() => { const w=Number(new URLSearchParams(location.search).get("week")); return Number.isInteger(w) && w>=1 && w<=18 ? w : null; })(),
  routeGeneration = 0;
const requestedWeek = () =>
  selectedWeek || CFNData.state.context?.currentWeek || 11;
const currentCards = (k) =>
  CFNData.state.lineups[k]?.week === requestedWeek()
    ? CFNData.cards(
        k,
        S.cards.find((c) => c.league === k),
        S.photos,
      )
    : [];
const dateLabel = (s) =>
  s
    ? new Date(s).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Unknown date";
const feedNote = (c) =>
  c.current
    ? `${c.stale || CFNData.state.failures.context || CFNData.state.context?.stale || CFNData.state.failures["lineups-" + c.league] ? "Saved feed · refresh delayed" : "Feed updated"} ${dateLabel(c.stamp)}`
    : "Archived design example · Nov 21 · Not current scores";
function weekControl() {
  const ctx = CFNData.state.context;
  return `<label class="week-control"><span class="sr-only">Matchup week</span><select id="matchup-week">${(
    ctx?.availableWeeks || [11]
  )
    .slice()
    .reverse()
    .map(
      (w) =>
        `<option value="${w}" ${w === requestedWeek() ? "selected" : ""}>Week ${w}${w === ctx?.currentWeek ? (ctx.stale || CFNData.state.failures.context ? " · Last known" : " · Current") : ""}</option>`,
    )
    .join("")}</select></label>`;
}
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const clean = (s) => (s || "").replace(/[❄️🔥]/gu, "").trim();
function img(src, cls = "", alt = "") {
  if (!src) return "";
  let safe = src.startsWith("assets/") || /^\/media\/[a-zA-Z0-9/_?.=-]+$/.test(src);
  try {
    const u = new URL(src);
    safe =
      u.protocol === "https:" &&
      [
        "cuadzfantasynetwork.com",
        "sleepercdn.com",
        "a.espncdn.com",
        "s.yimg.com",
        "yahoofantasysports-res.cloudinary.com",
      ].includes(u.hostname);
  } catch {}
  return safe
    ? `<img src="${esc(themedLeagueArt(src))}" ${src === CFNLeagueArt.sts ? `data-league-art="${esc(src)}"` : ""} class="${cls}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer">`
    : "";
}
const num = (s) => (s || "—").replace(/[▲▼]/g, "");
const state = (s) => (s?.includes("▲") ? "up" : s?.includes("▼") ? "down" : "");
const headliner = (k) => {
  const saved = S.cards.find((c) => c.league === k);
  return (
    currentCards(k).find((c) =>
      c.teams.some(
        (t) => t.name.toLowerCase() === saved.teams[0].name.toLowerCase(),
      ),
    ) ||
    currentCards(k)[0] || { league:k, leagueLogo:saved.leagueLogo, unavailable:true, week:requestedWeek(), teams:[{name:"Awaiting matchup"},{name:"Awaiting matchup"}], rows:[], prob:null }
  );
};
const scores = (c) =>
  `<div class="teams">${c.teams
    .map(
      (t) =>
        `<div class="team"><div class="team-name">${esc(t.name)}</div><div class="scoreline">${
          img(t.logo, "team-logo") ||
          `<span class="team-logo team-monogram" aria-label="${esc(t.name)}">${esc(
            t.name
              .split(" ")
              .filter(Boolean)
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase(),
          )}</span>`
        }<div><div class="score">${esc(t.score || "—")}</div>${t.projection === "" ? "" : `<div class="projection ${t.projectionDirection || state(t.projection)}">${esc(num(t.projection))}</div>`}</div></div>${t.odds ? `<div class="odds">Moneyline <strong>${esc(t.odds)}</strong></div>` : ""}</div>`,
    )
    .join("")}</div>`;
const probability = (c) => {
  if (c.prob == null) return "";
  let n = Math.max(0, Math.min(100, Number(c.prob)));
  return `<div class="probability" aria-label="CFN estimate: ${esc(c.teams[0].name)} ${n}%, ${esc(c.teams[1].name)} ${100 - n}%"><div class="prob-label"><span>${n}%</span><span>${c.final ? "Final result" : "CFN win estimate"}</span><span>${100 - n}%</span></div><div class="track"><i class="fill" style="${n >= 50 ? "left:0" : "right:0"};width:${Math.max(n, 100 - n)}%"></i><i class="ball" style="left:${n}%"></i></div></div>`;
};
const card = (c) => c.unavailable ? `<article class="match"><div class="card-label">${img(c.leagueLogo)}<span>${leagues[c.league]}</span></div><h3>Checking matchups…</h3><p>Current scores are unavailable. Please try refreshing.</p></article>` :
  `<button class="match" data-detail="${c.id || c.league}" aria-label="Open ${esc(c.teams[0].name)} versus ${esc(c.teams[1].name)}"><div class="card-label">${img(c.leagueLogo)}<span>${leagues[c.league]}</span>${CFNPolish.featuredBadge(c)}<span class="chevron">›</span></div>${scores(c)}${probability(c)}<div class="card-freshness">${esc(feedNote(c))}</div></button>`;
const player = (p) =>
  `${img(p.photo)}<div><b>${esc(clean(p.name))}</b><small>${esc(p.game)}</small></div>`;
const rows = (c) => CFNPolish.rows(c);

function network() {
  return `<section class="hero"><div><div class="eyebrow">The network · Week ${requestedWeek()}</div><h1>The week in play.</h1><p>Four leagues. Every matchup has a story.</p></div>${weekControl()}</section><div class="section-head"><h2>This week’s headliners</h2><span class="text-link">Select a matchup for the full lineup</span></div><section class="group" aria-label="Featured matchups">${Object.keys(
    leagues,
  )
    .map((k) => card(headliner(k)))
    .join(
      "",
    )} </section><section class="home-recaps-mobile">${CFNRecaps.latest()}</section><section class="content-section"><div class="section-head"><h2>Your leagues</h2></div><div class="league-strip">${S.cards.map(c => `<a href="#league-${c.league}" class="league-tile">${img(c.leagueLogo)}<h3>${leagues[c.league]}</h3><span>Open league →</span></a>`).join("")}</div></section>`;
}
function lineup(c) {
  return `<section class="lineup-panel"><div class="lineup-title"><span>${esc(c.teams[0].owner)} · ${esc(c.teams[0].record)}</span><span>Points / projection</span><span>${esc(c.teams[1].owner)} · ${esc(c.teams[1].record)}</span></div>${rows(c)}</section>`;
}

function market() {
  const d = CFNData.state.market;
  const allPlayers = (d?.rankings?.length ? d.rankings : d?.players || []).map(p => ({...p,...d.players.find(m=>m.id===p.id)}));
  let body;
  if (d) {
    const sorted = d.players.filter((p) => Number.isFinite(p.percentChange));
    const group = (list, title) =>
      `<section class="mover-group"><h2>${title}</h2>${list.map((p, i) => `<div class="mover"><span class="rank">${i + 1}</span>${img(p.photoURL, "", p.name) || "<span></span>"}<div><b>${esc(p.name)}</b><small>${esc(p.position)} · ${esc(p.team)} · Value ${p.currentValue.toLocaleString()}</small></div><div class="change ${p.percentChange >= 0 ? "up" : "down"}">${p.percentChange > 0 ? "+" : ""}${p.percentChange.toFixed(1)}%</div></div>`).join("")}</section>`;
    body = `<div class="section-head"><h2>This week’s movers</h2><span class="text-link">${esc(d.label)}</span></div><div class="movers">${group(
      sorted
        .filter((p) => p.percentChange > 0)
        .sort((a, b) => b.percentChange - a.percentChange)
        .slice(0, 5),
      "↗ Risers",
    )}${group(
      sorted
        .filter((p) => p.percentChange < 0)
        .sort((a, b) => a.percentChange - b.percentChange)
        .slice(0, 5),
      "↘ Fallers",
    )}</div><p class="market-foot">${CFNData.state.failures.market ? "Saved feed · Refresh delayed · " : ""}CFN market model · Updated ${dateLabel(d.sourceUpdatedAt)}. Green and red show changes in value.</p>`;
  } else
    body = `<article class="note-card"><h3>Market data is loading.</h3><p>Please try again shortly.</p></article>`;
  return `<section class="hero"><div><div class="eyebrow">Across the network</div><h1>The player market.</h1><p>Player values, risers and fallers.</p></div></section>${body}${d ? `<section class="full-market content-section"><div class="section-head"><h2>All players</h2><span>${allPlayers.length} players</span></div><div class="market-filters"><label>Search players<input id="market-search" type="search" placeholder="Player or team"></label><label>Position<select id="market-position"><option value="">All positions</option>${["QB","RB","WR","TE","K","DST"].map(p=>`<option>${p}</option>`).join("")}</select></label></div><div class="table-wrap"><table><thead><tr><th>Player</th><th>Position</th><th>Value</th><th>Change</th></tr></thead><tbody>${allPlayers.slice().sort((a,b)=>b.currentValue-a.currentValue).map(p=>`<tr data-market-name="${esc((p.name+' '+p.team).toLowerCase())}" data-market-position="${esc(p.position)}"><td><div class="market-player">${img(p.photoURL,"",p.name)}<span><b>${esc(p.name)}</b><small>${esc(p.team)}</small></span></div></td><td>${esc(p.position)}</td><td>${p.currentValue.toLocaleString()}</td><td class="${p.percentChange>0?'up':p.percentChange<0?'down':''}">${Number.isFinite(p.percentChange)?(p.percentChange>0?'+':'')+p.percentChange.toFixed(1)+'%':'—'}</td></tr>`).join('')}</tbody></table></div><p id="market-empty" hidden>No players match that search.</p></section>` : ""}`;
}

function detail(id) {
  document.querySelector("#detail").dataset.matchup = id;
  const k = id.split("-")[0];
  const c = currentCards(k).find((c) => c.id === id) || headliner(k);
  document.querySelector("#detail-body").innerHTML = CFNPolish.detail(c);
  CFNPolish.swings(c);
  document.querySelector("#detail").showModal();
}
document.querySelector("#brand").src = S.logo;
document.addEventListener("click", (e) => {
  const d = e.target.closest("[data-detail]");
  if (d) detail(d.dataset.detail);
  if (e.target.closest("[data-close]"))
    document.querySelector("#detail").close();

});
document.addEventListener("change", (e) => {
  if (e.target.id === "league-select")
    location.hash = "league-" + e.target.value;
});
document.querySelector("#detail").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    const r = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      e.currentTarget.close();
  }
});

function filterMarket() {
  const q=(document.querySelector('#market-search')?.value||'').toLowerCase().trim(), pos=document.querySelector('#market-position')?.value||'';
  let visible=0;
  document.querySelectorAll('tr[data-market-name]').forEach(row=>{row.hidden=!(row.dataset.marketName.includes(q)&&(!pos||row.dataset.marketPosition===pos)); if(!row.hidden)visible++;});
  const empty=document.querySelector('#market-empty');if(empty)empty.hidden=visible>0;
}
document.addEventListener('input',e=>{if(e.target.id==='market-search')filterMarket();});
document.addEventListener('change',e=>{if(e.target.id==='market-position')filterMarket();});
