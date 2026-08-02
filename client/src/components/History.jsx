const HISTORY = {
  'beaners-husseins': {
    seasons: [
      {
        year: 2025,
        champion: { team: 'The Bijan Era', record: '11-3-0', points: '161.65 (Final)' },
        runnerUp: 'The Bowery',
        thirdPlace: 'Chase What Matters',
        url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2025',
      },
    ],
    records: [
      { label: 'Most points in a week', value: '190.45', holder: 'The Bijan Era (2025 Semi)' },
      { label: 'Championship score', value: '161.65', holder: 'The Bijan Era (2025)' },
      { label: 'Biggest blowout', value: '92.95 pts', holder: 'bichote vs Love Thy Nabers (2025 Semi)' },
      { label: 'Most wins in a season', value: '11-3', holder: 'The Bijan Era (2025)' },
    ],
  },
  'rebirth': {
    seasons: [
      {
        year: 2025,
        champion: { team: 'TBD', record: 'TBD', points: 'TBD' },
        runnerUp: 'TBD',
        thirdPlace: 'TBD',
        url: 'https://football.fantasysports.yahoo.com/2025/f1/127692',
      },
    ],
    records: [
      { label: 'Most points in a week', value: '—', holder: '—' },
      { label: 'Highest season score', value: '—', holder: '—' },
      { label: 'Biggest blowout', value: '—', holder: '—' },
      { label: 'Most wins in a season', value: '—', holder: '—' },
    ],
  },
  'gentlemens-league': {
    seasons: [
      {
        year: 2025,
        champion: { team: 'TBD', record: 'TBD', points: 'TBD' },
        runnerUp: 'TBD',
        thirdPlace: 'TBD',
        url: 'https://football.fantasysports.yahoo.com/2025/f1/917285',
      },
    ],
    records: [
      { label: 'Most points in a week', value: '—', holder: '—' },
      { label: 'Highest season score', value: '—', holder: '—' },
      { label: 'Biggest blowout', value: '—', holder: '—' },
      { label: 'Most wins in a season', value: '—', holder: '—' },
    ],
  },
  'shoot-the-shits': {
    seasons: [
      {
        year: 2025,
        champion: { team: 'TBD', record: 'TBD', points: 'TBD' },
        runnerUp: 'TBD',
        thirdPlace: 'TBD',
        url: 'https://football.fantasysports.yahoo.com/2025/f1/127687',
      },
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
          {data.seasons.map((s, i) => (
            <div key={i} style={styles.champCard}>
              <div style={styles.champBar} />
              <div style={styles.champYear}>{s.year}</div>
              <div style={styles.champName}>{s.champion.team}</div>
              <div style={styles.champMeta}>
                <span>{s.champion.record}</span>
                <span>{s.champion.points}</span>
              </div>
              <div style={styles.champPlaces}>
                <div style={styles.place}><span style={styles.placeLabel}>2nd</span>{s.runnerUp}</div>
                <div style={styles.place}><span style={styles.placeLabel}>3rd</span>{s.thirdPlace}</div>
              </div>
              <a href={s.url} target="_blank" rel="noreferrer" style={styles.viewLink}>View season →</a>
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
  champCard: { background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '20px', minWidth: 220, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 },
  champBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--red)' },
  champYear: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: 'var(--red)', letterSpacing: '0.1em' },
  champName: { fontSize: 15, fontWeight: 500, color: 'var(--text)' },
  champMeta: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#444' },
  champPlaces: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 },
  place: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' },
  placeLabel: { fontSize: 10, color: '#444', width: 24 },
  viewLink: { fontSize: 11, color: 'var(--red)', marginTop: 8, textDecoration: 'none' },
  recordsList: { display: 'flex', flexDirection: 'column', gap: 0 },
  record: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '0.5px solid var(--border)' },
  recordLabel: { fontSize: 12, color: 'var(--text-muted)' },
  recordRight: { display: 'flex', alignItems: 'center', gap: 12 },
  recordValue: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--text)' },
  recordHolder: { fontSize: 11, color: '#444' },
};