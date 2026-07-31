import { useState, useEffect } from 'react';

const API = 'https://fantasy-hub-production.up.railway.app';

export default function Connect() {
  const [leagues, setLeagues] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/leagues`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setLeagues(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main style={{ padding: '40px 32px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, marginBottom: 24, color: 'var(--text)' }}>
        Your Yahoo Leagues
      </h1>
      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading your leagues...</p>}
      {error && <p style={{ color: 'var(--red)' }}>Error: {error} — make sure you are connected to Yahoo in Studio.</p>}
      {leagues.map((l, i) => (
        <div key={i} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{l.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>Key: {l.league_key}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Season: {l.season} · {l.num_teams} teams · Week {l.current_week}</div>
        </div>
      ))}
    </main>
  );
}
