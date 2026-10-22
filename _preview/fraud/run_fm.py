import json,sys
sys.path.insert(0,'.')
from fraud_model import *
h=open('cfn.html').read()
i=h.index('var TC = (function(){'); j=h.index('var D = ',i)+8
D,_=json.JSONDecoder().raw_decode(h[j:])
i=h.index('var ST_BIG='); S,_=json.JSONDecoder().raw_decode(h[i+len('var ST_BIG='):])
proj=json.load(open('proj_w7_14.json'))
res={}
for lg in sys.argv[1:] or ['gl']:
    ydir,slots=LGS[lg]
    sched=load_sched(f'yahoo_{lg}.txt')
    tid=S['tid'][lg]; names={v:k for k,v in tid.items()}
    rp={p:(v/12 if v else REPL_DEFAULT[p]) for p,v in D['repl'][lg].items()}
    r=run(lg,tid,names,D['teams'][lg],proj,rp,sched)
    res[lg]=r
    print(lg,'week',r['week'],'sd',r['sd'],'mean',r['mean'])
    for t in r['teams']: print(f"{t['name'][:26]:26} {t['w']:.0f}-{t['l']:.0f} ppg {t['ppg']:6} roster {t['roster']:6} str {t['strength']:6} ew {t['ewins']:4} typ {t['typ']:4} d {t['delta']:+5} -> {t['proj_w']}-{t['proj_l']} sos {t['sos']}")
json.dump(res,open('fm_result.json','w'))
