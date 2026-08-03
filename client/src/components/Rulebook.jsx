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
        ],
      },
      {
        title: 'Keepers',
        content: [
          { text: 'Each team keeps 2 players every year.' },
          { text: 'Keepers are slotted in rounds 15 and 16 of the draft.' },
          { text: 'Keeper picks (rounds 15 & 16) cannot be traded under any circumstances.' },
          { text: 'Keepers must be submitted one week before draft day. If not submitted in time, the commissioner will select the 2 highest ranked players on the roster based on Yahoo Rankings.' },
          {
            text: 'Anti-rental rule: If Team A trades a player to Team B, Team A cannot receive that player back directly from Team B. The player must pass through at least one additional team (Team C) before returning to Team A.',
            highlight: true,
          },
        ],
      },
      {
        title: 'Draft',
        content: [
          { text: 'The draft order is determined via the website we have always used, unless other ideas are suggested. Keepers are due one week before draft day, and draft order is determined 5 days before draft day. Draft date is TBD and will be updated on the site when agreed on by the league.' },
          { text: 'Rounds 15 and 16 are reserved for keepers and cannot be traded under any circumstances.' },
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
          {
            text: "Can't Cut List rule: A player on Yahoo's official Can't Cut List cannot be included in any trade that involves draft picks, unless both sides of the trade include a Can't Cut List player. Both players must be on the Can't Cut List at the time the trade is accepted — not just when it is proposed.",
            changelog: [
              { date: 'Through 2021', note: "Can't Cut players could not be involved in any trade that included draft picks under any circumstances." },
              { date: '2022 season (8/12/22)', note: "Rule updated: Can't Cut players CAN be traded in a deal involving picks, as long as BOTH sides of the trade include a Can't Cut List player at the time the trade is accepted. Example: Team A has Hopkins (Can't Cut) + 3rd round pick. Team B has Jefferson (Can't Cut) + 7th round pick. This trade is ALLOWED because both players are on the Can't Cut list at the time of acceptance. Trading a Can't Cut player for picks alone remains NOT allowed." },
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
        title: 'Roster',
        content: [
          { text: '1 QB — Quarterback' },
          { text: '2 RB — Running Backs' },
          { text: '3 WR — Wide Receivers' },
          { text: '1 TE — Tight End' },
          { text: '1 FLEX — WR/RB/TE' },
          { text: '1 SUPERFLEX — QB/WR/RB/TE (any position)' },
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
          { text: 'Kicker fractional points — field goal points are calculated based on distance (e.g. a 39-yard field goal = 3.9 points)' },
          {
            text: 'SUPERFLEX slot added in 2021 to replace the 2nd QB slot, giving teams more roster flexibility and reducing QB hoarding on the waiver wire.',
            changelog: [
              { date: '2020 season', note: '2nd QB slot was used, but caused issues with QB scarcity on the waiver wire.' },
              { date: '2021 season', note: '2nd QB slot replaced with SUPERFLEX (Q/W/R/T) — any position can start in this slot.' },
            ],
          },
        ],
      },
      {
        title: 'Keepers',
        content: [
          { text: 'Each team keeps 2 players every year.' },
          { text: 'A player is kept for the round they were originally drafted or acquired, with a round penalty applied each year they are kept.' },
          { text: 'The round penalty increases by 2 rounds per year of keeping. Example: If a player was drafted in round 4, keeping them costs a round 4 pick Year 1, round 2 pick Year 2, and round 1 pick Year 3.' },
          { text: 'Players drafted in the top 2 rounds cannot be kept.' },
          { text: 'A player can only be kept by the same owner for a maximum of 3 years. After 3 years they must be released.' },
          { text: 'Free agent pickups can be kept for an 8th round pick.' },
          { text: 'If a player is traded, the round penalty resets based on the round cost of the pick used in the trade.' },
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
          { text: 'Trade deadline: Week 11 at 11:59pm.' },
          {
            text: "Can't Cut List rule: A player on Yahoo's official Can't Cut List cannot be included in any trade that involves draft picks, unless both sides of the trade include a Can't Cut List player. Both players must be on the Can't Cut List at the time the trade is accepted — not just when it is proposed. This rule has been implemented to continue to add balance to the league wherever possible.",
            changelog: [
              { date: 'Through 2024', note: "One Can't Cut player could be traded with only picks, with no requirement for the other side to include a Can't Cut player." },
              { date: '2025 season', note: "Rule updated: Can't Cut players CAN be traded in a deal involving picks, as long as BOTH sides of the trade include a Can't Cut List player at the time the trade is accepted. Trading a Can't Cut player for picks alone is no longer allowed." },
            ],
          },
        ],
      },
      {
        title: 'Playoffs',
        content: [
          { text: 'Top 6 teams qualify for the playoffs.' },
          { text: 'Seeds 1 and 2 receive a first-round bye (Week 15).' },
          { text: 'Playoffs use reseeding — after each round, remaining teams are reseeded so the highest remaining seed always plays the lowest remaining seed.' },
          { text: 'Playoffs run Weeks 15, 16, and 17.' },
          { text: 'Championship game is played in Week 17.' },
        ],
      },
      {
        title: 'Fees & Payouts',
        content: [
          {
            text: 'Buy-in: $200 per team, due by draft day.',
            changelog: [
              { date: '2021 season', note: 'Buy-in was $125. Payouts: 1st $1,250 / 2nd $300 / Points Leader $250.' },
              { date: 'Previous season', note: 'Buy-in was $175.' },
              { date: 'Current', note: 'Buy-in increased to $200. Payouts: 1st $1,800 / 2nd $400 / Points Leader $200.' },
            ],
          },
          { text: '1st Place (Champion): $1,800 — 9× buy-in' },
          { text: '2nd Place: $400 — 2× buy-in' },
          { text: 'Regular Season Points Leader: $200 — 1× buy-in' },
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