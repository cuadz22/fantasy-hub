'use strict';
const assert=require('node:assert/strict'),F=require('../client/api/_feedmedia'),N=require('../client/api/_news'),network=require('../client/api/_network');
for(const [name,pos] of [['Joe Burrow','QB'],['Jake Elliott','K'],['Lions','DEF']]){const a=F.asset(name);assert.equal(a.position,pos);assert(a.photoURL?.startsWith('https://'));}
assert.equal(F.asset('Round 5 pick').kind,'pick');assert.equal(F.asset('$35 FAB').kind,'budget');assert.equal(F.asset('Unknown Player').photoURL,null);
const now=Date.parse('2026-11-23T12:00:00Z');const item=(link)=>({headline:'Player update',link,timestamp:'2026-11-22T12:00:00Z'});
const feed=N.parse({players:[{name:'Joe Burrow',position:'QB',team:'CIN',news_items:[item('https://www.fantasypros.com/nfl/news/a.php'),item('https://espn.com/honda'),item('https://rotowire.com.evil.test/story')]},{name:'Jake Elliott',position:'K',news_items:[item('https://www.rotowire.com/football/player/a'),item('https://www.fantasypros.com/nfl/news/a.php')]}]},now);
assert.equal(feed.articles.length,2);assert.equal(feed.articles.find(a=>a.source==='FantasyPros').players.length,2);assert(feed.articles.every(a=>a.players.every(p=>p.photoURL)));
const posts=network.staticPosts();for(const p of posts.filter(p=>p.kind==='trade'))for(const s of p.sides){assert.deepEqual(s.assets.map(a=>a.name),s.players);assert(s.owner);}
const claims=posts.flatMap(p=>p.claims||[]);assert(claims.length>0);assert(claims.every(c=>c.asset.name===c.player));
console.log('Feed presentation: player/kicker/defense photos, pick/FAB assets, news source filtering, multi-player relevance, and trade direction passed.');

// Render the actual shared website formatter: opposite-side received assets are
// what each owner sends, including draft picks and qualification text.
const vm=require('node:vm'),fs=require('node:fs');
const scope={window:{},document:{addEventListener(){}},esc:s=>String(s).replaceAll('<','&lt;'),CFNPolish:{avatar:n=>'<img alt="'+n+'">'}};
vm.createContext(scope);vm.runInContext(fs.readFileSync('client/public/redesign/players.js','utf8'),scope);scope.CFNPlayers=scope.window.CFNPlayers;vm.runInContext(fs.readFileSync('client/public/redesign/updates.js','utf8'),scope);
const markup=scope.window.CFNUpdates.content({kind:'trade',sides:[{name:'Team A',owner:'John',players:['Joe Burrow']},{name:'Team B',owner:'Ed',players:['Round 2 pick','2027 Round 4 pick (from Kevin)']}]});
const [left,right]=markup.split('trade-arrow');
assert(left.includes('John')&&left.includes('Pick rounds')&&left.includes('2027 Round 4 pick (from Kevin)'));
assert(!left.includes('Joe Burrow'));assert(right.includes('Ed')&&right.includes('Joe Burrow'));
assert(!markup.includes('receives')&&!markup.includes('avatar fallback'));
console.log('Compact trade markup: sender direction, grouped rounds, original-owner/year details, and player portraits passed.');
