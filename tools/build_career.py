"""Build client/api/career-highs.json from nflverse weekly player stats (data/nflverse/*.csv.gz, not committed).
Scores every regular-season game with each league's own rules (fitted to real Week 9 scores) and keeps each player's best game."""
import pandas as pd, numpy as np, json, re, glob, os, sys
SC = {  # per-league scoring; bonuses are flat adds
 'gl':  dict(py=.05, ptd=6, it=-2,   fl=-2, two=2, r100=3, c100=2, p300=2, rc40=0),
 'bh':  dict(py=.05, ptd=6, it=-1,   fl=-2, two=2, r100=0, c100=0, p300=0, rc40=0),
 'rb':  dict(py=.04, ptd=6, it=-2,   fl=-2, two=2, r100=2, c100=1, p300=2, rc40=1),
 'sts': dict(py=.05, ptd=6, it=-2.5, fl=-2, two=2, r100=3, c100=1, p300=2, rc40=0),
}
def nk(s): return re.sub(r'[^a-z]','',re.sub(r'\b(jr|sr|ii|iii|iv)\b\.?','',str(s).lower()))
def load():
    fs=sorted(glob.glob('data/nflverse/stats_player_week_*.csv.gz')); out=[]
    for f in fs:
        d=pd.read_csv(f,low_memory=False); d=d[d.season_type=='REG']; out.append(d)
    d=pd.concat(out,ignore_index=True, sort=False)
    need=['passing_yards','passing_tds','passing_interceptions','rushing_yards','rushing_tds','receptions','receiving_yards','receiving_tds','sack_fumbles_lost','rushing_fumbles_lost','receiving_fumbles_lost','passing_2pt_conversions','rushing_2pt_conversions','receiving_2pt_conversions','special_teams_tds','receiving_40']
    for c in need:
        if c not in d: d[c]=0
        d[c]=d[c].fillna(0)
    d['fl']=d.sack_fumbles_lost+d.rushing_fumbles_lost+d.receiving_fumbles_lost
    d['two']=d.passing_2pt_conversions+d.rushing_2pt_conversions+d.receiving_2pt_conversions
    return d
def score(d,c):
    return (d.passing_yards*c['py']+d.passing_tds*c['ptd']+d.passing_interceptions*c['it']+d.rushing_yards*.1+d.rushing_tds*6+d.receptions+d.receiving_yards*.1+d.receiving_tds*6
            +d.fl*c['fl']+d.two*c['two']+d.special_teams_tds*6+(d.rushing_yards>=100)*c['r100']+(d.receiving_yards>=100)*c['c100']+(d.passing_yards>=300)*c['p300']+d.receiving_40*c['rc40']).round(2)
if __name__=='__main__':
    d=load(); d=d[d.position.isin(['QB','RB','WR','TE'])].copy(); d['k']=d.player_display_name.map(nk)+'|'+d.position
    recent=set(d[d.season>=2025].k)
    d=d[d.k.isin(recent)]
    res={}
    for lg,c in SC.items():
        d['pts']=score(d,c)
        idx=d.groupby('k').pts.idxmax()
        for k,i in idx.items():
            r=d.loc[i]; res.setdefault(k,{})[lg]=[float(r.pts),int(r.season),int(r.week),str(r.opponent_team)]
    json.dump(res,open('client/api/career-highs.json','w'),separators=(',',':'))
    print(len(res),'players ->',os.path.getsize('client/api/career-highs.json')//1024,'KB')
    for k in ['justinjefferson|WR','bijanrobinson|RB','joeburrow|QB','traviskelce|TE']: print(k,res.get(k))
