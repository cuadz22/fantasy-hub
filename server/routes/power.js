const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const WEEKLY_SCORES_FILE = path.join(__dirname, '../data/weekly-scores.json');
const LEAGUES_FILE = path.join(__dirname, '../data/leagues.json');
const RANKINGS_HISTORY_FILE = path.join(__dirname, '../data/power-rankings-history.json');

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) return {};
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return {}; }
}

function writeJSON(file, data) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function normalize(value, min, max) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function computePowerRankings(leagueId) {
  const weeklyData = readJSON(WEEKLY_SCORES_FILE);
  const leaguesData = readJSON(LEAGUES_FILE);
  const historyData = readJSON(RANKINGS_HISTORY_FILE);

  const leagueWeekly = weeklyData[leagueId] || {};
  const leagueStandings = leaguesData[leagueId]?.standings || [];

  if (leagueStandings.length === 0) return [];

  const weeks = Object.keys(leagueWeekly).map(Number).sort((a, b) => a - b);

  const teamStats = {};
  leagueStandings.forEach(team => {
    teamStats[team.name] = {
      name: team.name,
      wins: team.wins || 0,
      losses: team.losses || 0,
      ties: team.ties || 0,
      pointsFor: team.points_for || 0,
      pointsAgainst: team.points_against || 0,
      allPlayWins: 0,
      allPlayLosses: 0,
      weeklyResults: [],
      streak: 0,
      recentWins: 0,
      recentGames: 0,
      recentForm: 0.5,
    };
  });

  weeks.forEach(week => {
    const weekData = leagueWeekly[week];
    if (!weekData || !weekData.scores) return;

    const scores = weekData.scores;
    const matchups = weekData.matchups || [];
    const teamNames = Object.keys(scores);

    teamNames.forEach(teamName => {
      if (!teamStats[teamName]) return;
      const myScore = scores[teamName];
      let apW = 0, apL = 0;
      teamNames.forEach(other => {
        if (other === teamName) return;
        if (myScore > scores[other]) apW++;
        else apL++;
      });
      teamStats[teamName].allPlayWins += apW;
      teamStats[teamName].allPlayLosses += apL;
    });

    matchups.forEach(({ home, away }) => {
      if (!teamStats[home] || !teamStats[away]) return;
      const homeScore = scores[home] || 0;
      const awayScore = scores[away] || 0;
      teamStats[home].weeklyResults.push(homeScore >= awayScore ? 'W' : 'L');
      teamStats[away].weeklyResults.push(awayScore > homeScore ? 'W' : 'L');
    });
  });

  Object.values(teamStats).forEach(team => {
    const results = team.weeklyResults;
    const recent = results.slice(-3);
    team.recentWins = recent.filter(r => r === 'W').length;
    team.recentGames = recent.length;
    team.recentForm = team.recentGames > 0 ? team.recentWins / team.recentGames : 0.5;

    if (results.length > 0) {
      const lastResult = results[results.length - 1];
      let streak = 0;
      for (let i = results.length - 1; i >= 0; i--) {
        if (results[i] === lastResult) streak++;
        else break;
      }
      team.streak = lastResult === 'W' ? streak : -streak;
    }
  });

  const pfValues = Object.values(teamStats).map(t => t.pointsFor);
  const paValues = Object.values(teamStats).map(t => t.pointsAgainst);
  const minPF = Math.min(...pfValues), maxPF = Math.max(...pfValues);
  const minPA = Math.min(...paValues), maxPA = Math.max(...paValues);

  const teams = Object.values(teamStats).map(team => {
    const totalGames = team.wins + team.losses + team.ties;
    const actualWinPct = totalGames > 0 ? (team.wins + team.ties * 0.5) / totalGames : 0.5;
    const totalAllPlay = team.allPlayWins + team.allPlayLosses;
    const allPlayWinPct = totalAllPlay > 0 ? team.allPlayWins / totalAllPlay : 0.5;
    const normPF = normalize(team.pointsFor, minPF, maxPF);
    const normPA = normalize(team.pointsAgainst, minPA, maxPA);

    const baseScore =
      allPlayWinPct * 0.30 +
      normPF        * 0.25 +
      team.recentForm * 0.15 +
      actualWinPct  * 0.15 +
      normPA        * 0.15;

    const streakMultiplier = 1 + Math.max(-0.15, Math.min(0.15, team.streak * 0.03));
    const powerScore = baseScore * streakMultiplier;

    return {
      name: team.name,
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      pointsFor: team.pointsFor,
      pointsAgainst: team.pointsAgainst,
      allPlayWins: team.allPlayWins,
      allPlayLosses: team.allPlayLosses,
      streak: team.streak,
      recentForm: `${team.recentWins}-${team.recentGames - team.recentWins}`,
      powerScore: Math.round(powerScore * 1000) / 10,
      hasWeeklyData: weeks.length > 0,
    };
  });

  teams.sort((a, b) => b.powerScore - a.powerScore);

  const prevRankings = historyData[leagueId] || {};
  teams.forEach((team, i) => {
    team.rank = i + 1;
    const prevRank = prevRankings[team.name];
    team.rankChange = prevRank != null ? prevRank - team.rank : null;
  });

  const newHistory = {};
  teams.forEach(team => { newHistory[team.name] = team.rank; });
  const allHistory = readJSON(RANKINGS_HISTORY_FILE);
  allHistory[leagueId] = newHistory;
  writeJSON(RANKINGS_HISTORY_FILE, allHistory);

  return teams;
}

router.get('/:leagueId', (req, res) => {
  try {
    const rankings = computePowerRankings(req.params.leagueId);
    res.json({ rankings, count: rankings.length });
  } catch (err) {
    console.error('Power rankings error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;