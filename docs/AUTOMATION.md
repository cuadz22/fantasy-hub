# What keeps itself up to date, and what still needs a human

Nothing here needs your computer to be on. Everything marked "automatic" runs on Vercel (server cron) or in each visitor's browser.

## Automatic (no action needed)

| Item | How it updates | How often |
|---|---|---|
| Lineups, matchups, scores, projections (all four leagues) | Visitor's browser reads `/api/lineups`, which reads Yahoo's public team pages. Every lineup is re-optimised and started players are locked. | On every page open, then every 90 seconds while open (edge cache 20 to 60 s) |
| Win odds and win-probability swings | Same feed; swing history is stored in Upstash KV during games | Every 90 seconds during games |
| Market values (`/api/hw?market=1`) | Read server-side from the public value feeds, sanity-checked, edge-cached | Every 30 minutes |
| Market history (`/api/hw?snap=1`) | Vercel cron appends one snapshot of every player's value | Daily at 09:17 UTC |
| Market Movers | Computed in the browser: today's live value vs the snapshot from about 7 days ago (5 to 10 day window), blended with the site's own weights. Falls back to the last baked list if history is too short. | Every page open |
| Road to the Playoffs (records, odds, byes, seeds, remaining schedule, best lineups, "games left") | Rebuilt in the browser from the live Yahoo feed: baked base through Week 9, plus Week 10 results, plus 6,000 simulations over the remaining weeks (11 to 14 now). Re-runs at most every 10 minutes. | Every page open |
| Commish player cards: stats, usage, season/last-3 averages, game log, remaining schedule | After unlock, the browser calls `/api/live-stats?pw=1` (nflverse weekly box scores; games that are Final but not yet in nflverse come from BallDontLie box scores and are tagged LIVE). Fresh weeks are merged over the Week 9 snapshot and finished games drop out of the upcoming schedule. | On open, then every 5 minutes (edge cache 3 min, nflverse cache 10 min) |
| New site builds reach visitors | The service worker opens the saved copy instantly, checks for a newer build in the background, and reloads once if the build changed. | Every visit |

## Weekly checklist (Tuesday, after Monday Night Football; about 20 minutes)

1. **Roll the week constants** in `client/public/cfn.html`: `DONE`, `NEXT`, `PVL_WK`, and the baked records base (`B0`) so it includes the week just finished. Road and the preview read these.
2. Update weekly editorial content: recap articles, the "Week N" home card, headline text, waivers report, trade log.
3. Run `node client/scripts/check-site.mjs`, commit, push (GitHub Desktop), open the live site and spot-check Home, a league preview, Road to the Playoffs and Market Movers.
4. Podcast deck: build from the site's own data (not automated).

## Schedule

| When | What |
|---|---|
| Tuesday evening | Weekly checklist above |
| Thursday before kickoff | Check that the preview lineups still look right after waivers (they refresh by themselves; look only for new waiver pickups showing as expected) |
| Sunday morning | Quick look at injuries and inactives on the preview (auto-refreshing) |
| Daily | Nothing; the market snapshot cron runs by itself |

## Limits

- Commish defense-vs-position tables (soft/tough matchup colors), startable cutoffs and trade values are still the baked snapshot; only player stats, usage, averages, game log and remaining schedule are live.

- Vercel Hobby crons run at most once a day and the function cap is 12 (currently at 12), so new routes go inside `api/hw.js` as underscore modules.
- Scheduled tasks in the cloud cannot push to GitHub, so the week rollover in step 1 stays a manual commit until the constants are derived from the calendar.

## Kickers and defenses (waivers)

| What | How it stays current |
|---|---|
| Who owns each kicker and defense | Read live from the Yahoo lineups on every page load and every 90 seconds (bench and IR included, names matched by last name plus first initial). Nothing is baked. |
| Kicker and defense rankings | Week 11 uses the hand-supplied charts. From Week 12 on the Waiver wire and Weekly ranks tabs read the K and DEF lists in the weekly-ranks feed (`/api/hw`) as soon as they appear, and say "waiting" until they do. |
| Yahoo defense and kicker projections, Vegas lines | Still a baked snapshot (the Yahoo API app is not authorized, so nothing can read projections server-side). The week columns roll forward automatically; the as-of date is shown. |
