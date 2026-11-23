const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');const assert=require('assert/strict'),fs=require('fs');
fs.mkdirSync('/tmp/cfn-polish-shots',{recursive:true});
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const p=await b.newPage({viewport:{width:1440,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const lg of ['gl','bh','rb','sts']){
  await p.goto('http://127.0.0.1:8770/redesign/index.html#league-'+lg+'/overview');
  await p.waitForFunction(lg=>CFNData.state.lineups[lg]&&CFNData.state.photoIDs&&Object.keys(CFNData.state.photoIDs).length,lg,{timeout:60000});
  await p.evaluate(()=>render(true,true));assert.equal(await p.locator('[data-detail]').count(),6);await p.locator('[data-detail]').first().click();
  await p.waitForTimeout(1200);assert(await p.locator('.premium-lineups .player-row').count()>8);
  for(const width of [390,768,1440]){await p.setViewportSize({width,height:1000});
   const bounds=await p.evaluate(()=>{const [a,b]=document.querySelectorAll('#detail .score');const A=a.getBoundingClientRect(),B=b.getBoundingClientRect();return {gap:B.left-A.right,overflow:document.documentElement.scrollWidth>innerWidth,dialogOverflow:document.querySelector('#detail').scrollWidth>document.querySelector('#detail').clientWidth};});assert(bounds.gap>=5,JSON.stringify({lg,width,bounds}));assert(!bounds.overflow);assert(!bounds.dialogOverflow);
  }
  await p.evaluate(()=>document.documentElement.dataset.theme='light');await p.screenshot({path:'/tmp/cfn-polish-shots/'+lg+'-light.png'});await p.evaluate(()=>document.documentElement.dataset.theme='dark');
  if(lg==='gl'){
   await p.evaluate(()=>{const c=currentCards('gl')[0];for(const r of c.rows){r.left.score='135.70';r.right.score='-13.40';r.left.name='Amon-Ra St. Brown';r.right.name='Christian McCaffrey';}document.querySelector('.premium-lineups').innerHTML=CFNPolish.rows(c);});
   await p.setViewportSize({width:390,height:844});
   const overflow=await p.evaluate(()=>[...document.querySelectorAll('.player-row')].some(r=>[...r.children].some(x=>x.scrollWidth>x.clientWidth+1)));if(overflow)console.log(await p.evaluate(()=>[...document.querySelectorAll('.player-row')].slice(0,2).map(r=>[...r.children].map(x=>({cls:x.className,text:x.innerText,w:x.clientWidth,s:x.scrollWidth})))));await p.screenshot({path:'/tmp/cfn-polish-shots/stress-mobile.png'});assert(!overflow,'Long names and 3-digit player scores must fit cells');await p.screenshot({path:'/tmp/cfn-polish-shots/stress-mobile.png'});
  }
  await p.locator('#detail [data-close]').click();await p.setViewportSize({width:1440,height:1100});
 }
 for(const route of ['draft','waivers','history','awards','alltime','fraud']){
  // Reload directly: assets must load even without visiting the home page first.
  await p.goto('http://127.0.0.1:8770/redesign/index.html#league-gl/'+route);await p.waitForFunction(()=>CFNData.state.resources&&Object.keys(CFNData.state.photoIDs).length);await p.waitForTimeout(900);
  if(route==='draft'){assert(await p.locator('.draft-pick .portrait img').count()>150);const widths=await p.locator('.draft-table thead th').evaluateAll(xs=>xs.slice(1).map(x=>x.getBoundingClientRect().width));assert(Math.max(...widths)-Math.min(...widths)<1);}
  if(route==='awards')assert((await p.locator('main').innerText()).includes('Mr. October'));
  if(route==='waivers'){await p.locator('[data-waiver-week="10"]').click();assert.equal(await p.locator('[data-waiver-week="10"]').getAttribute('aria-pressed'),'true');}
  if(route==='history'){await p.locator('[data-championship]').first().click();assert((await p.locator('#detail').innerText()).includes('CHAMPIONSHIP'));assert.equal(await p.locator('#detail a[href*="cfn.html"]').count(),0);await p.locator('#detail [data-close]').click();}
  if(route==='fraud'){await p.waitForSelector('.fraud-row');assert.equal(await p.locator('.fraud-row').count(),12);}
 }
 assert.deepEqual(errors,[]);console.log('Passed: 24 listed matchups, representative expanded card in each of four leagues; 390/768/1440 widths; light/dark; stress scores; direct tool links; draft columns/photos; October; waiver week buttons; native history; 12-team Fraud graphic; no browser exceptions.');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
