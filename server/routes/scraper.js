const express = require('express');
const router = express.Router();

const LEAGUES = {
  'beaners-husseins': {
    name: "Beaners & Husseins",
    url: 'https://football.fantasysports.yahoo.com/f1/100398',
    history: { 2025: 'https://football.fantasysports.yahoo.com/f1/100398' }
  },
  'rebirth': {
    name: 'Rebirth',
    url: 'https://football.fantasysports.yahoo.com/f1/101720',
    history: { 2025: 'https://football.fantasysports.yahoo.com/f1/101720' }
  },
  'gentlemens-league': {
    name: "Gentlemen's League",
    url: 'https://football.fantasysports.yahoo.com/f1/101813',
    history: { 2025: 'https://football.fantasysports.yahoo.com/f1/101813' }
  },
  'shoot-the-shits': {
    name: 'Shoot the Shits',
    url: 'https://football.fantasysports.yahoo.com/f1/101814',
    history: { 2025: 'https://football.fantasysports.yahoo.com/f1/101814' }
  },
};

const cache = {};
const CACHE_TTL = 60 * 60 * 1000;

async function fetchLeaguePage(url) {
  const cached = cache[url];
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    }
  });

  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  if (!html || html.length < 100) throw new Error('Empty response from Yahoo');
  cache[url] = { data: html, time: Date.now() };
  return html;
}

function parseStandings(html) {
  const standings = [];

  // Try multiple patterns to find the standings table
  const patterns = [
    /## Standings\s*([\s\S]*?)(?:Last standings update|## Recent)/,
    /Standings\s*\|[\s\S]*?\|[\s\S]*?(?:Last standings|Recent Transaction)/,
  ];

  let tableContent = null;
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) { tableContent = match[0]; break; }
  }

  if (!tableContent) {
    // Try finding table rows directly
    const rows = html.match(/\|\s*\\?\*?\d+\s*\|[^\n]+\|[^\n]+\|/g);
    if (rows) {
      rows.forEach(row => {
        const cells = row.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length < 4) return;
        const rank = parseInt(cells[0].replace(/\*/g, '').trim());
        if (isNaN(rank) || rank > 20) return;
        const nameMatch = cells[1].match(/\[([^\]]+)\]/);
        const name = nameMatch ? nameMatch[1] : cells[1].replace(/!\[.*?\]\(.*?\)/g, '').trim();
        const recordParts = cells[2].match(/(\d+)-(\d+)-(\d+)/);
        const pf = parseFloat(cells[3]) || 0;
        const pa = parseFloat(cells[4]) || 0;
        if (name && recordParts && name.length > 1) {
          standings.push({
            rank,
            name,
            wins: parseInt(recordParts[1]),
            losses: parseInt(recordParts[2]),
            ties: parseInt(recordParts[3]),
            record: cells[2],
            points_for: pf,
            points_against: pa,
            clinched: cells[0].includes('*'),
          });
        }
      });
    }
    return standings.sort((a, b) => a.rank - b.rank);
  }

  const rows = tableContent.match(/\|\s*\\?\*?\d+\s*\|[^\n]+/g);
  if (!rows) return standings;

  rows.forEach(row => {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 4) return;
    const rank = parseInt(cells[0].replace(/\*/g, '').trim());
    if (isNaN(rank)) return;
    const nameMatch = cells[1].match(/\[([^\]]+)\]/);
    const name = nameMatch ? nameMatch[1] : cells[1].replace(/!\[.*?\]\(.*?\)/g, '').trim();
    const recordParts = cells[2].match(/(\d+)-(\d+)-(\d+)/);
    const pf = parseFloat(cells[3]) || 0;
    const pa = parseFloat(cells[4]) || 0;
    if (name && recordParts && name.length > 1) {
      standings.push({
        rank,
        name,
        wins: parseInt(recordParts[1]),
        losses: parseInt(recordParts[2]),
        ties: parseInt(recordParts[3]),
        record: cells[2],
        points_for: pf,
        points_against: pa,
        clinched: cells[0].includes('*'),
      });
    }
  });

  return standings.sort((a, b) => a.rank - b.rank);
}

function parseMatchups(html) {
  const matchups = [];
  const sections = html.split('[View Matchup]');
  sections.slice(1).forEach(section => {
    const teamMatches = [...section.matchAll(/\[([^\]]+)\]\(https:\/\/football\.fantasysports\.yahoo\.com\/f1\/\d+\/\d+\)\s*\n\s*\d+-\d+-\d+/g)];
    if (teamMatches.length >= 2) {
      const scoreMatches = [...section.matchAll(/\n\s*(\d+\.\d+)\s*\n/g)];
      const scoreA = parseFloat(scoreMatches[0]?.[1] || 0);
      const scoreB = parseFloat(scoreMatches[2]?.[1] || 0);
      matchups.push({
        teamA: { name: teamMatches[0][1], score: scoreA },
        teamB: { name: teamMatches[1][1], score: scoreB },
      });
    }
  });
  return matchups;
}

router.get('/:leagueId/standings', async (req, res) => {
  const league = LEAGUES[req.params.leagueId];
  if (!league) return res.status(404).json({ error: 'League not found' });
  try {
    const html = await fetchLeaguePage(league.url);
    const standings = parseStandings(html);
    res.json({ league: league.name, standings, source: 'yahoo', html_length: html.length });
  } catch (err) {
    console.error('Scraper standings error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:leagueId/matchups', async (req, res) => {
  const league = LEAGUES[req.params.leagueId];
  if (!league) return res.status(404).json({ error: 'League not found' });
  try {
    const html = await fetchLeaguePage(league.url);
    const matchups = parseMatchups(html);
    res.json({ league: league.name, matchups, source: 'yahoo' });
  } catch (err) {
    console.error('Scraper matchups error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:leagueId/history/:year', async (req, res) => {
  const league = LEAGUES[req.params.leagueId];
  if (!league) return res.status(404).json({ error: 'League not found' });
  const year = parseInt(req.params.year);
  const historyUrl = league.history[year];
  if (!historyUrl) return res.status(404).json({ error: `No history URL for ${year}` });
  try {
    const html = await fetchLeaguePage(historyUrl);
    const standings = parseStandings(html);
    const champion = standings[0] || null;
    res.json({ league: league.name, year, champion, standings, source: 'yahoo' });
  } catch (err) {
    console.error('Scraper history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/add-history', express.json(), (req, res) => {
  const { leagueId, year, url } = req.body;
  if (!leagueId || !year || !url) return res.status(400).json({ error: 'leagueId, year, and url required' });
  if (!LEAGUES[leagueId]) return res.status(404).json({ error: 'League not found' });
  LEAGUES[leagueId].history[year] = url;
  res.json({ success: true, message: `Added ${year} history for ${LEAGUES[leagueId].name}` });
});

router.get('/all/standings', async (req, res) => {
  const results = {};
  await Promise.all(
    Object.entries(LEAGUES).map(async ([id, league]) => {
      try {
        const html = await fetchLeaguePage(league.url);
        results[id] = { name: league.name, standings: parseStandings(html) };
      } catch (err) {
        results[id] = { name: league.name, error: err.message };
      }
    })
  );
  res.json(results);
});

router.get('/:leagueId/raw', async (req, res) => {
  const league = LEAGUES[req.params.leagueId];
  if (!league) return res.status(404).json({ error: 'League not found' });
  try {
    const html = await fetchLeaguePage(league.url);
    res.json({ length: html.length, preview: html.substring(0, 2000) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
