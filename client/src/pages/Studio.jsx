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
  let mvp = null, bust = null, motms = [];
  if (hasPlayers) {
    const all = matchups.flatMap(m => [
      ...(m.teamA.players || []).map(p => ({ ...p, team: m.teamA.name })),
      ...(m.teamB.players || []).map(p => ({ ...p, team: m.teamB.name })),
    ]).filter(p => p.position !== 'DEF');
    if (all.length) {
      mvp  = all.reduce((b, p) => p.points > b.points ? p : b);
      bust = all.reduce((w, p) => p.points < w.points ? p : w);
    }
    motms = matchups.map(m => {
      const inGame = [
        ...(m.teamA.players || []).map(p => ({ ...p, team: m.teamA.name })),
        ...(m.teamB.players || []).map(p => ({ ...p, team: m.teamB.name })),
      ].filter(p => p.position !== 'DEF');
      const motm = inGame.length ? inGame.reduce((b, p) => p.points > b.points ? p : b) : null;
      return { matchup: m, motm };
    });
  }
  return { median, lineupOfWeek, closest, biggestBlowout, luckyWinner, unluckyLoser, mvp, bust, hasPlayers, motms };
}

// Route through weserv.nl which adds CORS headers, so fetch() can get data URLs
const IMG_PROXY = 'https://images.weserv.nl/?url=';

async function prefetchImages(matchups, playerImagesDb) {
  const cache = {};
  const players = matchups.flatMap(m => [...(m.teamA.players || []), ...(m.teamB.players || [])]);
  const unique = [...new Map(players.map(p => [p.name, p])).values()];

  // Fetch in batches of 5 — weserv.nl handles rate limiting gracefully
  const BATCH = 5;
  for (let i = 0; i < unique.length; i += BATCH) {
    await Promise.allSettled(unique.slice(i, i + BATCH).map(async p => {
      const entry = playerImagesDb[p.name];
      if (!entry?.sleeper_id) return;
      // Proxy URL: strips https://, weserv.nl re-fetches with CORS headers
      const proxyUrl = `${IMG_PROXY}sleepercdn.com/content/nfl/players/thumb/${entry.sleeper_id}.jpg`;
      try {
        const res = await fetch(proxyUrl);
        if (!res.ok) return;
        const blob = await res.blob();
        cache[p.name] = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.readAsDataURL(blob);
        });
      } catch {}
    }));
    if (i + BATCH < unique.length) await new Promise(r => setTimeout(r, 80));
  }
  return cache;
}

// ─── Shared pieces ─────────────────────────────────────────────────────────────

function CardFooter({ leagueName }) {
  return (
    <div style={{ borderTop: `1px solid ${GREEN}25`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
      <span style={{ fontSize: 9, color: GREEN, opacity: 0.65, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{leagueName}</span>
      <span style={{ fontSize: 9, color: GREEN, opacity: 0.4, letterSpacing: '0.06em' }}>@cuadzfantasynetwork</span>
    </div>
  );
}

function PlayerCircle({ player, size, imageSrc }) {
  const bg = POS_COLORS[player.position] || '#555';
  const initials = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const base = { width: size, height: size, minWidth: size, borderRadius: '50%', flexShrink: 0 };
  if (imageSrc) {
    return (
      <div style={{ ...base, backgroundImage: `url("${imageSrc}")`, backgroundSize: 'cover', backgroundPosition: 'center top', border: `1px solid ${GREEN}40` }} />
    );
  }
  return (
    <div style={{ ...base, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: '#fff' }}>
      {initials}
    </div>
  );
}

// ─── Card: Weekly Report ───────────────────────────────────────────────────────

function AwardRow({ icon, label, name, value, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 6px', borderRadius: 4, background: highlight ? `${GREEN}10` : 'transparent', border: `0.5px solid ${highlight ? GREEN + '22' : 'transparent'}` }}>
      <span style={{ fontSize: 12, flexShrink: 0, width: 16, textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 6.5, color: '#ffffff30', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: highlight ? GREEN : '#ffffffcc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: highlight ? GREEN : '#ffffff45', flexShrink: 0 }}>{value}</div>
    </div>
  );
}

// MOTM mini-card — shown in the 2-col grid at top of weekly report
function MotmMiniCard({ matchup: m, motm, imageCache }) {
  if (!motm) return <div style={{ flex: 1 }} />;
  const aWins = m.teamA.score > m.teamB.score;
  const imgSrc = imageCache?.[motm.name];
  const winnerName = aWins ? m.teamA.name : m.teamB.name;
  const loserName  = aWins ? m.teamB.name : m.teamA.name;
  const winScore   = aWins ? m.teamA.score : m.teamB.score;
  const loseScore  = aWins ? m.teamB.score : m.teamA.score;
  return (
    <div style={{ flex: 1, background: '#111', border: `0.5px solid ${GREEN}20`, borderRadius: 6, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden' }}>
      {/* thin green top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: GREEN, opacity: 0.6 }} />
      {/* score context */}
      <div style={{ fontSize: 8, color: '#ffffff50', letterSpacing: '0.04em', lineHeight: 1.3 }}>
        <span style={{ color: '#ffffffaa', fontWeight: 700 }}>{winnerName}</span>
        <span style={{ color: '#ffffff30', margin: '0 4px' }}>{winScore.toFixed(1)}–{loseScore.toFixed(1)}</span>
        <span style={{ color: '#ffffff40' }}>{loserName}</span>
      </div>
      {/* MOTM player */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <PlayerCircle player={motm} size={28} imageSrc={imgSrc} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{motm.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 7, background: POS_COLORS[motm.position] || '#555', color: '#fff', borderRadius: 3, padding: '1px 4px', fontWeight: 700 }}>{motm.position}</span>
            <span style={{ fontSize: 8, color: '#ffffff40', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{motm.team}</span>
          </div>
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: GREEN, flexShrink: 0, lineHeight: 1 }}>{motm.points.toFixed(1)}</div>
      </div>
    </div>
  );
}

function WeeklyReportCard({ report, week, leagueName, imageCache }) {
  const { mvp, bust, lineupOfWeek, closest, biggestBlowout, luckyWinner, unluckyLoser, hasPlayers, motms } = report;

  // Pair motms into rows of 2
  const motmPairs = [];
  for (let i = 0; i < motms.length; i += 2) motmPairs.push(motms.slice(i, i + 2));

  return (
    <div style={{ width: 540, height: 675, background: BLACK, padding: '16px 22px 14px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <img src="/cfn-logo.png" alt="CFN" crossOrigin="anonymous" style={{ height: 40, width: 'auto' }} />
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 19, color: GREEN, letterSpacing: '0.2em', lineHeight: 1 }}>WEEK {week} RECAP</div>
          <div style={{ fontSize: 8.5, color: '#ffffff40', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>{leagueName}</div>
        </div>
      </div>
      <div style={{ height: 1, background: `${GREEN}25`, marginBottom: 8 }} />

      {/* ── MOTM section — cards at top ── */}
      {hasPlayers && motms.length > 0 && (
        <>
          <div style={{ fontSize: 7, color: GREEN, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6, opacity: 0.7 }}>Man of the Matchup</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {motmPairs.map((pair, ri) => (
              <div key={ri} style={{ display: 'flex', gap: 5 }}>
                {pair.map((item, ci) => (
                  <MotmMiniCard key={ci} matchup={item.matchup} motm={item.motm} imageCache={imageCache} />
                ))}
                {/* fill empty slot if odd count */}
                {pair.length < 2 && <div style={{ flex: 1 }} />}
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: `${GREEN}20`, marginBottom: 8 }} />
        </>
      )}

      {/* ── Awards ── */}
      <div style={{ fontSize: 7, color: GREEN, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6, opacity: 0.7 }}>Awards</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {hasPlayers && mvp  && <AwardRow icon="🏆" label="MVP of the Week"    name={`${mvp.name} · ${mvp.position} · ${mvp.team}`}    value={`${mvp.points.toFixed(1)}`}  highlight />}
        {hasPlayers && bust && <AwardRow icon="💀" label="Dud of the Week"    name={`${bust.name} · ${bust.position} · ${bust.team}`}  value={`${bust.points.toFixed(1)}`} />}
        <AwardRow icon="🔥" label="Lineup of the Week"  name={lineupOfWeek.name}  value={`${lineupOfWeek.score.toFixed(1)}`} highlight />
        <AwardRow icon="🤏" label="Closest Game"        name={`${closest.winner.name} def. ${closest.loser.name}`}             value={`+${closest.margin.toFixed(1)}`} />
        <AwardRow icon="💣" label="Biggest Blowout"     name={`${biggestBlowout.winner.name} def. ${biggestBlowout.loser.name}`} value={`+${biggestBlowout.margin.toFixed(1)}`} />
        {luckyWinner  && <AwardRow icon="🎰" label="Lucky Winner"  name={luckyWinner.name}  value={`${luckyWinner.score.toFixed(1)}`} />}
        {unluckyLoser && <AwardRow icon="😤" label="Unlucky Loser" name={unluckyLoser.name} value={`${unluckyLoser.score.toFixed(1)}`} />}
      </div>

      <CardFooter leagueName={leagueName} />
    </div>
  );
}

// ─── Card: Matchup — all starters, fills the full card ────────────────────────

function PlayerRow({ player, imageSrc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <PlayerCircle player={player} size={26} imageSrc={imageSrc} />
      <span style={{ fontSize: 9, color: '#ffffff35', width: 24, flexShrink: 0, fontWeight: 700, letterSpacing: '0.02em' }}>{player.position}</span>
      <span style={{ fontSize: 11, color: '#ffffffaa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</span>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, fontWeight: 700, flexShrink: 0, minWidth: 34, textAlign: 'right', color: GREEN }}>{player.points.toFixed(1)}</span>
    </div>
  );
}

function StarterColumn({ players, imageCache }) {
  if (!players || players.length === 0) return <div style={{ flex: 1 }} />;
  // Sort by positional order: QB → RB → WR → TE → FLEX → K → DEF
  const POS_ORDER = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF'];
  const sorted = [...players].sort((a, b) => {
    const ai = POS_ORDER.indexOf(a.position); const bi = POS_ORDER.indexOf(b.position);
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return b.points - a.points;
  });
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sorted.map((p, i) => <PlayerRow key={i} player={p} imageSrc={imageCache?.[p.name]} />)}
    </div>
  );
}

function MatchupCard({ matchup, week, leagueName, imageCache }) {
  const { teamA, teamB } = matchup;
  const aWins = teamA.score > teamB.score;
  const hasPlayers = (teamA.players?.length ?? 0) > 0 || (teamB.players?.length ?? 0) > 0;

  return (
    <div style={{ width: 540, height: 675, background: BLACK, padding: '14px 20px 12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', gap: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: GREEN }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <img src="/cfn-logo.png" alt="CFN" crossOrigin="anonymous" style={{ height: 26, width: 'auto' }} />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, color: GREEN, letterSpacing: '0.22em' }}>WEEK {week}</div>
      </div>

      {/* FINAL label */}
      <div style={{ textAlign: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 7.5, letterSpacing: '0.28em', color: '#ffffff20', textTransform: 'uppercase' }}>FINAL</span>
      </div>

      {/* Scores */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 62, lineHeight: 1, color: aWins ? GREEN : '#ffffff28' }}>{teamA.score.toFixed(1)}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: aWins ? '#ffffffcc' : '#ffffff30', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2, lineHeight: 1.3 }}>{teamA.name}</div>
        </div>
        <div style={{ fontSize: 9, color: '#ffffff12', fontWeight: 700, paddingBottom: 18, flexShrink: 0 }}>VS</div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 62, lineHeight: 1, color: !aWins ? GREEN : '#ffffff28' }}>{teamB.score.toFixed(1)}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: !aWins ? '#ffffffcc' : '#ffffff30', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2, lineHeight: 1.3 }}>{teamB.name}</div>
        </div>
      </div>

      <div style={{ height: 1, background: `${GREEN}22`, marginBottom: 10 }} />

      {/* All starters — two columns */}
      {hasPlayers && (
        <>
          <div style={{ fontSize: 7.5, color: GREEN, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8, opacity: 0.75 }}>Starters</div>
          <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0 }}>
            <StarterColumn players={teamA.players} imageCache={imageCache} />
            <div style={{ width: 1, background: `${GREEN}18`, margin: '0 12px', flexShrink: 0 }} />
            <StarterColumn players={teamB.players} imageCache={imageCache} />
          </div>
        </>
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
  const [playerImagesDb, setPlayerImagesDb] = useState({});
  const [imageCache, setImageCache] = useState({});
  const [imagesPrefetched, setImagesPrefetched] = useState(false);
  const cardRefs = useRef([]);

  const submitPin = () => {
    if (pin === STUDIO_PIN) { sessionStorage.setItem('studio_auth', 'true'); setUnlocked(true); setPinError(false); }
    else { setPinError(true); setPin(''); }
  };

  useEffect(() => {
    fetch('/data/player-images.json').then(r => r.ok ? r.json() : {}).then(setPlayerImagesDb).catch(() => {});
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    setLoading(true); setData(null); setActiveSlide(0); setImageCache({}); setImagesPrefetched(false);
    fetch(`/data/${league.id}/matchups.json`).then(r => r.ok ? r.json() : null).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [league, unlocked]);

  useEffect(() => {
    if (!data || !Object.keys(playerImagesDb).length) return;
    prefetchImages(data.matchups, playerImagesDb).then(cache => { setImageCache(cache); setImagesPrefetched(true); });
  }, [data, playerImagesDb]);

  const handleExport = async () => {
    if (!data || exporting) return;
    setExporting(true);
    try {
      await document.fonts.ready;
      const zip = new JSZip();
      const refs = cardRefs.current.filter(Boolean);
      for (let i = 0; i < refs.length; i++) {
        setExportProgress(`Rendering slide ${i + 1} of ${refs.length}…`);
        const canvas = await html2canvas(refs[i], { scale: 2, useCORS: true, backgroundColor: BLACK, logging: false });
        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        const label = i === 0 ? 'slide-1-weekly-report' : `slide-${i + 1}-matchup-${i}`;
        zip.file(`${league.id}-week${data.week}-${label}.png`, blob);
      }
      setExportProgress('Zipping…');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a'); a.href = url; a.download = `CFN-${league.id}-week${data.week}.zip`; a.click();
      URL.revokeObjectURL(url); setExportProgress('');
    } catch (err) { console.error(err); setExportProgress('Export failed — try again'); }
    setExporting(false);
  };

  if (!unlocked) {
    return (
      <main style={S.lockWrap}>
        <div style={S.lockBox}>
          <div style={S.lockAccent} />
          <img src="/cfn-logo.png" alt="CFN" style={{ height: 64, width: 'auto', marginBottom: 4 }} />
          <div style={S.lockSub}>Social Studio — Enter PIN</div>
          <input type="password" inputMode="numeric" maxLength={6} value={pin}
            onChange={e => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={e => e.key === 'Enter' && submitPin()}
            style={{ ...S.pinInput, ...(pinError ? S.pinInputError : {}) }} placeholder="••••" autoFocus />
          {pinError && <div style={S.pinErr}>Incorrect PIN</div>}
          <button onClick={submitPin} style={S.pinBtn}>Unlock</button>
        </div>
      </main>
    );
  }

  const report = data ? computeReport(data) : null;
  const slideCount = data ? 1 + data.matchups.length : 0;
  const hasPlayerData = data?.matchups?.some(m => (m.teamA.players?.length ?? 0) > 0);
  const imagesReady = !hasPlayerData || imagesPrefetched;

  return (
    <main style={S.main}>
      <div style={S.header}>
        <img src="/cfn-logo.png" alt="CFN" style={{ height: 40, width: 'auto' }} />
        <div style={S.headerText}>
          <div style={S.title}>Social Studio</div>
          <div style={S.subtitle}>Instagram export · 1080 × 1350 · 4:5 portrait</div>
        </div>
        {data && !imagesReady && <div style={{ fontSize: 10, color: GREEN, opacity: 0.6, marginLeft: 'auto' }}>Loading player photos…</div>}
      </div>

      <div style={S.layout}>
        <div style={S.sidebar}>
          <div style={S.sideLabel}>League</div>
          {LEAGUES.map(l => (
            <button key={l.id} onClick={() => setLeague(l)} style={{ ...S.leagueBtn, ...(league.id === l.id ? S.leagueBtnActive : {}) }}>{l.name}</button>
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
            <button onClick={handleExport} disabled={!data || exporting} style={{ ...S.exportBtn, ...(!data || exporting ? S.exportBtnDisabled : {}) }}>
              {exporting ? 'Exporting…' : `↓ Export ${slideCount} slides as ZIP`}
            </button>
          </div>
        </div>

        <div style={S.previewArea}>
          {loading && <div style={S.msg}>Loading {league.name}…</div>}
          {!loading && !data && <div style={S.msg}>Could not load data for {league.name}</div>}
          {data && report && (
            <>
              <div style={S.previewLabel}>Preview — Slide {activeSlide + 1} of {slideCount}</div>
              <div style={S.previewWrapper}>
                <div style={S.previewScale}>
                  {activeSlide === 0
                    ? <WeeklyReportCard report={report} week={data.week} leagueName={league.name} imageCache={imageCache} />
                    : <MatchupCard matchup={data.matchups[activeSlide - 1]} week={data.week} leagueName={league.name} imageCache={imageCache} />}
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

      {data && report && (
        <div style={{ position: 'fixed', left: -1200, top: 0, pointerEvents: 'none' }}>
          <div ref={el => cardRefs.current[0] = el}>
            <WeeklyReportCard report={report} week={data.week} leagueName={league.name} imageCache={imageCache} />
          </div>
          {data.matchups.map((m, i) => (
            <div key={i} ref={el => cardRefs.current[i + 1] = el}>
              <MatchupCard matchup={m} week={data.week} leagueName={league.name} imageCache={imageCache} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

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
  previewWrapper: { width: 270, height: 337, overflow: 'hidden', border: `0.5px solid ${GREEN}25`, borderRadius: 6, boxShadow: `0 0 40px ${GREEN}15`, flexShrink: 0 },
  previewScale: { transform: 'scale(0.5)', transformOrigin: 'top left', width: 540, height: 675 },
  slideNav: { display: 'flex', alignItems: 'center', gap: 16 },
  navBtn: { padding: '7px 14px', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 5, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' },
  navCount: { fontSize: 11, color: 'var(--text-muted)' },
  msg: { color: 'var(--text-muted)', fontSize: 13, marginTop: 60 },
};
