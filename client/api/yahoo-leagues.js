// Test endpoint: lists the connected account's NFL leagues. /api/yahoo/leagues?key=ADMIN_KEY
const { json, adminOk, yahooGet } = require('./_yahoo');
module.exports = async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    if (!adminOk(u.searchParams.get('key'))) return json(res, 403, { error: 'forbidden' });
    const d = await yahooGet('users;use_login=1/games;game_codes=nfl/leagues');
    json(res, 200, d);
  } catch (e) { json(res, e.message === 'not_connected' ? 409 : 500, { error: String(e.message || e) }); }
};
