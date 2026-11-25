# Road to the Ring

Read-only champion schedules, separate from the owner-based head-to-head archive.
Historical team names are retained even when the package does not verify the owner's identity.

Build from the verified import package:

    python3 tools/history/build-roads.py /absolute/path/to/cfn-history-v1-package
    node tools/history/test-roads.cjs

The importer verifies file/evidence hashes, season and league scope, final scores,
champion identity, regular-season record, playoff bracket, final victory and byes.
It writes all four JSON files only after validation succeeds. Missing results must
not be invented. Keep the original evidence package outside the public directory.

Public files live under client/public/data/roads/v1. The website and native app
validate the same contract. The app bundles a verified copy and keeps it available
offline, checking for updates at most every 12 hours per league per running process.
No scoring, authentication, notification or rollover code is involved.

For this initial release, all 27 championship seasons have complete weekly coverage
(450 schedule entries including verified byes). The native app's corresponding
road-gl/bh/rb/sts.json resources must match these public JSON files byte-for-byte.
