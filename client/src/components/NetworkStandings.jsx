import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile';

const LEAGUES = [
  { id: 'beaners-husseins', name: "Beaners & Husseins" },
  { id: 'rebirth',          name: 'Rebirth' },
  { id: 'gentlemens-league', name: "Gentlemen's League" },
  { id: 'shoot-the-shits',  name: 'Shoot the Shits' },
];

function LeagueCard({ league }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/data/${league.id}/standings.json`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [league.id]);

  const hasData = data?.teams?.some(t => t.pf > 0);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <Link to={`/league/${league.id}`} style={styles.leagueName}>{league.name}</Link>
        {data && (
          <span style={styles.weekBadge}>
            {hasData ? `Wk ${data.week}` : 'Pre-season'}
          </span>
        )}
      </div>

      {loading && <div style={styles.cardEmpty}>Loading...</div>}
      {!loading && !data && <div style={styles.cardEmpty}>Unavailable</div>}
      {!loading && data && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: 24 }}>#</th>
              <th style={{ ...styles.th, textAlign: 'left' }}>Team</th>
              <th style={styles.th}>W-L</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>PF</th>
            </tr>
          </thead>
          <tbody>
            {data.teams.map((team, i) => (
              <tr key={team.name} style={i < data.teams.length - 1 ? styles.row : {}}>
                <td style={{ ...styles.td, color: 'var(--text-muted)', textAlign: 'center', fontSize: 11 }}>{team.rank}</td>
                <td style={{ ...styles.td, maxWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{team.name}</td>
                <td style={{ ...styles.td, textAlign: 'center', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{team.wins}-{team.losses}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, whiteSpace: 'nowrap' }}>
                  {hasData ? team.pf.toFixed(1) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Link to={`/league/${league.id}`} style={styles.viewLink}>View League →</Link>
    </div>
  );
}

export default function NetworkStandings() {
  const isMobile = useIsMobile();
  return (
    <section style={styles.wrap}>
      <div style={styles.sectionHeader}>
        <div style={styles.headerBar} />
        <span style={styles.headerLabel}>Network Standings</span>
      </div>
      <div style={{ ...styles.grid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {LEAGUES.map(l => <LeagueCard key={l.id} league={l} />)}
      </div>
    </section>
  );
}

const styles = {
  wrap: { marginTop: 48 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, position: 'relative', paddingTop: 8 },
  headerBar: { position: 'absolute', top: 0, left: 0, width: 32, height: 2, background: 'var(--red)' },
  headerLabel: { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', paddingTop: 12 },

  grid: { display: 'grid', gap: 16 },

  card: { background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  leagueName: { fontSize: 14, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' },
  weekBadge: { fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', border: '0.5px solid var(--border)', borderRadius: 4, padding: '2px 6px' },
  cardEmpty: { color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' },

  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th: { fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0 6px 8px', textAlign: 'center', fontWeight: 400, borderBottom: '0.5px solid var(--border)' },
  row: { borderBottom: '0.5px solid var(--border)' },
  td: { padding: '8px 6px', fontSize: 12, color: 'var(--text)' },

  viewLink: { fontSize: 11, color: 'var(--red)', textDecoration: 'none', alignSelf: 'flex-end', marginTop: 'auto' },
};
