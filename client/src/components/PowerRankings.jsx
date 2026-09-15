import { useEffect, useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';

function PowerBar({ score, isMobile }) {
  return (
    <div style={styles.barWrap}>
      <div style={{ ...styles.barFill, width: `${Math.max(4, score)}%` }} />
      <span style={styles.barLabel}>{score.toFixed(isMobile ? 0 : 1)}</span>
    </div>
  );
}

function normalize(value, min, max) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function computePowerScore(teams) {
  const pfValues = teams.map(t => t.pf);
  const paValues = teams.map(t => t.pa);
  const minPF = Math.min(...pfValues), maxPF = Math.max(...pfValues);
  const minPA = Math.min(...paValues), maxPA = Math.max(...paValues);

  return teams.map(team => {
    const totalGames = team.wins + team.losses + team.ties;
    const winPct = totalGames > 0 ? (team.wins + team.ties * 0.5) / totalGames : 0.5;
    const normPF = normalize(team.pf, minPF, maxPF);
    const normPA = normalize(team.pa, minPA, maxPA);
    // Win% 50%, PF 35%, PA 15% (inverted — lower PA is better)
    const score = winPct * 0.50 + normPF * 0.35 + (1 - normPA) * 0.15;
    return { ...team, powerScore: Math.round(score * 1000) / 10 };
  });
}

export default function PowerRankings({ leagueId }) {
  const [teams, setTeams] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setLoading(true);
    fetch(`/data/${leagueId}/standings.json`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(data => {
        const scored = computePowerScore(data.teams || []);
        scored.sort((a, b) => b.powerScore - a.powerScore);
        scored.forEach((t, i) => { t.rank = i + 1; });
        setTeams(scored);
        setMeta({ week: data.week, updated: data.updated });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [leagueId]);

  if (loading) return <div style={styles.empty}>Loading power rankings...</div>;
  if (error) return <div style={styles.empty}>Could not load rankings.</div>;

  const hasData = teams.some(t => t.pf > 0);

  if (!hasData) return (
    <div style={styles.empty}>
      No game data yet — power rankings will appear once Week 1 scores are finalized.
    </div>
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <div style={styles.metaLabel}>Power Rankings · Week {meta.week}</div>
        {!isMobile && (
          <div style={styles.legend}>
            <span style={styles.legendDot} />
            <span style={styles.legendText}>Win% 50% · Points For 35% · Points Against 15%</span>
          </div>
        )}
      </div>

      <div style={styles.table}>
        <div style={styles.theader}>
          <div style={{ ...styles.col, ...styles.colRank }}>#</div>
          <div style={{ ...styles.col, ...styles.colName }}>Team</div>
          <div style={{ ...styles.col, ...styles.colStat }}>Record</div>
          {!isMobile && <div style={{ ...styles.col, ...styles.colStat }}>PF</div>}
          {!isMobile && <div style={{ ...styles.col, ...styles.colStat }}>PA</div>}
          <div style={{ ...styles.col, ...(isMobile ? styles.colBarMobile : styles.colBar) }}>Score</div>
        </div>

        {teams.map((team, i) => (
          <div key={team.name} style={{ ...styles.row, ...(i % 2 === 0 ? styles.rowEven : {}) }}>
            <div style={{ ...styles.col, ...styles.colRank }}>
              <span style={styles.rankNum}>{team.rank}</span>
            </div>
            <div style={{ ...styles.col, ...styles.colName }}>
              <span style={styles.teamName}>{team.name}</span>
            </div>
            <div style={{ ...styles.col, ...styles.colStat }}>
              {team.wins}-{team.losses}{team.ties > 0 ? `-${team.ties}` : ''}
            </div>
            {!isMobile && (
              <div style={{ ...styles.col, ...styles.colStat }}>{team.pf.toFixed(1)}</div>
            )}
            {!isMobile && (
              <div style={{ ...styles.col, ...styles.colStat }}>{team.pa.toFixed(1)}</div>
            )}
            <div style={{ ...styles.col, ...(isMobile ? styles.colBarMobile : styles.colBar) }}>
              <PowerBar score={team.powerScore} isMobile={isMobile} />
            </div>
          </div>
        ))}
      </div>
      <p style={styles.note}>Updated {meta.updated}</p>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  empty: { color: 'var(--text-muted)', fontSize: 13, padding: '40px 0' },
  headerRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  metaLabel: { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 12 },
  legend: { display: 'flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 },
  legendText: { fontSize: 10, color: 'var(--text-muted)' },

  table: { display: 'flex', flexDirection: 'column', borderRadius: 6, overflow: 'hidden', border: '0.5px solid var(--border)' },
  theader: { display: 'flex', alignItems: 'center', padding: '8px 10px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' },
  row: { display: 'flex', alignItems: 'center', padding: '10px 10px', borderBottom: '0.5px solid var(--border)' },
  rowEven: { background: 'rgba(255,255,255,0.015)' },

  col: { fontSize: 12, color: 'var(--text-muted)' },
  colRank: { width: 24, flexShrink: 0 },
  colName: { flex: 1, minWidth: 0 },
  colStat: { width: 68, textAlign: 'center', flexShrink: 0 },
  colBar: { width: 140, flexShrink: 0 },
  colBarMobile: { width: 80, flexShrink: 0 },

  rankNum: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  teamName: { fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },

  barWrap: { display: 'flex', alignItems: 'center', gap: 6 },
  barFill: { height: 6, borderRadius: 3, background: 'var(--red)', transition: 'width 0.3s ease', flexShrink: 0 },
  barLabel: { fontSize: 11, color: 'var(--text-muted)', minWidth: 24 },

  note: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' },
};
