const KEEPERS = {
  'Alexis': {
    2021: [
      { player: 'Kyler Murray', round: 3, year: 1 },
      { player: 'CeeDee Lamb', round: 9, year: 1 },
    ],
    2022: [
      { player: 'CeeDee Lamb', round: 5, year: 2 },
      { player: 'Mac Jones', round: 16, year: 1 },
    ],
    2023: [
      { player: 'CeeDee Lamb', round: 5, year: 3 },
      { player: 'Tony Pollard', round: 8, year: 1 },
    ],
    2024: [
      { player: 'Breece Hall', round: 3, year: 1 },
      { player: 'Joe Burrow', round: 8, year: 1 },
    ],
    2025: [
      { player: 'Joe Burrow', round: 6, year: 2 },
      { player: 'Brian Thomas Jr.', round: 10, year: 1 },
    ],
  },
  'Oscar': {
    2021: [
      { player: 'Justin Jefferson', round: 9, year: 1 },
      { player: 'Robbie Chosen', round: 14, year: 1 },
    ],
    2022: [
      { player: 'Diontae Johnson', round: 9, year: 1 },
      { player: 'Hollywood Brown', round: 11, year: 1 },
    ],
    2023: [
      { player: 'DeVonta Smith', round: 8, year: 1 },
      { player: 'Alexander Mattison', round: 8, year: 1 },
    ],
    2024: [
      { player: 'Puka Nacua', round: 8, year: 1 },
      { player: 'Kyler Murray', round: 12, year: 1 },
    ],
    2025: [
      { player: 'Puka Nacua', round: 6, year: 2 },
      { player: 'Chase Brown', round: 10, year: 1 },
    ],
  },
  'Cristian': {
    2021: [
      { player: 'Chris Carson', round: 4, year: 1 },
      { player: 'Antonio Gibson', round: 13, year: 1 },
    ],
    2022: [
      { player: 'Trey Lance', round: 8, year: 1 },
      { player: 'Mike Williams', round: 9, year: 1 },
    ],
    2023: [
      { player: 'Tee Higgins', round: 3, year: 1 },
      { player: 'Justin Herbert', round: 4, year: 1 },
    ],
    2024: [
      { player: 'Jared Goff', round: 5, year: 1 },
      { player: 'Brock Purdy', round: 9, year: 1 },
    ],
    2025: [
      { player: 'Jared Goff', round: 3, year: 2 },
      { player: 'Brock Purdy', round: 7, year: 2 },
    ],
  },
  'Kevin Huertas': {
    2021: [
      { player: 'A.J. Brown', round: 4, year: 1 },
      { player: 'J.K. Dobbins', round: 7, year: 1 },
    ],
    2022: [
      { player: 'Stefon Diggs', round: 5, year: 1 },
      { player: 'Jaylen Waddle', round: 10, year: 1 },
    ],
    2023: [
      { player: 'Stefon Diggs', round: 2, year: 2 },
      { player: 'Jaylen Waddle', round: 5, year: 2 },
    ],
    2024: [
      { player: 'George Pickens', round: 7, year: 1 },
      { player: 'Dalton Kincaid', round: 13, year: 1 },
    ],
    2025: [
      { player: 'Malik Nabers', round: 2, year: 1 },
      { player: 'Bo Nix', round: 12, year: 1 },
    ],
  },
  'Hihi': {
    2021: [
      { player: 'Nyheim Hines', round: 11, year: 1 },
      { player: 'Ravens DEF', round: 13, year: 1 },
    ],
    2022: [
      { player: "Ja'Marr Chase", round: 6, year: 1 },
      { player: 'Courtland Sutton', round: 8, year: 1 },
    ],
    2023: [
      { player: "Ja'Marr Chase", round: 2, year: 2 },
      { player: 'Deebo Samuel', round: 4, year: 1 },
    ],
    2024: [
      { player: 'Kyren Williams', round: 8, year: 1 },
      { player: 'Sam LaPorta', round: 12, year: 1 },
    ],
    2025: [
      { player: 'Ladd McConkey', round: 7, year: 1 },
      { player: 'Baker Mayfield', round: 9, year: 1 },
    ],
  },
  'Jose': {
    2021: [
      { player: 'Keenan Allen', round: 6, year: 1 },
      { player: 'Diontae Johnson', round: 12, year: 1 },
    ],
    2022: [
      { player: 'Kirk Cousins', round: 6, year: 1 },
      { player: 'Justin Jefferson', round: 7, year: 1 },
    ],
    2023: [
      { player: 'Tyreek Hill', round: 3, year: 1 },
      { player: 'Justin Jefferson', round: 7, year: 2 },
    ],
    2024: [
      { player: 'Justin Jefferson', round: 5, year: 3 },
      { player: 'Anthony Richardson Sr.', round: 8, year: 1 },
    ],
    2025: [
      { player: 'C.J. Stroud', round: 9, year: 1 },
      { player: 'Drake Maye', round: 12, year: 1 },
    ],
  },
  'Giovanny': {
    2021: [
      { player: 'Baker Mayfield', round: 5, year: 1 },
      { player: 'Myles Gaskin', round: 6, year: 1 },
    ],
    2022: [
      { player: 'Mark Andrews', round: 5, year: 1 },
      { player: 'Hunter Renfrow', round: 6, year: 1 },
    ],
    2023: [
      { player: 'Dameon Pierce', round: 8, year: 1 },
      { player: 'Chris Olave', round: 10, year: 1 },
    ],
    2024: [
      { player: 'Chris Olave', round: 6, year: 2 },
      { player: 'Rashee Rice', round: 6, year: 1 },
    ],
    2025: [
      { player: 'Jayden Daniels', round: 4, year: 1 },
      { player: 'Trey McBride', round: 5, year: 1 },
    ],
  },
  'Jonathan': {
    2021: [
      { player: 'Calvin Ridley', round: 3, year: 1 },
      { player: 'Cooper Kupp', round: 5, year: 1 },
    ],
    2022: [
      { player: 'Jalen Hurts', round: 4, year: 1 },
      { player: 'AJ Dillon', round: 7, year: 1 },
    ],
    2023: [
      { player: 'Trevor Lawrence', round: 6, year: 1 },
      { player: 'DeAndre Hopkins', round: 7, year: 1 },
    ],
    2024: [
      { player: 'Zay Flowers', round: 9, year: 1 },
      { player: 'Baker Mayfield', round: 11, year: 1 },
    ],
    2025: [
      { player: 'Garrett Wilson', round: 10, year: 1 },
      { player: 'Kyler Murray', round: 10, year: 1 },
    ],
  },
  'Alex Zarate': {
    2021: [
      { player: 'David Montgomery', round: 8, year: 1 },
      { player: 'Darrell Henderson Jr.', round: 13, year: 1 },
    ],
    2022: [
      { player: 'James Conner', round: 11, year: 1 },
      { player: 'Elijah Moore', round: 15, year: 1 },
    ],
    2023: [
      { player: 'Amon-Ra St. Brown', round: 4, year: 1 },
      { player: 'Josh Jacobs', round: 7, year: 1 },
    ],
    2024: [
      { player: 'Isiah Pacheco', round: 8, year: 1 },
      { player: 'Jordan Love', round: 9, year: 1 },
    ],
    2025: [
      { player: 'Jordan Love', round: 7, year: 2 },
      { player: 'Bucky Irving', round: 16, year: 1 },
    ],
  },
  'JJ': {
    2021: [
      { player: 'DK Metcalf', round: 5, year: 1 },
      { player: 'Justin Herbert', round: 8, year: 1 },
    ],
    2022: [
      { player: 'Justin Herbert', round: 7, year: 2 },
      { player: 'Cam Akers', round: 9, year: 1 },
    ],
    2023: [
      { player: 'Javonte Williams', round: 5, year: 1 },
      { player: 'Garrett Wilson', round: 14, year: 1 },
    ],
    2024: [
      { player: 'C.J. Stroud', round: 11, year: 1 },
      { player: 'Garrett Wilson', round: 12, year: 2 },
    ],
    2025: [
      { player: 'Justin Jefferson', round: 3, year: 1 },
      { player: 'J.J. McCarthy', round: 15, year: 1 },
    ],
  },
  'Ed': {
    2021: [
      { player: 'Josh Allen', round: 4, year: 1 },
      { player: 'Aaron Rodgers', round: 4, year: 1 },
    ],
    2022: [
      { player: 'Darnell Mooney', round: 10, year: 1 },
      { player: 'Michael Pittman Jr.', round: 10, year: 1 },
    ],
    2023: [
      { player: 'A.J. Brown', round: 3, year: 1 },
      { player: 'Justin Fields', round: 7, year: 1 },
    ],
    2024: [
      { player: 'Nico Collins', round: 12, year: 1 },
      { player: "De'Von Achane", round: 14, year: 1 },
    ],
    2025: [
      { player: 'Nico Collins', round: 9, year: 2 },
      { player: "De'Von Achane", round: 12, year: 2 },
    ],
  },
  'Big Vic': {
    2025: [
      { player: 'Kyren Williams', round: 6, year: 1 },
      { player: 'Brock Bowers', round: 10, year: 1 },
    ],
  },
};

const YEARS = [2025, 2024, 2023, 2022, 2021];
const OWNER_ORDER = [
  'Alexis', 'Oscar', 'Cristian', 'Kevin Huertas', 'Hihi',
  'Jose', 'Giovanny', 'Jonathan', 'Alex Zarate', 'JJ', 'Ed', 'Big Vic'
];

function YearBadge({ year }) {
  const color = year === 3 ? '#D64040' : year === 2 ? '#c8a832' : 'var(--text-muted)';
  const label = year === 3 ? 'Yr 3 🔴' : `Yr ${year}`;
  return <span style={{ fontSize: 9, color, fontWeight: year === 3 ? 700 : 400 }}>{label}</span>;
}

export default function RebirthKeepers() {
  return (
    <div style={styles.wrap}>
      <div style={styles.intro}>
        Keepers are limited to 3 years per owner. Year counter resets on trade. 🔴 = max year reached.
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
              const data = KEEPERS[owner] || {};
              return (
                <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.tdOwner}>{owner}</td>
                  {YEARS.map(y => {
                    const picks = data[y];
                    return (
                      <td key={y} style={styles.td}>
                        {picks ? (
                          <div style={styles.pickCell}>
                            {picks.map((p, j) => (
                              <div key={j} style={styles.pickRow}>
                                <span style={{
                                  ...styles.pick,
                                  color: p.year === 3 ? '#D64040' : 'var(--text-muted)',
                                }}>{p.player}</span>
                                <div style={styles.pickMeta}>
                                  <span style={styles.round}>Rd {p.round}</span>
                                  <YearBadge year={p.year} />
                                </div>
                              </div>
                            ))}
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
  thOwner: { textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10, borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'var(--bg)', minWidth: 120 },
  th: { textAlign: 'center', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10, borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap', minWidth: 180 },
  rowEven: { background: 'var(--bg)' },
  rowOdd: { background: 'var(--bg2)' },
  tdOwner: { padding: '10px 12px', whiteSpace: 'nowrap', borderBottom: '0.5px solid var(--border)', position: 'sticky', left: 0, background: 'inherit', color: 'var(--text)', fontWeight: 500, fontSize: 12 },
  td: { padding: '6px 10px', borderBottom: '0.5px solid var(--border)', verticalAlign: 'top' },
  pickCell: { display: 'flex', flexDirection: 'column', gap: 6 },
  pickRow: { display: 'flex', flexDirection: 'column', gap: 2 },
  pick: { fontSize: 11, lineHeight: 1.3 },
  pickMeta: { display: 'flex', gap: 6, alignItems: 'center' },
  round: { fontSize: 9, color: '#444' },
  na: { color: '#333', fontSize: 11 },
};