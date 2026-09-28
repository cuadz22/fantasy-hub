import { useState, useEffect } from 'react';
import PlayerAvatar from './PlayerAvatar';

function PlayerScorers({ players }) {
  if (!players || players.length === 0) return null;
  const sorted = [...players].sort((a, b) => b.points - a.points);
  const top3 = sorted.slice(0, 3);
  const hasFullRoster = players.length >= 8;
  const bot3 = hasFullRoster ? sorted.slice(-3).reverse() : [];

  return (
    <div style={pStyles.wrap}>
      <div style={pStyles.section}>
        <div style={pStyles.label}>Top</div>
        {top3.map((p, i) => (
          <div key={i} style={pStyles.row}>
            <PlayerAvatar name={p.name} position={p.position} size={22} />
            <span style={pStyles.pos}>{p.position}</span>
            <span style={pStyles.name}>{p.name}</span>
            <span style={{ ...pStyles.pts, color: 'var(--red)' }}>{p.points.toFixed(1)}</span>
          </div>
        ))}
      </div>
      {hasFullRoster && <div style={pStyles.divider} />}
      {hasFullRoster && (
        <div style={pStyles.section}>
          <div style={pStyles.label}>Duds</div>
          {bot3.map((p, i) => (
            <div key={i} style={pStyles.row}>
              <PlayerAvatar name={p.name} position={p.position} size={22} />
              <span style={pStyles.pos}>{p.position}</span>
              <span style={pStyles.name}>{p.name}</span>
              <span style={{ ...pStyles.pts, color: p.points <= 0 ? '#e57373' : 'var(--text-muted)' }}>{p.points.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pStyles = {
  wrap: { marginTop: 14, borderTop: '0.5px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 0 },
  section: { display: 'flex', flexDirection: 'column', gap: 4 },
  divider: { height: 8 },
  label: { fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', opacity: 0.5, marginBottom: 2 },
  row: { display: 'flex', alignItems: 'center', gap: 5 },
  pos: { fontSize: 9, color: 'var(--text-muted)', opacity: 0.6, width: 22, flexShrink: 0, fontWeight: 600 },
  name: { fontSize: 10, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  pts: { fontSize: 10, fontWeight: 600, flexShrink: 0, minWidth: 28, textAlign: 'right' },
};

// ── Week Tabs ──────────────────────────────────────────────────────────────────
function WeekTabs({ weeks, selectedWeek, onSelect, currentWeek }) {
  const tabRef = useState(null)[0];

  return (
    <div style={tabStyles.scroll}>
      <div style={tabStyles.row}>
        {weeks.map(w => {
          const active = w.week === selectedWeek;
          const isCurrent = w.week === currentWeek;
          return (
            <button
              key={w.week}
              onClick={() => onSelect(w.week)}
              style={{
                ...tabStyles.tab,
                ...(active ? tabStyles.tabActive : {}),
                ...(isCurrent && !active ? tabStyles.tabCurrent : {}),
              }}
            >
              {w.week}
              {w.status === 'upcoming' && <span style={tabStyles.dot} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const tabStyles = {
  scroll: { overflowX: 'auto', marginBottom: 20, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' },
  row: { display: 'flex', gap: 4, minWidth: 'max-content', paddingBottom: 2 },
  tab: {
    background: 'transparent',
    border: '0.5px solid var(--border)',
    borderRadius: 4,
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'inherit',
    fontWeight: 500,
    minWidth: 32,
    padding: '4px 8px',
    position: 'relative',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--red)',
    border: '0.5px solid var(--red)',
    color: '#fff',
    fontWeight: 700,
  },
  tabCurrent: {
    border: '0.5px solid var(--red)',
    color: 'var(--text)',
  },
  dot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'var(--red)',
  },
};

// ── Matchup Card ───────────────────────────────────────────────────────────────
function MatchupCard({ m, status, richMatchup }) {
  const isFinal = status === 'final';
  const isUpcoming = status === 'upcoming';
  const isFuture = status === 'future';

  // For final weeks, use schedule scores
  const aScore = m.teamA.score;
  const bScore = m.teamB.score;
  const aWins = isFinal && aScore > bScore;
  const bWins = isFinal && bScore > aScore;

  // For upcoming, use projected from schedule (or rich matchup data)
  const aProj = m.teamA.projected ?? richMatchup?.teamA?.projected;
  const bProj = m.teamB.projected ?? richMatchup?.teamB?.projected;

  // Rich player data only for current week
  const aPlayers = richMatchup?.teamA?.players;
  const bPlayers = richMatchup?.teamB?.players;
  const hasPlayers = (aPlayers?.length > 0 || bPlayers?.length > 0);

  return (
    <div style={styles.card}>
      <div style={styles.cardBar} />
      <div style={styles.matchup}>
        {/* Team A */}
        <div style={styles.team}>
          {isFinal && (
            <div style={{ ...styles.score, color: aWins ? 'var(--red)' : 'var(--text-muted)' }}>
              {aScore.toFixed(1)}
            </div>
          )}
          {isUpcoming && aProj > 0 && (
            <div style={styles.projScore}>{aProj.toFixed(1)}</div>
          )}
          {isFuture && (
            <div style={styles.futureScore}>—</div>
          )}
          <div style={{
            ...styles.teamName,
            color: isFinal ? (aWins ? 'var(--text)' : 'var(--text-muted)') : 'var(--text)',
          }}>
            {m.teamA.name}
          </div>
          {isUpcoming && aProj > 0 && (
            <div style={styles.proj}>proj</div>
          )}
        </div>

        <div style={styles.sep} />

        {/* Team B */}
        <div style={styles.team}>
          {isFinal && (
            <div style={{ ...styles.score, color: bWins ? 'var(--red)' : 'var(--text-muted)' }}>
              {bScore.toFixed(1)}
            </div>
          )}
          {isUpcoming && bProj > 0 && (
            <div style={styles.projScore}>{bProj.toFixed(1)}</div>
          )}
          {isFuture && (
            <div style={styles.futureScore}>—</div>
          )}
          <div style={{
            ...styles.teamName,
            color: isFinal ? (bWins ? 'var(--text)' : 'var(--text-muted)') : 'var(--text)',
          }}>
            {m.teamB.name}
          </div>
          {isUpcoming && bProj > 0 && (
            <div style={styles.proj}>proj</div>
          )}
        </div>
      </div>

      {hasPlayers && (
        <div style={styles.scorersRow}>
          <div style={styles.scorerCol}>
            <PlayerScorers players={aPlayers} />
          </div>
          <div style={styles.scorerDivider} />
          <div style={styles.scorerCol}>
            <PlayerScorers players={bPlayers} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Matchups({ leagueId }) {
  const [schedule, setSchedule] = useState(null);
  const [richData, setRichData] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setSchedule(null);
    setRichData(null);
    setSelectedWeek(null);

    Promise.all([
      fetch(`/data/${leagueId}/schedule.json`)
        .then(r => { if (!r.ok) throw new Error('No schedule'); return r.json(); })
        .catch(() => null),
      fetch(`/data/${leagueId}/matchups.json`)
        .then(r => { if (!r.ok) throw new Error('No matchups'); return r.json(); })
        .catch(() => null),
    ]).then(([sched, rich]) => {
      setSchedule(sched);
      setRichData(rich);
      setSelectedWeek(sched?.currentWeek ?? rich?.week ?? 1);
      setLoading(false);
    });
  }, [leagueId]);

  if (loading) return <div style={styles.note}>Loading matchups...</div>;

  // Fallback: no schedule.json, use old matchups.json only
  if (!schedule && richData) {
    const { week, matchups, status, rivalryWeek, updated } = richData;
    const isLive = status === 'in_progress';
    const hasPlayers = matchups.some(m => m.teamA.players?.length > 0 || m.teamB.players?.length > 0);
    return (
      <div>
        <div style={styles.header}>
          <span style={styles.weekLabel}>Week {week}</span>
          {isLive && <span style={styles.liveBadge}>● Live</span>}
          {rivalryWeek && <span style={styles.rivalryBadge}>Rivalry Week</span>}
        </div>
        <div style={styles.grid}>
          {matchups.map((m, i) => {
            const aWins = m.teamA.score > m.teamB.score;
            const bWins = m.teamB.score > m.teamA.score;
            return (
              <div key={i} style={styles.card}>
                <div style={styles.cardBar} />
                <div style={styles.matchup}>
                  <div style={styles.team}>
                    <div style={{ ...styles.score, color: aWins ? 'var(--red)' : 'var(--text-muted)' }}>
                      {m.teamA.score.toFixed(1)}
                    </div>
                    <div style={{ ...styles.teamName, color: aWins ? 'var(--text)' : 'var(--text-muted)' }}>
                      {m.teamA.name}
                    </div>
                    {m.teamA.projected > 0 && <div style={styles.proj}>proj {m.teamA.projected.toFixed(1)}</div>}
                  </div>
                  <div style={styles.sep} />
                  <div style={styles.team}>
                    <div style={{ ...styles.score, color: bWins ? 'var(--red)' : 'var(--text-muted)' }}>
                      {m.teamB.score.toFixed(1)}
                    </div>
                    <div style={{ ...styles.teamName, color: bWins ? 'var(--text)' : 'var(--text-muted)' }}>
                      {m.teamB.name}
                    </div>
                    {m.teamB.projected > 0 && <div style={styles.proj}>proj {m.teamB.projected.toFixed(1)}</div>}
                  </div>
                </div>
                {hasPlayers && (
                  <div style={styles.scorersRow}>
                    <div style={styles.scorerCol}><PlayerScorers players={m.teamA.players} /></div>
                    <div style={styles.scorerDivider} />
                    <div style={styles.scorerCol}><PlayerScorers players={m.teamB.players} /></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p style={styles.note}>Updated {updated}</p>
      </div>
    );
  }

  if (!schedule) return <div style={styles.note}>Could not load schedule.</div>;

  const currentWeek = schedule.currentWeek;
  const weekData = schedule.weeks.find(w => w.week === selectedWeek);
  if (!weekData) return <div style={styles.note}>Week not found.</div>;

  const { status, matchups } = weekData;
  const isCurrentWeek = selectedWeek === currentWeek;

  // Build a lookup of rich matchup data (by team name) for the current week
  const richLookup = {};
  if (isCurrentWeek && richData?.matchups) {
    richData.matchups.forEach(rm => {
      richLookup[rm.teamA.name] = rm;
      richLookup[rm.teamB.name] = rm;
    });
  }

  return (
    <div>
      <div style={styles.header}>
        <span style={styles.weekLabel}>
          {status === 'final' ? `Week ${selectedWeek} · Final` :
           status === 'upcoming' ? `Week ${selectedWeek} · Current` :
           `Week ${selectedWeek} · Upcoming`}
        </span>
        {isCurrentWeek && richData?.status === 'in_progress' && (
          <span style={styles.liveBadge}>● Live</span>
        )}
        {isCurrentWeek && richData?.rivalryWeek && (
          <span style={styles.rivalryBadge}>Rivalry Week</span>
        )}
      </div>

      <WeekTabs
        weeks={schedule.weeks}
        selectedWeek={selectedWeek}
        onSelect={setSelectedWeek}
        currentWeek={currentWeek}
      />

      <div style={styles.grid}>
        {matchups.map((m, i) => {
          const richMatchup = richLookup[m.teamA.name] || richLookup[m.teamB.name] || null;
          return (
            <MatchupCard
              key={i}
              m={m}
              status={status}
              richMatchup={isCurrentWeek ? richMatchup : null}
            />
          );
        })}
      </div>

      <p style={styles.note}>Updated {schedule.updated}</p>
    </div>
  );
}

const styles = {
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  weekLabel: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  liveBadge: { fontSize: 10, color: '#4caf50', fontWeight: 600, letterSpacing: '0.05em' },
  rivalryBadge: { fontSize: 10, color: 'var(--red)', border: '0.5px solid var(--red)', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.05em' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 },
  card: { background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '20px 16px', position: 'relative', overflow: 'hidden' },
  cardBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--red)' },
  matchup: { display: 'flex', alignItems: 'center', gap: 12 },
  team: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 },
  score: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, lineHeight: 1 },
  projScore: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, lineHeight: 1, color: 'var(--text-muted)', opacity: 0.8 },
  futureScore: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, lineHeight: 1, color: 'var(--border)' },
  teamName: { fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' },
  proj: { fontSize: 9, color: 'var(--text-muted)', opacity: 0.6 },
  sep: { width: 1, height: 48, background: 'var(--border)' },
  scorersRow: { display: 'flex', gap: 0, marginTop: 14, borderTop: '0.5px solid var(--border)', paddingTop: 12 },
  scorerCol: { flex: 1, minWidth: 0 },
  scorerDivider: { width: 1, background: 'var(--border)', margin: '0 10px', flexShrink: 0 },
  note: { fontSize: 11, color: 'var(--text-muted)', marginTop: 16, textAlign: 'right' },
};
