# CFN live-data reliability

The reliability foundation now includes guarded BALLDONTLIE scoring publication.
Verified fresh player/defense scores may replace Yahoo; ambiguous, stale, or unsupported entries retain Yahoo. This is a hybrid beta, not a guarantee of full provider coverage or zero downtime.
Website markup, styling, user assignments, email authentication, and roster editing are unchanged.

## Ownership / deployment

One implementation owner: Codex, branch `codex/ball-live-scoring`. Do not implement a competing scoring pipeline in Claude while this work is being verified. Future website work must start from the updated main branch. Run `npm run test:reliability` and `npm run build --prefix client` before every backend release.

Deployment project: `fantasy-hub`, team `cuadz-fantasy-network`, root directory `client`.
Stage using production configuration without assigning the public domain, check the exact deployment, then promote it. Keep the prior deployment for rollback. Never print or commit secrets.

## Jobs

All jobs require `CRON_SECRET` or the separate server-only `MOBILE_OPERATIONS_KEY` used for deployment checks. Vercel supplies CRON_SECRET to scheduled requests. Missing secrets fail closed.

- `/api/mobile/cron`: calendar/scoreboard every minute, with a second pass during games.
- `/api/mobile/cron-lineups?lg=gl|bh|rb|sts`: four independent minute schedules. Each has its own 80-second ownership lease and a bounded Yahoo scraper. During games one refresh per minute; outside games every five minutes.
- `/api/mobile/cron-ball`: paid-provider games, cumulative player stats, team stats and all play pages. Independent of Yahoo and viewers. Passes at approximately 0/15/30/45 seconds during live windows when the 52-second collection budget allows. Four games run concurrently; missed deadlines retain prior snapshots. Each pass publishes promptly, rather than waiting until the job ends. Final-game stats are revisited hourly for corrections.
- `/api/mobile/cron-maintenance`: historical/upcoming weeks every five minutes, one league-week per run. Recent final weeks rechecked daily for Yahoo corrections.
- `/api/mobile/cron-portraits`: player ID/portrait metadata every six hours; cannot delay roster jobs.

Stored feeds never trigger a scrape, even on a cache miss. Explicit weeks remain readable if the calendar is unavailable. Complete snapshots replace complete snapshots; partial or failed retrievals retain the last good record and its original timestamp. Writes require an acknowledgement. Failures are kept separately so a late error cannot roll back scores. Active snapshots and completed weeks are backed up to private Blob storage, with restore fallback. Clock, score and possession use the same scoreboard observation.

`sourceUpdatedAt` currently means **the time CFN successfully observed the source**, not a provider-guaranteed event revision time. `bdl.game.updated_at` is not used as proof that every stat is current. A stale saved score remains marked stale.

## BALLDONTLIE and scoring

Raw snapshots are stored at `bdl:2026:<week>:game:<gameId>`. A failed page, repeated cursor, timeout, wrong game or incomplete final game cannot replace the prior snapshot. Scores are recomputed from cumulative observations, never incremented blindly per play.

Computed entries: `bdl:2026:<week>:scores:<league>`. Confirmed identities: `bdl:2026:identities`. Matching requires normalized full name **and** position **and** NFL team and exactly one candidate; a provider-ID change blocks publication. D/ST maps by canonical NFL team. Names/slot membership still originate from Yahoo; every saved roster includes a fingerprint and bounded change-observation history. This is observed roster evidence, not proof of Yahoo's exact lock timestamp.

`_scoregame.js` recomputes offense, kicker field-goal yardage and XP, and custom D/ST categories from cumulative stats and complete play pages. Combined touchdown/conversion descriptions resolve exact unique player aliases within that team; they never assume the TD scorer also scored the conversion. Scoring events must reconcile to the provider's game score. Missing mandatory fields, contradictory event types, ambiguous conversions, unvalidated return/try cases, and out-of-sync box/play TD counts make entries ineligible. Rebirth long-catch attribution stays on Yahoo when fumble/lateral details cannot establish coverage. Unsupported kicker trick-play scoring also stays on Yahoo. Final Yahoo corrections take precedence over differing final-game provider totals.

Provider quirks discovered in real replays:
- Timeout/penalty score fields can retain pre-PAT totals, so scoring events are reconciled instead of adding every scoreboard delta.
- `total_points` disagreed with FG/XP counts for Evan McPherson in Week 10. Actual made-FG and XP events are verified instead.
- A Week 9 SF/LV interception-return TD has a `fumble-recovery-own` slug and an opposing quarterback participant. That contradictory game fails closed.
- Fumble recovery can occur within kickoff or reception/lateral events. Opponent cumulative losses cover those; fumble-touchback ambiguity triggers fallback.

Actual Yahoo settings: `docs/scoring/yahoo-settings-*.txt`. Rules version `yahoo-2026-11-21-v2`. Yahoo's defensive points-allowed rules are documented at https://help.yahoo.com/kb/SLN6442.html (all PATs count; safeties and specified defensive TD/try returns do not).

## Publication / rollback

Server-only Redis control `scoring:control:2026` contains mode (`shadow` or `guarded`), season, rulesVersion, explicit weeks and league IDs. No control record means Yahoo-only. Rollback is setting mode to `shadow`; no app update is required, and no Yahoo snapshots are overwritten. Public endpoints never accept a source-mode override.

Both `/api/lineups` and `/api/mobile/lineups` use the same publication boundary. `scoreSource` is `yahoo`, `mixed`, or `balldontlie`; per-player source/observation metadata and fallback reason counts are additive. Projections remain Yahoo projections. Before updating a team's total, the original starter sum must reconcile to Yahoo's official total. Bench/IR points are excluded. Invalid totals/duplicate starters preserve the whole Yahoo side.

Live stats older than 90 seconds or rosters older than 180 seconds cannot override Yahoo. Final snapshots expire for publication after two hours unless refreshed. Errors do not advance observation timestamps. The app may poll every 15 seconds; that is not a promise of 15-second end-to-end latency. Provider delay, network/CDN time and polling add latency.

Read-only paid-provider replay endpoint `/api/mobile/scoring-replay?week=W&game=ID` requires an operations/cron bearer and POST. Omitting `game` returns the season/week schedule; a game request must name a finished regular-season game. It is bounded, returns no secrets and never overwrites live snapshots.

## Scoring validation and remaining limits

Committed compressed fixtures include all 29 NFL games from Weeks 9/10, Yahoo roster snapshots for all four leagues, and Week 11 Thursday. `node tools/replay-scoring.cjs 9` (or 10) emits the comparisons. The initial release verifies 925 eligible starter entries exactly against Yahoo, retains 59 fallback entries (including no-stat players), and reconciles all 96 fantasy team totals with those fallbacks. Synthetic fault checks verify downward corrections, replay duplication, missing fields, stale providers, changed rosters, identity conflicts, source rollback, and both endpoint formats.

An actual live-game window still must establish observed latency, roster-change timing and recovery under real load. Unknown special-event patterns deliberately fall back; do not remove gates to inflate coverage. Team rosters still depend on periodic public Yahoo reads, and Yahoo remains the fallback/official final-score reconciliation source. This is not a complete replacement for Yahoo's league API.

The current Yahoo league-ID configuration is explicitly the 2026 season. Reconfigure IDs and migrate the legacy `mw:*` keys before a new season; do not reuse them silently.

## Operations / checks

`GET /api/mobile/health` (operations bearer required) reports calendar staleness, each league's age/partial status/backup timestamp, last job outcomes and BALLDONTLIE comparison coverage. Job failures return HTTP 503 and emit structured error events. This provides observability, not an external paging service; alerts must be connected before claiming unattended incident response.

Offline suite includes storage failure, partial lineup retention, lock ownership, no-calendar explicit reads, unauthorized cron, pagination failure, 429 backoff, malformed stats, canceled requests, failed snapshot retention and exact scoring thresholds. Existing email/session/member-authorization tests remain required. `tools/check-deployment.cjs` verifies public endpoint contracts and all four leagues read-only.
