# Verified history import — 25 November 2026

Read-only archives for native CFN 1.4 (30), served at `/data/history/v1/{league}.json`.
No scoring, standings, authentication, notification, calendar, or scheduled job changes.

| League | Coverage | Verified contests | Held for identity review | Championships |
| --- | --- | ---: | ---: | ---: |
| Gentlemen’s League | 2023–2025; 2026 through Week 11 | 311 | 49 | 3 |
| Beaners & Husseins | 2014–2025; 2026 through Week 11 | 1170 | 30 | 12 |
| Rebirth | 2019–2025; 2026 through Week 11 | 648 | 92 | 7 |
| Shoot the Shits | 2021–2025; 2026 through Week 11 | 431 | 125 | 5 |

All archives explicitly declare partial coverage. Unknown former owners are not assigned to current people. STS records are Yahoo fantasy matchup outcomes, not the custom standings points system. Rebirth’s verified 2021 Oscar championship is retained, but the unresolved runner-up is omitted and the title does not link to an excluded final.

Validation: 724 package checksums and 642 source checksums; all 31 season standings independently reconciled with regular-season results; every accepted final score compared with sanitized Yahoo scoreboard evidence; championship evidence, exact-decimal H2H totals, source scopes, stage classification, duplicate games and current team ownership checked. All 48 current team mappings match production resources. Independent collection validator agrees on 2,560 accepted and 296 held contests. Native archive validator accepts all four files. Fresh public checks confirmed 2025 GL/BH/STS champions; RB’s current public URL redirects to login, so its archived evidence is used.

Raw collection evidence stays outside the public website/repository. The release contains only display data and opaque evidence references, with no emails, account hashes or raw source HTML.

Future imports must preserve verified IDs, validate against original evidence, compare the import to this baseline, run the native validator and failure tests, and stage before promotion. Never guess identities or turn missing scores into zero. Update current-season mappings when the season changes. Historical archives do not control the active season/week.
