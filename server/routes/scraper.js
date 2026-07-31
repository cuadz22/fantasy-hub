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
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  cache[url] = { data: html, time: Date.now() };
  return html;
}

function parseStandings(html) {
  const standings = [];

  // Extract team data from HTML table rows
  // Yahoo standings table has class "yf-table" or similar
  // Team names appear in <a> tags with team URLs
  // Records appear as "W-L-T" pattern
  // Points appear as decimal numbers

  // Find the standings section
  const standingsSection = html.match(/lhststand[\s\S]{0,50000}lhstsched/);
  if (!standingsSection) {
    // Try alternative approach - find all team rows
    return parseStandingsFromScript(html);
  }

  return parseStandingsFromScript(html);
}

function parseStandingsFromScript(html) {
  const standings = [];

  try {
    // Yahoo embeds league data in a JSON blob in the page
    // Look for team data patterns
    const teamMatches = [...html.matchAll(/"name":"([^"]+)","managers"[\s\S]*?"wins":(\d+),"losses":(\d+),"ties":(\d+)[\s\S]*?"points_for":"([^"]+)","points_against":"([^"]+)"[\s\S]*?"rank":(\d+)/g)];

    if (teamMatches.length > 0) {
      teamMatches.forEach(match => {
        standings.push({
          rank: parseInt(match[7]),
          name: match[1],
          wins: parseInt(match[2]),
          losses: parseInt(match[3]),
          ties: parseInt(match[4]),
          record: `${match[2]}-${match[3]}-${match[4]}`,
          points_for: parseFloat(match[5]),
          points_against: parseFloat(match[6]),
          clinched: false,
        });
      });
      return standings.sort((a, b) => a.rank - b.rank);
    }

    // Fallback: extract from HTML table structure
    // Find rank numbers paired with team names and records
    const rankPattern = /class="[^"]*rank[^"]*"[^>]*>\s*(\d+)\s*<\/td>/gi;
    const namePattern = /class="[^"]*teamname[^"]*"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/gi;
    const recordPattern = /(\d+)-(\d+)-(\d+)/g;
    const pfPattern = /class="[^"]*pts[^"]*"[^>]*>([\d.]+)<\/td>/gi;

    const ranks = [...html.matchAll(rankPattern)].map(m => parseInt(m[1]));
    const names = [...html.matchAll(namePattern)].map(m => m[1].trim());
    const records = [...html.matchAll(/>\s*(\d+)-(\d+)-(\d+)\s*</g)].map(m => ({
      wins: parseInt(m[1]), losses: parseInt(m[2]), ties: parseInt(m[3]),
      record: `${m[1]}-${m[2]}-${m[3]}`
    }));

    if (names.length > 0 && records.length > 0) {
      names.forEach((name, i) => {
        if (records[i]) {
          standings.push({
            rank: ranks[i] || i + 1,
            name,
            wins: records[i].wins,
            losses: records[i].losses,
            ties: records[i].ties,
            record: records[i].record,
            points_for: 0,
            points_against: 0,
            clinched: false,
          });
        }
      });
      return standings;
    }

    // Last resort: look for data-* attributes
    const dataRows = [...html.matchAll(/data-team-id="(\d+)"[^>]*>([\s\S]*?)(?=data-team-id|<\/tr>)/g)];
    dataRows.forEach((row, i) => {
      const nameMatch = row[2].match(/>([^<]{2,50})<\/a>/);
      const recordMatch = row[2].match(/(\d+)-(\d+)-(\d+)/);
      if (nameMatch && recordMatch) {
        standings.push({
          rank: i + 1,
          name: nameMatch[1].trim(),
          wins: parseInt(recordMatch[1]),
          losses: parseInt(recordMatch[2]),
          ties: parseInt(recordMatch[3]),
          record: `${recordMatch[1]}-${recordMatch[2]}-${recordMatch[3]}`,
          points_for: 0,
          points_against: 0,
          clinched: false,
        });
      }
    });

  } catch (err) {
    console.error('Parse error:', err.message);
  }

  return standings;
}

function parseMatchups(html) {
  const matchups = [];
  try {
    // Look for matchup data in JSON
    const matchupData = [...html.matchAll(/"teams":\[{"name":"([^"]+)"[^}]*"team_points":{"total":"([^"]+)"[^}]*}[^}]*},{"name":"([^"]+)"[^}]*"team_points":{"total":"([^"]+)"/g)];

    matchupData.forEach(m => {
      matchups.push({
        teamA: { name: m[1], score: parseFloat(m[2]) },
        teamB: { name: m[3], score: parseFloat(m[4]) },
      });
    });

    if (matchups.length === 0) {
      // Fallback: look for score patterns near team names
      const scoreBlocks = [...html.matchAll(/class="[^"]*score[^"]*"[^>]*>([\d.]+)<[\s\S]{0,500}class="[^"]*score[^"]*"[^>]*>([\d.]+)</g)];
      scoreBlocks.forEach(m => {
        matchups.push({
          teamA: { name: 'Team A', score: parseFloat(m[1]) },
          teamB: { name: 'Team B', score: parseFloat(m[2]) },
        });
      });
    }
  } catch (err) {
    console.error('Matchup parse error:', err.message);
  }
  return matchups;
}

router.get('/:leagueId/standings', async (req, res) => {
  const league = LEAGUES[req.params.leagueId];
  if (!league) return res.status(404).json({ error: 'League not found' });
  try {
    const html = await fetchLeaguePage(league.url);
    const standings = parseStandings(html);
    res.json({ league: league.name, standings, count: standings.length, source: 'yahoo' });
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
    // Find a relevant snippet around standings
    const idx = html.indexOf('standings');
    res.json({ length: html.length, snippet: html.substring(idx, idx + 3000) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

router.get('/:leagueId/teamdata', async (req, res) => {
  const league = LEAGUES[req.params.leagueId];
  if (!league) return res.status(404).json({ error: 'League not found' });
  try {
    const html = await fetchLeaguePage(league.url);
    // Search for team name patterns
    const idx1 = html.indexOf('"outcome_totals"');
    const idx2 = html.indexOf('team_standings');
    const idx3 = html.indexOf('points_for');
    const idx4 = html.indexOf('W-L-T');
    res.json({
      length: html.length,
      outcome_totals_idx: idx1,
      team_standings_idx: idx2,
      points_for_idx: idx3,
      wlt_idx: idx4,
      outcome_totals_snippet: idx1 > -1 ? html.substring(idx1 - 200, idx1 + 500) : null,
      points_for_snippet: idx3 > -1 ? html.substring(idx3 - 100, idx3 + 300) : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
