import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

const GREEN = '#7dff00';
const BLACK = '#0a0a0a';

const POS_COLORS = {
  QB: '#e53935', RB: '#1976d2', WR: '#388e3c', TE: '#f57c00',
  K: '#7b1fa2', DEF: '#455a64', FLEX: '#0288d1',
};

const LEAGUES = [
  { id: 'beaners-husseins', name: "Beaners & Husseins" },
  { id: 'rebirth', name: 'Rebirth' },
  { id: 'gentlemens-league', name: "Gentlemen's League" },
  { id: 'shoot-the-shits', name: 'Shoot the Shits' },
];

const STUDIO_PIN = '2121';

// ─── Data helpers ──────────────────────────────────────────────────────────────

function computeReport(data) {
  const { matchups } = data;
  const allTeams = matchups.flatMap(m => [
    { ...m.teamA, won: m.teamA.score > m.teamB.score },
    { ...m.teamB, won: m.teamB.score > m.teamA.score },
  ]);
  const scores = [...allTeams.map(t => t.score)].sort((a, b) => a - b);
  const mid = Math.floor(scores.length / 2);
  const median = scores.length % 2 === 0 ? (scores[mid - 1] + scores[mid]) / 2 : scores[mid];
  const lineupOfWeek = allTeams.reduce((b, t) => t.score > b.score ? t : b);
  const withMargin = matchups.map(m => ({
    ...m,
    margin: Math.abs(m.teamA.score - m.teamB.score),
    winner: m.teamA.score > m.teamB.score ? m.teamA : m.teamB,
    loser:  m.teamA.score > m.teamB.score ? m.teamB : m.teamA,
  }));
  const closest = withMargin.reduce((b, m) => m.margin < b.margin ? m : b);
  const biggestBlowout = withMargin.reduce((b, m) => m.margin > b.margin ? m : b);
  const winners = allTeams.filter(t => t.won);
  const losers  = allTeams.filter(t => !t.won);
  const luckyWinner  = winners.length ? winners.reduce((w, t) => t.score < w.score ? t : w) : null;
  const unluckyLoser = losers.length  ? losers.reduce((b, t) => t.score > b.score ? t : b) : null;
  const hasPlayers = matchups.some(m => (m.teamA.players?.length ?? 0) > 0);
  let mvp = null, bust = null;
  if (hasPlayers) {
    const all = matchups.flatMap(m => [
      ...(m.teamA.players || []).map(p => ({ ...p, team: m.teamA.name })),
      ...(m.teamB.players || []).map(p => ({ ...p, team: m.teamB.name })),
    ]).filter(p => p.position !== 'DEF');
    if (all.length) {
      mvp  = all.reduce((b, p) => p.points > b.points ? p : b);
      bust = all.reduce((w, p) => p.points < w.points ? p : w);
    }
  }
  return { median, lineupOfWeek, closest, biggestBlowout, luckyWinner, unluckyLoser, mvp, bust, hasPlayers };
}

// ─── Shared card pieces ────────────────────────────────────────────────────────

function CardFooter({ leagueName }) {
  return (
    <div style={{ borderTop: `1px solid ${GREEN}25`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
      <span style={{ fontSize: 9, color: GREEN, opacity: 0.65, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{leagueName}</span>
      <span style={{ fontSize: 9, color: GREEN, opacity: 0.4, letterSpacing: '0.06em' }}>@cfn_cuadz</span>
    </div>
  );
}

function AwardRow({ icon, label, name, sub, value, highlight }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: highlight ? `${GREEN}12` : 'transparent',
      borderRadius: 5, padding: '5px 7px',
      border: `0.5px solid ${highlight ? GREEN + '30' : 'transparent'}`,
    }}>
      <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 7.5, color: '#ffffff40', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: highlight ? GREEN : '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{name}</div>
        {sub && <div style={{ fontSize: 8.5, color: '#ffffff40', marginTop: 1 }}>{sub}</div>}
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, color: highlight ? GREEN : '#ffffff70', flexShrink: 0, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function PlayerPerf({ player, first }) {
  const bg = POS_COLORS[player.position] || '#555';
  const initials = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7.5, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: first ? 11 : 10, fontWeight: first ? 700 : 500, color: first ? '#fff' : '#ffffff99', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.name}
        </div>
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: first ? GREEN : '#ffffff70', flexShrink: 0 }}>
        {player.points.toFixed(1)}
      </div>
    </div>
  );
}

// ─── Card: Weekly Report ───────────────────────────────────────────────────────

function WeeklyReportCard({ report, week, leagueName }) {
  const { mvp, bust, lineupOfWeek, closest, biggestBlowout, luckyWinner, unluckyLoser, hasPlayers } = report;
  return (
    <div style={{ width: 540, height: 675, background: BLACK, padding: '22px 28px 18px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <img src="/cfn-logo.png" alt="CFN" crossOrigin="anonymous" style={{ height: 60, width: 'auto' }} />
      </div>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, color: GREEN, letterSpacing: '0.22em' }}>WEEK {week} RECAP</div>
        <div style={{ fontSize: 10, color: '#ffffff55', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>{leagueName}</div>
      </div>
      <div style={{ height: 1, background: `${GREEN}30`, marginBottom: 12 }} />
      {/* Awards */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {hasPlayers && mvp    && <AwardRow icon="🏆" label="MVP of the Week"      name={mvp.name}  sub={`${mvp.position} · ${mvp.team}`}   value={`${mvp.points.toFixed(1)}`}          highlight />}
        {hasPlayers && bust   && <AwardRow icon="💀" label="Dud of the Week"      name={bust.name} sub={`${bust.position} · ${bust.team}`} value={`${bust.points.toFixed(1)}`} />}
        <AwardRow icon="🔥" label="Lineup of the Week"   name={lineupOfWeek.name}                value={`${lineupOfWeek.score.toFixed(1)}`} highlight />
        <AwardRow icon="🤏" label="Closest Game"         name={`${closest.winner.name} def. ${closest.loser.name}`}       value={`${closest.margin.toFixed(1)} gap`} />
        <AwardRow icon="💣" label="Biggest Blowout"      name={`${biggestBlowout.winner.name} def. ${biggestBlowout.loser.name}`} value={`${biggestBlowout.margin.toFixed(1)} gap`} />
        {luckyWinner  && <AwardRow icon="🎰" label="Lucky Winner"   name={luckyWinner.name}  value={`${luckyWinner.score.toFixed(1)}`} />}
        {unluckyLoser && <AwardRow icon="😤" label="Unlucky Loser"  name={unluckyLoser.name} value={`${unluckyLoser.score.toFixed(1)}`} />}
      </div>
      <CardFooter leagueName={leagueName} />
    </div>
  );
}

// ─── Card: Matchup ────────────────────────────────────────────────────────────

function MatchupCard({ matchup, week, leagueName }) {
  const { teamA, teamB } = matchup;
  const aWins = teamA.score > teamB.score;
  const hasPlayers = (teamA.players?.length ?? 0) > 0 || (teamB.players?.length ?? 0) > 0;
  const topA = [...(teamA.players || [])].filter(p => p.position !== 'DEF').sort((a, b) => b.points - a.points).slice(0, 3);
  const topB = [...(teamB.players || [])].filter(p => p.position !== 'DEF').sort((a, b) => b.points - a.points).slice(0, 3);

  return (
    <div style={{ width: 540, height: 675, background: BLACK, padding: '18px 24px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <img src="/cfn-logo.png" alt="CFN" crossOrigin="anonymous" style={{ height: 30, width: 'auto' }} />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: GREEN, letterSpacing: '0.2em' }}>WEEK {week}</div>
      </div>
      {/* Status */}
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 8, letterSpacing: '0.25em', color: '#ffffff30', textTransform: 'uppercase' }}>FINAL</span>
      </div>
      {/* Scores */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, lineHeight: 1, color: aWins ? GREEN : '#ffffff44' }}>{teamA.score.toFixed(1)}</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: aWins ? '#ffffffcc' : '#ffffff44', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 4, lineHeight: 1.3 }}>{teamA.name}</div>
        </div>
        <div style={{ fontSize: 11, color: '#ffffff18', fontWeight: 700, paddingBottom: 22, flexShrink: 0 }}>VS</div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, lineHeight: 1, color: !aWins ? GREEN : '#ffffff44' }}>{teamB.score.toFixed(1)}</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: !aWins ? '#ffffffcc' : '#ffffff44', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 4, lineHeight: 1.3 }}>{teamB.name}</div>
        </div>
      </div>
      <div style={{ height: 1, background: `${GREEN}30`, marginBottom: 14 }} />
      {/* Top performers */}
      {hasPlayers && (
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8, color: GREEN, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10, opacity: 0.8 }}>TOP PERFORMERS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 14 }}>
              {topA.map((p, i) => <PlayerPerf key={i} player={p} first={i === 0} />)}
            </div>
            <div style={{ background: `${GREEN}20` }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 14 }}>
              {topB.map((p, i) => <PlayerPerf key={i} player={p} first={i === 0} />)}
            </div>
          </div>
        </div>
      )}
      <CardFooter leagueName={leagueName} />
    </div>
  );
}

// ─── Main Studio component ────────────────────────────────────────────────────

export default function Studio() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('studio_auth') === 'true');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [league, setLeague] = useState(LEAGUES[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const cardRefs = useRef([]);

  const submitPin = () => {
    if (pin === STUDIO_PIN) { sessionStorage.setItem('studio_auth', 'true'); setUnlocked(true); setPinError(false); }
    else { setPinError(true); setPin(''); }
  };

  useEffect(() => {
    if (!unlocked) return;
    setLoading(true); setData(null); setActiveSlide(0);
    fetch(`/data/${league.id}/matchups.json`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [league, unlocked]);

  const handleExport = async () => {
    if (!data || exporting) return;
    setExporting(true);
    try {
      await document.fonts.ready;
      const zip = new JSZip();
      const total = cardRefs.current.filter(Boolean).length;
      for (let i = 0; i < cardRefs.current.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        setExportProgress(`Rendering slide ${i + 1} of ${total}…`);
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: BLACK, logging: false });
        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        const label = i === 0 ? 'slide-1-weekly-report' : `slide-${i + 1}-matchup-${i}`;
        zip.file(`${league.id}-week${data.week}-${label}.png`, blob);
      }
      setExportProgress('Zipping…');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CFN-${league.id}-week${data.week}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setExportProgress('');
    } catch (err) {
      console.error(err);
      setExportProgress('Export failed — try again');
    }
    setExporting(false);
  };

  // ── PIN lock ──
  if (!unlocked) {
    return (
      <main style={S.lockWrap}>
        <div style={S.lockBox}>
          <div style={S.lockAccent} />
          <img src="/cfn-logo.png" alt="CFN" style={{ height: 64, width: 'auto', marginBottom: 4 }} />
          <div style={S.lockSub}>Social Studio — Enter PIN</div>
          <input
            type="password" inputMode="numeric" maxLength={6} value={pin}
            onChange={e => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={e => e.key === 'Enter' && submitPin()}
            style={{ ...S.pinInput, ...(pinError ? S.pinInputError : {}) }}
            placeholder="••••" autoFocus
          />
          {pinError && <div style={S.pinErr}>Incorrect PIN</div>}
          <button onClick={submitPin} style={S.pinBtn}>Unlock</button>
        </div>
      </main>
    );
  }

  const report = data ? computeReport(data) : null;
  const slideCount = data ? 1 + data.matchups.length : 0;

  return (
    <main style={S.main}>
      {/* Header */}
      <div style={S.header}>
        <img src="/cfn-logo.png" alt="CFN" style={{ height: 40, width: 'auto' }} />
        <div style={S.headerText}>
          <div style={S.title}>Social Studio</div>
          <div style={S.subtitle}>Instagram export · 1080 × 1350 · 4:5 portrait</div>
        </div>
      </div>

      <div style={S.layout}>
        {/* ── Sidebar ── */}
        <div style={S.sidebar}>
          <div style={S.sideLabel}>League</div>
          {LEAGUES.map(l => (
            <button key={l.id} onClick={() => setLeague(l)} style={{ ...S.leagueBtn, ...(league.id === l.id ? S.leagueBtnActive : {}) }}>
              {l.name}
            </button>
          ))}

          {data && (
            <>
              <div style={{ ...S.sideLabel, marginTop: 20 }}>Slides</div>
              {Array.from({ length: slideCount }, (_, i) => (
                <button key={i} onClick={() => setActiveSlide(i)} style={{ ...S.slideThumb, ...(activeSlide === i ? S.slideThumbActive : {}) }}>
                  {i === 0 ? '📊 Weekly Report' : `⚔️ Matchup ${i}`}
                </button>
              ))}
            </>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 20 }}>
            {exportProgress && <div style={S.progressMsg}>{exportProgress}</div>}
            <button
              onClick={handleExport}
              disabled={!data || exporting}
              style={{ ...S.exportBtn, ...(!data || exporting ? S.exportBtnDisabled : {}) }}
            >
              {exporting ? 'Exporting…' : `↓ Export ${slideCount} slides as ZIP`}
            </button>
          </div>
        </div>

        {/* ── Preview ── */}
        <div style={S.previewArea}>
          {loading && <div style={S.msg}>Loading {league.name}…</div>}
          {!loading && !data && <div style={S.msg}>Could not load data for {league.name}</div>}

          {data && report && (
            <>
              <div style={S.previewLabel}>
                Preview — Slide {activeSlide + 1} of {slideCount}
              </div>
              {/* Visible preview at 50% scale */}
              <div style={S.previewWrapper}>
                <div style={S.previewScale}>
                  {activeSlide === 0
                    ? <WeeklyReportCard report={report} week={data.week} leagueName={league.name} />
                    : <MatchupCard matchup={data.matchups[activeSlide - 1]} week={data.week} leagueName={league.name} />
                  }
                </div>
              </div>
              <div style={S.slideNav}>
                <button onClick={() => setActiveSlide(s => Math.max(0, s - 1))} disabled={activeSlide === 0} style={S.navBtn}>← Prev</button>
                <span style={S.navCount}>{activeSlide + 1} / {slideCount}</span>
                <button onClick={() => setActiveSlide(s => Math.min(slideCount - 1, s + 1))} disabled={activeSlide === slideCount - 1} style={S.navBtn}>Next →</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden cards for html2canvas capture — rendered off-screen at full size */}
      {data && report && (
        <div style={{ position: 'fixed', left: -1200, top: 0, pointerEvents: 'none' }}>
          <div ref={el => cardRefs.current[0] = el}>
            <WeeklyReportCard report={report} week={data.week} leagueName={league.name} />
          </div>
          {data.matchups.map((m, i) => (
            <div key={i} ref={el => cardRefs.current[i + 1] = el}>
              <MatchupCard matchup={m} week={data.week} leagueName={league.name} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const S = {
  lockWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 52px)', background: BLACK },
  lockBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '36px 40px', background: '#111', border: `0.5px solid ${GREEN}40`, borderRadius: 10, position: 'relative' },
  lockAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: GREEN, borderRadius: '10px 10px 0 0' },
  lockSub: { fontSize: 12, color: '#ffffff55', marginBottom: 4, letterSpacing: '0.06em' },
  pinInput: { width: 120, padding: '10px 14px', textAlign: 'center', fontSize: 18, letterSpacing: '0.2em', background: '#1a1a1a', border: `0.5px solid #333`, borderRadius: 6, color: '#fff', outline: 'none' },
  pinInputError: { borderColor: GREEN },
  pinErr: { fontSize: 11, color: GREEN, marginTop: -4 },
  pinBtn: { marginTop: 4, padding: '9px 28px', background: GREEN, color: BLACK, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em' },

  main: { padding: '32px 24px', maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 },
  headerText: { display: 'flex', flexDirection: 'column', gap: 3 },
  title: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: '0.04em', color: 'var(--text)', lineHeight: 1 },
  subtitle: { fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' },

  layout: { display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, minHeight: 600 },

  sidebar: { display: 'flex', flexDirection: 'column', gap: 5 },
  sideLabel: { fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', opacity: 0.5, marginBottom: 2 },
  leagueBtn: { padding: '8px 10px', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--text-muted)', textAlign: 'left', cursor: 'pointer' },
  leagueBtnActive: { borderColor: GREEN, color: '#fff', background: '#1a1f10' },
  slideThumb: { padding: '6px 10px', background: 'none', border: '0.5px solid transparent', borderRadius: 5, fontSize: 10, color: 'var(--text-muted)', textAlign: 'left', cursor: 'pointer' },
  slideThumbActive: { borderColor: `${GREEN}50`, color: 'var(--text)', background: '#1a1f10' },
  progressMsg: { fontSize: 10, color: GREEN, opacity: 0.8, marginBottom: 8, textAlign: 'center' },
  exportBtn: { width: '100%', padding: '11px', background: GREEN, color: BLACK, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' },
  exportBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },

  previewArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 },
  previewLabel: { fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', opacity: 0.5, alignSelf: 'flex-start' },
  // Cards render at 540×675; preview at 50% → 270×337
  previewWrapper: { width: 270, height: 337, overflow: 'hidden', border: `0.5px solid ${GREEN}25`, borderRadius: 6, boxShadow: `0 0 40px ${GREEN}15`, flexShrink: 0 },
  previewScale: { transform: 'scale(0.5)', transformOrigin: 'top left', width: 540, height: 675 },
  slideNav: { display: 'flex', alignItems: 'center', gap: 16 },
  navBtn: { padding: '7px 14px', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 5, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' },
  navCount: { fontSize: 11, color: 'var(--text-muted)' },
  msg: { color: 'var(--text-muted)', fontSize: 13, marginTop: 60 },
};
