import { useState, useEffect } from 'react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const OWNERS = ['Jose', 'Cristian', 'Pru', 'Alexis', 'Ed', 'Hihi', 'Tello', 'Oscar', 'Gio', 'Vic', 'JJ', 'Julio'];

const ROUNDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];

const DRAFT_BOARD = {
  'Jose':     { 1:['Jose','JJ'], 2:[], 3:[], 4:['Gio','Ed'], 5:['JJ'], 6:[], 7:['Hihi'], 8:['Jose'], 9:['Jose'], 10:['Jose','Ed'], 11:['Jose'], 12:['Jose'], 13:['Jose'], 14:['Hihi'], 15:['Jose'], 16:['Jose'], 17:['Jose'] },
  'Cristian': { 1:['Cristian'], 2:['Cristian'], 3:['Cristian'], 4:['Cristian'], 5:['Cristian'], 6:['Cristian'], 7:['Cristian'], 8:['Cristian'], 9:['Cristian'], 10:['Cristian'], 11:['Cristian'], 12:['Cristian'], 13:['Cristian'], 14:['Cristian'], 15:['Cristian'], 16:['Cristian'], 17:['Cristian'] },
  'Pru':      { 1:['Pru'], 2:[], 3:[], 4:['Pru'], 5:['Pru','Tello'], 6:[], 7:['Pru'], 8:['Pru','Tello'], 9:['Pru'], 10:['Pru'], 11:['Pru'], 12:['Tello'], 13:['Pru'], 14:['Pru'], 15:['Pru'], 16:['Pru'], 17:['Pru','JJ'] },
  'Alexis':   { 1:['Julio','Vic'], 2:['Alexis','Julio'], 3:['Julio'], 4:['Alexis','JJ'], 5:['Alexis','Ed'], 6:['Alexis'], 7:['Alexis'], 8:['Ed'], 9:['Alexis'], 10:[], 11:['Vic'], 12:[], 13:['Alexis'], 14:['Alexis'], 15:['Alexis'], 16:[], 17:[] },
  'Ed':       { 1:['Ed'], 2:[], 3:['Ed'], 4:['Tello'], 5:[], 6:['Jose'], 7:['Ed','Jose'], 8:[], 9:['Ed'], 10:['JJ'], 11:['Alexis','Ed'], 12:['Ed','JJ'], 13:['Ed'], 14:['Ed'], 15:['Ed'], 16:['Alexis','Ed'], 17:['Ed'] },
  'Hihi':     { 1:['Hihi','Oscar','Gio'], 2:['Hihi','Vic'], 3:['Jose','Hihi','Oscar','Gio'], 4:[], 5:['Jose'], 6:['Hihi'], 7:[], 8:['Hihi'], 9:['Hihi'], 10:['Hihi'], 11:['Hihi'], 12:[], 13:['Hihi'], 14:[], 15:[], 16:[], 17:['Hihi'] },
  'Tello': { 1:['Tello'], 2:['Tello','JJ'], 3:['Pru','Tello'], 4:['Julio'], 5:['Gio'], 6:['Tello','Gio'], 7:[], 8:[], 9:['Tello'], 10:['Tello'], 11:['Tello'], 12:['Pru'], 13:['Tello'], 14:['Tello'], 15:['Tello'], 16:[], 17:[] },
  'Oscar':    { 1:[], 2:['Oscar'], 3:['JJ'], 4:['Hihi'], 5:['Oscar'], 6:['Oscar'], 7:['Oscar'], 8:['Oscar'], 9:['Oscar'], 10:['Oscar'], 11:['Oscar'], 12:['Hihi','Oscar'], 13:['Oscar'], 14:['Oscar'], 15:['Oscar'], 16:['Oscar'], 17:['Oscar'] },
  'Gio': { 1:[], 2:['Gio'], 3:[], 4:[], 5:[], 6:[], 7:['Gio'], 8:['Gio'], 9:['Gio'], 10:['Gio'], 11:['Gio'], 12:['Gio'], 13:['Gio'], 14:['Jose','Gio'], 15:['Hihi','Gio'], 16:['Hihi','Tello','Gio'], 17:['Tello','Gio'] },
  'Vic':  { 1:['Alexis'], 2:[], 3:['Alexis'], 4:['Vic'], 5:['Hihi','Vic'], 6:['Vic'], 7:['Vic'], 8:['Vic'], 9:['Vic'], 10:['Vic'], 11:[], 12:['Vic'], 13:['Vic'], 14:['Vic'], 15:['Vic','JJ'], 16:['Vic'], 17:['Vic'] },
  'JJ':       { 1:[], 2:['Pru','Ed','Jose'], 3:['Vic'], 4:['Oscar','Jose'], 5:['Julio'], 6:['Ed','JJ','Pru'], 7:['JJ'], 8:['Alexis','JJ'], 9:['JJ'], 10:[], 11:['JJ'], 12:[], 13:['JJ'], 14:['JJ'], 15:[], 16:[], 17:[] },
  'Julio':    { 1:[], 2:[], 3:[], 4:[], 5:[], 6:['Julio'], 7:['Tello','Julio'], 8:['Julio'], 9:['Julio'], 10:['Alexis','Julio'], 11:['Julio'], 12:['Alexis','Julio'], 13:['Julio'], 14:['Julio'], 15:['Julio'], 16:['JJ','Julio'], 17:['Alexis','Julio'] },
};

const OWNER_COLORS = {
  'Jose':     '#D64040',
  'Cristian': '#4a9a4a',
  'Pru':      '#5a8aba',
  'Alexis':   '#c8a832',
  'Ed':       '#cc55cc',
  'Hihi':     '#4aaaaa',
  'Tello': '#cc8833',
  'Oscar':    '#7aaa4a',
  'Gio': '#9a6acc',
  'Vic':  '#cc4477',
  'JJ':       '#9966cc',
  'Julio':    '#4acc88',
};

function PickBadge({ owner, mobile }) {
  const color = OWNER_COLORS[owner] || '#888';
  const label = mobile ? owner.slice(0, 3) : owner;
  return (
    <div style={{
      fontSize: mobile ? 6 : 9,
      padding: mobile ? '1px 2px' : '2px 5px',
      borderRadius: 2,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      background: `${color}20`,
      color: color,
      border: `1px solid ${color}55`,
      lineHeight: 1.4,
      textAlign: 'center',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {label}
    </div>
  );
}

export default function RebirthDraftBoard() {
  const mobile = useIsMobile();
  const CELL_WIDTH = mobile ? 28 : 88;
  const CELL_HEIGHT = mobile ? 28 : 88;
  const OWNER_COL = mobile ? 44 : 110;

  return (
    <div style={styles.wrap}>
      <div style={styles.intro}>
        2026 Rebirth draft pick ownership. Each cell shows whose pick(s) an owner holds in that round.
      </div>

      <div style={styles.legend}>
        {OWNERS.map(owner => (
          <span key={owner} style={{ fontSize: mobile ? 10 : 11, fontWeight: 600, color: OWNER_COLORS[owner] }}>
            {owner}
          </span>
        ))}
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.thOwner, minWidth: OWNER_COL, maxWidth: OWNER_COL }}>
                {mobile ? '' : 'Owner'}
              </th>
              {ROUNDS.map(r => (
                <th key={r} style={{
                  ...styles.th,
                  width: CELL_WIDTH, minWidth: CELL_WIDTH, maxWidth: CELL_WIDTH,
                  fontSize: mobile ? 8 : 10,
                  padding: mobile ? '4px 1px' : '10px 4px',
                }}>
                  {mobile ? r : `Rd ${r}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OWNERS.map((owner, i) => (
              <tr key={owner}>
                <td style={{
                  ...styles.tdOwner,
                  minWidth: OWNER_COL, maxWidth: OWNER_COL,
                  height: CELL_HEIGHT,
                  padding: mobile ? '0 4px' : '0 14px',
                  background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg2)',
                }}>
                  <div style={{ fontWeight: 600, fontSize: mobile ? 7 : 11, color: OWNER_COLORS[owner] || 'var(--text)' }}>
                    {mobile ? owner.slice(0, 4) : owner}
                  </div>
                </td>
                {ROUNDS.map(r => {
                  const picks = DRAFT_BOARD[owner][r] || [];
                  const isEmpty = picks.length === 0;
                  return (
                    <td key={r} style={{
                      ...styles.td,
                      width: CELL_WIDTH, minWidth: CELL_WIDTH, maxWidth: CELL_WIDTH,
                      height: CELL_HEIGHT,
                      padding: mobile ? '2px 2px' : '6px 5px',
                      background: isEmpty
                        ? (i % 2 === 0 ? 'var(--bg3)' : 'var(--bg2)')
                        : (i % 2 === 0 ? 'var(--bg)' : 'var(--bg2)'),
                    }}>
                      <div style={styles.cellContent}>
                        {isEmpty ? (
                          <span style={{ ...styles.empty, fontSize: mobile ? 10 : 16 }}>—</span>
                        ) : (
                          picks.map((p, j) => <PickBadge key={j} owner={p} mobile={mobile} />)
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
  legend: { display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 4, alignItems: 'center' },
  tableWrap: { overflowX: 'auto' },
  table: { borderCollapse: 'collapse', fontSize: 11, border: '1px solid var(--border)' },
  thOwner: {
    textAlign: 'left', padding: '8px 10px',
    color: 'var(--text)', fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    fontSize: 10, borderBottom: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    position: 'sticky', left: 0,
    background: 'var(--bg2)', minWidth: 80, whiteSpace: 'nowrap',
  },
  th: {
    textAlign: 'center', padding: '10px 4px',
    color: 'var(--text)', fontWeight: 600,
    fontSize: 10, borderBottom: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    background: 'var(--bg2)', letterSpacing: '0.04em',
  },
  tdOwner: {
    borderBottom: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    position: 'sticky', left: 0,
    whiteSpace: 'nowrap', verticalAlign: 'middle',
  },
  td: {
    borderBottom: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    textAlign: 'center', verticalAlign: 'middle',
  },
  cellContent: {
    display: 'flex', flexDirection: 'column', gap: 2,
    alignItems: 'stretch', justifyContent: 'center',
    width: '100%', height: '100%',
  },
  empty: { color: 'var(--text-dim)', fontSize: 16, fontWeight: 300 },
};
