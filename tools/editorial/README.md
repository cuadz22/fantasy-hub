# CFN Blurbs — player cards only

The app reads `GET /api/mobile/player-editorial`. This is separate from the shared FantasyPros/RotoWire news endpoint and never creates Network entries or push notifications. Unconfigured editorial content returns an empty successful document; regular news still works. No provider article scraping or full-text copying is added.

Claude supplies a complete JSON document (schemaVersion 1, updatedAt, items). Each item contains id, positive revision, status (draft/published/retracted), placement `player_card_only`, player {name, position, providerIds {yahoo, sleeper, espn}}, headline, plain-text body, publishedAt, updatedAt, author, sources [{publisher,url,publishedAt?}]. Times must be ISO8601 with timezone. Up to 2,000 items, 12,000 body characters. Supply at least one verified provider ID; every supplied ID must agree with the checked registry. Never use a lineup slot ID as a player ID. New/unmatched players require a verified registry addition, not a name-only fallback.

Validate with `node tools/editorial/import.cjs feed.json`. After editorial review, use the same command with `--publish` in the authorized production environment. It performs an atomic compare-and-swap on its dedicated storage key; it does not deploy the website. Corrections increment revision; retractions retain the ID and set status=retracted. Keep past IDs in subsequent full snapshots. Rollbacks, ambiguous identities, HTML, unsafe URLs, missing IDs, future publications and unsupported schemas are rejected.

The permanent Claude feed URL is not supplied yet. No automated fetch is enabled. When supplied, connect it through this same validator and atomic importer (ETag/Last-Modified supported at the fetch layer), preserving the review policy. Do not feed it directly to the app. No app update is needed for new verified blurbs after build 39.

Read caches last at most ten minutes. If storage fails, the endpoint fails independently of normal news; the app hides unconfirmed editorial notes after that refresh fails rather than retaining retracted analysis indefinitely. Recovery is available through pull-to-refresh.
