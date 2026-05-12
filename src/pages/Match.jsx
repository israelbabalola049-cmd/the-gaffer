import { useState } from 'react';
import useGameStore from '../store/gameStore';

function teamStrength(players) {
  if (!players.length) return 60;
  return players.reduce((s, p) => s + p.overall, 0) / players.length;
}

function simulateMatch(myStr, oppStr) {
  const myProb = myStr / (myStr + oppStr);
  const myGoals  = Math.random() < myProb + 0.05 ? Math.floor(Math.random() * (myProb > 0.55 ? 5 : 4)) : Math.floor(Math.random() * 3);
  const oppGoals = Math.random() < (1 - myProb) + 0.05 ? Math.floor(Math.random() * (myProb < 0.45 ? 5 : 4)) : Math.floor(Math.random() * 3);
  return { myGoals, oppGoals };
}

function generateEvents(myPlayers, oppPlayers, myGoals, oppGoals) {
  const events = [];
  const minutes = new Set();
  const rand = () => { let m; do { m = Math.floor(Math.random() * 90) + 1; } while (minutes.has(m)); minutes.add(m); return m; };
  const myScorers  = myPlayers.filter(p => ['ST','LW','RW','CAM','CM'].includes(p.position));
  const oppScorers = oppPlayers.filter(p => ['ST','LW','RW','CAM'].includes(p.position));
  for (let i = 0; i < myGoals; i++) {
    const s = myScorers[Math.floor(Math.random() * myScorers.length)] || myPlayers[0];
    events.push({ min: rand(), type: 'goal', team: 'my', player: s?.name || '?' });
  }
  for (let i = 0; i < oppGoals; i++) {
    const s = oppScorers[Math.floor(Math.random() * oppScorers.length)] || oppPlayers[0];
    events.push({ min: rand(), type: 'goal', team: 'opp', player: s?.name || '?' });
  }
  for (let i = 0; i < Math.floor(Math.random() * 4); i++) {
    const pool = Math.random() < 0.5 ? myPlayers : oppPlayers;
    const p = pool[Math.floor(Math.random() * pool.length)];
    events.push({ min: rand(), type: 'yellow', team: Math.random() < 0.5 ? 'my' : 'opp', player: p?.name || '?' });
  }
  return events.sort((a, b) => a.min - b.min);
}

function generateRatings(players, myGoals, oppGoals) {
  const win  = myGoals > oppGoals;
  const draw = myGoals === oppGoals;
  return players.map(p => {
    let base = 6.0 + (p.overall - 75) * 0.03;
    if (win)       base += Math.random() * 1.2;
    else if (draw) base += Math.random() * 0.6;
    else           base -= Math.random() * 0.8;
    if (win && ['ST','LW','RW','CAM'].includes(p.position)) base += Math.random() * 0.5;
    return { ...p, matchRating: Math.min(10, Math.max(4, parseFloat(base.toFixed(1)))) };
  });
}

export default function Match() {
  const { myClub, starting11, squad, allPlayers, allClubs, formation, addResult, week, advanceWeek } = useGameStore();
  const [phase, setPhase]       = useState('idle');
  const [opponent, setOpponent] = useState(null);
  const [result, setResult]     = useState(null);
  const [events, setEvents]     = useState([]);
  const [ratings, setRatings]   = useState([]);

  const myPlayers = starting11.length >= 11 ? starting11 : squad.slice(0, 11);

  const findOpponent = () => {
    const others = allClubs.filter(c => c.name !== myClub.name);
    const opp = others[Math.floor(Math.random() * others.length)];
    setOpponent({ club: opp, players: allPlayers.filter(p => p.club === opp.name) });
    setPhase('ready'); setResult(null); setEvents([]); setRatings([]);
  };

  const playMatch = () => {
    setPhase('simulating');
    const { myGoals, oppGoals } = simulateMatch(teamStrength(myPlayers), teamStrength(opponent.players));
    setTimeout(() => {
      setResult({ myGoals, oppGoals });
      setEvents(generateEvents(myPlayers, opponent.players, myGoals, oppGoals));
      setRatings(generateRatings(myPlayers, myGoals, oppGoals));
      addResult({ week, opponent: opponent.club.name, myGoals, oppGoals, formation });
      advanceWeek();
      setPhase('done');
    }, 1800);
  };

  const outcome      = result ? result.myGoals > result.oppGoals ? 'W' : result.myGoals === result.oppGoals ? 'D' : 'L' : null;
  const outcomeColor = outcome === 'W' ? 'var(--green)' : outcome === 'D' ? 'var(--yellow)' : 'var(--red)';
  const outcomeLabel = outcome === 'W' ? 'VICTORY' : outcome === 'D' ? 'DRAW' : 'DEFEAT';

  return (
    <>
      <style>{`
        .match-post-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 768px) {
          .match-post-grid { grid-template-columns: 1fr; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .match-pulsing { animation: pulse 1.4s ease infinite; }
        .match-event-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
        }
        .match-event-row:last-child { border-bottom: none; }
        .rating-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 0;
          border-bottom: 1px solid var(--border);
        }
        .rating-row:last-child { border-bottom: none; }
      `}</style>

      <div className="page-header">
        <h2>MATCH</h2>
        <p>Week {week} · {myClub?.name} · {formation}</p>
      </div>

      <div className="page-body">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <div className="card" style={{ textAlign: 'center', padding: 'clamp(40px,8vw,80px) 24px' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🏟</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 2, marginBottom: 8 }}>READY TO PLAY?</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14, lineHeight: 1.6 }}>
              {myPlayers.length < 11
                ? `⚠ Only ${myPlayers.length} players — go to Tactics first.`
                : `${myClub?.name} is set in ${formation}.`}
            </div>
            <button className="btn btn-primary" style={{ fontSize: 15, padding: '13px 32px', margin: '0 auto' }} onClick={findOpponent}>
              Find Next Opponent
            </button>
          </div>
        )}

        {/* ── READY ── */}
        {phase === 'ready' && opponent && (
          <div>
            <div className="card" style={{ marginBottom: 16, padding: 'clamp(20px,5vw,28px) clamp(16px,5vw,32px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,4vw,26px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{myClub?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{formation}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-muted)', flexShrink: 0 }}>VS</div>
                <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,4vw,26px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opponent.club.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{opponent.club.league}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '13px 0', fontSize: 14 }} onClick={playMatch}>▶ Kick Off</button>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '13px 0', fontSize: 14 }} onClick={findOpponent}>Different Opponent</button>
            </div>
          </div>
        )}

        {/* ── SIMULATING ── */}
        {phase === 'simulating' && (
          <div className="card" style={{ textAlign: 'center', padding: 'clamp(60px,12vw,100px) 24px' }}>
            <div className="match-pulsing" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,5vw,34px)', letterSpacing: 3, color: 'var(--green)' }}>
              MATCH IN PROGRESS...
            </div>
            <div style={{ marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2 }}>
              90 MINUTES
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === 'done' && result && (
          <div>
            {/* Score card */}
            <div className="card" style={{ marginBottom: 16, padding: 'clamp(20px,5vw,28px) clamp(16px,5vw,32px)', border: `1px solid ${outcomeColor}44` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,3.5vw,22px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{myClub?.name}</div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,10vw,56px)', letterSpacing: 4, lineHeight: 1, color: 'var(--text)' }}>
                    {result.myGoals}<span style={{ color: 'var(--text-muted)', margin: '0 6px', fontSize: '0.6em' }}>–</span>{result.oppGoals}
                  </div>
                  <div style={{
                    display: 'inline-block', marginTop: 8,
                    padding: '3px 14px', borderRadius: 4,
                    background: `${outcomeColor}18`, border: `1px solid ${outcomeColor}`,
                    fontFamily: 'var(--font-mono)', fontSize: 11, color: outcomeColor,
                    fontWeight: 700, letterSpacing: 2,
                  }}>{outcomeLabel}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,3.5vw,22px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opponent?.club.name}</div>
                </div>
              </div>
            </div>

            {/* Events + Ratings */}
            <div className="match-post-grid">
              {/* Events */}
              <div className="card">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Match Events</div>
                {events.length === 0
                  ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No notable events.</div>
                  : events.map((e, i) => (
                    <div key={i} className="match-event-row" style={{ justifyContent: e.team === 'my' ? 'flex-start' : 'flex-end' }}>
                      {e.team === 'my' && (
                        <>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', width: 24, flexShrink: 0 }}>{e.min}'</span>
                          <span>{e.type === 'goal' ? '⚽' : '🟨'}</span>
                          <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.player}</span>
                        </>
                      )}
                      {e.team === 'opp' && (
                        <>
                          <span style={{ fontSize: 12, flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.player}</span>
                          <span>{e.type === 'goal' ? '⚽' : '🟨'}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', width: 24, textAlign: 'right', flexShrink: 0 }}>{e.min}'</span>
                        </>
                      )}
                    </div>
                  ))}
              </div>

              {/* Ratings */}
              <div className="card">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Player Ratings</div>
                {[...ratings].sort((a, b) => b.matchRating - a.matchRating).map(p => (
                  <div key={p.id} className="rating-row">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontFamily: 'var(--font-cond)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.position}</div>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-cond)', fontSize: 18, fontWeight: 800, flexShrink: 0, marginLeft: 8,
                      color: p.matchRating >= 8 ? 'var(--green)' : p.matchRating >= 6.5 ? 'var(--yellow)' : 'var(--red)',
                    }}>{p.matchRating.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '13px 0' }} onClick={findOpponent}>Next Match</button>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '13px 0' }} onClick={() => setPhase('idle')}>Back</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}