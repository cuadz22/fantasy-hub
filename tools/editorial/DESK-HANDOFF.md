# CFN Desk → player-card blurbs

Keep updating the existing public Gist JSON URL. CFN checks it every ten minutes; phones read the validated CFN endpoint, never the Gist directly. No credentials or website deployments are needed by the editorial agent.

The connector accepts the current desk schema (`schemaVersion: "1.0.0"`, `generatedAt`, `notes`). Update `generatedAt` to the actual UTC time whenever the document changes. Keep IDs stable. Do not reuse IDs for another player. Repeated polls do not duplicate notes.

## Publication

- Samples: `isSample: true`; drafts: `status: "draft"`. Neither appears in player cards.
- Publish a real approved note with `status: "published"`, `factCheck.status: "passed"`, actual ISO8601 `publishedAt`, `updatedAt`, and `factCheck.checkedAt`, and integer `revision: 1`.
- Supply `playerName`, actual `position`, and `providerIds` with at least one verified string ID (`yahoo`, `espn`, or `sleeper`). Never guess IDs or use roster slot IDs. Every supplied provider ID must match CFN's verified registry.
- The eight initial named players have an explicit checked mapping for their existing desk `playerId` slugs. New players need provider IDs. This is not a fuzzy name lookup.
- `headline`, `statLine` (optional), and `body` are plain text. CFN displays the stat line above the body. Do not send HTML.
- Include 1–10 `sources` with `label` (or `publisher`) and HTTPS `url`. Source links including X can remain; they appear as supporting source links, not inserted into the analysis body.
- If `updatedAt` is omitted on first publication, CFN uses the later of `publishedAt` and `factCheck.checkedAt`; explicit timestamps and revisions are still recommended.
- Corrections: same `noteId`, increase `revision`, advance `updatedAt` and `generatedAt`, and repeat fact checking. Keep the same player identity and original `publishedAt`.
- Withdraw a published note explicitly with its `noteId`, `status: "retracted"`, increased `revision`, and `updatedAt`. Omitting a published note from a later rolling feed does NOT retract it; CFN keeps the player-card history. Setting it back to draft is rejected.

Jose approved the eight initial notes on November 26, 2026. Their existing IDs are now accepted. Future samples must explicitly use `isSample: true` or `status: "draft"`. No per-note approval in chat is needed: the editorial desk controls publication through `status: "published"` and a passed fact check.

A failed validation or unavailable source preserves the last verified stored document and records an editorial job error. No changes are made to normal publisher news, Network posts, notifications, scores or member access. Fact-check flags record the desk's review; the importer validates structure and identity, not the truth of every editorial claim.

## Example (placeholder content, not publishable as written)

```json
{
  "schemaVersion": "1.0.0",
  "generatedAt": "ACTUAL_UTC_TIMESTAMP",
  "desk": "CFN Desk",
  "notes": [{
    "noteId": "STABLE_UNIQUE_REAL_NOTE_ID",
    "playerId": "blakecorum",
    "playerName": "Blake Corum",
    "position": "RB",
    "providerIds": {"espn": "4429096"},
    "revision": 1,
    "status": "published",
    "publishedAt": "ACTUAL_UTC_TIMESTAMP",
    "updatedAt": "ACTUAL_UTC_TIMESTAMP",
    "headline": "Approved original headline",
    "statLine": "Verified game statistics",
    "body": "Approved original CFN analysis",
    "factCheck": {"status": "passed", "checkedAt": "ACTUAL_UTC_TIMESTAMP"},
    "sources": [{"label": "Verified source", "url": "https://example.com/replace-with-actual-source"}]
  }]
}
```

After source publication, allow one ten-minute collection interval and the app/server cache refresh. It is not an instant push feed. CFN Blurbs appears only on a matching player card's News tab in supported builds (1.4 build 39 onward).
