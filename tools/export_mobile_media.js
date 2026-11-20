// Exports the website's team/owner imagery into files with stable HTTPS URLs and writes client/api/_media.json.
//   node tools/export_mobile_media.js
// GL owner portraits (base64 inside cfn.html) become client/public/media/owners/<slug>.png; other logos are already HTTPS URLs.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..'), html = fs.readFileSync(path.join(root, 'client/public/cfn.html'), 'utf8');
const i = html.indexOf('ST_BIG={'); const s = html.indexOf('{', i); let d = 0, ins = false, e = false, end = -1;
for (let k = s; k < html.length; k++) { const c = html[k]; if (ins) { if (e) e = false; else if (c === '\\') e = true; else if (c === '"') ins = false; continue; } if (c === '"') ins = true; else if (c === '{') d++; else if (c === '}') { d--; if (d === 0) { end = k; break; } } }
const B = JSON.parse(html.slice(s, end + 1));
const dir = path.join(root, 'client/public/media/owners'); fs.mkdirSync(dir, { recursive: true });
const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const owners = {};
Object.keys(B.heads).forEach(n => { const m = /^data:image\/png;base64,(.+)$/.exec(B.heads[n]); if (!m) return; const buf = Buffer.from(m[1], 'base64'), v = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8); fs.writeFileSync(path.join(dir, slug(n) + '.png'), buf); owners[n] = { path: '/media/owners/' + slug(n) + '.png', v }; });
const teams = {};
['gl', 'bh', 'rb', 'sts'].forEach(lg => { teams[lg] = {}; const ids = B.tid[lg] || {}; Object.keys(ids).forEach(name => { const id = ids[name], mgr = (B.mgr[lg] || {})[name] || null; const logo = (B.logos[lg] || {})[String(id)] || null; const own = lg === 'gl' && mgr && owners[mgr] ? owners[mgr] : null; teams[lg][id] = { teamName: name, managerName: mgr, logoURL: logo && /^https:/.test(logo) ? logo : null, ownerPhotoPath: own && own.path, ownerPhotoV: own && own.v }; }); });
const out = { v: crypto.createHash('sha1').update(JSON.stringify(teams)).digest('hex').slice(0, 10), teams };
fs.writeFileSync(path.join(root, 'client/api/_media.json'), JSON.stringify(out));
console.log('owners', Object.keys(owners).length, 'version', out.v, Object.values(teams).map(t => Object.keys(t).length).join('/'));
