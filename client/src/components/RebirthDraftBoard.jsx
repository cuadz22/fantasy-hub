const OWNERS = ['Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Ed', 'Hihi', 'Jonathan', 'Oscar', 'Giovanny', 'Big Vic', 'JJ', 'Julio'];

const ROUNDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];

// Each owner's row shows which picks they own per round
const DRAFT_BOARD = {
  'Jose':        { 1:['Jose'], 2:['Jose'], 3:[], 4:['Jose','Giovanny'], 5:[], 6:['Jose'], 7:['Jose','Hihi'], 8:['Jose'], 9:['Jose'], 10:['Jose'], 11:['Jose'], 12:['Jose'], 13:['Jose'], 14:['Hihi'], 15:['Jose'], 16:['Jose'], 17:['Jose'] },
  'Cristian':    { 1:['Cristian'], 2:['Cristian'], 3:['Cristian'], 4:['Cristian'], 5:['Cristian'], 6:['Cristian'], 7:['Cristian'], 8:['Cristian'], 9:['Cristian'], 10:['Cristian'], 11:['Cristian'], 12:['Cristian'], 13:['Cristian'], 14:['Cristian'], 15:['Cristian'], 16:['Cristian'], 17:['Cristian'] },
  'Alex Zarate': { 1:['Alex Zarate'], 2:[], 3:[], 4:['Alex Zarate'], 5:['Alex Zarate'], 6:['Alex Zarate'], 7:['Alex Zarate'], 8:['Alex Zarate'], 9:['Alex Zarate'], 10:['Alex Zarate'], 11:['Alex Zarate'], 12:['Alex Zarate','Jonathan'], 13:['Alex Zarate'], 14:['Alex Zarate'], 15:['Alex Zarate'], 16:['Alex Zarate'], 17:['Alex Zarate','JJ'] },
  'Alexis':      { 1:['Alexis','Julio'], 2:['Alexis','Julio'], 3:['Alexis','Julio'], 4:['Alexis','JJ'], 5:['Alexis','Ed'], 6:['Alexis'], 7:['Alexis'], 8:['Ed'], 9:['Alexis'], 10:[], 11:[], 12:[], 13:['Alexis'], 14:['Alexis'], 15:['Alexis'], 16:[], 17:[] },
  'Ed':          { 1:['Ed'], 2:[], 3:['Ed'], 4:['Ed','Jonathan'], 5:[], 6:[], 7:['Ed'], 8:[], 9:['Ed'], 10:['JJ'], 11:['Alexis','Ed'], 12:['Ed','JJ'], 13:['Ed'], 14:['Ed'], 15:['Ed'], 16:['Alexis','Ed'], 17:['Ed'] },
  'Hihi':        { 1:['Hihi','Oscar','Giovanny'], 2:['Hihi','Big Vic'], 3:['Jose','Hihi','Oscar','Giovanny'], 4:[], 5:['Jose'], 6:['Hihi'], 7:[], 8:['Hihi'], 9:['Hihi'], 10:['Hihi'], 11:['Hihi'], 12:[], 13:['Hihi'], 14:[], 15:[], 16:[], 17:['Hihi'] },
  'Jonathan':    { 1:['Jonathan'], 2:['Jonathan','JJ'], 3:['Alex Zarate','Jonathan'], 4:['Julio'], 5:['Jonathan','Giovanny'], 6:['Jonathan','Giovanny'], 7:[], 8:[], 9:['Jonathan'], 10:['Ed','Jonathan'], 11:['Jonathan'], 12:[], 13:['Jonathan'], 14:['Jonathan'], 15:['Jonathan'], 16:[], 17:[] },
  'Oscar':       { 1:[], 2:['Oscar'], 3:[], 4:['Hihi','Oscar'], 5:['Oscar'], 6:['Oscar'], 7:['Oscar'], 8:['Oscar'], 9:['Oscar'], 10:['Oscar'], 11:['Oscar'], 12:['Hihi','Oscar'], 13:['Oscar'], 14:['Oscar'], 15:['Oscar'], 16:['Oscar'], 17:['Oscar'] },
  'Giovanny':    { 1:[], 2:['Giovanny'], 3:[], 4:[], 5:[], 6:[], 7:['Giovanny'], 8:['Giovanny'], 9:['Giovanny'], 10:['Giovanny'], 11:['Giovanny'], 12:['Giovanny'], 13:['Giovanny'], 14:['Jose','Giovanny'], 15:['Hihi','Giovanny'], 16:['Hihi','Jonathan','Giovanny'], 17:['Jonathan','Giovanny'] },
  'Big Vic':     { 1:['Big Vic'], 2:[], 3:[], 4:['Big Vic'], 5:['Hihi','Big Vic'], 6:['Big Vic'], 7:['Big Vic'], 8:['Big Vic'], 9:['Big Vic'], 10:['Big Vic'], 11:['Big Vic'], 12:['Big Vic'], 13:['Big Vic'], 14:['Big Vic'], 15:['Big Vic','JJ'], 16:['Big Vic'], 17:['Big Vic'] },
  'JJ':          { 1:['JJ'], 2:['Alex Zarate','Ed'], 3:['Big Vic','JJ'], 4:[], 5:['JJ','Julio'], 6:['Ed','JJ'], 7:['JJ'], 8:['Alexis','Jonathan','JJ'], 9:['JJ'], 10:[], 11:['JJ'], 12:[], 13:['JJ'], 14:['JJ'], 15:[], 16:[], 17:[] },
  'Julio':       { 1:[], 2:[], 3:[], 4:[], 5:[], 6:['Julio'], 7:['Jonathan','Julio'], 8:['Julio'], 9:['Julio'], 10:['Alexis','Julio'], 11:['Julio'], 12:['Alexis','Julio'], 13:['Julio'], 14:['Julio'], 15:['Julio'], 16:['JJ','Julio'], 17:['Alexis','Julio'] },
};

const OWNER_COLORS = {
  'Jose':        '#D64040',
  'Cristian':    '#4a9a4a',
  'Alex Zarate': '#5a8aba',
  'Alexis':      '#c8a832',
  'Ed':          '#aa4aaa',
  'Hihi':        '#4aaaaa',
  'Jonathan':    '#cc8833',
  'Oscar':       '#7aaa4a',
  'Giovanny':    '#9a6acc',
  'Big Vic':     '#cc4477',
  'JJ':          '#7a4aaa',
  'Julio':       '#4acc88',
};

function PickBadge({ owner, isOwn }) {
  const color = OWNER_COLORS[owner] || '#888';
  return (
    <span style={{
      fontSize: 10,
      padding: '2px 7px',
      borderRadius: 3,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      background: isOwn ? `${color}22` : `${color}33`,
      color: color,
      border: `0.5px solid ${color}66`,
      display: 'inline-block',
      lineHeight: 1.5,
    }}>
      {owner}
    </span>
  );
}

export default function RebirthDraftBoard({ leagueId }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.intro}>
        2026 Rebirth draft pick ownership. Each cell shows whose pick(s) an owner holds in that round.
      </div>
      <div style={styles.legend}>
        {OWNERS.map(owner => <PickBadge key={owner} owner={owner} isOwn={false} />)}
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thOwner}>Owner</th>
              {ROUNDS.map(r => (
                <th key={r} style={styles.th}>R{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OWNERS.map((owner, i) => (
              <tr key={owner} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td style={styles.tdOwner}>
                  <PickBadge owner={owner} isOwn={true} />
                </td>
                {ROUNDS.map(r => {
                  const picks = DRAFT_BOARD[owner][r] || [];
                  return (
                    <td key={r} style={styles.td}>
                      <div style={styles.cellContent}>
                        {picks.length === 0 ? (
                          <span style={styles.empty}>—</span>
                        ) : (
                          picks.map((p, j) => (
                            <PickBadge key={j} owner={p} isOwn={p === owner} />
                          ))
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
  legend: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  tableWrap: { overflowX: 'auto' },
  table: { borderCollapse: 'collapse', fontSize: 11, width: '100%' },
  thOwner: {
    textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)',
    fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase',
    fontSize: 9, borderBottom: '0.5px solid var(--border)',
    position: 'sticky', left: 0, background: 'var(--bg)', minWidth: 110, whiteSpace: 'nowrap',
  },
  th: {
    textAlign: 'center', padding: '10px 4px', color: 'var(--text-muted)',
    fontWeight: 400, fontSize: 10, borderBottom: '0.5px solid var(--border)',
    whiteSpace: 'nowrap', minWidth: 80,
  },
  rowEven: { background: 'var(--bg)' },
  rowOdd: { background: 'var(--bg2)' },
  tdOwner: {
    padding: '8px 12px', borderBottom: '0.5px solid var(--border)',
    position: 'sticky', left: 0, background: 'inherit', whiteSpace: 'nowrap',
  },
  td: {
    padding: '6px 4px', borderBottom: '0.5px solid var(--border)',
    textAlign: 'center', minWidth: 80, height: 48,
  },
  cellContent: {
    display: 'flex', flexDirection: 'column', gap: 3,
    alignItems: 'center', justifyContent: 'center', minHeight: 36,
  },
  empty: { color: '#2a2a2a', fontSize: 13 },
};