const KEEPERS = {
  'Alex Zarate': {
    2015: ['Antonio Brown', 'Matt Forte'],
    2016: ['Antonio Brown', 'Mike Evans'],
    2017: ['Antonio Brown', 'Mike Evans'],
    2018: ['Mike Evans', 'Antonio Brown'],
    2019: ['Tyreek Hill', 'Patrick Mahomes'],
    2020: ['Patrick Mahomes', 'Tyreek Hill'],
    2021: ['Tyreek Hill', 'Patrick Mahomes'],
    2022: ['Tyreek Hill', 'Mark Andrews'],
    2023: ['Tyreek Hill', 'Rhamondre Stevenson'],
    2024: ['Bijan Robinson', 'Tyreek Hill'],
    2025: ['Bijan Robinson', 'Nico Collins'],
  },
  'Jose': {
    2015: ['Le\'Veon Bell', 'Jordy Nelson'],
    2016: ['Le\'Veon Bell', 'Todd Gurley'],
    2017: ['Le\'Veon Bell', 'Todd Gurley'],
    2018: ['Le\'Veon Bell', 'Todd Gurley'],
    2019: ['David Johnson', 'Todd Gurley'],
    2020: ['Christian McCaffrey', 'Ezekiel Elliott'],
    2021: ['Christian McCaffrey', 'Ezekiel Elliott'],
    2022: ['Christian McCaffrey', 'Justin Jefferson'],
    2023: ['Justin Jefferson', 'Christian McCaffrey'],
    2024: ['Christian McCaffrey', 'Justin Jefferson'],
    2025: ['Christian McCaffrey', 'Justin Jefferson'],
  },
  'Cristian': {
    2015: ['Eddie Lacy', 'Aaron Rodgers'],
    2016: ['Lamar Miller', 'Eddie Lacy'],
    2017: ['Lamar Miller', 'T.Y. Hilton'],
    2018: ['Davante Adams', 'Keenan Allen'],
    2019: ['Davante Adams', 'Travis Kelce'],
    2020: ['Davante Adams', 'Travis Kelce'],
    2021: ['Davante Adams', 'Travis Kelce'],
    2022: ['Najee Harris', 'Davante Adams'],
    2023: ['Davante Adams', 'Jaylen Waddle'],
    2024: ['Davante Adams', 'Breece Hall'],
    2025: ['Malik Nabers', 'Trey McBride'],
  },
  'Bishoy': {
    2015: ['Adrian Peterson', 'Odell Beckham Jr.'],
    2016: ['Odell Beckham Jr.', 'Adrian Peterson'],
    2017: ['Ezekiel Elliott', 'Odell Beckham Jr.'],
    2018: ['Odell Beckham Jr.', 'Ezekiel Elliott'],
    2019: ['DeAndre Hopkins', 'Odell Beckham Jr.'],
    2020: ['Lamar Jackson', 'DeAndre Hopkins'],
    2021: ['DeAndre Hopkins', 'Amari Cooper'],
    2022: ['Stefon Diggs', 'Cam Akers'],
    2023: ['Stefon Diggs', 'Travis Etienne Jr.'],
    2024: ['De\'Von Achane', 'Travis Etienne Jr.'],
    2025: ['Bucky Irving', 'Drake London'],
  },
  'Kevin Huertas': {
    2015: ['C.J. Anderson', 'Demaryius Thomas'],
    2016: ['David Johnson', 'Allen Robinson'],
    2017: ['David Johnson', 'Brandin Cooks'],
    2018: ['David Johnson', 'Tyreek Hill'],
    2019: ['Le\'Veon Bell', 'Antonio Brown'],
    2020: ['Chris Godwin', 'Miles Sanders'],
    2021: ['DK Metcalf', 'Nick Chubb'],
    2022: ['Nick Chubb', 'CeeDee Lamb'],
    2023: ['Travis Kelce', 'CeeDee Lamb'],
    2024: ['Deebo Samuel', 'CeeDee Lamb'],
    2025: ['Lamar Jackson', 'CeeDee Lamb'],
  },
  'Edwin': {
    2015: ['Marshawn Lynch', 'T.Y. Hilton'],
    2016: ['Jamaal Charles', 'Mark Ingram II'],
    2017: ['Michael Thomas', 'Jay Ajayi'],
    2018: ['Leonard Fournette', 'Michael Thomas'],
    2019: ['Michael Thomas', 'Adam Thielen'],
    2020: ['Michael Thomas', 'Adam Thielen'],
    2021: ['Jonathan Taylor', 'Adam Thielen'],
    2022: ['Jonathan Taylor', 'Aaron Jones Sr.'],
    2023: ['A.J. Brown', 'Aaron Jones Sr.'],
    2024: ['Josh Jacobs', 'A.J. Brown'],
    2025: ['Brian Thomas Jr.', 'Josh Jacobs'],
  },
  'Eduardo': {
    2015: ['Julio Jones', 'LeSean McCoy'],
    2016: ['Julio Jones', 'LeSean McCoy'],
    2017: ['LeSean McCoy', 'Julio Jones'],
    2018: ['LeSean McCoy', 'Julio Jones'],
    2019: ['Saquon Barkley', 'Julio Jones'],
    2020: ['Saquon Barkley', 'Julio Jones'],
    2021: ['Saquon Barkley', 'Russell Wilson'],
    2022: ['Ja\'Marr Chase', 'Deebo Samuel'],
    2023: ['Ja\'Marr Chase', 'Jalen Hurts'],
    2024: ['Ja\'Marr Chase', 'Isiah Pacheco'],
    2025: ['Ja\'Marr Chase', 'Amon-Ra St. Brown'],
  },
  'Oscar': {
    2015: ['Jeremy Hill', 'Alshon Jeffery'],
    2016: ['A.J. Green', 'Alshon Jeffery'],
    2017: ['A.J. Green', 'Jordy Nelson'],
    2018: ['Kareem Hunt', 'Joe Mixon'],
    2019: ['Nick Chubb', 'Joe Mixon'],
    2020: ['Nick Chubb', 'Joe Mixon'],
    2021: ['Justin Jefferson', 'Calvin Ridley'],
    2022: ['Travis Kelce', 'Saquon Barkley'],
    2023: ['Saquon Barkley', 'Nick Chubb'],
    2024: ['Jonathan Taylor', 'Puka Nacua'],
    2025: ['Jonathan Taylor', 'Garrett Wilson'],
  },
  'Kyle': {
    2015: ['Jamaal Charles', 'Randall Cobb'],
    2016: ['Keenan Allen', 'Julian Edelman'],
    2017: ['DeMarco Murray', 'Melvin Gordon III'],
    2018: ['Melvin Gordon III', 'Devonta Freeman'],
    2019: ['JuJu Smith-Schuster', 'Melvin Gordon III'],
    2020: ['Kenyan Drake', 'Mike Evans'],
    2021: ['Clyde Edwards-Helaire', 'Keenan Allen'],
    2022: ['Cooper Kupp', 'Javonte Williams'],
    2023: ['Cooper Kupp', 'DeVonta Smith'],
    2024: ['Saquon Barkley', 'Cooper Kupp'],
    2025: ['Chase Brown', 'Saquon Barkley'],
  },
  'Giovanny': {
    2015: ['Calvin Johnson', 'DeMarco Murray'],
    2016: ['DeAndre Hopkins', 'Amari Cooper'],
    2017: ['DeAndre Hopkins', 'Amari Cooper'],
    2018: ['DeAndre Hopkins', 'Alvin Kamara'],
    2019: ['Alvin Kamara', 'Ezekiel Elliott'],
    2020: ['Alvin Kamara', 'Josh Jacobs'],
    2021: ['Alvin Kamara', 'A.J. Brown'],
    2022: ['Derrick Henry', 'Alvin Kamara'],
    2023: ['Derrick Henry', 'Josh Allen'],
    2024: ['Josh Allen', 'Drake London'],
    2025: ['Josh Allen', 'Derrick Henry'],
  },
  'Mina': {
    2019: ['Mike Evans', 'James Conner'],
    2020: ['Derrick Henry', 'Austin Ekeler'],
    2021: ['Derrick Henry', 'Austin Ekeler'],
    2022: ['Dalvin Cook', 'Austin Ekeler'],
    2023: ['Austin Ekeler', 'Garrett Wilson'],
    2024: ['Kyren Williams', 'Garrett Wilson'],
    2025: ['Puka Nacua', 'Brock Bowers'],
  },
  'Hihi': {
    2015: ['Andrew Luck', 'A.J. Green'],
    2016: ['Jordy Nelson', 'Brandon Marshall'],
    2017: ['Devonta Freeman', 'Aaron Rodgers'],
    2018: ['Christian McCaffrey', 'Dalvin Cook'],
    2019: ['Christian McCaffrey', 'Phillip Lindsay'],
    2020: ['Dalvin Cook', 'George Kittle'],
    2021: ['Dalvin Cook', 'Stefon Diggs'],
    2022: ['Joe Mixon', 'Mike Evans'],
    2023: ['Patrick Mahomes', 'Amon-Ra St. Brown'],
    2024: ['Amon-Ra St. Brown', 'Jahmyr Gibbs'],
    2025: ['Ladd McConkey', 'Jahmyr Gibbs'],
  },
};

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

const OWNER_ORDER = [
  'Jose', 'Cristian', 'Bishoy', 'Kevin Huertas', 'Edwin',
  'Alex Zarate', 'Eduardo', 'Oscar', 'Kyle', 'Giovanny', 'Mina', 'Hihi'
];

export default function Keepers({ leagueId }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.intro}>
        Each owner keeps 2 players per season. Keepers are slotted at the end of the draft.
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
            {OWNER_ORDER.map((owner, i) => {
              const data = KEEPERS[owner];
              return (
                <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.tdOwner}>{owner}</td>
                  {YEARS.map(y => {
                    const picks = data[y];
                    return (
                      <td key={y} style={styles.td}>
                        {picks ? (
                          <div style={styles.pickCell}>
                            <span style={styles.pick}>{picks[0]}</span>
                            <span style={styles.pick}>{picks[1]}</span>
                          </div>
                        ) : (
                          <span style={styles.na}>—</span>
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
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  intro: { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' },
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
    minWidth: 120,
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
    minWidth: 140,
  },
  rowEven: { background: 'var(--bg)' },
  rowOdd: { background: 'var(--bg2)' },
  tdOwner: {
    padding: '10px 12px',
    whiteSpace: 'nowrap',
    borderBottom: '0.5px solid var(--border)',
    position: 'sticky',
    left: 0,
    background: 'inherit',
    color: 'var(--text)',
    fontWeight: 500,
    fontSize: 12,
  },
  td: {
    padding: '6px 10px',
    borderBottom: '0.5px solid var(--border)',
    verticalAlign: 'top',
  },
  pickCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  pick: {
    color: 'var(--text-muted)',
    fontSize: 11,
    lineHeight: 1.3,
  },
  na: {
    color: '#333',
    fontSize: 11,
  },
};