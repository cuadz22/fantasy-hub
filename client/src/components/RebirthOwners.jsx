const OWNERS = [
  {
    name: 'Alexis',
    championships: 2,
    years: {
      2025: 'Hooligans',
      2024: 'Hooligans 🏆',
      2023: 'Hooligans 🏆',
      2022: 'Hooligans',
      2021: 'Hooligans',
      2020: 'Hooligans',
      2019: 'Hooligans',
    },
  },
  {
    name: 'Oscar',
    championships: 2,
    years: {
      2025: 'Nacua Matata 🏆',
      2024: 'Nacua Matata',
      2023: 'Love story',
      2022: 'Hollywood',
      2021: 'Taylor Made 🏆',
      2020: 'Papi Juanch-O',
      2019: 'Tyreek & Destroy',
    },
  },
  {
    name: 'Cristian',
    championships: 1,
    years: {
      2025: 'Ashton 316 🍻🐍',
      2024: 'Amon Ra The Sun God ☀️',
      2023: 'Christian Mingle ✝️',
      2022: 'Spill the Tee 🌊🐸',
      2021: "Davante's Inferno 🔥",
      2020: 'Jujubes',
      2019: 'Shit Out of Luck 🏆',
    },
  },
  {
    name: 'Kevin Huertas',
    championships: 1,
    years: {
      2025: 'To Infinity and Bijan 🚀',
      2024: 'Business is Closed',
      2023: 'Bijan Mustardson',
      2022: 'ALLENTOWN',
      2021: "I'm tanking",
      2020: 'Tyreek & Destroy ✌️ 🏆',
      2019: 'Caff Daddy',
    },
  },
  {
    name: 'Hihi',
    championships: 1,
    years: {
      2025: 'LaPorta Potty',
      2024: 'LaPorta Potty 🏆',
      2023: 'High Speed Chase',
      2022: 'Raccoon City',
      2021: 'Goff Balls',
      2020: 'J Dalvin',
      2019: 'J Dalvin',
    },
  },
  {
    name: 'Jose',
    championships: 1,
    years: {
      2025: 'bichote',
      2024: 'CALL DREW',
      2023: 'LOS PITS',
      2022: '23 🏆',
      2021: '[IR]',
      2020: 'bottom feeders™',
      2019: 'seeing ghosts',
    },
  },
  {
    name: 'Giovanny',
    championships: 0,
    years: {
      2025: 'Rents Due',
      2024: 'Rents Due',
      2023: 'Calma',
      2022: 'God Did',
      2021: 'Beat Addie',
      2020: "I'm the Captain Now",
      2019: '—',
    },
  },
  {
    name: 'Jonathan',
    championships: 0,
    years: {
      2025: 'Manifested It',
      2024: 'Manifested It',
      2023: 'Young Gunnas',
      2022: "Who's Tanking?",
      2021: "Who's Tanking ?",
      2020: 'Sup Mahomes',
      2019: 'Saved by the Bell',
    },
  },
  {
    name: 'Alex Zarate',
    championships: 0,
    years: {
      2025: 'Buck You',
      2024: 'Henry Given Sunday',
      2023: 'Patty Cakes',
      2022: 'Tank',
      2021: 'View from LaMar',
      2020: 'Tank',
      2019: 'SaQuads',
    },
  },
  {
    name: 'JJ',
    championships: 0,
    years: {
      2025: 'Straight Outta Hampton',
      2024: 'Mosterts Inc.',
      2023: 'RussellMania',
      2022: 'Un Vaccaro Sin Ti',
      2021: '3 Days',
      2020: 'Donald Dak',
      2019: 'Mahomes Depot',
    },
  },
  {
    name: 'Ed',
    championships: 0,
    years: {
      2025: 'Killer Instinct',
      2024: 'No Limit Soldiers',
      2023: 'Soldier Fields',
      2022: 'Red Shirt Redemption',
      2021: 'Tanking Tanks',
      2020: '—',
      2019: '—',
    },
  },
  {
    name: 'Big Vic',
    championships: 0,
    years: {
      2025: 'Stiff Arm That Njigba',
      2024: '—',
      2023: '—',
      2022: '—',
      2021: '—',
      2020: '—',
      2019: '—',
    },
  },
];

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019];

export default function RebirthOwners() {
  return (
    <div style={styles.wrap}>
      <div style={styles.champRow}>
        {OWNERS.filter(o => o.championships > 0).map((o, i) => (
          <div key={i} style={styles.champBadge}>
            <div style={styles.rings}>{'🏆'.repeat(o.championships)}</div>
            <div style={styles.champOwner}>{o.name}</div>
            <div style={styles.champCount}>{o.championships} ring{o.championships > 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thOwner}>Owner</th>
              {YEARS.map(y => <th key={y} style={styles.th}>{y}</th>)}
            </tr>
          </thead>
          <tbody>
            {OWNERS.map((owner, i) => (
              <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td style={styles.tdOwner}>
                  <span style={styles.ownerName}>{owner.name}</span>
                  {owner.championships > 0 && (
                    <span style={styles.ringCount}>{owner.championships}🏆</span>
                  )}
                </td>
                {YEARS.map(y => {
                  const team = owner.years[y] || '—';
                  const isChamp = team.includes('🏆');
                  return (
                    <td key={y} style={{ ...styles.td, ...(isChamp ? styles.tdChamp : {}) }}>
                      {team}
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
  wrap: { display: 'flex', flexDirection: 'column', gap: 32 },
  champRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  champBadge: { background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '14px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 100 },
  rings: { fontSize: 18 },
  champOwner: { fontSize: 13, fontWeight: 500, color: 'var(--text)' },
  champCount: { fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
  thOwner: { textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10, borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'var(--bg)', minWidth: 120 },
  th: { textAlign: 'center', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10, borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap', minWidth: 160 },
  rowEven: { background: 'var(--bg)' },
  rowOdd: { background: 'var(--bg2)' },
  tdOwner: { padding: '8px 12px', whiteSpace: 'nowrap', borderBottom: '0.5px solid var(--border)', position: 'sticky', left: 0, background: 'inherit', display: 'flex', alignItems: 'center', gap: 8 },
  ownerName: { color: 'var(--text)', fontWeight: 500 },
  ringCount: { fontSize: 10, color: 'var(--red)' },
  td: { padding: '8px 10px', textAlign: 'center', borderBottom: '0.5px solid var(--border)', color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  tdChamp: { color: 'var(--red)', fontWeight: 500 },
};