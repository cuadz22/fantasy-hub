import { Link, useLocation } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile';

const LEAGUES = [
  { id: 'beaners-husseins', name: "Beaners & Husseins" },
  { id: 'rebirth', name: 'Rebirth' },
  { id: 'gentlemens-league', name: "Gentlemen's League" },
  { id: 'shoot-the-shits', name: 'Shoot the Shits' },
];

export default function Nav({ theme, onToggleTheme }) {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const isDark = theme === 'dark';

  if (isMobile) {
    return (
      <header style={styles.headerMobile}>
        <div style={styles.mobileTop}>
          <Link to="/" style={styles.logo}>Cuadz Fantasy Network</Link>
          <button onClick={onToggleTheme} style={styles.themeBtn} title="Toggle theme">
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
        <nav style={styles.navMobile}>
          {LEAGUES.map(l => {
            const active = pathname === `/league/${l.id}`;
            return (
              <Link
                key={l.id}
                to={`/league/${l.id}`}
                style={{ ...styles.tabMobile, ...(active ? styles.tabMobileActive : {}) }}
              >
                {l.name}
              </Link>
            );
          })}
        </nav>
      </header>
    );
  }

  return (
    <header style={styles.header}>
      <Link to="/" style={styles.logo}>Cuadz Fantasy Network</Link>
      <div style={styles.navWrap}>
        <nav style={styles.nav}>
          {LEAGUES.map(l => {
            const active = pathname === `/league/${l.id}`;
            return (
              <Link
                key={l.id}
                to={`/league/${l.id}`}
                style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
              >
                <span style={styles.tabDot(active)} />
                {l.name}
              </Link>
            );
          })}
        </nav>
        <div style={styles.fadeRight} />
      </div>
      <button onClick={onToggleTheme} style={styles.themeBtn} title="Toggle theme">
        {isDark ? '☀️' : '🌙'}
      </button>
    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 32,
    padding: '0 32px',
    height: 52,
    background: 'var(--bg2)',
    borderBottom: '0.5px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerMobile: {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg2)',
    borderBottom: '0.5px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navMobile: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    padding: '0 16px 10px',
  },
  tabMobile: {
    fontSize: 11,
    color: 'var(--text-muted)',
    padding: '5px 10px',
    borderRadius: 20,
    border: '0.5px solid var(--border)',
    background: 'var(--bg)',
    whiteSpace: 'nowrap',
  },
  tabMobileActive: {
    color: '#fff',
    background: 'var(--red)',
    borderColor: 'var(--red)',
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 17,
    color: 'var(--red)',
    letterSpacing: '0.04em',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  navWrap: {
    position: 'relative',
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    height: '100%',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  fadeRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 48,
    height: '100%',
    background: 'linear-gradient(to right, transparent, var(--bg2))',
    pointerEvents: 'none',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '0 14px',
    height: '100%',
    fontSize: 12,
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    transition: 'color 0.12s',
    borderBottom: '2px solid transparent',
  },
  tabActive: {
    color: 'var(--text)',
    borderBottom: '2px solid var(--red)',
  },
  tabDot: (active) => ({
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: active ? 'var(--red)' : 'var(--border-light)',
    flexShrink: 0,
  }),
  themeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 16,
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 6,
    flexShrink: 0,
    lineHeight: 1,
    opacity: 0.8,
    transition: 'opacity 0.15s',
  },
  mobileTop: {
    padding: '10px 16px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
};
