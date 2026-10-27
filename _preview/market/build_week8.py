import json,re,csv,sys,numpy as np
sys.path.insert(0,'.')
from km8 import KM
def nn(x):
    x=x.lower().replace('’',"'"); x=re.sub(r'\b(jr|sr|ii|iii|iv)\b\.?','',x); return re.sub(r'[^a-z]','',x)
h=open('up/cfn.html').read()
i=h.index('var TC = (function(){'); j=h.index('var D = ',i)+8
D,end=json.JSONDecoder().raw_decode(h[j:])
pl=D['players']; keys=sorted(pl)
# ---- Sleeper sums / actuals
S={};A={}
for l in open('mk/s.txt'):
    a=l.strip().split(':'); k=keys[int(a[0])]; S[k]=(float(a[1]),float(a[2]))
    if len(a)>3 and a[3]!='': A[k]=float(a[3])
# ---- FantasyCalc
nF=0; seen=set()
for l in open('mk/f.txt'):
    a=l.strip().split(':'); k=keys[int(a[0])]; seen.add(k)
    for n,v in zip(['ros1','ros2','dyn1','dyn2'],a[1:5]):
        if v!='': pl[k]['s'][n]=int(v); nF+=1
rm=0
for k,o in pl.items():
    if k not in seen:
        for n in ['ros1','ros2','dyn1','dyn2']:
            if n in o['s']: del o['s'][n]; rm+=1
print('FC set',nF,'removed',rm)
# ---- DynastyProcess
dp={}
for r in csv.DictReader(open('mk/dp.csv')):
    k=nn(r['player']); 
    if r['pos'] in('QB','RB','WR','TE'): dp[k]=(int(r['value_1qb']),int(r['value_2qb']))
nd=0
for k,o in pl.items():
    if k in dp: o['s']['dp1'],o['s']['dp2']=dp[k]; nd+=1
print('DP set',nd,'of',len(pl))
# ---- Kyle Menton chart -> market points
def knots(rows):
    m=[(v,pl[k]['s'].get('ros1')) for k,v in rows if pl[k]['s'].get('ros1')]
    m.sort(key=lambda t:-t[0]); byv={}
    for a,b in m: byv.setdefault(a,[]).append(b)
    xs=sorted(byv); ys=[float(np.mean(byv[x])) for x in xs]
    # enforce monotone
    for t in range(1,len(ys)): ys[t]=max(ys[t],ys[t-1])
    return xs,ys
def mk(xs,ys):
    def f(v):
        if v>=xs[-1]: return ys[-1]
        if v<=xs[0]: return ys[0]*max(v,0)/xs[0]
        return float(np.interp(v,xs,ys))
    return f
miss=[r[0] for r in KM if nn(r[0]) not in pl]; print('KM unmatched',miss)
km=[(nn(r[0]),r[1]) for r in KM if nn(r[0]) in pl]
xs,ys=knots(km); fK=mk(xs,ys)
print('knots',[(x,round(fK(x))) for x in (80,70,60,50,40,30,20,14,10,5,2)])
for o in pl.values():
    o['s'].pop('km1',None); o['s'].pop('km2',None)
rows={}
for r in KM:
    k=nn(r[0])
    if k not in pl: continue
    o=pl[k]; s=o['s']; a=round(fK(r[1]))
    s['km1']=a; r1=s.get('ros1'); r2=s.get('ros2')
    s['km2']=round(a*r2/r1) if o['p']=='QB' and r1 and r2 else a
    rows[k]={'v':r[1],'d':r[2],'c':r[3],'i':r[4],'n':r[5]}
# ---- Sleeper projection value (pj)
M=44.0; ex_old_s=S
lgs=['gl','bh','rb','sts']
newrepl={};newwire={}
for lg in lgs:
    ros=set(x[1] for t in D['teams'][lg] for x in t['pl'])
    newrepl[lg]={};newwire[lg]={}
    for pos in ['QB','RB','WR','TE']:
        c=sorted([(S[k][1],k) for k in S if pl[k]['p']==pos and k not in ros],reverse=True)[:3]
        newwire[lg][pos]=[[k,round(v,1)] for v,k in c]
        newrepl[lg][pos]=round(sum(v for v,_ in c[:2])/2,2) if len(c)>=2 else 0
    if D['repl'][lg]['QB']==0: newrepl[lg]['QB']=0.0
print('repl old',D['repl']['gl'],'new',newrepl['gl'])
upd=0
for lg in lgs:
    for k,o in pl.items():
        if k not in S: continue
        s=o['s']; old=s.get('pj@'+lg); p=o['p']
        if old is None: continue
        exo=S[k][0]-D['repl'][lg][p]; exn=S[k][1]-newrepl[lg][p]
        if exn<=0: new=0
        elif old>0 and old<10500 and exo>25: new=min(10500,old*exn/exo)
        else: new=min(10500,M*exn)
        s['pj@'+lg]=int(round(new)); upd+=1
for k,o in pl.items():
    s=o['s']
    if 'pj@gl' in s: s['pj1']=s['pj@gl']
    if 'pj@rb' in s: s['pj2']=s['pj@rb']
print('pj updated',upd)
D['repl']=newrepl; D['wire']=newwire
# ---- movers
wk=json.load(open('/mnt/user-data/uploads/fantasy-hub/_preview/market/weekly_ppr_w1_6.json'))
mv=[]
for k,o in rows.items():
    if o['n']: continue
    d=fK(o['v'])-fK(max(o['v']-(o['d'] or 0),0)); d*=0.7
    d=round(d)
    if d==0: continue
    w=wk.get(k,{}); pts=[w.get(str(x)) for x in range(1,7)]+[A.get(k)]
    mv.append({'k':k,'d':d,'km':o,'pts':pts})
D['mv']={'wk':8,'date':'Oct 27','rows':mv}
srt=sorted(mv,key=lambda m:-m['d'])
for m in srt[:6]+srt[-6:]: print(pl[m['k']]['n'],m['d'],m['km']['d'],m['pts'])
print(len(mv),'movers; ws',sum(1 for m in mv if sum(x is not None for x in m['pts'])>=3))
new=json.dumps(D)
out=h[:j]+new+h[j+end:]
out=out.replace('Weeks 7 to 18 PPR points','Weeks 8 to 18 PPR points')
open('mk/stage.html','w').write(out)
print(len(h),len(out))
