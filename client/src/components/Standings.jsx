import { useState, useEffect } from 'react';
import useIsMobile from '../hooks/useIsMobile';

export default function Standings({ leagueId }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    setTimeout(() => {
      setStandings([
        { rank: 1, name: 'Team Alpha', wins: 9, losses: 2, ties: 0, points_for: 1421.3, points_against: 1198.6 },
        { rank: 2, name: 'Team Bravo', wins: 8, losses: 3, ties: 0, points_for: 1389.1, points_against: 1210.4 },
        { rank: 3, name: 'Team Charlie', wins: 7, losses: 4, ties: 0, points_for: 1302.8, points_against: 1256.0 },
        { rank: 4, name: 'Team Delta', wins: 6, losses: 5, ties: 0, points_for: 1278.5, points_against: 1289.3 },
        { rank: 5, name: 'Team Echo', wins: 5, losses: 6, ties: 0, points_for: 1198.2, points_against: 1301.7 },
        { rank: 6, name: 'Team Foxtrot', wins: 4, losses: 7, ties: 0, points_for: 1156.9, points_against: 1344.2 },
        { rank: 7, name: 'Team Golf', wins: 3, losses: 8, ties: 0, points_for: 1098.4, points_against: 1388.6 },
        { rank: 8, name: 'Team Hotel', wins: 2, losses: 9, ties: 0, points_for: 1044.1, points_against: 1401.3 },
      ]);
      setLoading(false);
    }, 600);
  }, [leagueId]);

  if (loading) return <div style={styles.loading}>Loading standings...</div>;

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
          </tr>
        </thead>
        <tbody>
          {standings.map((team, i) => (
            <tr key={i} style={i === 0 ? styles.rowFirst : styles.row}>
              <td style={{ ...styles.td, color: i === 0 ? 'var(--red)' : 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>{team.rank}</td>
              <td style={{ ...styles.td, fontWeight: i === 0 ? 500 : 400 }}>{team.name}</td>
              <td style={{ ...styles.td, textAlign: 'center' }}>
                {isMobile ? `${team.wins}-${team.losses}` : team.wins}
              </td>
              {!isMobile && <td style={{ ...styles.td, textAlign: 'center', color: 'var(--text-muted)' }}>{team.losses}</td>}
              {!isMobile && <td style={{ ...styles.td, textAlign: 'center', color: 'var(--text-muted)' }}>{team.ties}</td>}
              <td style={{ ...styles.td, textAlign: 'right', fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 14 : 16 }}>{team.points_for.toFixed(1)}</td>
              {!isMobile && <td style={{ ...styles.td, textAlign: 'right', color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16 }}>{team.points_against.toFixed(1)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={styles.note}>Connect Yahoo in Studio to load live standings.</p>
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
};
