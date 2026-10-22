# Fraud Meter — Model Criteria (saved reference)

Leagues: gl 101813, bh 100398, rb 101720, sts 101814. Code lives in `_preview/fraud/` (fraud_model.py, run_fm.py, build_fm.py, fmjs.js).

## Lineup slots
QB, 2 RB, 3 WR, TE, FLEX (rb league adds SUPERFLEX). IR players excluded. Empty slots (bye / no 2nd QB) are filled with replacement-level points.

## Team rating (raw) = 0.40*pdev + 0.35*ap_dev + 0.25*hr_dev
- **pdev**: mean/median blend of weekly point deviations from the league mean, capped at ±1.4*sd_w, recency weighted 0.8–1.2.
- **ap_dev**: all-play win % (your score vs EVERY other team that week), inverse-normal scaled.
- **hr_dev**: tier points by weekly finish: 1–3 = 3, 4–6 = 2, 7–9 = 1, 10–12 = 0; smoothed (tp+3)/(3G+6). Rewards consistently scoring top 3, not just top 6.
- Philosophy: points on the board count more than projections.

## Strength going forward
S(t,w) = lg_mean + WP*dev_act + (1−WP)*0.85*dev_proj_week
WP = max(0.6, min(0.85, rel+0.25)), rel = 1 − noise/var_obs.

## Game win probability
pw(a,b,w) = Φ((S(a)−S(b)) / sqrt(sdt[a]² + sdt[b]²)); sdt = the team's own weekly SD shrunk toward the league (KV=6). Opponent strength is a key factor in rest-of-season wins.

## The bar (Fraud vs Legit)
delta = expected rest-of-season wins (weeks 7–14) − n*ptyp, where ptyp = 0.5 + (W/G − 0.5)*G/(G+8). |delta| < 0.5 shown neutral gray.

## Odds
6,000 sims: top 6 make playoffs, seeds 1–2 get a Week 15 bye, reseeding, 3 rounds (weeks 15–17). Per-team rating uncertainty se = sqrt((WP*sd_w/√G)² + ((1−WP)*8)²).

## Other
- Luck = actual wins − all-play expected wins.
- Projected record = W + E(wins), losses forced so total = 14 (fmProj).
- Weekly refresh needs a Yahoo scrape (schedules/scores) + Sleeper weekly projections.
