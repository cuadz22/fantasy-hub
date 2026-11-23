// Render the designed preview cards using the same browser and local brand assets.
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const page=(await(await fetch('http://127.0.0.1:9237/json')).json()).find(x=>x.type==='page');
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let n=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
 const call=(method,params={})=>new Promise(r=>{const id=++n;pending.set(id,r);ws.send(JSON.stringify({id,method,params}))});
 const ev=async expression=>{const x=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(x.result.exceptionDetails)throw Error(JSON.stringify(x.result.exceptionDetails));return x.result.result.value};
 await call('Page.navigate',{url:'http://127.0.0.1:8770/redesign/index.html#network'});
 await new Promise(r=>setTimeout(r,4000));
 const result=await ev(`(async()=>{
 const load=async src=>{const i=new Image();i.src=src;await i.decode();return i};
 const brand=await load(S.logo),art={};for(const c of S.cards)art[c.league]=await load(c.leagueLogo);
 const out={};
 for(const p of Object.values(CFN_SHARE_PAGES)){
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;const c=canvas.getContext('2d');
 c.fillStyle='#151b23';c.fillRect(0,0,1200,630);
 const g=c.createRadialGradient(1020,170,0,1020,170,620);g.addColorStop(0,p.league==='gl'?'#344758':p.league==='bh'?'#342b48':'#1b4546');g.addColorStop(1,'#151b23');c.fillStyle=g;c.fillRect(0,0,1200,630);
 c.strokeStyle='#ffffff18';c.lineWidth=1;c.beginPath();c.roundRect(24,24,1152,582,30);c.stroke();
 const fit=(im,x,y,w,h)=>{const scale=Math.min(w/im.naturalWidth,h/im.naturalHeight);const dw=im.naturalWidth*scale,dh=im.naturalHeight*scale;c.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh)};
 fit(brand,64,48,110,80);
 c.fillStyle='#b7c1cc';c.font='500 16px system-ui';c.fillText('CUADZ FANTASY NETWORK',196,96);
 if(p.league)fit(art[p.league],880,170,240,270);
 else {c.globalAlpha=.9;fit(brand,860,205,265,190);c.globalAlpha=1;}
 c.fillStyle='#fff';c.font='650 62px system-ui';
 const words=p.title.split(' '),lines=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(c.measureText(next).width>760&&line){lines.push(line);line=word}else line=next}if(line)lines.push(line);
 lines.forEach((l,i)=>c.fillText(l,72,255+i*78));
 c.fillStyle='#b7c1cc';c.font='400 25px system-ui';c.fillText(p.subtitle,74,280+lines.length*78);
 c.fillStyle='#41dccb';c.fillRect(74,493,40,3);c.fillStyle='#dce1e7';c.font='500 20px system-ui';c.fillText('Independent leagues. One network.',74,546);
 c.fillStyle='#91a2b3';c.font='400 16px system-ui';c.fillText('cuadzfantasynetwork.com',884,546);
 out[p.slug]=canvas.toDataURL('image/jpeg',.88).split(',')[1];
 }return out;
})()`);
 const dir=path.resolve(__dirname,'../../client/public/redesign/assets/previews');fs.mkdirSync(dir,{recursive:true});for(const [name,data] of Object.entries(result))fs.writeFileSync(path.join(dir,name+'.jpg'),Buffer.from(data,'base64'));
 console.log('Rendered '+Object.keys(result).length+' preview images.');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
