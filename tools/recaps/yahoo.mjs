import fs from 'node:fs/promises';
import path from 'node:path';
import {fetchPage,parsePage} from '../../client/api/_ysweep.js';
const root=path.resolve(process.argv[2]||'outputs/CFN-Weekly-Recaps/2026-week11');
const first=JSON.parse(await fs.readFile(path.join(root,'sources','gl.json'),'utf8'));const week=first.week;
const queue=[];
for(const lg of ['gl','bh','rb','sts']){
 const x=JSON.parse(await fs.readFile(path.join(root,'sources',`${lg}.json`),'utf8'));
 for(const m of x.matchups)queue.push({lg,m});
}
const dec=s=>s.replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&quot;','"');
async function worker(){while(queue.length){const {lg,m}=queue.shift();const id=m.teams[0].teamId;const base=path.join(root,'sources',`yahoo-${lg}-${id}`);let html;
 try{html=await fs.readFile(base+'.html','utf8')}catch{html=await fetchPage(lg,week,id);await fs.writeFile(base+'.html',html)}
 const parsed=parsePage(html);await fs.writeFile(base+'.json',JSON.stringify(parsed,null,2));
 const photos={};for(const tag of html.matchAll(/<img\b[^>]+>/g)){const alt=/alt="([^"]+)"/.exec(tag[0]);const src=/src="([^"]+)"/.exec(tag[0]);if(alt&&src&&src[1].includes('nfl_cutout'))photos[dec(alt[1])]='https://'+dec(src[1]).split('https://').at(-1)}
 await fs.writeFile(base+'-photos.json',JSON.stringify(photos,null,2));console.log(lg,id,parsed.teams?.length,Object.keys(photos).length);
}}
await Promise.all(Array.from({length:3},worker));
