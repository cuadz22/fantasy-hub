import json,sys
base=sys.argv[1]; out=sys.argv[2]
h=open(base).read()
i=h.index('var ST_BIG='); S,_=json.JSONDecoder().raw_decode(h[i+len('var ST_BIG='):])
R=json.load(open('fm_result.json'))
for lg,r in R.items():
    mg=S['mgr'][lg]; ts=r['teams']
    for t in ts: t['mgr']=mg.get(t['name'],t['name'])
    order=sorted(ts,key=lambda t:t['sos'])
    for rank,t in enumerate(order): t['sosr']='Easy' if rank<4 else ('Hard' if rank>=len(order)-4 else 'Mid')
js=open('fmjs.js').read()
a="function lgWaivers(p,k){"
assert h.count(a)==1
h=h.replace(a,"var FM="+json.dumps(R)+";\n"+js+"\n"+a)
b="tabs = ['Standings','Matchups','Power Rankings','Awards','Waivers','Market','History'];"
assert b in h
h=h.replace(b,"tabs = ['Standings','Matchups','Power Rankings','Fraud Meter','Awards','Waivers','Market','History'];")
c="  } else if(t==='Awards'){ awTab(p,k);"
assert c in h
h=h.replace(c,"  } else if(t==='Fraud Meter'){ lgFraud(p,k);\n"+c)
open(out,'w').write(h)
print('ok',len(h))
