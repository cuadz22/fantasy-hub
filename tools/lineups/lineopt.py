"""Shared optimal-lineup solver (exact). Used by the weekly preview, the Road to the Playoffs lineups, and the audit."""
import itertools
try:
    from scipy.optimize import linear_sum_assignment
    import numpy as np
except Exception:
    linear_sum_assignment=None
SLOT_OK={'QB':('QB',),'RB':('RB',),'WR':('WR',),'TE':('TE',),'K':('K',),'DEF':('DEF',),
         'W/R/T':('RB','WR','TE'),'FLEX':('RB','WR','TE'),'FLX':('RB','WR','TE'),
         'Q/W/R/T':('QB','RB','WR','TE'),'SFLEX':('QB','RB','WR','TE'),'SFX':('QB','RB','WR','TE')}
def solve(slots,players):
    """slots: list of slot names. players: list of dicts with 'pos','proj' (proj<=0 or None = unavailable).
    returns list (same length as slots) of player index or None, maximizing total projection. Exact."""
    avail=[i for i,p in enumerate(players) if p.get('proj') and p['proj']>0]
    n=len(slots)
    if not avail: return [None]*n
    if linear_sum_assignment is None: raise RuntimeError('scipy needed')
    big=-1e6
    M=np.full((n,len(avail)),0.0)
    for si,s in enumerate(slots):
        ok=SLOT_OK[s]
        for j,pi in enumerate(avail):
            M[si,j]=players[pi]['proj'] if players[pi]['pos'] in ok else big
    r,c=linear_sum_assignment(-M)
    out=[None]*n
    for si,j in zip(r,c):
        if M[si,j]>big/2: out[si]=avail[j]
    return out
def total(slots,players,assign):
    return sum(players[i]['proj'] for i in assign if i is not None)
def greedy_total(slots,players):
    """independent second method: fill dedicated slots with the best at each position, then FLEX slots, then SUPERFLEX, from what is left"""
    av=sorted([p for p in players if p.get('proj') and p['proj']>0],key=lambda p:-p['proj']); used=set(); tot=0.0
    order=sorted(slots,key=lambda s:len(SLOT_OK[s]))
    for s in order:
        for p in av:
            if id(p) in used or p['pos'] not in SLOT_OK[s]: continue
            used.add(id(p)); tot+=p['proj']; break
    return tot
