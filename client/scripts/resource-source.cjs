// Build-time adapter only: the existing public site remains the authoring source.
// Parse literal objects without executing the page, DOM handlers, or network code.
const fs = require('node:fs');
function literal(text, start) {
  let depth = 0, quote = null, escaped = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === quote) quote = null; }
    else if (c === '"' || c === "'") quote = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return text.slice(start, i + 1);
  }
  throw Error('Unterminated source object');
}
function object(text, name) {
  const re = new RegExp('\\b(?:var|const)\\s+' + name + '\\s*=\\s*\\{', 'g');
  for (const m of text.matchAll(re)) {
    try { return JSON.parse(literal(text, m.index + m[0].length - 1)); } catch {}
  }
  throw Error('Missing JSON source: ' + name);
}
function draft(text) {
  const marker = text.indexOf('/* ---- League Center: Draft Board');
  const m = /var DR=\{/.exec(text.slice(marker));
  if (marker < 0 || !m) throw Error('Missing draft archive');
  // The only non-JSON key in this literal is its numeric season. No eval needed.
  const raw = literal(text, marker + m.index + m[0].length - 1);
  return JSON.parse(raw.replace(/^\{(\d{4}):/, '{"$1":'));
}
module.exports = { literal, object, draft };
