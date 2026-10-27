import json,sys
BASE,OUT=sys.argv[1],sys.argv[2]
h=open(BASE).read()
o,_=json.JSONDecoder().raw_decode(h[h.index('{',h.index('ST_BIG=')):])
SK=('QB','RB','WR','TE','W/R/T')
def parse(x):
    r=[]
    for s in x.split(';'):
        p,rest=s.split(':',1); n,pt=rest.rsplit(':',1); r.append((p,n,float(pt)))
    return r
RCP={'week':7,'lg':{}}
for k in ['gl','bh','rb','sts']:
    gl=json.load(open(f'w7/{k}.json'))['m']
    full={}
    for l in open(f'w7/{k}.full').read().strip().split('\n'):
        key,a,b=l.split('|'); full[key]=(parse(a),parse(b))
    out=[]
    for m in gl:
        a,b=m['t']; lu=full['%dv%d'%(a,b)]
        L=[];SD=[]
        for j in (0,1):
            sk=[[p,n,pt] for p,n,pt in lu[j] if p in SK]
            kk=m['k'][j]; pj={}
            for g in kk['top']+kk['bot']+kk['bn']:
                nm,v=g.rsplit(' ',1); ac,pr=v.split('/'); pj[nm]=(float(ac),float(pr))
            star=max(sk,key=lambda r:r[2])
            cand=[(r[1],pj[r[1]][0],pj[r[1]][1]) for r in sk if r[1] in pj]
            dud=max(cand,key=lambda c:c[2]-c[1])
            L.append(sk); SD.append([[star[1],star[2]],[dud[0],dud[1],dud[2]]])
        out.append({'t':[a,b],'s':m['s'],'L':L,'sd':SD})
    RCP['lg'][k]=out
css=open('rc_css.css').read(); js=open('rc_js.js').read()+'\n'+open('pm_studio.js').read()
assert h.count('</head>')==1
h=h.replace('</head>','<style id="rc-css">\n'+css+'</style>\n</head>')
old="p.appendChild(liveSub(k));\n    ['Storylines'"
assert h.count(old)==1
h=h.replace(old,"try{ p.appendChild(rcView(k)); }catch(e){ console.error(e); }\n    p.appendChild(liveSub(k));\n    ['Storylines'")
i=h.rindex('</body>')
h=h[:i]+'<script id="rc-js">\nvar RCP='+json.dumps(RCP,separators=(',',':'))+';\n'+js+'</script>\n'+h[i:]
open(OUT,'w').write(h)
print('ok',len(h))
