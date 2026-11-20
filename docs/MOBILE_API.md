# CFN iPhone app backend (`/api/mobile/*`)

All JSON, `Access-Control-Allow-Origin: *`. Tokens and codes below are placeholders. Code: `client/api/mobile.js`, `_m.js`, `_mauth.js`, `_mmovers.js`, `_lscrape.js`, `lineups.js`.

## Endpoints

| Method and path | Purpose | Cache |
|---|---|---|
| `GET /api/mobile/context` | Season, current NFL week (ESPN calendar), weeks that have stored data | edge 20 s |
| `GET /api/lineups?lg=gl&week=5` | Weekly matchups and lineups (gl, bh, rb, sts). No `week` = current week. `hist=1` is still the win-probability series | current week 10 s live / 60 s idle, finished weeks 1 year |
| `POST /api/mobile/auth/request-code` | Email a 6-digit code to an invited member (generic `{"ok":true}` for everyone) | none |
| `POST /api/mobile/auth/verify-code` | Exchange code for a 30-day session | none |
| `GET /api/mobile/me` | Bearer session, returns the member and server-assigned teams | none |
| `POST /api/mobile/auth/logout` | Revoke the session | none |
| `GET /api/mobile/access?leagueId=gl&teamId=7` | Guard prototype for private routes: 200 only for the member's own team, else 403 | none |
| `GET /api/mobile/lineups?lg=gl&week=5` | Named-field lineups (schemaVersion 2): stable matchup, player and game IDs, freshness inside the payload, live and first-captured projections; `winProbability` stays `null` until a week-specific model exists | 10 s live / 60 s idle, finished weeks 1 year |
| `GET /api/mobile/media` | Versioned team logo URLs and Gentlemen's League owner portraits keyed by leagueId and teamId | edge 1 hour |
| `GET /api/mobile/market-movers` | Top risers and fallers from the site's own gl 1QB model | edge 5 min, Redis 15 min |
| `GET /api/mobile/cron` | Refresh job (Vercel cron, every minute) | none |

## Freshness fields on `/api/lineups`

`fetchedAt` / `sourceUpdatedAt`: when the last successful Yahoo read finished (Yahoo gives no own timestamp). A failed provider read never advances them; it sets `lastError`. `cacheAgeSeconds` is computed per response. `stale` is true when a live-window read is older than 3 minutes (45 minutes outside games). Finished weeks are `final:true`, never stale, never overwritten, and are also copied to Blob storage. `partial:true` means an incomplete league read. `scoreboardUpdatedAt` / `scoreboardStale` describe the clock/score layer, which refreshes about every 20 seconds in games, independent of the lineup read.

## Rows

`[slot, name, position, nflTeam, projection, pointsOrNull, gameStatus, injuryStatus]` plus an optional ninth object for teams whose game is live or final. Team codes are uppercase (`WAS`, `LA`). `gameStatus` is Yahoo's text; it is filled from the scoreboard only when Yahoo's is empty. `possessionTeam` is `null` unless ESPN reports possession.

## Notes

Weeks outside 1 to 18 return 400 `invalid_week`. Upcoming weeks (through 14) are precomputed about daily and listed in `availableWeeks` once all four leagues have them (`upcoming:true`). For a live game the clock text comes from Yahoo when it carries one; score and possession come from the scoreboard. Player portraits and IDs come from the Sleeper player list (refreshed daily); players without a match get a stable `cfn:<name>:<pos>` ID and no portrait, DEF IDs are `def:<TEAM>`. Owner portraits are static files under `/media/owners/` (re-export with `node tools/export_mobile_media.js`).

## Setup still needed on Vercel

- `RESEND_API_KEY` (and a verified sender in `MOBILE_MAIL_FROM`) so sign-in codes can be delivered. Without it, `request-code` still answers `{"ok":true}` and logs that mail is not configured.
- `CRON_SECRET` (recommended): when set, the cron route requires `Authorization: Bearer <secret>`, which Vercel sends automatically.
- `MOBILE_AUTH_PEPPER` (recommended): server secret used when hashing sign-in codes.

## Member list

`client/api/_members.json` stores SHA-256 hashes of invited emails with display name and team IDs (no plain addresses). To add or remove a member, edit it and redeploy; removed members' sessions stop working on the next request.

## Tests

`node tools/test_mobile_data.js`, `node tools/test_mobile_auth.js`, `node tools/test_mobile_movers.js` (offline, in-memory Redis). Market model data is exported from `cfn.html` by `node tools/export_mobile_model.js`; re-run it whenever the Trade Calculator data changes.
