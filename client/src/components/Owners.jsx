const OWNERS = [
  {
    name: 'Jose',
    championships: 3,
    years: {
      2025: 'bichote',
      2024: 'bichote',
      2023: 'bichote',
      2022: 'bichote',
      2021: 'fon',
      2020: 'fon',
      2019: 'dave & todd 🏆',
      2018: 'PAY 26',
      2017: 'BELLCOWS 🏆',
      2016: 'BellCow X X V I 🏆',
      2015: 'Godd Gurley',
      2014: "Booz'n and Cruz'n",
    },
  },
  {
    name: 'Cristian',
    championships: 2,
    years: {
      2025: 'Love Thy Nabers',
      2024: 'Breece Hallmighty 🙏',
      2023: "Breece's Pieces 🟡🟤🟤",
      2022: 'Williams-burg',
      2021: 'Najee By Nature 😈',
      2020: 'Pack Attack 🏆',
      2019: "Davante's Inferno",
      2018: 'Keenan and Kelce 🏆',
      2017: 'Keenan and Kelce',
      2016: '30 Seconds to Lamars',
      2015: 'Armed Rodgery',
      2014: 'Blount Force Trauma',
    },
  },
  {
    name: 'Bishoy',
    championships: 2,
    years: {
      2025: 'Nix-elodeon',
      2024: "We're not Worthy",
      2023: 'King Tuttchdown',
      2022: 'King Tuttchdown 🏆',
      2021: 'King Tuttchdown',
      2020: 'King Tuttchdown',
      2019: 'Baby Chark',
      2018: 'Bend It Like Beckham',
      2017: 'Bend It Like Beckham',
      2016: 'Bend it like Beckham',
      2015: 'Bend it like Beckham',
      2014: 'ARMY OF TWO 🏆',
    },
  },
  {
    name: 'Kevin Huertas',
    championships: 1,
    years: {
      2025: 'Howie RoseKev',
      2024: 'Uncle Lamb',
      2023: 'El Travador 🏆',
      2022: 'Rebuilding Season',
      2021: 'Metcaffinated',
      2020: '2021 Draft',
      2019: 'Lev da Jet',
      2018: 'To the Promise Land🙏',
      2017: "Ser' Cookzalot",
      2016: 'Rebuilding No More',
      2015: 'All on the Fitz',
      2014: 'CHAMPION',
    },
  },
  {
    name: 'Edwin',
    championships: 1,
    years: {
      2025: 'Olivas FC',
      2024: 'Olivas FC 🏆',
      2023: 'Olivas FC',
      2022: 'JT & the boys',
      2021: 'JT & the boys',
      2020: 'Magic Mike',
      2019: 'Magic Mike',
      2018: 'Magic Mike',
      2017: 'Jay-Train23',
      2016: 'RIP Marshawn',
      2015: 'Beast Mode Inc',
      2014: "Edwin's Team",
    },
  },
  {
    name: 'Alex Zarate',
    championships: 1,
    years: {
      2025: 'The Bijan Era 🏆',
      2024: 'Reek Havoc',
      2023: 'Reek Havoc',
      2022: 'Netflix and Hill',
      2021: 'Netflix and Hill',
      2020: "Rollin' with Mahomes",
      2019: 'All Mahomies',
      2018: 'Brown Out',
      2017: 'Brown God',
      2016: 'Brown God',
      2015: "Drinkin' Fortes",
      2014: 'Multiple Scorgasms',
    },
  },
  {
    name: 'Eduardo',
    championships: 1,
    years: {
      2025: 'Chase What Matters',
      2024: 'Chase What Matters',
      2023: 'Chase What Matters',
      2022: 'Russell & Flow',
      2021: 'Russell & Flow',
      2020: 'Russell & Flow',
      2019: 'Breezy-E',
      2018: 'The Shady Bunch',
      2017: 'The Shady Bunch',
      2016: 'The Shady Bunch',
      2015: 'The Shady Bunch 🏆',
      2014: 'SHOW ME YOUR TDs',
    },
  },
  {
    name: 'Mina',
    championships: 1,
    years: {
      2025: 'The Bowery',
      2024: 'The Bowery',
      2023: 'US Flight 1549',
      2022: 'Married to the Game 💍',
      2021: 'Allen Keys 🏆',
      2020: 'Chef Boyd I won',
      2019: 'Under New Management',
      2018: '—',
      2017: '—',
      2016: '—',
      2015: '—',
      2014: '—',
    },
  },
  {
    name: 'Oscar',
    championships: 0,
    years: {
      2025: 'Money O',
      2024: 'Money O',
      2023: 'Money O',
      2022: 'Money O',
      2021: 'Go Jose',
      2020: 'Money O',
      2019: 'Baby Chark',
      2018: 'ChilLn with Mahomes',
      2017: "Don't hit Aj's Green",
      2016: "Don't Hit AJ's Green",
      2015: 'Oscars team',
      2014: 'Charles IN Charge',
    },
  },
  {
    name: 'Kyle',
    championships: 0,
    years: {
      2025: 'Hit it til it Hurts',
      2024: 'The Cooper Bowl',
      2023: 'Cierra LaPorta 🧱',
      2022: 'KUPPLE of TDs',
      2021: 'KUPPLE of TDs',
      2020: "You're HELAIREOUS 😂",
      2019: 'HIT it til it ERTZ',
      2018: 'Wentzylvania',
      2017: 'Kyle Lopez',
      2016: 'WENTZylvania',
      2015: 'Fly Eagles Fly',
      2014: 'The Real Chip Shady',
    },
  },
  {
    name: 'Giovanny',
    championships: 0,
    years: {
      2025: 'An Underdog Story',
      2024: 'An Underdog Story',
      2023: 'Hunting Szn',
      2022: 'Hunting Szn',
      2021: 'Go Edwin',
      2020: 'My Fellow Kamaracans',
      2019: 'Freaky Zekey',
      2018: 'Hopkins University',
      2017: 'Jesus Take The Wheel',
      2016: 'Make AmeriCarr Great',
      2015: 'Zeusis Kelce',
      2014: 'Spitting Llamas',
    },
  },
  {
    name: 'Hihi',
    championships: 0,
    years: {
      2025: 'McConkey Kong',
      2024: 'McConkey Kong',
      2023: 'Obi-Wan-Mahomie',
      2022: "Herbert's Burgers",
      2021: 'PICKLE RICK',
      2020: 'PICKLE RICK',
      2019: 'PICKLE RICK',
      2018: 'PICKLE RICK',
      2017: 'PICKLE RICK',
      2016: 'Dix Out For Harambe',
      2015: 'Wobbuffete',
      2014: 'Squirtle Squad',
    },
  },
];

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014];

export default function Owners() {
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
                    <td key={y} style={{
                      ...styles.td,
                      ...(isChamp ? styles.tdChamp : {}),
                    }}>
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
  champBadge: {
    background: 'var(--bg2)',
    border: '0.5px solid var(--border)',
    borderRadius: 8,
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    minWidth: 100,
  },
  rings: { fontSize: 18 },
  champOwner: { fontSize: 13, fontWeight: 500, color: 'var(--text)' },
  champCount: { fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
  thOwner: {
    textAlign: 'left',
    padding: '8px 12px',
    color: 'var(--text-muted)',
    fontWeight: 400,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontSize: 10,
    borderBottom: '0.5px solid var(--border)',
    whiteSpace: 'nowrap',
    position: 'sticky',
    left: 0,
    background: 'var(--bg)',
  },
  th: {
    textAlign: 'center',
    padding: '8px 10px',
    color: 'var(--text-muted)',
    fontWeight: 400,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontSize: 10,
    borderBottom: '0.5px solid var(--border)',
    whiteSpace: 'nowrap',
  },
  rowEven: { background: 'var(--bg)' },
  rowOdd: { background: 'var(--bg2)' },
  tdOwner: {
    padding: '8px 12px',
    whiteSpace: 'nowrap',
    borderBottom: '0.5px solid var(--border)',
    position: 'sticky',
    left: 0,
    background: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  ownerName: { color: 'var(--text)', fontWeight: 500 },
  ringCount: { fontSize: 10, color: 'var(--red)' },
  td: {
    padding: '8px 10px',
    textAlign: 'center',
    borderBottom: '0.5px solid var(--border)',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  tdChamp: {
    color: 'var(--red)',
    fontWeight: 500,
  },
};