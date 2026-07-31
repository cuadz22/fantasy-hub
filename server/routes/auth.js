require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

const CLIENT_ID = process.env.YAHOO_CLIENT_ID;
const CLIENT_SECRET = process.env.YAHOO_CLIENT_SECRET;
const REDIRECT_URI = process.env.YAHOO_REDIRECT_URI;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.SESSION_SECRET;

const YAHOO_AUTH_URL = 'https://api.login.yahoo.com/oauth2/request_auth';
const YAHOO_TOKEN_URL = 'https://api.login.yahoo.com/oauth2/get_token';

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
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid fspt-r',
  });
  res.redirect(`${YAHOO_AUTH_URL}?${params.toString()}`);
});

router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  console.log('OAuth callback — code:', code ? 'received' : 'missing', '| error:', error || 'none');
  if (error || !code) return res.redirect(`${CLIENT_URL}?error=auth_failed`);
  try {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      YAHOO_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code,
      }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    const { access_token, refresh_token, expires_in } = response.data;
    const tokens = {
      access_token,
      refresh_token,
      expires_at: Date.now() + expires_in * 1000,
    };
    const token = jwt.sign(tokens, JWT_SECRET, { expiresIn: '7d' });
    console.log('Token exchange successful');
    res.redirect(`${CLIENT_URL}?token=${token}`);
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err.message);
    res.redirect(`${CLIENT_URL}?error=token_failed`);
  }
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

async function getValidToken(req) {
  const tokens = getTokensFromCookie(req);
  if (!tokens) throw new Error('Not authenticated');
  if (Date.now() < tokens.expires_at - 60000) return tokens.access_token;
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const response = await axios.post(
    YAHOO_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'refresh_token',
      redirect_uri: REDIRECT_URI,
      refresh_token: tokens.refresh_token,
    }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.data.access_token;
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
