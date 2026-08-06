const OWNERS = ['Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Ed', 'Hihi', 'Jonathan', 'Oscar', 'Giovanny', 'Big Vic', 'JJ', 'Julio'];

// Pick ownership per round (rounds 1-14 only — tradeable picks)
// Each array lists which owner owns each pick in that round
const DRAFT_BOARD = {
  1:  ['Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Alexis', 'Ed', 'Hihi', 'Hihi', 'Hihi', 'Jonathan', 'Big Vic', 'JJ'],
  2:  ['Jose', 'Cristian', 'Alexis', 'Alexis', 'Julio', 'Hihi', 'Hihi', 'Jonathan', 'Jonathan', 'Oscar', 'Giovanny', 'JJ', 'JJ'],
  3:  ['Cristian', 'Alexis', 'Alexis', 'Julio', 'Ed', 'Hihi', 'Hihi', 'Hihi', 'Hihi', 'Jonathan', 'Jonathan', 'JJ', 'JJ'],
  4:  ['Jose', 'Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Alexis', 'Ed', 'Ed', 'Julio', 'Jonathan', 'Oscar', 'Oscar', 'Big Vic'],
  5:  ['Cristian', 'Alex Zarate', 'Alexis', 'Alexis', 'Hihi', 'Jonathan', 'Jonathan', 'Oscar', 'Big Vic', 'Big Vic', 'JJ', 'JJ'],
  6:  ['Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Hihi', 'LaPorta→Hihi', 'Jonathan', 'Jonathan', 'Oscar', 'Big Vic', 'JJ', 'JJ', 'Julio'],
  7:  ['Jose', 'Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Ed', 'Oscar', 'Giovanny', 'Big Vic', 'JJ', 'Julio', 'Julio'],
  8:  ['Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Hihi', 'Oscar', 'Giovanny', 'Big Vic', 'JJ', 'JJ', 'JJ', 'Julio'],
  9:  ['Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Ed', 'Hihi', 'Jonathan', 'Oscar', 'Giovanny', 'Big Vic', 'JJ', 'Julio'],
  10: ['Jose', 'Cristian', 'Alex Zarate', 'Ed', 'Hihi', 'Jonathan', 'Jonathan', 'Oscar', 'Giovanny', 'Big Vic', 'Julio', 'Julio'],
  11: ['Jose', 'Cristian', 'Alex Zarate', 'Ed', 'Ed', 'Hihi', 'Jonathan', 'Oscar', 'Giovanny', 'Big Vic', 'JJ', 'Julio'],
  12: ['Jose', 'Cristian', 'Alex Zarate', 'Alex Zarate', 'Ed', 'Ed', 'Oscar', 'Oscar', 'Giovanny', 'Big Vic', 'Julio', 'Julio'],
  13: ['Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Ed', 'Hihi', 'Jonathan', 'Oscar', 'Giovanny', 'Big Vic', 'JJ', 'Julio'],
  14: ['Jose', 'Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Ed', 'Jonathan', 'Oscar', 'Giovanny', 'Giovanny', 'Big Vic', 'JJ', 'Julio'],
};

const OWNER_COLORS = {
  'Jose':       { bg: '#2a1a1a', text: '#D64040' },
  'Cristian':   { bg: '#1a2a1a', text: '#4a9a4a' },
  'Alex Zarate':{ bg: '#1a1a2a', text: '#4a7aaa' },
  'Alexis':     { bg: '#2a2a1a', text: '#aaaa4a' },
  'Ed':         { bg: '#2a1a2a', text: '#aa4aaa' },
  'Hihi':       { bg: '#1a2a2a', text: '#4aaaaa' },
  'Jonathan':   { bg: '#2a1f1a', text: '#aa7a4a' },
  'Oscar':      { bg: '#1f2a1a', text: '#7aaa4a' },
  'Giovanny':   { bg: '#1a1f2a', text: '#4a7aaa' },
  'Big Vic':    { bg: '#2a1a1f', text: '#aa4a7a' },
  'JJ':         { bg: '#1f1a2a', text: '#7a4aaa' },
  'Julio':      { bg: '#1f2a2a', text: '#4aaa7a' },
};

export default function RebirthDraftBoard() {
  return (
    <div style={styles.wrap}>
      <div style={styles.intro}>
        Draft pick ownership for the 2026 season. Rounds 15 & 16 are keeper rounds and cannot be traded. Only rounds 1–14 are shown.
      </div>

      <div style={styles.legend}>
        {OWNERS.map(owner => (
          <div key={owner} style={{
            ...styles.legendItem,
            background: OWNER_COLORS[owner]?.bg || '#1a1a1a',
            color: OWNER_COLORS[owner]?.text || '#888',
          }}>
            {owner}
          </div>
        ))}
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thRound}>Round</th>
              <th style={styles.thPicks}>Pick Ownership</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(DRAFT_BOARD).map(([round, picks], i) => (
              <tr key={round} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td style={styles.tdRound}>Rd {round}</td>
                <td style={styles.tdPicks}>
                  <div style={styles.picksRow}>
                    {picks.map((owner, j) => (
                      <div key={j} style={{
                        ...styles.pickBadge,
                        background: OWNER_COLORS[owner]?.bg || '#1a1a1a',
                        color: OWNER_COLORS[owner]?.text || '#888',
                        border: `0.5px solid ${OWNER_COLORS[owner]?.text || '#333'}33`,
                      }}>
                        {owner}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  intro: { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  legendItem: { fontSize: 11, padding: '4px 10px', borderRadius: 4, fontWeight: 500 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRound: { textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10, borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap', width: 60 },
  thPicks: { textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10, borderBottom: '0.5px solid var(--border)' },
  rowEven: { background: 'var(--bg)' },
  rowOdd: { background: 'var(--bg2)' },
  tdRound: { padding: '10px 12px', color: 'var(--red)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' },
  tdPicks: { padding: '8px 12px', borderBottom: '0.5px solid var(--border)' },
  picksRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  pickBadge: { fontSize: 11, padding: '3px 10px', borderRadius: 4, fontWeight: 500, whiteSpace: 'nowrap' },
};