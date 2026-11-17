// Build-time guard: runs before `vite build`. If anything here fails the build fails,
// so Vercel keeps serving the previous good deploy instead of publishing a broken one.
//   node scripts/check-site.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const fails = [], notes = [];
const fail = (m) => fails.push(m), ok = (m) => notes.push(m);
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const html = rd('cfn.html');

// 1. size: a truncated or emptied file is the classic bad push
const mb = Buffer.byteLength(html) / 1048576;
if (mb < 5 || mb > 15) fail(`cfn.html is ${mb.toFixed(1)} MB (expected 5-15 MB)`); else ok(`cfn.html ${mb.toFixed(1)} MB`);

// 2. every inline script must parse
const scripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
let bad = 0;
scripts.forEach((s, i) => { try { new Function(s); } catch (e) { bad++; fail(`inline script #${i} does not parse: ${e.message}`); } });
if (!bad) ok(`${scripts.length} inline scripts parse`);

// 3. markers that prove the latest work is still in the file (catches an old copy overwriting a newer one)
const markers = ['pmHead=function', 'pmPreviewHTML=function', 'cfnCoverHTML=function', 'window.wpsOpenFin', 'window.__pwUpdate',
  'window.__stsCustom', 'window.cfnOpenArt', 'window.__mktLive', 'window.RECAP10={', 'window.STORY10={', 'id="art-body-10"', 'wpsOpenFin', 'id="wkp"'];
const miss = markers.filter((m) => !html.includes(m) && !(m === 'id="art-body-10"' && html.includes('art-body-10')));
if (miss.length) fail('missing markers (stale or damaged file?): ' + miss.join(', ')); else ok('all work markers present');

// 3b. the live market feed exists
if (!fs.existsSync(path.join(root, '..', 'api', '_market.js'))) fail('client/api/_market.js is missing'); else ok('market feed present');

// 3c. Hobby plan allows 12 serverless functions: underscore files and non-js files do not count
const apiDir = path.join(root, '..', 'api');
const fnCount = fs.readdirSync(apiDir).filter((f) => /\.(js|mjs|ts)$/.test(f) && !f.startsWith('_')).length;
if (fnCount > 12) fail(`client/api has ${fnCount} functions; the Hobby plan allows 12 (move extras into an underscore module)`); else ok(`${fnCount}/12 serverless functions`);

// 3d. the encrypted Commish data must be byte-for-byte the known-good copy (a global find-and-replace once clipped it and locked everyone out)
{
  const b = /CM_BLOB\s*=\s*["']([^"']+)/.exec(html);
  const want = fs.readFileSync(new URL('./cm_blob.sha256', import.meta.url), 'utf8').trim();
  const got = b ? crypto.createHash('sha256').update(b[1]).digest('hex') : '';
  if (got !== want) fail('Commish data (CM_BLOB) changed or is damaged. If you re-encrypted it on purpose, update client/scripts/cm_blob.sha256'); else ok('Commish data matches the known-good copy');
}

// 4. no outside provider names in anything the public can read
const banned = /flock\s*fantasy|flockfantasy|fantasycalc|keeptradecut|dynastyprocess|fantasy_spew|\bspew\b|menton/i; // market sources stay private
const publicFiles = ['cfn.html', ...fs.readdirSync(path.join(root, 'l')).filter((f) => f.endsWith('.html')).map((f) => 'l/' + f)];
publicFiles.forEach((f) => { const t = rd(f).replace(/[A-Za-z0-9+\/=]{200,}/g, ''); const m = banned.exec(t); if (m) fail(`${f}: contains "${m[0]}"`); });
ok(`provider-name scan over ${publicFiles.length} public pages`);

// 5. recap copy: complete, sane, no template leftovers
try {
  const a = html.indexOf('window.RECAP10={'), b = html.indexOf('/* shareable recap links');
  if (a < 0 || b < a) throw new Error('recap block not found');
  const ctx = { window: {} }; vm.runInNewContext(html.slice(a, b), ctx);
  const R = ctx.window.RECAP10, S = ctx.window.STORY10;
  const rk = ['gl', 'bh', 'rb', 'sts'].flatMap((k) => [0, 1, 2, 3, 4, 5].map((i) => k + i));
  rk.forEach((k) => { if (!R[k]) fail('RECAP10 missing ' + k); });
  ['gl', 'bh', 'rb', 'sts'].forEach((k) => { if (!S[k]) fail('STORY10 missing ' + k); });
  const leftovers = /\{[a-z]\}|undefined|NaN|\[object|TODO|lorem|\$\{|<[a-z]/i;
  Object.entries({ ...R, ...S }).forEach(([k, v]) => {
    if (typeof v !== 'string' || v.length < 200 || v.length > 1100) fail(`copy ${k}: length ${String(v).length} outside 200-1100`);
    if (leftovers.test(v)) fail(`copy ${k}: template leftover (${leftovers.exec(v)[0]})`);
    if (/\s{2,}/.test(v)) fail(`copy ${k}: double space`);
    if (/(\d+\.\d+)\s*(?:points?)?\s*\1/.test(v)) fail(`copy ${k}: repeated number`);
  });
  ok(`recap copy: ${rk.length} matchups + 4 storylines checked`);
} catch (e) { fail('recap copy: ' + e.message); }

// 6. share pages and preview cards exist for every recap week
for (let w = 3; w <= 10; w++) {
  const p = `l/week-${w}-recap.html`;
  if (!fs.existsSync(path.join(root, p))) { fail('missing ' + p); continue; }
  const t = rd(p), m = /og:image" content="https:\/\/[^/]+(\/[^"]+)"/.exec(t);
  if (!m || !fs.existsSync(path.join(root, m[1]))) fail(`${p}: og:image file missing`);
  if (!t.includes(`#s=A~${w}`)) fail(`${p}: redirect to #s=A~${w} missing`);
}
ok('recap share pages and preview cards present');

notes.forEach((n) => console.log('  ok   ' + n));
if (fails.length) { fails.forEach((f) => console.error('FAIL ' + f)); console.error(`\n${fails.length} check(s) failed: build stopped, previous deploy stays live.`); process.exit(1); }
console.log('site checks passed');
