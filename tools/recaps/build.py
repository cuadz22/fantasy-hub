import json,html,pathlib,sys,ast
ROOT=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'outputs/CFN-Weekly-Recaps/2026-week11').resolve()
TOOLS=pathlib.Path(__file__).parent
E=lambda x:html.escape(str(x),quote=True)
def short(n):
 parts=n.split(' ',1);return parts[0][0]+'. '+parts[1] if len(parts)>1 else n
def rgb(h):return ','.join(str(int(h[i:i+2],16)) for i in (1,3,5))
def score(x):return f'{x:.2f}'
def img(src,cls='',alt=''):return f'<img class="{cls}" src="{E(src)}" alt="{E(alt)}">'
def team(t,win):
 return f'<div class="team {"winner" if win else "loser"}">{img(t["logo"],"logo",t["name"])}<div class="team-text"><div class="team-name">{E(t["name"])}</div><span class="owner">{E(t["manager"])}{" · WIN" if win else ""}</span></div><div class="score">{score(t["pointsToDate"])}</div></div>'
def motm(d):
 cards=[]
 for i,m in enumerate(d['matchups']):
  p=m['mvp'];col=rgb(m['winner']['tint'])
  if d['leagueId']=='gl':col=['135,71,198','125,78,202','92,139,168','151,113,73','32,159,136','152,133,71'][i]
  cards.append(f'''<article class="card" style="--tint:{col}"><div class="halo"></div>{img(p['photo'],'portrait',p['name'])}<div class="shade"></div>
  <svg class="mist" viewBox="0 0 487 286"><defs><filter id="fog{i}" x="-50%" y="-80%" width="200%" height="260%"><feTurbulence type="fractalNoise" baseFrequency=".012 .025" numOctaves="3" seed="{i+4}" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="85"/><feGaussianBlur stdDeviation="6"/></filter><radialGradient id="sm{i}"><stop stop-color="white" stop-opacity=".4"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient></defs><g filter="url(#fog{i})" fill="url(#sm{i})"><ellipse cx="240" cy="270" rx="170" ry="25"/><ellipse cx="282" cy="155" rx="36" ry="160" transform="rotate(24 282 155)"/></g></svg>
  <div class="info"><div class="status">FINAL</div>{team(m['winner'],True)}{team(m['loser'],False)}<div class="mvp"><div class="player-name">{E(short(p['name']))}</div><div class="player-points">{score(p['points'])}<span>PTS</span></div></div></div></article>''')
 return '<section class="grid">'+''.join(cards)+'</section>'
def team_lookup(d):return {t['teamId']:t for m in d['matchups'] for t in [m['winner'],m['loser']]}
def field_player(p,x,y,teams):
 t=teams[p['fantasyTeamId']]
 return f'''<div class="field-player" style="left:{x}px;top:{y}px"><div class="head">{img(p['photo'],'headshot',p['name'])}{img(t['logo'],'owner-logo',t['name'])}</div><div class="field-name">{E(short(p['name']))}</div><div class="field-points">{score(p['points'])}<span>{E(p['position'])}</span></div><div class="field-owner">{E(p['owner'])}</div></div>'''
def compact_result(t,win=False,label='WIN'):
 return f'''<div class="award-team {'aw-winner' if win else ''}">{img(t['logo'],'logo',t['name'])}<div><div class="award-owner">{E(t['manager'])}{(' <span>'+E(label)+'</span>') if win else ''}</div><div class="award-teamname">{E(t['name'])}</div></div><strong>{score(t['pointsToDate'])}</strong></div>'''
def award(d,key,title,desc,emoji):
 m=d['awards'][key]
 extra=f'<span class="margin">{score(m["margin"])}-point escape</span>' if key=='closeCall' else ''
 result=(compact_result(m['loser'],True,'LOSS')+compact_result(m['winner'])) if key=='hardLuck' else (compact_result(m['winner'],True)+compact_result(m['loser']))
 return f'''<article class="award"><div class="award-title"><h2>{E(title)}</h2><span class="emoji">{emoji}</span></div><p>{E(desc)}{extra}</p>{result}</article>'''
def manager(d):
 m=d['awards']['manager'];t=m['winner']
 players=''.join(f'<div class="manager-player">{img(p["photo"],"small-head",p["name"])}<div><b>{E(short(p["name"]))}</b><span>{score(p["points"])} pts</span></div></div>' for p in t['starters'][:3])
 return f'''<article class="award manager"><div class="award-title"><h2>Manager of the Week</h2><span class="emoji">🏆</span></div><p>Highest-scoring team</p>{compact_result(t,True)}<div class="manager-players">{players}</div></article>'''
def team_week(d):
 ps=d['teamOfWeek'];teams=team_lookup(d);wr=ps['WR'];nodes=[]
 for p,x in zip([wr[0],wr[2],ps['TE'][0],wr[3],wr[1]],[100,298,498,698,896]):nodes.append(field_player(p,x,55,teams))
 nodes.append(field_player(ps['QB'][0],498,236,teams))
 for p,x in zip(ps['RB'],[300,696]):nodes.append(field_player(p,x,362,teams))
 field='''<svg class="field-lines" viewBox="0 0 996 560"><defs><linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#23766c" stop-opacity=".16"/><stop offset="1" stop-color="#0b252c" stop-opacity=".1"/></linearGradient></defs><rect x="10" y="10" width="976" height="540" rx="28" fill="url(#grass)" stroke="#add6d4" stroke-opacity=".12"/>'''
 for y in [32,116,200,284,368,452,536]:
  field+=f'<path d="M25 {y} H971" stroke="#9bbcbf" stroke-opacity=".1"/>'
  for x in [210,786]:field+=f'<path d="M{x} {y-5} V{y+5}" stroke="#b4d9db" stroke-opacity=".25"/>'
 field+='<path d="M25 110 H971" stroke="#53d4c4" stroke-opacity=".55" stroke-width="2"/><text x="498" y="32" fill="#96bcbf" font-size="10" letter-spacing="3" text-anchor="middle">LINE OF SCRIMMAGE</text></svg>'
 content='<section class="field">'+field+''.join(nodes)+'</section><p class="field-caption">Highest-scoring starters at each position · Points reflect this league’s scoring</p>'
 content+='<section class="awards">'+award(d,'closeCall','Close Call','Narrowest victory','😮‍💨')+award(d,'lucky','Lucky MF','Lowest-scoring winner','🍀')+award(d,'hardLuck','Fantasy Is All Luck','Highest-scoring loser','💔')+manager(d)+'</section>'
 return content
def final_matchup(d,m):
 left,right=m['winner'],m['loser']
 def hero(t,winner):
  return f'<div class="final-side"><div class="final-manager">{E(t["manager"])}</div>{img(t["logo"],"logo",t["name"])}<strong>{score(t["pointsToDate"])}</strong><div class="final-team">{E(t["name"])}</div><span>{"WINNER" if winner else "FINAL"}</span></div>'
 def ordered(t):
  lookup={str(p['playerId']):p for p in t['starters']}
  return [lookup.get(str(p['playerId']),p) for p in t['lineup'] if p['slot'].upper() not in {'BN','BE','BENCH','IR','IR+','RES','NA','PUP','TAXI'}]
 def cell(p,side):
  if p is None:return '<div class="final-player empty"></div>'
  points=score(p['points']) if p.get('points') is not None else '—'
  photo=img(p['photo'],'final-photo',p['name']) if p.get('photo') else '<span class="no-photo"></span>'
  return f'<div class="final-player {side}">{photo}<div class="final-player-text"><b>{E(short(p["name"]))}</b><small>{E(p["nflTeam"])} · {E(p["position"])}</small></div><strong>{points}</strong></div>'
 a,b=ordered(left),ordered(right);rows=[]
 for i in range(max(len(a),len(b))):
  lp=a[i] if i<len(a) else None;rp=b[i] if i<len(b) else None
  slot=(lp or rp)['slot'].replace('W/R/T','FLX').replace('Q/W/R/T','SFLX')
  if lp and rp and lp['slot']!=rp['slot']:raise ValueError('Unequal lineup slots require review')
  rows.append(f'<div class="final-row">{cell(lp,"left")}<span class="final-slot">{E(slot)}</span>{cell(rp,"right")}</div>')
 p=m['mvp']
 return f'<section class="final-match" style="--home:{rgb(left["tint"])};--away:{rgb(right["tint"])}"><div class="final-hero">{hero(left,True)}<span class="versus">FINAL</span>{hero(right,False)}</div><div class="final-lineup">'+''.join(rows)+f'</div><div class="final-mvp">{img(p["photo"],"small-head",p["name"])}<div><span>MAN OF THE MATCH</span><b>{E(short(p["name"]))}</b></div><strong>{score(p["points"])} <small>PTS</small></strong></div></section>'

# Freeze the already-approved visual system into a reusable local theme.
if not (TOOLS/'base.css').exists():
 tree=ast.parse(pathlib.Path('outputs/Gents-Week11-Recap/build.py').read_text())
 for node in tree.body:
  if isinstance(node,ast.Assign) and isinstance(node.targets[0],ast.Name) and node.targets[0].id in ['css','art']:
   value=ast.literal_eval(node.value);(TOOLS/('base.css' if node.targets[0].id=='css' else 'facets.svg')).write_text(value)
css=(TOOLS/'base.css').read_text()+(TOOLS/'recap.css').read_text();art=(TOOLS/'facets.svg').read_text()
manifest=json.loads((ROOT/'manifest.json').read_text())
for entry in manifest:
 d=json.loads((ROOT/f'{entry["id"]}-data.json').read_text());entry['slides']=[]
 for kind,title in [('cover','Weekly Recap'),('motm','Man of the Match'),('report','Team of the Week')]+[(f'matchup-{i+1}',f'{m["winner"]["manager"]} vs {m["loser"]["manager"]}') for i,m in enumerate(d['matchups'])]:
  if kind=='cover':body=f'''<section class="cover-content">{img(d['leagueLogo'],'cover-logo',d['leagueName'])}<div class="cover-league">{E(d['leagueName'])}</div><div class="week">Week {d['week']}</div><h1>Weekly Recap</h1><div class="cover-rule"></div><p>Six matchups. One week to remember.</p></section>'''
  elif kind.startswith('matchup-'):body=f'<header>{img(d["leagueLogo"],"league-logo",d["leagueName"])}<div class="week">Week {d["week"]}</div><h1>Final Matchup</h1></header>'+final_matchup(d,d['matchups'][int(kind.split('-')[1])-1])
  else:body=f'<header>{img(d["leagueLogo"],"league-logo",d["leagueName"])}<div class="week">Week {d["week"]}</div><h1>{title}</h1></header>'+(motm(d) if kind=='motm' else team_week(d))
  filename=f'{entry["id"]}-{kind}';entry['slides'].append({'kind':kind,'title':title,'html':filename+'.html','png':filename+'.png'})
  document='<!doctype html><html><head><meta charset="utf-8"><title>'+E(d['leagueName'])+' · '+title+'</title><style>'+css+'</style></head><body><main class="'+kind+' '+d['leagueId']+'">'+art+'<div class="ambient"></div>'+body+img('assets/crown.svg','crown')+'</main></body></html>'
  (ROOT/(filename+'.html')).write_text(document)
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
print('Built',sum(len(e['slides']) for e in manifest),'slides from one shared template.')
