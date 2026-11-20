// Exports the website's own market model inputs (the stored player series that detail(k,'gl') blends) to client/api/_mm.json,
// so /api/mobile/market-movers uses the same data and formula as the site. Re-run after the Trade Calculator data changes:
//   node tools/export_mobile_model.js
const fs = require('fs'), crypto = require('crypto'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../client/public/cfn.html'), 'utf8');
const i = html.indexOf('var D = {"repl"'); if (i < 0) throw new Error('model data not found');
const start = html.indexOf('{', i); let depth = 0, inStr = false, esc = false, end = -1;
for (let k = start; k < html.length; k++) { const c = html[k];
  if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
  if (c === '"') inStr = true; else if (c === '{') depth++; else if (c === '}') { depth--; if (depth === 0) { end = k; break; } } }
const D = JSON.parse(html.slice(start, end + 1));
const players = {}, sid = {};
Object.keys(D.players).forEach(k => { const o = D.players[k]; players[k] = { n: o.n, p: o.p, t: o.t || '', s: o.s || {} }; if (D.sid && D.sid[k]) sid[k] = D.sid[k]; });
const out = { players, sid };
out.v = crypto.createHash('sha1').update(JSON.stringify(out)).digest('hex').slice(0, 10);
fs.writeFileSync(path.join(__dirname, '../client/api/_mm.json'), JSON.stringify(out));
console.log('players', Object.keys(players).length, 'sid', Object.keys(sid).length, 'version', out.v, 'bytes', JSON.stringify(out).length);
const sample = players[Object.keys(players)[0]]; console.log(JSON.stringify(sample));
