const express = require('express');
const router = express.Router();
const { getValidToken, getTokensFromCookie, oauth } = require('./auth');

const YAHOO_API = 'https://fantasysports.yahooapis.com/fantasy/v2';

function yahooRequest(accessToken, accessTokenSecret, path) {
  return new Promise((resolve, reject) => {
    oauth.get(
      `${YAHOO_API}${path}?format=json`,
      accessToken,
      accessTokenSecret,
      (err, data) => {
        if (err) return reject(err);
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

function requireAuth(req, res, next) {
  if (!getTokensFromCookie(req)) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

router.get('/top', requireAuth, async (req, res) => {
  const { teamKey, week, limit = 5 } = req.query;
  if (!teamKey || !week) return res.status(400).json({ error: 'teamKey and week required' });
  try {
    const { accessToken, accessTokenSecret } = getValidToken(req);
    const data = await yahooRequest(accessToken, accessTokenSecret, `/team/${teamKey}/roster;week=${week}/players/stats;type=week;week=${week}`);
    const playersData = data.fantasy_content.team[1].roster[0].players;
    const players = [];
    for (let p = 0; p < playersData.count; p++) {
      const player = playersData[p].player;
      const info = player[0];
      const stats = player[1];
      const position = info.find(i => i?.selected_position)?.selected_position[1]?.position;
      if (position === 'BN' || position === 'IR') continue;
      const pts = parseFloat(stats?.player_points?.total || 0);
      const pos = info.find(i => i?.display_position)?.display_position || position;
      const first = info.find(i => i?.name)?.name?.first || '';
      const last = info.find(i => i?.name)?.name?.last || '';
      players.push({ name: `${first[0]}. ${last}`, pos, pts });
    }
    res.json(players.sort((a, b) => b.pts - a.pts).slice(0, parseInt(limit)));
  } catch (err) {
    console.error('GET /api/players/top error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/matchup', requireAuth, async (req, res) => {
  const { teamKeyA, teamKeyB, week, limit = 5 } = req.query;
  if (!teamKeyA || !teamKeyB || !week) return res.status(400).json({ error: 'teamKeyA, teamKeyB and week required' });
  try {
    const { accessToken, accessTokenSecret } = getValidToken(req);
    const [resA, resB] = await Promise.all([
      yahooRequest(accessToken, accessTokenSecret, `/team/${teamKeyA}/roster;week=${week}/players/stats;type=week;week=${week}`),
      yahooRequest(accessToken, accessTokenSecret, `/team/${teamKeyB}/roster;week=${week}/players/stats;type=week;week=${week}`),
    ]);
    function extractPlayers(data, lim) {
      const playersData = data.fantasy_content.team[1].roster[0].players;
      const players = [];
      for (let p = 0; p < playersData.count; p++) {
        const player = playersData[p].player;
        const info = player[0];
        const stats = player[1];
        const position = info.find(i => i?.selected_position)?.selected_position[1]?.position;
        if (position === 'BN' || position === 'IR') continue;
        const pts = parseFloat(stats?.player_points?.total || 0);
        const pos = info.find(i => i?.display_position)?.display_position || position;
        const first = info.find(i => i?.name)?.name?.first || '';
        const last = info.find(i => i?.name)?.name?.last || '';
        players.push({ name: `${first[0]}. ${last}`, pos, pts });
      }
      return players.sort((a, b) => b.pts - a.pts).slice(0, lim);
    }
    res.json({
      playersA: extractPlayers(resA, parseInt(limit)),
      playersB: extractPlayers(resB, parseInt(limit)),
    });
  } catch (err) {
    console.error('GET /api/players/matchup error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
