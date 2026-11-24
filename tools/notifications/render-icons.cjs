// Small original CFN vector symbols; raster exports are for Apple's attachments.
const fs=require('fs'),path=require('path');
const dir=path.resolve(__dirname,'../../client/public/notification-media');
const symbols={trade:'<path d="M130 190h252m-64-64 64 64-64 64M382 322H130m64-64-64 64 64 64"/>',waivers:'<rect x="142" y="96" width="228" height="320" rx="28"/><path d="M210 172h94M210 230h94M210 288h94M204 351l27 27 66-68"/>'};
(async()=>{
 const tab=await(await fetch('http://127.0.0.1:9237/json/new?about:blank',{method:'PUT'})).json();
 const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
 const call=(method,params)=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))});
 for(const [name,shape]of Object.entries(symbols)){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#22353f"/><stop offset="1" stop-color="#10171e"/></linearGradient><linearGradient id="ink" x2="1" y2="1"><stop stop-color="#8bf5e6"/><stop offset="1" stop-color="#27c8b9"/></linearGradient></defs><rect x="8" y="8" width="496" height="496" rx="112" fill="url(#bg)" stroke="#ffffff" stroke-opacity=".13" stroke-width="2"/><g fill="none" stroke="url(#ink)" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">${shape}</g></svg>`;
  fs.writeFileSync(path.join(dir,name+'-v1.svg'),svg);
  const expression=`(async()=>{const i=new Image();i.src='data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}';await i.decode();const c=document.createElement('canvas');c.width=512;c.height=512;c.getContext('2d').drawImage(i,0,0);return c.toDataURL('image/png').split(',')[1]})()`;
  const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));
  fs.writeFileSync(path.join(dir,name+'-v1.png'),Buffer.from(r.result.result.value,'base64'));
 }
 ws.close();await fetch('http://127.0.0.1:9237/json/close/'+tab.id);console.log('Rendered trade and waiver icons at 512 px');
})().catch(e=>{console.error(e);process.exit(1)});
