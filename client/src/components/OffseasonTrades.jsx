const TRADES = {
  'beaners-husseins': [
    {
      id: 1,
      label: '2025 Off-Season',
      sides: [
        {
          from: 'An Underdog Story',
          fromOwner: 'Giovanny',
          to: 'bichote',
          toOwner: 'Jose',
          items: ["bichote's 1st round pick"],
        },
        {
          from: 'bichote',
          fromOwner: 'Jose',
          to: 'An Underdog Story',
          toOwner: 'Giovanny',
          items: ['12th round pick', 'Jonathan Taylor'],
        },
      ],
    },
    {
      id: 2,
      label: '2026 Off-Season',
      sides: [
        {
          from: 'Oscar',
          fromOwner: 'Oscar',
          to: 'Hihi',
          toOwner: 'Hihi',
          items: ["Kevin's 1st round pick", "Bishoy's 1st round pick", "Kevin's 2nd round pick"],
        },
        {
          from: 'Hihi',
          fromOwner: 'Hihi',
          to: 'Oscar',
          toOwner: 'Oscar',
          items: ["Hihi's 4th round pick", "Hihi's 7th round pick", "Hihi's 8th round pick", 'Jahmyr Gibbs'],
        },
      ],
    },
    {
      id: 3,
      label: '2026 Off-Season',
      sides: [
        {
          from: 'Oscar',
          fromOwner: 'Oscar',
          to: 'Pru',
          toOwner: 'Pru',
          items: ["Bishoy's 2nd round pick"],
        },
        {
          from: 'Pru',
          fromOwner: 'Pru',
          to: 'Oscar',
          toOwner: 'Oscar',
          items: ["Pru's 4th round pick", 'James Cook'],
        },
      ],
    },
  ],
  'rebirth': [
    {
      id: 1,
      label: '2026 Off-Season',
      sides: [
        {
          from: 'Alex Zarate',
          fromOwner: 'Alex Zarate',
          to: 'JJ',
          toOwner: 'JJ',
          items: ["Alex Zarate's 6th round pick"],
        },
        {
          from: 'JJ',
          fromOwner: 'JJ',
          to: 'Alex Zarate',
          toOwner: 'Alex Zarate',
          items: ["Jonathan's 8th round pick", 'Cam Skattebo'],
        },
      ],
    },
  ],
};

export default function OffseasonTrades({ leagueId }) {
  const trades = TRADES[leagueId] || [];

  return (
    <div style={styles.wrap}>
      <div style={styles.intro}>
        All off-season trades will be logged here as they are made. This page will be updated throughout the off-season.
      </div>

      {trades.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>—</div>
          <div style={styles.emptyText}>No trades yet</div>
          <div style={styles.emptySubtext}>Check back as the off-season progresses.</div>
        </div>
      ) : (
        <div style={styles.trades}>
          {trades.map(trade => (
            <div key={trade.id} style={styles.tradeCard}>
              <div style={styles.tradeLabel}>{trade.label}</div>
              <div style={styles.tradeSides}>
                {trade.sides.map((side, i) => (
                  <div key={i} style={styles.tradeSide}>
                    <div style={styles.sideHeader}>
                      <span style={styles.teamName}>{side.from}</span>
                      <span style={styles.ownerName}>{side.fromOwner}</span>
                      <span style={styles.arrow}>→</span>
                      <span style={styles.teamName}>{side.to}</span>
                      <span style={styles.ownerName}>{side.toOwner}</span>
                    </div>
                    <div style={styles.items}>
                      {side.items.map((item, j) => (
                        <div key={j} style={styles.item}>
                          <span style={styles.itemDot}>·</span>
                          {item}
                        </div>
                      ))}
                    </div>
                    {i < trade.sides.length - 1 && <div style={styles.divider} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 28 },
  intro: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    lineHeight: 1.6,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '60px 0',
    borderTop: '0.5px solid var(--border)',
  },
  emptyIcon: { fontSize: 28, color: 'var(--text-dim)', fontWeight: 300 },
  emptyText: { fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 },
  emptySubtext: { fontSize: 12, color: '#444' },
  trades: { display: 'flex', flexDirection: 'column', gap: 16 },
  tradeCard: {
    border: '0.5px solid var(--border)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tradeLabel: {
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    background: 'var(--surface)',
    padding: '8px 16px',
    borderBottom: '0.5px solid var(--border)',
  },
  tradeSides: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    gap: 0,
  },
  tradeSide: { display: 'flex', flexDirection: 'column', gap: 8 },
  sideHeader: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  teamName: { fontSize: 13, color: 'var(--text)', fontWeight: 500 },
  ownerName: { fontSize: 11, color: 'var(--text-muted)' },
  arrow: { fontSize: 13, color: 'var(--text-muted)', margin: '0 2px' },
  items: { display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 12 },
  item: { fontSize: 12, color: 'var(--text)', display: 'flex', gap: 8, alignItems: 'flex-start' },
  itemDot: { color: 'var(--red)', fontWeight: 700, flexShrink: 0 },
  divider: { height: '0.5px', background: 'var(--border)', margin: '12px 0' },
};
