#!/usr/bin/env node
'use strict';
const fs=require('node:fs'), E=require('../../client/api/_playereditorial'),M=require('../../client/api/_m');
(async()=>{
 const file=process.argv[2];if(!file)throw Error('Usage: node tools/editorial/import.cjs feed.json [--publish]');
 const next=E.validate(JSON.parse(fs.readFileSync(file,'utf8')));
 console.log('Validated',next.items.length,'CFN player-card blurbs.');
 if(!process.argv.includes('--publish'))return console.log('Dry run only. No changes.');
 const before=await M.command(['GET',E.KEY]);
 E.assertForward(before?E.validate(JSON.parse(before)):null,next);
 const result=await M.command(['EVAL',"local old=redis.call('GET',KEYS[1]) or ''; if old~=ARGV[1] then return 0 end; redis.call('SET',KEYS[1],ARGV[2]); return 1",1,E.KEY,before||'',JSON.stringify(next)]);
 if(result!==1)throw Error('Concurrent change: no content overwritten. Retry after review.');
 console.log('Published player-card content only. News feed and push alerts unchanged. Allow up to 10 minutes for cached readers.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
