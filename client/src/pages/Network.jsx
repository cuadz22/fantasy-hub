import useIsMobile from '../hooks/useIsMobile';
import NetworkStandings from '../components/NetworkStandings';

export default function Network() {
  const isMobile = useIsMobile();
  return (
    <main style={{ ...styles.main, padding: isMobile ? '28px 16px' : '48px 32px' }}>
      <div style={styles.hero}>
        <div style={styles.heroBar} />
        <h1 style={styles.heroTitle}>Network Standings</h1>
        <p style={styles.heroSub}>All managers ranked by combined win% across every league they play in.</p>
      </div>
      <NetworkStandings />
    </main>
  );
}

const styles = {
  main: { maxWidth: 900, margin: '0 auto' },
  hero: { marginBottom: 40, position: 'relative', paddingTop: 8 },
  heroBar: { position: 'absolute', top: 0, left: 0, width: 32, height: 2, background: 'var(--red)' },
  heroTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: '0.04em', color: 'var(--text)', lineHeight: 1 },
  heroSub: { fontSize: 13, color: 'var(--text-muted)', marginTop: 8 },
};
