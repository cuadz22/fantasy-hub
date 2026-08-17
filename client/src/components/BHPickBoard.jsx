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
const OWNERS = ['Kyle', 'Eduardo', 'Oscar', 'Jose', 'Bishoy', 'Pru', 'Hihi', 'Kevin', 'Cristian', 'Mina', 'Giovanny', 'Edwin'];
const ROUNDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
const NUM_TEAMS = OWNERS.length;

const OWNER_COLORS = {
  'Jose':     '#E63946',
  'Giovanny': '#3A86FF',
  'Eduardo':  '#2EC4B6',
  'Kyle':     '#FFBE0B',
  'Kevin':    '#FF6B6B',
  'Cristian': '#95D5B2',
  'Edwin':    '#9B5DE5',
  'Oscar':    '#06D6A0',
  'Hihi':     '#118AB2',
  'Bishoy':   '#F77F00',
  'Pru':      '#4CC9F0',
  'Mina':     '#C77DFF',
};

// Who each owner holds picks from, per round
const DRAFT_BOARD = {
  'Jose':     { 1:['Jose'], 2:['Jose'], 3:['Jose'], 4:['Jose'], 5:[], 6:['Jose'], 7:['Jose','Giovanny'], 8:['Jose','Giovanny'], 9:['Jose'], 10:['Jose'], 11:['Jose'], 12:[], 13:['Jose'], 14:['Jose'], 15:['Jose'], 16:['Jose'] },
  'Giovanny': { 1:['Giovanny'], 2:['Giovanny'], 3:['Giovanny'], 4:['Giovanny'], 5:['Giovanny','Jose'], 6:['Giovanny'], 7:[], 8:[], 9:['Giovanny'], 10:['Giovanny'], 11:['Giovanny'], 12:['Giovanny','Jose'], 13:['Giovanny'], 14:['Giovanny'], 15:['Giovanny'], 16:['Giovanny'] },
  'Eduardo':  { 1:['Eduardo'], 2:['Eduardo'], 3:['Eduardo'], 4:[], 5:['Eduardo'], 6:['Eduardo'], 7:['Eduardo'], 8:['Eduardo'], 9:['Eduardo'], 10:['Eduardo'], 11:['Eduardo'], 12:['Eduardo'], 13:['Eduardo','Edwin'], 14:['Eduardo'], 15:['Eduardo'], 16:['Eduardo'] },
  'Kyle':     { 1:['Kyle'], 2:['Kyle'], 3:['Kyle'], 4:['Kyle'], 5:['Kyle'], 6:['Kyle'], 7:['Kyle'], 8:['Kyle'], 9:['Kyle'], 10:['Kyle'], 11:['Kyle'], 12:['Kyle'], 13:['Kyle'], 14:['Kyle'], 15:['Kyle'], 16:['Kyle'] },
  'Kevin':    { 1:[], 2:[], 3:['Kevin'], 4:['Kevin'], 5:['Oscar'], 6:['Kevin','Oscar'], 7:['Kevin'], 8:['Kevin'], 9:['Kevin'], 10:['Kevin','Oscar'], 11:['Kevin'], 12:['Kevin'], 13:['Kevin'], 14:['Kevin'], 15:['Kevin'], 16:['Kevin'] },
  'Cristian': { 1:['Cristian'], 2:['Cristian'], 3:['Cristian'], 4:['Cristian'], 5:['Cristian'], 6:['Cristian'], 7:['Cristian'], 8:['Cristian'], 9:['Cristian'], 10:['Cristian'], 11:['Cristian'], 12:['Cristian'], 13:['Cristian'], 14:['Cristian'], 15:['Cristian'], 16:['Cristian'] },
  'Edwin':    { 1:['Edwin'], 2:['Edwin'], 3:['Edwin'], 4:['Edwin','Eduardo'], 5:['Edwin'], 6:['Edwin'], 7:['Edwin'], 8:['Edwin'], 9:['Edwin'], 10:['Edwin'], 11:['Edwin'], 12:['Edwin'], 13:[], 14:['Edwin'], 15:['Edwin'], 16:['Edwin'] },
  'Oscar':    { 1:['Oscar'], 2:['Oscar'], 3:[], 4:['Oscar','Hihi','Pru'], 5:['Kevin'], 6:['Pru'], 7:['Oscar','Hihi'], 8:['Hihi'], 9:['Oscar'], 10:[], 11:[], 12:['Oscar'], 13:['Oscar'], 14:['Oscar'], 15:['Oscar'], 16:['Oscar'] },
  'Hihi':     { 1:['Hihi','Kevin','Bishoy'], 2:['Hihi','Kevin'], 3:['Hihi'], 4:[], 5:['Hihi'], 6:['Hihi'], 7:[], 8:[], 9:['Hihi'], 10:['Hihi'], 11:['Hihi'], 12:['Hihi'], 13:['Hihi'], 14:['Hihi'], 15:['Hihi'], 16:['Hihi'] },
  'Bishoy':   { 1:[], 2:[], 3:['Bishoy','Oscar'], 4:['Bishoy'], 5:['Bishoy'], 6:['Bishoy'], 7:['Bishoy'], 8:['Bishoy','Oscar'], 9:['Bishoy'], 10:['Bishoy'], 11:['Bishoy'], 12:['Bishoy'], 13:['Bishoy'], 14:['Bishoy'], 15:['Bishoy'], 16:['Bishoy'] },
  'Pru':      { 1:['Pru'], 2:['Pru','Bishoy'], 3:['Pru'], 4:[], 5:['Pru'], 6:[], 7:['Pru'], 8:['Pru'], 9:['Pru'], 10:['Pru'], 11:['Pru','Oscar'], 12:['Pru'], 13:['Pru'], 14:['Pru'], 15:['Pru'], 16:['Pru'] },
  'Mina':     { 1:['Mina'], 2:['Mina'], 3:['Mina'], 4:['Mina'], 5:['Mina'], 6:['Mina'], 7:['Mina'], 8:['Mina'], 9:['Mina'], 10:['Mina'], 11:['Mina'], 12:['Mina'], 13:['Mina'], 14:['Mina'], 15:['Mina'], 16:['Mina'] },
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
  const isSnakeRight = round % 2 === 1;
  const pos = isSnakeRight ? slotIdx + 1 : NUM_TEAMS - slotIdx;
  return base + pos;
}

export default function BHPickBoard() {
  const mobile = useIsMobile();
  const CELL_H = mobile ? 36 : 60;
  const LABEL_W = mobile ? 24 : 44;

  return (
    <div style={styles.wrap}>
      <div style={styles.intro}>
        2025 B&amp;H snake draft pick order. Each cell shows who is on the clock for that slot — accounting for all traded picks. Rounds 15 &amp; 16 are keeper slots.
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
              const isKeeper = r >= 15;
              return (
                <tr key={r}>
                  <td style={{
                    ...styles.tdRound,
                    width: LABEL_W,
                    height: CELL_H,
                    background: isKeeper ? 'var(--red-dim)' : (r % 2 === 1 ? 'var(--bg2)' : 'var(--bg)'),
                  }}>
                    <div style={{ fontSize: mobile ? 9 : 12, fontWeight: 700, color: isKeeper ? 'var(--text-muted)' : 'var(--text)' }}>
                      {mobile ? r : `Rd ${r}`}
                    </div>
                    {!isKeeper && (
                      <div style={{ fontSize: mobile ? 6 : 9, color: 'var(--text-muted)', marginTop: 2 }}>
                        {snakeRight ? '→' : '←'}
                      </div>
                    )}
                    {isKeeper && !mobile && (
                      <div style={{ fontSize: 7, color: 'var(--text-muted)', marginTop: 2 }}>KPR</div>
                    )}
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
                        background: isKeeper
                          ? 'var(--red-dim)'
                          : holder
                            ? `${color}18`
                            : (r % 2 === 1 ? 'var(--bg2)' : 'var(--bg)'),
                        borderLeft: `2px solid ${isKeeper ? 'transparent' : color + '44'}`,
                      }}>
                        <div style={{ fontSize: mobile ? 6 : 8, color: 'var(--text-dim)', marginBottom: 2, lineHeight: 1 }}>
                          #{pickNum}
                        </div>
                        <div style={{
                          fontSize: mobile ? 8 : 11,
                          fontWeight: isOwn ? 500 : 700,
                          color: isKeeper ? 'var(--text-muted)' : color,
                          lineHeight: 1.2,
                          textAlign: 'center',
                        }}>
                          {holder ? (mobile ? holder.slice(0, 3) : holder) : '—'}
                        </div>
                        {!isOwn && holder && !mobile && !isKeeper && (
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
  },
  td: {
    borderBottom: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    textAlign: 'center', verticalAlign: 'middle',
    padding: '4px 2px',
  },
};
