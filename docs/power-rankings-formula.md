# Power Rankings Formula

## Current Formula (v2 — Season 2026)

**Score = All-Play% × 30% + PF × 25% + Recent Form × 15% + Win% × 15% + PA × 15% + Streak modifier**

| Factor | Weight | Description |
|---|---|---|
| All-Play % | 30% | How many of the other 11 teams you would've beaten each week, across all weeks played. Best measure of true team strength regardless of schedule luck. |
| Points For (PF) | 25% | Your total points scored, normalized (min–max) within the league. |
| Recent Form | 15% | Matchup win rate over the last 3 weeks. Rewards teams trending up, penalizes teams fading. |
| Win % | 15% | Standard head-to-head win percentage. |
| Points Against (PA) | 15% | Opponent points scored against you, normalized and **inverted** — lower PA is better. |
| Streak modifier | ±3%/week | Win streak adds +3% per game (W3 = +9%), loss streak subtracts −3% per game (L3 = −9%), **capped at ±15%**. |

## Data Sources

- **standings.json** — cumulative W-L, PF, PA, streak
- **scores.json** — per-week scores for every team (used for all-play and recent form)

## Updating Each Week

1. Update `standings.json` — new W-L, PF, PA, streak
2. Append new week entry to `scores.json` — list all 12 teams with their score and matchup `won` boolean

## History

| Version | Formula |
|---|---|
| v1 (pre-season) | Win% 50% · PF 35% · PA 15% — simplified fallback, no weekly data |
| v2 (2026 Week 1+) | All-Play 30% · PF 25% · Recent Form 15% · Win% 15% · PA 15% + Streak |
