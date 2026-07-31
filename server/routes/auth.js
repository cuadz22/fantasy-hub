require('dotenv').config();
const express = require('express');
const { OAuth } = require('oauth');
const jwt = require('jsonwebtoken');
const router = express.Router();

const CLIENT_ID = process.env.YAHOO_CLIENT_ID;
const CLIENT_SECRET = process.env.YAHOO_CLIENT_SECRET;
const REDIRECT_URI = process.env.YAHOO_REDIRECT_URI;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.SESSION_SECRET;

const oauth = new OAuth(
  'https://api.login.yahoo.com/oauth/v2/get_request_token',
  'https://api.login.yahoo.com/oauth/v2/get_token',
  CLIENT_ID,
  CLIENT_SECRET,
  '1.0A',
  REDIRECT_URI,
  'HMAC-SHA1'
);

let requestTokenStore = {};

function getTokensFromCookie(req) {
  const cookie = req.cookies?.fantasy_token;
  if (!cookie) return null;
  try {
    return jwt.verify(cookie, JWT_SECRET);
  } catch {
    return null;
  }
}

router.get('/login', (req, res) => {
  oauth.getOAuthRequestToken((err, requestToken, requestTokenSecret) => {
    if (err) {
      console.error('Request token error:', err);
      return res.redirect(`${CLIENT_URL}?error=request_token_failed`);
    }
    requestTokenStore[requestToken] = requestTokenSecret;
    res.redirect(`https://api.login.yahoo.com/oauth/v2/request_auth?oauth_token=${requestToken}`);
  });
});

router.get('/callback', (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  console.log('OAuth 1.0a callback — token:', oauth_token ? 'received' : 'missing');

  if (!oauth_token || !oauth_verifier) {
    return res.redirect(`${CLIENT_URL}?error=auth_failed`);
  }

  const requestTokenSecret = requestTokenStore[oauth_token];
  if (!requestTokenSecret) {
    return res.redirect(`${CLIENT_URL}?error=token_not_found`);
  }

  oauth.getOAuthAccessToken(
    oauth_token,
    requestTokenSecret,
    oauth_verifier,
    (err, accessToken, accessTokenSecret) => {
      if (err) {
        console.error('Access token error:', err);
        return res.redirect(`${CLIENT_URL}?error=token_failed`);
      }

      delete requestTokenStore[oauth_token];

      const tokens = {
        access_token: accessToken,
        access_token_secret: accessTokenSecret,
        expires_at: Date.now() + 3600 * 1000,
      };

      const token = jwt.sign(tokens, JWT_SECRET, { expiresIn: '7d' });
      console.log('OAuth 1.0a token exchange successful');
      res.redirect(`${CLIENT_URL}?token=${token}`);
    }
  );
});

router.post('/store-token', express.json(), (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'No token provided' });
  try {
    jwt.verify(token, JWT_SECRET);
    res.cookie('fantasy_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Invalid token' });
  }
});

function getValidToken(req) {
  const tokens = getTokensFromCookie(req);
  if (!tokens) throw new Error('Not authenticated');
  return { accessToken: tokens.access_token, accessTokenSecret: tokens.access_token_secret };
}

router.get('/status', (req, res) => {
  const tokens = getTokensFromCookie(req);
  res.json({ connected: !!tokens });
});

router.get('/logout', (req, res) => {
  res.clearCookie('fantasy_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  res.redirect(CLIENT_URL);
});

module.exports = router;
module.exports.getValidToken = getValidToken;
module.exports.getTokensFromCookie = getTokensFromCookie;
module.exports.oauth = oauth;
