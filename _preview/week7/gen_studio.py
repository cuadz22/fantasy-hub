import json,re,math,sys
SP='/tmp/claude-0/-home-claude/43474812-519b-5e6f-be1e-f37281ba1aa3/scratchpad/'
MYSRC=sys.argv[1]; MYOUT=sys.argv[2]
# reuse data prep from gen_w7 (without writing): exec up to apply section
src=open(SP+'gen/gen_w7.py').read(); cut=src.index('# ================= apply patches')
sys.argv=['x',SP+'gen/base.html','/dev/null']
exec(src[:cut])
h=open(MYSRC).read()
def nn(s):
    s=re.sub(r'[^a-z]','',s.lower()); return re.sub(r'(jr|sr|iii|ii|iv)$','',s)
proj=json.load(open(SP+'fm/proj_w7_14.json'))
p8=json.load(open(SP+'p8.json'))
INJ={}; KP={}; DP={}
for x in p8:
    pl=x.get('player') or {}; pos=pl.get('position'); st=x['stats'].get('pts_ppr')
    if pos in('QB','RB','WR','TE'): INJ[nn((pl.get('first_name') or '')+(pl.get('last_name') or ''))]=pl.get('injury_status')
    elif pos=='K' and st is not None: KP[nn((pl.get('first_name') or '')+(pl.get('last_name') or ''))]=st
    elif pos=='DEF' and st is not None: DP[x['player_id']]=st
NICK={'Cardinals':'ARI','Falcons':'ATL','Ravens':'BAL','Bills':'BUF','Panthers':'CAR','Bears':'CHI','Bengals':'CIN','Browns':'CLE','Cowboys':'DAL','Broncos':'DEN','Lions':'DET','Packers':'GB','Texans':'HOU','Colts':'IND','Jaguars':'JAX','Chiefs':'KC','Raiders':'LV','Chargers':'LAC','Rams':'LAR','Dolphins':'MIA','Vikings':'MIN','Patriots':'NE','Saints':'NO','Giants':'NYG','Jets':'NYJ','Eagles':'PHI','Steelers':'PIT','49ers':'SF','Seahawks':'SEA','Buccaneers':'TB','Titans':'TEN','Commanders':'WAS'}
SLOTS={'gl':['QB','RB','RB','WR','WR','WR','TE','FLEX'],'bh':['QB','RB','RB','WR','WR','WR','TE','FLEX'],'sts':['QB','RB','RB','WR','WR','WR','TE','FLEX'],'rb':['QB','RB','RB','WR','WR','WR','TE','FLEX','SFLEX']}
LBL={'FLEX':'FLX','SFLEX':'SFX'}
full={}
for k in KS:
    full[k]=[]
    for line,m in zip(open(SP+f'w7/{k}.full').read().strip().split('\n'),MS[k]):
        t,a,b=line.split('|'); A=[x.split(':') for x in a.split(';')]; B=[x.split(':') for x in b.split(';')]
        full[k].append((m,[[p,n,float(v)] for p,n,v in A],[[p,n,float(v)] for p,n,v in B]))
def ptrue(name,slot):
    d=D['players'].get(nn(name))
    if d: return d['p']
    return slot if slot in('QB','RB','WR','TE','K','DEF') else 'WR'
def slotlabel(s):
    if s=='W/R/T': return 'FLEX'
    if s=='Q/W/R/T': return 'SFLEX'
    return s
ORDER=lambda k:['QB','WR','WR','WR','RB','RB','TE','FLEX']+(['SFLEX'] if k=='rb' else [])+['K','DEF']
def lineup_sorted(k,lst):
    lst=[[slotlabel(p),n,v] for p,n,v in lst]
    out=[]; pool=lst[:]
    for slot in ORDER(k):
        for x in pool:
            if x[0]==slot: out.append(x); pool.remove(x); break
    assert not pool,(k,pool)
    return out
def team_obj(k,t,score,lst):
    lu=lineup_sorted(k,lst)
    lineup=[{'position':s,'name':n,'points':v} for s,n,v in lu]
    nonkd=[x for x in lineup if x['position'] not in('K','DEF')]
    top=sorted(nonkd,key=lambda x:-x['points'])[:3]
    players=[{'name':x['name'],'position':ptrue(x['name'],x['position']),'points':x['points']} for x in top]
    return {'name':nm(k,t),'score':score,'players':players,'lineup':lineup}
CD_start=re.search(r'CFN_DATA\s*=\s*',h); CD,cl=json.JSONDecoder().raw_decode(h[CD_start.end():])
for k in KS:
    ms=[]
    for m,A,B in full[k]:
        aw=m['sa']>m['sb']
        ta=team_obj(k,m['a'],m['sa'],A); tb=team_obj(k,m['b'],m['sb'],B)
        ms.append({'teamA':ta,'teamB':tb} if aw else {'teamA':tb,'teamB':ta})
    d=L[k]['d']; mv=d['mvp'][0]; du=d['dud'][0]
    CD[k]['week']=7; CD[k]['matchups']=ms
    CD[k]['mvp']=[ptrue(mv[2],'QB'),mv[2],mv[3],nm(k,mv[0])]
    CD[k]['dud']=[ptrue(du[2],'WR'),du[2],du[3],nm(k,du[0])]
    CD[k]['power']=[{'rk':i+1,'name':t['name'],'wl':f"{ST[k][t['tid']]['w']}-{ST[k][t['tid']]['l']}",'ap':f"{ST[k][t['tid']]['ap'][0]}-{ST[k][t['tid']]['ap'][1]}",'pw':float(sc),'pf':f2(ST[k][t['tid']]['pf'])} for i,(sc,t) in enumerate(pwCalc(k))]
# week-8 projected lineups
def best_lineup(k,t):
    ros=[(s,key) for s,key in next(x for x in D['teams'][k] if x['id']==t)['pl'] if s!='IR']
    cand=[]
    for s,key in ros:
        pr=proj.get(key); 
        if not pr or '8' not in pr['w']: continue
        if INJ.get(key) in('Out','IR','PUP','Sus'): continue
        pos=D['players'][key]['p']; cand.append((pr['w']['8'],pos,key))
    cand.sort(reverse=True); used=set(); rows=[]
    def take(allowed):
        for v,pos,key in cand:
            if key in used or pos not in allowed: continue
            used.add(key); return (v,pos,key)
        return None
    for slot in SLOTS[k]:
        allowed={'QB':['QB'],'RB':['RB'],'WR':['WR'],'TE':['TE'],'FLEX':['RB','WR','TE'],'SFLEX':['QB','RB','WR','TE']}[slot]
        r=take(allowed)
        rows.append([LBL.get(slot,slot),D['players'][r[2]]['n'],round(r[0],2),0] if r else [LBL.get(slot,slot),'—',0.0,0])
    return rows
def kd_proj(k,t):
    # use the team's week-7 K and DEF as proxies
    for m,A,B in full[k]:
        for tt,lst in ((m['a'],A),(m['b'],B)):
            if tt==t:
                kn=[x for x in lst if x[0]=='K'][0][1]; dn=[x for x in lst if x[0]=='DEF'][0][1]
                kv=KP.get(nn(kn),8.5); dv=DP.get(NICK.get(dn,''),7.0); return round(kv,2),round(dv,2)
    return 8.5,7.0
def nd(x): return 0.5*(1+math.erf(x/math.sqrt(2)))
PVn={}; W5={}
for k in KS:
    W5[k]=[]; PVn[k]=[]
    for _,a,b,_,_ in [s for s in L[k]['sched'] if s[0]==8]:
        side={}
        for t in (a,b):
            rows=best_lineup(k,t); kk,dd=kd_proj(k,t); s=round(sum(r[2] for r in rows)+kk+dd,2)
            sd=L[k]['fm'][t]['sd']
            side[t]=dict(id=t,m=mgr(k,t),t=nm(k,t),r=f"{ST[k][t]['w']}-{ST[k][t]['l']}",s=s,lo=round(s-1.28*sd),hi=round(s+1.28*sd),k=kk,d=dd,rows=rows,sd=sd)
        A,B=side[a],side[b]
        wp=round(100*nd((A['s']-B['s'])/math.sqrt(A['sd']**2+B['sd']**2)))
        t_,riv=h2htext(k,a,b); t_=t_.replace('&amp;','&')
        for x in (A,B): x.pop('sd')
        W5[k].append({'a':A,'b':B,'wp':wp,'h2h':t_,'riv':riv})
        PVn[k].append([A['t'],B['t'],A['s'],B['s'],A['lo'],A['hi'],B['lo'],B['hi'],wp,t_,riv])
# week-7 results cards
W4={}
def row8(k,lst):
    order=['QB','RB','RB','WR','WR','WR','TE','FLEX']+(['SFLEX'] if k=='rb' else [])
    lst=[[slotlabel(p),n,v] for p,n,v in lst]; out=[]; pool=lst[:]
    for slot in order:
        for x in pool:
            if x[0]==slot: out.append([LBL.get(slot,slot),x[1],x[2]]); pool.remove(x); break
    kk=[x for x in pool if x[0]=='K'][0][2]; dd=[x for x in pool if x[0]=='DEF'][0][2]
    return out,kk,dd
for k in KS:
    W4[k]=[]
    for m,A,B in full[k]:
        aw=m['sa']>m['sb']
        def side(t,lst,sc):
            rows,kk,dd=row8(k,lst); return {'id':t,'m':mgr(k,t),'t':nm(k,t),'r':f"{ST[k][t]['w']}-{ST[k][t]['l']}",'s':sc,'k':kk,'d':dd,'rows':rows}
        sa=side(m['a'],A,m['sa']); sb=side(m['b'],B,m['sb'])
        W4[k].append({'a':sa,'b':sb} if aw else {'a':sb,'b':sa})
# ---- write ST_BIG pieces
i=h.index('var ST_BIG='); SB,sl=json.JSONDecoder().raw_decode(h[i+len('var ST_BIG='):])
for k in KS:
    SB['cards'][k]={'w4':W4[k],'w5':W5[k]}
    d=L[k]['d']['dart'][0]
    SB['dart'][k]={'name':d[2],'fan':d[3],'proj':d[4],'pct':round((d[3]/d[4]-1)*100),'team':nm(k,d[0]),'mgr':mgr(k,d[0]),'tid':d[0]}
# pp: add players missing
for k in KS:
    for _,A,B in full[k]:
        for lst in (A,B):
            for p,n,v in lst:
                if p in('K','DEF') or n in SB['pp']: continue
                d=D['players'].get(nn(n))
                if d: SB['pp'][n]=[d['t'],d['p']]
h=h[:i+len('var ST_BIG=')]+json.dumps(SB)+h[i+len('var ST_BIG=')+sl:]
CD_start=re.search(r'CFN_DATA\s*=\s*',h); _o,cl=json.JSONDecoder().raw_decode(h[CD_start.end():])
h=h[:CD_start.end()]+json.dumps(CD)+h[CD_start.end()+cl:]
# PV7 with lineup-based projections
pi=h.index('PV7={'); _o,pe=json.JSONDecoder().raw_decode(h[pi+4:]); h=h[:pi+4]+json.dumps(PVn,ensure_ascii=False)+h[pi+4+pe:]
_n=h.index('Projected totals and win probability come from the Fraud Meter model'); _e=h.index('</p>',_n)
h=h[:_n]+'Projected totals add up each team’s best healthy lineup from consensus weekly projections (byes and Out players excluded; kickers and defenses included), shown with the 10th&ndash;90th percentile range. Win probability uses the Fraud Meter’s team-by-team scoring spread. Lineups are auto-set, so they may differ from what managers have set.'+h[_e:]
# power card footnote
old="Power = all-play 35% · last-3 all-play 15% · points for 25% · win% 20% · points against 5% · streak bonus up to ±10%. AP = all-play record."
assert old in h
h=h.replace(old,"Power Score = Fraud Meter strength rating blended with actual record (record counts 15% in Week 1, growing to 35%). 50 = league average. AP = all-play record.")
# pick'em
assert h.count("var PK={week:7,")==1; h=h.replace("var PK={week:7,","var PK={week:8,")
assert "Gentlemen's League · Week 7</div>\n    <div class=\"art-title\">Pick'em" in h
h=h.replace("Gentlemen's League · Week 7</div>\n    <div class=\"art-title\">Pick'em","Gentlemen's League · Week 8</div>\n    <div class=\"art-title\">Pick'em")
open(MYOUT,'w').write(h); print('studio written',len(h))
json.dump({'w4':W4['gl'][0],'w5':W5['gl'][0]},open(SP+'gen/studio_sample.json','w'))
