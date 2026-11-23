# CFN website redesign candidate

Branch: `codex/website-redesign`. Production baseline: `c554e97`.
Preview: http://127.0.0.1:8770/redesign/index.html

## Scope and production safety

This candidate is additive under `client/public/redesign/`. It does not replace the
production homepage, change an API, move a data file, change authentication, alter
notification recipients, or install any new cron job. The existing website and app
continue using the same production services. No Vercel deployment has been made.

The preview server permits public GET requests only, on five explicitly allowed
feed routes. It cannot proxy authentication, push delivery, cron, or other writes.
It uses no credentials. Its cache is in memory and separate from production Redis.

## What is connected

| Area | Candidate behavior | Existing behavior retained |
| --- | --- | --- |
| Network headliners | Four featured matchups from current lineup feeds, shared CFN win estimate, week selector | Editorial story labeled as archive |
| League matchups | All six matchups, starters, team logos or neutral monograms, score/projection hierarchy | Scoring and provider selection unchanged |
| Teams | Every team selectable; current starters and scores | Full bench/roster tools linked |
| Standings | Existing final-only standings feed; completed-week validation; team opens its starter roster | STS custom points used when provided, otherwise explicitly W-L reference |
| Player market | Existing model's five risers/fallers, photos, values, source timestamp | Full market/analyzer linked |
| Trades and waivers | Archived examples in redesigned layouts, explicitly dated/saved | Existing current tools linked |
| History / all-time / H2H / awards | Saved archive in new presentation | Full historical results remain linked |
| Draft board / picks / keepers / keeper prices / can't-cut | Saved archive, searchable and scrollable, pick provenance | Existing authoritative tools linked; no decisions submitted |
| Power rankings / fraud meter / weekly preview | Saved model outputs labeled by week; featured preview uses selected feed | Existing model tools linked |
| Rulebook / trade rules | Saved content in readable disclosures | Existing full rules linked |
| Exposure | Saved cross-league roster view, clearly labeled | Existing `/exposure.html` retained |
| Studio | Matchup/award templates, league selector, working PNG download | Full original Studio linked; nothing auto-published |
| Pick'em | Dedicated landing page opens existing tool | Deadline, submissions, privacy and leaderboard unchanged |
| MVP voting | Gentlemen's League resource entry opens existing tool | Original vote handling unchanged |
| Weekly editions | Recap archive links for existing weeks 3–10 | Original article/share URLs unchanged |
| Commissioner tools | Removed from main More menu; still directly accessible | Original encrypted payload, code, data and protection untouched |

No league tools were deleted. News and additional Yahoo/Sleeper leagues are deferred
at the user's request. The candidate intentionally does not present sample forms as
working commissioner or Pick'em submissions.

## App dependency discovered

The shipped app requests the ROOT website URL for `LeagueResourceParser` and a
fallback data path. The parser extracts `LGD`, `FM`, `DPK`, `D`, and `DR` objects,
and depends on the keeper season marker `If kept next season (2027)`.

**Do not switch the production root to this candidate yet.** Merely retaining
`/cfn.html` is insufficient because installed app builds request `/`.

Before a root switch:
1. Inventory every production HTML/data consumer, including older app builds.
2. Add structured, versioned public resource exports from the existing source data.
   Do not create a second keeper, scoring, standings, or probability model.
3. Update and test app readers with those exports, including offline fallback.
4. Either preserve the exact legacy root contract for supported older apps or wait
   until a documented supported-build migration has completed. Do not guess by
   user-agent string or silently strand existing TestFlight installs.
5. Connect/verify the remaining archived tool views, or retain explicit links to
   their working original screens. Preserve private commissioner access checks.
6. Validate the hosted candidate and existing app consumers, capture a rollback
   deployment, and only then plan a production cutover.

The candidate path uses explicit `index.html` because the existing catch-all rewrite
can otherwise send a directory request to the old React entrypoint. No production
routing changes are required to review this local candidate.

## Intentional data / performance boundaries

- `data.js` owns read-only transport and validation; no page calculates fantasy
  points or win probability. Server team totals and probabilities are preserved.
- Projection coloring mirrors the app's starter-baseline comparison (0.05 tolerance),
  ignoring bye projections. It affects color only, never the score or win estimate.
- Missing values remain missing. A zero score renders as `0.00`. Bye projections
  render as a dash even when the upstream raw row contains a percentage-like value.
- League ID, season, week, duplicate team IDs and completed-week records are checked.
- Shared in-flight requests are deduplicated. Lineups cache for 60 seconds, context
  and standings for 5 minutes, media for 1 hour, market for 15 minutes.
- Homepage does not fetch four unused standings tables. Static archive navigation
  does not repeatedly download score feeds. Hidden tabs and open dialogs don't poll.
- Failed reads retain known data with delayed/archived labeling. Old standings are
  never substituted as current; official and projected records remain separate.
- One router owns navigation. Export renderer loads only when an export is requested.
- All new files are formatted and isolated; original source/data remain byte-identical.

## Reproduce checks

From this worktree:

```sh
python3 tools/redesign/serve.py
node tools/redesign/test.cjs
npm run test:reliability
npm run build
node tools/redesign/browser-check.cjs
```

Browser checks require a dedicated Chrome debugging session on port 9237. Evidence
is written to `../../outputs/WebsiteRedesign` by default. No real sign-in emails,
notifications, trades, votes or commissioner operations are sent by these checks.

Build emits the pre-existing Vite bundle-size warning for the original React app.
It is not a failure, and modifying that production bundle is outside this candidate.

## Verification recorded November 22, 2026 (ET)

- Browser: 72 routes, 64 responsive/theme combinations (1440, 768, 390, 360 px;
  dark/light), no uncaught JavaScript errors or page-wide horizontal overflow.
- Interactions: matchup open/close, standings-to-team starter roster, draft-pick
  provenance, historical Week 10/current-week switching, actual PNG download.
- Data: four league lineup feeds read successfully; official records use completed
  weeks; malformed/wrong-week inputs rejected; zero/bye handling and request
  deduplication passed.
- Preservation: 270 existing API/public/server/config files are byte-identical to
  the starting commit, including the old homepage and commissioner payload.
- Existing reliability suite: passed, including 1,078 scoring checks, auth tests,
  final standings, probabilities, touchdown routing/deduplication, read efficiency.
- Build: passed. Original bundle-size advisory remains.

These are code, fixture, browser, and public-feed checks. They do not constitute a
new production sign-in or a real notification send, and do not certify a future
homepage cutover. The live app and backend were not deployed or modified.
