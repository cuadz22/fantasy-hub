# CFN weekly recap drafts

Four leagues, nine 4320×5760 PNGs per league: cover; six Man of the Match winners;
Team of the Week and awards; six individual final matchups. All source photos are
real, team logos circular, and the manager labels match player-name size.

## Weekly workflow (Mac)

1. `python3 tools/recaps/weekly.py` chooses the newest complete, not-yet-generated
   week from the shared season context. It does not advance the week or change any feed.
2. Generation snapshots the four public CFN lineup feeds, compares all 48 team
   totals and every starter score/position against public Yahoo box scores, checks
   roster sums, and validates every rendered slide. Incomplete games, missing
   portraits, unknown positions, tied awards and inconsistent scores stop generation.
3. Inspect all four reports and representative matchups. Never substitute invented
   results or photos. If Yahoo is temporarily unavailable, retain existing drafts
   and retry later; do not weaken the checks.
4. `node --env-file=.env.studio.local tools/recaps/upload.cjs OUTPUT_DIRECTORY`
   uploads ONLY validated artwork/ZIPs to the dedicated public Studio media store,
   then atomically switches its catalogue after all upload checks pass.
5. Owner reviews/downloads in `/redesign/index.html#studio`. There is no Instagram,
   app-feed, push notification, or social publishing action in these scripts.

A Codex weekly task runs this workflow on Tuesdays at 9AM America/New_York. It is a
local Mac automation, so the Mac/Codex must be available; a missed or blocked run is
not a guarantee of delivery. All drafts remain downloadable until reviewed.

## Dependencies and safety

Use Python 3, Node, Chrome, and Playwright (set `CFN_PLAYWRIGHT` to an installed
module path if the local default is unavailable). Rendering uses the Mac's system
font; no Apple font files are redistributed. The exact font is baked into PNGs.

The separate `cfn-studio-recaps` public Blob store is `store_0Qa2DiFFmldkQAHU`.
Its `STUDIO_READ_WRITE_TOKEN` is deliberately distinct from the private app store.
Only public league names/results and finished artwork are uploaded; never raw
source HTML, emails, tokens or sessions. Keep `.env.studio.local` ignored and
permissions 0600. It can be refreshed from Vercel's STUDIO-prefixed variable.

The renderer saves sources, derived data, layout checks and upload receipts locally
for audit. Uploads are content-versioned; later stat corrections require an explicit
new revision, never silent overwrites of an existing generated set. The catalogue
uses an ETag condition to avoid losing another editor's update.

Run `python3 tools/recaps/test_derive.py`, `node tools/recaps/test-archive.cjs`,
`npm run test:release` and `npm run build` before shipping Studio UI changes.
The capture fixtures are intentionally fixed to a known finalized Week 11.
App/API/cron/auth/scoring implementations are not modified by this feature.
