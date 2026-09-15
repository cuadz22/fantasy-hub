import { useEffect, useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';

function normalize(value, min, max) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function parseStreak(streak) {
  if (!streak) return 0;
  const m = streak.match(/([WL])(\d+)/);
  if (!m) return 0;
  const val = parseInt(m[2]);
  return m[1] === 'W' ? val : -val;
}

function computePowerScore(standingsTeams, weeksData) {
  // --- All-play record ---
  const apMap = {};
  for (const week of weeksData) {
    const scores = week.teams.map(t => t.score);
    for (const t of week.teams) {
      if (!apMap[t.name]) apMap[t.name] = { wins: 0, games: 0 };
      apMap[t.name].wins += scores.filter(s => s < t.score).length;
      apMap[t.name].games += scores.length - 1;
    }
  }

  // --- Recent form: last 3 weeks matchup results ---
  const recentWeeks = weeksData.slice(-3);
  const rfMap = {};
  for (const week of recentWeeks) {
    for (const t of week.teams) {
      if (!rfMap[t.name]) rfMap[t.name] = { wins: 0, games: 0 };
      rfMap[t.name].wins += t.won ? 1 : 0;
      rfMap[t.name].games += 1;
    }
  }

  // --- Normalize PF / PA across the league ---
  const pfValues = standingsTeams.map(t => t.pf);
  const paValues = standingsTeams.map(t => t.pa);
  const minPF = Math.min(...pfValues), maxPF = Math.max(...pfValues);
  const minPA = Math.min(...paValues), maxPA = Math.max(...paValues);

  return standingsTeams.map(team => {
    const totalGames = team.wins + team.losses + (team.ties || 0);
    const winPct = totalGames > 0 ? (team.wins + (team.ties || 0) * 0.5) / totalGames : 0.5;
    const normPF = normalize(team.pf, minPF, maxPF);
    const normPA = normalize(team.pa, minPA, maxPA);

    const ap = apMap[team.name] || { wins: 0, games: 0 };
    const allPlayPct = ap.games > 0 ? ap.wins / ap.games : 0.5;

    const rf = rfMap[team.name] || { wins: 0, games: 0 };
    const recentFormPct = rf.games > 0 ? rf.wins / rf.games : winPct;

    // Streak: +/-3% per game, capped at +/-15%
    const streakVal = parseStreak(team.streak);
    const streakBonus = Math.max(-0.15, Math.min(0.15, streakVal * 0.03));

    // Formula: All-play 30% · PF 25% · Recent Form 15% · Win% 15% · PA 15% + streak modifier
    const base = allPlayPct * 0.30 + normPF * 0.25 + recentFormPct * 0.15 + winPct * 0.15 + (1 - normPA) * 0.15;
    const final = Math.max(0, Math.min(1, base + streakBonus));

    return {
      ...team,
      powerScore: Math.round(final * 1000) / 10,
      allPlayWins: ap.wins,
      allPlayGames: ap.games,
      allPlayPct: ap.games > 0 ? allPlayPct : null,
    };
  });
}

function PowerBar({ score, isMobile }) {
  return (
    <div style={styles.barWrap}>
      <div style={{ ...styles.barFill, width: `${Math.max(3, score)}%` }} />
      <span style={styles.barLabel}>{score.toFixed(isMobile ? 0 : 1)}</span>
    </div>
  );
}

export default function PowerRankings({ leagueId }) {
  const [teams, setTeams] = useState([]);
  const [meta, setMeta] = useState({});
  const [hasScores, setHasScores] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/data/${leagueId}/standings.json`).then(r => { if (!r.ok) throw new Error('standings'); return r.json(); }),
      fetch(`/data/${leagueId}/scores.json`).then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([standingsData, scoresData]) => {
        const rawTeams = standingsData.teams || [];
        const weeks = scoresData?.weeks || [];

        let scored;
        if (weeks.length > 0) {
          scored = computePowerScore(rawTeams, weeks);
          setHasScores(true);
        } else {
          // Fallback: simplified formula if no scores.json yet
          const pfValues = rawTeams.map(t => t.pf);
          const paValues = rawTeams.map(t => t.pa);
          const minPF = Math.min(...pfValues), maxPF = Math.max(...pfValues);
          const minPA = Math.min(...paValues), maxPA = Math.max(...paValues);
          scored = rawTeams.map(team => {
            const totalGames = team.wins + team.losses + (team.ties || 0);
            const winPct = totalGames > 0 ? (team.wins + (team.ties || 0) * 0.5) / totalGames : 0.5;
            const normPF = normalize(team.pf, minPF, maxPF);
            const normPA = normalize(team.pa, minPA, maxPA);
            const score = winPct * 0.50 + normPF * 0.35 + (1 - normPA) * 0.15;
            return { ...team, powerScore: Math.round(score * 1000) / 10, allPlayWins: null, allPlayGames: null };
          });
          setHasScores(false);
        }

        scored.sort((a, b) => b.powerScore - a.powerScore);
        scored.forEach((t, i) => { t.rank = i + 1; });
        setTeams(scored);
        setMeta({ week: standingsData.week, updated: standingsData.updated });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [leagueId]);

  if (loading) return <div style={styles.empty}>Loading power rankings...</div>;
  if (error) return <div style={styles.empty}>Could not load rankings.</div>;

  const hasData = teams.some(t => (t.pf || 0) > 0);
  if (!hasData) return (
    <div style={styles.empty}>
      No game data yet — power rankings will appear once Week 1 scores are finalized.
    </div>
  );

  const formulaLabel = hasScores
    ? 'All-Play 30% · PF 25% · Form 15% · W% 15% · PA 15% + Streak ±3%/wk'
    : 'Win% 50% · PF 35% · PA 15%';

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <div style={styles.metaLabel}>Power Rankings · Week {meta.week}</div>
        {!isMobile && (
          <div style={styles.legend}>
            <span style={styles.legendDot} />
            <span style={styles.legendText}>{formulaLabel}</span>
          </div>
        )}
      </div>

      <div style={styles.table}>
        <div style={styles.theader}>
          <div style={{ ...styles.col, ...styles.colRank }}>#</div>
          <div style={{ ...styles.col, ...styles.colName }}>Team</div>
          <div style={{ ...styles.col, ...styles.colStat }}>Record</div>
          {!isMobile && hasScores && <div style={{ ...styles.col, ...styles.colStat }}>All-Play</div>}
          {!isMobile && <div style={{ ...styles.col, ...styles.colStat }}>PF</div>}
          {!isMobile && <div style={{ ...styles.col, ...styles.colStat }}>PA</div>}
          {!isMobile && <div style={{ ...styles.col, ...styles.colStat }}>Streak</div>}
          <div style={{ ...styles.col, ...(isMobile ? styles.colBarMobile : styles.colBar) }}>Score</div>
        </div>

        {teams.map((team, i) => {
          const streakVal = parseStreak(team.streak);
          const streakColor = streakVal > 0 ? '#4caf50' : streakVal < 0 ? 'var(--red)' : 'var(--text-muted)';
          return (
            <div key={team.name} style={{ ...styles.row, ...(i % 2 === 0 ? styles.rowEven : {}) }}>
              <div style={{ ...styles.col, ...styles.colRank }}>
                <span style={styles.rankNum}>{team.rank}</span>
              </div>
              <div style={{ ...styles.col, ...styles.colName }}>
                <span style={styles.teamName}>{team.name}</span>
              </div>
              <div style={{ ...styles.col, ...styles.colStat }}>
                {team.wins}-{team.losses}{(team.ties || 0) > 0 ? `-${team.ties}` : ''}
              </div>
              {!isMobile && hasScores && (
                <div style={{ ...styles.col, ...styles.colStat }}>
                  {team.allPlayGames > 0
                    ? `${team.allPlayWins}-${team.allPlayGames - team.allPlayWins}`
                    : '—'}
                </div>
              )}
              {!isMobile && (
                <div style={{ ...styles.col, ...styles.colStat }}>{(team.pf || 0).toFixed(1)}</div>
              )}
              {!isMobile && (
                <div style={{ ...styles.col, ...styles.colStat }}>{(team.pa || 0).toFixed(1)}</div>
              )}
              {!isMobile && (
                <div style={{ ...styles.col, ...styles.colStat, color: streakColor, fontWeight: 600 }}>
                  {team.streak || '—'}
                </div>
              )}
              <div style={{ ...styles.col, ...(isMobile ? styles.colBarMobile : styles.colBar) }}>
                <PowerBar score={team.powerScore} isMobile={isMobile} />
              </div>
            </div>
          );
        })}
      </div>
      <p style={styles.note}>Updated {meta.updated}</p>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  empty: { color: 'var(--text-muted)', fontSize: 13, padding: '40px 0' },
  headerRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  metaLabel: { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  legend: { display: 'flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 },
  legendText: { fontSize: 10, color: 'var(--text-muted)' },

  table: { display: 'flex', flexDirection: 'column', borderRadius: 6, overflow: 'hidden', border: '0.5px solid var(--border)' },
  theader: { display: 'flex', alignItems: 'center', padding: '8px 10px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' },
  row: { display: 'flex', alignItems: 'center', padding: '10px 10px', borderBottom: '0.5px solid var(--border)' },
  rowEven: { background: 'rgba(255,255,255,0.015)' },

  col: { fontSize: 12, color: 'var(--text-muted)' },
  colRank: { width: 24, flexShrink: 0 },
  colName: { flex: 1, minWidth: 0 },
  colStat: { width: 72, textAlign: 'center', flexShrink: 0 },
  colBar: { width: 140, flexShrink: 0 },
  colBarMobile: { width: 80, flexShrink: 0 },

  rankNum: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  teamName: { fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },

  barWrap: { display: 'flex', alignItems: 'center', gap: 6 },
  barFill: { height: 6, borderRadius: 3, background: 'var(--red)', transition: 'width 0.3s ease', flexShrink: 0 },
  barLabel: { fontSize: 11, color: 'var(--text-muted)', minWidth: 24 },

  note: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' },
};
