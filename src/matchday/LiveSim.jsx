/* ═══════════════════════════════════════════════════════
   THE GAFFER — LiveSim.jsx
   Live match simulation screen.

   Props:
     fixture       – { id, home, away, isHome, competition }
     myClubName    – string
     events        – array of event objects (grows over time)
     minute        – current minute (0–90)
     isFinished    – bool
     squad         – full squad array
     lineup        – starting 11 array
     speed         – 1 | 2 | 5
     onSpeedChange – fn(speed)
     onFinish      – fn() — called when "View Match Report" is tapped
     onSub         – fn(outPlayer, inPlayer)
═══════════════════════════════════════════════════════ */

import { useState, useEffect, useRef } from 'react';

/* ─── Competition config ─── */
const COMP = {
  'Premier League':   { color: '#3d0064', accent: '#a855f7' },
  'La Liga':          { color: '#c2410c', accent: '#f97316' },
  'Bundesliga':       { color: '#d20515', accent: '#ef4444' },
  'Serie A':          { color: '#1a1a6b', accent: '#6366f1' },
  'Ligue 1':          { color: '#001f5f', accent: '#3b82f6' },
  'Champions League': { color: '#1a3a6b', accent: '#fbbf24' },
  'Europa League':    { color: '#c05000', accent: '#fb923c' },
  'Conference League':{ color: '#0a5c36', accent: '#34d399' },
  'FA Cup':           { color: '#003087', accent: '#60a5fa' },
  'Carabao Cup':      { color: '#003087', accent: '#4ade80' },
  'Cup':              { color: '#c9a227', accent: '#fbbf24' },
};
const getComp = n => COMP[n] || { color: '#1a1a1a', accent: '#555' };

/* ─── Club colours ─── */
const CLUB_COLOR = {
  'Real Madrid':'#FEBE10','Barcelona':'#A50044','Manchester City':'#6CABDD',
  'Liverpool':'#C8102E','Arsenal':'#EF0107','Chelsea':'#034694',
  'Manchester United':'#DA291C','Tottenham':'#132257','Bayern Munich':'#DC052D',
  'PSG':'#003370','AC Milan':'#FB090B','Inter Milan':'#0068A8',
  'Atletico Madrid':'#CB3524','Bayer Leverkusen':'#E32221',
  'Brighton':'#0057B8','Aston Villa':'#670E36',
  'Borussia Dortmund':'#FDE100','Juventus':'#555',
};

const CLUB_BADGE = {
  'Manchester City':   'https://resources.premierleague.com/premierleague/badges/50/t43.png',
  'Liverpool':         'https://resources.premierleague.com/premierleague/badges/50/t14.png',
  'Arsenal':           'https://resources.premierleague.com/premierleague/badges/50/t3.png',
  'Chelsea':           'https://resources.premierleague.com/premierleague/badges/50/t8.png',
  'Manchester United': 'https://resources.premierleague.com/premierleague/badges/50/t1.png',
  'Tottenham':         'https://resources.premierleague.com/premierleague/badges/50/t6.png',
  'Aston Villa':       'https://resources.premierleague.com/premierleague/badges/50/t7.png',
  'Brighton':          'https://resources.premierleague.com/premierleague/badges/50/t36.png',
};

function ClubBadge({ name, size = 32 }) {
  const [failed, setFailed] = useState(false);
  const url = CLUB_BADGE[name];
  const color = CLUB_COLOR[name] || '#555';
  const abbr = (name || '?').slice(0, 3).toUpperCase();
  if (url && !failed) {
    return (
      <img src={url} alt={name} onError={() => setFailed(true)}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 6, flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.28,
      color, letterSpacing: 0.5, fontWeight: 700,
    }}>{abbr}</div>
  );
}

/* ─── SVG event icons (no emojis) ─── */
function EventIcon({ type }) {
  const s = { width: 13, height: 13, flexShrink: 0 };

  if (type === 'goal') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#00e87a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4l2.5 2.5"/>
    </svg>
  );
  if (type === 'goalOpp') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#ff3b5c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4l2.5 2.5"/>
    </svg>
  );
  if (type === 'yellowCard') return (
    <div style={{ width: 9, height: 12, background: '#f5c518', borderRadius: 2, flexShrink: 0 }} />
  );
  if (type === 'yellowOpp') return (
    <div style={{ width: 9, height: 12, background: '#f5c518', borderRadius: 2, flexShrink: 0, opacity: 0.7 }} />
  );
  if (type === 'redCard' || type === 'redCardOpp') return (
    <div style={{ width: 9, height: 12, background: '#ff3b5c', borderRadius: 2, flexShrink: 0 }} />
  );
  if (type === 'injury') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v10M12 16v6M4.93 4.93l7.07 7.07M16 16l4 4M2 12h10M16 12h6"/>
    </svg>
  );
  if (type === 'wonderSave') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
  if (type === 'var') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  );
  if (type === 'penalty') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3" fill="#a855f7" fillOpacity="0.3"/>
    </svg>
  );
  if (type === 'miss' || type === 'missOpp') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
  return null;
}

/* ─── Sub panel (bottom sheet) ─── */
function SubPanel({ squad, lineup, subsUsed, onConfirm, onClose }) {
  const [outPlayer, setOutPlayer] = useState(null);
  const [inPlayer, setInPlayer] = useState(null);
  const bench = squad.filter(p => !lineup.find(l => l.id === p.id));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.75)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-2)', borderRadius: '16px 16px 0 0',
        border: '1px solid var(--border)', borderBottom: 'none',
        maxHeight: '80vh', overflowY: 'auto',
        padding: '0 0 32px',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        <div style={{ padding: '8px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: 0.5 }}>Make Substitution</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{3 - subsUsed} remaining</span>
        </div>

        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8 }}>Player Off</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {lineup.map((p, i) => (
              <button key={p.id || i} onClick={() => setOutPlayer(p)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                background: outPlayer?.id === p.id ? 'rgba(255,59,92,0.10)' : 'var(--bg-3)',
                border: `1px solid ${outPlayer?.id === p.id ? 'rgba(255,59,92,0.4)' : 'var(--border)'}`,
                cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', width: 28, letterSpacing: 1 }}>{p.position}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', flex: 1 }}>{p.name}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{p.overall}</span>
              </button>
            ))}
          </div>
        </div>

        {outPlayer && (
          <div style={{ padding: '14px 20px 0' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8 }}>Player On</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {bench.map((p, i) => (
                <button key={p.id || i} onClick={() => setInPlayer(p)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                  background: inPlayer?.id === p.id ? 'rgba(0,232,122,0.08)' : 'var(--bg-3)',
                  border: `1px solid ${inPlayer?.id === p.id ? 'rgba(0,232,122,0.4)' : 'var(--border)'}`,
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', width: 28, letterSpacing: 1 }}>{p.position}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', flex: 1 }}>{p.name}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{p.overall}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {outPlayer && inPlayer && (
          <div style={{ padding: '14px 20px 0' }}>
            <button onClick={() => onConfirm(outPlayer, inPlayer)} style={{
              width: '100%', padding: 13, borderRadius: 8, border: 'none',
              background: 'var(--green)', color: '#000',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, letterSpacing: 2,
              cursor: 'pointer',
            }}>CONFIRM SUB</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function LiveSim({
  fixture,
  myClubName,
  events = [],
  minute = 0,
  isFinished = false,
  squad = [],
  lineup: initialLineup = [],
  speed = 1,
  onSpeedChange,
  onFinish,
  onSub,
}) {
  const [showSubPanel, setShowSubPanel] = useState(false);
  const [lineup, setLineup] = useState(initialLineup.length ? initialLineup : squad.slice(0, 11));
  const [subsUsed, setSubsUsed] = useState(0);
  const [subLog, setSubLog] = useState([]);
  const feedRef = useRef(null);

  const comp = getComp(fixture?.competition);
  const myColor = CLUB_COLOR[myClubName] || 'var(--green)';

  /* Derive live score from events seen so far */
  const liveMyGoals  = events.filter(e => e.type === 'goal').length;
  const liveOppGoals = events.filter(e => e.type === 'goalOpp').length;
  const homeScore = fixture?.isHome ? liveMyGoals : liveOppGoals;
  const awayScore = fixture?.isHome ? liveOppGoals : liveMyGoals;

  const result = liveMyGoals > liveOppGoals ? 'W' : liveMyGoals === liveOppGoals ? 'D' : 'L';
  const resultColor = result === 'W' ? '#00e87a' : result === 'D' ? '#f5c518' : '#ff3b5c';
  const progressPct = Math.min(100, Math.round((minute / 90) * 100));

  /* Auto-scroll feed */
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  function handleSubConfirm(outPlayer, inPlayer) {
    setLineup(prev => prev.map(p => p.id === outPlayer.id ? inPlayer : p));
    setSubsUsed(n => n + 1);
    setSubLog(prev => [...prev, { min: minute, out: outPlayer.name, in: inPlayer.name }]);
    setShowSubPanel(false);
    if (onSub) onSub(outPlayer, inPlayer);
  }

  /* ─── Event row ─── */
  function renderEvent(e, i) {
    const isGoalMy   = e.type === 'goal';
    const isGoalOpp  = e.type === 'goalOpp';
    const isGoal     = isGoalMy || isGoalOpp;
    const isHalf     = e.type === 'halftime';
    const isFull     = e.type === 'fulltime';
    const isDivider  = isHalf || isFull;
    const isRed      = e.type === 'redCard' || e.type === 'redCardOpp';

    let leftBorder = 'transparent';
    if (isGoalMy)  leftBorder = '#00e87a';
    if (isGoalOpp) leftBorder = '#ff3b5c';
    if (isDivider) leftBorder = '#f5c518';
    if (isRed)     leftBorder = '#ff3b5c';

    let bg = 'transparent';
    if (isGoalMy)  bg = 'rgba(0,232,122,0.05)';
    if (isGoalOpp) bg = 'rgba(255,59,92,0.05)';
    if (isDivider) bg = 'rgba(245,197,24,0.04)';

    let textColor = 'var(--text-muted)';
    if (isGoal)    textColor = 'var(--text)';
    if (isDivider) textColor = '#f5c518';

    let minColor = 'var(--text-muted)';
    if (isGoalMy)  minColor = '#00e87a';
    if (isGoalOpp) minColor = '#ff3b5c';
    if (isDivider) minColor = '#f5c518';

    return (
      <div key={i} style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: isDivider ? '12px 16px' : '8px 16px',
        background: bg,
        borderLeft: `2px solid ${leftBorder}`,
        borderBottom: isDivider ? '1px solid var(--border)' : 'none',
        animation: 'fadeSlide 0.2s ease both',
      }}>
        {/* Minute */}
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
          width: 28, flexShrink: 0, paddingTop: 2, letterSpacing: 0.5,
          color: minColor,
        }}>
          {isDivider ? '' : `${e.min}'`}
        </span>

        {/* Icon */}
        {!isDivider && (
          <div style={{ flexShrink: 0, paddingTop: 1 }}>
            <EventIcon type={e.type} />
          </div>
        )}

        {/* Text */}
        <div style={{ flex: 1 }}>
          <span style={{
            fontFamily: 'var(--font-body)', lineHeight: 1.5,
            fontSize: isDivider ? 10 : 12,
            color: textColor,
            fontWeight: isDivider ? 700 : 400,
            letterSpacing: isDivider ? 2.5 : 0,
            textTransform: isDivider ? 'uppercase' : 'none',
          }}>
            {e.text}
          </span>
          {e.assistName && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 2 }}>
              Assist: {e.assistName}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── Status label ─── */
  const statusLabel = (() => {
    if (isFinished) return 'FT';
    if (minute === 0) return 'KO';
    if (minute === 45) return 'HT';
    return `${minute}'`;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-1)', paddingBottom: 80 }}>
      <style>{`
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }
      `}</style>

      {/* ─── Scoreboard (sticky) ─── */}
      <div style={{
        position: 'sticky', top: 52, zIndex: 20,
        background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
      }}>
        {/* Competition colour strip */}
        <div style={{ height: 2, background: `linear-gradient(90deg, ${comp.accent}, ${comp.color})` }} />

        <div style={{ padding: '14px 16px 10px' }}>
          {/* Teams + score */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>

            {/* Home */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 0 }}>
              <ClubBadge name={fixture?.home} size={36} />
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600,
                color: 'var(--text-muted)', textAlign: 'center', letterSpacing: 0.5,
                maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{fixture?.home}</span>
            </div>

            {/* Score block */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 46, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{homeScore}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--border)', lineHeight: 1 }}>–</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 46, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{awayScore}</span>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2,
                color: isFinished ? resultColor : '#f5c518',
                background: isFinished ? `${resultColor}18` : 'rgba(245,197,24,0.1)',
                border: `1px solid ${isFinished ? resultColor + '44' : 'rgba(245,197,24,0.3)'}`,
                borderRadius: 4, padding: '2px 10px',
                animation: !isFinished && minute > 0 ? 'pulse 2s infinite' : 'none',
              }}>
                {statusLabel}
              </div>
            </div>

            {/* Away */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 0 }}>
              <ClubBadge name={fixture?.away} size={36} />
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600,
                color: 'var(--text-muted)', textAlign: 'center', letterSpacing: 0.5,
                maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{fixture?.away}</span>
            </div>
          </div>

          {/* Progress bar */}
          {!isFinished && (
            <div style={{ height: 2, background: 'var(--bg-5)', borderRadius: 1, marginTop: 10, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progressPct}%`,
                background: comp.accent, transition: 'width 0.6s', borderRadius: 1,
              }} />
            </div>
          )}

          {/* Speed controls */}
          {!isFinished && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
              {[1, 2, 5].map(s => (
                <button key={s} onClick={() => onSpeedChange(s)} style={{
                  padding: '3px 14px', borderRadius: 20,
                  background: speed === s ? comp.accent : 'var(--bg-4)',
                  border: speed === s ? 'none' : '1px solid var(--border)',
                  color: speed === s ? '#000' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: 1,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{s}x</button>
              ))}
              <div style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 2px' }} />
              <button onClick={() => { if (onFinish) onFinish(); }} style={{
                padding: '3px 12px', borderRadius: 20,
                background: 'var(--bg-4)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1,
                cursor: 'pointer',
              }}>Skip</button>
            </div>
          )}

          {/* Sub log strip */}
          {subLog.length > 0 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 8, scrollbarWidth: 'none' }}>
              {subLog.map((s, i) => (
                <div key={i} style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                  background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 6,
                  padding: '3px 8px',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 1 }}>{s.min}'</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#ff3b5c' }}>{s.out.split(' ').pop()}</span>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#00e87a' }}>{s.in.split(' ').pop()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Commentary feed ─── */}
      <div ref={feedRef} style={{ flex: 1, overflowY: 'auto' }}>
        {events.length === 0 && (
          <div style={{
            padding: '60px 16px', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)',
            letterSpacing: 2.5, textTransform: 'uppercase',
            animation: 'pulse 1.5s infinite',
          }}>
            Kick-off imminent...
          </div>
        )}
        {events.map((e, i) => renderEvent(e, i))}
      </div>

      {/* ─── Bottom bar ─── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '12px 16px 28px', borderTop: '1px solid var(--border)',
        background: 'var(--bg-1)',
      }}>
        {isFinished ? (
          <button onClick={onFinish} style={{
            width: '100%', padding: 15, borderRadius: 8, border: 'none',
            background: `linear-gradient(135deg, ${resultColor}, ${resultColor}cc)`,
            color: result === 'D' ? '#000' : result === 'W' ? '#000' : '#fff',
            fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 900, letterSpacing: 2, cursor: 'pointer',
          }}>
            VIEW MATCH REPORT
          </button>
        ) : (
          <button
            onClick={() => subsUsed < 3 && setShowSubPanel(true)}
            disabled={subsUsed >= 3}
            style={{
              width: '100%', padding: 13, borderRadius: 8,
              background: subsUsed >= 3 ? 'var(--bg-4)' : 'var(--bg-3)',
              border: `1px solid ${subsUsed >= 3 ? 'var(--bg-5)' : 'var(--border)'}`,
              color: subsUsed >= 3 ? 'var(--bg-5)' : 'var(--text-dim)',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: 1,
              cursor: subsUsed >= 3 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
            {subsUsed >= 3 ? 'No subs remaining' : `Make Substitution (${3 - subsUsed} left)`}
          </button>
        )}
      </div>

      {/* ─── Sub panel ─── */}
      {showSubPanel && (
        <SubPanel
          squad={squad}
          lineup={lineup}
          subsUsed={subsUsed}
          onConfirm={handleSubConfirm}
          onClose={() => setShowSubPanel(false)}
        />
      )}
    </div>
  );
}