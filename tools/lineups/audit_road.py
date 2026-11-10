import sys,json; sys.path.insert(0,'/tmp/lt/w9')
import lineopt as L
import fm3 as F
D=json.load(open('D.json'))
PRJ={k:json.load(open(f'proj_{k}.json')) for k in ['gl','bh','rb','sts']}
SLOTS={k:F.LGS[k][1] for k in PRJ}
def audit(verbose=True):
    bad=0;n=0
    for lg in PRJ:
        slots=[{'FLEX':'W/R/T','SFLEX':'Q/W/R/T'}.get(s,s) for s in SLOTS[lg]]
        for t in D['teams'][lg]:
            keys=[k for s,k in t['pl'] if s!='IR']
            for w in range(10,15):
                pl=[]
                for k in keys:
                    p=PRJ[lg].get(k)
                    if not p: continue
                    v=p['w'].get(str(w))
                    if v is None: continue
                    pl.append(dict(key=k,pos=p['p'],proj=v))
                opt=L.solve(slots,pl); ot=L.total(slots,pl,opt)
                used=F.best_lineup(keys,F.LGS[lg][1],w,PRJ[lg],{p:8 for p in ['QB','RB','WR','TE','FLEX','SFLEX']})
                # best_lineup adds replacement for empty slots; compare using picks totals
                pk=F.picks(keys,F.LGS[lg][1],w,PRJ[lg],{'QB':15.5,'RB':7.5,'WR':8.0,'TE':7.0,'FLEX':8.0,'SFLEX':8.0})
                have=sum(x[2] for x in pk if x[1])
                n+=1
                if abs(have-ot)>0.3:
                    bad+=1
                    if verbose: print(lg,t['id'],w,'used %.2f optimal %.2f'%(have,ot))
    print('team-weeks',n,'non-optimal',bad)
    return bad
if __name__=='__main__': audit()
