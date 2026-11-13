import json,re,math,sys
sys.path.insert(0,'/tmp/lt/l10')
RAW={}
for k in ('gl','bh','rb','sts'):
    ns={}; exec(open(f'/tmp/lt/l10/raw_{k}.py').read(),ns); RAW.update(ns['RAW'])
s=open('/tmp/lt/pt/cfn_pt.html').read()
i=s.index('var PV8=');j=s.index('\n',i);PV8=json.loads(s[i+8:j].rstrip(';'))
C=json.load(open('/tmp/lt/pt/C_dec.json'))
D={}
def norm(n):
    n=n.lower().replace('.','').replace("'",'').replace('’','')
    n=re.sub(r'\b(jr|sr|ii|iii|iv)\b','',n)
    return re.sub(r'\s+',' ',n).strip()
def sfx_strip(n):
    return n
pat=re.compile(r'([^~|]+)\|([A-Z]*)\|([ULFN])~([^~]*)~([^~]*)~([^~]+)~([^~]*)~([^~]*)~([^~|]+)\|([A-Z]*)\|([ULFN])')
def clean(n):
    n=n.strip()
    n=re.sub(r'\s*-\s*(QB|RB|WR|TE|K|DEF)$','',n)
    if 'Empty' in n and len(n)<10: return None
    return n
def deteam(n,slot):
    # strip glued team abbr e.g. 'C. HubbardCar' / 'RavensBal'
    m=re.match(r'^(.*?[a-z.\'])((?:[A-Z][a-z]{1,2})|(?:[A-Z]{2,3}))$',n)
    return m.group(1) if m else n
def num(x):
    x=x.strip().split('\n')[-1].strip()
    try: return float(x)
    except: return 0.0
def first_num(x):
    x=x.strip().split('\n')[0].strip()
    try: return float(x)
    except: return None
def resolve(ab,lg,owners,slot):
    if ab is None: return None
    if slot=='DEF':
        n=deteam(ab,slot); return n.replace(' - DEF','').strip()
    ab2=deteam(ab,slot)
    ab2=re.sub(r'\s*-\s*(QB|RB|WR|TE|K|DEF)$','',ab2)
    m=re.match(r'^([A-Z]\.(?:[A-Z]\.)?)\s*(.+)$',ab2)
    if not m: return ab2
    ini=m.group(1).replace('.','')[0].lower(); last=norm(m.group(2))
    cands=[]
    for o in owners:
        for sl,nm in C['rosters'][lg].get(o,[]):
            nn=norm(nm); parts=nn.split(' ')
            if parts[0][0]==ini and (' '.join(parts[1:])==last or ' '.join(parts[1:]).startswith(last) or last.startswith(' '.join(parts[1:]))): cands.append(nm)
    if len(cands)>=1: return cands[0]
    if slot=='K':
        for p in C['ks']:
            nn=norm(p['n']); parts=nn.split(' ')
            if parts[0][0]==ini and (' '.join(parts[1:])==last or ' '.join(parts[1:]).startswith(last)): return p['n']
    pm={'QB':'QB','RB':'RB','WR':'WR','TE':'TE'}
    g=[]
    for p in C['players']:
        nn=norm(p['n']); parts=nn.split(' ')
        if parts[0][0]==ini and (' '.join(parts[1:])==last or ' '.join(parts[1:]).startswith(last) or last.startswith(' '.join(parts[1:]))): g.append(p)
    if slot in pm:
        g2=[p for p in g if p['p']==slot]
        if g2: g=g2
    if g:
        g.sort(key=lambda p:-max(p['v']))
        return g[0]['n']
    return ab2
def team_rows(lg,owners,side_rows,side):
    out=[]; k=kk=dd=None
    for r in side_rows:
        slot,name,proj,pts,st,inj=r
        out.append(r)
    return out
def build(lg,idx,m):
    raw=RAW[(lg,[1,2,3,5,7,10][idx] if lg=='gl' else {'bh':[1,2,3,5,7,11],'rb':[1,2,3,4,6,9],'sts':[1,2,3,4,6,11]}[lg][idx])]
    head,body=raw.split('##',1)
    sa,sb,pa_,pb_=[float(x) for x in head.split('/')]
    owners=[m['a'][1],m['b'][1]]
    rows=[]
    for mt in pat.finditer(body):
        ln,li,ls,lproj,lpts,pos,rpts,rproj,rn,ri,rs=mt.groups()
        rows.append((pos.strip(),ln,li,ls,lproj,lpts,rpts,rproj,rn,ri,rs))
    A={'rows':[],'k':None,'d':None};B={'rows':[],'k':None,'d':None}
    def mk(side,slot,name,inj,st,proj,pts,agg):
        nm0=clean(name)
        if nm0 is None:
            ent=['—',0.0,2]
        else:
            full=resolve(nm0,lg,owners,slot)
            if slot not in ('K','DEF'):
                for p_ in C['players']:
                    if norm(p_['n'])==norm(full): full=p_['n']; break
            pj=num(proj); pp=None
            try: pp=float(pts)
            except: pp=None
            if st=='L': ent=[full,pp if pp is not None else 0.0,4]
            elif st=='F': ent=[full,pp if pp is not None else 0.0,2,round(pj,2)]
            elif st=='N': ent=[full,pp if pp is not None else 0.0,2]
            else: ent=[full,round(pj,2),3]
        agg.append((slot,ent,inj))
    L=[];R=[]
    for pos,ln,li,ls,lproj,lpts,rpts,rproj,rn,ri,rs in rows:
        mk('a',pos,ln,li,ls,lproj,lpts,L); mk('b',pos,rn,ri,rs,rproj,rpts,R)
    def pack(agg):
        res={'rows':[]}
        for slot,ent,inj in agg:
            if slot=='K': res['k']=ent
            elif slot=='DEF': res['d']=ent
            else:
                sl={'W/R/T':'FLX','Q/W/R/T':'SFX'}.get(slot,slot)
                res['rows'].append([sl]+ent)
        return res
    PA=pack(L);PB=pack(R)
    return sa,sb,pa_,pb_,PA,PB
out={}
for lg in ('gl','bh','rb','sts'):
    out[lg]=[]
    for i,m in enumerate(PV8[lg]):
        sa,sb,pa_,pb_,PA,PB=build(lg,i,m)
        def left(P): return sum(1 for r in P['rows'] if r[3]>=3)+(P['k'][2]>=3)+(P['d'][2]>=3)
        lf=left(PA)+left(PB)
        sdA=(m['a'][5]-m['a'][4])/2.56; sdB=(m['b'][5]-m['b'][4])/2.56
        n=len(PA['rows'])+2
        fa=left(PA)/n; fb=left(PB)/n
        sA=sdA*math.sqrt(max(fa,0.02)); sB=sdB*math.sqrt(max(fb,0.02))
        z=((pa_)-(pb_))/math.sqrt(sA**2+sB**2)
        p=round(100*0.5*(1+math.erf(z/math.sqrt(2))),1); p=min(99.0,max(1.0,p))
        def top3(P): 
            sk=sorted(P['rows'],key=lambda r:-r[2])[:3]; return [[r[1],r[2]] for r in sk]
        def a(tm,P,pr,sd,fr):
            return [tm[0],tm[1],tm[2],round(pr,1),round(pr-1.28*sd*math.sqrt(max(fr,0.02))),round(pr+1.28*sd*math.sqrt(max(fr,0.02))),top3(P)]
        e={'a':a(m['a'],PA,pa_,sdA,fa),'b':a(m['b'],PB,pb_,sdB,fb),'p':p,'h2h':m['h2h'],'note':m['note'],'riv':m['riv'],'pa':m['pa'],'pb':m['pb'],'ia':m['ia'],'ib':m['ib'],
           'ra':PA['rows'],'rb':PB['rows'],'ka':PA['k'],'kb':PB['k'],'da':PA['d'],'db':PB['d'],'ea':m['ea'],'eb':m['eb'],'left':lf,'cl':False,
           'la':{'s':sa,'done':False,'cl':False,'w':sa>sb},'lb':{'s':sb,'done':False,'cl':False,'w':sb>sa}}
        out[lg].append(e)
        print(lg,i,m['a'][0][:14],sa,sb,round(pa_,1),round(pb_,1),'p',p,'left',lf)
json.dump(out,open('/tmp/lt/l10/pvl10.json','w'),ensure_ascii=False)
# name resolution audit
unres=set()
for lg in out:
    for e in out[lg]:
        for sd in ('ra','rb'):
            for r in e[sd]:
                if re.match(r'^[A-Z]\.',r[1]): unres.add((lg,r[1]))
print('unresolved',sorted(unres))
