import { useState, useEffect } from 'react';

function RecordBadge({ record }) {
  const [w, l] = record.split('-').map(Number);
  const isHot = w > l;
  const isCold = l > w;
  return (
    <span style={{
      ...rStyles.badge,
      color: isHot ? 'var(--red)' : isCold ? 'var(--text-muted)' : 'var(--text)',
      opacity: isCold ? 0.6 : 1,
    }}>
      {record}
    </span>
  );
}

function H2HBar({ aWins, bWins, ties, ownerA, ownerB, pending }) {
  const total = aWins + bWins + ties;

  if (pending || total === 0) {
    return (
      <div style={h2hStyles.wrap}>
        <div style={h2hStyles.label}>All-Time H2H</div>
        <div style={h2hStyles.noData}>
          {pending ? 'Coming soon' : 'First meeting'}
        </div>
      </div>
    );
  }

  const aW = total > 0 ? (aWins / total) * 100 : 50;
  const bW = total > 0 ? (bWins / total) * 100 : 50;
  const tW = total > 0 ? (ties / total) * 100 : 0;

  return (
    <div style={h2hStyles.wrap}>
      <div style={h2hStyles.label}>All-Time H2H</div>
      <div style={h2hStyles.counts}>
        <span style={{ ...h2hStyles.count, color: aWins > bWins ? 'var(--red)' : 'var(--text-muted)' }}>{aWins}-{bWins}{ties > 0 ? `-${ties}` : ''}</span>
        <span style={h2hStyles.total}>{total} game{total !== 1 ? 's' : ''}</span>
      </div>
      <div style={h2hStyles.barWrap}>
        {aWins > 0 && <div style={{ ...h2hStyles.barA, width: `${aW}%` }} />}
        {ties > 0 && <div style={{ ...h2hStyles.barT, width: `${tW}%` }} />}
        {bWins > 0 && <div style={{ ...h2hStyles.barB, width: `${bW}%` }} />}
      </div>
      <div style={h2hStyles.names}>
        <span style={h2hStyles.nameA}>{ownerA}</span>
        <span style={h2hStyles.nameB}>{ownerB}</span>
      </div>
    </div>
  );
}

function MatchupCard({ matchup }) {
  const { teamA, teamB, h2h } = matchup;
  const projDiff = Math.abs(teamA.projected - teamB.projected);
  const aFavored = teamA.projected > teamB.projected;
  const bFavored = teamB.projected > teamA.projected;
  const isPending = h2h?.note === 'historical pending';

  return (
    <div style={styles.card}>
      <div style={styles.cardBar} />

      <div style={styles.teams}>
        {/* Team A */}
        <div style={styles.team}>
          <div style={{ ...styles.teamName, color: aFavored ? 'var(--text)' : 'var(--text-muted)' }}>
            {teamA.name}
          </div>
          <div style={styles.ownerRow}>
            <span style={styles.ownerName}>{teamA.owner}</span>
            <RecordBadge record={teamA.record} />
          </div>
          {teamA.projected > 0 && (
            <div style={{ ...styles.proj, color: aFavored ? 'var(--red)' : 'var(--text-muted)' }}>
              proj {teamA.projected.toFixed(1)}
              {aFavored && projDiff > 5 && <span style={styles.favTag}> ▲</span>}
            </div>
          )}
        </div>

        <div style={styles.vs}>vs</div>

        {/* Team B */}
        <div style={{ ...styles.team, alignItems: 'flex-end' }}>
          <div style={{ ...styles.teamName, color: bFavored ? 'var(--text)' : 'var(--text-muted)', textAlign: 'right' }}>
            {teamB.name}
          </div>
          <div style={{ ...styles.ownerRow, flexDirection: 'row-reverse' }}>
            <span style={styles.ownerName}>{teamB.owner}</span>
            <RecordBadge record={teamB.record} />
          </div>
          {teamB.projected > 0 && (
            <div style={{ ...styles.proj, color: bFavored ? 'var(--red)' : 'var(--text-muted)', textAlign: 'right' }}>
              {bFavored && projDiff > 5 && <span style={styles.favTag}>▲ </span>}
              proj {teamB.projected.toFixed(1)}
            </div>
          )}
        </div>
      </div>

      <H2HBar
        aWins={h2h?.aWins ?? 0}
        bWins={h2h?.bWins ?? 0}
        ties={h2h?.ties ?? 0}
        ownerA={teamA.owner}
        ownerB={teamB.owner}
        pending={isPending}
      />
    </div>
  );
}

export default function WeeklyPreview({ leagueId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/data/${leagueId}/weekly-preview.json`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [leagueId]);

  if (loading) return <div style={styles.note}>Loading preview...</div>;
  if (!data) return <div style={styles.note}>No preview available yet.</div>;

  const { week, matchups, updated } = data;

  return (
    <div>
      <div style={styles.header}>
        <span style={styles.weekLabel}>Week {week} Preview</span>
        <span style={styles.upcomingBadge}>Upcoming</span>
      </div>

      <div style={styles.grid}>
        {matchups.map((m, i) => (
          <MatchupCard key={i} matchup={m} />
        ))}
      </div>

      <p style={styles.note}>Updated {updated}</p>
    </div>
  );
}

const styles = {
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  weekLabel: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  upcomingBadge: { fontSize: 10, color: '#888', border: '0.5px solid var(--border)', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.05em' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 },
  card: { background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '18px 16px', position: 'relative', overflow: 'hidden' },
  cardBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--red)' },
  teams: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  team: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  teamName: { fontSize: 11, letterSpacing: '0.04em', fontWeight: 600, lineHeight: 1.3 },
  ownerRow: { display: 'flex', alignItems: 'center', gap: 6 },
  ownerName: { fontSize: 10, color: 'var(--text-muted)' },
  proj: { fontSize: 10, fontWeight: 600 },
  favTag: { fontSize: 9, opacity: 0.8 },
  vs: { fontSize: 10, color: 'var(--text-muted)', opacity: 0.4, paddingTop: 2, flexShrink: 0 },
  note: { fontSize: 11, color: 'var(--text-muted)', marginTop: 16, textAlign: 'right' },
};

const rStyles = {
  badge: { fontSize: 9, fontWeight: 700, letterSpacing: '0.04em' },
};

const h2hStyles = {
  wrap: { marginTop: 14, borderTop: '0.5px solid var(--border)', paddingTop: 12 },
  label: { fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', opacity: 0.5, marginBottom: 6 },
  noData: { fontSize: 10, color: 'var(--text-muted)', opacity: 0.5, fontStyle: 'italic' },
  counts: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  count: { fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' },
  total: { fontSize: 9, color: 'var(--text-muted)', opacity: 0.5 },
  barWrap: { display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden', background: 'var(--border)', marginBottom: 4 },
  barA: { background: 'var(--red)', height: '100%' },
  barB: { background: 'var(--text-muted)', opacity: 0.4, height: '100%' },
  barT: { background: 'var(--border)', height: '100%' },
  names: { display: 'flex', justifyContent: 'space-between' },
  nameA: { fontSize: 9, color: 'var(--red)', opacity: 0.8 },
  nameB: { fontSize: 9, color: 'var(--text-muted)', opacity: 0.6 },
};
