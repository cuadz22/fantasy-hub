const express = require('express');
const axios = require('axios');
const router = express.Router();
const { getValidToken } = require('./auth');

const YAHOO_API = 'https://fantasysports.yahooapis.com/fantasy/v2';

async function yahooRequest(session, path) {
  const token = await getValidToken(session);
  const res = await axios.get(`${YAHOO_API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    params: { format: 'json' },
  });
  return res.data;
}

function requireAuth(req, res, next) {
  if (!req.session.tokens) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const data = await yahooRequest(req.session, '/users;use_login=1/games;game_keys=nfl/leagues');
    const gamesData = data.fantasy_content.users[0].user[1].games;
    const leagues = [];
    for (let g = 0; g < gamesData.count; g++) {
      const game = gamesData[g].game;
      const leaguesData = game[1].leagues;
      for (let l = 0; l < leaguesData.count; l++) {
        const league = leaguesData[l].league[0];
        leagues.push({
          league_key: league.league_key,
          name: league.name,
          season: league.season,
          num_teams: league.num_teams,
          current_week: league.current_week,
          start_week: league.start_week,
          end_week: league.end_week,
        });
      }
    }
    res.json(leagues);
  } catch (err) {
    console.error('GET /api/leagues error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:leagueKey/standings', requireAuth, async (req, res) => {
  try {
    const data = await yahooRequest(req.session, `/league/${req.params.leagueKey}/standings`);
    const teamsData = data.fantasy_content.league[1].standings[0].teams;
    const standings = [];
    for (let t = 0; t < teamsData.count; t++) {
      const team = teamsData[t].team;
      const info = team[0];
      const s = team[2].team_standings;
      standings.push({
        rank: parseInt(s.rank),
        name: info[2].name,
        wins: parseInt(s.outcome_totals.wins),
        losses: parseInt(s.outcome_totals.losses),
        ties: parseInt(s.outcome_totals.ties),
        points_for: parseFloat(s.points_for || 0),
        points_against: parseFloat(s.points_against || 0),
      });
    }
    res.json(standings.sort((a, b) => a.rank - b.rank));
  } catch (err) {
    console.error('GET standings error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:leagueKey/matchups', requireAuth, async (req, res) => {
  const { week } = req.query;
  if (!week) return res.status(400).json({ error: 'week is required' });
  try {
    const data = await yahooRequest(req.session, `/league/${req.params.leagueKey}/scoreboard;week=${week}`);
    const matchupsData = data.fantasy_content.league[1].scoreboard[0].matchups;
    const matchups = [];
    for (let m = 0; m < matchupsData.count; m++) {
      const matchup = matchupsData[m].matchup;
      const teams = matchup[0].teams;
      const tA = teams[0].team;
      const tB = teams[1].team;
      matchups.push({
        week: matchup.week,
        status: matchup.status,
        teamA: {
          team_key: tA[0][0].team_key,
          name: tA[0][2].name,
          score: parseFloat(tA[1].team_points?.total || 0),
          projected: parseFloat(tA[1].team_projected_points?.total || 0),
        },
        teamB: {
          team_key: tB[0][0].team_key,
          name: tB[0][2].name,
          score: parseFloat(tB[1].team_points?.total || 0),
          projected: parseFloat(tB[1].team_projected_points?.total || 0),
        },
      });
    }
    res.json(matchups);
  } catch (err) {
    console.error('GET matchups error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:leagueKey/schedule', requireAuth, async (req, res) => {
  try {
    const data = await yahooRequest(req.session, `/league/${req.params.leagueKey}/settings`);
    const settings = data.fantasy_content.league[0];
    res.json({
      startWeek: parseInt(settings.start_week),
      endWeek: parseInt(settings.end_week),
      currentWeek: parseInt(settings.current_week),
    });
  } catch (err) {
    console.error('GET schedule error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
