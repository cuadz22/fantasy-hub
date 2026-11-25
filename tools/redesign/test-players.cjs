const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const ctx={window:{},document:{addEventListener(){}},esc:s=>String(s).replaceAll('<','&lt;').replaceAll('"','&quot;')};
vm.runInNewContext(fs.readFileSync('client/public/redesign/players.js','utf8'),ctx);const P=ctx.window.CFNPlayers;
for(const [pos,poor,typical,good,exceptional] of [['QB',14,20,24,29],['RB',9,15,20,27],['WR',8,14.5,20,26],['TE',7,12.5,17,23],['K',7,10,14,16],['DST',4,7.5,11,14]]){
 assert.equal(P.color(pos,poor),'#ff375f');assert.equal(P.color(pos,typical),'#ffad32');assert.equal(P.color(pos,good),'#35b85a');assert.equal(P.color(pos,exceptional),'#b2f500');assert.notEqual(P.color(pos,(poor+typical)/2),P.color(pos,poor));
}
assert.equal(P.color('QB',32),'#b2f500');assert.equal(P.color('K',10),'#ffad32');assert.equal(P.color('QB',10),'#ff375f');assert.equal(P.color('FLEX',20),'#8796a6');assert.equal(P.color('K',null),'#8796a6');
assert.equal(P.resolvedPosition('K','QB'),'K');assert.equal(P.resolvedPosition('QB','K'),'QB');assert.equal(P.resolvedPosition('FLEX','WR'),'WR');assert.equal(P.resolvedPosition('LB','QB'),'LB');assert.equal(P.resolvedPosition('D/ST','QB'),'DEF');
const log=[{wk:1,pts:0,fin:true},{wk:2,pts:60,fin:true,bye:true},{wk:3,pts:null,fin:true},{wk:4,pts:-2,fin:true},{wk:5,pts:45,fin:false},{wk:6,pts:40,fin:true,out:true},{wk:13,pts:80,fin:true}];
assert.deepEqual(Array.from(P.completed(log,12),x=>x.wk),[1,4]);
const rs=[{rank:1,pointsFor:9},{rank:2,pointsFor:100},{rank:3,pointsFor:9},{rank:4,pointsFor:null}];
assert.deepEqual(Array.from(P.sortStandings(rs,'pointsFor',-1),x=>x.rank),[2,1,3,4]);assert.deepEqual(rs.map(x=>x.rank),[1,2,3,4]);assert.deepEqual(Array.from(P.sortStandings(rs,'pointsFor',1),x=>x.rank),[1,3,2,4]);
assert(P.link({name:'<script>"'},'Photo').includes('&lt;script>&quot;'));assert(!P.link({name:'<script>"'},'Photo').includes('<script>'));
const ref=JSON.parse(fs.readFileSync('client/public/redesign/player-reference.json'));assert.deepEqual(Object.keys(ref).sort(),['positions','schedule','season','week']);assert.equal(ref.season,2026);assert.equal(ref.positions['joe burrow'][0],'QB');
console.log('Player benchmarks for all six positions, FLEX resolution, missing/bye/out/zero/negative/future results, safe links, numeric sorting and preserved official ranks passed.');
