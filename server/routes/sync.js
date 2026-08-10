const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'leagues.json');
const WEEKLY_SCORES_FILE = path.join(__dirname, '..', 'data', 'weekly-scores.json');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function readWeeklyScores() {
  try {
    if (!fs.existsSync(WEEKLY_SCORES_FILE)) return {};
    return JSON.parse(fs.readFileSync(WEEKLY_SCORES_FILE, 'utf8'));
  } catch { return {}; }
}

function writeWeeklyScores(data) {
  fs.writeFileSync(WEEKLY_SCORES_FILE, JSON.stringify(data, null, 2));
}

router.post('/', express.json(), (req, res) => {
  const { leagueId, standings, matchups, week, syncedAt } = req.body;

  if (!leagueId) return res.status(400).json({ error: 'leagueId required' });

  const data = readData();

  data[leagueId] = {
    leagueId,
    standings: standings || [],
    matchups: matchups || [],
    week: week || null,
    syncedAt: syncedAt || new Date().toISOString(),
  };

  writeData(data);

  if (week && matchups && matchups.length > 0) {
    const weeklyScores = readWeeklyScores();
    if (!weeklyScores[leagueId]) weeklyScores[leagueId] = {};

    const weekScores = {};
    const weekMatchups = [];
    matchups.forEach(m => {
      if (m.teamA && m.teamB) {
        weekScores[m.teamA.name] = m.teamA.score;
        weekScores[m.teamB.name] = m.teamB.score;
        weekMatchups.push({ home: m.teamA.name, away: m.teamB.name });
      }
    });

    weeklyScores[leagueId][week] = { scores: weekScores, matchups: weekMatchups };
    writeWeeklyScores(weeklyScores);
  }

  console.log(`Synced ${leagueId}: ${standings?.length} teams, ${matchups?.length} matchups`);
  res.json({ success: true, leagueId, teams: standings?.length, matchups: matchups?.length });
});

router.get('/:leagueId', (req, res) => {
  const data = readData();
  const league = data[req.params.leagueId];
  if (!league) return res.status(404).json({ error: 'No data synced yet for this league' });
  res.json(league);
});

router.get('/', (req, res) => {
  const data = readData();
  res.json(data);
});

module.exports = router;