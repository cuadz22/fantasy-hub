/* Only writes the separate Studio media store. No app database/API writes. */
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto'), assert=require('node:assert/strict');
const {put,head,BlobNotFoundError}=require('../../client/node_modules/@vercel/blob');
const root=path.resolve(process.argv[2]);
const token=process.env.STUDIO_READ_WRITE_TOKEN;
assert(token && token.includes('0Qa2DiFFmldkQAHU'),'Use only the dedicated Studio store credential');
const read=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));
(async()=>{
 const manifest=read('manifest.json'), checks=read('layout-checks.json');
 assert.deepEqual(manifest.map(x=>x.id),['gl','bh','rb','sts']);assert.equal(checks.length,36);
 assert(checks.every(x=>x.images&&!x.overflow.length&&x.circularTeamLogos&&!x.outside));
 for(const l of manifest){assert.equal(l.slides.length,9);const d=read(l.id+'-data.json');assert.equal(d.reviewRequired.length,0);assert.equal(d.checks.verifiedAgainstYahooTeams.length,12);assert.equal(d.week,l.week);assert.equal(d.season,l.season);}
 const signature=crypto.createHash('sha256');for(const l of manifest)for(const s of l.slides)signature.update(fs.readFileSync(path.join(root,s.png)));
 const rev=signature.digest('hex').slice(0,12), prefix=`studio/drafts/${manifest[0].season}/week-${manifest[0].week}/${rev}`;
 const receiptsFile=path.join(root,'upload-receipts.json');let receipts=fs.existsSync(receiptsFile)?read('upload-receipts.json'):{};
 async function upload(file){const key=prefix+'/'+file;const body=fs.readFileSync(path.join(root,file));const digest=crypto.createHash('sha256').update(body).digest('hex');if(receipts[key]?.sha256===digest)return receipts[key].url;
  const result=await put(key,body,{token,access:'public',addRandomSuffix:false,allowOverwrite:true,multipart:body.length>5e6,cacheControlMaxAge:31536000});
  const res=await fetch(result.url,{method:'HEAD'});assert(res.ok);assert.equal(Number(res.headers.get('content-length')),body.length);
  receipts[key]={url:result.url,sha256:digest,bytes:body.length};fs.writeFileSync(receiptsFile,JSON.stringify(receipts,null,2));console.log('Stored',file);return result.url;
 }
 const files=manifest.flatMap(l=>[...l.slides.flatMap(s=>[s.png,s.preview]),l.zip]);
 const queue=[...files];await Promise.all(Array.from({length:3},async()=>{while(queue.length)await upload(queue.shift());}));
 const publicManifest=manifest.map(l=>({...l,status:'draft',slides:l.slides.map(s=>({kind:s.kind,title:s.title,png:s.png,preview:s.preview,width:s.width,height:s.height}))}));
 const m=await put(prefix+'/manifest.json',JSON.stringify(publicManifest),{token,access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',cacheControlMaxAge:31536000});
 const origin=new URL(m.url).origin, indexUrl=origin+'/studio/index.json';let old={schemaVersion:1,editions:[]},etag;
 try{const h=await head(indexUrl,{token});etag=h.etag;const res=await fetch(indexUrl+'?v='+Date.now(),{cache:'no-store'});assert(res.ok);old=await res.json();}catch(e){if(!(e instanceof BlobNotFoundError))throw e;}
 const edition={season:manifest[0].season,week:manifest[0].week,path:origin+'/'+prefix,status:'draft',revision:rev,generatedAt:new Date().toISOString()};
 // Index switches only after every asset has uploaded and passed a size check.
 old.editions=[edition,...old.editions.filter(e=>e.season!==edition.season||e.week!==edition.week)].sort((a,b)=>b.season-a.season||b.week-a.week);
 await put('studio/index.json',JSON.stringify(old),{token,access:'public',addRandomSuffix:false,allowOverwrite:true,...(etag?{ifMatch:etag}:{}),contentType:'application/json',cacheControlMaxAge:60});
 fs.writeFileSync(path.join(root,'studio-location.json'),JSON.stringify({indexUrl,edition},null,2));console.log('Draft archive ready:',indexUrl);
})().catch(e=>{console.error(e.message);process.exit(1)});
