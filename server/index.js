require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const leagueRoutes = require('./routes/leagues');
const playerRoutes = require('./routes/players');
const scraperRoutes = require('./routes/scraper');
const syncRoutes = require('./routes/sync');
const keeperRoutes = require('./routes/keepers');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET));

const siteOrigins = [
  'https://fantasy-hub-bice.vercel.app',
  'http://localhost:5173',
];

app.use('/auth', cors({ origin: siteOrigins, credentials: true }), authRoutes);
app.use('/api/leagues', cors({ origin: siteOrigins, credentials: true }), leagueRoutes);
app.use('/api/players', cors({ origin: siteOrigins, credentials: true }), playerRoutes);
app.use('/api/scraper', cors({ origin: siteOrigins, credentials: true }), scraperRoutes);
app.use('/api/sync', cors({ origin: '*' }), syncRoutes);
app.use('/api/keepers', cors({ origin: siteOrigins, credentials: true }), keeperRoutes);

app.get('/health', cors({ origin: '*' }), (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Fantasy Hub server running on port ${PORT}`);
});