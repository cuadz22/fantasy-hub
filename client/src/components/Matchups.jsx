import { useState } from 'react';

const SAMPLE_MATCHUPS = [
  { teamA: { name: 'Team Alpha', score: 142.4 }, teamB: { name: 'Team Delta', score: 118.6 } },
  { teamA: { name: 'Team Bravo', score: 127.8 }, teamB: { name: 'Team Golf', score: 134.2 } },
  { teamA: { name: 'Team Charlie', score: 108.3 }, teamB: { name: 'Team Echo', score: 99.1 } },
  { teamA: { name: 'Team Foxtrot', score: 156.7 }, teamB: { name: 'Team Hotel', score: 88.4 } },
];

export default function Matchups({ leagueId }) {
  const [week, setWeek] = useState(11);
  const weeks = Array.from({ length: 14 }, (_, i) => i + 1);

  return (
    <div>
      <div style={styles.weekRow}>
        <span style={styles.weekLabel}>Week</span>
        <div style={styles.weekPills}>
          {weeks.map(w => (
            <button
              key={w}
              onClick={() => setWeek(w)}
              style={{ ...styles.pill, ...(week === w ? styles.pillActive : {}) }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <div style={styles.grid}>
        {SAMPLE_MATCHUPS.map((m, i) => {
          const aWins = m.teamA.score > m.teamB.score;
          return (
            <div key={i} style={styles.card}>
              <div style={styles.cardBar} />
              <div style={styles.matchup}>
                <div style={styles.team}>
                  <div style={{ ...styles.score, color: aWins ? 'var(--red)' : '#333' }}>
                    {m.teamA.score.toFixed(1)}
                  </div>
                  <div style={{ ...styles.teamName, color: aWins ? 'var(--text)' : 'var(--text-muted)' }}>
                    {m.teamA.name}
                  </div>
                </div>
                <div style={styles.sep} />
                <div style={styles.team}>
                  <div style={{ ...styles.score, color: !aWins ? 'var(--red)' : '#333' }}>
                    {m.teamB.score.toFixed(1)}
                  </div>
                  <div style={{ ...styles.teamName, color: !aWins ? 'var(--text)' : 'var(--text-muted)' }}>
                    {m.teamB.name}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p style={styles.note}>Connect Yahoo in Studio to load live matchups.</p>
    </div>
  );
}

const styles = {
  weekRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  weekLabel: { fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  weekPills: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  pill: { padding: '4px 10px', borderRadius: 20, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text-muted)', transition: 'all 0.12s' },
  pillActive: { background: 'var(--red)', color: '#fff', borderColor: 'var(--red)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 },
  card: { background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '20px 16px', position: 'relative', overflow: 'hidden' },
  cardBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--red)' },
  matchup: { display: 'flex', alignItems: 'center', gap: 12 },
  team: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  score: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, lineHeight: 1 },
  teamName: { fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' },
  sep: { width: 1, height: 48, background: 'var(--border)' },
  note: { fontSize: 11, color: '#333', marginTop: 16, textAlign: 'right' },
};
