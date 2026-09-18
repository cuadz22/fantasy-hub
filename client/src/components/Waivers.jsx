import { useState, useEffect } from 'react';

const POS_COLORS = {
  QB: '#e53935', RB: '#1976d2', WR: '#388e3c', TE: '#f57c00',
  K: '#7b1fa2', DEF: '#455a64',
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
  if (!data || !data.waivers?.length) return (
    <div style={styles.empty}>
      No waiver activity yet — bids will appear here after the first Wednesday waiver run.
    </div>
  );

  const weeks = ['All', ...new Set(data.waivers.map(w => `Week ${w.week}`))];
  const filtered = weekFilter === 'All'
    ? data.waivers
    : data.waivers.filter(w => `Week ${w.week}` === weekFilter);

  // Group by week
  const grouped = {};
  for (const w of filtered) {
    const key = `Week ${w.week}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(w);
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <div style={styles.metaLabel}>Waiver Wire · FAAB Auctions</div>
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

      {Object.entries(grouped).reverse().map(([week, claims]) => (
        <div key={week} style={styles.weekGroup}>
          <div style={styles.weekLabel}>{week}</div>
          <div style={styles.claimList}>
            {claims.map((claim, ci) => (
              <div key={ci} style={styles.claimCard}>
                {/* Player header */}
                <div style={styles.playerHeader}>
                  <span style={{ ...styles.posBadge, background: POS_COLORS[claim.position] || '#555' }}>
                    {claim.position}
                  </span>
                  <span style={styles.playerName}>{claim.player}</span>
                  {claim.nflTeam && (
                    <span style={styles.nflTeam}>{claim.nflTeam}</span>
                  )}
                  <span style={styles.claimDate}>{claim.date}</span>
                </div>

                {/* Bid ladder */}
                <div style={styles.bidLadder}>
                  {claim.bids.map((bid, bi) => (
                    <div
                      key={bi}
                      style={{
                        ...styles.bidRow,
                        ...(bid.won ? styles.bidRowWon : {}),
                        ...(bi > 0 ? styles.bidRowBorder : {}),
                      }}
                    >
                      <span style={{ ...styles.bidAmt, ...(bid.won ? styles.bidAmtWon : styles.bidAmtLost) }}>
                        ${bid.amount}
                      </span>
                      <span style={{ ...styles.bidManager, ...(bid.won ? styles.bidManagerWon : {}) }}>
                        {bid.manager}
                      </span>
                      {bid.won && <span style={styles.wonBadge}>✓ WON</span>}
                    </div>
                  ))}
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

  weekGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  weekLabel: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', opacity: 0.6 },

  claimList: { display: 'flex', flexDirection: 'column', gap: 8 },

  claimCard: {
    border: '0.5px solid var(--border)',
    borderRadius: 8,
    overflow: 'hidden',
  },

  playerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: 'var(--surface)',
    borderBottom: '0.5px solid var(--border)',
  },
  posBadge: {
    fontSize: 9, fontWeight: 700, color: '#fff',
    padding: '2px 5px', borderRadius: 3, flexShrink: 0,
  },
  playerName: { fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1 },
  nflTeam: { fontSize: 11, color: 'var(--text-muted)', opacity: 0.5, flexShrink: 0 },
  claimDate: { fontSize: 11, color: 'var(--text-muted)', opacity: 0.5, flexShrink: 0, marginLeft: 4 },

  bidLadder: { display: 'flex', flexDirection: 'column' },

  bidRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 14px',
  },
  bidRowWon: { background: 'rgba(56, 142, 60, 0.06)' },
  bidRowBorder: { borderTop: '0.5px solid var(--border)' },

  bidAmt: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 17,
    letterSpacing: '0.03em',
    width: 44,
    flexShrink: 0,
    textAlign: 'right',
  },
  bidAmtWon: { color: '#4caf50' },
  bidAmtLost: { color: 'var(--text-muted)', opacity: 0.5 },

  bidManager: { fontSize: 12, color: 'var(--text-muted)', flex: 1 },
  bidManagerWon: { color: 'var(--text)', fontWeight: 500 },

  wonBadge: {
    fontSize: 9, fontWeight: 700, color: '#4caf50',
    letterSpacing: '0.08em', flexShrink: 0,
  },

  note: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' },
};
