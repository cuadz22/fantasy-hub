const HISTORY = {
  'beaners-husseins': {
    seasons: [
      { year: 2025, champion: { team: 'The Bijan Era', record: '11-3-0', points: '161.65 (Final)' }, runnerUp: 'The Bowery', thirdPlace: 'Chase What Matters', url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2025' },
      { year: 2024, champion: { team: 'Olivas FC', record: '5-seed', points: '155.30 (Final)' }, runnerUp: 'The Bowery', thirdPlace: 'Money O', url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2024' },
      { year: 2023, champion: { team: 'El Travador', record: '1-seed', points: '162.85 (Final)' }, runnerUp: 'bichote', thirdPlace: 'Reek Havoc', url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2023' },
      { year: 2022, champion: { team: 'King Tuttchdown', record: '6-seed', points: '118.50 (Final)' }, runnerUp: 'Hunting Szn', thirdPlace: 'Married to the Game 💍', url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2022' },
      { year: 2021, champion: { team: 'Allen Keys', record: '1-seed', points: '147.50 (Final)' }, runnerUp: 'fon', thirdPlace: 'KUPPLE of TDs', url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2021' },
      { year: 2020, champion: { team: 'Pack Attack', record: '—', points: '—' }, runnerUp: "Rollin' with Mahomes", thirdPlace: 'My Fellow Kamaracans', url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2020' },
      { year: 2019, champion: { team: 'dave & todd', record: '—', points: '—' }, runnerUp: 'Baby Chark', thirdPlace: 'PICKLE RICK', url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2019' },
      { year: 2018, champion: { team: 'Keenan and Kelce', record: '—', points: '—' }, runnerUp: 'The Shady Bunch', thirdPlace: 'To the Promise Land🙏', url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2018' },
      { year: 2017, champion: { team: 'BELLCOWS', record: '—', points: '—' }, runnerUp: 'Kyle Lopez', thirdPlace: 'Jesus Take The Wheel', url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2017' },
      { year: 2016, champion: { team: 'BellCow X X V I', record: '—', points: '—' }, runnerUp: 'The Shady Bunch', thirdPlace: "Don't Hit AJ's Green", url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2016' },
      { year: 2015, champion: { team: 'The Shady Bunch', record: '—', points: '—' }, runnerUp: "Drinkin' Fortes", thirdPlace: 'All on the Fitz', url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2015' },
      { year: 2014, champion: { team: 'ARMY OF TWO', record: '—', points: '—' }, runnerUp: 'Charles IN Charge', thirdPlace: "Booz'n and Cruz'n", url: 'https://football.fantasysports.yahoo.com/league/beanershussein/2014' },
    ],
    records: [
      { label: 'Most points in a game', value: '209.50', holder: 'Allen Keys (2021 Semi)' },
      { label: 'Championship score', value: '162.85', holder: 'El Travador (2023)' },
      { label: 'Biggest upset', value: '6-seed wins', holder: 'King Tuttchdown (2022)' },
      { label: 'Most championships', value: '1 each', holder: '11 different winners in 12 seasons' },
    ],
  },
  'rebirth': {
    seasons: [
      { year: 2025, champion: { team: 'Nacua Matata', record: '8-6-0', points: '2221.70 pts' }, runnerUp: 'Rents Due', thirdPlace: 'bichote', url: 'https://football.fantasysports.yahoo.com/2025/f1/127692' },
    ],
    records: [
      { label: 'Most points scored', value: '2337.14', holder: 'bichote (2025)' },
      { label: 'Best record', value: '11-3', holder: 'Stiff Arm That Njigba (2025)' },
      { label: 'Points against', value: '2364.50', holder: 'LaPorta Potty (2025)' },
      { label: 'Champion', value: 'Nacua Matata', holder: '2025 Season' },
    ],
  },
  'gentlemens-league': {
    seasons: [
      { year: 2025, champion: { team: 'Sir', record: '12-2-0', points: '169.95 (Final)' }, runnerUp: 'Mr. Electricity', thirdPlace: 'Bo Meets World ⚡️', url: 'https://football.fantasysports.yahoo.com/2025/f1/127687' },
    ],
    records: [
      { label: 'Most points in a game', value: '232.00', holder: 'Bo Meets World ⚡️ (2025 QF)' },
      { label: 'Semi score', value: '179.50', holder: 'Sir (2025 Semi)' },
      { label: 'Best regular season', value: '12-2', holder: 'Sir (2025)' },
      { label: 'Championship score', value: '169.95', holder: 'Sir (2025)' },
    ],
  },
  'shoot-the-shits': {
    seasons: [
      { year: 2025, champion: { team: 'Baba Yaga', record: '11-3-0', points: '176.50 (Final)' }, runnerUp: 'Chase Jam', thirdPlace: 'CDiss Golden Pears', url: 'https://football.fantasysports.yahoo.com/2025/f1/917285' },
    ],
    records: [
      { label: 'Most points in a game', value: '239.95', holder: 'Baba Yaga (2025 Semi)' },
      { label: 'Highest QF score', value: '204.85', holder: 'CDiss Golden Pears (2025)' },
      { label: 'Best regular season', value: '11-3', holder: 'Baba Yaga (2025)' },
      { label: 'Championship score', value: '176.50', holder: 'Baba Yaga (2025)' },
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