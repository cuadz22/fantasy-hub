const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getAuthStatus() {
  return apiFetch('/auth/status');
}

export async function getLeagues() {
  return apiFetch('/api/leagues');
}

export async function getStandings(leagueKey) {
  return apiFetch(`/api/leagues/${leagueKey}/standings`);
}

export async function getMatchups(leagueKey, week) {
  return apiFetch(`/api/leagues/${leagueKey}/matchups?week=${week}`);
}

export async function getMatchupPlayers(teamKeyA, teamKeyB, week, limit = 5) {
  return apiFetch(`/api/players/matchup?teamKeyA=${teamKeyA}&teamKeyB=${teamKeyB}&week=${week}&limit=${limit}`);
}
