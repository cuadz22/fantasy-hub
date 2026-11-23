const assert=require('node:assert/strict'),H=require('../client/api/_speciallogs');
const row=(name,pos,pts,status='Final W 24-10 vs KC',team='DET')=>[pos,name,pos,team,9,pts,status,''];
const rec=(week,rows,extra={})=>({season:2026,lg:'gl',week,matchups:[{L:rows,R:[]}],...extra});
const records=[rec(1,[row('Lions','DEF',0),row('Jake Bates','K',12)]),rec(2,[row('Detroit Lions','DST',-3)]),rec(3,[row('Lions','DEF',0,'Bye')]),rec(4,[row('Lions','DEF',18)],{season:2025}),rec(5,[row('Lions','DEF',20)],{lg:'rb'}),rec(6,[row('Lions','DEF',8),row('Lions','DEF',9)]),rec(7,[row('Lions','DEF',9,'Q3 5:00 vs KC')]),rec(8,[row('Lions','DEF',10)],{partial:true}),rec(9,[row('Lions','DEF',11)],{season:undefined})];
const r=H.build(records,{name:'Lions',pos:'D/ST',team:'DET',league:'gl'});
assert.deepEqual(r.log.map(x=>x.wk),[9,3,2,1]);assert.equal(r.log.at(-1).pts,0);assert.equal(r.log[2].pts,-3);assert.equal(r.log[1].pts,null);assert.equal(r.log[1].bye,true);assert.equal(r.ch,null);
const k=H.build(records,{name:'Jake Bates',pos:'K',team:'DET',league:'gl'});assert.deepEqual(k.log.map(x=>x.pts),[12]);
assert.equal(H.build(records,{name:'Jake Bates',pos:'QB',team:'DET',league:'gl'}).log.length,0);
(async()=>{await assert.rejects(H.history({name:'Jake Bates',pos:'K',league:'sl'}));console.log('Special-team logs: league/season/position isolation, aliases, legacy weeks, zero/negative points, bye, conflicting duplicates, partial and unfinished games passed.');})()
const W=require('../client/api/_specialweek'),fs=require('fs'),html=fs.readFileSync('tools/fixtures/kicker-week1.html','utf8');
const parsed=W.parse(html,'gl','K',1);assert.equal(parsed.length,1);assert.equal(parsed[0].name,'Spencer Shrader');assert.equal(parsed[0].pts,7.8);assert.equal(parsed[0].played,true);assert.throws(()=>W.parse(html,'rb','K',1));assert.throws(()=>W.parse(html,'gl','K',2));assert.throws(()=>W.parse(html,'gl','DEF',1));
const zero=W.parse(html.replace('>7.80<','>0.00<'),'gl','K',1);assert.equal(zero[0].pts,0);
const absent=W.parse(html.replace(/(F-faded Bdrend"><div >)1/,'$10'),'gl','K',1);assert.equal(absent[0].pts,null);
console.log('Recorded Yahoo fixture: correct league/week/position, played zero and nonparticipation passed.');
