import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ADMIN_PASSWORD = 'commish2026';

const ROUNDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];

const LEAGUE_CONFIG = {
  'beaners-husseins': {
    label: 'Beaners & Husseins',
    maxKeepers: 2,
    deadline: 'August 23, 2026',
    hasRoundPrice: false,
    owners: ['Jose', 'Giovanny', 'Eduardo', 'Kyle', 'Kevin', 'Cristian', 'Edwin', 'Oscar', 'Hihi', 'Bishoy', 'Pru', 'Mina'],
  },
  'rebirth': {
    label: 'Rebirth',
    maxKeepers: 2,
    deadline: 'August 25, 2026',
    hasRoundPrice: true,
    owners: ['Jose', 'Cristian', 'Alex Zarate', 'Alexis', 'Ed', 'Hihi', 'Jonathan', 'Oscar', 'Giovanny', 'Big Vic', 'JJ', 'Julio'],
  },
};

function emptyKeepers(n) {
  return Array.from({ length: n }, () => ({ name: '', round: '' }));
}

export default function KeeperSubmission({ leagueId }) {
  const config = LEAGUE_CONFIG[leagueId];
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState('');
  const [keepers, setKeepers] = useState(emptyKeepers(2));
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');

  useEffect(() => {
    if (config) {
      setKeepers(emptyKeepers(config.maxKeepers));
      fetchSubmissions();
    }
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

  function handleKeeperChange(i, field, val) {
    setKeepers(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!owner) { setErrorMsg('Please select your name.'); return; }

    for (let i = 0; i < config.maxKeepers; i++) {
      if (!keepers[i].name.trim()) {
        setErrorMsg(`Keeper ${i + 1} name is required.`);
        return;
      }
      if (config.hasRoundPrice && !keepers[i].round) {
        setErrorMsg(`Please select a keeper round for Keeper ${i + 1}.`);
        return;
      }
    }

    const payload = keepers.map(k => ({
      name: k.name.trim(),
      ...(config.hasRoundPrice ? { round: Number(k.round) } : {}),
    }));

    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/keepers/${leagueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, keepers: payload }),
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

  function handleNewSubmission() {
    setStatus(null);
    setOwner('');
    setKeepers(emptyKeepers(config.maxKeepers));
    setErrorMsg('');
  }

  function handleAdminLogin(e) {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) {
      setAdminAuthed(true);
      setAdminMsg('');
    } else {
      setAdminMsg('Incorrect password.');
    }
  }

  async function handleClearAll() {
    if (!window.confirm(`Clear ALL keeper submissions for ${config.label}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/keepers/${leagueId}/all`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear');
      setAdminMsg('All submissions cleared.');
      await fetchSubmissions();
    } catch {
      setAdminMsg('Error clearing submissions.');
    }
  }

  async function handleClearOne(ownerName) {
    if (!window.confirm(`Remove ${ownerName}'s submission?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/keepers/${leagueId}/${encodeURIComponent(ownerName)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      await fetchSubmissions();
    } catch {
      setAdminMsg('Error removing submission.');
    }
  }

  if (!config) return <div style={{ color: 'var(--text-muted)', padding: 24 }}>Keeper submission not available for this league.</div>;

  const submitted = config.owners.filter(o => submissions[o]);
  const pending = config.owners.filter(o => !submissions[o]);

  function formatKeepers(sub) {
    if (!sub) return null;
    const list = sub.keepers || sub.players || [];
    return list.map(k =>
      typeof k === 'string' ? k : (k.round ? `${k.name} (Rd ${k.round})` : k.name)
    ).join(', ');
  }

  return (
    <div style={styles.wrap}>
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
        <div style={styles.formCard}>
          {status === 'success' ? (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>✓</div>
              <div style={styles.successTitle}>Keepers submitted!</div>
              <div style={styles.successSub}>Your submission has been saved. You can resubmit to update before the deadline.</div>
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
                  <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                    Current: {formatKeepers(submissions[owner])}
                  </div>
                </div>
              )}

              <label style={styles.label}>
                Keepers <span style={styles.labelMeta}>({config.maxKeepers} required)</span>
              </label>

              {Array.from({ length: config.maxKeepers }).map((_, i) => (
                <div key={i} style={styles.keeperRow}>
                  <div style={styles.keeperNumLabel}>#{i + 1}</div>
                  <input
                    style={{ ...styles.input, flex: 1 }}
                    type="text"
                    placeholder="Player name"
                    value={keepers[i].name}
                    onChange={e => handleKeeperChange(i, 'name', e.target.value)}
                  />
                  {config.hasRoundPrice && (
                    <select
                      style={{ ...styles.select, width: 90, flexShrink: 0 }}
                      value={keepers[i].round}
                      onChange={e => handleKeeperChange(i, 'round', e.target.value)}
                    >
                      <option value="">Rd</option>
                      {ROUNDS.map(r => (
                        <option key={r} value={r}>Rd {r}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}

              {config.hasRoundPrice && (
                <div style={styles.hint}>Select the round this keeper costs you in the draft.</div>
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
                        {sub ? formatKeepers(sub) : <span style={styles.dash}>—</span>}
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

      {/* Admin panel */}
      <div style={styles.adminWrap}>
        {!adminOpen ? (
          <button style={styles.adminToggle} onClick={() => setAdminOpen(true)}>⚙ Admin</button>
        ) : (
          <div style={styles.adminCard}>
            <div style={styles.adminHeader}>
              <span style={styles.adminTitle}>Admin</span>
              <button style={styles.adminClose} onClick={() => { setAdminOpen(false); setAdminAuthed(false); setAdminPass(''); setAdminMsg(''); }}>✕</button>
            </div>
            {!adminAuthed ? (
              <form onSubmit={handleAdminLogin} style={styles.adminForm}>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="Password"
                  value={adminPass}
                  onChange={e => setAdminPass(e.target.value)}
                  autoFocus
                />
                <button type="submit" style={styles.adminBtn}>Unlock</button>
                {adminMsg && <div style={styles.adminMsg}>{adminMsg}</div>}
              </form>
            ) : (
              <div style={styles.adminActions}>
                {adminMsg && <div style={styles.adminMsgGreen}>{adminMsg}</div>}
                <div style={styles.adminSubtitle}>Remove individual</div>
                {config.owners.filter(o => submissions[o]).map(o => (
                  <div key={o} style={styles.adminRow}>
                    <span style={styles.adminOwnerName}>{o}</span>
                    <button style={styles.adminRemoveBtn} onClick={() => handleClearOne(o)}>Remove</button>
                  </div>
                ))}
                {config.owners.filter(o => submissions[o]).length === 0 && (
                  <div style={styles.adminEmpty}>No submissions yet.</div>
                )}
                <button style={styles.adminClearAll} onClick={handleClearAll}>
                  🗑 Clear all submissions
                </button>
              </div>
            )}
          </div>
        )}
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
    flex: '0 0 340px', minWidth: 260,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: 24,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 },
  labelMeta: { fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', opacity: 0.7 },
  select: {
    background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
    borderRadius: 6, padding: '8px 10px', fontSize: 13, cursor: 'pointer', width: '100%',
    boxSizing: 'border-box',
  },
  input: {
    background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
    borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box', outline: 'none',
  },
  keeperRow: { display: 'flex', gap: 8, alignItems: 'center' },
  keeperNumLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', width: 18, flexShrink: 0 },
  hint: { fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: -4 },
  existingNote: { fontSize: 11, color: '#aa8800', background: '#120e00', border: '1px solid #332200', borderRadius: 5, padding: '6px 10px', lineHeight: 1.5 },
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
  tdPlayers: { padding: '8px 0', color: 'var(--text-muted)', lineHeight: 1.5 },
  submittedBadge: { fontSize: 10, fontWeight: 600, color: '#4acc88', background: '#0a1f14', border: '1px solid #1a4a2a', borderRadius: 4, padding: '2px 7px' },
  pendingBadge: { fontSize: 10, fontWeight: 600, color: '#888', background: '#181818', border: '1px solid #333', borderRadius: 4, padding: '2px 7px' },
  dash: { color: '#333' },
  pendingNote: { marginTop: 14, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 12 },
  adminWrap: { display: 'flex', justifyContent: 'flex-end', marginTop: 8 },
  adminToggle: { background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer' },
  adminCard: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 18, minWidth: 260, maxWidth: 340 },
  adminHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  adminTitle: { fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' },
  adminClose: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 0 },
  adminForm: { display: 'flex', flexDirection: 'column', gap: 8 },
  adminBtn: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '7px 0', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  adminMsg: { fontSize: 11, color: '#e05555' },
  adminMsgGreen: { fontSize: 11, color: '#4acc88', marginBottom: 8 },
  adminActions: { display: 'flex', flexDirection: 'column', gap: 6 },
  adminSubtitle: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 2 },
  adminRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)' },
  adminOwnerName: { fontSize: 12, color: 'var(--text)' },
  adminRemoveBtn: { background: 'none', border: '1px solid #400', color: '#e05555', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' },
  adminEmpty: { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' },
  adminClearAll: { marginTop: 8, background: '#200', border: '1px solid #500', color: '#e05555', borderRadius: 6, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
};