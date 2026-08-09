const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '../data/keepers.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

function readData() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

router.get('/:leagueId', (req, res) => {
  const { leagueId } = req.params;
  const data = readData();
  res.json(data[leagueId] || {});
});

router.post('/:leagueId', (req, res) => {
  const { leagueId } = req.params;
  const { owner, keepers } = req.body;

  if (!owner || !Array.isArray(keepers)) {
    return res.status(400).json({ error: 'owner and keepers array required' });
  }

  if (keepers.length > 3) {
    return res.status(400).json({ error: 'Maximum 3 keepers allowed' });
  }

  const data = readData();
  if (!data[leagueId]) data[leagueId] = {};

  data[leagueId][owner] = {
    keepers,
    submittedAt: new Date().toISOString(),
  };

  writeData(data);
  res.json({ success: true, submission: data[leagueId][owner] });
});

router.delete('/:leagueId/all', (req, res) => {
  const { leagueId } = req.params;
  const data = readData();
  data[leagueId] = {};
  writeData(data);
  res.json({ success: true });
});

router.delete('/:leagueId/:owner', (req, res) => {
  const { leagueId, owner } = req.params;
  const data = readData();
  if (data[leagueId] && data[leagueId][owner]) {
    delete data[leagueId][owner];
    writeData(data);
  }
  res.json({ success: true });
});

module.exports = router;