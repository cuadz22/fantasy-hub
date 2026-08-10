import { useState, useEffect } from 'react';

const API = 'https://fantasy-hub-production.up.railway.app';
const STUDIO_PIN = '2121';

const LEAGUES = [
  { id: 'beaners-husseins', name: "Beaners & Husseins" },
  { id: 'rebirth', name: 'Rebirth' },
  { id: 'gentlemens-league', name: "Gentlemen's League" },
  { id: 'shoot-the-shits', name: 'Shoot the Shits' },
];

const SAMPLE = {
  teamA: { name: 'TD Tyrants', score: 142, players: [
    { pos: 'QB', name: 'J. Burrow', pts: 38.2, proj: 28.4 },
    { pos: 'RB', name: 'D. Henry', pts: 29.6, proj: 18.1 },
    { pos: 'WR', name: 'S. Diggs', pts: 22.4, proj: 24.0 },
    { pos: 'WR', name: 'C. Lamb', pts: 18.8, proj: 22.5 },
    { pos: 'TE', name: 'T. Kelce', pts: 16.1, proj: 14.8 },
  ]},
  teamB: { name: 'Blitz Kings', score: 118, players: [
    { pos: 'QB', name: 'L. Jackson', pts: 31.4, proj: 29.0 },
    { pos: 'RB', name: 'C. McCaffrey', pts: 26.8, proj: 30.2 },
    { pos: 'WR', name: 'T. Hill', pts: 21.2, proj: 19.5 },
    { pos: 'TE', name: 'M. Andrews', pts: 17.6, proj: 15.0 },
    { pos: 'WR', name: 'D. Adams', pts: 14.3, proj: 18.7 },
  ]},
};

export default function Studio() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('studio_auth') === 'true');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [connected, setConnected] = useState(false);
  const [league, setLeague] = useState(LEAGUES[0]);
  const [week, setWeek] = useState(11);
  const [playerCount, setPlayerCount] = useState(5);
  const [storing, setStoring] = useState(false);

  const submitPin = () => {
    if (pin === STUDIO_PIN) {
      sessionStorage.setItem('studio_auth', 'true');
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin('');
    }
  };

  if (!unlocked) {
    return (
      <main style={styles.lockWrap}>
        <div style={styles.lockBox}>
          <div style={styles.lockBar} />
          <div style={styles.lockTitle}>Studio</div>
          <div style={styles.lockSub}>Enter PIN to continue</div>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={e => e.key === 'Enter' && submitPin()}
            style={{ ...styles.pinInput, ...(pinError ? styles.pinInputError : {}) }}
            placeholder="••••"
            autoFocus
          />
          {pinError && <div style={styles.pinErr}>Incorrect PIN</div>}
          <button onClick={submitPin} style={styles.pinBtn}>Unlock</button>
        </div>
      </main>
    );
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      setStoring(true);
      fetch(`${API}/auth/store-token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setConnected(true);
            localStorage.setItem('yahoo_connected', 'true');
          }
          setStoring(false);
          window.history.replaceState({}, '', '/studio');
        })
        .catch(() => setStoring(false));
    } else if (localStorage.getItem('yahoo_connected') === 'true') {
      fetch(`${API}/auth/status`, { credentials: 'include' })
        .then(r => r.json())
        .then(d => {
          setConnected(d.connected);
          if (!d.connected) localStorage.removeItem('yahoo_connected');
        })
        .catch(() => {});
    }
  }, []);

  const aWins = SAMPLE.teamA.score > SAMPLE.teamB.score;

  return (
    <main style={styles.main}>
      <div style={styles.header}>
        <div style={styles.bar} />
        <h1 style={styles.title}>Social Studio</h1>
        {storing && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Connecting...</div>}
        {!storing && (
          <div style={styles.connBadge(connected)}>
            <div style={styles.connDot(connected)} />
            {connected ? 'Yahoo connected' : 'Yahoo not connected'}
          </div>
        )}
        {!connected && !storing && (
          <a href={`${API}/auth/login`} style={styles.connectBtn}>Connect Yahoo</a>
        )}
        {connected && (
          <a href={`${API}/auth/logout`} style={styles.disconnectBtn} onClick={() => localStorage.removeItem('yahoo_connected')}>Disconnect</a>
        )}
      </div>

      <div style={styles.layout}>
        <div style={styles.controls}>
          <div style={styles.ctrlGroup}>
            <div style={styles.ctrlLabel}>League</div>
            {LEAGUES.map(l => (
              <button
                key={l.id}
                onClick={() => setLeague(l)}
                style={{ ...styles.ctrlBtn, ...(league.id === l.id ? styles.ctrlBtnActive : {}) }}
              >
                {l.name}
              </button>
            ))}
          </div>
          <div style={styles.ctrlGroup}>
            <div style={styles.ctrlLabel}>Week</div>
            <div style={styles.pills}>
              {[10,11,12,13,14].map(w => (
                <button key={w} onClick={() => setWeek(w)} style={{ ...styles.pill, ...(week === w ? styles.pillActive : {}) }}>{w}</button>
              ))}
            </div>
          </div>
          <div style={styles.ctrlGroup}>
            <div style={styles.ctrlLabel}>Top players</div>
            <div style={styles.pills}>
              {[3, 5].map(n => (
                <button key={n} onClick={() => setPlayerCount(n)} style={{ ...styles.pill, ...(playerCount === n ? styles.pillActive : {}) }}>Top {n}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.preview}>
          <div style={styles.previewLabel}>Preview — Week {week} · {league.name}</div>
          <div style={styles.card}>
            <div style={styles.cardAccent} />
            <div style={styles.cardWeek}>Week {week}</div>
            <div style={styles.scores}>
              <div style={styles.team}>
                <div style={{ ...styles.score, color: aWins ? 'var(--red)' : '#333' }}>{SAMPLE.teamA.score}</div>
                <div style={{ ...styles.teamName, color: aWins ? 'var(--red-dim)' : '#3a3a3a' }}>{SAMPLE.teamA.name}</div>
              </div>
              <div style={styles.scoreSep} />
              <div style={styles.team}>
                <div style={{ ...styles.score, color: !aWins ? 'var(--red)' : '#333' }}>{SAMPLE.teamB.score}</div>
                <div style={{ ...styles.teamName, color: !aWins ? 'var(--red-dim)' : '#3a3a3a' }}>{SAMPLE.teamB.name}</div>
              </div>
            </div>
            <div style={styles.divider} />
            <div style={styles.players}>
              <div style={styles.playerSide}>
                <div style={styles.playerHd}>Top performers <span style={{ marginLeft: 'auto' }}>Pts</span></div>
                {SAMPLE.teamA.players.slice(0, playerCount).map((p, i) => {
                  const beat = p.pts > p.proj;
                  return (
                    <div key={i} style={styles.playerRow}>
                      <span style={styles.pos}>{p.pos}</span>
                      <span style={styles.pname}>{p.name}</span>
                      <span style={{ ...styles.pts, color: beat ? '#4caf50' : (i === 0 ? 'var(--red)' : '#555') }}>{p.pts.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
              <div style={styles.playerDivider} />
              <div style={styles.playerSide}>
                <div style={styles.playerHd}>Top performers <span style={{ marginLeft: 'auto' }}>Pts</span></div>
                {SAMPLE.teamB.players.slice(0, playerCount).map((p, i) => {
                  const beat = p.pts > p.proj;
                  return (
                    <div key={i} style={styles.playerRow}>
                      <span style={styles.pos}>{p.pos}</span>
                      <span style={styles.pname}>{p.name}</span>
                      <span style={{ ...styles.pts, color: beat ? '#4caf50' : (i === 0 ? 'var(--red)' : '#555') }}>{p.pts.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={styles.cardFoot}>{league.name}</div>
          </div>
          <button style={styles.exportBtn}>Export for Instagram / Twitter</button>
        </div>
      </div>
    </main>
  );
}

const styles = {
  lockWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 52px)' },
  lockBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '36px 40px', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 10, position: 'relative', minWidth: 240 },
  lockBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--red)', borderRadius: '10px 10px 0 0' },
  lockTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.06em', color: 'var(--text)' },
  lockSub: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 },
  pinInput: { width: 120, padding: '10px 14px', textAlign: 'center', fontSize: 18, letterSpacing: '0.2em', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 6, color: 'var(--text)', outline: 'none' },
  pinInputError: { borderColor: 'var(--red)' },
  pinErr: { fontSize: 11, color: 'var(--red)', marginTop: -4 },
  pinBtn: { marginTop: 4, padding: '9px 28px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer' },
  main: { padding: '40px 32px', maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, position: 'relative', paddingTop: 8 },
  bar: { position: 'absolute', top: 0, left: 0, width: 24, height: 2, background: 'var(--red)' },
  title: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: '0.04em' },
  connBadge: (c) => ({ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: c ? 'var(--green)' : 'var(--text-muted)', marginLeft: 8 }),
  connDot: (c) => ({ width: 6, height: 6, borderRadius: '50%', background: c ? 'var(--green)' : '#444' }),
  connectBtn: { marginLeft: 8, padding: '7px 14px', borderRadius: 6, background: 'var(--red)', color: '#fff', fontSize: 12, fontWeight: 500 },
  disconnectBtn: { marginLeft: 8, padding: '7px 14px', borderRadius: 6, background: '#222', color: '#888', border: '0.5px solid #333', fontSize: 12, fontWeight: 500 },
  layout: { display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 },
  controls: { display: 'flex', flexDirection: 'column', gap: 20 },
  ctrlGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  ctrlLabel: { fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: 4 },
  ctrlBtn: { padding: '8px 10px', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--text-muted)', textAlign: 'left', transition: 'all 0.12s' },
  ctrlBtnActive: { borderColor: 'var(--red)', color: 'var(--text)', background: '#1a1616' },
  pills: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  pill: { padding: '5px 10px', borderRadius: 20, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text-muted)' },
  pillActive: { background: 'var(--red)', color: '#fff', borderColor: 'var(--red)' },
  preview: { display: 'flex', flexDirection: 'column', gap: 14 },
  previewLabel: { fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444' },
  card: { background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '20px', position: 'relative', maxWidth: 440 },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--red)', borderRadius: '8px 8px 0 0' },
  cardWeek: { fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#333', marginBottom: 14 },
  scores: { display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 },
  team: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  score: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 58, lineHeight: 1 },
  teamName: { fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' },
  scoreSep: { width: 1, height: 60, background: '#252525', margin: '0 10px' },
  divider: { height: '0.5px', background: '#252525', marginBottom: 14 },
  players: { display: 'grid', gridTemplateColumns: '1fr 0.5px 1fr', gap: 0 },
  playerSide: { display: 'flex', flexDirection: 'column', gap: 0 },
  playerDivider: { background: '#252525' },
  playerHd: { display: 'flex', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: 8, padding: '0 8px' },
  playerRow: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderTop: '0.5px solid #222' },
  pos: { fontSize: 9, color: '#444', width: 20 },
  pname: { fontSize: 11, color: '#999', flex: 1 },
  pts: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 15 },
  cardFoot: { fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2a2a2a', textAlign: 'center', marginTop: 14 },
  exportBtn: { padding: '10px 20px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500, maxWidth: 440, cursor: 'pointer' },
};