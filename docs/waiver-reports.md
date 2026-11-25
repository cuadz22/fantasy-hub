# Automated CFN waiver reports

Core leagues: Gentlemen's League (101813), Beaners & Husseins (100398), Rebirth (101720), Shoot the Shits (101814). Fantasy Ball Z retains its independent existing transaction scan.

- Vercel `/api/mobile/cron-waivers` invokes at UTC hours 10–17. An America/New_York gate runs the actual scan at **06:00 Eastern every day**, plus **07:00–12:00 Eastern on Wednesdays**, automatically handling DST. Off-window invocations do not fetch Yahoo.
- Only authenticated cron requests may run it. `?force=1` permits a deliberate recovery outside the normal window; successful scans are still cached for 30 minutes.
- Read-only public Yahoo transaction pages, successful Waiver additions only. Excludes free agents, drops and unsuccessful bids. Winning amounts are sourced, never guessed. Existing manually recorded losing-bid details are retained.
- Uses CFN's existing Tuesday 03:00 Eastern calendar to assign the current week; never advances that calendar. Requires the published context to agree before scanning.
- Up to four pages per league per scan; must reach a transaction from a prior week or the end of pagination. Incomplete pages, wrong league, unknown team, source/login errors, future dates, or insufficient pagination fail without replacing confirmed reports or freshness.
- Per-league durable keys `waiver-reports:v1:2026:{league}` avoid interfering with trade/can't-cut writes. Each league succeeds independently. Failed leagues are listed in the protected `mj:health:waivers` job record and retried next scheduled window.
- Resources and Network feed consume the same saved claims; viewers never trigger a Yahoo scan. Existing app versions use the unchanged resource/report shapes, with additive metadata only.
- One report ID per league/season/week. Each claim deduplicates by timestamp, recipient team ID and player. Re-scans update the same edition. Initial recovery is silent; future editions use the existing opt-in, member-scoped, per-device notification deduplication.
- No changes to scoring, lineups, authentication, official/projected standings, touchdown collection or app builds.

Checks: `node tools/test_waivers.js`, `node tools/test_connected_updates.js`, `node tools/test_league_updates.js`, `node tools/test_network_events.js`, `node tools/test_touchdowns.js`, `node tools/test_mobile_auth.js`, `node tools/test_mobile_data.js`, `node tools/test_week_rollover.js`, `node tools/test_read_efficiency.js`, `node tools/resources/test.cjs`. Live verify `/api/mobile/resources` and `/api/mobile/network-preview` include the same claim counts and one Week 12 edition per core league.
