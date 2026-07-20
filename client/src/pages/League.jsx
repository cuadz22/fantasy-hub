import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Standings from '../components/Standings';
import Matchups from '../components/Matchups';
import Rulebook from '../components/Rulebook';
import History from '../components/History';

const LEAGUES = {
  'beaners-husseins': { name: "Beaners & Husseins" },
  'rebirth': { name: 'Rebirth' },
  'gentlemens-league': { name: "Gentlemen's League" },
  'shoot-the-shits': { name: 'Shoot the Shits' },
};

const TABS = ['Standings', 'Matchups', 'Rulebook', 'History'];

export default function League() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Standings');
  const league = LEAGUES[id];

  if (!league) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>League not found.</div>;

  return (
    <main style={styles.main}>
      <div style={styles.header}>
        <div style={styles.bar} />
        <h1 style={styles.title}>{league.name}</h1>
        <span style={styles.badge}>NFL 2025</span>
      </div>
      <div style={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div style={styles.content}>
        {activeTab === 'Standings' && <Standings leagueId={id} />}
        {activeTab === 'Matchups' && <Matchups leagueId={id} />}
        {activeTab === 'Rulebook' && <Rulebook leagueId={id} />}
        {activeTab === 'History' && <History leagueId={id} />}
      </div>
    </main>
  );
}

const styles = {
  main: { padding: '40px 32px', maxWidth: 1100, margin: '0 auto' },
  header: { marginBottom: 32, position: 'relative', paddingTop: 8, display: 'flex', alignItems: 'baseline', gap: 14 },
  bar: { position: 'absolute', top: 0, left: 0, width: 24, height: 2, background: 'var(--red)' },
  title: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: '0.04em', color: 'var(--text)' },
  badge: { fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', border: '0.5px solid var(--border)', padding: '3px 8px', borderRadius: 4 },
  tabs: { display: 'flex', gap: 2, borderBottom: '0.5px solid var(--border)', marginBottom: 28 },
  tab: {
    padding: '8px 16px', background: 'none', border: 'none',
    fontSize: 12, color: 'var(--text-muted)',
    borderBottom: '2px solid transparent',
    marginBottom: -1, transition: 'all 0.12s',
  },
  tabActive: { color: 'var(--text)', borderBottom: '2px solid var(--red)' },
  content: {},
};
