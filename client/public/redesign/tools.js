const T = {};

const names = {
  vote: "MVP voting",
  overview: "Matchups",
  lineups: "Lineups",
  team: "Teams",
  standings: "Standings",
  trades: "Trades",
  waivers: "Waivers",
  history: "History",
  alltime: "All-time records",
  rules: "Rulebook",
  awards: "Awards",
  picks: "Draft picks",
  keepers: "Keepers",
  prices: "Keeper prices",
  cantcut: "Can’t cut list",
  draft: "Draft board",
  power: "Power rankings",
  fraud: "Fraud meter",
  weekly: "Weekly preview",
  desk: "Trade desk",
  traderules: "Trade rules",
};
const sections = [
  ["League history", ["history", "alltime", "awards"]],
  ["Roster & draft", ["draft", "picks", "keepers", "prices", "cantcut"]],
  ["Insights", ["power", "fraud", "weekly"]],
  ["Resources", ["rules", "desk", "traderules", "vote"]],
];
const available = (id) =>
  (id !== "vote" || league === "gl") &&
  !(
    ["keepers", "picks", "desk", "traderules", "cantcut"].includes(id) &&
    !["bh", "rb"].includes(league)
  ) &&
  !(id === "prices" && league !== "rb");
const link = (id) =>
  `<a href="#league-${league}/${id}">${names[id]}<span aria-hidden="true">↗</span></a>`;
const route = (id) => {
  location.hash = `league-${league}/${id}`;
};
function controls() {
  return `<div class="controls expanded-controls"><div class="tabs" aria-label="League navigation">${["overview", "team", "standings", "trades", "waivers"].map((id) => `<a href="#league-${league}/${id}" class="tab-link ${leagueTab === id ? "active" : ""}" ${leagueTab === id ? 'aria-current="page"' : ""}>${names[id]}</a>`).join("")}<details class="league-tools" id="league-tools"><summary class="${!["overview", "team", "standings", "trades", "waivers"].includes(leagueTab) ? "active" : ""}">League tools <span aria-hidden="true">⌄</span></summary><div class="tool-menu">${sections.map(([title, ids]) => `<div><div class="eyebrow">${title}</div>${ids.filter(available).map(link).join("")}</div>`).join("")}</div></details></div>${["overview", "lineups", "team", "weekly"].includes(leagueTab) ? CFNPolish.weekStrip((CFNData.state.context?.availableWeeks||[requestedWeek()]).slice().sort((a,b)=>b-a),requestedWeek(),"data-matchup-week") : ""}</div>`;
}
const heading = (title, sub = "League records") =>
  `<div class="tool-heading"><div><div class="eyebrow">${leagues[league]}</div><h2>${title}</h2></div><span class="archive-label">${sub}</span></div>`;
const table = (heads, rows, cls = "") =>
  `<div class="table-wrap ${cls}" tabindex="0" aria-label="Scrollable data table"><table><thead><tr>${heads.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const photo = (n, pos='', team='') => CFNPolish.avatar(n,pos,team);
const empty = (title, text) =>
  `<article class="note-card empty-state"><h3>${title}</h3><p>${text}</p></article>`;
const savednote = (text) => `<p class="subnote archive-note">${text}</p>`;

function standingsView() {
  const d = CFNData.state.standings[league];
  if (!d)
    return (
      heading("Standings", "Current standings not loaded") +
      empty(
        "Official records are being checked",
        "We do not substitute the old Week 9 archive for current standings. Please try again shortly, or open the existing standings below.",
      )
    );
  const custom = league === "sts" && d.customRows;
  const rs = custom || d.rows;
  const delayed = d.stale || CFNData.state.failures["standings-" + league];
  return (
    heading(
      "Standings",
      `Through Week ${d.throughWeek} · ${delayed ? "Saved feed · Refresh delayed" : "Official completed results"}`,
    ) +
    table(
      [
        "#",
        "Team",
        "W–L–T",
        ...(custom ? ["League points"] : []),
        "Points for",
        "Points against",
        "PF / game",
        "Streak",
      ],
      rs.map((r) => [
        r.rank,
        `<button class="team-link" data-roster="${r.teamId}">${esc(r.name)}</button>`,
        esc(r.record),
        ...(custom ? [r.customPoints] : []),
        r.pointsFor.toFixed(2),
        r.pointsAgainst.toFixed(2),
        r.pointsPerGame.toFixed(2),
        esc(r.streak),
      ]),
    ) +
    savednote(
      `${custom ? "League ranking includes top-six scoring weeks. " : league === "sts" ? "Win-loss reference; custom league ranking is unavailable. " : ""}Only completed weeks count toward these records. Live projections never change official standings.`,
    )
  );
}
function tradesView() {
  const ts = T.trades[league] || [];
  return (
    heading("Trade history") +
    `<div class="trade-list">${ts.map((t) => `<article class="trade-card"><div class="trade-date">${esc(t.date)} · 2026 <span>Completed trade</span></div><div class="trade-sides">${["a", "b"].map((side) => `<section><div class="eyebrow">${esc(t[side].mgr)}</div><h3>${esc(t[side].team)}</h3><div class="receive">Receives from ${esc(t[side === "a" ? "b" : "a"].mgr)}</div>${t[side].gets.map((n) => `<div class="asset-row">${/pick|FAB/i.test(n) ? '<span class="avatar fallback">↗</span>' : photo(n)}<span>${esc(n)}</span></div>`).join("")}</section>`).join('<div class="trade-arrow" aria-hidden="true">⇄</div>')}</div></article>`).join("") || empty("No trades in this snapshot", "This space will hold completed trades for the selected league.")}</div>`
  );
}
function waiversView() {
  let all = T.waivers[league] || [],
    weeks = [...new Set(all.map((w) => w.week))].sort((a, b) => b - a);
  return (
    heading("Waiver report", `Saved report · ${T.waiversUpdated}`) +
    CFNPolish.weekStrip(weeks, weeks[0], 'data-waiver-week',true) + `<div id="waiver-results">${waiverRows(all.filter(w=>w.week===weeks[0]))}</div>`
  );
}
function waiverRows(rs) {
  return `<div class="waiver-list">${rs.slice().sort((a,b)=>b.week-a.week)
    .map((w) => {
      const bid = w.bids.find((b) => b.won);
      return `<details class="waiver-card"><summary>${photo(w.player,w.position,w.nflTeam)}<div><b>${esc(w.player)}</b><small>${esc(w.position)} · ${esc(w.nflTeam)} · ${esc(w.date)}</small></div><div class="waiver-team"><b>${esc(w.winner)}</b><small>Successful claim</small></div><strong class="bid">$${bid?.amount ?? 0}</strong><span class="disclosure">⌄</span></summary><div class="bid-detail">${w.bids.map((b) => `<div><span>${esc(b.manager)}${b.won ? ' <span class="status-tag">Won</span>' : ""}</span><b>$${b.amount}</b></div>`).join("")}</div></details>`;
    })
    .join("")}</div>`;
}
function historyView() {
  let h = T.history[league];
  return (
    heading("League history") +
    `<div class="history-grid">${(h?.seasons || []).map((s) => `<article class="champion-card"><div class="champion-top"><span class="trophy">♛</span><span>${s.year}</span></div><div class="eyebrow">League champion</div><h3>${esc(s.champion.team)}</h3><p>${esc(s.champion.owner)} · ${esc(s.champion.record)}</p><div class="history-podium"><div><span>Runner-up</span><b>${esc(s.runnerUp)}</b></div><div><span>Third place</span><b>${esc(s.thirdPlace)}</b></div></div>${T.historicalFinals[league]?.[s.year] ? `<button class="championship-open" data-championship="${s.year}">View championship matchup <span aria-hidden="true">↗</span></button>` : `<p class="subnote">Final lineup not available in the archive.</p>`}</article>`).join("")}</div><section class="content-section"><h3>Records worth remembering.</h3><div class="record-grid">${(h?.records || []).map((r) => `<article class="note-card"><div class="eyebrow">${esc(r.label)}</div><h3>${esc(r.value)}</h3><p>${esc(r.holder)}</p></article>`).join("")}</div></section>`
  );
}
function alltimeView() {
  const data = T.allt[league];
  const sorted = Object.entries(data?.owners || {}).sort(
    (a, b) => b[1][0] - a[1][0],
  );
  return (
    heading("All-time records") +
    table(
      ["Manager", "Wins", "Losses", "Ties", "Win %"],
      sorted.map(([n, r]) => [
        esc(n),
        ...r,
        (
          ((r[0] + r[2] / 2) / (r.reduce((a, b) => a + b, 0) || 1)) *
          100
        ).toFixed(1) + "%",
      ]), "records-table",
    ) +
    `<section class="content-section"><h3>Head to head</h3><div class="filter-row"><label for="history-owner">Manager</label><select id="history-owner">${sorted.map(([n]) => `<option>${esc(n)}</option>`).join("")}</select></div><div id="h2h-results">${h2h(sorted[0]?.[0])}</div></section>`
  );
}
function h2h(owner) {
  const pairs = Object.entries(T.allt[league]?.h2h || {}).filter(([k]) =>
    k.split("|").includes(owner),
  );
  return table(
    ["Opponent", "Wins", "Losses", "Ties"],
    pairs.map(([k, r]) => {
      const ns = k.split("|"),
        first = ns[0] === owner;
      return [esc(ns[first ? 1 : 0]), r[first ? 0 : 1], r[first ? 1 : 0], r[2]];
    }), "records-table",
  );
}
function rulesView(tradeOnly = false) {
  let rs = T.rules[league]?.sections || [];
  if (tradeOnly) rs = rs.filter((r) => /trade|keeper|waiver/i.test(r.title));
  return (
    heading(tradeOnly ? "Trade rules" : "League rulebook") +
    `<div class="rule-list">${rs.map((r, i) => `<details class="rule-card" ${i === 0 ? "open" : ""}><summary><span class="rule-number">${String(i + 1).padStart(2, "0")}</span>${esc(r.title)}<span class="disclosure">⌄</span></summary><div class="rule-body">${r.content.map((c) => `<p class="${c.highlight ? "rule-emphasis" : ""}">${esc(c.text)}</p>`).join("")}</div></details>`).join("")}</div>`
  );
}
function awardsView() {
  return (
    heading("League awards") +
    `<div class="award-grid">${(T.awards[league] || []).map((a) => `<article class="award-card"><div class="eyebrow">${esc(a.weeks)} · 2026</div><span class="trophy">♛</span><h3>Mr. ${esc(a.month)}</h3><h2>${esc(a.team)}</h2><p>${esc(a.mgr)}</p><div class="award-stats"><div><strong>${esc(a.rec)}</strong><span>Record</span></div><div><strong>${esc(a.pf)}</strong><span>Points for</span></div><div><strong>${esc(a.ap)}</strong><span>All-play</span></div></div><p class="award-note">${esc(a.note)}</p><div class="award-players">${a.players.map((p) => `<div>${photo(p[0],p[1])}<span>${esc(p[0])}<small>${esc(p[1])} · ${p[2]} points</small></span></div>`).join("")}</div></article>`).join("") || empty("The next award belongs here", "No award recipient is present in this saved archive.")}</div>`
  );
}
function resourceRows(sec) {
  if(sec === "Draft Picks") return pickRows();
  return (T.resources || []).filter((r) => r.league === league && r.section === sec);
}
function resourcesView(sec) {
  let rs = resourceRows(sec),
    seasons = [...new Set(rs.map((r) => r.season).filter(Boolean))]
      .sort()
      .reverse();
  let groups = [...new Set(rs.map((r) => r.group))];
  return (
    heading(sec) +
    `<div class="filter-row"><label for="resource-group">${sec === "Keepers" ? "Manager" : "Team"}</label><select id="resource-group" data-section="${sec}"><option value="all">All ${sec === "Keepers" ? "managers" : "teams"}</option>${groups.map((g) => `<option>${esc(g)}</option>`).join("")}</select>${seasons.length ? `<label for="resource-season">Season</label><select id="resource-season" data-section="${sec}">${seasons.map((s) => `<option>${s}</option>`).join("")}</select>` : ""}<input type="search" id="resource-search" data-section="${sec}" placeholder="Find a player" aria-label="Find a player"></div><div id="resource-results">${resourcesTable(rs.filter((r) => !seasons.length || r.season === seasons[0]))}</div>` +
    savednote(
      "Uses the website’s keeper records and pricing rules. These are estimates; confirm eligibility and available picks before keeping a player. No decisions are submitted here.",
    )
  );
}
function resourcesTable(rs) {
  return table(
    ["Player", "Team / manager", "Price", "Contract / details"],
    rs.map((r) => [
      `<span class="name-cell">${photo(r.title)}${esc(r.title)}</span>`,
      esc(r.group),
      esc(r.value),
      esc(r.detail),
    ]),
  );
}
function pickRows() {
  const d=CFNData.state.picks[league]; if(!d || !T.teams) return [];
  const teams=T.teams[league], name=id=>teams.find(t=>t.id===id)?.team || "Team "+id;
  return d.rows.flatMap((row,r)=>row.map((id,i)=>({league,section:"Draft Picks",group:name(id),title:"Round "+(r+1),value:id===i+1?"Own pick":"Acquired",detail:"Originally: "+name(i+1)+(league==="bh"&&r>=14?" · Keeper round":""),season:""})));
}
function picksView() {
  const ledger=CFNData.state.picks[league];
  if(!ledger) return heading("Draft-pick ownership", "Live ledger not loaded")+empty("Checking current ownership", "Please try again or open the original board below.");
  const rs = resourceRows("Draft Picks"),
    teams = T.teams[league].slice().sort((a,b)=>a.id-b.id).map(t=>t.team),
    rounds = [
      ...new Set(rs.map((r) => Number(r.title.replace(/\D/g, "")))),
    ].sort((a, b) => a - b);
  return (
    heading("Draft-pick ownership", CFNData.state.failures["picks-"+league] ? "Last loaded ledger · refresh delayed" : ledger.live ? "Yahoo trades + approved league trades" : "Saved ledger · provider refresh unavailable") +
    savednote(
      "Each cell shows the number of picks that team owns in the round. Select a count to see where the picks came from.",
    ) +
    `<div class="table-wrap picks-wrap" tabindex="0" aria-label="Draft pick board, scroll horizontally"><table class="picks-table"><thead><tr><th scope="col">Team</th>${rounds.map((r) => `<th scope="col">R${r}</th>`).join("")}<th scope="col">Total</th></tr></thead><tbody>${teams
      .map(
        (t) =>
          `<tr><th scope="row">${esc(t)}</th>${rounds
            .map((r) => {
              let own = rs.filter(
                (x) =>
                  x.group === t && Number(x.title.replace(/\D/g, "")) === r,
              );
              return `<td>${own.length ? `<button data-pick-team="${esc(t)}" data-pick-round="${r}" class="pick-count ${own.length > 1 ? "multiple" : ""}" aria-label="${esc(t)}, round ${r}, ${own.length} picks">${own.length}</button>` : '<span class="pick-count missing" aria-label="No picks">0</span>'}</td>`;
            })
            .join(
              "",
            )}<td><b>${rs.filter((x) => x.group === t).length}</b></td></tr>`,
      )
      .join("")}</tbody></table></div>`
  );
}
function cantcutView() {
  const list = [
    ...new Set([
      ...(T.cc.list || []),
      ...(league === "rb" ? T.cc.qb10 || [] : []),
    ]),
  ];
  return (
    heading("Can’t cut list", `Source updated · ${T.cc.asof}`) +
    `<article class="note-card"><h3>${league === "rb" ? "Yahoo list + top 10 scoring quarterbacks" : "Yahoo can’t-cut list"}</h3><p>${league === "rb" ? "Rebirth also protects the top 10 scoring quarterbacks under its superflex rule." : "The Yahoo list is the reference for this league."} The source date above identifies when this protection list was last updated.</p></article><div class="protected-grid">${list.map((n) => `<div>${photo(n)}<span><b>${esc(n)}</b><small>${league === "rb" && T.cc.qb10.includes(n) ? "Top 10 QB" + (T.cc.list.includes(n) ? " · Yahoo" : "") : "Yahoo list"}</small></span><span class="lock-mark" aria-label="Protected">◇</span></div>`).join("")}</div>`
  );
}
function draftView() {
  const d = T.draft[league];
  if(!d) return heading("Draft board")+empty("Draft results unavailable", "Open the existing draft archive below.");
  const tile=(p,auction=false)=>p ? `<div class="draft-pick" style="--position-color:${({QB:"#63a6f4",RB:"#53bea6",WR:"#f49a58",TE:"#d98bdc",K:"#a8c84d",DEF:"#dac15e"})[p[4]]||"#6b829b"}"><div class="draft-face">${photo(p[3],p[4],p[5])}${CFNPolish.badge(p[4])}</div><b>${esc(p[3])}</b><small>${esc(p[5])} · ${auction ? '$'+p[6] : 'Pick '+((p[0]-1)*12+p[1])}</small><strong class="draft-owner">${esc(d.T[p[2]])}</strong>${auction ? "" : `<span class="draft-direction" aria-label="Round proceeds ${p[0]%2?'left to right':'right to left'}">${p[0]%2?'→':'←'}</span>`}</div>` : '<span class="muted">—</span>';
  if(league==='sts') {
    return heading("2026 auction draft", "As drafted · Winning bids")+`<div class="auction-grid">${d.T.map((team,i)=>{const picks=d.P.filter(p=>p[2]===i);return `<article class="note-card"><h3>${esc(team)}</h3><p>$${picks.reduce((n,p)=>n+p[6],0)} spent · ${picks.length} players</p>${picks.map(p=>tile(p,true)).join('')}</article>`;}).join('')}</div>`;
  }
  const rounds=[...new Set(d.P.map(p=>p[0]))].sort((a,b)=>a-b), grid=new Map();
  for(const p of d.P) {const key=p[0]+'.'+p[1];if(grid.has(key)) throw Error('Duplicate draft slot');grid.set(key,p);}
  return heading("2026 draft board", "As drafted · Snake order")+savednote("Columns follow draft slots. Every selection shows its actual drafting team, including traded picks. Arrows show the direction of each round. On smaller screens, swipe sideways to see every slot.")+`<div class="table-wrap picks-wrap" tabindex="0" aria-label="Draft board, scroll horizontally"><table class="draft-table"><thead><tr><th>Round</th>${Array.from({length:12},(_,i)=>`<th>Slot ${i+1}</th>`).join('')}</tr></thead><tbody>${rounds.map(r=>`<tr><th scope="row">R${r} ${r%2?'→':'←'}</th>${Array.from({length:12},(_,i)=>`<td>${tile(grid.get(r+'.'+(r%2?i+1:12-i)))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function powerData() {
  const p=CFNData.state.power[league],ctx=CFNData.state.context;
  return p && ctx && p.season===ctx.season && p.currentWeek===ctx.currentWeek ? p : null;
}
function powerNotice(p) {
  return p.stale || CFNData.state.failures['power-'+league] ? savednote('Refresh delayed. Showing the last verified calculation for this completed week.') : '';
}
function powerView() {
  const p=powerData();
  if(!p)return empty('Power rankings',CFNData.state.failures['power-'+league] ? 'Current results could not be verified. Please try again.' : 'Checking completed results…');
  return heading('Power rankings',`Through Week ${p.throughWeek} · Updates automatically`) + powerNotice(p) +
    savednote(`Based on completed-game scoring, all-play results and weekly finishes. Record contributes ${Math.round(p.recordWeight*100)}%. 50 is league average; live games do not change official records.`) +
    `<div class="ranking-list">${p.rows.map(r=>`<div><span class="rank">${r.rank}</span><div><b>${esc(r.name)}</b><small>${esc(r.record)} · ${r.pointsPerGame.toFixed(1)} points/game · ${r.allPlayWinPercent}% all-play</small></div><div class="strength-track"><i style="width:${r.score}%"></i></div><strong>${r.score}</strong></div>`).join('')}</div>`;
}
function fraudView() {
  const p=powerData();
  if(!p)return empty('Fraud meter',CFNData.state.failures['power-'+league] ? 'Current results could not be verified. Please try again.' : 'Checking completed results…');
  return heading('Fraud meter',`Through Week ${p.throughWeek} · Updates automatically`) + powerNotice(p) +
    savednote('Luck compares actual wins (ties count as half) with expected wins if you faced every team each week. Positive means your schedule helped; negative means it hurt.') +
    CFNPolish.fraud(p);

}

function rosterChoices() {
  return currentCards(league)
    .flatMap((c) =>
      c.teams.map((t, i) => ({ c, t, side: i === 0 ? "left" : "right" })),
    )
    .sort((a, b) => a.t.id - b.t.id);
}
function teamView() {
  const choices = rosterChoices();
  return (
    heading("Teams & rosters", `Week ${requestedWeek()} · Read-only`) +
    (choices.length
      ? `<div class="filter-row"><label for="team-side">Team</label><select id="team-side">${choices.map((v, i) => `<option value="${i}">${esc(v.t.name)}</option>`).join("")}</select></div><div id="team-results">${teamRoster(0)}</div>`
      : empty(
          "Rosters are unavailable",
          "Please try again shortly. No archived roster is being shown as current.",
        ))
  );
}
function teamRoster(i) {
  const v = rosterChoices()[i];
  if (!v) return "";
  const { c, t, side } = v;
  return (
    `<div class="team-summary">${img(t.logo, "team-logo")}<div><h3>${esc(t.name)}</h3><p>${esc(t.owner)}${t.record ? " · " + esc(t.record) : ""}</p></div><div class="score">${esc(t.score)}<small class="projection">${esc(t.projection)}</small></div></div>` +
    table(
      ["Slot", "Starter", "Game", "Points", "Projection"],
      c.rows
        .filter((r) => r[side].name)
        .map((r) => [
          esc(r.slot),
          `<span class="name-cell">${photo(clean(r[side].name))}${esc(clean(r[side].name))}</span>`,
          esc(r[side].game),
          esc(r[side].score),
          esc(num(r[side].proj)),
        ]),
    ) +
    savednote(
      feedNote(c) +
        " · Starter view. Full rosters and bench remain available in the existing tool.",
    )
  );
}

function weeklyView() {
  const c = headliner(league);
  return (
    heading(
      "Weekly preview",
      `Week ${headliner(league).week || 11} · ${feedNote(headliner(league))}`,
    ) +
    `<div class="group featured-single">${card(c)}</div><article class="note-card content-section"><div class="eyebrow">The matchup to watch</div><h3>${esc(c.teams[0].name)} vs. ${esc(c.teams[1].name)}</h3><p>Open the card to compare every starter, current scores, and projections.</p></article>`
  );
}
function deskView() {
  return (
    heading("Trade desk", "Local draft · Nothing is submitted") +
    `<p class="subnote">Choose two teams to draft a proposal. Nothing is sent until you share it yourself.</p><div class="trade-builder">${[0, 1].map((n) => `<section class="note-card"><label for="trade-team-${n}">Team ${n + 1}</label><select id="trade-team-${n}" data-trade-team="${n}">${T.teams[league].map((t, i) => `<option value="${i}" ${i === n ? "selected" : ""}>${esc(t.team)}</option>`).join("")}</select><div id="trade-roster-${n}">${tradeRoster(n, n)}</div></section>`).join("")}</div><div class="proposal-summary" id="proposal-summary">Choose the assets each team would send.</div>`
  );
}
function tradeRoster(index, side) {
  return `<div class="receive">Sends</div>${(T.teams[league][index]?.pl || [])
    .map(([slot, id]) => {
      const p = T.players[id];
      return p
        ? `<label class="asset-choice"><input type="checkbox" data-proposal="${side}" value="${esc(p.n)}">${photo(p.n)}<span>${esc(p.n)}<small>${esc(p.p)} · ${esc(p.t)}</small></span></label>`
        : "";
    })
    .join("")}`;
}
function toolBody() {
  if (!["overview","lineups","team","standings","weekly","vote"].includes(leagueTab) && !CFNData.state.resources) return empty("Loading league records", "The current resource feed is being checked. Please try again if it does not load.");
  switch (leagueTab) {
    case "standings":
      return standingsView();
    case "trades":
      return tradesView();
    case "waivers":
      return waiversView();
    case "history":
      return historyView();
    case "alltime":
      return alltimeView();
    case "rules":
      return rulesView();
    case "traderules":
      return rulesView(true) + cantcutView();
    case "awards":
      return awardsView();
    case "picks":
      return picksView();
    case "keepers":
      return resourcesView("Keepers");
    case "prices":
      return resourcesView("Keeper Prices");
    case "cantcut":
      return cantcutView();
    case "draft":
      return draftView();
    case "power":
      return powerView();
    case "fraud":
      return fraudView();
    case "team":
      return teamView();
    case "weekly":
      return weeklyView();
    case "desk":
      return deskView();
    default:
      return "";
  }
}
const originalPrefixes = {
  gl: "gentlemens",
  bh: "beaners",
  rb: "rebirth",
  sts: "sts",
};
const originalTools = {
  overview: "live-matchups",
  lineups: "live-matchups",
  team: "live-matchups",
  standings: "standings",
  trades: "trades",
  waivers: "waivers",
  history: "history",
  alltime: "all-time-ranks",
  rules: "rulebook",
  awards: "awards",
  power: "power-rankings",
  fraud: "fraud-meter",
  weekly: "weekly-preview",
  desk: "trade-desk",
  traderules: "trade-rules",
  vote: "mvp-vote",
  keepers: "keepers",
  picks: "keepers",
  prices: "keepers",
  cantcut: "trade-rules",
  draft: "matchups",
};
function originalLink() {
  let dest = originalTools[leagueTab] || "matchups";
  if (
    ["gl", "sts"].includes(league) &&
    ["traderules", "cantcut", "picks", "keepers", "prices"].includes(leagueTab)
  )
    dest = "rulebook";
  return `<a class="original-feature" href="https://cuadzfantasynetwork.com/l/${originalPrefixes[league]}-${dest}.html" target="_blank" rel="noopener">Open the existing ${esc(names[leagueTab].toLowerCase())} tool ↗</a>`;
}
function leaguePage() {
  const c = headliner(league);
  const hero = `<section class="hero league-hero"><div class="identity">${img(c.leagueLogo)}<div><div class="eyebrow">CFN · League</div><h1>${leagues[league]}</h1><p>Your league. All in one place.</p></div></div><select class="league-select" id="league-select" aria-label="Choose league">${Object.entries(
    leagues,
  )
    .map(
      ([k, v]) =>
        `<option value="${k}" ${k === league ? "selected" : ""}>${v}</option>`,
    )
    .join("")}</select></section>`;
  let body = toolBody();
  if (leagueTab === "overview") {
    const cs = currentCards(league);
    body =
      heading(
        "Around the league",
        cs.length
          ? `Week ${requestedWeek()} · ${cs.length} matchups`
          : "Current matchups unavailable",
      ) +
      `<section class="group">${(cs.length ? cs : [c]).map(card).join("")}</section>` +
      `<section class="content-section league-directory"><div><h2>More to your league.</h2><p>From this week’s moves to the seasons that built it.</p></div><div class="directory-grid">${sections.map(([title, ids]) => `<section><h3>${title}</h3>${ids.filter(available).map(link).join("")}</section>`).join("")}</div></section>`;
  }
  if (leagueTab === "lineups") body = lineup(c);
  if (leagueTab === "vote")
    body =
      heading("MVP voting", "Existing voting tool") +
      empty(
        "Let the league decide.",
        "Voting stays in the existing secure flow with the original voting tool.",
      );
  return hero + controls() + body + (["history","alltime","awards","draft","fraud","waivers"].includes(leagueTab) ? "" : originalLink());
}

const moreNames = {
  exposure: "Player exposure",
  studio: "Studio",
  pickem: "Pick’em",
  archive: "Weekly editions",
  commish: "Commissioner tools",
};
function globalHero(title, desc) {
  return `<section class="hero"><div><div class="eyebrow">CFN · Across the network</div><h1>${title}</h1><p>${desc}</p></div></section>`;
}
function exposure() {
  if(!CFNData.state.resources) return globalHero("Player exposure", "Loading league records…");
  const owners = [
    ...new Set(
      Object.values(T.teams)
        .flat()
        .map((t) => t.mgr),
    ),
  ].sort();
  return (
    globalHero(
      "Your players. Everywhere.",
      "A single view of the players you hold across your leagues.",
    ) +
    `<div class="filter-row"><label for="exposure-owner">Manager</label><select id="exposure-owner">${owners.map((o) => `<option ${o === "Cuadz" ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></div><div id="exposure-results">${exposureRows("Cuadz")}</div>` +
    savednote(
      "Calculated only from the saved website roster snapshot. This is not a live roster check.",
    )
  );
}
function exposureRows(owner) {
  const ps = {};
  for (const [lg, teams] of Object.entries(T.teams))
    for (const t of teams.filter((t) => t.mgr === owner))
      for (const [slot, id] of t.pl) {
        if (!ps[id]) ps[id] = [];
        ps[id].push(lg);
      }
  return `<div class="exposure-list">${Object.entries(ps)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([id, lgs]) => {
      const p = T.players[id];
      return p
        ? `<div>${photo(p.n)}<div><b>${esc(p.n)}</b><small>${p.p} · ${p.t}</small></div><div class="exposure-leagues">${lgs.map((lg) => `<a href="#league-${lg}/team">${img(headliner(lg).leagueLogo, "", leagues[lg])}<span>${leagues[lg]}</span></a>`).join("")}</div><strong>${lgs.length}<small>${lgs.length === 1 ? "league" : "leagues"}</small></strong></div>`
        : "";
    })
    .join("")}</div>`;
}
function studio() {
  if(!CFNData.state.resources) return globalHero("Studio", "Loading league records…");
  return (
    globalHero(
      "Made to be shared.",
      "A quieter canvas for your matchups, league stories, and awards.",
    ) +
    `<div class="filter-row"><label for="studio-league">League</label><select id="studio-league">${Object.entries(
      leagues,
    )
      .map(([k, v]) => `<option value="${k}">${v}</option>`)
      .join(
        "",
      )}</select><label for="studio-template">Template</label><select id="studio-template"><option value="matchup">Matchup</option><option value="award">League award</option></select></div><div class="studio-grid"><div id="studio-canvas">${studioCard("gl", "matchup")}</div><aside class="note-card"><div class="eyebrow">CFN Studio</div><h3>The essentials, beautifully arranged.</h3><p>The league, the teams, the score, and the story. Consistent typography carries through from the website to the share card.</p><p style="margin-top:20px">Switch the league or template to explore. Download a PNG to review or share. Publishing stays under your control.</p><button class="pill" id="studio-export">Download PNG</button><a class="resource-link" href="https://cuadzfantasynetwork.com/l/studio.html" target="_blank" rel="noopener">Open the full Studio ↗</a><p class="subnote" id="export-status" role="status"></p></aside></div>`
  );
}
function studioCard(k, type) {
  const c = headliner(k),
    a = T.awards[k]?.[0];
  return `<div class="studio-card"><div class="studio-brand">${img(S.logo)}<span>${leagues[k]}</span></div>${type === "award" && a ? `<div class="studio-award"><span class="trophy">♛</span><div class="eyebrow">${a.weeks} · 2026</div><h2>Mr. ${a.month}</h2><h3>${a.team}</h3><p>${a.mgr} · ${a.rec} · ${a.pf} points</p></div>` : `<div class="eyebrow">Week ${c.week || 11} · Head to head</div>${scores(c)}${probability(c)}<div class="studio-starters">${rows({ ...c, rows: c.rows.slice(0, 5) })}</div><p class="subnote">Featured starters · ${esc(feedNote(c))}</p>`}<div class="studio-signature">CUADZ FANTASY NETWORK</div></div>`;
}
function pickem() {
  return (
    globalHero(
      "Make your call.",
      "The network’s weekly picks, in their own space.",
    ) +
    `<div class="editorial"><article class="story"><div class="eyebrow">Pick’em</div><h2>Who have you got?</h2><p>Choose your winners, follow the leaderboard, and keep the rivalry going.</p><a class="pill" href="https://cuadzfantasynetwork.com/l/pickem.html" target="_blank" rel="noopener">Open Pick’em ↗</a></article><aside class="note-card"><h3>Your picks stay protected.</h3><p>The existing submission, deadline, and leaderboard flow remains in place. Use the original tool to submit your picks.</p></aside></div>`
  );
}
function archive() {
  return (
    globalHero(
      "The weekly editions.",
      "The stories, results, and rivalries that make this network yours.",
    ) +
    `<div class="history-grid">${[10, 9, 8, 7, 6, 5, 4, 3].map((w) => `<a class="note-card" href="https://cuadzfantasynetwork.com/l/week-${w}-recap.html" target="_blank" rel="noopener"><div class="eyebrow">2026 · Network archive</div><h3>Week ${w}</h3><p>Read the full edition ↗</p></a>`).join("")}</div>`
  );
}

function commish() {
  return (
    globalHero(
      "Commissioner tools.",
      "Your existing tools and data remain intact.",
    ) +
    `<article class="note-card"><h3>Open the secure workspace.</h3><p>The original commissioner workspace retains its current access protection. It is intentionally outside the main navigation.</p><a class="resource-link" href="https://cuadzfantasynetwork.com/l/commish-tools.html" target="_blank" rel="noopener">Open commissioner tools ↗</a></article>`
  );
}
function render(keepScroll = false, skipLoad = false) {
  const hash = location.hash.slice(1) || "network";
  const m = hash.match(/^league(?:-(gl|bh|rb|sts))?(?:\/([a-z]+))?$/);
  let page = m
    ? "league"
    : moreNames[hash]
      ? hash
      : ["market","updates"].includes(hash)
        ? hash
        : "network";
  if (m) {
    league = m[1] || league;
    leagueTab = m[2] && names[m[2]] ? m[2] : "overview";
    if (!available(leagueTab)) leagueTab = "overview";
  }
  document.querySelector("#main").innerHTML =
    page === "league"
      ? leaguePage()
      : page === "network"
        ? network()
        : page === "updates"
          ? CFNUpdates.page()
          : page === "market"
          ? market()
          : page === "exposure"
            ? exposure()
            : page === "studio"
              ? studio()
              : page === "pickem"
                ? pickem()
                : page === "archive"
                  ? archive()
                  : commish();
  document.querySelectorAll("nav>a").forEach((a) => {
    const active = a.hash === "#" + page;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document
    .querySelector("#more-menu")
    .classList.toggle("selected", !!moreNames[page]);
  document
    .querySelectorAll("details.more-nav")
    .forEach((d) => (d.open = false));
  document.querySelector("#leagues-menu").classList.toggle("selected",page === "league");
  document.querySelector("#share-page").hidden = page === "commish";
  document.title = `CFN · ${page === "league" ? leagues[league] + " · " + names[leagueTab] : moreNames[page] || page}`;
  if (!keepScroll) window.scrollTo(0, 0);
  if (!skipLoad) loadRoute(page);
}
// A single route handler owns navigation.
window.addEventListener("hashchange", () => render());
async function loadRoute(page) {
  const generation = ++routeGeneration;
  const jobs=[];
  if(page==="updates") jobs.push(CFNUpdates.load());
  if(page==="league" && ["power","fraud"].includes(leagueTab)) jobs.push(CFNData.loadPower(league));
  if(["league","exposure","studio"].includes(page)) jobs.push(CFNData.loadResources(league,page==="league" && leagueTab==="picks"));
  if(["network","market","studio"].includes(page) || (page==="league" && ["overview","lineups","team","standings","weekly"].includes(leagueTab))) jobs.push(CFNData.load(page,league,selectedWeek));
  await Promise.all(jobs);
  if(CFNData.state.resources) Object.assign(T,CFNData.state.resources.tools);
  if(generation===routeGeneration && !document.querySelector("#detail").open) render(true,true);
}
document.addEventListener("change", (e) => {
  if (e.target.id === "matchup-week") {
    selectedWeek = Number(e.target.value);
    render(true);
  }
});
// Do not reset forms, scrollable tables, or dialogs during background refresh.
setInterval(() => {
  if (
    document.visibilityState === "visible" &&
    !document.querySelector("#detail").open &&
    !document.querySelector("details[open]") &&
    (location.hash === "#network" ||
      !location.hash ||
      /league.*(?:overview|power|fraud)$/.test(location.hash))
  )
    loadRoute(location.hash.includes("league") ? "league" : "network");
}, 60000);
function modal(title, body) {
  document.querySelector("#detail-body").innerHTML =
    `<div class="dialog-head"><span>${esc(title)}</span><button class="close" data-close aria-label="Close">×</button></div><div class="dialog-copy">${body}</div>`;
  document.querySelector("#detail").showModal();
}
function updateResources() {
  const sec = document.querySelector("#resource-group").dataset.section,
    g = document.querySelector("#resource-group").value,
    y = document.querySelector("#resource-season")?.value,
    q = document.querySelector("#resource-search").value.toLowerCase();
  document.querySelector("#resource-results").innerHTML = resourcesTable(
    resourceRows(sec).filter(
      (r) =>
        (g === "all" || r.group === g) &&
        (!y || r.season === y) &&
        r.title.toLowerCase().includes(q),
    ),
  );
}
function syncTheme() {
  const light = document.documentElement.dataset.theme === "light",
    b = document.querySelector("#theme-switch");
  b.innerHTML = light ? "☾ <span>Dark</span>" : "☀ <span>Light</span>";
  b.setAttribute(
    "aria-label",
    `Switch to ${light ? "dark" : "light"} appearance`,
  );
}
document.addEventListener("click", (e) => {
  if (e.target.closest("#theme-switch")) {
    const mode =
      document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = mode;
    try {
      localStorage.setItem("cfn-preview-theme", mode);
    } catch {}
    syncTheme();
  }
  const p = e.target.closest("[data-pick-team]");
  if (p) {
    const rs = resourceRows("Draft Picks").filter(
      (r) =>
        r.group === p.dataset.pickTeam &&
        r.title === "Round " + p.dataset.pickRound,
    );
    modal(
      p.dataset.pickTeam,
      `<h2>Round ${p.dataset.pickRound}</h2>${rs.map((r) => `<p>${esc(r.detail)}<br><span class="status-tag">${esc(r.value)}</span></p>`).join("")}`,
    );
  }
  document.querySelectorAll("#more-menu, #league-tools, #leagues-menu").forEach((d) => {
    if (!d.contains(e.target)) d.open = false;
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape")
    document.querySelectorAll("#more-menu, #league-tools, #leagues-menu").forEach((d) => {
      if (d.open) {
        d.open = false;
        d.querySelector("summary").focus();
      }
    });
});
document.addEventListener("change", (e) => {
  const id = e.target.id;
  if (id === "waiver-week")
    document.querySelector("#waiver-results").innerHTML = waiverRows(
      T.waivers[league].filter(
        (w) => e.target.value === "all" || w.week === Number(e.target.value),
      ),
    );
  if (["resource-group", "resource-season"].includes(id)) updateResources();
  if (id === "history-owner")
    document.querySelector("#h2h-results").innerHTML = h2h(e.target.value);
  if (id === "team-side")
    document.querySelector("#team-results").innerHTML = teamRoster(
      Number(e.target.value),
    );
  if (id === "exposure-owner")
    document.querySelector("#exposure-results").innerHTML = exposureRows(
      e.target.value,
    );
  if (id === "studio-league" || id === "studio-template")
    document.querySelector("#studio-canvas").innerHTML = studioCard(
      document.querySelector("#studio-league").value,
      document.querySelector("#studio-template").value,
    );
  if (e.target.matches("[data-trade-team]")) {
    const side = e.target.dataset.tradeTeam;
    document.querySelector("#trade-roster-" + side).innerHTML = tradeRoster(
      Number(e.target.value),
      Number(side),
    );
    document.querySelector("#proposal-summary").textContent =
      "Choose the assets each team would send.";
  }
  if (e.target.matches("[data-proposal]")) {
    const parts = [0, 1].map((i) => {
      const ts =
        T.teams[league][document.querySelector("#trade-team-" + i).value];
      const selected = [
        ...document.querySelectorAll(`[data-proposal="${i}"]:checked`),
      ].map((x) => x.value);
      return `<div><b>${esc(ts.team)} sends</b><p>${selected.length ? selected.map(esc).join(", ") : "No assets selected"}</p></div>`;
    });
    document.querySelector("#proposal-summary").innerHTML =
      parts.join("") + "<small>Local draft only · No proposal sent</small>";
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "resource-search") updateResources();
});
syncTheme();
render();

document.addEventListener("click", (e) => {
  const r = e.target.closest("[data-roster]");
  if (r) {
    const c = currentCards(league).find((c) =>
      c.teams.some((t) => t.id === Number(r.dataset.roster)),
    );
    if (c) {
      const choices = rosterChoices();
      const index = choices.findIndex(
        (v) => v.t.id === Number(r.dataset.roster),
      );
      modal(
        c.teams.find((t) => t.id === Number(r.dataset.roster)).name,
        teamRoster(index),
      );
    } else
      modal(
        "Roster unavailable",
        "<p>This team’s lineup has not loaded for the selected week.</p>",
      );
  }
});
