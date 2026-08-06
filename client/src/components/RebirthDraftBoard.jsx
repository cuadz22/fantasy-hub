const OWNERS = ['Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Ed', 'Hihi', 'Jonathan', 'Oscar', 'Giovanny', 'Big Vic', 'JJ', 'Julio'];

const ROUNDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];

const DRAFT_BOARD = {
  'Jose':        { 1:['Jose'], 2:['Jose'], 3:[], 4:['Giovanny'], 5:[], 6:['Jose'], 7:['Hihi'], 8:['Jose'], 9:['Jose'], 10:['Jose'], 11:['Jose'], 12:['Jose'], 13:['Jose'], 14:['Hihi'], 15:['Jose'], 16:['Jose'], 17:['Jose'] },
  'Cristian':    { 1:['Cristian'], 2:['Cristian'], 3:['Cristian'], 4:['Cristian'], 5:['Cristian'], 6:['Cristian'], 7:['Cristian'], 8:['Cristian'], 9:['Cristian'], 10:['Cristian'], 11:['Cristian'], 12:['Cristian'], 13:['Cristian'], 14:['Cristian'], 15:['Cristian'], 16:['Cristian'], 17:['Cristian'] },
  'Alex Zarate': { 1:['Alex Zarate'], 2:[], 3:[], 4:['Alex Zarate'], 5:['Alex Zarate'], 6:['Alex Zarate'], 7:['Alex Zarate'], 8:['Alex Zarate'], 9:['Alex Zarate'], 10:['Alex Zarate'], 11:['Alex Zarate'], 12:['Jonathan'], 13:['Alex Zarate'], 14:['Alex Zarate'], 15:['Alex Zarate'], 16:['Alex Zarate'], 17:['Alexis'] },
  'Alexis':      { 1:['Julio'], 2:['Julio'], 3:['Julio'], 4:['Julio'], 5:['Ed'], 6:['Alexis'], 7:['Alexis'], 8:['Ed'], 9:['Alexis'], 10:[], 11:[], 12:[], 13:['Alexis'], 14:['Alexis'], 15:['Alexis'], 16:[], 17:[] },
  'Ed':          { 1:['Ed'], 2:[], 3:['Ed'], 4:['Jonathan'], 5:[], 6:[], 7:['Ed'], 8:[], 9:['Ed'], 10:['JJ'], 11:['Alexis'], 12:['JJ'], 13:['Ed'], 14:['Ed'], 15:['Ed'], 16:['Alexis'], 17:['Ed'] },
  'Hihi':        { 1:['Oscar'], 2:[], 3:['Oscar'], 4:[], 5:['Jose'], 6:['Hihi'], 7:[], 8:['Hihi'], 9:['Hihi'], 10:['Hihi'], 11:['Hihi'], 12:[], 13:['Hihi'], 14:[], 15:['Giovanny'], 16:['Giovanny'], 17:['Hihi'] },
  'Jonathan':    { 1:['Jonathan'], 2:['JJ'], 3:['Alex Zarate'], 4:[], 5:['Giovanny'], 6:['Giovanny'], 7:[], 8:['Jonathan'], 9:['Jonathan'], 10:['Ed'], 11:['Jonathan'], 12:[], 13:['Jonathan'], 14:['Jonathan'], 15:['Jonathan'], 16:[], 17:[] },
  'Oscar':       { 1:[], 2:['Oscar'], 3:[], 4:['Hihi'], 5:['Oscar'], 6:['Oscar'], 7:['Oscar'], 8:['Oscar'], 9:['Oscar'], 10:['Oscar'], 11:['Oscar'], 12:['Hihi'], 13:['Oscar'], 14:['Oscar'], 15:['Oscar'], 16:['Oscar'], 17:['Oscar'] },
  'Giovanny':    { 1:[], 2:['Giovanny'], 3:[], 4:['Jose'], 5:[], 6:[], 7:['Giovanny'], 8:['Giovanny'], 9:['Giovanny'], 10:['Giovanny'], 11:['Giovanny'], 12:['Giovanny'], 13:['Giovanny'], 14:['Jose'], 15:['Hihi'], 16:['Jonathan'], 17:['Jonathan'] },
  'Big Vic':     { 1:['Big Vic'], 2:['Hihi'], 3:[], 4:['Big Vic'], 5:['Big Vic'], 6:['Big Vic'], 7:['Big Vic'], 8:['Big Vic'], 9:['Big Vic'], 10:['Big Vic'], 11:['Big Vic'], 12:['Big Vic'], 13:['Big Vic'], 14:['Big Vic'], 15:['JJ'], 16:['Big Vic'], 17:['Big Vic'] },
  'JJ':          { 1:['JJ'], 2:['Alex Zarate'], 3:['Big Vic'], 4:[], 5:['Giovanny'], 6:['Ed'], 7:['Jonathan'], 8:['Alexis'], 9:['JJ'], 10:[], 11:[], 12:[], 13:['JJ'], 14:['JJ'], 15:[], 16:[], 17:[] },
  'Julio':       { 1:[], 2:[], 3:[], 4:['Jonathan'], 5:['Giovanny'], 6:['Julio'], 7:['Jonathan'], 8:['Alexis'], 9:['Julio'], 10:['Alexis'], 11:['Julio'], 12:['Alexis'], 13:['Julio'], 14:['Julio'], 15:['Giovanny'], 16:['JJ'], 17:['Alexis'] },
};

const OWNER_COLORS = {
  'Jose':        { bg: '#2a1a1a', text: '#D64040', border: '#D6404044' },
  'Cristian':    { bg: '#1a2a1a', text: '#4a9a4a', border: '#4a9a4a44' },
  'Alex Zarate': { bg: '#1a1a2a', text: '#5a8aba', border: '#5a8aba44' },
  'Alexis':      { bg: '#2a2a1a', text: '#aaaa4a', border: '#aaaa4a44' },
  'Ed':          { bg: '#2a1a2a', text: '#aa4aaa', border: '#aa4aaa44' },
  'Hihi':        { bg: '#1a2a2a', text: '#4aaaaa', border: '#4aaaaa44' },
  'Jonathan':    { bg: '#2a1f1a', text: '#cc8833', border: '#cc883344' },
  'Oscar':       { bg: '#1f2a1a', text: '#7aaa4a', border: '#7aaa4a44' },
  'Giovanny':    { bg: '#221a2a', text: '#9a6acc', border: '#9a6acc44' },
  'Big Vic':     { bg: '#2a1a1f', text: '#cc4477', border: '#cc447744' },
  'JJ':          { bg: '#1f1a2a', text: '#7a4aaa', border: '#7a4aaa44' },
  'Julio':       { bg: '#1a2a22', text: '#4acc88', border: '#4acc8844' },
};

function PickBadge({ owner }) {
  const colors = OWNER_COLORS[owner] || { bg: '#1a1a1a', text: '#888', border: '#88888844' };
  return (
    <span style={{
      fontSize: 10,
      padding: '2px 6px',
      borderRadius: 3,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      background: colors.bg,
      color: colors.text,
      border: `0.5px solid ${colors.border}`,
      display: 'inline-block',
      lineHeight: 1.4,
    }}>
      {owner}
    </span>
  );
}

export default function RebirthDraftBoard() {
  return (
    <div style={styles.wrap}>
      <div style={styles.intro}>
        2026 Rebirth draft pick ownership. Rounds 15 & 16 are keeper rounds 🔒. All picks reflect offseason trades.
      </div>

      <div style={styles.legend}>
        {OWNERS.map(owner => <PickBadge key={owner} owner={owner} />)}
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thOwner}>Owner</th>
              {ROUNDS.map(r => (
                <th key={r} style={{
                  ...styles.th,
                  ...(r === 15 || r === 16 ? styles.thKeeper : {}),
                }}>
                  {r === 15 || r === 16 ? `R${r}🔒` : `R${r}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OWNERS.map((owner, i) => (
              <tr key={owner} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td style={styles.tdOwner}>
                  <PickBadge owner={owner} />
                </td>
                {ROUNDS.map(r => {
                  const picks = DRAFT_BOARD[owner][r] || [];
                  const isKeeper = r === 15 || r === 16;
                  return (
                    <td key={r} style={{
                      ...styles.td,
                      ...(isKeeper ? styles.tdKeeper : {}),
                    }}>
                      <div style={styles.cellContent}>
                        {picks.length === 0 ? (
                          <span style={styles.empty}>—</span>
                        ) : (
                          picks.map((p, j) => <PickBadge key={j} owner={p} />)
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  intro: { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  tableWrap: { overflowX: 'auto' },
  table: { borderCollapse: 'collapse', fontSize: 11 },
  thOwner: { textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 9, borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'var(--bg)', minWidth: 100 },
  th: { textAlign: 'center', padding: '8px 6px', color: 'var(--text-muted)', fontWeight: 400, fontSize: 10, borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap', minWidth: 90 },
  thKeeper: { color: '#D64040', background: '#1a1010' },
  rowEven: { background: 'var(--bg)' },
  rowOdd: { background: 'var(--bg2)' },
  tdOwner: { padding: '8px 12px', borderBottom: '0.5px solid var(--border)', position: 'sticky', left: 0, background: 'inherit', whiteSpace: 'nowrap' },
  td: { padding: '6px 8px', borderBottom: '0.5px solid var(--border)', textAlign: 'center', minWidth: 90, height: 44 },
  tdKeeper: { background: '#1a10104a' },
  cellContent: { display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', justifyContent: 'center', minHeight: 32 },
  empty: { color: '#333', fontSize: 11 },
};