import sys
p=sys.argv[1]; js=open(sys.argv[2]).read(); s=open(p).read()
a="function lgWaivers(p,k){"; assert s.count(a)==1 and 'function stdCard' not in s
b="  if(t==='Standings'){\n    if(k==='sts') lgSub(k,'STS Custom')"; assert s.count(b)==1
nb="  if(t==='Standings'){\n    var sb=document.createElement('div'); sb.style.cssText='display:flex;justify-content:flex-end;margin-bottom:8px'; sb.innerHTML='<button class=\"st-btn\" id=\"stdShareBtn\" style=\"padding:5px 12px\">Share standings</button>'; p.appendChild(sb); sb.firstChild.onclick=function(){ shareStand(k); };\n    if(k==='sts') lgSub(k,'STS Custom')"
s=s.replace(a,js+"\n"+a).replace(b,nb)
open(p,'w').write(s)
