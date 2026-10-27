import json,re,math,sys,html as H
from collections import defaultdict
SP='/tmp/claude-0/-home-claude/43474812-519b-5e6f-be1e-f37281ba1aa3/scratchpad/'
SRC=sys.argv[1]; OUT=sys.argv[2]
h=open(SRC).read()
KS=['gl','bh','rb','sts']; WK=7
LGNAME={'gl':"Gentlemen's League",'bh':'Beaners &amp; Husseins','rb':'Rebirth','sts':'Shoot the Shits'}
LGPLAIN={'gl':"Gentlemen's League",'bh':'Beaners & Husseins','rb':'Rebirth','sts':'Shoot the Shits'}
ABBR={'gl':'GL','bh':'B&amp;H','rb':'RBT','sts':'STS'}
i=h.index('var ST_BIG='); S,_=json.JSONDecoder().raw_decode(h[i+len('var ST_BIG='):])
m=re.search(r'LGD = ',h); LGDo,lend=json.JSONDecoder().raw_decode(h[m.end():]); LG_START=m.end(); LG_END=m.end()+lend
j=h.index('var TC = (function(){'); k=h.index('var D = ',j)+8; D,_=json.JSONDecoder().raw_decode(h[k:])
FM=json.load(open(SP+'fm/fm_result.json'))
esc=lambda s:H.escape(str(s),quote=False)
def f2(x): return '%.2f'%x
def fn(x):
    x=round(x,2); s=('%.2f'%x).rstrip('0').rstrip('.'); return s
def f1(x): return fn(round(x,1)) if abs(x*10-round(x*10))<1e-6 else fn(x)
# ---- league data
L={}
for k in KS:
    tid=S['tid'][k]; names={v:n for n,v in tid.items()}; mg=S['mgr'][k]
    sched=[]
    for e in open(SP+f'fm/yahoo_{k}.txt').read().strip().split(';'):
        a=e.split(','); sched.append((int(a[0]),int(a[1]),int(a[2]),float(a[3]) if len(a)>3 else None,float(a[4]) if len(a)>4 else None))
    played=[r for r in sched if r[3] is not None]
    d=json.load(open(SP+f'w7/{k}.json'))
    L[k]=dict(tid=tid,names=names,mg=mg,sched=sched,played=played,d=d,fm={t['tid']:t for t in FM[k]['teams']})
def mgr(k,t): return L[k]['mg'][L[k]['names'][t]]
def nm(k,t): return L[k]['names'][t]
# ---- standings
def standings(k):
    ids=sorted(L[k]['names']); R={t:dict(t=t,w=0,l=0,pf=0.0,pa=0.0,res=[],t6=0) for t in ids}
    byw=defaultdict(list)
    for w,a,b,sa,sb in L[k]['played']:
        byw[w].append((a,sa)); byw[w].append((b,sb))
        R[a]['pf']+=sa;R[a]['pa']+=sb;R[b]['pf']+=sb;R[b]['pa']+=sa
        if sa>sb: R[a]['w']+=1;R[b]['l']+=1;R[a]['res'].append((w,'W'));R[b]['res'].append((w,'L'))
        else: R[b]['w']+=1;R[a]['l']+=1;R[b]['res'].append((w,'W'));R[a]['res'].append((w,'L'))
    ap={t:[0,0] for t in ids}
    for w,lst in byw.items():
        lst.sort(key=lambda x:-x[1])
        for t,s in lst:
            ap[t][0]+=sum(1 for o,so in lst if so<s); ap[t][1]+=sum(1 for o,so in lst if so>s)
        for t,s in lst[:6]: R[t]['t6']+=1
    for t in ids:
        r=R[t]; r['res'].sort(); c=r['res'][-1][1]; n=0
        for x in reversed(r['res']):
            if x[1]==c: n+=1
            else: break
        r['strk']=f'{c}-{n}'; r['ap']=ap[t]; r['pts']=4*r['w']+3*r['t6']
    return R
ST={k:standings(k) for k in KS}
def order(k):
    R=ST[k]
    if k=='sts': return sorted(R,key=lambda t:(-R[t]['pts'],-R[t]['pf']))
    return sorted(R,key=lambda t:(-R[t]['w'],-R[t]['pf']))
OR={k:order(k) for k in KS}
# ---- week-7 matches
MS={}
for k in KS:
    out=[]
    for m in L[k]['d']['m']:
        a,b=m['t']; sa,sb=m['s']
        out.append(dict(a=a,b=b,sa=sa,sb=sb,pj=m['pj'],k=m['k'],w=0 if sa>sb else 1))
    MS[k]=out
def pp(s):
    n,rest=s.rsplit(' ',1); p,j=rest.split('/'); return n,float(p),float(j)
def winner(k,m): return m['a'] if m['sa']>m['sb'] else m['b']
def loser(k,m): return m['b'] if m['sa']>m['sb'] else m['a']
# ---- storylines
def storyline(k):
    R=ST[k]; ms=MS[k]; sc=[(m['sa'],m['a'],m,0) for m in ms]+[(m['sb'],m['b'],m,1) for m in ms]
    top=max(sc,key=lambda x:x[0]); m=top[2]; side=top[3]
    tp=[pp(x) for x in m['k'][side]['top']]
    marg=max(ms,key=lambda m:abs(m['sa']-m['sb'])); clo=min(ms,key=lambda m:abs(m['sa']-m['sb']))
    s=[]
    unb=[t for t in R if R[t]['l']==0]; win=[t for t in R if R[t]['w']==0]
    lead=OR[k][0]
    if k=='sts':
        s.append(f"{esc(nm(k,lead))} ({esc(mgr(k,lead))}) leads the STS table with {R[lead]['pts']} points, one of {'%d'%len(unb)} unbeaten team{'s' if len(unb)!=1 else ''} left at {R[lead]['w']}-{R[lead]['l']}." if unb else f"{esc(nm(k,lead))} ({esc(mgr(k,lead))}) leads the STS table with {R[lead]['pts']} points at {R[lead]['w']}-{R[lead]['l']}.")
    elif len(unb)==1: s.append(f"{esc(nm(k,unb[0]))} is the only unbeaten team left in the {LGNAME[k]} at {R[unb[0]]['w']}–{R[unb[0]]['l']}.")
    elif len(unb)>1: s.append(f"{len(unb)} teams are still unbeaten in the {LGNAME[k]}: "+', '.join(esc(nm(k,t)) for t in unb)+".")
    else: s.append(f"No one is unbeaten anymore in the {LGNAME[k]}; {esc(nm(k,lead))} leads at {R[lead]['w']}–{R[lead]['l']}.")
    t0=top[1]
    s.append(f"{esc(mgr(k,t0))} posted the week’s high score, {fn(top[0])} ({esc(tp[0][0])} {fn(tp[0][1])}, {esc(tp[1][0])} {fn(tp[1][1])}), and {'won' if (m['sa']>m['sb'])==(side==0) else 'still lost'}{' by '+fn(abs(m['sa']-m['sb'])) if (m['sa']>m['sb'])==(side==0) else ' to '+esc(nm(k,loser(k,m) if False else (m['b'] if side==0 else m['a'])))+' by '+fn(abs(m['sa']-m['sb']))}.")
    mw=winner(k,marg)
    if abs(marg['sa']-marg['sb'])>=40 and marg is not m: s.append(f"The biggest margin was {fn(abs(marg['sa']-marg['sb']))}, {esc(mgr(k,mw))} over {esc(mgr(k,loser(k,marg)))}.")
    cw=winner(k,clo); cl=loser(k,clo); cside=0 if clo['a']==cl else 1; cm=abs(clo['sa']-clo['sb'])
    bn=[pp(x) for x in clo['k'][cside]['bn']]
    bs=f", who left {esc(bn[0][0])}’s {fn(bn[0][1])} on the bench" if bn and bn[0][1]>cm else ''
    s.append(f"The closest game was {esc(mgr(k,cw))}’s {fn(cm)}-point win over {esc(mgr(k,cl))}{bs}.")
    if win: s.append(f"{', '.join(esc(mgr(k,t)) for t in win)} {'is' if len(win)==1 else 'are'} still winless at 0–{R[win[0]]['l']}.")
    return ' '.join(s)
def card(k,m,idx):
    a,b=m['a'],m['b']; wn=0 if m['sa']>m['sb'] else 1
    def col(side,t):
        kk=m['k'][side]; tp=[pp(x) for x in kk['top'][:2]]; bt=[pp(x) for x in kk['bot'][:2]]
        r='<div class="mp-col"><div class="mp-team">'+esc(nm(k,t))+'</div>'
        for n,p,j in tp: r+='<div class="mprow"><span class="mp-name">'+esc(n)+'</span><span class="mp-pts">'+fn(p)+'</span></div>'
        r+='<div class="mp-sep"></div>'
        for n,p,j in bt: r+='<div class="mprow"><span class="mp-name">'+esc(n)+'</span><span class="mp-pts lo">'+fn(p)+'</span></div>'
        return r+'</div>'
    first,second=(a,b) if wn==0 else (b,a)
    fs,ss=(m['sa'],m['sb']) if wn==0 else (m['sb'],m['sa'])
    hd='<div class="mcard-hd"><div class="mcard-row"><span class="mcard-tm w">'+esc(nm(k,first))+'</span><span class="mcard-sc w">'+f2(fs)+'</span></div><div class="mcard-row"><span class="mcard-tm">'+esc(nm(k,second))+'</span><span class="mcard-sc">'+f2(ss)+'</span></div><div class="mcard-status">Final</div></div>'
    cols=(col(wn,first)+col(1-wn,second))
    # narration
    ws,ls_=wn,1-wn; margin=abs(m['sa']-m['sb']); wsc=fs; lsc=ss
    wtop=pp(m['k'][ws]['top'][0]); ltop=pp(m['k'][ls_]['top'][0]); wbot=pp(m['k'][ws]['bot'][-1]); lbot=pp(m['k'][ls_]['bot'][-1])
    lbn=[pp(x) for x in m['k'][ls_]['bn']]
    pe=m['pj'][ws]-m['pj'][ls_]
    parts=[]
    if margin<5: parts.append(f"A coin-flip finish: {esc(nm(k,first))} edged {esc(nm(k,second))} by just {fn(margin)}.")
    elif margin>=50: parts.append(f"{esc(nm(k,first))} ran away with it, winning by {fn(margin)}.")
    elif pe<-8: parts.append(f"An upset on paper: {esc(nm(k,first))} was projected {fn(abs(pe))} points behind and won by {fn(margin)}.")
    else: parts.append(f"{esc(nm(k,first))} beat {esc(nm(k,second))} by {fn(margin)}.")
    parts.append(f"{esc(wtop[0])} ({fn(wtop[1])}) led the winners{', while '+esc(ltop[0])+' ('+fn(ltop[1])+') kept '+esc(nm(k,second))+' in it' if ltop[1]>=wtop[1]-8 and 5<=margin<25 else ''}.")
    if lbn and lbn[0][1]>margin: parts.append(f"{esc(nm(k,second))} left {esc(lbn[0][0])} ({fn(lbn[0][1])}) on the bench, more than the margin.")
    elif lbot[1]<=3: parts.append(f"{esc(nm(k,second))} got {fn(lbot[1])} from {esc(lbot[0])}.")
    foot='<div style="padding:8px 11px 10px;border-top:.5px solid var(--border)"><div style="font-size:9px;letter-spacing:.04em;color:var(--dim);margin-bottom:5px">Pre-week projection: '+esc(nm(k,a))+' '+fn(m['pj'][0])+' · '+esc(nm(k,b))+' '+fn(m['pj'][1])+'</div><div style="font-size:11.5px;line-height:1.5;color:var(--text)">'+' '.join(parts)+'</div></div>'
    return '<div class="mcard">'+hd+'<div class="mcard-players mp-cols">'+cols+'</div>'+foot+'</div>'
def motm(k):
    r=''
    for m in MS[k]:
        best=None
        for side,t in ((0,m['a']),(1,m['b'])):
            n,p,j=pp(m['k'][side]['top'][0])
            if not best or p>best[1]: best=(n,p,t)
        r+='<div class="motm-card"><div class="motm-card-eyebrow">⭐ MOTM</div><div class="motm-card-match">'+esc(nm(k,m['a']))+' vs '+esc(nm(k,m['b']))+'</div><div class="motm-card-player">'+esc(best[0])+'</div><div class="motm-card-team">'+esc(nm(k,best[2]))+'</div><div class="motm-card-pts">'+fn(best[1])+'</div></div>\n      '
    return r
def awards(k):
    d=L[k]['d']; ms=MS[k]; sc=sorted([m['sa'] for m in ms]+[m['sb'] for m in ms]); med=(sc[5]+sc[6])/2
    mv=d['mvp'][0]; dud=d['dud'][0]; dart=d['dart'][0]
    top=max([(m['sa'],m['a']) for m in ms]+[(m['sb'],m['b']) for m in ms])
    clo=min(ms,key=lambda m:abs(m['sa']-m['sb'])); blo=max(ms,key=lambda m:abs(m['sa']-m['sb']))
    winners=[(max(m['sa'],m['sb']),winner(k,m)) for m in ms]; losers=[(min(m['sa'],m['sb']),loser(k,m)) for m in ms]
    lucky=min(winners); unl=max(losers)
    def card_(cls,typ,ic,win,sub,num=None):
        return f'<div class="award-card{" "+cls if cls else ""}"><div class="award-type">{typ}</div><div class="award-icon">{ic}</div><div class="award-winner">{win}</div><div class="award-sub">{sub}</div>'+(f'<div class="award-num">{num}</div>' if num is not None else '')+'</div>'
    r=''
    r+=card_('hi','MVP of the Week','🏆',esc(mv[2]),esc(nm(k,mv[0])),fn(mv[3]))+'\n      '
    r+=card_('','Dud of the Week','💀',esc(dud[2]),esc(nm(k,dud[0])),fn(dud[3]))+'\n      '
    r+=card_('hi','Lineup of the Week','🔥',esc(nm(k,top[1])),'Top lineup',f2(top[0]))+'\n      '
    r+=card_('','Closest Game','⚡',esc(nm(k,winner(k,clo)))+' def. '+esc(nm(k,loser(k,clo))),fn(abs(clo['sa']-clo['sb']))+'-pt margin')+'\n      '
    r+=card_('','Biggest Blowout','💥',esc(nm(k,winner(k,blo)))+' def. '+esc(nm(k,loser(k,blo))),fn(abs(blo['sa']-blo['sb']))+'-pt margin')+'\n      '
    r+=card_('','Lucky Winner','🍀',esc(nm(k,lucky[1])),f'Won with {f2(lucky[0])} (median {f2(med)})')+'\n      '
    r+=card_('','Unlucky Loser','😤',esc(nm(k,unl[1])),f'Lost with {f2(unl[0])} (median {f2(med)})')+'\n      '
    r+=card_('','Dart Throw of the Week','🎯',esc(dart[2]),esc(nm(k,dart[0]))+f' · {fn(dart[3])} vs {fn(dart[4])} proj','+'+str(round((dart[3]/dart[4]-1)*100))+'%')
    return r
# ---- power
def pwCalc(k):
    F=FM[k]; T=F['teams']; G=F['week']; wR=min(0.35,0.15+0.02*max(0,G-1))
    Sx=[t['strength'] for t in T]; mu=sum(Sx)/len(Sx); sd=math.sqrt(sum((x-mu)**2 for x in Sx)/len(Sx)) or 1
    P=[(t['w']+3)/(t['w']+t['l']+6) for t in T]; pm=sum(P)/len(P); ps=math.sqrt(sum((x-pm)**2 for x in P)/len(P)) or 1
    rows=[]
    for i,t in enumerate(T):
        z=(1-wR)*((t['strength']-mu)/sd)+wR*((P[i]-pm)/ps); rows.append((z,t))
    rows.sort(key=lambda x:-x[0]); return [(round(max(1,min(99,50+20*z))),t) for z,t in rows]
def power(k):
    R=ST[k]; rows=pwCalc(k); r=''
    for i,(sc,t) in enumerate(rows):
        ap=R[t['tid']]['ap']; good=' good' if sc>=56 else ''
        r+=f'<div class="ap-row"><span class="st-rk"{" style=\"color:var(--accent)\"" if i<3 else ""}>{i+1}</span><span>{esc(t["name"])}</span><span>{R[t["tid"]]["w"]}-{R[t["tid"]]["l"]}</span><span>{ap[0]}-{ap[1]}</span><span class="st-pct{good}">{sc}</span><span>{f2(R[t["tid"]]["pf"])}</span></div>\n      '
    return r
# ---- H2H
def h2h(k,a,b):
    ma,mb=mgr(k,a),mgr(k,b); H2=LGDo['allt'][k]['h2h']
    w=l=t=0
    if ma+'|'+mb in H2: w,l,t=H2[ma+'|'+mb]
    elif mb+'|'+ma in H2: l,w,t=H2[mb+'|'+ma]
    for wk,x,y,sa,sb in L[k]['played']:
        if {x,y}=={a,b}:
            aw=(sa>sb) if x==a else (sb>sa)
            if aw: w+=1
            else: l+=1
    return w,l,t
def alltime(k,t):
    o=LGDo['allt'][k]['owners'].get(mgr(k,t),[0,0,0]); w=o[0]+ST[k][t]['w']; l=o[1]+ST[k][t]['l']
    return w,l
def h2htext(k,a,b):
    w,l,t=h2h(k,a,b); n=w+l+t
    if n==0: return 'All-time H2H · first meeting · '+esc(mgr(k,a))+' vs '+esc(mgr(k,b)),0
    riv=n>=6 and abs(w-l)<=1
    return ('🔥 Rivalry · ' if riv else '')+f'All-time H2H · {esc(mgr(k,a))} {w}-{l}{"-"+str(t) if t else ""} {esc(mgr(k,b))} · {n} games',int(riv)
def preview(k):
    wk8=[s for s in L[k]['sched'] if s[0]==WK+1]; R=ST[k]
    topby={}
    for m in MS[k]:
        for side,t in ((0,m['a']),(1,m['b'])): topby[t]=[pp(x) for x in m['k'][side]['top'][:2]]
    cards=''; 
    for _,a,b,_,_ in wk8:
        t_,riv=h2htext(k,a,b)
        def team(t):
            w,l=alltime(k,t); pc=w/(w+l) if w+l else 0
            r='<div class="prev-team"><div class="prev-tm">'+esc(nm(k,t))+'</div><div class="prev-rec">'+esc(mgr(k,t))+f' · {R[t]["w"]}-{R[t]["l"]} · PF {f2(R[t]["pf"])}</div><div class="prev-rec">All-time {w}-{l} ({pc:.3f})</div>'
            for n,p,j in topby[t]: r+='<div class="prev-cap"><span class="prev-pos">Wk7</span><span class="prev-cn">'+esc(n)+'</span><span class="prev-cp">'+fn(p)+'</span></div>'
            return r+'</div>'
        cards+='<div class="prev-card"><div class="prev-card-hd"><span class="prev-card-hd-title">'+esc(nm(k,a))+' vs '+esc(nm(k,b))+'</span></div><div class="prev-h2hbar'+(' riv' if riv else '')+'">'+t_+'</div><div class="prev-teams">'+team(a)+team(b)+'</div></div>\n      '
    return cards
def lgsec(k):
    R=ST[k]
    s=f'''<!-- ══════════════════ {LGPLAIN[k].upper()} ══════════════════ -->
<div class="lg-sec">
  <div class="lg-title-row"><div class="lg-title">{LGNAME[k]}</div><span class="lg-sub">Week 7 Final · 6 Matchups</span></div>
  <div class="subsec">
    <div class="subsec-hd">Storylines</div>
    <p style="font-size:13px;line-height:1.55;margin:0 0 4px;color:var(--text)">{storyline(k)}</p>
    <p style="font-size:10px;color:var(--dim);margin-top:6px">Pre-week projections in the matchup recaps below are Yahoo’s projected totals going into the week.</p>
  </div>
  <div class="subsec">
    <div class="subsec-hd">Matchups</div>
    <div class="m3-grid">
      {chr(10).join('      '+card(k,m,i) for i,m in enumerate(MS[k])).strip()}
    </div>
  </div>
  <div class="subsec">
    <div class="subsec-hd">Man of the Match</div>
    <div class="motm-grid">
      {motm(k).strip()}
    </div>
  </div>
  <div class="subsec">
    <div class="subsec-hd">Weekly Awards</div>
    <div class="award-grid">
      {awards(k)}
    </div>
  </div>
'''
    if k=='sts': s+=stscustom()
    s+=f'''  <div class="subsec">
    <div class="subsec-hd">Power Rankings</div>
    <div class="st-table">
      <div class="ap-hdr"><span>#</span><span>Team</span><span>W-L</span><span>All-Play</span><span>Power</span><span>PF</span></div>
      {power(k).strip()}
    </div>
    <p style="font-size:10px;color:var(--dim);margin-top:2px">Power Score = Fraud Meter strength rating (points on the board, all-play, weekly finish tiers, roster strength going forward) blended with actual record; record counts for 15% in Week 1 and grows to 35%. 50 is a league-average team.</p>
  </div>
  <div class="subsec">
    <div class="subsec-hd">Week 8 Preview</div>
    <div class="prev-grid">
      {preview(k).strip()}
    </div>
  </div>
</div>
'''
    return s
def stscustom():
    R=ST['sts']; r='<div class="subsec">\n    <div class="subsec-hd">STS Custom Standings · 4 pts per win + 3 pts for a top-6 score</div>\n    <div class="st-table">\n      <div class="sts-hdr"><span>#</span><span>Team</span><span>PTS</span><span>W-L</span><span>Top 6</span><span>PF</span></div>\n'
    for i,t in enumerate(OR['sts']):
        x=R[t]; cut=' sts-cut' if i==6 else ''; ac=' style="color:var(--accent)"' if i<6 else ''; good=' good' if i<6 else ''
        r+=f'      <div class="sts-row{cut}"><span class="st-rk"{ac}>{i+1}</span><span>{esc(nm("sts",t))}</span><span class="st-pct{good}">{x["pts"]}</span><span>{x["w"]}-{x["l"]}</span><span>{x["t6"]}</span><span>{f2(x["pf"])}</span></div>\n'
    return r+'    </div>\n  </div>\n'
# ---- LGD.stand
def standhtml(k):
    R=ST[k]; r='<div class="st-table"><div class="lgs-hdr"><span>#</span><span>Team</span><span>W-L</span><span>PF</span><span>PA</span><span>Strk</span></div>'
    order_=OR[k] if k!='sts' else sorted(R,key=lambda t:(-R[t]['w'],-R[t]['pf']))
    for i,t in enumerate(order_):
        x=R[t]; ac=' style="color:var(--accent)"' if i<3 else ''
        r+=f'<div class="lgs-row"><span class="st-rk"{ac}>{i+1}</span><span class="mg-nm"><b>{esc(nm(k,t))}</b><span class="mg-lg">{esc(mgr(k,t))}</span></span><span>{x["w"]}-{x["l"]}</span><span>{f2(x["pf"])}</span><span>{f2(x["pa"])}</span><span>{"W" if x["strk"][0]=="W" else "L"}-{x["strk"][2:]}</span></div>'
    return r+'</div>'

# ================= network standings =================
def network():
    M=defaultdict(lambda:dict(w=0,l=0,pf=0.0,lg={}))
    for k in KS:
        for t,x in ST[k].items():
            o=M[mgr(k,t)]; o['w']+=x['w']; o['l']+=x['l']; o['pf']+=x['pf']; o['lg'][k]=(x['w'],x['l'])
    rows=sorted(M.items(),key=lambda kv:(-(kv[1]['w']/(kv[1]['w']+kv[1]['l'])),-kv[1]['pf']))
    r='<div class="mg-hdr"><span>#</span><span>Manager</span><span>W-L</span><span>Win%</span><span>PF</span></div>\n'
    for i,(n,o) in enumerate(rows):
        pc=o['w']/(o['w']+o['l']); lg=' · '.join(f'{ABBR[k]} {o["lg"][k][0]}-{o["lg"][k][1]}' for k in KS if k in o['lg'])
        ac=' style="color:var(--accent)"' if i<3 else ''; good=' good' if pc>=0.7 else ''
        r+=f'      <div class="mg-row"><span class="st-rk"{ac}>{i+1}</span><span class="mg-nm"><b>{esc(n)}</b><span class="mg-lg">{lg}</span></span><span>{o["w"]}-{o["l"]}</span><span class="st-pct{good}">{pc:.3f}</span><span>{f2(o["pf"])}</span></div>\n'
    return r,rows
NETROWS,_NR=network()
def network_sec():
    return f'''  <!-- NETWORK STANDINGS -->
  <div>
    <div class="sec-hd"><span class="sec-label">Network Standings</span><div class="sec-rule"></div></div>
    <div class="st-table" style="margin-bottom:14px">
      {NETROWS.strip()}
    </div>
    <p style="font-size:10px;color:var(--dim);margin-bottom:18px">Manager standings combine every team a person runs across the four leagues · Ranked by win%, then total PF</p>
    
  </div>
'''
# ================= news cards =================
def byes():
    pj={}
    for w in (8,9):
        pass
    p8=json.load(open(SP+'fm/proj_w7_14.json'))
    out=[]
    cnt=defaultdict(int); who=defaultdict(lambda:defaultdict(int))
    for k in KS:
        for t in D['teams'][k]:
            for s,key in t['pl']:
                if s in('BN','IR'): continue
                pr=p8.get(key)
                if pr and '8' not in pr['w'] and '9' in pr['w'] and '10' in pr['w']:
                    cnt[key]+=1; who[(k,t['mgr'])][key]+=1
    top=sorted(cnt.items(),key=lambda x:-x[1])[:5]
    names=', '.join(f"{D['players'][k]['n']} ({n})" for k,n in top)
    mg=sorted(who.items(),key=lambda x:-sum(x[1].values()))[:5]
    chips=''.join(f'<span class="chip hi">{esc(m)} · {LGNAME[k]}</span>' for (k,m),_ in mg)
    return names,chips
def news():
    unb={k:[mgr(k,t)+f' ({ST[k][t]["w"]}-{ST[k][t]["l"]})' for t in ST[k] if ST[k][t]['l']==0] for k in KS}
    nun=sum(len(v) for v in unb.values())
    win={k:[mgr(k,t) for t in ST[k] if ST[k][t]['w']==0] for k in KS}; nw=sum(len(v) for v in win.values())
    lg=lambda dct:''.join(f'<div class="nc-lg"><b>{LGNAME[k]}</b>{", ".join(esc(x) for x in dct[k]) if dct[k] else "None"}</div>' for k in KS)
    names,chips=byes()
    # top team scores
    allsc=[]
    for k in KS:
        for m in MS[k]: allsc+= [(m['sa'],k,m['a']),(m['sb'],k,m['b'])]
    allsc.sort(reverse=True); top=allsc[:3]
    tp=''.join(f'<div class="nc-lg"><b>{ABBR[k]}</b>{esc(nm(k,t))} · {f2(s)}</div>' for s,k,t in top)
    return f'''<div class="news-grid">
      <div class="nc">
        <span class="nc-tag">🏁 Undefeated Watch</span>
        <div class="nc-hl">{["No One","One Team","Two Teams","Three Teams","Four Teams","Five Teams"][nun] if nun<6 else str(nun)+" Teams"} {"Is" if nun==1 else "Are"} Still Perfect</div>
        <div class="nc-body">Week 7 trimmed the field. The teams with a clean record, by league:</div>
        {lg(unb)}
      </div>
      <div class="nc">
        <span class="nc-tag">⚠️ Panic Meter</span>
        <div class="nc-hl">{["Nobody Is","One Manager Is","Two Managers Are","Three Managers Are"][nw] if nw<4 else str(nw)+" Managers Are"} Still Winless</div>
        <div class="nc-body">With a 14-game season, a winless start through seven games leaves almost no room for a playoff run. The winless, by league:</div>
        {lg(win)}
      </div>
      <div class="nc">
        <span class="nc-tag">🔥 Top Scores</span>
        <div class="nc-hl">The Three Biggest Weeks on the Network</div>
        <div class="nc-body">The highest team scores of Week 7, across all four leagues:</div>
        {tp}
      </div>
      <div class="nc">
        <span class="nc-tag">🗓️ Bye Week</span>
        <div class="nc-hl">Who's Dealing With the Week 8 Byes?</div>
        <div class="nc-body">{esc(names)} are the most-started players sitting out Week 8 (number of starting slots across the network, as currently set).</div>
        <div class="chips">{chips}</div>
      </div>
    </div>'''
# ================= full article body =================
def body7():
    s='<div id="art-body">\n  <!-- NEWS / HEADLINES -->\n  <div>\n    <div class="sec-hd"><span class="sec-label">Around the Network</span><div class="sec-rule"></div></div>\n    '+news()+'\n  </div>\n\n'
    for k in KS: s+=lgsec(k)
    s+='\n'+network_sec()+'</div>\n'
    return s
# ================= lcards =================
def lcard_upd(hh):
    for k in KS:
        name=LGNAME[k]
        a=hh.index(f"class=\"lcard\" onclick=\"showLeague('{k}')\"")
        b=hh.index('<div class="lcard-cta">',a)
        blk=hh[a:b]
        R=ST[k]; o=OR[k]
        rows=''
        for i in range(3):
            t=o[i]; rec=f'{R[t]["pts"]} pts' if k=='sts' else f'{R[t]["w"]}-{R[t]["l"]}'
            rows+=f'<div class="lcard-standing"><span class="lcard-pos">{i+1}.</span><span class="lcard-tm">{esc(nm(k,t))}</span><span class="lcard-rec">{rec}</span></div>\n          '
        pl=max(R,key=lambda t:R[t]['pf'])
        new=blk[:blk.index('<div class="lcard-standing">')]+rows+f'<div class="lcard-pf-row">\n            <span class="lcard-pf-key">Point Leader</span>\n            <span class="lcard-pf-val">{esc(nm(k,pl))} · {R[pl]["pf"]:.1f}</span>\n          </div>\n          '
        hh=hh[:a]+new+hh[b:]
    return hh
# ================= PV8 =================
def pv8():
    out={}
    for k in KS:
        F=L[k]['fm']; rows=[]
        for _,a,b,_,_ in [s for s in L[k]['sched'] if s[0]==WK+1]:
            fa,fb=F[a],F[b]; sa,sb=fa['s8'],fb['s8']; da,db=fa['sd'],fb['sd']
            p=0.5*(1+math.erf(((sa-sb)/math.sqrt(da**2+db**2))/math.sqrt(2)))
            t_,riv=h2htext(k,a,b)
            rows.append([nm(k,a),nm(k,b),round(sa,2),round(sb,2),round(sa-1.28*da),round(sa+1.28*da),round(sb-1.28*db),round(sb+1.28*db),round(p*100),t_.replace('&amp;','&'),riv])
        out[k]=rows
    return out
# ================= apply patches =================
def one(s,old,new,count=1):
    assert s.count(old)==count,(old[:60],s.count(old)); return s.replace(old,new)
# 1. article bodies
a0=h.index('<div id="art-body">'); a1=h.index('<div id="art-body-5" hidden>')
old6=h[a0:a1].replace('<div id="art-body">','<div id="art-body-6" hidden>',1)
h=h[:a0]+body7()+old6+h[a1:]
# 2. JS
h=one(h,"document.getElementById('art-body').hidden=(w!==6);","document.getElementById('art-body').hidden=(w!==7);\n  document.getElementById('art-body-6').hidden=(w!==6);")
h=one(h,'6:["CFN · Weekly Edition · Oct 20, 2026","Week 6 Recap &amp; Week 7 Preview"]};','6:["CFN · Weekly Edition · Oct 20, 2026","Week 6 Recap &amp; Week 7 Preview"],7:["CFN · Weekly Edition · Oct 27, 2026","Week 7 Recap &amp; Week 8 Preview"]};')
h=one(h,"[3,4,5,6].forEach(function(x){ var p=document.getElementById('wpill-'+x);","[3,4,5,6,7].forEach(function(x){ var p=document.getElementById('wpill-'+x);")
h=one(h,"showWeek(week===3?3:week===4?4:week===5?5:6);","showWeek([3,4,5,6,7].indexOf(week)>=0?week:7);")
h=one(h,'<button class="wpill active" id="wpill-6" onclick="showWeek(6)">6</button>\n      <button class="wpill future" disabled>7</button>','<button class="wpill" id="wpill-6" onclick="showWeek(6)">6</button>\n      <button class="wpill active" id="wpill-7" onclick="showWeek(7)">7</button>')
h=one(h,'<div class="art-eye" id="art-eye">CFN · Weekly Edition · Oct 20, 2026</div>\n    <div class="art-title" id="art-title">Week 6 Recap &amp; Week 7 Preview</div>','<div class="art-eye" id="art-eye">CFN · Weekly Edition · Oct 27, 2026</div>\n    <div class="art-title" id="art-title">Week 7 Recap &amp; Week 8 Preview</div>')
# 3. home
h=one(h,'<span class="badge">Week 6 Final</span>\n    <span class="week-title">Week 7</span>\n    <span class="week-sub">Oct 20 – Oct 26, 2026</span>','<span class="badge">Week 7 Final</span>\n    <span class="week-title">Week 8</span>\n    <span class="week-sub">Oct 27 – Nov 2, 2026</span>')
allsc=[]
for k in KS:
    for m in MS[k]: allsc.append((m['sa'],k,m['a'])); allsc.append((m['sb'],k,m['b']))
allsc.sort(reverse=True); tops=allsc[0]
bl=max(((abs(m['sa']-m['sb']),k,m) for k in KS for m in MS[k]),key=lambda x:x[0])
clo=min(((abs(m['sa']-m['sb']),k,m) for k in KS for m in MS[k]),key=lambda x:x[0])
nun=sum(1 for k in KS for t in ST[k] if ST[k][t]['l']==0)
def ndesc():
    d=f"{nm(tops[1],tops[2])} led the network with {f2(tops[0])} in {LGPLAIN[tops[1]]}, {nm(bl[1],winner(bl[1],bl[2]))} beat {nm(bl[1],loser(bl[1],bl[2]))} by {f2(bl[0])} in {LGPLAIN[bl[1]]}, and {['no','one','two','three','four','five'][nun]} team{'s' if nun!=1 else ''} remain{'s' if nun==1 else ''} undefeated. Plus: a {f2(clo[0])}-point finish in {LGPLAIN[clo[1]]}."
    return esc(d).replace('&#x27;',"'")
fa=h.index('<div class="feat-title">Week 6 Recap &amp; Week 7 Preview</div>'); fb=h.index('<div class="feat-meta">',fa)
h=h[:fa]+'<div class="feat-title">Week 7 Recap &amp; Week 8 Preview</div>\n        <div class="feat-desc">'+ndesc()+'</div>\n        '+h[fb:]
h=one(h,'<span>Oct 20, 2026</span><span>·</span><span>CFN Staff</span>','<span>Oct 27, 2026</span><span>·</span><span>CFN Staff</span>')
h=one(h,'onclick="showArticle(6)"','onclick="showArticle(7)"')
h=lcard_upd(h)
# 4. LGD.stand
m2=re.search(r'LGD = ',h); _o,_l=json.JSONDecoder().raw_decode(h[m2.end():]); _seg=h[m2.end():m2.end()+_l]
for k in KS:
    for asc in (True,False):
        oldS=json.dumps(LGDo['stand'][k],ensure_ascii=asc)
        if _seg.count(oldS)==1:
            _seg=_seg.replace(oldS,json.dumps(standhtml(k),ensure_ascii=asc)); break
    else: raise SystemExit('stand '+k+' not found '+str([_seg.count(json.dumps(LGDo['stand'][k],ensure_ascii=a)) for a in (True,False)]))
h=h[:m2.end()]+_seg+h[m2.end()+_l:]
# 5. FM
fi=h.index('var FM='); FMo,fe=json.JSONDecoder().raw_decode(h[fi+7:])
for k in KS:
    mgm=S['mgr'][k]; ts=FM[k]['teams']
    for t in ts: t['mgr']=mgm.get(t['name'],t['name'])
    order_=sorted(ts,key=lambda t:t['sos'])
    for rank,t in enumerate(order_): t['sosr']='Easy' if rank<4 else ('Hard' if rank>=len(order_)-4 else 'Mid')
h=h[:fi+7]+json.dumps(FM)+h[fi+7+fe:]
# 6. lg meta / tabs
h=one(h,"' · Week 6 final'","' · Week 7 final'")
h=one(h,"['Storylines','Matchups','Man of the Match','Weekly Awards','Week 7 Preview']","['Storylines','Matchups','Man of the Match','Weekly Awards','Week 8 Preview']")
# 7. PV7 -> week 8 probabilities
pi=h.index('PV7={'); PV,pe=json.JSONDecoder().raw_decode(h[pi+4:])
h=h[:pi+4]+json.dumps(pv8(),ensure_ascii=False)+h[pi+4+pe:]
h=one(h,'Week 7 &middot; Win Probability','Week 8 &middot; Win Probability')
_n=h.index('Projected totals with the 10th&ndash;90th percentile range.'); _e=h.index('</p>',_n)
h=h[:_n]+'Projected totals and win probability come from the Fraud Meter model: each team’s current strength rating (points on the board, all-play, weekly finish tiers) adjusted for its projected roster and byes this week, with the 10th&ndash;90th percentile range shown under each score.'+h[_e:]
open(OUT,'w').write(h); print('written',len(h))
