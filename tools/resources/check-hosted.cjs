// Read-only migration checks against the exact staged build or public domain.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {object}=require('./source.cjs');
const base=process.env.CFN_BASE_URL||'https://cuadzfantasynetwork.com';
async function get(path){
 if(process.env.CFN_VERCEL_DEPLOYMENT){
  return cp.execFileSync('vercel',['curl',path,'--deployment',process.env.CFN_VERCEL_DEPLOYMENT,'--','--fail','--silent','--show-error','--location','--max-time','25'],{encoding:'utf8',maxBuffer:20e6,stdio:['ignore','pipe','pipe']});
 }
 const r=await fetch(base+path,{signal:AbortSignal.timeout(25000)});assert.equal(r.status,200,path);return r.text();
}
(async()=>{
 const root=await get('/');assert(root.includes('CFN · Fantasy Network'));
 const old=fs.readFileSync('client/public/cfn.html','utf8');
 for(const n of ['LGD','FM','DPK','D','DR','ST_BIG'])assert.deepEqual(object(root,n),object(old,n),n);
 const legacy=await get('/cfn.html');assert.equal(legacy,old,'Original site byte parity');
 const resource=JSON.parse(await get('/resources/v1.json'));
 const api=JSON.parse(await get('/api/mobile/resources'));
 assert.deepEqual(resource,api,'Static and API resource parity');
 assert.deepEqual(resource,JSON.parse(fs.readFileSync('client/public/resources/v1.json')));
 for(const file of ['data.js','app.js','tools.js','style.css','theme.js','snapshot.js','assets/image-59.png']) {
  const body=await get('/redesign/'+file);assert(body.length>50 && !body.startsWith('<!doctype'),file);
 }
 for(const lg of ['bh','rb']){
  const x=JSON.parse(await get('/api/trades?lg='+lg));
  require('../../client/public/redesign/data.js');globalThis.CFNData.validatePicks(x,lg);
  const count=x.rows[1].filter(id=>id===1).length;
  if(lg==='bh')assert.equal(count,0,'BH Cuadz second-round picks');
  console.log(lg+': '+x.rows.flat().length+' picks; Cuadz R2='+count+'; live='+x.live);
 }
 for(const p of ['/l/gentlemens-history.html','/l/beaners-keepers.html','/l/rebirth-keepers.html','/l/studio.html','/l/pickem.html']){
  // The existing entry pages are preserved byte-for-byte; verify their hosted content.
  assert(fs.existsSync('client/public'+p),p);
  assert.equal(await get(p),fs.readFileSync('client/public'+p,'utf8'),p);
 }
 fs.writeFileSync('/tmp/cfn-hosted-home.html',root);
 console.log('Hosted migration passed: legacy objects, original site, shared resources, assets, pick ledger and retained tools.');
})().catch(e=>{console.error(e.message);process.exit(1)});
