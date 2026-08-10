import { useState } from 'react';
import { useParams } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile';
import Standings from '../components/Standings';
import Matchups from '../components/Matchups';
import Rulebook from '../components/Rulebook';
import History from '../components/History';
import Owners from '../components/Owners';
import Keepers from '../components/Keepers';
import RebirthOwners from '../components/RebirthOwners';
import RebirthKeepers from '../components/RebirthKeepers';
import RebirthDraftBoard from '../components/RebirthDraftBoard';
import BHDraftBoard from '../components/BHDraftBoard';
import OffseasonTrades from '../components/OffseasonTrades';
import KeeperSubmission from '../components/KeeperSubmission';
import PowerRankings from '../components/PowerRankings';
import StsStandings from '../components/StsStandings';
import KeeperPriceCalc from '../components/KeeperPriceCalc';

const LEAGUES = {
  'beaners-husseins': { name: "Beaners & Husseins", est: 2014, keeper: true },
  'rebirth': { name: 'Rebirth', est: 2019, keeper: true },
  'gentlemens-league': { name: "Gentlemen's League", est: 2023, keeper: false },
  'shoot-the-shits': { name: 'Shoot the Shits', est: 2021, keeper: false },
};

const KEEPER_TABS = ['Standings', 'Matchups', 'Power Rankings', 'History', 'Owners', 'Keepers', 'Keeper Prices', 'Draft Picks Board', 'Off-Season Trades', 'Submit Keepers', 'Rulebook'];
const NON_KEEPER_TABS = ['Standings', 'Matchups', 'Power Rankings', 'History', 'Rulebook'];

export default function League() {
  const { id } = useParams();
  const league = LEAGUES[id];
  const [tab, setTab] = useState('Standings');
  const isMobile = useIsMobile();

  if (!league) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>League not found</div>;

  const tabs = league.keeper ? KEEPER_TABS : NON_KEEPER_TABS;

  return (
    <div style={{ ...styles.wrap, padding: isMobile ? '20px 14px' : '32px 24px' }}>
      <div style={styles.header}>
        <div>
          <h1 style={{ ...styles.title, fontSize: isMobile ? 18 : 22 }}>{league.name}</h1>
          <div style={styles.meta}>
            Est. {league.est}
            {league.keeper && <span style={styles.keeperBadge}>Keeper</span>}
          </div>
        </div>
      </div>

      <div style={{ ...styles.tabsOuter, borderBottom: isMobile ? 'none' : '0.5px solid var(--border)' }}>
        <div style={{ ...styles.tabs, flexWrap: isMobile ? 'wrap' : 'nowrap', overflowX: isMobile ? 'visible' : 'auto', gap: isMobile ? 4 : 0, paddingBottom: isMobile ? 12 : 0 }}>
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.tab,
                ...(tab === t ? styles.tabActive : {}),
                ...(isMobile ? styles.tabMobile : {}),
                ...(isMobile && tab === t ? styles.tabMobileActive : {}),
              }}
            >
              {t}
            </button>
          ))}
        </div>
        {!isMobile && <div style={styles.tabFade} />}
      </div>

      <div style={styles.content}>
        {tab === 'Standings' && id === 'shoot-the-shits' && <StsStandings leagueId={id} />}
        {tab === 'Standings' && id !== 'shoot-the-shits' && <Standings leagueId={id} />}
        {tab === 'Matchups' && <Matchups leagueId={id} />}
        {tab === 'History' && <History leagueId={id} />}
        {tab === 'Owners' && id === 'rebirth' && <RebirthOwners />}
        {tab === 'Owners' && id !== 'rebirth' && <Owners leagueId={id} />}
        {tab === 'Keepers' && id === 'rebirth' && <RebirthKeepers />}
        {tab === 'Keepers' && id !== 'rebirth' && <Keepers leagueId={id} />}
        {tab === 'Keeper Prices' && id === 'rebirth' && <KeeperPriceCalc />}
        {tab === 'Draft Picks Board' && id === 'rebirth' && <RebirthDraftBoard />}
        {tab === 'Draft Picks Board' && id === 'beaners-husseins' && <BHDraftBoard />}
        {tab === 'Draft Picks Board' && id !== 'rebirth' && id !== 'beaners-husseins' && (
          <div style={{ padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>Draft picks board coming soon.</div>
        )}
        {tab === 'Power Rankings' && <PowerRankings leagueId={id} />}
        {tab === 'Off-Season Trades' && <OffseasonTrades leagueId={id} />}
        {tab === 'Submit Keepers' && <KeeperSubmission leagueId={id} />}
        {tab === 'Rulebook' && <Rulebook leagueId={id} />}
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 1100, margin: '0 auto' },
  header: { marginBottom: 24 },
  title: { fontWeight: 600, color: 'var(--text)', margin: 0 },
  meta: { fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 },
  keeperBadge: { fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--red)', border: '0.5px solid var(--red)', borderRadius: 4, padding: '2px 6px' },
  tabsOuter: { position: 'relative', marginBottom: 24 },
  tabs: { display: 'flex', scrollbarWidth: 'none', msOverflowStyle: 'none' },
  tab: { background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--text-muted)', padding: '10px 16px', fontSize: 13, cursor: 'pointer', marginBottom: -1, transition: 'color 0.15s', whiteSpace: 'nowrap', flexShrink: 0 },
  tabActive: { color: 'var(--text)', borderBottom: '2px solid var(--red)' },
  tabMobile: { padding: '6px 12px', fontSize: 11, borderBottom: 'none', marginBottom: 0, borderRadius: 20, border: '0.5px solid var(--border)', background: 'var(--bg2)', whiteSpace: 'nowrap', flexShrink: 0 },
  tabMobileActive: { background: 'var(--red)', color: '#fff', borderColor: 'var(--red)' },
  tabFade: { position: 'absolute', top: 0, right: 0, width: 48, height: '100%', background: 'linear-gradient(to right, transparent, var(--bg))', pointerEvents: 'none' },
  content: { minHeight: 400 },
};