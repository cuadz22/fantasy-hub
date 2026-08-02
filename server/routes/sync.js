const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'leagues.json');

// Make sure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// Initialize data file if it doesn't exist
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

// POST /api/sync — receive data from Chrome extension
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

  console.log(`Synced ${leagueId}: ${standings?.length} teams, ${matchups?.length} matchups`);
  res.json({ success: true, leagueId, teams: standings?.length, matchups: matchups?.length });
});

// GET /api/sync/:leagueId — get synced data for a league
router.get('/:leagueId', (req, res) => {
  const data = readData();
  const league = data[req.params.leagueId];
  if (!league) return res.status(404).json({ error: 'No data synced yet for this league' });
  res.json(league);
});

// GET /api/sync — get all synced data
router.get('/', (req, res) => {
  const data = readData();
  res.json(data);
});

module.exports = router;
