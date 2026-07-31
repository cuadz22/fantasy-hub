const express = require('express');
const router = express.Router();
const { getTokensFromCookie } = require('./auth');

router.get('/token-check', (req, res) => {
  const tokens = getTokensFromCookie(req);
  res.json({
    has_cookie: !!req.cookies?.fantasy_token,
    is_valid: !!tokens,
    expires_at: tokens?.expires_at ? new Date(tokens.expires_at).toISOString() : null,
    token_preview: tokens?.access_token ? tokens.access_token.substring(0, 20) + '...' : null,
  });
});

module.exports = router;
