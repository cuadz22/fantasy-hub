const OWNERS = [
  { id: 'bichote', team: 'bichote',            owner: 'Jose',     abbr: 'BCH' },
  { id: 'aus',     team: 'An Underdog Story',   owner: 'Giovanny', abbr: 'AUS' },
  { id: 'cwm',     team: 'Chase What Matters',  owner: 'Eduardo',  abbr: 'CWM' },
  { id: 'hitiih',  team: 'Hit it til it Hurts', owner: 'Kyle',     abbr: 'HIT' },
  { id: 'hrk',     team: 'Howie RoseKev',       owner: 'Kevin',    abbr: 'HRK' },
  { id: 'ltn',     team: 'Love Thy Nabers',     owner: 'Cristian', abbr: 'LTN' },
  { id: 'ofc',     team: 'Olivas FC',           owner: 'Edwin',    abbr: 'OFC' },
  { id: 'mo',      team: 'Money O',             owner: 'Oscar',    abbr: 'MO'  },
  { id: 'mck',     team: 'McConkey Kong',       owner: 'Hihi',     abbr: 'MCK' },
  { id: 'nix',     team: 'Nix-elodeon',         owner: 'Bishoy',   abbr: 'NIX' },
  { id: 'tbe',     team: 'The Bijan Era',       owner: 'Pru',      abbr: 'TBE' },
  { id: 'bow',     team: 'The Bowery',          owner: 'Mina',     abbr: 'BOW' },
];

const COLORS = {
  bichote: '#E63946',
  aus:     '#3A86FF',
  cwm:     '#2EC4B6',
  hitiih:  '#FFBE0B',
  hrk:     '#FF6B6B',
  ltn:     '#95D5B2',
  ofc:     '#9B5DE5',
  mo:      '#06D6A0',
  mck:     '#118AB2',
  nix:     '#F77F00',
  tbe:     '#4CC9F0',
  bow:     '#C77DFF',
};

// DRAFT_BOARD[originalOwnerID][round] = ID of team currently holding that pick
const DRAFT_BOARD = {
  bichote: { 1:'bichote', 2:'bichote', 3:'bichote', 4:'bichote', 5:'aus',     6:'bichote', 7:'bichote', 8:'bichote', 9:'bichote', 10:'bichote', 11:'bichote', 12:'aus',     13:'bichote', 14:'bichote', 15:'bichote', 16:'bichote' },
  aus:     { 1:'aus',     2:'aus',     3:'aus',     4:'aus',     5:'aus',     6:'aus',     7:'bichote', 8:'bichote', 9:'aus',     10:'aus',     11:'aus',     12:'aus',     13:'aus',     14:'aus',     15:'aus',     16:'aus'     },
  cwm:     { 1:'cwm',    2:'cwm',     3:'cwm',     4:'ofc',     5:'cwm',     6:'cwm',     7:'cwm',     8:'cwm',     9:'cwm',     10:'cwm',     11:'cwm',     12:'cwm',     13:'cwm',     14:'cwm',     15:'cwm',     16:'cwm'     },
  hitiih:  { 1:'hitiih', 2:'hitiih',  3:'hitiih',  4:'hitiih',  5:'hitiih',  6:'hitiih',  7:'hitiih',  8:'hitiih',  9:'hitiih',  10:'hitiih',  11:'hitiih',  12:'hitiih',  13:'hitiih',  14:'hitiih',  15:'hitiih',  16:'hitiih'  },
  hrk:     { 1:'mo',     2:'mo',      3:'hrk',     4:'hrk',     5:'mo',      6:'hrk',     7:'hrk',     8:'hrk',     9:'hrk',     10:'hrk',     11:'hrk',     12:'hrk',     13:'hrk',     14:'hrk',     15:'hrk',     16:'hrk'     },
  ltn:     { 1:'ltn',    2:'ltn',     3:'ltn',     4:'ltn',     5:'ltn',     6:'ltn',     7:'ltn',     8:'ltn',     9:'ltn',     10:'ltn',     11:'ltn',     12:'ltn',     13:'ltn',     14:'ltn',     15:'ltn',     16:'ltn'     },
  ofc:     { 1:'ofc',    2:'ofc',     3:'ofc',     4:'ofc',     5:'ofc',     6:'ofc',     7:'ofc',     8:'ofc',     9:'ofc',     10:'ofc',     11:'ofc',     12:'ofc',     13:'cwm',     14:'ofc',     15:'ofc',     16:'ofc'     },
  mo:      { 1:'mo',     2:'mo',      3:'nix',     4:'mo',      5:'hrk',     6:'hrk',     7:'mo',      8:'nix',     9:'mo',      10:'hrk',     11:'tbe',     12:'mo',      13:'mo',      14:'mo',      15:'mo',      16:'mo'      },
  mck:     { 1:'mck',    2:'mck',     3:'mck',     4:'mck',     5:'mck',     6:'mck',     7:'mck',     8:'mck',     9:'mck',     10:'mck',     11:'mck',     12:'mck',     13:'mck',     14:'mck',     15:'mck',     16:'mck'     },
  nix:     { 1:'mo',     2:'mo',      3:'nix',     4:'nix',     5:'nix',     6:'nix',     7:'nix',     8:'nix',     9:'nix',     10:'nix',     11:'nix',     12:'nix',     13:'nix',     14:'nix',     15:'nix',     16:'nix'     },
  tbe:     { 1:'tbe',    2:'tbe',     3:'tbe',     4:'tbe',     5:'tbe',     6:'mo',      7:'tbe',     8:'tbe',     9:'tbe',     10:'tbe',     11:'tbe',     12:'tbe',     13:'tbe',     14:'tbe',     15:'tbe',     16:'tbe'     },
  bow:     { 1:'bow',    2:'bow',     3:'bow',     4:'bow',     5:'bow',     6:'bow',     7:'bow',     8:'bow',     9:'bow',     10:'bow',     11:'bow',     12:'bow',     13:'bow',     14:'bow',     15:'bow',     16:'bow'     },
};

function PickCell({ holder, originalOwner, extras }) {
  const isOwn = holder === originalOwner;
  const holderColor = COLORS[holder] || '#666';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
      {/* Own pick: faded dot. Traded away: solid dot in holder's color */}
      <span style={{
        display: 'inline-block',
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: isOwn ? `${holderColor}44` : holderColor,
        flexShrink: 0,
      }} />
      {/* Extra picks this team holds in this round */}
      {extras.map(ownerId => {
        const c = COLORS[ownerId] || '#666';
        return (
          <span key={ownerId} style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: c,
            flexShrink: 0,
          }} />
        );
      })}
    </span>
  );
}

export default function BHDraftBoard() {
  const rounds = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];

  // For each round, track which OTHER original owners' picks each holder also owns
  const extraHeld = {};
  rounds.forEach(r => {
    extraHeld[r] = {};
    OWNERS.forEach(o => {
      const holder = DRAFT_BOARD[o.id][r];
      if (holder !== o.id) {
        if (!extraHeld[r][holder]) extraHeld[r][holder] = [];
        extraHeld[r][holder].push(o.id);
      }
    });
  });

  return (
    <div style={styles.wrap}>
      <div style={styles.note}>
        Each row shows where that team's picks currently live. A colored badge means the pick was traded to that team. Rounds 15 &amp; 16 are locked keeper slots — these picks cannot be traded under any circumstances.
      </div>

      <div style={styles.scrollWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, ...styles.stickyHeader }}>Team</th>
              {rounds.map(r => (
                <th key={r} style={{ ...styles.th, ...(r >= 15 ? styles.keeperTh : {}) }}>
                  <div>{r}</div>
                  {r >= 15 && <div style={styles.keeperLabel}>KEEPER</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OWNERS.map((o, i) => (
              <tr key={o.id}>
                <td style={{
                  ...styles.td,
                  ...styles.stickyCell,
                  background: i % 2 === 0 ? 'var(--surface)' : '#0f0f0f',
                }}>
                  <div style={styles.ownerCell}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[o.id], flexShrink: 0 }} />
                    <div style={styles.ownerName}>{o.owner}</div>
                  </div>
                </td>
                {rounds.map(r => (
                  <td key={r} style={{
                    ...styles.td,
                    background: r >= 15 ? '#0a0800' : (i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)'),
                  }}>
                    <PickCell
                      holder={DRAFT_BOARD[o.id][r]}
                      originalOwner={o.id}
                      extras={extraHeld[r][o.id] || []}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.legend}>
        {OWNERS.map(o => (
          <div key={o.id} style={styles.legendItem}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[o.id] }} />
            <span style={{ fontSize: 10, color: 'var(--text)', fontWeight: 600, letterSpacing: '0.04em' }}>{o.abbr}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{o.owner}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  note: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic' },
  scrollWrap: { overflowX: 'auto', border: '0.5px solid var(--border)', borderRadius: 6 },
  table: { borderCollapse: 'collapse', minWidth: 960 },
  th: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-muted)',
    padding: '8px 10px',
    textAlign: 'center',
    borderBottom: '0.5px solid var(--border)',
    background: 'var(--surface)',
    whiteSpace: 'nowrap',
  },
  stickyHeader: {
    position: 'sticky',
    left: 0,
    zIndex: 2,
    borderRight: '0.5px solid var(--border)',
    textAlign: 'left',
    paddingLeft: 14,
  },
  keeperTh: {
    color: '#aa8800',
    background: '#120e00',
  },
  keeperLabel: { fontSize: 8, color: '#aa8800', marginTop: 1 },
  td: {
    padding: '6px 8px',
    textAlign: 'center',
    borderBottom: '0.5px solid var(--border)',
    verticalAlign: 'middle',
  },
  stickyCell: {
    position: 'sticky',
    left: 0,
    zIndex: 1,
    borderRight: '0.5px solid var(--border)',
  },
  ownerCell: { display: 'flex', alignItems: 'center', gap: 9, padding: '2px 4px', minWidth: 100 },
  ownerName: { fontSize: 12, color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: '6px 18px', paddingTop: 14, borderTop: '0.5px solid var(--border)' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6 },
};
