import unittest,copy,json,pathlib,os
from derive import derive,starters
ROOT=pathlib.Path(os.environ.get('RECAP_FIXTURE',str(pathlib.Path(__file__).parent/'fixtures')))
class RecapChecks(unittest.TestCase):
 def setUp(self):
  self.feed=json.loads((ROOT/'sources/gl.json').read_text());self.media=json.loads((ROOT/'sources/media.json').read_text())['teams']['gl']
 def test_real_all_four_leagues(self):
  media=json.loads((ROOT/'sources/media.json').read_text())['teams']
  for lg in media:
   if lg not in ['gl','bh','rb','sts']:continue
   d=derive(json.loads((ROOT/f'sources/{lg}.json').read_text()),media[lg]);self.assertFalse(d['reviewRequired']);self.assertEqual(d['checks']['selectionCounts'],{'QB':1,'RB':2,'WR':4,'TE':1})
 def test_bench_superstar_cannot_win(self):
  for m in self.feed['matchups']:
   for t in m['teams']:
    for p in t['lineup']:
     if p['slot']=='BN':p['points']=99999
  d=derive(self.feed,self.media);self.assertTrue(all(m['mvp']['points']<99999 for m in d['matchups']))
  self.assertTrue(all(p['points']<99999 for ps in d['teamOfWeek'].values() for p in ps))
 def test_flex_uses_player_position(self):
  d=derive(self.feed,self.media)
  for pos,ps in d['teamOfWeek'].items():self.assertTrue(all(p['position']==pos for p in ps))
  # Eligibility includes a wide receiver actually started in FLEX.
  t=self.feed['matchups'][0]['teams'][0];p=next(p for p in t['lineup'] if p['slot']=='W/R/T');self.assertIn(p,starters(t));self.assertEqual(p['position'],'WR')
 def test_unfinished_week_stops(self):
  self.feed['matchups'][0]['winProbability']['status']='live'
  with self.assertRaises(ValueError):derive(self.feed,self.media)
 def test_bad_total_stops(self):
  self.feed['matchups'][0]['teams'][0]['pointsToDate']+=1
  with self.assertRaises(ValueError):derive(self.feed,self.media)
 def test_missing_score_not_silently_zero(self):
  self.feed['matchups'][0]['teams'][0]['lineup'][0]['points']=None
  with self.assertRaises(ValueError):derive(self.feed,self.media)
 def test_unknown_position_stops(self):
  self.feed['matchups'][0]['teams'][0]['lineup'][0]['position']='UNKNOWN'
  with self.assertRaises(ValueError):derive(self.feed,self.media)
 def test_tied_matchup_requires_review(self):
  left,right=self.feed['matchups'][0]['teams']
  delta=left['pointsToDate']-right['pointsToDate']
  starters(right)[0]['points']+=delta
  right['pointsToDate']=left['pointsToDate']
  with self.assertRaisesRegex(ValueError,'Tied matchup'):derive(self.feed,self.media)
 def test_tied_mvp_requires_review(self):
  pair=self.feed['matchups'][0]['teams'];winner=max(pair,key=lambda t:t['pointsToDate'])
  ps=sorted(starters(winner),key=lambda p:p['points'],reverse=True)
  tied=(ps[0]['points']+ps[1]['points'])/2
  ps[0]['points']=tied;ps[1]['points']=tied
  d=derive(self.feed,self.media)
  self.assertTrue(any(t['type']=='mvp' for t in d['reviewRequired']))
 def test_special_teams_cannot_enter_offensive_selection(self):
  d=derive(self.feed,self.media)
  self.assertFalse(any(p['position'] in {'K','DEF'} for ps in d['teamOfWeek'].values() for p in ps))
 def test_correct_awards_and_winning_starter(self):
  d=derive(self.feed,self.media);self.assertEqual(d['awards']['closeCall']['winner']['name'],'El Hueso');self.assertEqual(d['awards']['closeCall']['margin'],4.8);self.assertEqual(d['awards']['lucky']['winner']['name'],'MAGNETO IS STILL RIGHT');self.assertEqual(d['awards']['hardLuck']['loser']['name'],'Mr. Electricity');self.assertEqual(d['awards']['manager']['winner']['name'],'The Arbiter')
  for m in d['matchups']:self.assertEqual(m['mvp']['fantasyTeamId'],m['winner']['teamId'])
if __name__=='__main__':unittest.main()
