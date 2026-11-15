# Rollback points

Each entry is a saved copy of `client/public/cfn.html` from just before a big change, so we can revert or build from it.

## 2026-11-15 — before the split matchup layout
- Saved copy: `docs/backups/cfn_2026-11-15_before-split-matchup.html`
- Git tag: `pre-split-matchup` (the commit just before the change)
- What changed after it: matchup cards (live + weekly preview) now split down the middle (team A left, team B right), smaller odds, bigger team avatars, one-line player rows with colored position pills, defense logo tiles, and "still to play" / career-high lines only appear when a side has 4 or fewer players left.
- To revert fully: `cp docs/backups/cfn_2026-11-15_before-split-matchup.html client/public/cfn.html`, commit and push. Or `git checkout pre-split-matchup -- client/public/cfn.html`.

## 2026-11-15 — before the contextual bottom bar and league page compaction
- Git tag: `pre-nav-redesign` (the commit just before). Restore with `git checkout pre-nav-redesign -- client/public/cfn.html`.
- What changed after it: bottom bar is contextual (inside a league: Home, league logo, Matchups, Waivers, Standings, More), Studio moved into More, league tabs grouped into pills (Matchups/Preview, Standings/Power Rankings/Fraud Meter), tighter league page spacing, Standings gets PF/G and PA/G columns, more lineup rows visible per screen.

## 2026-11-15 — before grouped league tabs on the website, sortable scrollable standings, slot colors
- Git tag: `pre-tab-consolidation`. Restore with `git checkout pre-tab-consolidation -- client/public/cfn.html`.
- After it: league tabs are Matchups, Standings (Power Rankings, Fraud Meter), Waivers, Trades, League Center (Awards, History, All-Time Ranks, Rulebook) on web and app; standings scroll sideways with sticky team column and sort by tapping a header; K, DEF and Superflex (SFLX) slot colors.
