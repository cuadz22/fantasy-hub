import json,sys
js=r"""(()=>{const T=[...document.querySelectorAll('table')].find(t=>{const r=t.querySelector('tbody tr');return r&&r.children.length>=15});if(!T)return 'NOTABLE';const st=L=>{const l=L[L.length-1]||'';return /^(1st|2nd|3rd|4th|OT|Half|Q[1-4])/i.test(l)?'L':/^(Final|W |L |T )/.test(l)?'F':/No Game|Bye/i.test(l)?'N':'U'};const g=c=>{const L=c.innerText.split('\n').map(x=>x.trim()).filter(Boolean);const inj=L.find(x=>/^(Q|O|D|IR|SUSP|PUP|NA)$/.test(x))||'';return (L[0]||'Empty')+'|'+inj+'|'+st(L)};const o=[];[...T.querySelectorAll('tbody tr')].forEach(r=>{const c=[...r.children];if(c.length<15)return;const sl=c[6].innerText.trim();if(sl==='Total')return;o.push([g(c[1]),c[4].innerText.trim(),c[5].innerText.trim(),sl,c[9].innerText.trim(),c[10].innerText.trim(),g(c[13])].join('~'))});const t=document.body.innerText;const m=t.match(/([\d.]+)\s*\n?\s*vs\s*\n?\s*([\d.]+)\s*\n\s*([\d.]+)\s*Orig Proj\s*[\d.]+\s*\n\s*([\d.]+)\s*Live Proj\s*([\d.]+)/);return (m?[m[1],m[2],m[4],m[5]].join('/'):'?')+'##'+o.join('||')})()"""
lg,mids,tab=sys.argv[1],sys.argv[2].split(','),int(sys.argv[3])
a=[]
for m in mids:
    a.append({"name":"navigate","input":{"url":f"https://football.fantasysports.yahoo.com/f1/{lg}/matchup?week=10&mid1={m}","tabId":tab}})
    a.append({"name":"computer","input":{"action":"wait","duration":4,"tabId":tab}})
    a.append({"name":"javascript_tool","input":{"action":"javascript_exec","tabId":tab,"text":js}})
print(json.dumps(a))
