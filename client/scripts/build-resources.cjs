const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), vm = require('node:vm');
const {object, draft} = require('./resource-source.cjs');
const client = path.resolve(__dirname,'..'), pub = path.join(client,'public');
const html = fs.readFileSync(path.join(pub,'cfn.html'),'utf8');
const hash = crypto.createHash('sha256').update(html).digest('hex');
const names = ['LGD','FM','DPK','D','DR','ST_BIG'];
const raw = Object.fromEntries(names.map(n => [n,object(html,n)]));
const {LGD,D,FM} = raw;
if (!html.includes('If kept next season (2027)')) throw Error('Keeper season changed; review contract migration');
const resources=[];
function add(league,section,group,season,title,value,detail) {
 resources.push({id:[league,section,group,season,resources.length].join('|'),league,section,group,season,title,value,detail});
}
for(const [owner,years] of Object.entries(LGD.bhKeepers)) for(const [year,players] of Object.entries(years)) players.forEach((name,i)=>add('bh','Keepers',owner,year,name,'Round '+(15+i),'Keeper slot '+(i+1)));
for(const [owner,years] of Object.entries(LGD.rbKeepers)) for(const [year,players] of Object.entries(years)) players.forEach(p=>add('rb','Keepers',owner,year,p.player,'Round '+p.round,'Contract year '+p.year+' of 3'));
// Run the site's existing pure keeper calculator, rather than maintain a second formula.
const begin=html.indexOf('  function nz(s)',html.indexOf('var DR={"jahmyrgibbs"'));
const finish=html.indexOf('  function render(box,k)',begin);
if(begin<0||finish<begin) throw Error('Keeper calculator changed: review export');
const scope={LGD,__TCD:D,DR:raw.DR, KP_MAP:{Jose:'Cuadz',Giovanny:'Gio','Kevin Huertas':'Kevin','Alex Zarate':'Pru',julio:'Julio Z',Jonathan:'John',JJ:'Jeff',Eduardo:'Eddie',Cristian:'Cris',jmena:'Hihi'}};scope.window=scope;
vm.runInNewContext(html.slice(begin,finish),scope,{timeout:1000});
for(const team of D.teams.rb) for(const slot of team.pl) {
 const x=scope.info(team,slot[1]); if(!x||x.pos==='DEF')continue;
 add('rb','Keeper Prices',team.team,'2027',x.name,x.no?'Not keepable':'Round '+x.p27,x.src+'. '+(x.no||x.note||''));
}
const tools={};
for(const key of ['waivers','waiversUpdated','clip','clipUpdated','rules','history','allt','cc']) tools[key]=LGD[key];
Object.assign(tools,{trades:D.trades,teams:D.teams,players:D.players,awards:object(html,'AWARDS'),fraud:FM,resources,draft:draft(html)['2026'],draftSeasons:draft(html),historicalFinals:object(html,'HISTX')});
// October was published later inside the recap object, not the original September array.
const october=object(html,'RCP').oct || {};
for(const [lg,award] of Object.entries(october)) {
 if(award.month !== 'October' || !Array.isArray(award.players)) throw Error('Invalid October award');
 tools.awards[lg]=[...(tools.awards[lg]||[]).filter(a=>a.month!==award.month),award];
}
// Explicit editorial picks are scoped to their authored week; never roll them forward.
const featuredSource=object(html,'PVX');
tools.featuredMatchups={season:2026,weeks:{'10':Object.fromEntries(Object.entries(featuredSource).map(([lg,items])=>[lg,Object.entries(items).filter(([,v])=>v.pt===1).map(([pair])=>pair.split('-').map(Number))]))}};
const powerScope={};
vm.runInNewContext(html.slice(html.indexOf("function pwWeight("),html.indexOf("function lgPower(")),powerScope,{timeout:1000});
tools.power=Object.fromEntries(Object.entries(FM).map(([lg,f])=>[lg,{week:f.week,rows:powerScope.pwCalc(f).rows.map(r=>({name:r.t.name,score:r.score,z:r.z,record:r.t.w+"–"+r.t.l}))}]));
const contract={schemaVersion:1,sourceVersion:hash,source:'/cfn.html',season:2026,keeperSeason:2027,pickLedger:'/api/trades',tools};
const out=path.join(client,'api/_resources.json');fs.writeFileSync(out,JSON.stringify(contract));
fs.mkdirSync(path.join(pub,'resources'),{recursive:true});fs.writeFileSync(path.join(pub,'resources/v1.json'),JSON.stringify(contract));
let template=fs.readFileSync(path.join(pub,'redesign/index.template.html'),'utf8');
const safe=x=>JSON.stringify(x).replace(/</g,'\\u003c');
// Non-executable data block: old URLSession clients use their unchanged JSON scanner.
const compatibility='<script type="application/x-cfn-legacy" id="cfn-legacy-resources">\n'+names.map(n=>'var '+n+' = '+safe(raw[n])+';').join('\n')+'\n/* If kept next season (2027) */\n</script>';
template=template.replace('<!-- LEGACY_RESOURCE_CONTRACT -->',()=>compatibility);
for (const name of names) require('node:assert/strict').deepEqual(object(template,name),raw[name], 'Legacy contract: '+name);
if (!template.includes('id="cfn-legacy-resources"')) throw Error('Compatibility marker missing');
fs.writeFileSync(path.join(pub,'redesign/index.html'),template);
console.log('Resource contract v1:',hash.slice(0,12),resources.length,'resource rows;',Buffer.byteLength(JSON.stringify(contract)),'bytes. Legacy objects preserved.');
