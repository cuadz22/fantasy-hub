import json,re,sys,numpy as np
sys.path.insert(0,'.')
from km8 import KM
from sp8 import SP
def nn(x):
    x=x.lower().replace('’',"'"); x=re.sub(r'\b(jr|sr|ii|iii|iv)\b\.?','',x); return re.sub(r'[^a-z]','',x)
h=open('up/cfn.html').read()
i=h.index('var TC = (function(){'); j=h.index('var D = ',i)+8
D,end=json.JSONDecoder().raw_decode(h[j:]); pl=D['players']; keys=sorted(pl)
A={}
for l in open('mk/s.txt'):
    a=l.strip().split(':')
    if len(a)>3 and a[3]!='': A[keys[int(a[0])]]=float(a[3])
def knots(rows):
    m=[(v,pl[k]['s'].get('ros1')) for k,v in rows if pl[k]['s'].get('ros1')]
    byv={}
    for a,b in m: byv.setdefault(a,[]).append(b)
    pts=[[x,float(np.mean(byv[x])),len(byv[x]),x*len(byv[x])] for x in sorted(byv)]
    # pool adjacent violators (isotonic, increasing)
    bl=[]
    for x,y,w,xw in pts:
        bl.append([y,w,xw])
        while len(bl)>1 and bl[-2][0]>bl[-1][0]:
            y2,w2,x2=bl.pop(); y1,w1,x1=bl.pop(); bl.append([(y1*w1+y2*w2)/(w1+w2),w1+w2,x1+x2])
    xs=[b[2]/b[1] for b in bl]; ys=[b[0] for b in bl]
    return xs,ys
def mk(xs,ys):
    def f(v):
        if v>=xs[-1]: return ys[-1]
        if v<=xs[0]: return ys[0]*max(v,0)/xs[0]
        return float(np.interp(v,xs,ys))
    return f
miss=[r[0] for r in SP if nn(r[0]) not in pl]; print('SP unmatched',miss)
sp=[(nn(r[0]),r[1]) for r in SP if nn(r[0]) in pl]
km=[(nn(r[0]),r[1]) for r in KM if nn(r[0]) in pl]
fS=mk(*knots(sp)); fK=mk(*knots(km))
print('SP',[(x,round(fS(x))) for x in (100,90,76,64,44,30,20,14,10,8)]);print('KM',[(x,round(fK(x))) for x in (80,70,60,50,40,30,20,14,10,5)])
for o in pl.values(): o['s'].pop('sp1',None); o['s'].pop('sp2',None)
for o in pl.values(): o['s'].pop('km1',None); o['s'].pop('km2',None)
for r in KM:
    k=nn(r[0])
    if k not in pl: continue
    o=pl[k]; s_=o['s']; a=round(fK(r[1])); s_['km1']=a; r1=s_.get('ros1'); r2=s_.get('ros2')
    s_['km2']=round(a*r2/r1) if o['p']=='QB' and r1 and r2 else a
rows={}
for r in SP:
    k=nn(r[0])
    if k not in pl: continue
    o=pl[k]; s=o['s']; a=round(fS(r[1])); s['sp1']=a; r1=s.get('ros1'); r2=s.get('ros2')
    s['sp2']=round(a*r2/r1) if o['p']=='QB' and r1 and r2 else a
    rows.setdefault(k,{})['sp']={'v':r[1],'d':r[2],'c':r[3],'i':r[4]}
for r in KM:
    k=nn(r[0])
    if k in pl: rows.setdefault(k,{})['km']={'v':r[1],'d':r[2],'c':r[3],'i':r[4],'n':r[5]}
old={m['k']:m for m in D['mv']['rows']}
wk=json.load(open('/mnt/user-data/uploads/fantasy-hub/_preview/market/weekly_ppr_w1_6.json'))
mv=[]
for k,o in rows.items():
    ds=[]
    if 'sp' in o: v=o['sp']['v']; d=o['sp']['d'] or 0; ds.append(fS(v)-fS(max(v-d,0)))
    if 'km' in o and not o['km']['n']: v=o['km']['v']; d=o['km']['d'] or 0; ds.append(fK(v)-fK(max(v-d,0)))
    d=sum(ds)/len(ds) if ds else 0
    if len(ds)==1: d*=0.7
    d=round(d)
    if d==0: continue
    if k in old and old[k].get('pts'): pts=old[k]['pts']
    else:
        w=wk.get(k,{}); pts=[w.get(str(x)) for x in range(1,7)]+[A.get(k)]
    mv.append({'k':k,'d':d,**o,'pts':pts})
D['mv']={'wk':8,'date':'Oct 28','rows':mv}
srt=sorted(mv,key=lambda m:-m['d'])
for m in srt[:6]+srt[-6:]: print(pl[m['k']]['n'],m['d'],m.get('sp',{}).get('d'),m.get('km',{}).get('d'))
print(len(mv),'movers')
out=h[:j]+json.dumps(D)+h[j+end:]
reps=[("from the Kyle Menton trade chart (the @fantasy_spew chart has not updated yet), in market points.","from the @fantasy_spew and Kyle Menton trade charts, in market points."),
("Moves: Kyle Menton trade chart, scaled","Moves: @fantasy_spew and Kyle Menton trade charts, scaled"),
("including the Menton weekly chart (Week 8) and Spew chart (Week 7) · values Oct 27 · trades through Oct 24","including the Spew and Menton weekly charts (Week 8) · values Oct 28 · trades through Oct 24")]
for a,b in reps:
    assert out.count(a)==1,a; out=out.replace(a,b)
open('mk/stage_sp.html','w').write(out)
