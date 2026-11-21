// Read-only contract smoke checks. Run with CFN_BASE_URL targeting the exact build.
'use strict';
const base = process.env.CFN_BASE_URL || 'https://cuadzfantasynetwork.com';
const assert = require('node:assert/strict');
async function get(path, expected = 200) {
  const started = Date.now(); let r, body;
  if (process.env.CFN_VERCEL_DEPLOYMENT) {
    const {execFileSync} = require('node:child_process');
    const out = execFileSync('vercel',['curl',path,'--deployment',process.env.CFN_VERCEL_DEPLOYMENT,'--','--silent','--show-error','--max-time','15','--write-out','\n%{http_code}'], {encoding:'utf8',maxBuffer:4e6,stdio:['ignore','pipe','pipe']});
    const i=out.lastIndexOf('\n'); r={status:Number(out.slice(i+1))}; body=JSON.parse(out.slice(0,i));
  } else { r = await fetch(base + path, { signal: AbortSignal.timeout(15000) }); body = await r.json(); }
  assert.equal(r.status, expected, path + ' HTTP status');
  console.log(JSON.stringify({ path, status: r.status, ms: Date.now()-started })); return body;
}
(async () => {
  const c = await get('/api/mobile/context'); assert.equal(c.season, 2026); assert(Number.isInteger(c.currentWeek));
  for (const lg of ['gl','bh','rb','sts']) {
    const j = await get('/api/lineups?lg='+lg+'&week='+c.currentWeek);
    assert.equal(j.lg,lg); assert.equal(j.week,c.currentWeek); assert.equal(j.partial,false); assert.equal(j.matchups.length,6);
    const teams=new Set(); for(const m of j.matchups) { teams.add(m.ia); teams.add(m.ib); assert(m.L.length>=8 && m.R.length>=8); } assert.equal(teams.size,12);
    assert(Number.isFinite(Date.parse(j.sourceUpdatedAt))); assert(j.cacheAgeSeconds>=0);
    const named=await get('/api/mobile/lineups?lg='+lg+'&week='+c.currentWeek); assert.equal(named.schemaVersion,2); assert.equal(named.matchups.length,6);
  }
  for (const week of [1,5,14]) if(c.availableWeeks.includes(week)) { const j=await get('/api/lineups?lg=gl&week='+week); assert.equal(j.week,week); assert.equal(j.matchups.length,6); }
  await get('/api/lineups?lg=gl&week=99',400); await get('/api/mobile/cron',401); await get('/api/mobile/me',401);
  console.log('Read-only deployment checks passed');
})().catch(e=>{console.error(e.message);process.exit(1);});
