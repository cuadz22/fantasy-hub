/* Read-only presentation adapter. Scoring, probabilities, and official records
   remain owned by the existing backend. No credentials or mutations here. */
(function (root) {
  const leagues = ["gl", "bh", "rb", "sts"];
  const cache = new Map(),
    pending = new Map();
  const state = {
    resources: null,
    portraits: {},
    teamColors: {},
    photoIDs: {},
    named: {},
    picks: {},
    power: {},
    context: null,
    lineups: {},
    standings: {},
    market: null,
    media: null,
    failures: {},
  };
  async function read(path, ttl = 60000) {
    const cached = cache.get(path);
    if (cached && Date.now() - cached.at < ttl) return cached.value;
    if (pending.has(path)) return pending.get(path);
    const job = (async () => {
      const response = await fetch(path, {
        credentials: "omit",
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok)
        throw new Error(`Feed unavailable (${response.status})`);
      const value = await response.json();
      cache.set(path, { value, at: Date.now() });
      return value;
    })();
    pending.set(path, job);
    try {
      return await job;
    } finally {
      pending.delete(path);
    }
  }
  const finite = (n) => typeof n === "number" && Number.isFinite(n);
  function validateContext(c) {
    if (
      !Number.isInteger(c.currentWeek) ||
      c.currentWeek < 1 ||
      c.currentWeek > 18 ||
      !Number.isInteger(c.season) ||
      !Array.isArray(c.availableWeeks)
    )
      throw new Error("Invalid season context");
    return c;
  }
  function validateLineups(d, lg, week) {
    if (
      d.lg !== lg ||
      d.week !== week ||
      !Array.isArray(d.matchups) ||
      !d.matchups.length
    )
      throw new Error("Wrong league or week");
    const seen = new Set();
    for (const m of d.matchups) {
      if (
        !Array.isArray(m.L) ||
        !Array.isArray(m.R) ||
        !Array.isArray(m.ya) ||
        !Array.isArray(m.yb) ||
        !m.an ||
        !m.bn
      )
        throw new Error("Incomplete matchup");
      if (
        [...m.L, ...m.R].some(
          (r) =>
            !Array.isArray(r) ||
            r.length < 7 ||
            typeof r[1] !== "string" ||
            (r[4] != null && !finite(r[4])) ||
            (r[5] != null && !finite(r[5])),
        )
      )
        throw new Error("Malformed player row");
      for (const id of [m.ia, m.ib]) {
        if (!Number.isInteger(id) || id < 1 || seen.has(id))
          throw new Error("Invalid team identity");
        seen.add(id);
      }
    }
    return d;
  }
  function validateStandings(d, lg, context) {
    if (
      d.leagueId !== lg ||
      d.season !== context.season ||
      d.currentWeek !== context.currentWeek ||
      d.throughWeek !== Math.min(context.currentWeek - 1, 14) ||
      !Array.isArray(d.rows) ||
      !d.rows.length
    )
      throw new Error("Standings do not match the completed week");
    if (d.rows.some((r) => r.wins + r.losses + r.ties !== d.throughWeek))
      throw new Error("Incomplete official records");
    return d;
  }
  function athlete(row, photos) {
    if (!row) return { name: "", game: "", score: "—", proj: "—" };
    const bye = /\bbye\b/i.test(row[6] || "");
    return {
      name: row[1],
      position: row[2],
      game: row[6] || "",
      photo: photos[row[1]],
      nflTeam: row[3],
      score: bye ? "BYE" : finite(row[5]) ? row[5].toFixed(2) : "—",
      proj: bye ? "—" : finite(row[4]) ? row[4].toFixed(2) : "—",
    };
  }
  function hasStarted(status) {
    return /\b(final|halftime|half|[1-4](?:st|nd|rd|th)?\s*(?:q|quarter)|q[1-4]|ot|overtime)\b/i.test(String(status||''));
  }
  function cards(lg, snapshot, photos) {
    const d = state.lineups[lg];
    if (!d) return [];
    return d.matchups.map((m) => {
      const starters = (side) =>
        side.filter((r) => !["BN", "IR", "IR+"].includes(r[0]));
      const namedTeams = state.named[lg]?.week === d.week ? state.named[lg].matchups.find(x=>x.teams.some(t=>t.teamId===m.ia)&&x.teams.some(t=>t.teamId===m.ib))?.teams : null;
      const enriched = (row,id) => { const a=athlete(row,photos); const n=namedTeams?.find(t=>t.teamId===id)?.lineup.find(p=>p.name===row?.[1]&&p.slot===row?.[0]); return {...a, photo:n?.photoURL || a.photo, playerId:n?.playerId, originalProjection:n?.originalProjection, projectionDirection:hasStarted(row?.[6]) && n && Number.isFinite(n.originalProjection) && Number.isFinite(n.liveProjection) ? n.liveProjection > n.originalProjection+0.05 ? "up" : n.liveProjection < n.originalProjection-0.05 ? "down" : "" : ""}; };
      const left = starters(m.L),
        right = starters(m.R);
      const teams = [0, 1].map((i) => {
        const id = i ? m.ib : m.ia,
          name = i ? m.bn : m.an,
          totals = i ? m.yb : m.ya;
        const media = state.media?.teams?.[lg]?.[id];
        const saved = snapshot.teams.find(
          (t) => t.name.toLowerCase() === name.toLowerCase(),
        );
        const record =
          (d.week === state.context?.currentWeek
            ? state.standings[lg]?.rows.find((r) => r.teamId === id)?.record
            : "") || "";
        // Match the app's forecastPace presentation; keep provider totals intact.
        const active = (i ? right : left).filter(
          (r) => !/\bbye\b/i.test(r[6] || ""),
        );
        const originalProjections = active.map(r => namedTeams?.find(t=>t.teamId===id)?.lineup.find(p=>p.name===r[1]&&p.slot===r[0])?.originalProjection);
        const baseline = originalProjections.length && originalProjections.every(finite)
          ? originalProjections.reduce((sum, value) => sum + value, 0) : null;
        const delta =
          baseline != null && finite(totals[1]) ? totals[1] - baseline : 0;
        return {
          projectionDirection:
            active.some(r=>hasStarted(r[6])) ? delta > 0.05 ? "up" : delta < -0.05 ? "down" : "" : "",
          id,
          name,
          owner: media?.managerName || saved?.owner || "",
          logo: media?.logoURL || saved?.logo || "",
          record,
          score: finite(totals[0]) ? totals[0].toFixed(2) : "—",
          projection: finite(totals[1]) ? totals[1].toFixed(2) : "—",
          odds: "",
        };
      });
      const p = m.winProbability;
      const prob =
        p?.homeTeamId === m.ia &&
        p?.awayTeamId === m.ib &&
        finite(p.homePercent) &&
        p.homePercent >= 0 &&
        p.homePercent <= 100
          ? p.homePercent
          : null;
      return {
        league: lg,
        id: `${lg}-${m.ia}-${m.ib}`,
        week: d.week,
        leagueLogo: snapshot.leagueLogo,
        teams,
        rows: Array.from(
          { length: Math.max(left.length, right.length) },
          (_, i) => ({
            slot: left[i]?.[0] || right[i]?.[0],
            left: enriched(left[i], m.ia),
            right: enriched(right[i], m.ib),
          }),
        ),
        prob,
        current: true,
        final: !!d.final,
        stale: !!d.stale || !!d.partial,
        stamp: d.sourceUpdatedAt,
      };
    });
  }
  async function capture(key, action) {
    try {
      await action();
      delete state.failures[key];
    } catch (error) {
      state.failures[key] = error.message;
    }
  }
  function validateResources(d) {
    if(d.schemaVersion !== 1 || d.season !== 2026 || !/^[a-f0-9]{64}$/.test(d.sourceVersion) || !d.tools?.draftSeasons || !Array.isArray(d.tools.resources)) throw Error("Invalid resource contract");
    return d;
  }
  function validatePicks(d, lg) {
    const rounds = {bh:16, rb:17}[lg];
    if(!rounds || d.lg !== lg || !Array.isArray(d.rows) || d.rows.length !== rounds || d.rows.some(r=>!Array.isArray(r)||r.length!==12||r.some(id=>!Number.isInteger(id)||id<1||id>12))) throw Error("Invalid pick ledger");
    if(lg==='bh' && d.rows.slice(14).some(r=>r.some((id,i)=>id!==i+1))) throw Error("Keeper picks cannot be traded");
    return d;
  }
  async function loadPresentation() {
    await Promise.all([
      capture("portraits",async()=>{state.portraits=await read("/redesign/portraits.json",3600000);}),
      capture("photoIDs",async()=>{state.photoIDs=await read("/redesign/player-photo-ids.json",3600000);}),
      capture("teamColors",async()=>{state.teamColors=await read("/redesign/team-colors.json",3600000);})
    ]);
  }
  async function loadResources(lg, picks=false) {
    const jobs=[loadPresentation(),capture("resources",async()=>{state.resources=validateResources(await read("/api/mobile/resources",60000));})];
    if(picks) jobs.push(capture("picks-"+lg,async()=>{state.picks[lg]=validatePicks(await read("/api/trades?lg="+lg,60000),lg);}));
    await Promise.all(jobs);
  }
  function validatePower(d, lg, context) {
    validateStandings(d, lg, context);
    if(d.schemaVersion!==1 || d.modelVersion!=='cfn-earned-performance-v2' || d.rows.length!==12 ||
       new Set(d.rows.map(r=>r.teamId)).size!==12 || d.rows.some((r,i)=>
       !Number.isInteger(r.teamId)||r.teamId<1||r.teamId>12||r.rank!==i+1||
       !finite(r.score)||r.score<1||r.score>99||!finite(r.allPlayWinPercent)||
       r.allPlayWinPercent<0||r.allPlayWinPercent>100||!finite(r.luckWins))) throw Error('Invalid power rankings');
    return d;
  }
  async function loadPower(lg) {
    await capture('power-'+lg,async()=>{
      const ctx=validateContext(await read('/api/mobile/context',60000));
      state.context=ctx;
      state.power[lg]=validatePower(await read('/api/mobile/power?lg='+lg,60000),lg,ctx);
    });
  }
  async function load(page, lg, selectedWeek) {
    await capture("context", async () => {
      state.context = validateContext(
        await read("/api/mobile/context", 300000),
      );
    });
    const ctx = state.context;
    if (!ctx) return;
    const week = selectedWeek || ctx.currentWeek;
    if (!ctx.availableWeeks.includes(week)) return;
    const ids =
      page === "network" || page === "studio"
        ? leagues
        : page === "league"
          ? [lg]
          : [];
    const jobs = [loadPresentation()];
    if (ids.length)
      jobs.push(
        capture("media", async () => {
          state.media = await read("/api/mobile/media", 3600000);
        }),
      );
    for (const id of ids) {
      jobs.push(
        capture("lineups-" + id, async () => {
          let d;
          try {
            const named=await read(`/api/mobile/lineups?lg=${id}&week=${week}`);
            d=validateLineups(fromNamed(named,id,week),id,week);
            state.named[id]=named;
          } catch {
            d=validateLineups(await read(`/api/lineups?lg=${id}&week=${week}`),id,week);
            delete state.named[id];
          }
          if (d.season !== ctx.season) throw new Error("Season mismatch");
          state.lineups[id] = d;
        }),
      );
      if (page === "league")
        jobs.push(
          capture("standings-" + id, async () => {
            state.standings[id] = validateStandings(
              await read(`/api/mobile/standings?lg=${id}`, 300000),
              id,
              ctx,
            );
          }),
        );
    }
    if (page === "market")
      jobs.push(
        capture("market", async () => {
          const d = await read("/api/mobile/market-movers", 900000);
          if (!Array.isArray(d.players))
            throw new Error("Invalid market response");
          state.market = d;
        }),
      );
    await Promise.all(jobs);
  }
  function fromNamed(n, lg, week) {
    if(n.schemaVersion!==2||n.season!==(state.context?.season||2026)||n.leagueId!==lg||n.week!==week||!Array.isArray(n.matchups)) throw Error('Wrong named lineup');
    return {lg, week, season:n.season, ...n.freshness, matchups:n.matchups.map(m=>{
      if(m.teams?.length!==2)throw Error('Incomplete named matchup');
      const [a,b]=m.teams, rows=t=>t.lineup.map(p=>[p.slot,p.name,p.position,p.nflTeam,p.liveProjection,p.points,p.gameStatus,p.injuryStatus]);
      return {ia:a.teamId,ib:b.teamId,an:a.name,bn:b.name,ya:[a.pointsToDate,a.yahooProjection],yb:[b.pointsToDate,b.yahooProjection],L:rows(a),R:rows(b),winProbability:m.winProbability};
    })};
  }
  const api = { fromNamed,
    state,
    load,
    cards,
    read,
    athlete,
    validateLineups,
    validateStandings,
    validateContext,
    loadResources, validateResources, validatePicks, loadPower, validatePower,
  };
  root.CFNData = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
