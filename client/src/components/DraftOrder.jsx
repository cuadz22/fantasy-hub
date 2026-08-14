const DRAFT_ORDERS = {
  'beaners-husseins': [
    'Kyle', 'Eddie', 'Oscar', 'Jose', 'Bish', 'Pru', 'Hihi', 'Kev', 'Cris', 'Nemo', 'Gio', 'Edwin',
  ],
  'gentlemens-league': [
    'Ramon', 'Jose', 'JJ', 'Gio', 'Pru', 'Julio', 'Tello', 'Vic', 'Oscar', 'Alexis', 'Ed', 'Kev',
  ],
  'rebirth': [
    'Vic', 'Gio', 'Oscar', 'Jose', 'Julio', 'Cris', 'Hihi', 'JJ', 'Pru', 'Alexis', 'Ed', 'Tello',
  ],
};

export default function DraftOrder({ leagueId }) {
  const order = DRAFT_ORDERS[leagueId];
  if (!order) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.note}>
        Snake draft — odd rounds go 1→{order.length}, even rounds reverse.
      </div>

      <div style={styles.col}>
        <div style={styles.colHeader}>Draft order</div>
        {order.map((name, i) => (
          <div key={i} style={styles.row}>
            <span style={styles.pick}>{i + 1}</span>
            <span style={styles.name}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  note: { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' },
  columns: { display: 'flex', gap: 32, flexWrap: 'wrap' },
  col: { display: 'flex', flexDirection: 'column', gap: 0, minWidth: 200 },
  colHeader: {
    fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 12, fontWeight: 400,
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '10px 0', borderBottom: '0.5px solid var(--border)',
  },
  pick: {
    fontFamily: "'Bebas Neue', sans-serif", fontSize: 18,
    color: 'var(--red)', width: 28, flexShrink: 0, textAlign: 'right',
  },
  name: { fontSize: 14, color: 'var(--text)', fontWeight: 500 },
};
