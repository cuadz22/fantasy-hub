import json,re,sys
enc=json.load(open('data/waiver_enc.json'))
MON={'Aug':8,'Sep':9,'Oct':10}
def dkey(d):
    m,dd=d.split(); return MON[m]*100+int(dd)
def week(d):
    k=dkey(d)
    if k<=916: return 1
    if k<=923: return 2
    if k<=930: return 3
    if k<=1007: return 4
    if k<=1014: return 5
    return 6
clean=lambda s: re.sub(r'[-]','',s).strip()
out={}
for lg,v in enc.items():
    m,f,a=v.split('#')
    mg=m.split('~')
    ents=[]
    last=None
    for piece in clean(f).split(';'):
        piece=piece.strip()
        if not piece: continue
        inv=re.match(r'^(.*?) \$(\d+) \(Invalid claim[^)]*\)\s*(.*)$',piece)
        if inv:
            last['bids'].append({'manager':inv.group(1).strip(),'amount':int(inv.group(2)),'won':False,'note':'invalid'})
            piece=inv.group(3)
            if not piece: continue
        p=piece.split('|')
        if len(p)<7: p+=['']*(7-len(p))
        name,team,pos,amt,wi,date,bids=p[:7]
        w=mg[int(wi,36)]
        e={'week':week(date),'date':date,'player':name,'position':pos,'nflTeam':team,'winner':w,'bids':[{'manager':w,'amount':int(amt),'won':True}]}
        for b in [x for x in bids.split(',') if x]:
            i,r=b.split(':'); note=None
            if r.endswith('p'): r=r[:-1]; note='priority'
            bd={'manager':mg[int(i,36)],'amount':int(r),'won':False}
            if note: bd['note']=note
            e['bids'].append(bd)
        ents.append(e); last=e
    for piece in clean(a).split(';'):
        piece=piece.strip()
        if not piece: continue
        name,team,pos,amt,wi,date=piece.split('|')
        w=mg[int(wi,36)]
        ents.append({'week':week(date),'date':date,'player':name,'position':pos,'nflTeam':team,'winner':w,'bids':[{'manager':w,'amount':int(amt),'won':True}]})
    seen=set(); ded=[]
    for e in sorted(ents,key=lambda e:-len(e['bids'])):
        key=(e['date'],e['player'],e['winner'],e['bids'][0]['amount'])
        if key in seen: continue
        seen.add(key); ded.append(e)
    ents=ded
    ents.sort(key=lambda e:(-e['week'],-dkey(e['date'])))
    out[lg]=ents
json.dump(out,open('waivers_new.json','w'))
for lg,e in out.items():
    print(lg,len(e),sum(len(x['bids']) for x in e),sum(1 for x in e if len(x['bids'])>1))
# patch html
s=open('../pod/cfn_final2.html').read()
i=s.index('var LGD = ');j=s.index('\n',i)
line=s[i:j]
k=line.index('"waivers": ')+len('"waivers": ')
_,end=json.JSONDecoder().raw_decode(line,k)
newline=line[:k]+json.dumps(out)+line[end:]
newline=re.sub(r'"waiversUpdated": "[0-9-]+"','"waiversUpdated": "2026-10-21"',newline)
assert '"waiversUpdated": "2026-10-21"' in newline
s=s[:i]+newline+s[j:]
open('new10.html','w').write(s)
print('patched',len(s))
