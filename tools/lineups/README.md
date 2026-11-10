# Lineup optimizer and audit

Every lineup shown on CFN (weekly previews, Road to the Playoffs, win odds) must be the **optimal** lineup from the whole roster (starters + bench, not IR), using that week's projections. Yahoo's own set lineup is never used as-is.

- `lineopt.py` - exact solver (max-weight assignment) plus an independent greedy check.
- `audit_pv.py` - audits the Week preview lineups against the solver.
- `audit_road.py` - audits every Road to the Playoffs lineup (Weeks 10-14) against the solver.

The weekly build (`pack9.py`) calls both audits and refuses to build if any lineup is not optimal.
