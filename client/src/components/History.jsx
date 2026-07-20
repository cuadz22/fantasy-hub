const HISTORY = {
  'beaners-husseins': {
    champions: [
      { year: 2024, team: 'TBD', manager: 'TBD', record: 'TBD', points: 'TBD' },
    ],
    records: [
      { label: 'Most points in a week', value: '—', holder: '—' },
      { label: 'Highest season score', value: '—', holder: '—' },
      { label: 'Biggest blowout', value: '—', holder: '—' },
      { label: 'Most wins in a season', value: '—', holder: '—' },
    ],
  },
  'rebirth': {
    champions: [
      { year: 2024, team: 'TBD', manager: 'TBD', record: 'TBD', points: 'TBD' },
    ],
    records: [
      { label: 'Most points in a week', value: '—', holder: '—' },
      { label: 'Highest season score', value: '—', holder: '—' },
      { label: 'Biggest blowout', value: '—', holder: '—' },
      { label: 'Most wins in a season', value: '—', holder: '—' },
    ],
  },
  'gentlemens-league': {
    champions: [
      { year: 2024, team: 'TBD', manager: 'TBD', record: 'TBD', points: 'TBD' },
    ],
    records: [
      { label: 'Most points in a week', value: '—', holder: '—' },
      { label: 'Highest season score', value: '—', holder: '—' },
      { label: 'Biggest blowout', value: '—', holder: '—' },
      { label: 'Most wins in a season', value: '—', holder: '—' },
    ],
  },
  'shoot-the-shits': {
    champions: [
      { year: 2024, team: 'TBD', manager: 'TBD', record: 'TBD', points: 'TBD' },
    ],
    records: [
      { label: 'Most points in a week', value: '—', holder: '—' },
      { label: 'Highest season score', value: '—', holder: '—' },
      { label: 'Biggest blowout', value: '—', holder: '—' },
      { label: 'Most wins in a season', value: '—', holder: '—' },
    ],
  },
};

export default function History({ leagueId }) {
  const data = HISTORY[leagueId];
  if (!data) return null;

  return (
    <div style={styles.wrap}>
      <div>
        <h2 style={styles.sectionTitle}>Champions</h2>
        <div style={styles.champGrid}>
          {data.champions.map((c, i) => (
            <div key={i} style={styles.champCard}>
              <div style={styles.champBar} />
              <div style={styles.champYear}>{c.year}</div>
              <div style={styles.champName}>{c.team}</div>
              <div style={styles.champManager}>{c.manager}</div>
              <div style={styles.champMeta}>
                <span>{c.record}</span>
                <span>{c.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 style={styles.sectionTitle}>All-time records</h2>
        <div style={styles.recordsList}>
          {data.records.map((r, i) => (
            <div key={i} style={styles.record}>
              <div style={styles.recordLabel}>{r.label}</div>
              <div style={styles.recordRight}>
                <span style={styles.recordValue}>{r.value}</span>
                <span style={styles.recordHolder}>{r.holder}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 36 },
  sectionTitle: { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16, fontWeight: 400 },
  champGrid: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  champCard: { background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '20px', minWidth: 180, position: 'relative', overflow: 'hidden' },
  champBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--red)' },
  champYear: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: 'var(--red)', letterSpacing: '0.1em', marginBottom: 6 },
  champName: { fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 2 },
  champManager: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 },
  champMeta: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#444' },
  recordsList: { display: 'flex', flexDirection: 'column', gap: 0 },
  record: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '0.5px solid var(--border)' },
  recordLabel: { fontSize: 12, color: 'var(--text-muted)' },
  recordRight: { display: 'flex', alignItems: 'center', gap: 12 },
  recordValue: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--text)' },
  recordHolder: { fontSize: 11, color: '#444' },
};
