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
  let safe = src.startsWith("assets/");
  try {
    const u = new URL(src);
    safe =
      u.protocol === "https:" &&
      [
        "cuadzfantasynetwork.com",
        "sleepercdn.com",
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
        }<div><div class="score">${esc(t.score || "—")}</div><div class="projection ${t.projectionDirection || state(t.projection)}">${esc(num(t.projection))}</div></div></div>${t.odds ? `<div class="odds">Moneyline <strong>${esc(t.odds)}</strong></div>` : ""}</div>`,
    )
    .join("")}</div>`;
const probability = (c) => {
  if (c.prob == null) return "";
  let n = Math.max(0, Math.min(100, Number(c.prob)));
  return `<div class="probability" aria-label="CFN estimate: ${esc(c.teams[0].name)} ${n}%, ${esc(c.teams[1].name)} ${100 - n}%"><div class="prob-label"><span>${n}%</span><span>${c.final ? "Final result" : "CFN win estimate"}</span><span>${100 - n}%</span></div><div class="track"><i class="fill" style="${n >= 50 ? "left:0" : "right:0"};width:${Math.max(n, 100 - n)}%"></i><i class="ball" style="left:${n}%"></i></div></div>`;
};
const card = (c) => c.unavailable ? `<article class="match"><div class="card-label">${img(c.leagueLogo)}<span>${leagues[c.league]}</span></div><h3>Checking matchups…</h3><p>Current scores are unavailable. Please try refreshing.</p></article>` :
  `<button class="match" data-detail="${c.id || c.league}" aria-label="Open ${esc(c.teams[0].name)} versus ${esc(c.teams[1].name)}"><div class="card-label">${img(c.leagueLogo)}<span>${leagues[c.league]}</span><span class="chevron">›</span></div>${scores(c)}${probability(c)}<div class="card-freshness">${esc(feedNote(c))}</div></button>`;
const player = (p) =>
  `${img(p.photo)}<div><b>${esc(clean(p.name))}</b><small>${esc(p.game)}</small></div>`;
const rows = (c) =>
  c.rows
    .filter((r) => r.left.name || r.right.name)
    .map(
      (r) =>
        `<div class="player-row"><div class="player">${player(r.left)}</div><div class="player-points">${esc(r.left.score || "—")}<small>${esc(num(r.left.proj))}</small></div><span class="slot ${esc(r.slot)}">${esc(r.slot)}</span><div class="player-points">${esc(r.right.score || "—")}<small>${esc(num(r.right.proj))}</small></div><div class="player right">${player(r.right)}</div></div>`,
    )
    .join("");

function network() {
  return `<section class="hero"><div><div class="eyebrow">The network · Week ${requestedWeek()}</div><h1>The week in play.</h1><p>Four leagues. Every matchup has a story.</p></div>${weekControl()}</section><div class="section-head"><h2>This week’s headliners</h2><span class="text-link">Select a matchup for the full lineup</span></div><section class="group" aria-label="Featured matchups">${Object.keys(
    leagues,
  )
    .map((k) => card(headliner(k)))
    .join(
      "",
    )}</section><section class="content-section editorial"><article class="story"><div class="eyebrow">The weekly edition · Nov 17 · Archive</div><h2>One week closer.<br>Everything to play for.</h2><p>Week 10 is in the books. Money O led the network with 245 points. Revisit the results and get a first look at Week 11.</p><button class="pill" data-story>Read the weekly recap <span>↗</span></button></article><div class="aside-stack"><a class="note-card" href="#market"><div class="eyebrow">Player market</div><h3>Who’s moving?</h3><p>This week’s five biggest risers and fallers.</p></a><div class="note-card"><div class="eyebrow">The Gents Podcast</div><h3>Beyond the box score.</h3><p>League conversations, rivalries, and the week that was.</p></div></div></section><section class="content-section"><div class="section-head"><h2>A league of your own.</h2><span class="text-link">Around the network</span></div><div class="league-strip">${S.cards.map((c) => `<a href="#league-${c.league}" class="league-tile">${img(c.leagueLogo)}<h3>${leagues[c.league]}</h3><p>${c.league === "rb" ? "Superflex · Keeper" : c.league === "bh" ? "Keeper · PPR" : "Redraft · PPR"}</p><span>Explore the league ↗</span></a>`).join("")}</div></section><div class="bottom-feature"><div><div class="eyebrow">Keep the game close</div><h3>The network, wherever Sunday takes you.</h3><p>A shared visual language for CFN on the web and iPhone.</p></div><span class="pill">CFN for iPhone</span></div>`;
}
function lineup(c) {
  return `<section class="lineup-panel"><div class="lineup-title"><span>${esc(c.teams[0].owner)} · ${esc(c.teams[0].record)}</span><span>Points / projection</span><span>${esc(c.teams[1].owner)} · ${esc(c.teams[1].record)}</span></div>${rows(c)}</section>`;
}

function market() {
  const d = CFNData.state.market;
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
    body = `<article class="note-card"><h3>Market data is loading.</h3><p>If the feed is unavailable, the full market remains accessible below.</p></article>`;
  return `<section class="hero"><div><div class="eyebrow">Across the network</div><h1>The player market.</h1><p>A clearer view of who’s gaining ground—and who’s giving it back.</p></div></section>${body}<section class="content-section editorial"><article class="story"><div class="eyebrow">The full market</div><h2>Keep the context.</h2><p>Explore every player, compare values, and build a trade with the existing market tools.</p><a class="pill" href="https://cuadzfantasynetwork.com/l/market-analysis.html" target="_blank" rel="noopener">Open market analysis ↗</a></article><aside class="note-card"><h3>One model across CFN.</h3><p>These movers come from the same feed as the app. This redesign does not change the valuation formula.</p></aside></section>`;
}

function detail(id) {
  document.querySelector("#detail").dataset.matchup = id;
  const k = id.split("-")[0];
  const c = currentCards(k).find((c) => c.id === id) || headliner(k);
  document.querySelector("#detail-body").innerHTML =
    `<div class="dialog-head"><span>${leagues[k]} · Week ${c.week || 11}</span><button class="share-page" data-share-matchup="${esc(c.id || k)}" aria-label="Share matchup">Share ↗</button><button class="close" data-close aria-label="Close matchup">×</button></div><div class="dialog-score">${scores(c)}${probability(c)}</div><div class="lineup-title"><span>${esc(c.teams[0].owner)} · ${esc(c.teams[0].record)}</span><span>Points / projection</span><span>${esc(c.teams[1].owner)} · ${esc(c.teams[1].record)}</span></div>${rows(c)}<p class="subnote" style="padding:0 22px">${esc(feedNote(c))}</p>`;
  document.querySelector("#detail").showModal();
}
document.querySelector("#brand").src = S.logo;
document.addEventListener("click", (e) => {
  const d = e.target.closest("[data-detail]");
  if (d) detail(d.dataset.detail);
  if (e.target.closest("[data-close]"))
    document.querySelector("#detail").close();
  if (e.target.closest("[data-story]")) {
    document.querySelector("#detail-body").innerHTML =
      `<div class="dialog-head"><span>The weekly edition · Nov 17 · Archive</span><button class="close" data-close aria-label="Close article">×</button></div><article class="dialog-copy"><div class="eyebrow">CFN Staff · Saved excerpt</div><h2>Week 10 Final & Week 11 Early Look</h2><p>Week 10 is in the books: Money O (Oscar) led the network with 245.00 points. Final scores, recaps and win-odds swings for all 24 matchups, plus an early look at Week 11.</p><p>In Gentlemen’s League, Run CMC handed Mr. Electricity its second loss. Sir reached 8–2, setting up a Week 11 meeting between the two leaders.</p><p class="subnote">An excerpt from the November 17 weekly edition.</p></article>`;
    document.querySelector("#detail").showModal();
  }
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
