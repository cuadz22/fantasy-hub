const assert=require('node:assert/strict'),fs=require('node:fs');
const vm=require('node:vm');
const context={};vm.runInNewContext(fs.readFileSync('client/public/redesign/roads.js','utf8')+';globalThis.roads=CFNRoads;',context);
const roads=context.roads;
const sample=()=>JSON.parse(fs.readFileSync('client/public/data/roads/v1/gl.json'));
let seasons=0,entries=0;
for(const lg of ['gl','bh','rb','sts']){
 const a=roads.validate(JSON.parse(fs.readFileSync(`client/public/data/roads/v1/${lg}.json`)),lg);
 roads.archives[lg]=a;seasons+=a.seasons.length;entries+=a.seasons.reduce((n,r)=>n+r.games.length,0);
 for(const r of a.seasons){assert.equal(r.missingWeeks.length,0);const html=roads.disclosure(lg,r.season);assert(html.includes('Road to the Ring'));assert(html.includes('The Final'));assert.equal((html.match(/class="road-game /g)||[]).length,r.games.length);}
}
assert.equal(seasons,27);assert.equal(entries,450);
const rejects=f=>{const a=sample();f(a);assert.throws(()=>roads.validate(a,'gl'));};
rejects(a=>a.leagueKey='rb');rejects(a=>a.seasons.push(a.seasons[0]));rejects(a=>a.seasons[0].games.push(a.seasons[0].games[0]));
rejects(a=>a.seasons[0].games[0].score=null);rejects(a=>a.seasons[0].games[0].sourceIDs=[]);rejects(a=>a.seasons[0].regularRecord='14-0-0');
rejects(a=>a.seasons[0].games[0].stage='consolation');rejects(a=>a.seasons[0].games.find(g=>g.result==='BYE').score='0.00');
rejects(a=>a.seasons[0].games.find(g=>g.isFinal).isFinal=false);
roads.archives.gl.seasons[0].teamName='<img src=x onerror=alert(1)>';
assert(!roads.disclosure('gl',2025).includes('<img src=x'));
console.log('27 seasons / 450 entries: data validation, duplicate/outcome/bye safeguards and escaped rendering passed.');
