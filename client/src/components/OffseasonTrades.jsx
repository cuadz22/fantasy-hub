export default function OffseasonTrades({ leagueId }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.intro}>
        All off-season trades will be logged here as they are made. This page will be updated throughout the off-season.
      </div>
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>—</div>
        <div style={styles.emptyText}>No trades yet</div>
        <div style={styles.emptySubtext}>Check back as the off-season progresses.</div>
      </div>
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
  emptyIcon: {
    fontSize: 28,
    color: 'var(--text-dim)',
    fontWeight: 300,
  },
  emptyText: {
    fontSize: 14,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#444',
  },
};