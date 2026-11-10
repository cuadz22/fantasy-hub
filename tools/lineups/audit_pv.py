import sys; sys.path.insert(0,'/tmp/lt/w9')
import lineopt as L
from lu10 import RAW, build
from core9 import nm
def players_of(lg,t):
    ps=[]
    for r in RAW[(lg,t)]:
        if r['slot']=='IR' or not r['name']: continue
        pos=r['pos']
        ps.append(dict(name=r['name'],pos=pos,proj=r['proj'],slot=r['slot']))
    return ps
def audit(builder=build,verbose=True):
    bad=0;n=0;gain=0
    for (lg,t) in sorted(RAW):
        st,sw,bn=builder(lg,t); n+=1
        ps=players_of(lg,t); slots=[s['slot'] for s in st]
        used=sum(s['proj'] for s in st if s['name'] and s['proj']>0)
        # fix positions of bench players with odd labels
        opt=L.solve(slots,[dict(pos=p['pos'],proj=p['proj']) for p in ps])
        ot=sum(ps[i]['proj'] for i in opt if i is not None)
        g=L.greedy_total(slots,[dict(pos=p['pos'],proj=p['proj']) for p in ps])
        assert abs(ot-g)<1e-6,('solver mismatch',lg,t,ot,g)
        if ot-used>0.005:
            bad+=1;gain+=ot-used
            if verbose:
                inn=[ps[i]['name'] for i in opt if i is not None]
                cur=[s['name'] for s in st if s['name']]
                print(lg,t,nm(lg,t)[:18],'used %.2f optimal %.2f (+%.2f)'%(used,ot,ot-used),'| should add',sorted(set(inn)-set(cur)),'| drop',sorted(set(cur)-set(inn)))
    print('teams',n,'non-optimal',bad,'total pts left on bench %.1f'%gain)
    return bad
if __name__=='__main__': audit()
