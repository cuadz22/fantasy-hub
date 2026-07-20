const RULEBOOKS = {
  'beaners-husseins': [
    { title: 'Scoring', rules: ['PPR (1 point per reception)', 'QB: 4pts/TD pass, 1pt/25 yds passing', 'RB/WR/TE: 6pts/TD, 1pt/10 yds rushing or receiving', 'DEF: Sacks, INTs, TDs, shutout bonuses'] },
    { title: 'Roster', rules: ['1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX, 1 K, 1 DEF', '6 bench spots', '1 IR spot'] },
    { title: 'Draft', rules: ['Snake draft', 'Order randomly determined', '90 seconds per pick', 'Autodraft if no pick made'] },
    { title: 'Playoffs', rules: ['Top 4 teams make playoffs', 'Weeks 15-17', 'Single elimination'] },
    { title: 'Waivers', rules: ['FAAB (Free Agent Acquisition Budget)', '$200 budget per season', 'Bids processed Tuesday morning'] },
    { title: 'Trades', rules: ['Trade deadline: Week 11', 'League vote required for approval', '48-hour review window'] },
  ],
  'rebirth': [
    { title: 'Scoring', rules: ['Half PPR (0.5 pts per reception)', 'Standard TD values', 'Bonus: 100+ rushing yards (+2), 100+ receiving yards (+2)'] },
    { title: 'Roster', rules: ['1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX, 1 K, 1 DEF', '7 bench spots'] },
    { title: 'Draft', rules: ['Auction draft - $200 budget', 'Nominations rotate around the room', '15 seconds to bid once nominated'] },
    { title: 'Playoffs', rules: ['Top 6 teams make playoffs', 'Weeks 14-17', 'Seeds 1 & 2 get bye in first round'] },
    { title: 'Waivers', rules: ['Rolling waivers', 'Claims processed Wednesday morning'] },
    { title: 'Trades', rules: ['No trade deadline', 'Commissioner approval required', '3 day review window'] },
  ],
  'gentlemens-league': [
    { title: 'Scoring', rules: ['PPR', 'TE premium: +0.5 extra per reception', '2-point conversions count', 'Return TDs: 6pts'] },
    { title: 'Roster', rules: ['2 QB, 2 RB, 3 WR, 1 TE, 1 FLEX, 1 K, 1 DEF', '5 bench spots', '2 IR spots'] },
    { title: 'Draft', rules: ['Snake draft, 3rd round reversal', 'Order drawn from a hat', '2 minutes per pick'] },
    { title: 'Playoffs', rules: ['Top 4 teams + 2 wild cards', 'Wild card: highest points among non-playoff teams', 'Weeks 15-17'] },
    { title: 'Waivers', rules: ['Standard waivers (inverse standings order)', 'Claims Tuesday morning', 'Free agents available after 48 hours'] },
    { title: 'Conduct', rules: ['Gentlemanly trash talk only', 'No sandbagging in playoff seeding weeks', 'Set your lineup or face a fine'] },
  ],
  'shoot-the-shits': [
    { title: 'Scoring', rules: ['PPR', 'Standard scoring otherwise', 'No kickers - DEF/ST only'] },
    { title: 'Roster', rules: ['1 QB, 2 RB, 3 WR, 1 TE, 2 FLEX, 1 DEF', '6 bench spots'] },
    { title: 'Draft', rules: ['Snake draft', 'Live draft party - attendance required or you autodraft', 'Order decided by previous season finish'] },
    { title: 'Playoffs', rules: ['Top 4 teams', 'Weeks 15-17', 'Loser bracket plays for last place (Toilet Bowl)'] },
    { title: 'Waivers', rules: ['FAAB - $100 budget', 'Minimum bid $1', 'Thursday morning processing'] },
    { title: 'Punishments', rules: ['Last place wears a jersey of the winners choosing to the draft', 'Loser buys first round at the draft party', 'Toilet Bowl loser posts an L on the group chat'] },
  ],
};

const CONSTITUTIONS = {
  'beaners-husseins': [
    { article: 'I', title: 'Commissioner Authority', text: 'The Commissioner has final say on all league matters not explicitly covered by these rules. Decisions must be made in the best interest of the league and are subject to a majority vote override by league members.' },
    { article: 'II', title: 'Membership', text: 'The league consists of 10 teams. A member who fails to set their lineup for 3 or more consecutive weeks may be removed and replaced at the Commissioner\'s discretion. New members must be approved by a majority vote.' },
    { article: 'III', title: 'Rule Changes', text: 'Any rule change must be proposed before the start of the season. Changes require a two-thirds majority vote to pass. No rule changes are permitted once the season has begun.' },
    { article: 'IV', title: 'Dispute Resolution', text: 'Disputes must be submitted to the Commissioner within 48 hours of the event in question. The Commissioner will issue a ruling within 72 hours. Members may appeal to a league vote within 24 hours of the ruling.' },
    { article: 'V', title: 'Entry Fees & Payouts', text: 'Entry fees are due before the draft. Failure to pay forfeits your draft spot. Payouts are distributed at the end of the season: 1st place (60%), 2nd place (25%), 3rd place (15%).' },
    { article: 'VI', title: 'Collusion', text: 'Collusion of any kind — including lopsided trades intended to benefit one team unfairly — is grounds for immediate removal from the league and forfeiture of entry fee.' },
  ],
  'rebirth': [
    { article: 'I', title: 'Commissioner Authority', text: 'The Commissioner manages all league settings and resolves disputes. A co-commissioner may be appointed to assist. All major decisions are subject to league vote.' },
    { article: 'II', title: 'Membership', text: 'The league consists of 12 teams. Members must be active participants. Inactive managers (missing lineups, ignoring trades) may be replaced after a league vote.' },
    { article: 'III', title: 'Rule Changes', text: 'Rule changes are voted on at the end of each season during the annual league meeting. A simple majority is required to pass changes.' },
    { article: 'IV', title: 'Dispute Resolution', text: 'All disputes are handled by the Commissioner. In cases involving the Commissioner directly, the co-commissioner takes over. Final appeals go to a full league vote.' },
    { article: 'V', title: 'Entry Fees & Payouts', text: '1st place (50%), 2nd place (30%), Most Points (10%), Survivor bonus (10%) — last manager standing without a losing week.' },
    { article: 'VI', title: 'Integrity', text: 'All trades and transactions must be made in good faith to improve your own team. Any transaction deemed collusive will be reversed and the parties involved may be removed.' },
  ],
  'gentlemens-league': [
    { article: 'I', title: 'The Code', text: 'Above all, this is a Gentlemen\'s League. Every member is expected to conduct themselves with dignity, set their lineups on time, and compete with integrity at all times.' },
    { article: 'II', title: 'Commissioner Authority', text: 'The Commissioner serves a one-year term and is elected by popular vote at the end of each season. The outgoing Commissioner oversees the election.' },
    { article: 'III', title: 'Membership', text: 'Membership is by invitation only. Prospective members must be vouched for by an existing member and approved by a two-thirds majority vote.' },
    { article: 'IV', title: 'Rule Changes', text: 'Rule changes require a two-thirds majority and must be submitted at least 30 days before the draft. Emergency rules may be enacted by the Commissioner with immediate league notification.' },
    { article: 'V', title: 'Entry Fees & Payouts', text: '1st place (55%), 2nd place (25%), Regular season champion (10%), Highest single-week score (10%).' },
    { article: 'VI', title: 'The Gentlemen\'s Code of Conduct', text: 'Members are expected to respond to trade offers within 48 hours, never intentionally field a losing lineup, and refrain from personal attacks in league chat. Violations are subject to fines determined by league vote.' },
  ],
  'shoot-the-shits': [
    { article: 'I', title: 'Commissioner Authority', text: 'The Commissioner is the founding member and holds authority for life, or until they voluntarily step down. The league can remove the Commissioner by unanimous vote (excluding the Commissioner).' },
    { article: 'II', title: 'Membership', text: 'The league is capped at 12 teams. Members who go inactive two seasons in a row lose their spot. Friends and family only — no strangers.' },
    { article: 'III', title: 'Rule Changes', text: 'Rules are debated at the annual draft party. Anything goes as long as the majority agrees before the draft starts. Mid-season rule changes are strictly prohibited.' },
    { article: 'IV', title: 'Dispute Resolution', text: 'Disputes are settled by group chat vote. The Commissioner breaks ties. If the Commissioner is involved in the dispute, the longest-tenured member breaks the tie.' },
    { article: 'V', title: 'Entry Fees & Payouts', text: '1st place (50%), 2nd place (25%), 3rd place (15%), Toilet Bowl winner gets their entry fee back (10%).' },
    { article: 'VI', title: 'The Unwritten Rules', text: 'Always set your lineup. Never cry about a loss in the group chat for more than 24 hours. The draft party is mandatory. What happens at the draft party stays at the draft party.' },
  ],
};

export default function Rulebook({ leagueId }) {
  const sections = RULEBOOKS[leagueId] || [];
  const constitution = CONSTITUTIONS[leagueId] || [];

  return (
    <div style={styles.outer}>
      <div style={styles.block}>
        <div style={styles.blockHeader}>
          <div style={styles.blockBar} />
          <h2 style={styles.blockTitle}>League Rules</h2>
        </div>
        <div style={styles.wrap}>
          {sections.map((section, i) => (
            <div key={i} style={styles.section}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionBar} />
                <h3 style={styles.sectionTitle}>{section.title}</h3>
              </div>
              <ul style={styles.list}>
                {section.rules.map((rule, j) => (
                  <li key={j} style={styles.rule}>
                    <span style={styles.bullet} />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.block}>
        <div style={styles.blockHeader}>
          <div style={styles.blockBar} />
          <h2 style={styles.blockTitle}>League Constitution</h2>
          <span style={styles.constBadge}>Founding Document</span>
        </div>
        <div style={styles.constList}>
          {constitution.map((article, i) => (
            <div key={i} style={styles.article}>
              <div style={styles.articleHeader}>
                <span style={styles.articleNum}>Article {article.article}</span>
                <span style={styles.articleTitle}>{article.title}</span>
              </div>
              <p style={styles.articleText}>{article.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  outer: { display: 'flex', flexDirection: 'column', gap: 40 },
  block: {},
  blockHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  blockBar: { width: 2, height: 18, background: 'var(--red)', borderRadius: 1, flexShrink: 0 },
  blockTitle: { fontSize: 14, fontWeight: 500, color: 'var(--text)' },
  constBadge: { fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', border: '0.5px solid var(--border)', padding: '3px 8px', borderRadius: 4 },
  wrap: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 },
  section: { background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '20px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionBar: { width: 2, height: 14, background: 'var(--red)', borderRadius: 1, flexShrink: 0 },
  sectionTitle: { fontSize: 12, fontWeight: 500, color: 'var(--text)' },
  list: { display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none' },
  rule: { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 },
  bullet: { width: 3, height: 3, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: 6 },
  constList: { display: 'flex', flexDirection: 'column', gap: 0 },
  article: { padding: '20px 0', borderBottom: '0.5px solid var(--border)' },
  articleHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  articleNum: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: 'var(--red)', letterSpacing: '0.08em', flexShrink: 0 },
  articleTitle: { fontSize: 13, fontWeight: 500, color: 'var(--text)' },
  articleText: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 },
};
