"""Read-only weekly snapshot. Explicit season/week prevents accidental current-week drift."""
import argparse,pathlib,json,urllib.request,concurrent.futures,hashlib,datetime
p=argparse.ArgumentParser();p.add_argument('--season',type=int,required=True);p.add_argument('--week',type=int,required=True);p.add_argument('--output',required=True);a=p.parse_args()
if not 1<=a.week<=18:raise SystemExit('Invalid week')
r=pathlib.Path(a.output);s=r/'sources'
if s.exists() and any(s.iterdir()):raise SystemExit('Snapshot already exists. Use a new revision directory; archived results must not be overwritten.')
s.mkdir(parents=True,exist_ok=True)
def get(lg):
 url=f'https://cuadzfantasynetwork.com/api/mobile/lineups?lg={lg}&season={a.season}&week={a.week}'
 with urllib.request.urlopen(url,timeout=60) as res:x=json.load(res)
 if x.get('season')!=a.season or x.get('week')!=a.week:raise ValueError('Feed season/week does not match requested archive')
 if len(x.get('matchups',[]))!=6 or any(m.get('winProbability',{}).get('status')!='final' for m in x['matchups']):raise ValueError('Week incomplete; hold recap generation')
 raw=json.dumps(x,indent=2).encode();(s/f'{lg}.json').write_bytes(raw)
 return {'league':lg,'url':url,'sha256':hashlib.sha256(raw).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:records=list(pool.map(get,['gl','bh','rb','sts']))
with urllib.request.urlopen('https://cuadzfantasynetwork.com/api/mobile/media',timeout=30) as res:media=json.load(res)
(s/'media.json').write_text(json.dumps(media,indent=2))
(r/'snapshot.json').write_text(json.dumps({'season':a.season,'week':a.week,'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':records},indent=2))
print('Saved four final-week snapshots; production data was not modified.')
