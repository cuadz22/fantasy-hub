import { useState, useEffect } from 'react';
import PlayerAvatar from './PlayerAvatar';

function PlayerScorers({ players }) {
  if (!players || players.length === 0) return null;
  const sorted = [...players].sort((a, b) => b.points - a.points);
  const top3 = sorted.slice(0, 3);
  // Only show Duds when we have full roster data (not just recap top-4)
  const hasFullRoster = players.length >= 8;
  const bot3 = hasFullRoster ? sorted.slice(-3).reverse() : [];

  return (
    <div style={pStyles.wrap}>
      <div style={pStyles.section}>
        <div style={pStyles.label}>Top</div>
        {top3.map((p, i) => (
          <div key={i} style={pStyles.row}>
            <PlayerAvatar name={p.name} position={p.position} size={22} />
            <span style={pStyles.pos}>{p.position}</span>
            <span style={pStyles.name}>{p.name}</span>
            <span style={{ ...pStyles.pts, color: 'var(--red)' }}>{p.points.toFixed(1)}</span>
          </div>
        ))}
      </div>
      {hasFullRoster && <div style={pStyles.divider} />}
      {hasFullRoster && <div style={pStyles.section}>
        <div style={pStyles.label}>Duds</div>
        {bot3.map((p, i) => (
          <div key={i} style={pStyles.row}>
            <PlayerAvatar name={p.name} position={p.position} size={22} />
            <span style={pStyles.pos}>{p.position}</span>
            <span style={pStyles.name}>{p.name}</span>
            <span style={{ ...pStyles.pts, color: p.points <= 0 ? '#e57373' : 'var(--text-muted)' }}>{p.points.toFixed(1)}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}

const pStyles = {
  wrap: { marginTop: 14, borderTop: '0.5px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 0 },
  section: { display: 'flex', flexDirection: 'column', gap: 4 },
  divider: { height: 8 },
  label: { fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', opacity: 0.5, marginBottom: 2 },
  row: { display: 'flex', alignItems: 'center', gap: 5 },
  pos: { fontSize: 9, color: 'var(--text-muted)', opacity: 0.6, width: 22, flexShrink: 0, fontWeight: 600 },
  name: { fontSize: 10, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  pts: { fontSize: 10, fontWeight: 600, flexShrink: 0, minWidth: 28, textAlign: 'right' },
};

export default function Matchups({ leagueId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/data/${leagueId}/matchups.json`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [leagueId]);

  if (loading) return <div style={styles.note}>Loading matchups...</div>;
  if (!data) return <div style={styles.note}>Could not load matchups.</div>;

  const { week, matchups, status, rivalryWeek, updated } = data;
  const isLive = status === 'in_progress';
  const hasPlayers = matchups.some(m => m.teamA.players?.length > 0 || m.teamB.players?.length > 0);

  return (
    <div>
      <div style={styles.header}>
        <span style={styles.weekLabel}>Week {week}</span>
        {isLive && <span style={styles.liveBadge}>● Live</span>}
        {rivalryWeek && <span style={styles.rivalryBadge}>Rivalry Week</span>}
      </div>

      <div style={styles.grid}>
        {matchups.map((m, i) => {
          const aWins = m.teamA.score > m.teamB.score;
          const bWins = m.teamB.score > m.teamA.score;
          const tied = m.teamA.score === m.teamB.score;

          return (
            <div key={i} style={styles.card}>
              <div style={styles.cardBar} />
              <div style={styles.matchup}>
                <div style={styles.team}>
                  <div style={{ ...styles.score, color: aWins ? 'var(--red)' : 'var(--text-muted)' }}>
                    {m.teamA.score.toFixed(1)}
                  </div>
                  <div style={{ ...styles.teamName, color: aWins ? 'var(--text)' : 'var(--text-muted)' }}>
                    {m.teamA.name}
                  </div>
                  {m.teamA.projected > 0 && (
                    <div style={styles.proj}>proj {m.teamA.projected.toFixed(1)}</div>
                  )}
                </div>
                <div style={styles.sep} />
                <div style={styles.team}>
                  <div style={{ ...styles.score, color: bWins ? 'var(--red)' : 'var(--text-muted)' }}>
                    {m.teamB.score.toFixed(1)}
                  </div>
                  <div style={{ ...styles.teamName, color: bWins ? 'var(--text)' : 'var(--text-muted)' }}>
                    {m.teamB.name}
                  </div>
                  {m.teamB.projected > 0 && (
                    <div style={styles.proj}>proj {m.teamB.projected.toFixed(1)}</div>
                  )}
                </div>
              </div>

              {hasPlayers && (
                <div style={styles.scorersRow}>
                  <div style={styles.scorerCol}>
                    <PlayerScorers players={m.teamA.players} />
                  </div>
                  <div style={styles.scorerDivider} />
                  <div style={styles.scorerCol}>
                    <PlayerScorers players={m.teamB.players} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p style={styles.note}>Updated {updated}</p>
    </div>
  );
}

const styles = {
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  weekLabel: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  liveBadge: { fontSize: 10, color: '#4caf50', fontWeight: 600, letterSpacing: '0.05em' },
  rivalryBadge: { fontSize: 10, color: 'var(--red)', border: '0.5px solid var(--red)', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.05em' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 },
  card: { background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '20px 16px', position: 'relative', overflow: 'hidden' },
  cardBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--red)' },
  matchup: { display: 'flex', alignItems: 'center', gap: 12 },
  team: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 },
  score: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, lineHeight: 1 },
  teamName: { fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' },
  proj: { fontSize: 9, color: 'var(--text-muted)', opacity: 0.6 },
  sep: { width: 1, height: 48, background: 'var(--border)' },
  scorersRow: { display: 'flex', gap: 0, marginTop: 14, borderTop: '0.5px solid var(--border)', paddingTop: 12 },
  scorerCol: { flex: 1, minWidth: 0 },
  scorerDivider: { width: 1, background: 'var(--border)', margin: '0 10px', flexShrink: 0 },
  note: { fontSize: 11, color: 'var(--text-muted)', marginTop: 16, textAlign: 'right' },
};
