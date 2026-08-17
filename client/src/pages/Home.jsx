import { Link } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile';

const LEAGUES = [
  { id: 'beaners-husseins', name: "Beaners & Husseins", est: 2014, members: 12 },
  { id: 'rebirth', name: 'Rebirth', est: 2019, members: 12 },
  { id: 'gentlemens-league', name: "Gentlemen's League", est: 2023, members: 12 },
  { id: 'shoot-the-shits', name: 'Shoot the Shits', est: 2021, members: 10 },
];

const STATS = [
  { num: '4', label: 'Leagues' },
  { num: '12+', label: 'Years Running' },
  { num: '40+', label: 'Members' },
  { num: '50+', label: 'Seasons Played' },
];

export default function Home() {
  const isMobile = useIsMobile();

  return (
    <main style={styles.main}>
      {/* Hero */}
      <div style={{ ...styles.hero, padding: isMobile ? '52px 20px 44px' : '80px 48px 64px' }}>
        <div style={styles.eyebrow}>
          <span style={styles.eyebrowDot} />
          The official home of Cuadz fantasy football
        </div>

        <h1 style={{ ...styles.heroTitle, fontSize: isMobile ? 54 : 108, lineHeight: isMobile ? 1.05 : 1 }}>
          Cuadz Fantasy<br />
          <span style={styles.heroHighlight}>Network.</span>
        </h1>

        <p style={{ ...styles.heroSub, fontSize: isMobile ? 14 : 17 }}>
          Four leagues. One place. All season long.
        </p>

        <div style={{ ...styles.statsRow, flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? 0 : 0 }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={styles.statWrap}>
              {i > 0 && !isMobile && <div style={styles.statDivider} />}
              <div style={styles.stat}>
                <div style={{ ...styles.statNum, fontSize: isMobile ? 32 : 44 }}>{s.num}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* League grid */}
      <div style={{ ...styles.leagueSection, padding: isMobile ? '0 20px 56px' : '0 48px 72px' }}>
        <div style={styles.sectionLabel}>Leagues</div>
        <div style={{ ...styles.grid, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)' }}>
          {LEAGUES.map((l, i) => (
            <Link key={l.id} to={`/league/${l.id}`} style={styles.card}>
              <div style={styles.cardNum}>0{i + 1}</div>
              <div style={styles.cardName}>{l.name}</div>
              <div style={styles.cardMeta}>Est. {l.est} · {l.members} teams</div>
              <div style={styles.cardArrow}>→</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

const styles = {
  main: { maxWidth: 1200, margin: '0 auto' },

  hero: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  eyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
    fontWeight: 500,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--red)',
    flexShrink: 0,
  },

  heroTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontWeight: 900,
    color: 'var(--text)',
    letterSpacing: '0.01em',
    margin: 0,
  },
  heroHighlight: {
    color: 'var(--text)',
    borderBottom: '5px solid var(--red)',
    paddingBottom: 2,
  },

  heroSub: {
    color: 'var(--text-muted)',
    margin: 0,
    lineHeight: 1.5,
  },

  statsRow: {
    display: 'flex',
    marginTop: 16,
    borderTop: '0.5px solid var(--border)',
    paddingTop: 28,
  },
  statWrap: {
    display: 'flex',
    alignItems: 'stretch',
    flex: 1,
  },
  statDivider: {
    width: '0.5px',
    background: 'var(--border)',
    marginRight: 32,
    flexShrink: 0,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  statNum: {
    fontFamily: "'Bebas Neue', sans-serif",
    color: 'var(--text)',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },

  leagueSection: {},
  sectionLabel: {
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: 500,
    marginBottom: 16,
  },
  grid: {
    display: 'grid',
    gap: 12,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '24px 20px',
    background: 'var(--bg2)',
    border: '0.5px solid var(--border)',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'border-color 0.12s, transform 0.12s',
  },
  cardNum: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 12,
    color: 'var(--red)',
    letterSpacing: '0.1em',
  },
  cardName: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text)',
    lineHeight: 1.3,
  },
  cardMeta: {
    fontSize: 11,
    color: 'var(--text-muted)',
    flex: 1,
  },
  cardArrow: {
    fontSize: 15,
    color: 'var(--red)',
    marginTop: 4,
  },
};
