const fs=require('node:fs'), assert=require('node:assert/strict'), cp=require('node:child_process'), crypto=require('node:crypto');
const {object,draft}=require('./source.cjs');
const source=fs.readFileSync('client/public/cfn.html','utf8'), served=fs.readFileSync('client/public/redesign/index.html','utf8');
const contract=JSON.parse(fs.readFileSync('client/public/resources/v1.json'));
for(const name of ['LGD','FM','DPK','D','DR','ST_BIG']) assert.deepEqual(object(served,name),object(source,name),name);
assert(served.includes('If kept next season (2027)'));
assert(!served.includes('CM_BLOB'));
assert.equal(contract.sourceVersion,crypto.createHash('sha256').update(source).digest('hex'));
assert.deepEqual(contract,JSON.parse(fs.readFileSync('client/api/_resources.json')));
assert.deepEqual(contract.tools.draftSeasons,draft(source));
const lg=object(source,'LGD'),d=object(source,'D');
for(const key of ['waivers','rules','history','allt','cc']) assert.deepEqual(contract.tools[key],lg[key]);
assert.deepEqual(contract.tools.trades,d.trades);
for(const [league,board] of Object.entries(contract.tools.draft)) {
 if(!['gl','bh','rb','sts'].includes(league))continue;
 const keys=new Set(board.P.map(p=>league==='sts'?p[0]:p[0]+'.'+p[1]));
 assert.equal(keys.size,board.P.length,'Duplicate draft slot '+league);
 assert(board.P.every(p=>Number.isInteger(p[2])&&board.T[p[2]]));
 if(league!=='sts') assert(board.P.every(p=>p[1]>=1&&p[1]<=12));
 else assert(board.P.every(p=>Number.isFinite(p[6])&&p[6]>=0));
 console.log(league,board.P.length,'draft selections preserved');
}
require('../../client/public/redesign/data.js');const api=globalThis.CFNData;
api.validateResources(contract);assert.throws(()=>api.validateResources({...contract,schemaVersion:2}));
for(const league of ['bh','rb']) {
 const p=JSON.parse(fs.readFileSync('tools/redesign/fixtures/picks-'+league+'.json'));
 api.validatePicks(p,league);assert.throws(()=>api.validatePicks(p,league==='bh'?'rb':'bh'));
 const bad=structuredClone(p);bad.rows[0][0]=0;assert.throws(()=>api.validatePicks(bad,league));
 assert.equal(p.rows.flat().length,12*(league==='bh'?16:17));
 if(league==='bh') assert.equal(p.rows[1].filter(x=>x===1).length,0,'Cuadz no longer owns a BH second');
}
for(const file of ['client/vercel.json','vercel.json']) {
 const old=JSON.parse(cp.execFileSync('git',['show','c554e97:'+file],{encoding:'utf8'}));
 const next=JSON.parse(fs.readFileSync(file));old.redirects.find(x=>x.source==='/').destination='/redesign/index.html';
 if(file==='client/vercel.json') {
  const additions=next.crons.filter(x=>['/api/mobile/cron-network','/api/mobile/cron-connected','/api/mobile/cron-cantcut','/api/mobile/cron-trades','/api/mobile/cron-market','/api/mobile/cron-activities','/api/mobile/cron-recaps'].includes(x.path));
  assert.deepEqual(additions,[{path:'/api/mobile/cron-network',schedule:'* * * * *'},{path:'/api/mobile/cron-connected',schedule:'* * * * *'},{path:'/api/mobile/cron-cantcut',schedule:'0 10,22 * * *'},{path:'/api/mobile/cron-trades',schedule:'*/15 * * * *'},{path:'/api/mobile/cron-market',schedule:'7,37 * * * *'},{path:'/api/mobile/cron-activities',schedule:'* * * * *'},{path:'/api/mobile/cron-recaps',schedule:'*/15 10-23 * * 2'}]);
  next.crons=next.crons.filter(x=>!additions.includes(x));
 }
 assert.deepEqual(next,old,'Existing routes and scoring schedules remain unchanged');
}
const currentMobile=fs.readFileSync('client/api/mobile.js','utf8');
const addedRoutes=['activity/register','activity/remove','widget','cron-market','cron-activities','news','player-log','cron-cantcut','cron-network','cron-connected','network-preview','network','network/publish','network/test','connected','connected/snapshot','connected/schedule'];
const addedLines=currentMobile.split('\n').filter(line=>addedRoutes.some(route=>line.includes("r === '"+route+"'")));
assert.equal(addedLines.length,addedRoutes.length,'Exactly the tested additive routes');
const featuredField="featuredMatchups: require('./_resources.json').tools.featuredMatchups, ";
assert.equal(currentMobile.split(featuredField).length,2,'Only one optional media field added');
const mobile=currentMobile.replace(/^.*else if \(r === 'cron-recaps'\).*\n/gm,'').replace(/^.*if \(r === 'recaps' \|\|.*\n/gm,'').replace(featuredField,'').split('\n').filter(line=>!addedLines.includes(line)).join('\n');
const oldMobile=cp.execFileSync('git',['show','c554e97:client/api/mobile.js'],{encoding:'utf8'});
assert.equal(mobile.replace(/    if \(r === 'power' && req.method === 'GET'\) \{[\s\S]*?\n    \}\n/, '').replace("if (r === 'resources' && req.method === 'GET') return J(res, 200, await require('./_leagueupdates').resources(), 'public, s-maxage=60, stale-while-revalidate=60');\n    ",''),oldMobile,'No change to existing mobile routes');
console.log('Resource migration: source parity, immutable legacy contracts, all draft slots, live pick ownership, and unchanged existing API/routing behavior passed');
