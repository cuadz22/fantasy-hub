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

// Draft slot order (pick 1 through 12 in round 1)
const OWNERS = ['Vic', 'Gio', 'Oscar', 'Jose', 'Julio', 'Cristian', 'Hihi', 'JJ', 'Pru', 'Alexis', 'Ed', 'Tello'];
const ROUNDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
const NUM_TEAMS = OWNERS.length;

const OWNER_COLORS = {
  'Jose':     '#D64040',
  'Cristian': '#4a9a4a',
  'Pru':      '#5a8aba',
  'Alexis':   '#c8a832',
  'Ed':       '#cc55cc',
  'Hihi':     '#4aaaaa',
  'Tello':    '#cc8833',
  'Oscar':    '#7aaa4a',
  'Gio':      '#9a6acc',
  'Vic':      '#cc4477',
  'JJ':       '#9966cc',
  'Julio':    '#4acc88',
};

// Who each owner holds picks from, per round
const DRAFT_BOARD = {
  'Jose':     { 1:['Jose','JJ'], 2:[], 3:[], 4:['Gio','Ed'], 5:['JJ'], 6:[], 7:['Hihi'], 8:['Jose'], 9:['Jose'], 10:['Jose','Ed'], 11:['Jose'], 12:['Jose'], 13:['Jose'], 14:['Hihi'], 15:['Jose'], 16:['Jose'], 17:['Jose'] },
  'Cristian': { 1:['Cristian'], 2:['Cristian'], 3:['Cristian'], 4:['Cristian'], 5:['Cristian'], 6:['Cristian'], 7:['Cristian'], 8:['Cristian'], 9:['Cristian'], 10:['Cristian'], 11:['Cristian'], 12:['Cristian'], 13:['Cristian'], 14:['Cristian'], 15:['Cristian'], 16:['Cristian'], 17:['Cristian'] },
  'Pru':      { 1:['Pru'], 2:[], 3:[], 4:['Pru'], 5:['Pru','Tello'], 6:[], 7:['Pru'], 8:['Pru','Tello'], 9:['Pru'], 10:['Pru'], 11:['Pru'], 12:['Tello'], 13:['Pru'], 14:['Pru'], 15:['Pru'], 16:['Pru'], 17:['Pru','JJ'] },
  'Alexis':   { 1:['Julio','Vic'], 2:['Alexis','Julio'], 3:['Julio'], 4:['Alexis','JJ'], 5:['Alexis','Ed'], 6:['Alexis'], 7:['Alexis'], 8:['Ed'], 9:['Alexis'], 10:[], 11:['Vic'], 12:[], 13:['Alexis'], 14:['Alexis'], 15:['Alexis'], 16:[], 17:[] },
  'Ed':       { 1:['Ed'], 2:[], 3:['Ed'], 4:['Tello'], 5:[], 6:['Jose'], 7:['Ed','Jose'], 8:[], 9:['Ed'], 10:['JJ'], 11:['Alexis','Ed'], 12:['Ed','JJ'], 13:['Ed'], 14:['Ed'], 15:['Ed'], 16:['Alexis','Ed'], 17:['Ed'] },
  'Hihi':     { 1:['Hihi','Oscar','Gio'], 2:['Hihi','Vic'], 3:['Jose','Hihi','Oscar','Gio'], 4:[], 5:['Jose'], 6:['Hihi'], 7:[], 8:['Hihi'], 9:['Hihi'], 10:['Hihi'], 11:['Hihi'], 12:[], 13:['Hihi'], 14:[], 15:[], 16:[], 17:['Hihi'] },
  'Tello':    { 1:['Tello'], 2:['Tello','JJ'], 3:['Pru','Tello'], 4:['Julio'], 5:['Gio'], 6:['Tello','Gio'], 7:[], 8:[], 9:['Tello'], 10:['Tello'], 11:['Tello'], 12:['Pru'], 13:['Tello'], 14:['Tello'], 15:['Tello'], 16:[], 17:[] },
  'Oscar':    { 1:[], 2:['Oscar'], 3:['JJ'], 4:['Hihi'], 5:['Oscar'], 6:['Oscar'], 7:['Oscar'], 8:['Oscar'], 9:['Oscar'], 10:['Oscar'], 11:['Oscar'], 12:['Hihi','Oscar'], 13:['Oscar'], 14:['Oscar'], 15:['Oscar'], 16:['Oscar'], 17:['Oscar'] },
  'Gio':      { 1:[], 2:['Gio'], 3:[], 4:[], 5:[], 6:[], 7:['Gio'], 8:['Gio'], 9:['Gio'], 10:['Gio'], 11:['Gio'], 12:['Gio'], 13:['Gio'], 14:['Jose','Gio'], 15:['Hihi','Gio'], 16:['Hihi','Tello','Gio'], 17:['Tello','Gio'] },
  'Vic':      { 1:['Alexis'], 2:[], 3:['Alexis'], 4:['Vic'], 5:['Hihi','Vic'], 6:['Vic'], 7:['Vic'], 8:['Vic'], 9:['Vic'], 10:['Vic'], 11:[], 12:['Vic'], 13:['Vic'], 14:['Vic'], 15:['Vic','JJ'], 16:['Vic'], 17:['Vic'] },
  'JJ':       { 1:[], 2:['Pru','Ed','Jose'], 3:['Vic'], 4:['Oscar','Jose'], 5:['Julio'], 6:['Ed','JJ','Pru'], 7:['JJ'], 8:['Alexis','JJ'], 9:['JJ'], 10:[], 11:['JJ'], 12:[], 13:['JJ'], 14:['JJ'], 15:[], 16:[], 17:[] },
  'Julio':    { 1:[], 2:[], 3:[], 4:[], 5:[], 6:['Julio'], 7:['Tello','Julio'], 8:['Julio'], 9:['Julio'], 10:['Alexis','Julio'], 11:['Julio'], 12:['Alexis','Julio'], 13:['Julio'], 14:['Julio'], 15:['Julio'], 16:['JJ','Julio'], 17:['Alexis','Julio'] },
};

// Invert DRAFT_BOARD: for each round + slot, find who holds that pick
function buildPickGrid() {
  const grid = {};
  for (const round of ROUNDS) {
    grid[round] = {};
    for (const slotOwner of OWNERS) {
      let holder = null;
      for (const owner of OWNERS) {
        if ((DRAFT_BOARD[owner][round] || []).includes(slotOwner)) {
          holder = owner;
          break;
        }
      }
      grid[round][slotOwner] = holder;
    }
  }
  return grid;
}

const PICK_GRID = buildPickGrid();

// Overall pick number for a given round + slot index (0-based)
function pickNumber(round, slotIdx) {
  const base = (round - 1) * NUM_TEAMS;
  const isSnakeRight = round % 2 === 1; // odd rounds go left→right
  const pos = isSnakeRight ? slotIdx + 1 : NUM_TEAMS - slotIdx;
  return base + pos;
}

export default function RebirthPickBoard() {
  const mobile = useIsMobile();
  const CELL_H = mobile ? 36 : 60;
  const LABEL_W = mobile ? 24 : 44;

  return (
    <div style={styles.wrap}>
      <div style={styles.intro}>
        2026 Rebirth snake draft pick order. Each cell shows who is on the clock for that slot — accounting for all traded picks.
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
              <th style={{ ...styles.thRound, width: LABEL_W }}>
                {mobile ? '' : 'Rd'}
              </th>
              {OWNERS.map((owner, i) => (
                <th key={owner} style={{
                  ...styles.th,
                  fontSize: mobile ? 7 : 10,
                  padding: mobile ? '4px 2px' : '8px 4px',
                }}>
                  <div style={{ color: OWNER_COLORS[owner], fontWeight: 700 }}>
                    {mobile ? owner.slice(0, 3) : owner}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: mobile ? 6 : 9 }}>
                    Slot {i + 1}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROUNDS.map((r) => {
              const snakeRight = r % 2 === 1;
              return (
                <tr key={r}>
                  <td style={{
                    ...styles.tdRound,
                    width: LABEL_W,
                    height: CELL_H,
                    background: r % 2 === 1 ? 'var(--bg2)' : 'var(--bg)',
                  }}>
                    <div style={{ fontSize: mobile ? 9 : 12, fontWeight: 700, color: 'var(--text)' }}>
                      {mobile ? r : `Rd ${r}`}
                    </div>
                    <div style={{ fontSize: mobile ? 6 : 9, color: 'var(--text-muted)', marginTop: 2 }}>
                      {snakeRight ? '→' : '←'}
                    </div>
                  </td>
                  {OWNERS.map((slotOwner, i) => {
                    const holder = PICK_GRID[r][slotOwner];
                    const color = holder ? OWNER_COLORS[holder] : '#888';
                    const pickNum = pickNumber(r, i);
                    const isOwn = holder === slotOwner;
                    return (
                      <td key={slotOwner} style={{
                        ...styles.td,
                        height: CELL_H,
                        background: holder
                          ? `${color}18`
                          : (r % 2 === 1 ? 'var(--bg2)' : 'var(--bg)'),
                        borderLeft: `2px solid ${color}44`,
                      }}>
                        <div style={{ fontSize: mobile ? 6 : 8, color: 'var(--text-dim)', marginBottom: 2, lineHeight: 1 }}>
                          #{pickNum}
                        </div>
                        <div style={{
                          fontSize: mobile ? 8 : 11,
                          fontWeight: isOwn ? 500 : 700,
                          color: color,
                          lineHeight: 1.2,
                          textAlign: 'center',
                        }}>
                          {holder ? (mobile ? holder.slice(0, 3) : holder) : '—'}
                        </div>
                        {!isOwn && holder && !mobile && (
                          <div style={{ fontSize: 8, color: 'var(--text-dim)', marginTop: 2, lineHeight: 1 }}>
                            ({slotOwner}'s pick)
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  intro: { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 4, alignItems: 'center' },
  tableWrap: { width: '100%' },
  table: { borderCollapse: 'collapse', border: '1px solid var(--border)', width: '100%', tableLayout: 'fixed' },
  thRound: {
    textAlign: 'center',
    padding: '8px 4px',
    color: 'var(--text-muted)', fontWeight: 600,
    fontSize: 10, borderBottom: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    position: 'sticky', left: 0,
    background: 'var(--bg2)', whiteSpace: 'nowrap',
    letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  th: {
    textAlign: 'center',
    color: 'var(--text)', fontWeight: 600,
    borderBottom: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    background: 'var(--bg2)',
  },
  tdRound: {
    textAlign: 'center',
    borderBottom: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    position: 'sticky', left: 0,
    verticalAlign: 'middle',
    background: 'var(--bg2)',
  },
  td: {
    borderBottom: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    textAlign: 'center', verticalAlign: 'middle',
    padding: '4px 2px',
  },
};
