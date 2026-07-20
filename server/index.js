require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const leagueRoutes = require('./routes/leagues');
const playerRoutes = require('./routes/players');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

app.use('/auth', authRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/players', playerRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Fantasy Hub server running on port ${PORT}`);
});
