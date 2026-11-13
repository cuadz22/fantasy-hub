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

## Other docs
- `docs/power-rankings-formula.md` documents the power rankings formula. `tools/lineups/` holds earlier lineup tooling.
