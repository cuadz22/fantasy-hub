import { useEffect, useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';

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

function PowerBar({ score, isMobile }) {
  return (
    <div style={styles.barWrap}>
      <div style={{ ...styles.barFill, width: `${Math.max(4, score)}%` }} />
      {!isMobile && <span style={styles.barLabel}>{score.toFixed(1)}</span>}
      {isMobile && <span style={styles.barLabel}>{score.toFixed(0)}</span>}
    </div>
  );
}

export default function PowerRankings({ leagueId }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasWeeklyData, setHasWeeklyData] = useState(false);
  const isMobile = useIsMobile();

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
            <span style={styles.preseasonBadge}>Pre-season estimate</span>
          )}
        </div>
        {!isMobile && (
          <div style={styles.legend}>
            <span style={styles.legendDot} />
            <span style={styles.legendText}>All-play 30% · Points For 25% · Recent Form 15% · Win% 15% · Pts Against 15% · Streak ±15%</span>
          </div>
        )}
      </div>

      <div style={styles.table}>
        <div style={styles.theader}>
          <div style={{ ...styles.col, ...styles.colRank }}>#</div>
          <div style={{ ...styles.col, ...styles.colMove }}></div>
          <div style={{ ...styles.col, ...styles.colName }}>Team</div>
          <div style={{ ...styles.col, ...styles.colStat }}>Record</div>
          {!isMobile && <div style={{ ...styles.col, ...styles.colStat }}>All-Play</div>}
          {!isMobile && <div style={{ ...styles.col, ...styles.colStat }}>PF</div>}
          {!isMobile && <div style={{ ...styles.col, ...styles.colStat }}>Recent</div>}
          <div style={{ ...styles.col, ...(isMobile ? styles.colBarMobile : styles.colBar) }}>Score</div>
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
            {!isMobile && (
              <div style={{ ...styles.col, ...styles.colStat }}>
                {hasWeeklyData ? `${team.allPlayWins}-${team.allPlayLosses}` : '—'}
              </div>
            )}
            {!isMobile && (
              <div style={{ ...styles.col, ...styles.colStat }}>
                {team.pointsFor > 0 ? team.pointsFor.toFixed(1) : '—'}
              </div>
            )}
            {!isMobile && (
              <div style={{ ...styles.col, ...styles.colStat }}>
                {hasWeeklyData ? team.recentForm : '—'}
              </div>
            )}
            <div style={{ ...styles.col, ...(isMobile ? styles.colBarMobile : styles.colBar) }}>
              <PowerBar score={team.powerScore} isMobile={isMobile} />
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
  theader: { display: 'flex', alignItems: 'center', padding: '8px 10px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' },
  row: { display: 'flex', alignItems: 'center', padding: '10px 10px', borderBottom: '0.5px solid var(--border)' },
  rowEven: { background: 'rgba(255,255,255,0.015)' },

  col: { fontSize: 12, color: 'var(--text-muted)' },
  colRank: { width: 24, flexShrink: 0 },
  colMove: { width: 32, flexShrink: 0 },
  colName: { flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
  colStat: { width: 68, textAlign: 'center', flexShrink: 0 },
  colBar: { width: 140, flexShrink: 0 },
  colBarMobile: { width: 80, flexShrink: 0 },

  rankNum: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  teamName: { fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  rankChangeUp: { fontSize: 11, color: '#4caf50', fontWeight: 600 },
  rankChangeDown: { fontSize: 11, color: 'var(--red)', fontWeight: 600 },
  rankChangeSame: { fontSize: 11, color: 'var(--text-muted)' },
  rankChangeNew: { fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em', border: '0.5px solid var(--border)', borderRadius: 3, padding: '1px 3px' },

  streak: { fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', borderRadius: 4, padding: '2px 5px', flexShrink: 0 },
  streakWin: { background: 'rgba(76,175,80,0.12)', color: '#4caf50' },
  streakLoss: { background: 'rgba(211,47,47,0.12)', color: 'var(--red)' },

  barWrap: { display: 'flex', alignItems: 'center', gap: 6 },
  barFill: { height: 6, borderRadius: 3, background: 'var(--red)', transition: 'width 0.3s ease', flexShrink: 0 },
  barLabel: { fontSize: 11, color: 'var(--text-muted)', minWidth: 24 },
};
