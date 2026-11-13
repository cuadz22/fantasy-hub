# Cuadz Fantasy Network (CFN) — project memory

Read this first in any new session or after a conversation compaction. Conversations get summarized and details get lost; this file and `docs/RUNBOOK.md` are the durable source of truth. Update them whenever something non-obvious is decided or built.

## What it is
A single-file website, `client/public/cfn.html` (about 8 MB, all CSS/JS/data inline), repo `cuadz22/fantasy-hub`. Owner: Cuadz. It covers four Yahoo leagues (a fifth, Fantasy Ball Z, is not yet on the site's matchup views).

| key | league | Yahoo league id | Cuadz team id | Cuadz team name |
|---|---|---|---|---|
| gl | Gentlemen's League | 101813 | 1 | cuadz build 001 |
| bh | Beaners & Husseins | 100398 | 1 | cuadz build 002 |
| rb | Rebirth | 101720 | 1 | cuadz build 003 |
| sts | Shoot the Shits | 101814 | 1 | cuadz build 004 |
| fb | Fantasy Ball Z | 697400 | 12 | cuadz build 005 |

League display order everywhere: GL, B&H, Rebirth, STS.

## Standing rules from the owner
- Ignore Yahoo's changed opponent manager names for John and Pru. Keep the existing manager names (PV8). "They're still the same people."
- Never commit the other ~230 untracked files in the repo working tree. Only `client/public/cfn.html` (and docs/tools) get committed.
- Never put the Commish PIN, API keys, or tokens in the repo, chat summaries, or the page. The Commish tool data is an encrypted blob (`CM_BLOB`); `tools/dec.py` reads the PIN from env var `CFN_COMMISH_PIN`.
- Revoke the old GitHub tokens (still open).
- Do not bypass the Cowork `git push` block (see RUNBOOK).
- Don't leave browser tabs open after scraping; close the ones created. (One of the user's own X-search tabs was accidentally navigated to the STS Yahoo page earlier and not restored.)

## Page structure (home view `#view-home`)
Week header badge ("Week 10 Live"), podcast bar, "This Week" featured article (Week 9 Recap & Week 10 Preview, `showArticle(9)`), **Week 10 Matchups live card** (`#live-card-wrap`, `showLive()`, hash `#live`, auto-hides when no matchup is undecided), Road to the Playoffs card (`showRoad()`, hash `#road=<lg>`), league cards. League pages have tabs: Standings, Matchups, Weekly Preview, Power Rankings, Fraud Meter, Awards, Waivers, Trades, History, All-Time Ranks, Rulebook, Share link. Other top-level views: Market Analysis, Studio, Pick'em, Commish Tools (PIN-protected).

## Matchup card machinery (the part that gets lost most)
- `PV8` = pregame data per league. `PVX` = pregame extras (primetime flag `pt`, per-game averages). Pair keys are `ia-ib` (Yahoo team ids): gl (1,8),(2,6),(3,4),(5,11),(7,9),(10,12); bh (1,10),(2,6),(3,4),(5,8),(7,9),(11,12); rb (1,7),(2,5),(3,11),(4,8),(6,12),(9,10); sts (1,10),(2,7),(3,5),(4,8),(6,9),(11,12).
- `PVL` = live data per league, one object per matchup: `a`,`b` = `[team name, manager, record, proj, lo, hi, top3]`; `p` = team A win %; `h2h`,`note`,`riv`; `pa`,`pb`; `ia`,`ib`; `ra`,`rb` = skill-position rows; `ka`,`kb` kicker; `da`,`db` defense; `ea`,`eb`; `left` = players still to play; `cl`; `la`,`lb` live score objects. `PVL_AT` = "as of" label text.
- Player row = `[slot, name, value, status(, proj)]`. Status: 4 live, 3 to play (value is the projection), 2 final (5th item = projection, used for the green/orange coloring), 0/1 auto.
- Live win probability: `p = Phi((projA - projB) / sqrt(sdA^2*fa + sdB^2*fb))`, `sd = (hi - lo) / 2.56` from PV8, `fa`/`fb` = fraction of each side's players still to play, clamped to 1–99.
- `wpCard(k,m,i,live)` renders a card; `wpFull` the expanded lineup; `wpCell(n,v,hi,al,nop,au,pj)` one player cell; `lgLive(p,k)` the "Week 10 · Live" section in a league's Matchups tab (shown while any matchup is undecided: `m.left>0 && !lvDec(m)`); `liveRender()` / `showLive()` the network-wide live page; `lvBanner`, `lvStandHtml`, `lvDec`, `lvLeft`.
- Style decisions (owner-approved): no green boxes around players; a small green "In play" tag for players not yet final; a muted "proj" label beside projected numbers; non-italic numbers; all numbers white; final players green (#acf910) if above projection, orange (#ff7a59) if below; ties, byes, and no-game rows stay white. Primetime cards keep the card-level lime outline and "Primetime Matchup" label, including in live view. A pulsing red LIVE pill (`.lv-pill`) sits beside live headings.

## Live data pipeline (manual today, to be automated)
1. Scrape each Yahoo matchup page (4 leagues x 6 matchups) with Claude-in-Chrome `browser_batch`: navigate, wait 4 s, run `tools/live_week10/ext2.js` via `javascript_tool` (output limit is about 2k characters, so it emits compact rows). `gen_batch.py` builds the batch.
2. Yahoo's matchup table: find the table whose first row has `children.length >= 15`. Left cell c[1], left proj c[4], left pts c[5], slot c[6], right pts c[9], right proj c[10], right cell c[13]. Skip slot "Total". Missing values are an en dash. Status comes from the last line of the player cell (Final -> F, live quarter -> L, No Game/Bye -> N, else U). Iframes are blocked and `fetch` returns an unhydrated shell, so the browser must render it. Yahoo's layout has changed between scrapes before; re-check it.
3. Paste results into `tools/live_week10/raw_<lg>.py` as `RAW[(lg, mid)] = """s1/s2/liveProjA/liveProjB##row||row..."""`. `mid1` (left team of each pair): gl 1,2,3,5,7,10; bh 1,2,3,5,7,11; rb 1,2,3,4,6,9; sts 1,2,3,4,6,11.
4. Run `tools/live_week10/build.py` -> `pvl10.json`. It resolves abbreviated Yahoo names against the Commish roster data (`C_dec.json`, produced by `tools/dec.py`; keep it out of the repo), kickers against `C['ks']`, drops "(Empty)" slots, maps slots `W/R/T -> FLX`, `Q/W/R/T -> SFX`.
5. Apply to the site (see RUNBOOK) by replacing `var PVL={...};` (regex lookahead `(?=var PVL_AT)`, since both sit on one line) and updating `PVL_AT`.
6. Test with Playwright (`tools/tests/`), then publish.

## Scoring
Career/season highs use each league's own Yahoo scoring (bonuses included) recomputed from Pro-Football-Reference game logs; kickers/defenses excluded; Rebirth's 40-yard reception bonus not counted. When the stats-feed automation is built, per-league scoring rules must be applied to raw stat lines so live points match Yahoo for each league.

## Planned: automated live stats
Free unofficial ESPN game summaries (live player box scores) first; BallDontLie NFL (~$10-40/mo) if flaky; nflverse for nightly corrections/history. A scheduled job (GitHub Actions or the host's cron, not a chat session) polls about once a minute on game days, applies league scoring, and writes JSON the site reads. Lineups still need a Yahoo scrape right before each kickoff window (Thu night, Sun 1pm, Sun 4pm, Sun night, Mon night). API keys go in the host's secret store only.

## Build history note
The site was assembled through a chain of scripted patches (`tools/ptpatch.py` applies asserted string replacements, `rep(old,new,cnt)`, to a base file). The repo's committed `cfn.html` is the current product. **Going forward, apply new patch blocks to the current `client/public/cfn.html`** (the old base chain `/tmp/lt/wv11/cfn_cm.html` is not in the repo and cannot be rebuilt from scratch), or just edit the file directly with exact-match replacements and syntax-check the inline scripts with `node --check`.

## Hosting and repo layout (verified from the repo, Nov 13)
- Hosted on **Vercel**, deploying from the GitHub repo `cuadz22/fantasy-hub` (`main`). Root `vercel.json`: build `npm run build` (runs the Vite client build), output `client/dist`, `/` redirects to `/cfn.html`, `/api/yahoo/:p` rewrites to `/api/yahoo-:p`, `/s/:id` share links, `/i/:id` share images, `/road/:lg` static road pages. Static files in `client/public/` (including `cfn.html`) are served as-is.
- Serverless functions live in `client/api/` (Node, CommonJS): `_yahoo.js` (shared OAuth + `yahooGet(path)` helper, admin-key check), `yahoo-login.js`, `yahoo-callback.js`, `yahoo-status.js`, `yahoo-leagues.js` (test endpoint, `?key=ADMIN_KEY`), `share.js`, `s.js`, `simg.js`, `pickem.js`, `trades.js`. So Yahoo OAuth code exists there but is NOT working (no API access granted); env vars live in Vercel project settings, never in the repo.
- `server/` (Express) and `extension/` (browser extension) are older/other pieces; `data/` holds trade log and encrypted waiver data; `shared/leagues.config.js` lists leagues.
- Vercel Hobby crons only run once a day, so live updates should come from the browser polling a cached serverless function (for example `client/api/live-*.js` with `Cache-Control: s-maxage=30`), not from a cron.

## Yahoo data access: facts (corrected Nov 13)
- **There is NO working Yahoo API access.** API access was requested weeks ago with no response; the OAuth code in `client/api/yahoo-*.js` was built but authorization fails and does not work. Do not plan around the Yahoo Fantasy API unless the owner says access was granted.
- All Yahoo data (lineups, live scores, projections, standings) comes from **scraping the Yahoo league pages inside the owner's own logged-in Chrome**, using the Claude-in-Chrome extension: `browser_batch` (navigate, wait 4 s) plus the `javascript_tool` running an extractor (`tools/live_week10/ext2.js`) that reads the rendered table and prints compact rows. That is the "random codes and numbers" the owner sees scroll by. It needs the owner's computer on with Chrome open and signed in to Yahoo; the cloud can't see private league pages.
- **All five leagues are publicly viewable (owner confirmed Nov 13).** A test fetch of `https://football.fantasysports.yahoo.com/f1/101813/matchup?week=10&mid1=1&mid2=8` from the cloud (WebFetch, no login) returned the full matchup table: team names, scores, live projections, and per-player lines with projections. So the **cloud can read Yahoo pages without the owner's computer**. Still unverified: whether a plain HTTP fetch from a Vercel/GitHub job (not my fetch tool) gets the same HTML, and whether Yahoo rate-limits or blocks datacenter IPs. Test that with a small probe before building on it. Do not use curl/other tools to bypass if a fetch is refused.
- Because of that, (older assumption, now partly superseded by public pages) anything that must run unattended cannot depend on Yahoo scraping. Lineup checks are only needed before each kickoff window (Thu night, Sun 1pm, 4pm, night, Mon night); after a player's game locks, only the stats feed matters.

## Live-stats automation: current thinking
- Live scoring source: BallDontLie NFL, GOAT plan (play-by-play `/nfl/v1/plays` is GOAT-only; `/nfl/v1/stats` needs ALL-STAR or higher). Key goes in the Vercel env var `BALLDONTLIE_API_KEY`. nflverse (free, nightly) is for corrections, history, and cross-checks. ESPN's free feed was checked and looked unreliable.
- Live projection model (to build): remaining projection = pregame proj x fraction of game clock left (3600 s), adjusted for injuries/game script; final estimate = points so far + remaining; win probability = Phi(diff of means / sqrt(sum of per-player variance x fraction remaining)). Compare against Yahoo's live projection (scraped) and back-test on nflverse play data.
- Hosting is Vercel Hobby: crons are daily only, so live data should come from the browser polling a cached serverless function.
- Unattended lineup checks need a plan that avoids needing the owner's computer open (see TODO).

## Unattended Yahoo lineup sweep (built Nov 13)
- Vercel Root Directory is `client/`, so functions are `client/api/*.js`. The site already has an Upstash Redis (KV) via env `KV_REST_API_URL`/`KV_REST_API_TOKEN` (see `client/api/s.js`); use it for stored sweep results.
- `client/api/_ysweep.js` reads a public Yahoo matchup page with a plain `fetch` (no login) and parses it. VERIFIED on GL Week 10 (17 + 16 players, 0 skipped). Raw server HTML differs from the Chrome-rendered DOM: lineup rows are `<tr>` with 11 cells (1 left player, 2 left proj, 3 left pts, 4 slot, 7 right pts, 8 right proj, 9 right player). Player name = anchor with class token exactly `name` (not `ysf-player-name`). Weather popups are small tables nested inside player cells and must be removed first or rows are cut short. Dashes are `&#8211;` entities. Team names/ids come from the anchors `/f1/<league>/<teamId>` (two distinct). The status text in each player cell carries the game's kickoff ("Sun 1:00 pm", "Mon 8:15 pm"), so kickoff times can be read from Yahoo itself.
- `client/api/yahoo-probe.js?lg=gl&week=10&mid1=1` returns the parsed lineups (diagnostic; remove later). WebFetch caches 15 min per URL, so add `&v=N` when testing.
- Plan: a `tick` endpoint called every minute during game windows by cron-job.org (free, supports 1-minute jobs and time zones; protect with a `CRON_SECRET` env var). The function decides whether to sweep: 5 minutes after each distinct kickoff (9:30 am, 1:00, 4:05/4:25 together at about 4:30, SNF, MNF, TNF 8:15 pm), Fri and Sat at noon and 6 pm, and every 5 minutes during live windows. It stores results in the KV for the live cards to read.
- Still to build: the tick/sweep endpoint with KV storage, converting sweep results into the PVL live-card shape (needs Yahoo team totals and live projections; not parsed yet), and a site-side reader. The `&#xe230;`-style icon entities in status text should be stripped.

## Other docs
- `docs/power-rankings-formula.md` documents the power rankings formula. `tools/lineups/` holds earlier lineup tooling.
