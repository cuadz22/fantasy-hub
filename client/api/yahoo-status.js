// Public, non-secret check: is Yahoo connected, and which NFL leagues are visible? No tokens or keys are returned.
const { json, yahooGet } = require('./_yahoo');
module.exports = async (req, res) => {
  try {
    const d = await yahooGet('users;use_login=1/games;game_codes=nfl/leagues');
    const out = [];
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      if (o.league_key && o.name) out.push({ league_key: o.league_key, name: o.name, season: o.season, current_week: o.current_week, num_teams: o.num_teams });
      for (const k of Object.keys(o)) walk(o[k]);
    };
    walk(d);
    json(res, 200, { connected: true, leagues: out });
  } catch (e) { json(res, e.message === 'not_connected' ? 200 : 500, { connected: false, error: String(e.message || e).slice(0, 200) }); }
};
