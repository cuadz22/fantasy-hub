// Run with the project's protected server environment. Never prints credentials.
const M=require('../client/api/_m'),S=require('../client/api/_scoring');
(async()=>{
 const mode=process.argv[2]||'status',key='scoring:control:'+M.SEASON;
 if(mode==='status'){console.log(JSON.stringify(await M.read(key),null,2));return;}
 if(!['shadow','guarded'].includes(mode))throw Error('Use status, shadow, or guarded');
 if(mode==='guarded' && process.argv[3]!=='--reviewed')throw Error('Guarded rollout requires completed replay and staged API verification (--reviewed).');
 const old=await M.read(key);
 const control={mode,season:M.SEASON,rulesVersion:S.version,weeks:[11,12,13,14],leagues:M.LGS,changedAt:new Date().toISOString(),previousMode:old?.mode||'shadow',validation:'Weeks 9/10: 925 exact eligible starters; 96 reconciled team totals; unknown cases retain Yahoo.'};
 await M.write(key,control); console.log(JSON.stringify(control,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1});
