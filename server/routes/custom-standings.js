const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const WEEKLY_SCORES_FILE = path.join(__dirname, '../data/weekly-scores.json');
const LEAGUES_FILE = path.join(__dirname, '../data/leagues.json');

const CUSTOM_SCORING = {
  'shoot-the-shits': {
    winPoints: 4,
    topScorerPoints: 3,
    topScorerCount: 6,
  },
};

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) return {};
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return {}; }
}

function computeCustomStandings(leagueId) {
  const config = CUSTOM_SCORING[leagueId];
  if (!config) return null;

  const weeklyData = readJSON(WEEKLY_SCORES_FILE);
  const leaguesData = readJSON(LEAGUES_FILE);

  const leagueWeekly = weeklyData[leagueId] || {};
  const leagueStandings = leaguesData[leagueId]?.standings || [];
  const weeks = Object.keys(leagueWeekly).map(Number).sort((a, b) => a - b);

  const teamStats = {};
  leagueStandings.forEach(team => {
    teamStats[team.name] = {
      name: team.name,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      customPoints: 0,
      winPointsEarned: 0,
      highScorePointsEarned: 0,
      highScoreWeeks: 0,
      hasWeeklyData: weeks.length > 0,
    };
  });

  weeks.forEach(week => {
    const weekData = leagueWeekly[week];
    if (!weekData || !weekData.scores) return;

    const scores = weekData.scores;
    const matchups = weekData.matchups || [];

    Object.keys(scores).forEach(name => {
      if (!teamStats[name]) {
        teamStats[name] = {
          name, wins: 0, losses: 0, pointsFor: 0,
          customPoints: 0, winPointsEarned: 0,
          highScorePointsEarned: 0, highScoreWeeks: 0, hasWeeklyData: true,
        };
      }
      teamStats[name].pointsFor += scores[name] || 0;
    });

    matchups.forEach(({ home, away }) => {
      if (!teamStats[home] || !teamStats[away]) return;
      const homeScore = scores[home] || 0;
      const awayScore = scores[away] || 0;
      if (homeScore > awayScore) {
        teamStats[home].wins++;
        teamStats[home].winPointsEarned += config.winPoints;
        teamStats[home].customPoints += config.winPoints;
        teamStats[away].losses++;
      } else if (awayScore > homeScore) {
        teamStats[away].wins++;
        teamStats[away].winPointsEarned += config.winPoints;
        teamStats[away].customPoints += config.winPoints;
        teamStats[home].losses++;
      } else {
        teamStats[home].winPointsEarned += 2;
        teamStats[home].customPoints += 2;
        teamStats[away].winPointsEarned += 2;
        teamStats[away].customPoints += 2;
      }
    });

    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    sorted.forEach(([teamName], idx) => {
      if (!teamStats[teamName]) return;
      if (idx < config.topScorerCount) {
        teamStats[teamName].highScorePointsEarned += config.topScorerPoints;
        teamStats[teamName].customPoints += config.topScorerPoints;
        teamStats[teamName].highScoreWeeks++;
      }
    });
  });

  if (weeks.length === 0) {
    leagueStandings.forEach(team => {
      if (!teamStats[team.name]) return;
      teamStats[team.name].wins = team.wins || 0;
      teamStats[team.name].losses = team.losses || 0;
      teamStats[team.name].pointsFor = team.points_for || 0;
      teamStats[team.name].winPointsEarned = (team.wins || 0) * config.winPoints;
      teamStats[team.name].customPoints = teamStats[team.name].winPointsEarned;
    });
  }

  const teams = Object.values(teamStats).sort((a, b) => {
    if (b.customPoints !== a.customPoints) return b.customPoints - a.customPoints;
    return b.pointsFor - a.pointsFor;
  });

  teams.forEach((team, i) => { team.rank = i + 1; });

  return { teams, hasWeeklyData: weeks.length > 0, config };
}

router.get('/:leagueId', (req, res) => {
  const { leagueId } = req.params;
  if (!CUSTOM_SCORING[leagueId]) {
    return res.status(404).json({ error: 'No custom scoring configured for this league' });
  }
  try {
    const result = computeCustomStandings(leagueId);
    res.json(result);
  } catch (err) {
    console.error('Custom standings error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;