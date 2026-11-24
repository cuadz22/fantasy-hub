import pathlib,json,sys,urllib.request,concurrent.futures,shutil,html
from derive import derive,BENCH
ROOT=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'outputs/CFN-Weekly-Recaps/2026-week11').resolve()
REPO=pathlib.Path(__file__).resolve().parents[2]
NAMES={'gl':'Gentlemen’s League','bh':'Beaners & Husseins','rb':'Rebirth','sts':'Shoot the Shits'}
media=json.loads((ROOT/'sources/media.json').read_text())['teams'];colors=json.loads((REPO/'client/public/redesign/team-colors.json').read_text());manifest=[];downloads={};photo_orig={}
assets=ROOT/'assets';assets.mkdir(exist_ok=True)
# Original Yahoo headshots and each league's actual scoring are retained separately.
for file in (ROOT/'sources').glob('*-photos.json'):photo_orig.update(json.loads(file.read_text()))
shutil.copy(pathlib.Path(__file__).parent/'crown.svg',assets/'crown.svg')
for lg,title in NAMES.items():
 feed=json.loads((ROOT/'sources'/f'{lg}.json').read_text());data=derive(feed,media[lg]);data.update({'leagueId':lg,'leagueName':title})
 assert len(data['matchups'])==6 and not data['reviewRequired'], data['reviewRequired']
 yahoo_checks=[]
 for m in data['matchups']:
  tid=next(t['teamId'] for raw in feed['matchups'] if raw['matchupId']==m['matchupId'] for t in raw['teams'])
  y=json.loads((ROOT/'sources'/f'yahoo-{lg}-{tid}.json').read_text())
  for yt,side in zip(y['teams'],['L','R']):
   t=next(t for t in [m['winner'],m['loser']] if str(t['teamId'])==str(yt['id']))
   rows=[p for p in y[side] if p['slot'] not in BENCH]
   assert abs(sum(p['pts'] or 0 for p in rows)-t['pointsToDate'])<.011,(lg,t['name'],'Yahoo total mismatch')
   for p in t['starters']:
    yp=next(q for q in rows if q['name']==p['name'])
    assert abs((yp['pts'] or 0)-p['points'])<.011,(lg,p['name'],yp['pts'],p['points'])
    assert yp['pos']==p['position'],(lg,p['name'],'position mismatch')
   yahoo_checks.append(t['teamId'])
  for t in [m['winner'],m['loser']]:
   t['logo']=f'assets/{lg}-team-{t["teamId"]}.png';downloads[t['logo']]=t['logoURL'];t['tint']=colors[lg].get(str(t['teamId']),'#476778')
   for p in t['starters']:
    p['photo']=f'assets/yahoo-{p["playerId"]}.png';p['originalPhotoURL']=photo_orig.get(p['name']) or p.get('photoURL')
    if p['position'] in {'DEF','DST','D/ST'}:p['originalPhotoURL']='https://a.espncdn.com/i/teamlogos/nfl/500/'+({'WSH':'wsh','WAS':'wsh','JAC':'jax'}.get(p['nflTeam'],p['nflTeam'].lower()))+'.png'
 # Shared objects within the derived structure already carry owner and photo paths.
 featured=[p for m in data['matchups'] for t in [m['winner'],m['loser']] for p in t['starters']]
 for p in featured:
  assert p.get('originalPhotoURL'),('Missing actual portrait',p['name'])
  downloads[p['photo']]=p['originalPhotoURL']
 logo=REPO/'client/public/redesign/assets/leagues'/f'{lg}.svg'
 if lg=='bh':logo=REPO/'client/public/redesign/assets/image-21.png'
 if not logo.exists():
  candidates=list(logo.parent.glob(lg+'.*'));assert candidates;logo=candidates[0]
 dest=assets/f'{lg}-league{logo.suffix}';shutil.copy(logo,dest);data['leagueLogo']='assets/'+dest.name
 data['checks']['verifiedAgainstYahooTeams']=yahoo_checks
 (ROOT/f'{lg}-data.json').write_text(json.dumps(data,indent=2,ensure_ascii=False))
 manifest.append({'id':lg,'name':title,'week':data['week'],'season':data['season'],'logo':data['leagueLogo'],'checks':data['checks']})
 print(lg,'verified',len(yahoo_checks),'teams; MVPs:',[(m['mvp']['name'],m['mvp']['points']) for m in data['matchups']])
def fetch(job):
 dest,url=job;f=ROOT/dest
 if f.exists() and f.stat().st_size>100:return
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=40) as r:f.write_bytes(r.read())
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(fetch,downloads.items()))
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
print('Ready:',len(downloads),'authentic assets; no tied awards or incomplete results.')
