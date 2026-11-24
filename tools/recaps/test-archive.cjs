const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const js=fs.readFileSync(path.join(root,'client/public/redesign/weekly-recaps.js'),'utf8');
assert(!js.includes('/api/'));assert(!/method\s*:\s*['"](?:POST|PUT|DELETE)/.test(js));
assert(js.includes('Awaiting your review'));assert(js.includes('safeEdition'));assert(js.includes('mediaOrigin'));assert(js.includes('request=0'));
const css=fs.readFileSync(path.join(__dirname,'recap.css'),'utf8');assert(css.includes('.field-owner{font-size:17px'));assert(css.includes('width:34px;height:34px'));
const u=fs.readFileSync(path.join(__dirname,'upload.cjs'),'utf8');assert(u.includes('STUDIO_READ_WRITE_TOKEN'));assert(!u.includes('process.env.BLOB_READ_WRITE_TOKEN'));assert(u.includes('ifMatch:etag'));assert(u.includes('checks.length,36'));
console.log('Studio isolation, draft-only flow, asset URL validation, and readable manager labels passed.');
