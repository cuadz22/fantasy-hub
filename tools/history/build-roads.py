"""Build read-only champion schedules; never attributes unknown teams to owners."""
import json, hashlib, re, argparse, unicodedata
from pathlib import Path
from decimal import Decimal
p=argparse.ArgumentParser();p.add_argument('package',type=Path);p.add_argument('--out',type=Path,default=Path('client/public/data/roads/v1'));args=p.parse_args()
root=args.package
read=lambda f:json.loads((root/f).read_text())
def check(ok,msg):
 if not ok: raise ValueError(msg)
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFC',s)).strip()
for f in read('manifest.json')['files']:
 b=(root/f['path']).read_bytes();check(len(b)==f['bytes'] and hashlib.sha256(b).hexdigest()==f['sha256'],'Package checksum '+f['path'])
sources={s['sourceId']:s for s in read('sources.json')['sources']}
def evidence(ids,league,year):
 check(bool(ids),'No evidence');out=[]
 for id in ids:
  s=sources[id];check(s['league']==league and s['season']==year,'Wrong evidence scope');b=(root/s['evidenceFile']).read_bytes();check(hashlib.sha256(b).hexdigest()==s['sha256'],'Evidence checksum');out.append(b.decode())
 return '\n'.join(out)
outputs={}
for league in ['gl','bh','rb','sts']:
 seasons=[]
 for title in read(f'championships/{league}.json')['championships']:
  if title['status']=='not-completed':continue
  check(title['status']=='verified','Unverified title');year=title['season'];champ=title['champion'];team=champ['teamId']
  check(norm('1st Place '+champ['teamName']) in norm(evidence(title['sourceIds'],league,year)),'Title evidence')
  season=read(f'matchups/{league}/{year}.json');games=[];occupied=set();record=[0,0,0]
  for r in season['matchups']:
   if team not in [r['home']['teamId'],r['away']['teamId']]:continue
   check(r['stage'] in ['regular','playoff'],'Champion in consolation');check(r['finalStatus']=='final' and not r['adjustments'],'Nonfinal or adjusted game')
   blocks=[b for b in evidence(r['sourceIds'],league,year).split('----') if all(norm(r[s]['teamName']) in norm(b) for s in ['home','away'])]
   check(len(blocks)==1,'Ambiguous scoreboard');block=blocks[0]
   scores=[x.strip().split()[0] for x in block.splitlines() if re.fullmatch(r'-?\d+\.\d{2}(?:\s+-?\d+\.\d{2})?',x.strip())]
   check(scores==[r['home']['score'],r['away']['score']],'Scores differ from evidence')
   check(r['stage']==('playoff' if '[Championship Bracket]' in block else 'regular'),'Stage mismatch')
   side='home' if r['home']['teamId']==team else 'away';other='away' if side=='home' else 'home';a,b=r[side],r[other]
   x,y=Decimal(a['score']),Decimal(b['score']);outcome='W' if x>y else 'L' if x<y else 'T'
   check(r['officialOutcome']==('tie' if x==y else side if x>y else other),'Outcome mismatch')
   for w in range(r['weekStart'],r['weekEnd']+1):check(w not in occupied,'Duplicate week');occupied.add(w)
   if r['stage']=='regular':record[['W','L','T'].index(outcome)]+=1
   games.append(dict(id=r['matchupId'],weekStart=r['weekStart'],weekEnd=r['weekEnd'],stage=r['stage'],teamName=a['teamName'],opponentName=b['teamName'],score=a['score'],opponentScore=b['score'],result=outcome,isFinal=r['matchupId']==title['finalMatchup']['matchupId'],sourceIDs=r['sourceIds']))
  check('-'.join(map(str,record))==title['championRegularSeasonRecord'],'Regular-season record mismatch')
  check(len([g for g in games if g['isFinal'] and g['result']=='W'])==1,'Missing championship win')
  for b in season.get('playoffByes',[]):
   if b['teamId']!=team:continue
   blocks=[v for v in evidence(b['sourceIds'],league,year).split('----') if norm(b['teamName']) in norm(v) and re.search(r'\bBye\b',v)]
   check(len(blocks)==1 and '[Championship Bracket]' in blocks[0],'Unverified bye');check(b['week'] not in occupied,'Bye overlaps game');occupied.add(b['week'])
   games.append(dict(id=f'{league}-{year}-bye-{b["week"]}',weekStart=b['week'],weekEnd=b['week'],stage='playoff',teamName=b['teamName'],opponentName=None,score=None,opponentScore=None,result='BYE',isFinal=False,sourceIDs=b['sourceIds']))
  games.sort(key=lambda g:(g['weekStart'],g['weekEnd']))
  last=title['finalMatchup']['weekEnd'];missing=[w for w in range(1,last+1) if w not in occupied]
  seasons.append(dict(season=year,teamName=champ['teamName'],regularRecord=title['championRegularSeasonRecord'],seed=title.get('championSeed'),games=games,missingWeeks=missing))
 outputs[league]=dict(schemaVersion=1,leagueKey=league,revision='20261125-roads-v1',seasons=sorted(seasons,key=lambda s:-s['season']))
args.out.mkdir(parents=True,exist_ok=True)
for league,data in outputs.items():
 (args.out/f'{league}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print(league,len(data['seasons']),'seasons',sum(len(s['games']) for s in data['seasons']),'verified schedule entries')
