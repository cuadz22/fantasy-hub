import { Link } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile';

const LEAGUES = [
  { id: 'beaners-husseins', name: "Beaners & Husseins", desc: 'Est. 2014' },
  { id: 'rebirth', name: 'Rebirth', desc: 'Est. 2019' },
  { id: 'gentlemens-league', name: "Gentlemen's League", desc: 'Est. 2023' },
  { id: 'shoot-the-shits', name: 'Shoot the Shits', desc: 'Est. 2021' },
];

export default function Home() {
  const isMobile = useIsMobile();
  return (
    <main style={{ ...styles.main, padding: isMobile ? '28px 16px' : '48px 32px' }}>
      <div style={styles.hero}>
        <div style={styles.heroBar} />
        <h1 style={styles.heroTitle}>Cuadz Fantasy Network</h1>
        <p style={styles.heroSub}>Four leagues. One place. All season long.</p>
      </div>
      <Link to="/network" style={styles.networkCta}>
        <span>CFN Standings →</span>
        
      </Link>
      <div style={styles.grid}>
        {LEAGUES.map((l, i) => (
          <Link key={l.id} to={`/league/${l.id}`} style={styles.card}>
            <div style={styles.cardNum}>0{i + 1}</div>
            <div style={styles.cardName}>{l.name}</div>
            <div style={styles.cardDesc}>{l.desc}</div>
            <div style={styles.cardArrow}>→</div>
          </Link>
        ))}
      </div>
    </main>
  );
}

const styles = {
  main: { padding: '48px 32px', maxWidth: 1100, margin: '0 auto' },
  hero: { marginBottom: 48, position: 'relative', paddingTop: 8 },
  heroBar: { position: 'absolute', top: 0, left: 0, width: 32, height: 2, background: 'var(--red)' },
  heroTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: '0.04em', color: 'var(--text)', lineHeight: 1 },
  heroSub: { fontSize: 13, color: 'var(--text-muted)', marginTop: 8 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 16 },
  card: {
    display: 'flex', flexDirection: 'column', gap: 8,
    padding: '24px 20px', background: 'var(--bg2)',
    border: '0.5px solid var(--border)', borderRadius: 8,
    transition: 'border-color 0.12s',
    cursor: 'pointer',
  },
  cardNum: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: 'var(--red)', letterSpacing: '0.1em' },
  cardName: { fontSize: 15, fontWeight: 500, color: 'var(--text)' },
  cardDesc: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 },
  cardArrow: { fontSize: 16, color: 'var(--red)', marginTop: 8 },
  networkCta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    padding: '16px 20px',
    background: 'var(--bg2)',
    border: '0.5px solid var(--red)',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--red)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  ctaArrow: { fontSize: 16 },
};
