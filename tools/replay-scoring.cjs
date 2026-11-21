const fs=require('fs'),S=require('../client/api/_scoregame'),{canon}=require('../client/api/_m'),{nn}=require('../client/api/_ids');
const week=Number(process.argv[2]||10), fixture=JSON.parse(require('zlib').gunzipSync(fs.readFileSync(__dirname+'/fixtures/scoring-week'+week+'.json.gz'))), snaps=fixture.snapshots;
let report={week,games:snaps.length,matched:0,unmapped:[],ineligible:[],differences:[],teams:[]};
for(const lg of ['gl','bh','rb','sts']){
 const rec=fixture.records[lg],idx=new Map(),defs=new Map();
 for(const snap of snaps){const out=S.scoreGame(lg,snap);for(const stat of snap.stats){const k=nn(stat.player.first_name+' '+stat.player.last_name)+'|'+(stat.player.position_abbreviation==='PK'?'K':stat.player.position_abbreviation)+'|'+canon(stat.team.abbreviation);if(idx.has(k))throw Error('ambiguous');idx.set(k,{...out.players[stat.player.id],game:snap.game.id,id:stat.player.id});}for(const t of [snap.game.home_team,snap.game.visitor_team])defs.set(canon(t.abbreviation),{...out.defenses[t.id],game:snap.game.id});}
 for(const m of rec.matchups)for(const [tid,rows,total] of [[m.ia,m.L,m.ya],[m.ib,m.R,m.yb]]){
  let sum=0,complete=true;
  for(const r of rows){if(['BN','IR','IR+'].includes(r[0]))continue;
   if(r[5]==null){continue;}const x=/^(DEF|DST|D\/ST)$/.test(r[2])?defs.get(canon(r[3])):idx.get(nn(r[1])+'|'+r[2]+'|'+canon(r[3]));
   const meta={lg,tid,name:r[1],pos:r[2],yahoo:r[5],bdl:x?.points,game:x?.game};
   if(!x){report.unmapped.push(meta);complete=false;continue;}if(x.points==null){report.ineligible.push({...meta,reasons:x.missing});complete=false;continue;}
   sum+=x.points;report.matched++;if(Math.abs(x.points-r[5])>.011)report.differences.push({...meta,breakdown:x.breakdown});
  }
  report.teams.push({lg,tid,complete,sum:Math.round(sum*100)/100,yahoo:total?.[0]});
 }
}
console.log(JSON.stringify(report,null,2));
