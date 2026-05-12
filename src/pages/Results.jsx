import useGameStore from '../store/gameStore';

export default function Results() {
  const { results, myClub, season } = useGameStore();
  const wins   = results.filter(r => r.myGoals > r.oppGoals).length;
  const draws  = results.filter(r => r.myGoals === r.oppGoals).length;
  const losses = results.filter(r => r.myGoals < r.oppGoals).length;
  const gf  = results.reduce((s, r) => s + r.myGoals, 0);
  const ga  = results.reduce((s, r) => s + r.oppGoals, 0);
  const pts = wins * 3 + draws;

  return (
    <>
      <style>{`
        .results-stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .results-stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .results-stats-grid > div:nth-child(4),
          .results-stats-grid > div:nth-child(5) {
            grid-column: span 1;
          }
        }
        .result-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
        }
        .result-row:last-child { border-bottom: none; }
        @media (max-width: 768px) {
          .result-formation { display: none; }
        }
      `}</style>

      <div className="page-header">
        <h2>RESULTS</h2>
        <p>{myClub?.name} · Season {season} · {results.length} played</p>
      </div>

      <div className="page-body">
        {/* Stats grid */}
        <div className="results-stats-grid">
          {[
            { label: 'Points', value: pts,   color: 'var(--green)' },
            { label: 'Won',    value: wins,   color: 'var(--green)' },
            { label: 'Drawn',  value: draws,  color: 'var(--yellow)' },
            { label: 'Lost',   value: losses, color: 'var(--red)' },
            { label: 'GD',     value: `${gf > ga ? '+' : ''}${gf - ga}`, color: gf >= ga ? 'var(--green)' : 'var(--red)' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
              <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Results list */}
        {results.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 2, marginBottom: 8 }}>NO MATCHES YET</div>
            <div style={{ fontSize: 13 }}>Head to the Match tab to play your first game.</div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {[...results].reverse().map((r, i) => {
              const outcome = r.myGoals > r.oppGoals ? 'W' : r.myGoals === r.oppGoals ? 'D' : 'L';
              const color   = outcome === 'W' ? 'var(--green)' : outcome === 'D' ? 'var(--yellow)' : 'var(--red)';
              const label   = outcome === 'W' ? 'WIN' : outcome === 'D' ? 'DRAW' : 'LOSS';
              return (
                <div key={i} className="result-row">
                  {/* Week */}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>
                    W{r.week}
                  </div>

                  {/* Outcome badge */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: `${color}18`, border: `1px solid ${color}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 10, color, fontWeight: 700, letterSpacing: 1,
                  }}>{outcome}</div>

                  {/* Opponent */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.opponent}</div>
                    <div className="result-formation" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{r.formation}</div>
                  </div>

                  {/* Score */}
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 2, color: 'var(--text)', flexShrink: 0 }}>
                    {r.myGoals}<span style={{ color: 'var(--text-muted)', margin: '0 4px', fontSize: 16 }}>–</span>{r.oppGoals}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}