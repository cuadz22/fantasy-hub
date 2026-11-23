const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir='client/public',ctx={window:{}};vm.runInNewContext(fs.readFileSync(dir+'/redesign/share-pages.js','utf8'),ctx);const pages=ctx.window.CFN_SHARE_PAGES;
assert.equal(Object.keys(pages).length,80);
for(const p of Object.values(pages)){
 const html=fs.readFileSync(dir+p.url,'utf8'),image=fs.readFileSync(dir+p.image);
 assert(html.includes('og:title')&&html.includes('og:image:width" content="1200"'));
 assert(html.includes('https://cuadzfantasynetwork.com'+p.image));assert.equal(image.readUInt16BE(0),0xffd8);assert(image.length<150000);
 assert(html.includes('data-route="'+p.route+'"'));assert(!html.includes('redis'));
}
// Theme variant changes colors only; all paths, dimensions and structure are exact.
const dark=fs.readFileSync(dir+'/redesign/assets/leagues/sts.svg','utf8');let light=fs.readFileSync(dir+'/redesign/assets/leagues/sts-light.svg','utf8');
for(const [a,b] of Object.entries({'#263B4B':'#F3F6F8','#344E61':'#DCE2E7','#506A7E':'#AAB7C3'}))light=light.replaceAll(a,b);
assert.equal(dark,light);
const open=fs.readFileSync(dir+'/share/open.js','utf8');
for(const [query,route,expected] of [['?week=11&matchup=gl-1-2','league-gl/overview','?week=11&matchup=gl-1-2#league-gl/overview'],['?week=99&matchup=rb-1-3','league-gl/standings','#league-gl/standings'],['?week=10&matchup=javascript:alert(1)','league-rb/overview','?week=10#league-rb/overview']]){
 let target;vm.runInNewContext(open,{URL,URLSearchParams,location:{search:query,origin:'https://cuadzfantasynetwork.com',replace:x=>target=x},document:{body:{dataset:{route}},querySelector:()=>({})}});
 assert.equal(target,'https://cuadzfantasynetwork.com/redesign/index.html'+expected);
}
console.log('80 share pages, image metadata, unchanged SVG geometry and safe deep-link validation passed.');
