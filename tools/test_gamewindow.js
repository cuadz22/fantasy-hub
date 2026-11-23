'use strict';
const assert=require('node:assert/strict'),W=require('../client/api/_gamewindow');
const now=Date.now(),future=new Date(now+3600000).toISOString();
const c={season:2026,week:11,stale:false,board:{fetchedAt:now,games:[{state:'post'},{state:'pre',start:future}]}};
const s={observedAt:now-240000,games:[{season:2026,week:11,status_state:'final'},{season:2026,week:11,status_state:'pre',date:future}]};
const h={ok:true,live:false,season:2026,week:11,checkedAt:now-240000};
assert(W.idleSchedule(s,h,c,now));
for(const change of [x=>x.c.stale=true,x=>x.c.board.stale=true,x=>x.c.board.fetchedAt=now-300001,x=>x.c.board.games[0].state='in',x=>x.c.board.games[1].start=new Date(now+600000).toISOString(),x=>x.c.board.games[1].start=new Date(now-600000).toISOString(),x=>x.s.games[0].status_state='in_progress',x=>x.s.games[1].date=new Date(now+600000).toISOString(),x=>x.s.games[1].status_state='unknown',x=>x.s.games[0].season=2025,x=>x.s.games[0].week=10,x=>x.s.games=[],x=>x.s.observedAt=now-420001,x=>x.s.observedAt=now+1,x=>x.h.ok=false,x=>x.h.live=true,x=>x.h.checkedAt=now-420001,x=>x.h.week=10,x=>x.h=null]){
 const x=structuredClone({s,h,c});change(x);assert(!W.idleSchedule(x.s,x.h,x.c,now));
}
assert(!W.recent(now+1,now,180000));assert(W.recent(now-180000,now,180000));assert(!W.recent(now-180001,now,180000));
console.log('Notification schedule: corroborated idle only; live, kickoff, overdue, unknown, stale, wrong-week, future timestamps and failed collector remain guarded.');
