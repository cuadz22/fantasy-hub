const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  cp = require("node:child_process"),
  path = require("node:path");
const root = path.resolve(__dirname, "../..");
process.chdir(root);
require("../../client/public/redesign/data.js");
const D = globalThis.CFNData;
const fixture = (n) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", n + ".json")));
(async () => {
  const ctx = fixture("context"),
    lineups = fixture("lineups"),
    standings = fixture("standings");
  assert.equal(D.validateContext(ctx).currentWeek, 11);
  assert.throws(() => D.validateContext({ ...ctx, currentWeek: 99 }));
  D.validateLineups(lineups, "gl", 11);
  assert.throws(() => D.validateLineups(lineups, "rb", 11));
  assert.throws(() => D.validateLineups(lineups, "gl", 10));
  assert.throws(() =>
    D.validateLineups(
      { ...lineups, matchups: [lineups.matchups[0], lineups.matchups[0]] },
      "gl",
      11,
    ),
  );
  D.validateStandings(standings, "gl", ctx);
  assert.throws(() =>
    D.validateStandings({ ...standings, throughWeek: 9 }, "gl", ctx),
  );
  assert.throws(() =>
    D.validateStandings({ ...standings, season: 2025 }, "gl", ctx),
  );
  assert.throws(() =>
    D.validateStandings(
      { ...standings, rows: [{ wins: 4, losses: 5, ties: 0 }] },
      "gl",
      ctx,
    ),
  );
  assert.equal(
    D.athlete(["BN", "Bye player", "RB", "ATL", 100, null, "Bye"], {}).proj,
    "—",
  );
  assert.equal(
    D.athlete(["QB", "Zero", "QB", "CIN", 20, 0, "Final"], {}).score,
    "0.00",
  );
  const scope = { window: {} };
  vm.runInNewContext(
    fs.readFileSync("client/public/redesign/snapshot.js", "utf8"),
    scope,
  );
  D.state.context = ctx;
  D.state.lineups.gl = lineups;
  D.state.standings.gl = standings;
  const cards = D.cards("gl", scope.window.SNAPSHOT.cards[0], {});
  assert.equal(cards.length, 6);
  assert.equal(cards[0].teams[0].score, lineups.matchups[0].ya[0].toFixed(2));
  assert.equal(cards[0].prob, lineups.matchups[0].winProbability.homePercent);
  assert(
    cards.every((c) => c.rows.every((r) => !["BN", "IR"].includes(r.slot))),
  );
  assert.equal(
    cards[0].teams[0].record,
    standings.rows.find((t) => t.teamId === lineups.matchups[0].ia).record,
  );
  let count = 0;
  global.fetch = async () => {
    count++;
    await new Promise((r) => setTimeout(r, 10));
    return { ok: true, json: async () => ({ ok: 1 }) };
  };
  await Promise.all([
    D.read("/dedup-test"),
    D.read("/dedup-test"),
    D.read("/dedup-test"),
  ]);
  await D.read("/dedup-test");
  assert.equal(count, 1);
  global.fetch = async () => {
    throw new Error("offline");
  };
  await D.load("league", "gl");
  assert.equal(D.state.lineups.gl, lineups);
  assert(D.state.failures.context);
  // Release freeze: compare against the independently verified November 25 deployment.
  // The original redesign baseline predates approved market, history and notification fixes.
  // Keep this pinned (never derive from HEAD), so unreviewed changes still fail.
  const baseline = "3479f9a";
  const files = cp
    .execFileSync("git", ["ls-tree", "-r", "--name-only", baseline], {
      encoding: "utf8",
    })
    .trim()
    .split("\n")
    .filter(
      (p) =>
        p.startsWith("client/api/") ||
        p.startsWith("client/public/") ||
        p.startsWith("server/") ||
        [
          "client/vercel.json",
          "vercel.json",
          "client/scripts/cm_blob.sha256",
          "client/scripts/check-site.mjs",
        ].includes(p),
    );
  let protectedCount = 0;
  // Only the reviewed invited-member rollout changes are permitted; all feeds stay frozen.
  const rolloutFiles = new Set(["client/api/_pushrollout.json", "client/api/_networkrollout.json", "client/api/_mpush.js", "client/api/_network.js"]);
  for (const file of files.filter(f => !rolloutFiles.has(f))) {
    const expected = cp
      .execFileSync("git", ["rev-parse", `${baseline}:${file}`], {
        encoding: "utf8",
      })
      .trim();
    const actual = cp
      .execFileSync("git", ["hash-object", file], { encoding: "utf8" })
      .trim();
    assert.equal(
      actual,
      expected,
      `Protected production file changed: ${file}`,
    );
    protectedCount++;
  }
  for (const file of [
    "data.js",
    "app.js",
    "tools.js",
    "studio-export.js",
    "theme.js",
    "polish.js",
  ])
    new vm.Script(fs.readFileSync("client/public/redesign/" + file, "utf8"), {
      filename: file,
    });
  const legacy = fs.readFileSync("client/public/cfn.html", "utf8");
  for (const name of ["LGD", "FM", "DPK", "D", "DR"])
    assert(
      new RegExp("\\b(?:var|const)\\s+" + name + "\\s*=\\s*\\{").test(legacy),
      name + " missing",
    );
  assert(legacy.includes("If kept next season (2027)"));
  console.log(
    `Redesign checks passed: league/week identity, official standings, zero/bye handling, starter filtering, shared probabilities, deduplicated reads, failed-feed retention, syntax, and ${protectedCount} unchanged production files.`,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
