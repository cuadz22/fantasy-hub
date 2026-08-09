import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const LEAGUE_CONFIG = {
  'beaners-husseins': {
    label: 'Beaners & Husseins',
    maxKeepers: 2,
    deadline: 'August 10, 2025',
    owners: ['Jose', 'Giovanny', 'Eduardo', 'Kyle', 'Kevin', 'Cristian', 'Edwin', 'Oscar', 'Hihi', 'Bishoy', 'Pru', 'Mina'],
  },
  'rebirth': {
    label: 'Rebirth',
    maxKeepers: 3,
    deadline: 'August 25, 2026',
    owners: ['Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Ed', 'Hihi', 'Jonathan', 'Oscar', 'Giovanny', 'Big Vic', 'JJ', 'Julio'],
  },
};

export default function KeeperSubmission({ leagueId }) {
  const config = LEAGUE_CONFIG[leagueId];
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState('');
  const [players, setPlayers] = useState(['', '', '']);
  const [status, setStatus] = useState(null); // null | 'submitting' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [leagueId]);

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/keepers/${leagueId}`);
      const data = await res.json();
      setSubmissions(data);
    } catch {
      setSubmissions({});
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!owner) { setErrorMsg('Please select your name.'); return; }
    const trimmed = players.slice(0, config.maxKeepers).map(p => p.trim()).filter(Boolean);
    if (trimmed.length === 0) { setErrorMsg('Enter at least one keeper.'); return; }

    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/keepers/${leagueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, players: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Submission failed');
      }
      setStatus('success');
      await fetchSubmissions();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Try again.');
    }
  }

  function handlePlayerChange(i, val) {
    setPlayers(prev => { const next = [...prev]; next[i] = val; return next; });
  }

  function handleNewSubmission() {
    setStatus(null);
    setOwner('');
    setPlayers(['', '', '']);
    setErrorMsg('');
  }

  if (!config) return <div style={{ color: 'var(--text-muted)', padding: 24 }}>Keeper submission not available for this league.</div>;

  const submitted = config.owners.filter(o => submissions[o]);
  const pending = config.owners.filter(o => !submissions[o]);

  return (
    <div style={styles.wrap}>

      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <div style={styles.sectionTitle}>Submit Your Keepers</div>
          <div style={styles.deadline}>Deadline: <strong>{config.deadline}</strong></div>
        </div>
        <div style={styles.progress}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${(submitted.length / config.owners.length) * 100}%` }} />
          </div>
          <div style={styles.progressLabel}>{submitted.length} / {config.owners.length} submitted</div>
        </div>
      </div>

      <div style={styles.cols}>

        {/* Submission form */}
        <div style={styles.formCard}>
          {status === 'success' ? (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>✓</div>
              <div style={styles.successTitle}>Keepers submitted!</div>
              <div style={styles.successSub}>Your submission has been saved. You can resubmit to update your keepers before the deadline.</div>
              <button style={styles.btn} onClick={handleNewSubmission}>Update submission</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>Your name</label>
              <select
                style={styles.select}
                value={owner}
                onChange={e => { setOwner(e.target.value); setStatus(null); }}
                required
              >
                <option value="">— Select owner —</option>
                {config.owners.map(o => (
                  <option key={o} value={o}>{o}{submissions[o] ? ' ✓' : ''}</option>
                ))}
              </select>

              {owner && submissions[owner] && (
                <div style={styles.existingNote}>
                  You already submitted. Fill out below to update your keepers.
                </div>
              )}

              <label style={styles.label}>
                Keepers <span style={styles.labelMeta}>(max {config.maxKeepers})</span>
              </label>
              {Array.from({ length: config.maxKeepers }).map((_, i) => (
                <input
                  key={i}
                  style={styles.input}
                  type="text"
                  placeholder={`Keeper ${i + 1}${i === 0 ? ' (required)' : ' (optional)'}`}
                  value={players[i] || ''}
                  onChange={e => handlePlayerChange(i, e.target.value)}
                />
              ))}

              {owner && submissions[owner] && (
                <div style={styles.currentKeepers}>
                  <span style={styles.currentLabel}>Current submission: </span>
                  {submissions[owner].players.join(', ')}
                </div>
              )}

              {errorMsg && <div style={styles.errorMsg}>{errorMsg}</div>}

              <button
                type="submit"
                style={{ ...styles.btn, opacity: status === 'submitting' ? 0.6 : 1 }}
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Submitting…' : submissions[owner] ? 'Update Keepers' : 'Submit Keepers'}
              </button>
            </form>
          )}
        </div>

        {/* Status table */}
        <div style={styles.statusCard}>
          <div style={styles.cardTitle}>Submission Status</div>
          {loading ? (
            <div style={styles.loadingText}>Loading…</div>
          ) : (
            <table style={styles.table}>
              <tbody>
                {config.owners.map(o => {
                  const sub = submissions[o];
                  return (
                    <tr key={o} style={styles.tr}>
                      <td style={styles.tdOwner}>{o}</td>
                      <td style={styles.tdStatus}>
                        {sub ? (
                          <span style={styles.submittedBadge}>✓ submitted</span>
                        ) : (
                          <span style={styles.pendingBadge}>pending</span>
                        )}
                      </td>
                      <td style={styles.tdPlayers}>
                        {sub ? sub.players.join(', ') : <span style={styles.dash}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && pending.length > 0 && (
            <div style={styles.pendingNote}>
              Still waiting on: {pending.join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 },
  deadline: { fontSize: 12, color: 'var(--text-muted)' },
  progress: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  progressBar: { width: 140, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--red)', borderRadius: 3, transition: 'width 0.4s ease' },
  progressLabel: { fontSize: 11, color: 'var(--text-muted)' },

  cols: { display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' },

  formCard: {
    flex: '0 0 320px', minWidth: 260,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: 24,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 },
  labelMeta: { fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', opacity: 0.7 },
  select: {
    background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
    borderRadius: 6, padding: '8px 10px', fontSize: 13, cursor: 'pointer', width: '100%',
  },
  input: {
    background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
    borderRadius: 6, padding: '8px 10px', fontSize: 13, width: '100%', boxSizing: 'border-box',
    outline: 'none',
  },
  existingNote: { fontSize: 11, color: '#aa8800', background: '#120e00', border: '1px solid #332200', borderRadius: 5, padding: '6px 10px' },
  currentKeepers: { fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '6px 10px' },
  currentLabel: { fontWeight: 600, color: 'var(--text)' },
  errorMsg: { fontSize: 12, color: '#e05555', background: '#200', border: '1px solid #400', borderRadius: 5, padding: '6px 10px' },
  btn: {
    marginTop: 6, background: 'var(--red)', color: '#fff', border: 'none',
    borderRadius: 6, padding: '10px 0', fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
  },

  successBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 0', textAlign: 'center' },
  successIcon: { fontSize: 32, color: '#4acc88' },
  successTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },
  successSub: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 },

  statusCard: {
    flex: 1, minWidth: 260,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: 24, overflowX: 'auto',
  },
  cardTitle: { fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14 },
  loadingText: { fontSize: 12, color: 'var(--text-muted)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  tr: { borderBottom: '1px solid var(--border)' },
  tdOwner: { padding: '8px 0', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', paddingRight: 12, width: 90 },
  tdStatus: { padding: '8px 8px', whiteSpace: 'nowrap', width: 90 },
  tdPlayers: { padding: '8px 0', color: 'var(--text-muted)', lineHeight: 1.4 },
  submittedBadge: { fontSize: 10, fontWeight: 600, color: '#4acc88', background: '#0a1f14', border: '1px solid #1a4a2a', borderRadius: 4, padding: '2px 7px' },
  pendingBadge: { fontSize: 10, fontWeight: 600, color: '#888', background: '#181818', border: '1px solid #333', borderRadius: 4, padding: '2px 7px' },
  dash: { color: '#333' },
  pendingNote: { marginTop: 14, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 12 },
};
