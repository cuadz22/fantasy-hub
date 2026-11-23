const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
(async () => {
  const pages = await (await fetch("http://127.0.0.1:9237/json")).json();
  const page = pages.find((p) => p.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const waiters = new Map(),
    errors = [],
    requests = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.method === "Runtime.exceptionThrown")
      errors.push(m.params.exceptionDetails);
    if (m.method === "Network.requestWillBeSent")
      requests.push({
        url: m.params.request.url,
        method: m.params.request.method,
      });
    if (waiters.has(m.id)) {
      waiters.get(m.id)(m);
      waiters.delete(m.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((r) => {
      const n = ++id;
      waiters.set(n, r);
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const ev = async (expression) => {
    const m = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (m.result?.exceptionDetails)
      throw new Error(JSON.stringify(m.result.exceptionDetails));
    return m.result?.result?.value;
  };
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const out = path.resolve(
    process.env.CFN_REDESIGN_EVIDENCE || "../../outputs/WebsiteRedesign",
  );
  fs.mkdirSync(out, { recursive: true });
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Page.enable");
  await send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: out,
  });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", {
    url:
      "http://127.0.0.1:8770/redesign/index.html?check=" +
      Date.now() +
      "#network",
  });
  await pause(5000);
  await ev(`CFNData.load('network','gl').then(()=>render(true,true))`);
  const state = await ev(
    `({failures:CFNData.state.failures,leagues:Object.keys(CFNData.state.lineups),standings:Object.keys(CFNData.state.standings),week:requestedWeek()})`,
  );
  assert.equal(state.leagues.length, 4, JSON.stringify(state));
  const routes = [];
  for (const lg of ["gl", "bh", "rb", "sts"])
    for (const tab of [
      "overview",
      "team",
      "standings",
      "trades",
      "waivers",
      "history",
      "alltime",
      "rules",
      "awards",
      "draft",
      "power",
      "fraud",
      "weekly",
      "cantcut",
      ...(["bh", "rb"].includes(lg)
        ? ["picks", "keepers", "desk", "traderules"]
        : []),
      ...(lg === "rb" ? ["prices"] : []),
      ...(lg === "gl" ? ["vote"] : []),
    ])
      routes.push(`league-${lg}/${tab}`);
  routes.push("network", "market", "exposure", "studio", "pickem", "archive");
  for (const route of routes) {
    await ev(`location.hash=${JSON.stringify(route)}`);
    await ev(`loadRoute(location.hash.startsWith('#league-')?'league':location.hash.slice(1)).then(()=>render(true,true))`);
    await pause(100);
    assert(
      await ev(`document.querySelector('main').innerText.length>60`),
      route,
    );
  }
  // Live league cards and modal, official standings -> roster, filters and menus.
  await ev(`location.hash='league-gl/overview'`);
  await pause(150);
  assert.equal(await ev(`document.querySelectorAll('.match').length`), 6);
  await ev(`document.querySelector('.match').click()`);
  assert(
    await ev(
      `document.querySelector('#detail').open&&document.querySelectorAll('#detail .player-row').length>=9`,
    ),
  );
  await ev(`document.querySelector('[data-close]').click()`);
  await ev(`location.hash='league-gl/standings'`);
  await pause(150);
  await ev(`document.querySelector('[data-roster]').click()`);
  assert(
    await ev(
      `document.querySelector('#detail').open&&document.querySelector('#detail').innerText.includes('Starter')`,
    ),
  );
  await ev(`document.querySelector('[data-close]').click()`);
  await ev(`location.hash='league-rb/picks'`);
  await pause(150);
  await ev(`document.querySelector('[data-pick-team]').click()`);
  assert(await ev(`document.querySelector('#detail').open`));
  await ev(`document.querySelector('[data-close]').click()`);
  await ev(`location.hash='network'`);
  await pause(150);
  await ev(
    `selectedWeek=10;CFNData.load('network','gl',10).then(()=>render(true,true))`,
  );
  assert(
    await ev(
      `currentCards('gl').every(c=>c.week===10)&&currentCards('gl').length===6`,
    ),
  );
  await ev(
    `selectedWeek=null;CFNData.load('network','gl').then(()=>render(true,true))`,
  );
  assert(
    await ev(
      `currentCards('gl').every(c=>c.week===CFNData.state.context.currentWeek)`,
    ),
  );
  const layouts = [];
  for (const theme of ["dark", "light"])
    for (const width of [1440, 768, 390, 360]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 1100,
        deviceScaleFactor: 1,
        mobile: width < 500,
      });
      await ev(
        `document.documentElement.dataset.theme=${JSON.stringify(theme)};syncTheme()`,
      );
      for (const route of [
        "network",
        "league-rb/overview",
        "league-rb/standings",
        "league-rb/trades",
        "league-rb/picks",
        "league-gl/history",
        "market",
        "studio",
      ]) {
        await ev(`location.hash=${JSON.stringify(route)}`);
        await pause(100);
        const dimensions = await ev(
          `({inner:innerWidth,scroll:document.documentElement.scrollWidth})`,
        );
        layouts.push({ theme, width, route, ...dimensions });
        assert(
          dimensions.scroll <= dimensions.inner + 1,
          JSON.stringify(layouts.at(-1)),
        );
        if (
          (width === 1440 &&
            [
              "network",
              "league-rb/overview",
              "league-rb/standings",
              "studio",
            ].includes(route)) ||
          (width === 390 && route === "league-rb/overview")
        ) {
          await ev("document.fonts.ready");
          const s = await send("Page.captureScreenshot", { format: "png" });
          fs.writeFileSync(
            path.join(
              out,
              `${theme}-${width}-${route.replaceAll("/", "-")}.png`,
            ),
            Buffer.from(s.result.data, "base64"),
          );
        }
      }
    }
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await ev(`location.hash='studio'`);
  await pause(200);
  await ev(`document.querySelector('#studio-export').click()`);
  for (let i = 0; i < 30; i++) {
    await pause(500);
    if (await ev(`!document.querySelector('#studio-export').disabled`)) break;
  }
  const exportText = await ev(
    `document.querySelector('#export-status').textContent`,
  );
  assert(exportText.includes("downloaded"), exportText);
  assert.equal(errors.length, 0, JSON.stringify(errors));
  assert(
    requests
      .filter((r) => r.url.includes("/api/"))
      .every((r) => r.method === "GET"),
  );
  const result = {
    checkedAt: new Date().toISOString(),
    state,
    routes: routes.length,
    layouts: layouts.length,
    interactions: [
      "matchup dialog",
      "standings roster",
      "pick provenance",
      "week10/current switching",
      "PNG export",
    ],
    exportText,
    errors,
    apiMethods: [
      ...new Set(
        requests.filter((r) => r.url.includes("/api/")).map((r) => r.method),
      ),
    ],
  };
  fs.writeFileSync(
    path.join(out, "browser-verification.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
  ws.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
