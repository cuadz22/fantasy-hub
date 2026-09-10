import { useState, useEffect } from 'react';
import useIsMobile from '../hooks/useIsMobile';

export default function Standings({ leagueId }) {
  const [standings, setStandings] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setLoading(true);
    fetch(`/data/${leagueId}/standings.json`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(data => {
        setStandings(data.teams || []);
        setMeta({ week: data.week, updated: data.updated });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [leagueId]);

  if (loading) return <div style={styles.loading}>Loading standings...</div>;
  if (error) return <div style={styles.loading}>Could not load standings.</div>;

  const playoffLine = 6;

  return (
    <div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: 32 }}>#</th>
            <th style={{ ...styles.th, textAlign: 'left' }}>Team</th>
            <th style={styles.th}>{isMobile ? 'W-L' : 'W'}</th>
            {!isMobile && <th style={styles.th}>L</th>}
            {!isMobile && <th style={styles.th}>T</th>}
            <th style={styles.th}>PF</th>
            {!isMobile && <th style={styles.th}>PA</th>}
            {!isMobile && <th style={styles.th}>FAAB</th>}
          </tr>
        </thead>
        <tbody>
          {standings.map((team, i) => {
            const isPlayoffBubble = i === playoffLine - 1;
            return (
              <>
                <tr key={team.name} style={i === 0 ? styles.rowFirst : styles.row}>
                  <td style={{ ...styles.td, color: i === 0 ? 'var(--red)' : 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>{team.rank}</td>
                  <td style={{ ...styles.td, fontWeight: i === 0 ? 500 : 400 }}>{team.name}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {isMobile ? `${team.wins}-${team.losses}` : team.wins}
                  </td>
                  {!isMobile && <td style={{ ...styles.td, textAlign: 'center', color: 'var(--text-muted)' }}>{team.losses}</td>}
                  {!isMobile && <td style={{ ...styles.td, textAlign: 'center', color: 'var(--text-muted)' }}>{team.ties}</td>}
                  <td style={{ ...styles.td, textAlign: 'right', fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 14 : 16 }}>{team.pf.toFixed(1)}</td>
                  {!isMobile && <td style={{ ...styles.td, textAlign: 'right', color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16 }}>{team.pa.toFixed(1)}</td>}
                  {!isMobile && <td style={{ ...styles.td, textAlign: 'right', color: 'var(--text-muted)', fontSize: 11 }}>${team.faab}</td>}
                </tr>
                {isPlayoffBubble && (
                  <tr key="bubble">
                    <td colSpan={isMobile ? 3 : 8} style={styles.playoffLine}>
                      <span style={styles.playoffLabel}>— playoff line —</span>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
      <p style={styles.note}>Week {meta.week} · Updated {meta.updated}</p>
    </div>
  );
}

const styles = {
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '8px 10px', borderBottom: '0.5px solid var(--border)', textAlign: 'center', fontWeight: 400 },
  row: { borderBottom: '0.5px solid var(--border)' },
  rowFirst: { borderBottom: '0.5px solid var(--border)', background: 'var(--red-dim)' },
  td: { padding: '11px 10px', fontSize: 13, color: 'var(--text)' },
  loading: { color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' },
  note: { fontSize: 11, color: 'var(--text-muted)', marginTop: 16, textAlign: 'right' },
  playoffLine: { padding: '2px 0', borderBottom: '1px dashed var(--border)', textAlign: 'center' },
  playoffLabel: { fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', opacity: 0.5 },
};
