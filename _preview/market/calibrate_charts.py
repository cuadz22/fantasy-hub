import re,json,sys,numpy as np
sys.path.insert(0,'.')
from charts import SP,KM
SRCH='../../client/public/cfn.html'
h=open(SRCH).read()
i=h.index('var TC = (function(){'); j=h.index('var D = ',i)+8
D,end=json.JSONDecoder().raw_decode(h[j:])
def nn(x):
    x=x.lower().replace('’',"'"); x=re.sub(r'\b(jr|sr|ii|iii|iv)\b\.?','',x); return re.sub(r'[^a-z]','',x)
pl=D['players']
def knots(rows):  # rows: (key, chartval)
    m=[(v,pl[k]['s'].get('ros1')) for k,v in rows if pl[k]['s'].get('ros1')]
    m.sort(key=lambda t:-t[0]); cv=[a for a,_ in m]; mk=sorted([b for _,b in m],reverse=True)
    byv={}
    for a,b in zip(cv,mk): byv.setdefault(a,[]).append(b)
    xs=sorted(byv); ys=[float(np.mean(byv[x])) for x in xs]
    return xs,ys
def mk(xs,ys):
    def f(v):
        if v>=xs[-1]: return ys[-1]
        if v<=xs[0]: return ys[0]*max(v,0)/xs[0]
        return float(np.interp(v,xs,ys))
    return f
sp=[(nn(r[0]),r[1]) for r in SP]; km=[(nn(r[0]),r[1]) for r in KM]
fS=mk(*knots(sp)); fK=mk(*knots(km))
print('knots sp',[ (x,round(fS(x))) for x in (100,92,74,50,36,26,20,14,10,8)])
print('knots km',[ (x,round(fK(x))) for x in (80,74,60,50,40,29,20,14,10,5,2)])
rows={}
for r in SP:
    k=nn(r[0]); o=pl[k]; s=o['s']; a=round(fS(r[1]))
    s['sp1']=a; r1=s.get('ros1'); r2=s.get('ros2')
    s['sp2']=round(a*r2/r1) if o['p']=='QB' and r1 and r2 else a
    rows.setdefault(k,{})['sp']={'v':r[1],'d':r[2],'c':r[3],'i':r[4]}
for r in KM:
    k=nn(r[0]); o=pl[k]; s=o['s']; a=round(fK(r[1]))
    s['km1']=a; r1=s.get('ros1'); r2=s.get('ros2')
    s['km2']=round(a*r2/r1) if o['p']=='QB' and r1 and r2 else a
    rows.setdefault(k,{})['km']={'v':r[1],'d':r[2],'c':r[3],'i':r[4],'n':r[5]}
mv=[]
for k,o in rows.items():
    ds=[]
    if 'sp' in o:
        v=o['sp']['v']; d=o['sp']['d'] or 0; ds.append(fS(v)-fS(max(v-d,0)))
    if 'km' in o and not o['km']['n']:
        v=o['km']['v']; d=o['km']['d'] or 0; ds.append(fK(v)-fK(max(v-d,0)))
    d=sum(ds)/len(ds) if ds else 0
    if len(ds)==1: d*=0.7
    mv.append({'k':k,'d':round(d),**o})
mv=[m for m in mv if m['d']!=0]
D['mv']={'wk':7,'date':'Oct 21','rows':mv}
srt=sorted(mv,key=lambda m:-m['d'])
for m in srt[:8]+srt[-8:]: print(pl[m['k']]['n'],m['d'],m.get('sp',{}).get('d'),m.get('km',{}).get('d'))
new=json.dumps(D,separators=(', ',': ') ) if False else json.dumps(D)
orig=json.dumps(json.JSONDecoder().raw_decode(h[j:])[0])
print(len(orig),end, len(new))
out=h[:j]+new+h[j+end:]
open('stage1.html','w').write(out)
