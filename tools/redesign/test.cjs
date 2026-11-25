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
  // Projection color describes movement only after play begins, against a real baseline.
  const savedLineups = D.state.lineups.gl;
  const one = { ...lineups, matchups: [{ ...lineups.matchups[0],
    L: [["QB", "Sample QB", "QB", "CIN", 20, null, "Sun 1:00 pm vs Pit"]],
    R: [["RB", "Sample RB", "RB", "PIT", 15, null, "Sun 1:00 pm @ Cin"]],
    ya: [0, 25], yb: [0, 12] }] };
  D.state.lineups.gl = one;
  D.state.named.gl = { week: one.week, matchups: [{ teams: [
    { teamId: one.matchups[0].ia, lineup: [{ name: "Sample QB", slot: "QB", originalProjection: 20, liveProjection: 25 }] },
    { teamId: one.matchups[0].ib, lineup: [{ name: "Sample RB", slot: "RB", originalProjection: 15, liveProjection: 12 }] }
  ] }] };
  assert.deepEqual(D.cards("gl", scope.window.SNAPSHOT.cards[0], {})[0].teams.map(t=>t.projectionDirection), ["", ""]);
  one.matchups[0].L[0][6] = "Q3 10:00";
  one.matchups[0].R[0][6] = "Final";
  assert.deepEqual(D.cards("gl", scope.window.SNAPSHOT.cards[0], {})[0].teams.map(t=>t.projectionDirection), ["up", "down"]);
  one.matchups[0].R.push(["TE", "Extra starter", "TE", "PIT", 8, null, "Sun 1:00 pm"]);
  assert.doesNotThrow(() => D.cards("gl", scope.window.SNAPSHOT.cards[0], {}));
  delete D.state.named.gl;
  assert.deepEqual(D.cards("gl", scope.window.SNAPSHOT.cards[0], {})[0].teams.map(t=>t.projectionDirection), ["", ""]);
  D.state.lineups.gl = savedLineups;
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
  const rolloutFiles = new Set(["client/api/_pushrollout.json", "client/api/_networkrollout.json", "client/api/_mpush.js", "client/api/_network.js", "client/api/_liveactivity.js"]);
  // Reviewed Road to the Ring UI additions; pin exact content, keeping all API/feed protections.
  const roadPresentation = {
  "client/public/redesign/index.html": "fec34cbf177ae8715481bfc4505c177163e29338",
  "client/public/redesign/index.template.html": "b70936a0361695db889ceb86301442024c997a79",
  "client/public/redesign/tools.js": "f0da82fb91e37a7a7985459bae8b15cd50715929",
  "client/public/redesign/app.js": "7132875dd8c804b976fdeb8cccb4e1cbfbae34dc",
  "client/public/redesign/data.js": "daf47e510494c987b3fa879c537d5e330fc615f7",
  "client/public/redesign/recap.js": "a6747a7ed387b3038c7df2530e1b27213f025863",
  "client/public/redesign/style.css": "4eb74db89873f926dae02792f7702bf0875811d0",
  "client/public/redesign/updates.js": "822a86b7790b928a99d6cd77fa9bd19845152e27",
  "client/public/redesign/polish.js": "0863ad202abe5ab0fb6682ae99a26875b0ece520",
  "client/public/redesign/roads.js": "ad9c1f229aff61908bae57ec7bcd3ca7c1291750",
  "client/public/redesign/roads.css": "c705f247cc84f5b1bd3d9799f4ad36e264c5ce9d"
};
  for (const file of files.filter(f => !rolloutFiles.has(f))) {
    const expected = roadPresentation[file] || cp
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
