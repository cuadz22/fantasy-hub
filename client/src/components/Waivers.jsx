import { useState, useEffect } from 'react';

const POS_COLORS = {
  QB: '#e53935', RB: '#1976d2', WR: '#388e3c', TE: '#f57c00',
  K: '#7b1fa2', DEF: '#455a64', D: '#455a64',
};

export default function Waivers({ leagueId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weekFilter, setWeekFilter] = useState('All');

  useEffect(() => {
    setLoading(true);
    fetch(`/data/${leagueId}/waivers.json`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [leagueId]);

  if (loading) return <div style={styles.empty}>Loading waivers...</div>;
  if (!data || !data.bids?.length) return (
    <div style={styles.empty}>
      No waiver activity yet — bids will appear here after the first Wednesday waiver run.
    </div>
  );

  const weeks = ['All', ...new Set(data.bids.map(b => `Week ${b.week}`))];
  const filtered = weekFilter === 'All' ? data.bids : data.bids.filter(b => `Week ${b.week}` === weekFilter);

  // Group by week
  const grouped = {};
  for (const b of filtered) {
    const key = `Week ${b.week}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <div style={styles.metaLabel}>Waiver Wire · Wednesday Bids</div>
        <div style={styles.filters}>
          {weeks.map(w => (
            <button
              key={w}
              onClick={() => setWeekFilter(w)}
              style={{ ...styles.filterBtn, ...(weekFilter === w ? styles.filterBtnActive : {}) }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {Object.entries(grouped).reverse().map(([week, bids]) => (
        <div key={week} style={styles.weekGroup}>
          <div style={styles.weekLabel}>{week}</div>
          <div style={styles.table}>
            <div style={styles.theader}>
              <div style={{ ...styles.col, ...styles.colBid }}>Bid</div>
              <div style={{ ...styles.col, ...styles.colPlayer }}>Player Added</div>
              <div style={{ ...styles.col, ...styles.colDrop }}>Dropped</div>
              <div style={{ ...styles.col, ...styles.colManager }}>Manager</div>
            </div>
            {bids.map((b, i) => (
              <div key={i} style={{ ...styles.row, ...(i % 2 === 0 ? styles.rowEven : {}) }}>
                <div style={{ ...styles.col, ...styles.colBid }}>
                  <span style={styles.bidAmt}>${b.bidAmount}</span>
                </div>
                <div style={{ ...styles.col, ...styles.colPlayer }}>
                  <span style={{ ...styles.posBadge, background: POS_COLORS[b.position] || '#555' }}>
                    {b.position}
                  </span>
                  <span style={styles.playerName}>{b.player}</span>
                  {b.team && <span style={styles.nflTeam}>{b.team}</span>}
                </div>
                <div style={{ ...styles.col, ...styles.colDrop }}>
                  {b.droppedPlayer
                    ? <span style={styles.dropped}>{b.droppedPlayer}</span>
                    : <span style={styles.noDropped}>—</span>}
                </div>
                <div style={{ ...styles.col, ...styles.colManager }}>
                  <span style={styles.manager}>{b.manager}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p style={styles.note}>Updated {data.updated}</p>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  empty: { color: 'var(--text-muted)', fontSize: 13, padding: '40px 0' },
  headerRow: { display: 'flex', flexDirection: 'column', gap: 10 },
  metaLabel: { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  filters: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn: { background: 'none', border: '0.5px solid var(--border)', borderRadius: 4, color: 'var(--text-muted)', fontSize: 11, padding: '4px 10px', cursor: 'pointer' },
  filterBtnActive: { background: 'var(--red)', borderColor: 'var(--red)', color: '#fff' },

  weekGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  weekLabel: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', opacity: 0.6 },

  table: { display: 'flex', flexDirection: 'column', borderRadius: 6, overflow: 'hidden', border: '0.5px solid var(--border)' },
  theader: { display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' },
  row: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '0.5px solid var(--border)' },
  rowEven: { background: 'rgba(255,255,255,0.015)' },

  col: { fontSize: 12, color: 'var(--text-muted)' },
  colBid: { width: 48, flexShrink: 0 },
  colPlayer: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 },
  colDrop: { width: 140, flexShrink: 0 },
  colManager: { width: 130, flexShrink: 0 },

  bidAmt: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: 'var(--red)', letterSpacing: '0.03em' },
  posBadge: { fontSize: 9, fontWeight: 700, color: '#fff', padding: '2px 5px', borderRadius: 3, flexShrink: 0 },
  playerName: { fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  nflTeam: { fontSize: 10, color: 'var(--text-muted)', opacity: 0.5, flexShrink: 0 },
  dropped: { fontSize: 11, color: 'var(--text-muted)' },
  noDropped: { fontSize: 11, color: 'var(--text-muted)', opacity: 0.4 },
  manager: { fontSize: 12, color: 'var(--text)' },
  note: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' },
};
