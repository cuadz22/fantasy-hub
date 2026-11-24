"""Pure recap calculations. Never writes scores, rosters, standings or app feeds."""
from decimal import Decimal
import math
BENCH={'BN','BE','BENCH','IR','IR+','RES','NA','PUP','TAXI'}
POSITIONS={'QB','RB','WR','TE','K','DEF','DST','D/ST'}
def number(v):
 if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v):raise ValueError('Missing or invalid score')
 return Decimal(str(v))
def starters(team):
 ps=[p for p in team['lineup'] if p['slot'].upper() not in BENCH]
 for p in ps:
  if p['position'] not in POSITIONS:raise ValueError('Unknown position: '+str(p))
  if p.get('points') is None and not any(w in (p.get('gameStatus') or '').lower() for w in ['bye','out','inactive']):raise ValueError('Unresolved starter score: '+p['name'])
 return [p for p in ps if p.get('points') is not None]
def rank(ps):
 return sorted(ps,key=lambda p:(-number(p['points']),p['name'],str(p['playerId'])))
def derive(feed,media):
 assert feed['week']>0 and feed['season']>0
 matches=[];teams=[];all_players=[];ids=set();cutoff_ties=[]
 for match in feed['matchups']:
  if match.get('winProbability',{}).get('status')!='final':raise ValueError('Unfinished matchup')
  pair=[]
  for original in match['teams']:
   t={**original};tid=str(t['teamId']);assert tid not in ids;ids.add(tid)
   t['manager']=media[tid]['managerName'];t['logoURL']=media[tid]['logoURL']
   ps=[{**p,'owner':t['manager'],'fantasyTeam':t['name'],'fantasyTeamId':t['teamId']} for p in starters(t)]
   if abs(sum((number(p['points']) for p in ps),Decimal(0))-number(t['pointsToDate']))>Decimal('.01'):raise ValueError('Starter total mismatch: '+t['name'])
   t['starters']=rank(ps);teams.append(t);pair.append(t);all_players.extend(ps)
  pair.sort(key=lambda t:(-number(t['pointsToDate']),str(t['teamId'])))
  if number(pair[0]['pointsToDate'])==number(pair[1]['pointsToDate']):raise ValueError('Tied matchup needs editorial review; do not invent a winner')
  m={'winner':pair[0],'loser':pair[1],'margin':float(number(pair[0]['pointsToDate'])-number(pair[1]['pointsToDate'])),'mvp':pair[0]['starters'][0],'matchupId':match['matchupId']}
  tied=[p for p in pair[0]['starters'] if p['points']==m['mvp']['points']]
  if len(tied)>1:cutoff_ties.append({'type':'mvp','matchupId':m['matchupId'],'players':[p['name'] for p in tied]})
  matches.append(m)
 selected={}
 for position,count in [('QB',1),('RB',2),('WR',4),('TE',1)]:
  pool=rank([p for p in all_players if p['position']==position]);assert len(pool)>=count
  selected[position]=pool[:count]
  if len(pool)>count and pool[count]['points']==pool[count-1]['points']:cutoff_ties.append({'type':'team-of-week','position':position,'points':pool[count]['points']})
 def winner_metric(m):return number(m['winner']['pointsToDate'])
 close=min(matches,key=lambda m:m['margin']);lucky=min(matches,key=winner_metric);hard=max(matches,key=lambda m:number(m['loser']['pointsToDate']));manager=max(matches,key=winner_metric)
 for key,chosen,metric in [('closeCall',close,lambda m:number(m['margin'])),('lucky',lucky,winner_metric),('hardLuck',hard,lambda m:number(m['loser']['pointsToDate'])),('manager',manager,winner_metric)]:
  if sum(metric(m)==metric(chosen) for m in matches)>1:cutoff_ties.append({'type':'award','award':key})
 return {'season':feed['season'],'week':feed['week'],'matchups':matches,'teamOfWeek':selected,'awards':{'closeCall':close,'lucky':lucky,'hardLuck':hard,'manager':manager},'reviewRequired':cutoff_ties,'checks':{'matchups':len(matches),'teams':len(teams),'starterTotalsMatch':True,'allMatchupsFinal':True,'onlyStartedPlayers':True,'selectionCounts':{p:len(v) for p,v in selected.items()}}}
