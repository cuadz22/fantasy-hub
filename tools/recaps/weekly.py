"""Prepare the latest complete week once. No posts, deployment or API writes."""
import pathlib,json,urllib.request,datetime,subprocess,sys
repo=pathlib.Path(__file__).resolve().parents[2]
base='https://cuadzfantasynetwork.com'
catalog='https://0qa2diffmldkqahu.public.blob.vercel-storage.com/studio/index.json'
def get(url):
 with urllib.request.urlopen(url,timeout=60) as r:return json.load(r)
c=get(base+'/api/mobile/context')
if c.get('stale'):raise SystemExit('Current-week context is stale; wait for fresh data.')
season=c['season'];current=c['currentWeek']
assert isinstance(season,int) and isinstance(current,int)
archive=get(catalog+'?v='+str(int(datetime.datetime.now().timestamp())))
for week in sorted([w for w in c['availableWeeks'] if w<=current],reverse=True)[:2]:
 if any(e['season']==season and e['week']==week for e in archive['editions']):
  print(f'Week {week} already has a review draft. Nothing regenerated.');break
 feeds=[get(f'{base}/api/mobile/lineups?lg={lg}&season={season}&week={week}') for lg in ['gl','bh','rb','sts']]
 if any(f.get('week')!=week or f.get('season')!=season or len(f.get('matchups',[]))!=6 for f in feeds):raise SystemExit('Unexpected league/week data; hold generation for review.')
 if not all(m.get('winProbability',{}).get('status')=='final' for f in feeds for m in f['matchups']):continue
 stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S');out=repo/'outputs/weekly-recaps'/f'{season}-week{week}-{stamp}'
 subprocess.run([sys.executable,str(repo/'tools/recaps/generate.py'),'--season',str(season),'--week',str(week),'--output',str(out)],cwd=repo,check=True)
 print('Review this completed draft, then upload to Studio:',out);break
else:raise SystemExit('No complete week available. Keep the existing archive; do not fabricate final results.')
