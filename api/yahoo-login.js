// Visit /api/yahoo/login?key=YOUR_ADMIN_KEY once to connect the owner's Yahoo account.
const { REDIRECT, json, sign, adminOk } = require('./_yahoo');
module.exports = (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (!adminOk(u.searchParams.get('key'))) return json(res, 403, { error: 'forbidden' });
  if (!process.env.YAHOO_CLIENT_ID) return json(res, 500, { error: 'YAHOO_CLIENT_ID not set' });
  const ts = String(Date.now());
  const state = ts + '.' + sign('state:' + ts);
  const q = new URLSearchParams({ client_id: process.env.YAHOO_CLIENT_ID, redirect_uri: REDIRECT, response_type: 'code', scope: 'fspt-r', state });
  res.statusCode = 302; res.setHeader('Location', 'https://api.login.yahoo.com/oauth2/request_auth?' + q.toString()); res.end();
};
