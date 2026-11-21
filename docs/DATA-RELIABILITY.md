# CFN live-data reliability

This change is a reliability foundation and a live BALLDONTLIE comparison pipeline.
It does **not** claim that a custom scoring replacement is ready for members.
Website markup, styling, user assignments, email authentication, and roster editing are unchanged.

## Ownership / deployment

One implementation owner: Codex, branch `codex/data-reliability`. Do not implement a competing scoring pipeline in Claude while this work is being verified. Future website work must start from the updated main branch. Run `npm run test:reliability` and `npm run build --prefix client` before every backend release.

Deployment project: `fantasy-hub`, team `cuadz-fantasy-network`, root directory `client`.
Stage using production configuration without assigning the public domain, check the exact deployment, then promote it. Keep the prior deployment for rollback. Never print or commit secrets.

## Jobs

All jobs require `CRON_SECRET` or the separate server-only `MOBILE_OPERATIONS_KEY` used for deployment checks. Vercel supplies CRON_SECRET to scheduled requests. Missing secrets fail closed.

- `/api/mobile/cron`: calendar/scoreboard every minute, with a second pass during games.
- `/api/mobile/cron-lineups?lg=gl|bh|rb|sts`: four independent minute schedules. Each has its own 80-second ownership lease and a bounded Yahoo scraper. During games one refresh per minute; outside games every five minutes.
- `/api/mobile/cron-ball`: paid-provider games, cumulative player stats, team stats and all play pages. Independent of Yahoo and viewers. Two passes during live windows when the time budget allows. Final-game stats are revisited hourly for corrections.
- `/api/mobile/cron-maintenance`: historical/upcoming weeks every five minutes, one league-week per run. Recent final weeks rechecked daily for Yahoo corrections.
- `/api/mobile/cron-portraits`: player ID/portrait metadata every six hours; cannot delay roster jobs.

Stored feeds never trigger a scrape, even on a cache miss. Explicit weeks remain readable if the calendar is unavailable. Complete snapshots replace complete snapshots; partial or failed retrievals retain the last good record and its original timestamp. Writes require an acknowledgement. Failures are kept separately so a late error cannot roll back scores. Active snapshots and completed weeks are backed up to private Blob storage, with restore fallback. Clock, score and possession use the same scoreboard observation.

`sourceUpdatedAt` currently means **the time CFN successfully observed the source**, not a provider-guaranteed event revision time. `bdl.game.updated_at` is not used as proof that every stat is current. A stale saved score remains marked stale.

## BALLDONTLIE and scoring

Raw snapshots are stored at `bdl:2026:<week>:game:<gameId>`. A failed page, repeated cursor, timeout, wrong game or incomplete final game cannot replace the prior snapshot. Scores are recomputed from cumulative observations, never incremented blindly per play.

Comparisons: `bdl:2026:<week>:comparison:<league>`. Matching requires normalized name **and** position **and** NFL team and exactly one candidate; ambiguous/missing identities remain unresolved. Every comparison records the provider ID, roster observation time, stats observation time, rules version and missing categories. Defense/kicker categories are explicitly unvalidated. Nothing automatically switches to BALLDONTLIE scores just because a subtotal matches Yahoo.

Actual Yahoo settings were captured in `docs/scoring/yahoo-settings-*.txt` from the public settings pages for leagues 101813, 100398, 101720 and 101814 on 2026-11-21. Important examples: passing-yard bonus begins at 325; Rebirth has both 40+ reception and 40+ receiving-TD bonuses; kickers earn field-goal yardage points. The old fitted 300-yard model must not be used as the new scoring specification.

Remaining release gates for replacing Yahoo fantasy points:
1. Complete and validate two-point conversions, offensive fumble TDs, long receptions/TDs, kicker yardage, all D/ST events and Yahoo's points-allowed exclusions.
2. Verify null/absent stat semantics, canceled plays and stat corrections against event fixtures. No guessed zeros for unverified categories.
3. Persist confirmed player mappings and roster changes/lock-time evidence. A Yahoo snapshot proves what CFN observed, not that no lineup change happened between polls.
4. Replay completed weeks across all leagues, with exact player and team totals, bench/IR exclusion and unusual-scoring fixtures.
5. Observe an actual live window: latency from provider observation to published feed and app rendering, Yahoo comparison drift, roster freshness and provider failures. Static tests cannot establish a Sunday latency guarantee.
6. Only then enable a deliberately reviewed scoring source transition, with immediate rollback. Until then Yahoo remains the fantasy-score authority.

The current Yahoo league-ID configuration is explicitly the 2026 season. Reconfigure IDs and migrate the legacy `mw:*` keys before a new season; do not reuse them silently.

## Operations / checks

`GET /api/mobile/health` (operations bearer required) reports calendar staleness, each league's age/partial status/backup timestamp, last job outcomes and BALLDONTLIE comparison coverage. Job failures return HTTP 503 and emit structured error events. This provides observability, not an external paging service; alerts must be connected before claiming unattended incident response.

Offline suite includes storage failure, partial lineup retention, lock ownership, no-calendar explicit reads, unauthorized cron, pagination failure, 429 backoff, malformed stats, canceled requests, failed snapshot retention and exact scoring thresholds. Existing email/session/member-authorization tests remain required. `tools/check-deployment.cjs` verifies public endpoint contracts and all four leagues read-only.
