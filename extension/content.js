const API = 'https://fantasy-hub-production.up.railway.app';

const LEAGUE_MAP = {
  '100398': 'beaners-husseins',
  '101720': 'rebirth',
  '101813': 'gentlemens-league',
  '101814': 'shoot-the-shits',
};

function getLeagueId() {
  const match = window.location.href.match(/\/f1\/(\d+)/);
  return match ? match[1] : null;
}

function parseStandings() {
  const standings = [];
  const rows = document.querySelectorAll('.standings-table tr, table.Table tr, [data-tst="standing-row"]');
  
  rows.forEach((row, i) => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 4) return;

    const rankEl = row.querySelector('.rank, [class*="rank"]');
    const nameEl = row.querySelector('a[href*="/f1/"]');
    const recordEl = [...cells].find(c => c.textContent.match(/^\d+-\d+-\d+$/));
    const pfEl = cells[cells.length - 2];
    const paEl = cells[cells.length - 1];

    if (!nameEl) return;

    const rank = rankEl ? parseInt(rankEl.textContent) : i + 1;
    const name = nameEl.textContent.trim();
    const record = recordEl ? recordEl.textContent.trim() : '0-0-0';
    const recordParts = record.match(/(\d+)-(\d+)-(\d+)/);
    const pf = parseFloat(pfEl?.textContent) || 0;
    const pa = parseFloat(paEl?.textContent) || 0;

    if (name && recordParts) {
      standings.push({
        rank,
        name,
        wins: parseInt(recordParts[1]),
        losses: parseInt(recordParts[2]),
        ties: parseInt(recordParts[3]),
        record,
        points_for: pf,
        points_against: pa,
      });
    }
  });

  return standings;
}

function parseMatchups() {
  const matchups = [];
  const matchupEls = document.querySelectorAll('.matchup, [class*="matchup"], .Matchup');

  matchupEls.forEach(el => {
    const teams = el.querySelectorAll('a[href*="/f1/"]');
    const scores = el.querySelectorAll('.score, [class*="score"], .Total');

    if (teams.length >= 2) {
      matchups.push({
        teamA: {
          name: teams[0].textContent.trim(),
          score: parseFloat(scores[0]?.textContent) || 0,
        },
        teamB: {
          name: teams[1].textContent.trim(),
          score: parseFloat(scores[1]?.textContent) || 0,
        },
      });
    }
  });

  return matchups;
}

function parseWeek() {
  const weekEl = document.querySelector('[class*="week"], .week-label');
  if (weekEl) {
    const match = weekEl.textContent.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }
  return null;
}

async function syncLeague() {
  const yahooLeagueId = getLeagueId();
  if (!yahooLeagueId) return;

  const leagueId = LEAGUE_MAP[yahooLeagueId];
  if (!leagueId) return;

  const standings = parseStandings();
  const matchups = parseMatchups();
  const week = parseWeek();

  if (standings.length === 0 && matchups.length === 0) {
    console.log('Fantasy Hub: No data found on this page');
    return;
  }

  try {
    const res = await fetch(`${API}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leagueId,
        yahooLeagueId,
        standings,
        matchups,
        week,
        syncedAt: new Date().toISOString(),
      }),
    });

    const data = await res.json();
    console.log('Fantasy Hub sync:', data);

    // Notify popup
    chrome.storage.local.set({
      [`sync_${leagueId}`]: {
        leagueId,
        standings: standings.length,
        matchups: matchups.length,
        syncedAt: new Date().toISOString(),
        status: 'success',
      }
    });
  } catch (err) {
    console.error('Fantasy Hub sync error:', err);
    chrome.storage.local.set({
      [`sync_${leagueId}`]: {
        leagueId,
        status: 'error',
        error: err.message,
        syncedAt: new Date().toISOString(),
      }
    });
  }
}

// Run sync when page loads
setTimeout(syncLeague, 2000);
