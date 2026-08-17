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

const OWNERS = ['Jose', 'Giovanny', 'Eduardo', 'Kyle', 'Kevin', 'Cristian', 'Edwin', 'Oscar', 'Hihi', 'Bishoy', 'Pru', 'Mina'];

const ROUNDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];

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

// DRAFT_BOARD[owner][round] = array of owners whose picks they currently hold
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

export default function BHDraftBoard() {
  const mobile = useIsMobile();
  const CELL_W = mobile ? 28 : 88;
  const CELL_H = mobile ? 28 : 88;
  const OWNER_COL = mobile ? 44 : 80;

  return (
    <div style={styles.wrap}>
      <div style={styles.intro}>
        2025 B&H draft pick ownership. Each cell shows whose pick(s) an owner holds in that round. Rounds 15 &amp; 16 are locked keeper slots.
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
                  width: CELL_W, minWidth: CELL_W, maxWidth: CELL_W,
                  fontSize: mobile ? 8 : 10,
                  padding: mobile ? '4px 1px' : '10px 4px',
                  ...(r >= 15 ? styles.keeperTh : {}),
                }}>
                  <div>{mobile ? r : `Rd ${r}`}</div>
                  {r >= 15 && !mobile && <div style={styles.keeperLabel}>KEEPER</div>}
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
                  height: CELL_H,
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
                  const isKeeper = r >= 15;
                  return (
                    <td key={r} style={{
                      ...styles.td,
                      width: CELL_W, minWidth: CELL_W, maxWidth: CELL_W,
                      height: CELL_H,
                      padding: mobile ? '2px 2px' : '6px 5px',
                      background: isEmpty
                        ? (i % 2 === 0 ? 'var(--bg3)' : 'var(--bg2)')
                        : isKeeper
                          ? 'var(--red-dim)'
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
  legend: { display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 4, alignItems: 'center' },
  tableWrap: { overflowX: 'auto' },
  table: { borderCollapse: 'collapse', border: '1px solid var(--border)' },
  thOwner: {
    textAlign: 'left', padding: '8px 10px',
    color: '#ffffff', fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    fontSize: 10, borderBottom: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    position: 'sticky', left: 0,
    background: 'var(--bg2)', whiteSpace: 'nowrap',
  },
  th: {
    textAlign: 'center',
    color: '#ffffff', fontWeight: 600,
    borderBottom: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    background: 'var(--bg2)', letterSpacing: '0.04em',
  },
  keeperTh: { color: 'var(--text-muted)', background: 'var(--red-dim)' },
  keeperLabel: { fontSize: 8, color: 'var(--text-muted)', marginTop: 2 },
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
  empty: { color: 'var(--text-dim)', fontWeight: 300 },
};
