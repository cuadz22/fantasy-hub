import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function StsStandings({ leagueId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/custom-standings/${leagueId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [leagueId]);

  if (loading) return <div style={styles.empty}>Loading standings...</div>;
  if (error) return <div style={styles.empty}>Could not load standings.</div>;
  if (!data || !data.teams || data.teams.length === 0) {
    return <div style={styles.empty}>No data yet. Standings will appear once the season begins.</div>;
  }

  const { teams, hasWeeklyData } = data;

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <div style={styles.label}>Standings</div>
        <div style={styles.scoring}>
          <span style={styles.pill}><span style={styles.pillGreen}>Win + Top 6</span> = <strong>7 pts</strong></span>
          <span style={styles.pill}><span style={styles.pillMuted}>Win only</span> = <strong>4 pts</strong></span>
          <span style={styles.pill}><span style={styles.pillMuted}>Top 6 only</span> = <strong>3 pts</strong></span>
          <span style={styles.pill}><span style={styles.pillMuted}>Neither</span> = <strong>0 pts</strong></span>
        </div>
        {!hasWeeklyData && (
          <div style={styles.notice}>Pre-season estimate — based on win record only. High score points will appear after the first sync.</div>
        )}
      </div>

      <div style={styles.table}>
        <div style={styles.thead}>
          <div style={{ ...styles.col, ...styles.colRank }}>#</div>
          <div style={{ ...styles.col, ...styles.colName }}>Team</div>
          <div style={{ ...styles.col, ...styles.colPts }}>PTS</div>
          <div style={{ ...styles.col, ...styles.colStat }}>W-L</div>
          <div style={{ ...styles.col, ...styles.colStat }}>Win Pts</div>
          <div style={{ ...styles.col, ...styles.colStat }}>High Score Pts</div>
          <div style={{ ...styles.col, ...styles.colStat }}>High Score Wks</div>
          <div style={{ ...styles.col, ...styles.colStat }}>PF</div>
        </div>

        {teams.map((team, i) => {
          const isTop = team.rank <= 6;
          return (
            <div
              key={team.name}
              style={{ ...styles.row, ...(i % 2 === 0 ? styles.rowEven : {}), ...(isTop ? styles.rowPlayoff : {}) }}
            >
              <div style={{ ...styles.col, ...styles.colRank }}>
                <span style={{ ...styles.rankNum, ...(isTop ? styles.rankNumTop : {}) }}>{team.rank}</span>
              </div>
              <div style={{ ...styles.col, ...styles.colName }}>
                <span style={styles.teamName}>{team.name}</span>
                {isTop && <span style={styles.playoffBadge}>PLY</span>}
              </div>
              <div style={{ ...styles.col, ...styles.colPts }}>
                <span style={styles.bigPts}>{team.customPoints}</span>
              </div>
              <div style={{ ...styles.col, ...styles.colStat }}>
                {team.wins}-{team.losses}
              </div>
              <div style={{ ...styles.col, ...styles.colStat }}>
                {team.winPointsEarned}
              </div>
              <div style={{ ...styles.col, ...styles.colStat }}>
                {hasWeeklyData ? team.highScorePointsEarned : '—'}
              </div>
              <div style={{ ...styles.col, ...styles.colStat }}>
                {hasWeeklyData ? team.highScoreWeeks : '—'}
              </div>
              <div style={{ ...styles.col, ...styles.colStat }}>
                {team.pointsFor > 0 ? team.pointsFor.toFixed(1) : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {hasWeeklyData && (
        <div style={styles.footer}>
          Playoff line after top 6 teams · Tiebreaker: total points scored
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  empty: { color: 'var(--text-muted)', fontSize: 13, padding: '40px 0' },
  headerRow: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  scoring: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  pill: { fontSize: 11, color: 'var(--text)', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 4, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 },
  pillGreen: { color: '#4caf50' },
  pillMuted: { color: 'var(--text-muted)' },
  notice: { fontSize: 11, color: 'var(--red)', marginTop: 2 },
  table: { display: 'flex', flexDirection: 'column', borderRadius: 6, overflow: 'hidden', border: '0.5px solid var(--border)' },
  thead: { display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' },
  row: { display: 'flex', alignItems: 'center', padding: '11px 12px', borderBottom: '0.5px solid var(--border)' },
  rowEven: { background: 'rgba(255,255,255,0.015)' },
  rowPlayoff: { borderLeft: '2px solid var(--red)' },
  col: { fontSize: 12, color: 'var(--text-muted)' },
  colRank: { width: 32, flexShrink: 0 },
  colName: { flex: 1, display: 'flex', alignItems: 'center', gap: 8 },
  colPts: { width: 56, textAlign: 'center', flexShrink: 0 },
  colStat: { width: 90, textAlign: 'center', flexShrink: 0 },
  rankNum: { fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' },
  rankNumTop: { color: 'var(--text)' },
  teamName: { fontSize: 13, color: 'var(--text)', fontWeight: 500 },
  playoffBadge: { fontSize: 9, letterSpacing: '0.06em', color: 'var(--red)', border: '0.5px solid var(--red)', borderRadius: 3, padding: '1px 4px' },
  bigPts: { fontSize: 16, fontWeight: 700, color: 'var(--text)' },
  footer: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4 },
};