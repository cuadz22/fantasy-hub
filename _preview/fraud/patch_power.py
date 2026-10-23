import sys
p=sys.argv[1]; js=open(sys.argv[2]).read()
s=open(p).read()
a="function lgWaivers(p,k){"; assert s.count(a)==1 and 'function lgPower' not in s
b="lgSub(k,'Power Rankings').forEach(function(n){ p.appendChild(n); });"; assert s.count(b)==1
s=s.replace(a,js+"\n"+a).replace(b,"lgPower(p,k);")
open(p,'w').write(s)
