import { Link, useLocation } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile';

const LEAGUES = [
  { id: 'beaners-husseins', name: "Beaners & Husseins" },
  { id: 'rebirth', name: 'Rebirth' },
  { id: 'gentlemens-league', name: "Gentlemen's League" },
  { id: 'shoot-the-shits', name: 'Shoot the Shits' },
];

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: 999,
        padding: '4px 10px 4px 8px',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'border-color 0.15s',
      }}
    >
      {/* sliding pill track */}
      <div style={{
        position: 'relative',
        width: 28,
        height: 16,
        borderRadius: 999,
        background: isDark ? '#2a2a2a' : '#ACF910',
        border: '1px solid var(--border)',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute',
          top: 2,
          left: isDark ? 2 : 12,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: isDark ? '#666' : '#111',
          transition: 'left 0.2s, background 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}

export default function Nav({ theme, onToggleTheme }) {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const isDark = theme === 'dark';

  if (isMobile) {
    return (
      <header style={styles.headerMobile}>
        <div style={styles.mobileTop}>
          <Link to="/" style={styles.logo}>Cuadz Fantasy Network</Link>
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
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
          <a href="/rivalry-week.html" style={styles.rivalryTabMobile}>⚔️ Rivalry Week</a>
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
          <a href="/rivalry-week.html" style={styles.rivalryTab}>⚔️ Rivalry Week</a>
        </nav>
        <div style={styles.fadeRight} />
      </div>
      <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
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
  mobileTop: {
    padding: '10px 16px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: '#111',
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
    background: active ? 'var(--red)' : '#333',
    flexShrink: 0,
  }),
  rivalryTab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 14px',
    height: '100%',
    fontSize: 12,
    color: '#ACF910',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid transparent',
    marginLeft: 8,
    fontWeight: 600,
  },
  rivalryTabMobile: {
    fontSize: 11,
    color: '#111',
    padding: '5px 10px',
    borderRadius: 20,
    border: '0.5px solid #ACF910',
    background: '#ACF910',
    whiteSpace: 'nowrap',
    fontWeight: 600,
  },
};
