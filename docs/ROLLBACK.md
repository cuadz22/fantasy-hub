# Rollback points

Each entry is a saved copy of `client/public/cfn.html` from just before a big change, so we can revert or build from it.

## 2026-11-15 — before the split matchup layout
- Saved copy: `docs/backups/cfn_2026-11-15_before-split-matchup.html`
- Git tag: `pre-split-matchup` (the commit just before the change)
- What changed after it: matchup cards (live + weekly preview) now split down the middle (team A left, team B right), smaller odds, bigger team avatars, one-line player rows with colored position pills, defense logo tiles, and "still to play" / career-high lines only appear when a side has 4 or fewer players left.
- To revert fully: `cp docs/backups/cfn_2026-11-15_before-split-matchup.html client/public/cfn.html`, commit and push. Or `git checkout pre-split-matchup -- client/public/cfn.html`.
