import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Standings from '../components/Standings';
import Matchups from '../components/Matchups';
import Rulebook from '../components/Rulebook';
import History from '../components/History';
import Owners from '../components/Owners';
import Keepers from '../components/Keepers';

const LEAGUES = {
  'beaners-husseins': { name: "Beaners & Husseins", est: 2014, keeper: true },
  'rebirth': { name: 'Rebirth', est: 2019, keeper: true },
  'gentlemens-league': { name: "Gentlemen's League", est: 2023, keeper: false },
  'shoot-the-shits': { name: 'Shoot the Shits', est: 2021, keeper: false },
};

const TABS = ['Standings', 'Matchups', 'History', 'Owners', 'Rulebook'];
const KEEPER_TABS = ['Standings', 'Matchups', 'History', 'Owners', 'Keepers', 'Rulebook'];
const NON_KEEPER_TABS = ['Standings', 'Matchups', 'History', 'Rulebook'];

export default function League() {
  const { id } = useParams();
  const league = LEAGUES[id];
  const [tab, setTab] = useState('Standings');

  if (!league) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>League not found</div>;

  const tabs = league.keeper ? KEEPER_TABS : NON_KEEPER_TABS;

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{league.name}</h1>
          <div style={styles.meta}>
            Est. {league.est}
            {league.keeper && <span style={styles.keeperBadge}>Keeper</span>}
          </div>
        </div>
      </div>

      <div style={styles.tabs}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {tab === 'Standings' && <Standings leagueId={id} />}
        {tab === 'Matchups' && <Matchups leagueId={id} />}
        {tab === 'History' && <History leagueId={id} />}
        {tab === 'Owners' && <Owners leagueId={id} />}
        {tab === 'Keepers' && <Keepers leagueId={id} />}
        {tab === 'Rulebook' && <Rulebook leagueId={id} />}
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  header: { marginBottom: 28 },
  title: { fontSize: 22, fontWeight: 600, color: 'var(--text)', margin: 0 },
  meta: { fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 },
  keeperBadge: {
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--red)',
    border: '0.5px solid var(--red)',
    borderRadius: 4,
    padding: '2px 6px',
  },
  tabs: { display: 'flex', gap: 0, borderBottom: '0.5px solid var(--border)', marginBottom: 28 },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-muted)',
    padding: '10px 18px',
    fontSize: 13,
    cursor: 'pointer',
    marginBottom: -1,
    transition: 'color 0.15s',
  },
  tabActive: {
    color: 'var(--text)',
    borderBottom: '2px solid var(--red)',
  },
  content: { minHeight: 400 },
};