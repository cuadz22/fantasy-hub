// Live-site check in a real browser:  node tools/smoke_site.mjs [https://cuadzfantasynetwork.com]
// Loads the page, runs tools/page_checks.js inside it and exits non-zero on any failure.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const base = process.argv[2] || 'https://cuadzfantasynetwork.com';
const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'page_checks.js'), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + '/cfn.html?v=' + Date.now() + '#home', { waitUntil: 'load', timeout: 60000 });
const res = await page.evaluate(src);
await browser.close();
res.notes.forEach((n) => console.log('  ok   ' + n));
res.fails.forEach((f) => console.error('FAIL ' + f));
if (errors.length) { console.error('FAIL page errors: ' + [...new Set(errors)].slice(0, 5).join(' | ')); process.exit(1); }
if (res.fails.length) process.exit(1);
console.log('live checks passed');
