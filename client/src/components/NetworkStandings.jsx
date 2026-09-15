import { useEffect, useState } from 'react';

const LEAGUES = [
  { id: 'beaners-husseins', short: 'B&H' },
  { id: 'rebirth',          short: 'RBT' },
  { id: 'gentlemens-league', short: 'GL' },
  { id: 'shoot-the-shits',  short: 'STS' },
];

export default function NetworkStandings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/data/network-owners.json').then(r => r.json()).catch(() => ({})),
      ...LEAGUES.map(l =>
        fetch(`/data/${l.id}/standings.json`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      ),
    ]).then(([ownerMap, ...standingsArr]) => {
      const ownerData = {};
      let maxWeek = 0;

      LEAGUES.forEach((league, i) => {
        const data = standingsArr[i];
        if (!data) return;
        if ((data.week || 0) > maxWeek) maxWeek = data.week;

        const map = ownerMap[league.id] || {};
        (data.teams || []).forEach(team => {
          const owner = map[team.name] || team.name;
          if (!ownerData[owner]) ownerData[owner] = { wins: 0, losses: 0, ties: 0, leagues: [] };
          ownerData[owner].wins   += team.wins   || 0;
          ownerData[owner].losses += team.losses || 0;
          ownerData[owner].ties   += team.ties   || 0;
          ownerData[owner].leagues.push({
            short: league.short,
            wins: team.wins   || 0,
            losses: team.losses || 0,
          });
        });
      });

      const sorted = Object.entries(ownerData)
        .map(([name, d]) => {
          const total = d.wins + d.losses + d.ties;
          const winPct = total > 0 ? (d.wins + d.ties * 0.5) / total : null;
          return { name, ...d, winPct };
        })
        .sort((a, b) => {
          if (a.winPct === null && b.winPct === null) return a.name.localeCompare(b.name);
          if (a.winPct === null) return 1;
          if (b.winPct === null) return -1;
          return b.winPct - a.winPct || b.wins - a.wins;
        });

      sorted.forEach((r, i) => { r.rank = i + 1; });
      setRows(sorted);
      setWeek(maxWeek);
      setLoading(false);
    });
  }, []);

  const hasData = rows.some(r => r.wins + r.losses + r.ties > 0);

  return (
    <section style={styles.wrap}>
      <div style={styles.header}>
        <div style={styles.bar} />
        <span style={styles.label}>Network Standings</span>
        {hasData && week > 0 && <span style={styles.badge}>Wk {week}</span>}
      </div>

      {loading && <div style={styles.empty}>Loading…</div>}

      {!loading && !hasData && (
        <div style={styles.empty}>
          Pre-season — combined standings will appear after Week 1.
        </div>
      )}

      {!loading && hasData && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 28 }}>#</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Manager</th>
                <th style={styles.th}>W–L</th>
                <th style={styles.th}>Win%</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Leagues</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.name} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={{ ...styles.td, color: 'var(--text-muted)', textAlign: 'center' }}>{row.rank}</td>
                  <td style={{ ...styles.td, fontWeight: 500, color: 'var(--text)' }}>{row.name}</td>
                  <td style={{ ...styles.td, textAlign: 'center', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {row.wins}–{row.losses}{row.ties > 0 ? `–${row.ties}` : ''}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                    {row.winPct !== null ? `${(row.winPct * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td style={{ ...styles.td }}>
                    <div style={styles.badges}>
                      {row.leagues.map(l => (
                        <span key={l.short} style={styles.leagueBadge}>{l.short}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const styles = {
  wrap: { marginTop: 48 },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, position: 'relative', paddingTop: 8 },
  bar: { position: 'absolute', top: 0, left: 0, width: 32, height: 2, background: 'var(--red)' },
  label: { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', paddingTop: 12 },
  badge: { fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', border: '0.5px solid var(--border)', borderRadius: 4, padding: '2px 6px', marginTop: 12 },
  empty: { color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { padding: '7px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 400, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap' },
  rowEven: { background: 'var(--bg)' },
  rowOdd: { background: 'var(--bg2)' },
  td: { padding: '8px 10px', borderBottom: '0.5px solid var(--border)', fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap' },
  badges: { display: 'flex', gap: 4 },
  leagueBadge: { fontSize: 9, color: 'var(--text-muted)', border: '0.5px solid var(--border)', borderRadius: 3, padding: '1px 5px', letterSpacing: '0.05em' },
};
