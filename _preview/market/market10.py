import json,re,csv,sys,collections,numpy as np
sys.path.insert(0,'/tmp/lt/mk')
from sp10 import SP
def nn(x):
    x=x.lower().replace('’',"'"); x=re.sub(r'\b(jr|sr|ii|iii|iv)\b\.?','',x); return re.sub(r'[^a-z]','',x)
s=open('cfn_lu.html').read()
i=s.find('var D = {')+8
D,e=json.JSONDecoder().raw_decode(s[i:]); P=D['players']
fc=json.load(open('fc_nov11.json'))
n=0
for k,a in fc.items():
    if k not in P: continue
    for q,x in zip(['ros1','ros2','dyn1','dyn2'],a):
        if x is not None: P[k]['s'][q]=x; n+=1
print('FC set',n)
def knots(rows):
    byv={}
    for k,v in rows:
        r=P[k]['s'].get('ros1')
        if r: byv.setdefault(v,[]).append(r)
    pts=[[x,float(np.mean(byv[x])),len(byv[x]),x*len(byv[x])] for x in sorted(byv)]
    bl=[]
    for x,y,w,xw in pts:
        bl.append([y,w,xw])
        while len(bl)>1 and bl[-2][0]>bl[-1][0]:
            y2,w2,x2=bl.pop(); y1,w1,x1=bl.pop(); bl.append([(y1*w1+y2*w2)/(w1+w2),w1+w2,x1+x2])
    return [b[2]/b[1] for b in bl],[b[0] for b in bl]
def mk(xs,ys):
    def f(v):
        if v>=xs[-1]: return ys[-1]
        if v<=xs[0]: return ys[0]*max(v,0)/xs[0]
        return float(np.interp(v,xs,ys))
    return f
miss=[r[0] for r in SP if nn(r[0]) not in P]; print('SP unmatched',miss)
fS=mk(*knots([(nn(r[0]),r[1]) for r in SP if nn(r[0]) in P]))
print([(x,round(fS(x))) for x in (100,88,62,50,30,20,14,10,8)])
for o in P.values(): o['s'].pop('sp1',None); o['s'].pop('sp2',None)
rows={}
for r in SP:
    k=nn(r[0])
    if k not in P: continue
    o=P[k]; s_=o['s']; a=round(fS(r[1])); s_['sp1']=a; r1=s_.get('ros1'); r2=s_.get('ros2')
    s_['sp2']=round(a*r2/r1) if o['p']=='QB' and r1 and r2 else a
    rows[k]={'sp':{'v':r[1],'d':r[2],'c':r[3],'i':r[4]}}
old={m['k']:m for m in D['mv']['rows']}
R=[x for x in csv.DictReader(open('/tmp/lt/ps.csv')) if x['season_type']=='REG']
wk=collections.defaultdict(dict)
for x in R: wk[nn(x['player_display_name'])][int(x['week'])]=float(x['fantasy_points_ppr'] or 0)
mv=[]
for k,o in rows.items():
    v=o['sp']['v']; d=o['sp']['d'] or 0
    dd=round((fS(v)-fS(max(v-d,0)))*0.7)
    if dd==0: continue
    if k in old and old[k].get('pts'): pts=list(old[k]['pts'])
    else: pts=[None]*9
    w=wk.get(k,{})
    pts=[ (round(w[x],1) if x in w else (pts[x-1] if x-1<len(pts) else None)) for x in range(1,10)]
    mv.append({'k':k,'d':dd,**o,'pts':pts})
D['mv']={'wk':10,'date':'Nov 11','rows':mv}
srt=sorted(mv,key=lambda m:-m['d'])
print(len(mv),[(P[m['k']]['n'],m['d']) for m in srt[:6]],[(P[m['k']]['n'],m['d']) for m in srt[-6:]])
out=s[:i]+json.dumps(D,ensure_ascii=False)+s[i+e:]
reps=[("FantasyCalc (Nov 9), KeepTradeCut and DynastyProcess (Nov 3) plus the Spew and Menton weekly charts (Week 9) · trades through Nov 3","FantasyCalc (Nov 11) and the Spew Week 10 chart, plus KeepTradeCut and DynastyProcess (Nov 3) and the Menton chart (Week 9) · trades through Nov 10"),
("from the @fantasy_spew and Kyle Menton trade charts, as a percent","from the @fantasy_spew Week 10 trade chart, as a percent"),
("Moves: @fantasy_spew and Kyle Menton trade charts, scaled","Moves: @fantasy_spew Week 10 trade chart, scaled")]
for a,b in reps:
    assert out.count(a)==1,a; out=out.replace(a,b)
open('cfn_mk.html','w').write(out); json.dump(D,open('D_mk.json','w'))
