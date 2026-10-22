"""CFN Fraud Meter: how many wins each record is hiding (+) or faking (-) over the rest of the season."""
import json,re,math,statistics as st,sys
from collections import defaultdict
HERE='.'
LGS={'gl':('101813',['QB','RB','RB','WR','WR','WR','TE','FLEX']),'bh':('100398',['QB','RB','RB','WR','WR','WR','TE','FLEX']),
     'rb':('101720',['QB','RB','RB','WR','WR','WR','TE','FLEX','SFLEX']),'sts':('101814',['QB','RB','RB','WR','WR','WR','TE','FLEX'])}
REPL_DEFAULT={'QB':15.5,'RB':7.5,'WR':8.0,'TE':7.0}   # waiver-level points per game
FIRST_REM=7; LAST=14
K_REG=8      # games of regression for a record
W_ACT=0.78   # v2: points on the board (all-play based) dominate; projection only adjusts for roster/bye
SHRINK=0.85  # fallback only
def Phi(x): return 0.5*(1+math.erf(x/math.sqrt(2)))
def load_sched(path):
    rows=[]
    for x in open(path).read().strip().split(';'):
        a=x.split(','); rows.append((int(a[0]),int(a[1]),int(a[2]),float(a[3]) if len(a)>3 and a[3] else None,float(a[4]) if len(a)>4 and a[4] else None))
    return rows
def lineup(pl,slots,weekly,repl,byeset):
    """best lineup score for one week. pl: list of player keys on roster (not IR). weekly: key->{week->pts}. returns points"""
    return None
def best_lineup(players,slots,wk,proj,repl):
    pts=[]
    for k in players:
        p=proj.get(k)
        if not p: continue
        v=p['w'].get(wk) if wk in p['w'] else p['w'].get(str(wk))
        if v is None: continue           # bye / no projection -> unavailable that week
        pts.append((p['p'],v,k))
    used=set(); total=0.0
    def pick(allowed):
        best=None
        for pos,v,k in pts:
            if k in used or pos not in allowed: continue
            if best is None or v>best[1]: best=(pos,v,k)
        return best
    order=[s for s in slots if s not in('FLEX','SFLEX')]+[s for s in slots if s=='FLEX']+[s for s in slots if s=='SFLEX']
    for s in order:
        allowed={'FLEX':{'RB','WR','TE'},'SFLEX':{'QB','RB','WR','TE'}}.get(s,{s})
        b=pick(allowed)
        if b: used.add(b[2]); total+=b[1]
        else: total+= repl.get(s if s in repl else 'WR',8.0)   # replacement level fills an empty slot (e.g. no 2nd QB / bye)
    return total
def run(lg,tids,names,teams,proj,repl,sched,byes=None):
    cfg=LGS[lg]; slots=cfg[1]
    played=[r for r in sched if r[0]<FIRST_REM and r[3] is not None]
    rem=[r for r in sched if FIRST_REM<=r[0]<=LAST]
    G=len(set(r[0] for r in played))
    W=defaultdict(float);Lc=defaultdict(float);PF=defaultdict(list)
    for w,a,b,sa,sb in played:
        PF[a].append(sa);PF[b].append(sb)
        if sa>sb: W[a]+=1;Lc[b]+=1
        elif sb>sa: W[b]+=1;Lc[a]+=1
        else: W[a]+=.5;W[b]+=.5;Lc[a]+=.5;Lc[b]+=.5
    ids=sorted(PF)
    ppg={t:sum(PF[t])/len(PF[t]) for t in ids}
    lg_mean=st.mean(ppg.values())
    sd_w=st.mean([st.pstdev(PF[t]) for t in ids])       # within-team weekly noise
    # roster projection per team per week (bye aware, healthy only = not IR)
    rosters={t['id']:[k for s,k in t['pl'] if s!='IR'] for t in teams}
    weeks=list(range(FIRST_REM,LAST+1))
    LU={t:{w:best_lineup(rosters[t],slots,w,proj,repl) for w in weeks} for t in ids}
    avg_lu=st.mean(LU[t][w] for t in ids for w in weeks)
    neutral={t:st.mean(LU[t].values()) for t in ids}
    # ---- v2 rating: all-play + points vs that week's league average, recency weighted ----
    wk_scores=defaultdict(dict)
    for w,a,b,sa,sb in played: wk_scores[w][a]=sa; wk_scores[w][b]=sb
    gw=sorted(wk_scores); N=len(ids)
    rw={w:0.8+0.4*i/max(1,len(gw)-1) for i,w in enumerate(gw)}     # mild recency weight 0.8..1.2
    ap_exp={t:0.0 for t in ids}; devs={t:[] for t in ids}; wts=[]; CAP=1.4*sd_w; tiers={t:[0,0,0,0] for t in ids}   # finishes in 1-3, 4-6, 7-9, 10-12
    for w in gw:
        sc=wk_scores[w]; m=st.mean(sc.values()); wts.append(rw[w])
        for t in ids:
            beat=sum((sc[t]>sc[o])+0.5*(sc[t]==sc[o]) for o in ids if o!=t)/(N-1)
            ap_exp[t]+=beat; rk=1+sum(sc[o]>sc[t] for o in ids if o!=t); tiers[t][min(3,(rk-1)*4//N)]+=1; devs[t].append(max(-CAP,min(CAP,sc[t]-m)))   # one 200-pt week can't carry a rating
    pdev={t:0.5*(sum(d*w_ for d,w_ in zip(devs[t],wts))/sum(wts))+0.5*st.median(devs[t]) for t in ids}
    apw={t:ap_exp[t]/len(gw) for t in ids}
    sd_b=st.pstdev(list(pdev.values())) or 1.0
    nd=st.NormalDist()
    ap_dev={t:nd.inv_cdf(min(.97,max(.03,apw[t])))*sd_b/ max(1e-9,st.pstdev([nd.inv_cdf(min(.97,max(.03,apw[o]))) for o in ids])) for t in ids}
    tp={t:3*tiers[t][0]+2*tiers[t][1]+tiers[t][2] for t in ids}             # tier points: top 3 = 3, 4-6 = 2, 7-9 = 1, bottom 3 = 0
    hr={t:(tp[t]+3)/(3*len(gw)+6) for t in ids}
    zq=[nd.inv_cdf(min(.95,max(.05,hr[o]))) for o in ids]; zs=st.pstdev(zq) or 1.0
    hr_dev={t:nd.inv_cdf(min(.95,max(.05,hr[t])))*sd_b/zs for t in ids}
    raw={t:0.40*pdev[t]+0.35*ap_dev[t]+0.25*hr_dev[t] for t in ids}   # points, all-play, and how often you land in the top half
    # reliability: observed spread vs sampling noise of a G-game mean
    var_obs=st.pvariance(list(raw.values())); noise=sd_w**2/G
    rel=max(0.35,min(0.95,1-noise/var_obs)) if var_obs>0 else 0.6
    dev_act=dict(raw); WP=max(0.6,min(0.85,rel+0.25))          # points weight grows with the sample; never below 60%
    def S(t,w):
        dev_proj=LU[t][w]-avg_lu
        return lg_mean+(WP*dev_act[t]+(1-WP)*SHRINK*dev_proj)
    KV=6
    sdt={t:math.sqrt((G*st.pvariance(PF[t])+KV*sd_w**2)/(G+KV)) for t in ids}
    def pw(a,b,w): return Phi((S(a,w)-S(b,w))/math.sqrt(sdt[a]**2+sdt[b]**2))
    out=[]
    for t in ids:
        ew=0.0; sched_s=[]
        for w,a,b,_,_ in rem:
            if t not in (a,b): continue
            o=b if t==a else a
            p=pw(t,o,w); ew+=p; sched_s.append((w,o,p))
        n=len(sched_s); g=W[t]+Lc[t]
        ptyp=0.5+((W[t]/g)-0.5)*g/(g+K_REG)
        typ=n*ptyp
        # opponent strength (bye-neutral) for remaining schedule
        sos=st.mean(lg_mean+WP*dev_act[o]+(1-WP)*SHRINK*(neutral[o]-avg_lu) for _,o,_ in sched_s)
        out.append({'tid':t,'name':names[t],'w':W[t],'l':Lc[t],'ppg':round(ppg[t],1),'roster':round(neutral[t],1),'strength':round(S(t,FIRST_REM+1),1),
                    'ewins':round(ew,2),'typ':round(typ,2),'delta':round(ew-typ,2),'proj_w':round(W[t]+ew,1),'proj_l':round(Lc[t]+(n-ew),1),'sos':round(sos,1),'n':n,'apw':round(apw[t],3),'luck':round(W[t]-apw[t]*G,2),'rel':round(WP,2),'sd':round(sdt[t],1),'tiers':tiers[t],'G':G})
    # ---- playoff odds: simulate remaining games from each matchup's win probability (top 6 qualify; ties by points) ----
    import random; random.seed(7); SIMS=6000; POS=6
    pf0={t:sum(PF[t]) for t in ids}; games=[]
    for w,a,b,_,_ in rem: games.append((a,b,S(a,w)-S(b,w),math.sqrt(sdt[a]**2+sdt[b]**2)))
    avgp={t:S(t,FIRST_REM+1) for t in ids}; po={t:0 for t in ids}; bye={t:0 for t in ids}; title={t:0 for t in ids}
    base={t:lg_mean+WP*dev_act[t]+(1-WP)*SHRINK*(neutral[t]-avg_lu) for t in ids}   # playoff-week rating (no weekly projections that far out)
    def beat(a,b): return random.random()<Phi((base[a]+eps[a]-base[b]-eps[b])/math.sqrt(sdt[a]**2+sdt[b]**2))
    se={t:math.sqrt((WP*sd_w/math.sqrt(G))**2+((1-WP)*8.0)**2) for t in ids}   # how unsure we are of each rating after G games
    for _ in range(SIMS):
        eps={t:random.gauss(0,se[t]) for t in ids}
        wins={t:W[t] for t in ids}
        for a,b,d,sg in games:
            if random.random()<Phi((d+eps[a]-eps[b])/sg): wins[a]+=1
            else: wins[b]+=1
        key={t:(wins[t],pf0[t]+(LAST-FIRST_REM+1)*avgp[t]+random.gauss(0,sd_w*math.sqrt(LAST-FIRST_REM+1))) for t in ids}
        seeds=sorted(ids,key=lambda x:key[x],reverse=True)[:POS]
        for t in seeds: po[t]+=1
        bye[seeds[0]]+=1; bye[seeds[1]]+=1
        s1,s2,s3,s4,s5,s6=seeds                               # week 15: 3v6, 4v5 (seeds 1-2 rest)
        w1=[s3 if beat(s3,s6) else s6, s4 if beat(s4,s5) else s5]
        rem4=[s1,s2]+w1; rem4.sort(key=seeds.index)           # reseed: best remaining seed plays worst
        sf=[(rem4[0],rem4[3]),(rem4[1],rem4[2])]
        fin=[a if beat(a,b) else b for a,b in sf]
        champ=fin[0] if beat(fin[0],fin[1]) else fin[1]; title[champ]+=1
    for o in out: o['po']=round(po[o['tid']]/SIMS,3); o['bye']=round(bye[o['tid']]/SIMS,3); o['title']=round(title[o['tid']]/SIMS,3)
    out.sort(key=lambda x:-x['delta'])
    return {'week':G,'sd':round(sd_w,1),'mean':round(lg_mean,1),'teams':out}
