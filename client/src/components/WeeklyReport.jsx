import { useState, useEffect } from 'react';
import PlayerAvatar from './PlayerAvatar';

// ─── Data computation ──────────────────────────────────────────────────────────

function computeReport(data) {
  const { matchups, week } = data;

  const allTeams = matchups.flatMap(m => [
    { ...m.teamA, won: m.teamA.score > m.teamB.score },
    { ...m.teamB, won: m.teamB.score > m.teamA.score },
  ]);

  const scores = [...allTeams.map(t => t.score)].sort((a, b) => a - b);
  const mid = Math.floor(scores.length / 2);
  const median = scores.length % 2 === 0
    ? (scores[mid - 1] + scores[mid]) / 2
    : scores[mid];

  // Team-level awards
  const lineupOfWeek = allTeams.reduce((best, t) => t.score > best.score ? t : best);

  const withMargin = matchups.map(m => ({
    ...m,
    margin: Math.abs(m.teamA.score - m.teamB.score),
    winner: m.teamA.score > m.teamB.score ? m.teamA : m.teamB,
    loser:  m.teamA.score > m.teamB.score ? m.teamB : m.teamA,
  }));
  const closest      = withMargin.reduce((b, m) => m.margin < b.margin ? m : b);
  const biggestBlowout = withMargin.reduce((b, m) => m.margin > b.margin ? m : b);

  const winners = allTeams.filter(t => t.won);
  const losers  = allTeams.filter(t => !t.won);
  const luckyWinner   = winners.length ? winners.reduce((w, t) => t.score < w.score ? t : w) : null;
  const unluckyLoser  = losers.length  ? losers.reduce((b, t)  => t.score > b.score ? t : b) : null;

  // Player-level awards
  const hasPlayers = matchups.some(m => (m.teamA.players?.length ?? 0) > 0 || (m.teamB.players?.length ?? 0) > 0);
  let mvp = null, bust = null, motms = [];

  if (hasPlayers) {
    const allPlayers = matchups.flatMap(m => [
      ...(m.teamA.players || []).map(p => ({ ...p, team: m.teamA.name })),
      ...(m.teamB.players || []).map(p => ({ ...p, team: m.teamB.name })),
    ]).filter(p => p.position !== 'DEF');

    if (allPlayers.length) {
      mvp  = allPlayers.reduce((best, p) => p.points > best.points ? p : best);
      bust = allPlayers.reduce((worst, p) => p.points < worst.points ? p : worst);
    }

    motms = matchups.map(m => {
      const inGame = [
        ...(m.teamA.players || []).map(p => ({ ...p, team: m.teamA.name })),
        ...(m.teamB.players || []).map(p => ({ ...p, team: m.teamB.name })),
      ].filter(p => p.position !== 'DEF');
      const motm = inGame.length ? inGame.reduce((best, p) => p.points > best.points ? p : best) : null;
      return { matchup: m, motm };
    });
  }

  return {
    week, median,
    lineupOfWeek, closest, biggestBlowout, luckyWinner, unluckyLoser,
    mvp, bust, motms, hasPlayers,
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function AwardCard({ icon, label, title, subtitle, extra, accent = false, wide = false }) {
  return (
    <div style={{ ...S.card, ...(wide ? S.cardWide : {}), ...(accent ? S.cardAccent : {}) }}>
      <div style={S.cardBar} />
      <div style={S.awardIcon}>{icon}</div>
      <div style={S.awardLabel}>{label}</div>
      <div style={{ ...S.awardTitle, color: accent ? 'var(--red)' : 'var(--text)' }}>{title}</div>
      {subtitle && <div style={S.awardSub}>{subtitle}</div>}
      {extra && <div style={S.awardExtra}>{extra}</div>}
    </div>
  );
}

function PlayerAwardCard({ icon, label, player, accent = false }) {
  if (!player) return null;
  return (
    <div style={{ ...S.card, ...(accent ? S.cardAccent : {}) }}>
      <div style={S.cardBar} />
      <div style={S.awardIcon}>{icon}</div>
      <div style={S.awardLabel}>{label}</div>
      <div style={S.playerRow}>
        <PlayerAvatar name={player.name} position={player.position} size={40} />
        <div style={S.playerInfo}>
          <div style={{ ...S.awardTitle, color: accent ? 'var(--red)' : 'var(--text)', marginBottom: 2 }}>
            {player.name}
          </div>
          <div style={S.playerMeta}>
            <span style={{ ...S.posBadge, background: POS_COLORS[player.position] || '#555' }}>
              {player.position}
            </span>
            <span style={S.awardSub}>{player.team}</span>
          </div>
        </div>
        <div style={{ ...S.bigScore, color: accent ? 'var(--red)' : 'var(--text)' }}>
          {player.points.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

function MotmGrid({ motms }) {
  if (!motms.length) return null;
  return (
    <section style={S.section}>
      <h2 style={S.sectionTitle}>Man of the Matchup</h2>
      <div style={S.motmGrid}>
        {motms.map(({ matchup: m, motm }, i) => {
          if (!motm) return null;
          const aWins = m.teamA.score > m.teamB.score;
          return (
            <div key={i} style={S.motmCard}>
              <div style={S.cardBar} />
              {/* Matchup scores */}
              <div style={S.motmScores}>
                <div style={S.motmTeam}>
                  <span style={{ ...S.motmScore, color: aWins ? 'var(--red)' : 'var(--text-muted)' }}>
                    {m.teamA.score.toFixed(1)}
                  </span>
                  <span style={{ ...S.motmTeamName, color: aWins ? 'var(--text)' : 'var(--text-muted)' }}>
                    {m.teamA.name}
                  </span>
                </div>
                <span style={S.motmVs}>vs</span>
                <div style={{ ...S.motmTeam, alignItems: 'flex-end' }}>
                  <span style={{ ...S.motmScore, color: !aWins ? 'var(--red)' : 'var(--text-muted)' }}>
                    {m.teamB.score.toFixed(1)}
                  </span>
                  <span style={{ ...S.motmTeamName, color: !aWins ? 'var(--text)' : 'var(--text-muted)', textAlign: 'right' }}>
                    {m.teamB.name}
                  </span>
                </div>
              </div>
              {/* MOTM player */}
              <div style={S.motmDivider} />
              <div style={S.motmPlayer}>
                <div style={S.motmBadge}>MOTM</div>
                <div style={S.motmPlayerRow}>
                  <PlayerAvatar name={motm.name} position={motm.position} size={32} />
                  <div style={S.motmPlayerInfo}>
                    <div style={S.motmPlayerName}>{motm.name}</div>
                    <div style={S.motmPlayerMeta}>
                      <span style={{ ...S.posBadge, background: POS_COLORS[motm.position] || '#555', fontSize: 8 }}>
                        {motm.position}
                      </span>
                      <span style={S.motmPlayerTeam}>{motm.team}</span>
                    </div>
                  </div>
                  <div style={S.motmPts}>{motm.points.toFixed(1)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function WeeklyReport({ leagueId }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/data/${leagueId}/matchups.json`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [leagueId]);

  if (loading) return <div style={S.note}>Loading report...</div>;
  if (!data)   return <div style={S.note}>Could not load matchup data.</div>;

  const r = computeReport(data);

  return (
    <div>
      <div style={S.header}>
        <span style={S.weekLabel}>Week {r.week}</span>
        <span style={S.reportTitle}>Weekly Report</span>
        <span style={S.medianPill}>Median: {r.median.toFixed(1)}</span>
      </div>

      {/* ── Player awards (only if data exists) ── */}
      {r.hasPlayers && (
        <section style={S.section}>
          <h2 style={S.sectionTitle}>Player Awards</h2>
          <div style={S.grid}>
            <PlayerAwardCard
              icon="🏆"
              label="MVP of the Week"
              player={r.mvp}
              accent
            />
            <PlayerAwardCard
              icon="💀"
              label="Dud of the Week"
              player={r.bust}
            />
          </div>
        </section>
      )}

      {/* ── Man of the Matchup ── */}
      {r.hasPlayers && <MotmGrid motms={r.motms} />}

      {/* ── Team awards ── */}
      <section style={S.section}>
        <h2 style={S.sectionTitle}>Team Awards</h2>
        <div style={S.grid}>
          <AwardCard
            icon="🔥"
            label="Lineup of the Week"
            title={r.lineupOfWeek.name}
            subtitle={`${r.lineupOfWeek.score.toFixed(1)} pts`}
            accent
          />
          <AwardCard
            icon="🎰"
            label="Lucky Winner"
            title={r.luckyWinner?.name ?? '—'}
            subtitle={r.luckyWinner ? `${r.luckyWinner.score.toFixed(1)} pts — below median` : undefined}
          />
          <AwardCard
            icon="😤"
            label="Unlucky Loser"
            title={r.unluckyLoser?.name ?? '—'}
            subtitle={r.unluckyLoser ? `${r.unluckyLoser.score.toFixed(1)} pts — above median` : undefined}
          />
        </div>
      </section>

      {/* ── Matchup awards ── */}
      <section style={S.section}>
        <h2 style={S.sectionTitle}>Matchup Awards</h2>
        <div style={S.grid}>
          <AwardCard
            icon="🤏"
            label="Closest Game"
            title={`${r.closest.winner.name} def. ${r.closest.loser.name}`}
            subtitle={`${r.closest.winner.score.toFixed(1)} – ${r.closest.loser.score.toFixed(1)}`}
            extra={`Margin: ${r.closest.margin.toFixed(1)} pts`}
          />
          <AwardCard
            icon="💣"
            label="Biggest Blowout"
            title={`${r.biggestBlowout.winner.name} def. ${r.biggestBlowout.loser.name}`}
            subtitle={`${r.biggestBlowout.winner.score.toFixed(1)} – ${r.biggestBlowout.loser.score.toFixed(1)}`}
            extra={`Margin: ${r.biggestBlowout.margin.toFixed(1)} pts`}
          />
        </div>
      </section>

      <p style={S.note}>Based on Week {r.week} final scores · Updated {data.updated}</p>
    </div>
  );
}

// ─── Constants & styles ────────────────────────────────────────────────────────

const POS_COLORS = {
  QB: '#e53935', RB: '#1976d2', WR: '#388e3c', TE: '#f57c00',
  K: '#7b1fa2', DEF: '#455a64', FLEX: '#0288d1',
};

const S = {
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' },
  weekLabel: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  reportTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' },
  medianPill: { fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 20, padding: '3px 10px', marginLeft: 'auto' },

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px', opacity: 0.6 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 },

  card: { background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '18px 16px', position: 'relative', overflow: 'hidden' },
  cardWide: { gridColumn: '1 / -1' },
  cardAccent: { borderColor: 'rgba(220,50,50,0.3)' },
  cardBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--red)' },

  awardIcon: { fontSize: 20, marginBottom: 10 },
  awardLabel: { fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', opacity: 0.5, marginBottom: 6 },
  awardTitle: { fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4, lineHeight: 1.25 },
  awardSub: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  awardExtra: { fontSize: 10, color: 'var(--red)', marginTop: 6, fontWeight: 600, letterSpacing: '0.04em' },

  playerRow: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 },
  playerInfo: { flex: 1, minWidth: 0 },
  playerMeta: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 },
  bigScore: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, lineHeight: 1 },

  posBadge: { fontSize: 9, fontWeight: 700, color: '#fff', borderRadius: 3, padding: '1px 5px', letterSpacing: '0.04em' },

  // MOTM grid
  motmGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 },
  motmCard: { background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '16px 14px', position: 'relative', overflow: 'hidden' },

  motmScores: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 },
  motmTeam: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
  motmScore: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, lineHeight: 1 },
  motmTeamName: { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.2 },
  motmVs: { fontSize: 9, color: 'var(--text-muted)', opacity: 0.4, padding: '0 4px' },

  motmDivider: { height: '0.5px', background: 'var(--border)', margin: '12px 0' },
  motmPlayer: {},
  motmBadge: { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--red)', fontWeight: 700, marginBottom: 8, opacity: 0.9 },
  motmPlayerRow: { display: 'flex', alignItems: 'center', gap: 8 },
  motmPlayerInfo: { flex: 1, minWidth: 0 },
  motmPlayerName: { fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  motmPlayerMeta: { display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 },
  motmPlayerTeam: { fontSize: 9, color: 'var(--text-muted)', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  motmPts: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, lineHeight: 1, color: 'var(--red)' },

  note: { fontSize: 11, color: 'var(--text-muted)', marginTop: 16, textAlign: 'right' },
};
