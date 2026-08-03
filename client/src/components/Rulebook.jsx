const RULEBOOKS = {
  'beaners-husseins': {
    sections: [
      {
        title: 'Roster',
        content: [
          { text: '1 QB — Quarterback' },
          { text: '2 RB — Running Backs' },
          { text: '3 WR — Wide Receivers' },
          { text: '1 TE — Tight End' },
          { text: '1 FLEX — WR/RB/TE' },
          { text: '1 K — Kicker' },
          { text: '1 DEF — Defense/Special Teams' },
          { text: '6 BN — Bench spots' },
          { text: '1 IR — Injured Reserve' },
        ],
      },
      {
        title: 'Scoring',
        content: [
          { text: 'PPR — 1 point per reception' },
          { text: '6 points per passing touchdown' },
          { text: '-1 point per interception thrown' },
          { text: 'Standard Yahoo scoring for all other categories' },
        ],
      },
      {
        title: 'Keepers',
        content: [
          { text: 'Each team keeps 2 players every year.' },
          { text: 'Keepers are slotted in rounds 15 and 16 of the draft.' },
          { text: 'Keeper picks (rounds 15 & 16) cannot be traded under any circumstances.' },
      
          
          { text: 'Keepers must be submitted before the deadline. If not submitted in time, the commissioner will select the 2 highest ranked players on the roster based on Yahoo Rankings.' },
          {
            text: 'Anti-rental rule: If Team A trades a player to Team B, Team A cannot receive that player back directly from Team B. The player must pass through at least one additional team (Team C) before returning to Team A.',
            highlight: true,
          },
        ],
      },
      {
        title: 'Draft',
        content: [
          { text: 'Snake draft format. Draft order is determined randomly and released once keepers are submitted and fees are collected.' },
          { text: 'Rounds 15 and 16 are reserved for keepers and cannot be traded under any circumstances.' },
          { text: 'Draft picks for rounds 1–14 are eligible for trade until the draft locks (the day before the draft at 11:59pm).' },
          {
            text: 'There are NO redos or undos during the draft under any circumstance. Double check your selection before clicking Draft. The same way you are responsible for players you drop, you are responsible for players you draft.',
            highlight: true,
          },
        ],
      },
      {
        title: 'Waivers & Free Agents',
        content: [
          { text: 'Each team starts the season with a $100 FAAB (Free Agent Acquisition Budget).' },
          { text: 'FAAB budget can be included in trades. Since Yahoo does not support FAAB trades, note the FAAB amount in the trade comments and notify the commissioner, who will adjust totals manually.' },
          { text: 'Once the playoffs begin, only playoff teams may use FAAB for waiver claims. Non-playoff teams may still add free agents.' },
          {
            text: 'If you accidentally drop a player, they will NOT be returned to your team under any circumstance. Double check before dropping.',
            highlight: true,
          },
        ],
      },
      {
        title: 'Trades',
        content: [
          { text: 'All trades are pushed through by the commissioner. A trade will always be approved unless there is a suspicion of collusion.' },
          {
            text: 'If a trade is suspected of collusion, it will be reviewed by the league. 6 out of 10 active members must vote to approve the trade for it to go through.',
            highlight: true,
          },
          {
            text: 'Trade deadline: Week 12 at 11:59pm.',
            changelog: [
              { date: 'Through 2024', note: 'Trade deadline was the day before playoffs (end of Week 14).' },
              { date: '2025 season', note: 'Trade deadline moved to Week 12 at 11:59pm.' },
            ],
          },
          { text: 'Draft picks (rounds 1–14) are eligible for trade until 11:59pm the day before the draft. Once locked, no picks may be swapped.' },
          {
            text: "Can't Cut List rule: A player on Yahoo's official Can't Cut List at the time of the trade cannot be included in any trade that involves draft picks, unless both sides of the trade include a Can't Cut List player.",
            changelog: [
              { date: 'Through 2021', note: "Can't Cut players could not be involved in any trade that included draft picks under any circumstances." },
              { date: '2022 season (8/12/22)', note: "Rule updated: Can't Cut players CAN be traded in a deal involving picks, as long as BOTH sides of the trade include a Can't Cut List player. Example: Team A has Hopkins (Can't Cut) + 3rd round pick. Team B has Jefferson (Can't Cut) + 7th round pick. This trade is ALLOWED because both players are on the Can't Cut list. Trading a Can't Cut player for picks alone remains NOT allowed." },
            ],
          },
        ],
      },
      {
        title: 'Playoffs',
        content: [
          { text: 'Top 6 teams qualify for the playoffs.' },
          { text: 'Seeds 1 and 2 receive a first-round bye (Week 15).' },
          { text: 'No reseeding — bracket is set at the start of playoffs and does not change.' },
          { text: 'Playoffs run Weeks 15, 16, and 17.' },
          { text: 'Championship game is played in Week 17.' },
        ],
      },
      {
        title: 'Fees & Payouts',
        content: [
          {
            text: 'Buy-in: $225 per team, due by draft day.',
            changelog: [
              { date: '2019 season', note: 'Buy-in was $125. Payouts: 1st $1,000 / 2nd $250 / Points Leader $250.' },
              { date: '2022 season (8/12/22)', note: 'Buy-in increased to $175. Payouts: 1st $1,400 / 2nd $375 / Points Leader $325.' },
              { date: 'Current', note: 'Buy-in increased to $225. Payouts: 1st $2,025 / 2nd $450 / Points Leader $225.' },
            ],
          },
          { text: '1st Place (Champion): $2,025 — 9× buy-in' },
          { text: '2nd Place: $450 — 2× buy-in' },
          { text: 'Regular Season Points Leader: $225 — 1× buy-in' },
          {
            text: 'Last place must purchase the championship ring for the winner (minimum $80 value).',
            highlight: true,
          },
        ],
      },
    ],
  },
  'rebirth': {
    sections: [
      {
        title: 'Rules',
        content: [
          { text: 'Rebirth rulebook coming soon.' },
        ],
      },
    ],
  },
  'gentlemens-league': {
    sections: [
      {
        title: 'Rules',
        content: [
          { text: "Gentlemen's League rulebook coming soon." },
        ],
      },
    ],
  },
  'shoot-the-shits': {
    sections: [
      {
        title: 'Rules',
        content: [
          { text: 'Shoot the Shits rulebook coming soon.' },
        ],
      },
    ],
  },
};

export default function Rulebook({ leagueId }) {
  const rulebook = RULEBOOKS[leagueId];
  if (!rulebook) return null;

  return (
    <div style={styles.wrap}>
      {rulebook.sections.map((section, i) => (
        <div key={i} style={styles.section}>
          <h2 style={styles.sectionTitle}>{section.title}</h2>
          <div style={styles.rules}>
            {section.content.map((rule, j) => (
              <div key={j}>
                <div style={{
                  ...styles.rule,
                  ...(rule.highlight ? styles.ruleHighlight : {}),
                }}>
                  {rule.highlight && <span style={styles.highlightDot}>!</span>}
                  <span>{rule.text}</span>
                </div>
                {rule.changelog && (
                  <div style={styles.changelog}>
                    {rule.changelog.map((c, k) => (
                      <div key={k} style={styles.changelogEntry}>
                        <span style={styles.changelogDate}>{c.date}</span>
                        <span style={styles.changelogNote}>{c.note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 36 },
  section: { display: 'flex', flexDirection: 'column', gap: 12 },
  sectionTitle: { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 400, marginBottom: 4 },
  rules: { display: 'flex', flexDirection: 'column', gap: 10 },
  rule: { fontSize: 13, color: 'var(--text)', lineHeight: 1.6, paddingLeft: 12, borderLeft: '2px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 8 },
  ruleHighlight: { borderLeft: '2px solid var(--red)', color: 'var(--text)' },
  highlightDot: { color: 'var(--red)', fontWeight: 700, fontSize: 14, lineHeight: 1.6, flexShrink: 0 },
  changelog: { marginLeft: 12, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12, borderLeft: '1px dashed #333' },
  changelogEntry: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  changelogDate: { fontSize: 10, color: 'var(--red)', letterSpacing: '0.05em', whiteSpace: 'nowrap', marginTop: 2, minWidth: 120 },
  changelogNote: { fontSize: 11, color: '#555', lineHeight: 1.5 },
};