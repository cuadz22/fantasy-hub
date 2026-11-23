# CFN app-first release process

The website and app are clients of the same server contracts. Presentation changes must not change season/week identity, official records, member assignments, or notification routing.

## Authoritative data

- `/api/mobile/context` supplies the NFL season and current week. Device dates, preview copy and standings do not choose the current week.
- Saved league/week results retain their explicit league and week. Official standings use completed weeks only. Projected standings are calculated separately and never persist over official results or advance the calendar.
- `/api/mobile/player-log` reads selected-league recorded points, with isolated cached Yahoo weekly enrichment for unrostered kickers/defenses. The app merges recorded results into slower box-score history. Missing raw stats remain unavailable; career records are not inferred from a partial season.
- Names must match along with position. Defense aliases also require the same NFL team. Missing records, byes, DNP, real zero and negative points remain distinct.
- The existing calendar, lineup, scoring and push jobs keep operating independently of page visits. Historical enrichment cannot publish live scores or modify those jobs.

The repository also schedules read-only live contract and six-position history checks hourly. GitHub Actions must remain enabled; failed runs are visible there and notifications follow the repository owner’s GitHub settings. Scheduled jobs can be delayed by GitHub and are not a substitute for real-time provider monitoring.

## Before each release

1. Run `npm run test:release` and `npm run build`. GitHub runs these tests for pushes and pull requests. Failures must be investigated before promotion; branch protection is not automatically enabled by this workflow.
2. Run Swift core tests, refresh-state checks, Simulator and device Release builds. Test the same shared UI on compact and expanded layouts; check meaningful changed interactions on a device.
3. Stage the production candidate without moving the live domain. Run `tools/check-deployment.cjs` and `tools/check-player-history.cjs` with `CFN_VERCEL_DEPLOYMENT` set to that exact deployment.
4. These gates cover week identity, historical weeks, official standings, power rankings, six-position latest-game coverage, older response fields, login protection and notification isolation/deduplication regressions. Real email delivery and push arrival still require device checks when those delivery paths change.
5. Promote only the verified candidate. Repeat the public checks, inspect job health/error logs, and retain the previous deployment for rollback.
6. Export TestFlight as internal-only and assign only CFN Personal Testing until Jose approves wider testing. Record build number, commit, deployment and outstanding limitations with each release.

A provider outage cannot be made impossible. Preserve the last verified data, do not advance freshness timestamps on failure, and report stale or missing data accurately. Never hide a failed check by changing the week or substituting another league's scoring. Historical enrichment is bounded and cached; the first uncached request may be partial and can retry without blocking scores or sign-in.
