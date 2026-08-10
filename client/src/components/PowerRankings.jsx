import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function RankChange({ change }) {
  if (change === null) return <span style={styles.rankChangeNew}>NEW</span>;
  if (change === 0) return <span style={styles.rankChangeSame}>—</span>;
  if (change > 0) return <span style={styles.rankChangeUp}>↑{change}</span>;
  return <span style={styles.rankChangeDown}>↓{Math.abs(change)}</span>;
}

function StreakBadge({ streak }) {
  if (streak === 0) return null;
  const isWin = streak > 0;
  const label = `${isWin ? 'W' : 'L'}${Math.abs(streak)}`;
  return (
    <span style={{ ...styles.streak, ...(isWin ? styles.streakWin : styles.streakLoss) }}>
      {label}
    </span>
  );
}

function PowerBar({ score }) {
  return (
    <div style={styles.barWrap}>
      <div style={{ ...styles.barFill, width: `${Math.max(4, score)}%` }} />
      <span style={styles.barLabel}>{score.toFixed(1)}</span>
    </div>
  );
}

export default function PowerRankings({ leagueId }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasWeeklyData, setHasWeeklyData] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/power/${leagueId}`)
      .then(r => r.json())
      .then(data => {
        setRankings(data.rankings || []);
        setHasWeeklyData(data.rankings?.[0]?.hasWeeklyData || false);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [leagueId]);

  if (loading) return <div style={styles.empty}>Loading power rankings...</div>;
  if (error) return <div style={styles.empty}>Could not load rankings.</div>;
  if (rankings.length === 0) return (
    <div style={styles.empty}>
      No standings data yet. Rankings will appear once the season begins and data has been synced.
    </div>
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <div style={styles.meta}>
          Power Rankings
          {!hasWeeklyData && (
            <span style={styles.preseasonBadge}>Pre-season estimate — based on standings only</span>
          )}
        </div>
        <div style={styles.legend}>
          <span style={styles.legendDot} />
          <span style={styles.legendText}>All-play 30% · Points For 25% · Recent Form 15% · Win% 15% · Pts Against 15% · Streak ±15%</span>
        </div>
      </div>

      <div style={styles.table}>
        <div style={styles.theader}>
          <div style={{ ...styles.col, ...styles.colRank }}>#</div>
          <div style={{ ...styles.col, ...styles.colMove }}></div>
          <div style={{ ...styles.col, ...styles.colName }}>Team</div>
          <div style={{ ...styles.col, ...styles.colStat }}>Record</div>
          <div style={{ ...styles.col, ...styles.colStat }}>All-Play</div>
          <div style={{ ...styles.col, ...styles.colStat }}>PF</div>
          <div style={{ ...styles.col, ...styles.colStat }}>Recent</div>
          <div style={{ ...styles.col, ...styles.colBar }}>Power Score</div>
        </div>

        {rankings.map((team, i) => (
          <div
            key={team.name}
            style={{ ...styles.row, ...(i % 2 === 0 ? styles.rowEven : {}) }}
          >
            <div style={{ ...styles.col, ...styles.colRank }}>
              <span style={styles.rankNum}>{team.rank}</span>
            </div>
            <div style={{ ...styles.col, ...styles.colMove }}>
              <RankChange change={team.rankChange} />
            </div>
            <div style={{ ...styles.col, ...styles.colName }}>
              <span style={styles.teamName}>{team.name}</span>
              <StreakBadge streak={team.streak} />
            </div>
            <div style={{ ...styles.col, ...styles.colStat }}>
              {team.wins}-{team.losses}{team.ties > 0 ? `-${team.ties}` : ''}
            </div>
            <div style={{ ...styles.col, ...styles.colStat }}>
              {hasWeeklyData ? `${team.allPlayWins}-${team.allPlayLosses}` : '—'}
            </div>
            <div style={{ ...styles.col, ...styles.colStat }}>
              {team.pointsFor > 0 ? team.pointsFor.toFixed(1) : '—'}
            </div>
            <div style={{ ...styles.col, ...styles.colStat }}>
              {hasWeeklyData ? team.recentForm : '—'}
            </div>
            <div style={{ ...styles.col, ...styles.colBar }}>
              <PowerBar score={team.powerScore} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  empty: { color: 'var(--text-muted)', fontSize: 13, padding: '40px 0' },
  headerRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  meta: { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 12 },
  preseasonBadge: { fontSize: 10, color: 'var(--red)', border: '0.5px solid var(--red)', borderRadius: 4, padding: '2px 6px', textTransform: 'none', letterSpacing: 0 },
  legend: { display: 'flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 },
  legendText: { fontSize: 10, color: 'var(--text-muted)' },
  table: { display: 'flex', flexDirection: 'column', borderRadius: 6, overflow: 'hidden', border: '0.5px solid var(--border)' },
  theader: { display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' },
  row: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '0.5px solid var(--border)', transition: 'background 0.1s' },
  rowEven: { background: 'rgba(255,255,255,0.015)' },
  col: { fontSize: 12, color: 'var(--text-muted)' },
  colRank: { width: 28, flexShrink: 0 },
  colMove: { width: 36, flexShrink: 0 },
  colName: { flex: 1, display: 'flex', alignItems: 'center', gap: 8 },
  colStat: { width: 72, textAlign: 'center', flexShrink: 0 },
  colBar: { width: 160, flexShrink: 0 },
  rankNum: { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  teamName: { fontSize: 13, color: 'var(--text)', fontWeight: 500 },
  rankChangeUp: { fontSize: 11, color: '#4caf50', fontWeight: 600 },
  rankChangeDown: { fontSize: 11, color: 'var(--red)', fontWeight: 600 },
  rankChangeSame: { fontSize: 11, color: 'var(--text-muted)' },
  rankChangeNew: { fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em', border: '0.5px solid var(--border)', borderRadius: 3, padding: '1px 3px' },
  streak: { fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', borderRadius: 4, padding: '2px 5px' },
  streakWin: { background: 'rgba(76,175,80,0.12)', color: '#4caf50' },
  streakLoss: { background: 'rgba(211,47,47,0.12)', color: 'var(--red)' },
  barWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  barFill: { height: 6, borderRadius: 3, background: 'var(--red)', transition: 'width 0.3s ease' },
  barLabel: { fontSize: 11, color: 'var(--text-muted)', minWidth: 28 },
};