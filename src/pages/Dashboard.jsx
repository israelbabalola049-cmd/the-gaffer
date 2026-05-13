import { useMemo } from 'react';
import useGameStore from '../store/gameStore';

/* ── helpers ── */
const fmt = (n) => {
  if (!n) return '—';
  if (n >= 1e9) return `£${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `£${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `£${(n / 1e3).toFixed(0)}K`;
  return `£${n}`;
};

const CLUB_BADGE_URL = {
  'Manchester City':   'https://resources.premierleague.com/premierleague/badges/50/t43.png',
  'Liverpool':         'https://resources.premierleague.com/premierleague/badges/50/t14.png',
  'Arsenal':           'https://resources.premierleague.com/premierleague/badges/50/t3.png',
  'Chelsea':           'https://resources.premierleague.com/premierleague/badges/50/t8.png',
  'Manchester United': 'https://resources.premierleague.com/premierleague/badges/50/t1.png',
  'Tottenham':         'https://resources.premierleague.com/premierleague/badges/50/t6.png',
  'Aston Villa':       'https://resources.premierleague.com/premierleague/badges/50/t7.png',
  'Brighton':          'https://resources.premierleague.com/premierleague/badges/50/t36.png',
};

const CLUB_COLOR = {
  'Real Madrid': '#FEBE10', 'Barcelona': '#A50044', 'Manchester City': '#6CABDD',
  'Liverpool': '#C8102E', 'Arsenal': '#EF0107', 'Chelsea': '#034694',
  'Manchester United': '#DA291C', 'Tottenham': '#132257', 'Bayern Munich': '#DC052D',
  'PSG': '#003370', 'AC Milan': '#FB090B', 'Inter Milan': '#0068A8',
  'Atletico Madrid': '#CB3524', 'Bayer Leverkusen': '#E32221',
  'Brighton': '#0057B8', 'Aston Villa': '#670E36',
  'Borussia Dortmund': '#FDE100', 'Juventus': '#555',
};

function MiniClubBadge({ name, size = 28 }) {
  const url = CLUB_BADGE_URL[name];
  const color = CLUB_COLOR[name] || '#888';
  const abbr = name?.slice(0, 3).toUpperCase() || '?';
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />;
  return (
    <div style={{
      width: size, height: size, borderRadius: 4, flexShrink: 0,
      background: `linear-gradient(135deg, ${color}22, ${color}44)`,
      border: `1px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.3, color, letterSpacing: 0.5,
    }}>{abbr}</div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-3)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ label, accent }) {
  return (
    <div style={{
      padding: '9px 14px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {accent && <div style={{ width: 3, height: 12, borderRadius: 2, background: accent, flexShrink: 0 }} />}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--text-muted)', letterSpacing: 3,
        textTransform: 'uppercase',
      }}>{label}</span>
    </div>
  );
}

function FormDot({ result }) {
  const color = result === 'W' ? 'var(--green)' : result === 'D' ? 'var(--yellow)' : 'var(--red)';
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 4,
      background: `${color === 'var(--green)' ? 'rgba(0,232,122,0.12)' : color === 'var(--yellow)' ? 'rgba(245,197,24,0.12)' : 'rgba(255,59,92,0.12)'}`,
      border: `1px solid ${color === 'var(--green)' ? 'rgba(0,232,122,0.35)' : color === 'var(--yellow)' ? 'rgba(245,197,24,0.35)' : 'rgba(255,59,92,0.35)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color,
    }}>{result}</div>
  );
}

function generateNews(club, squad) {
  const topPlayer = squad?.slice().sort((a, b) => b.overall - a.overall)[0];
  return [
    { tag: 'TRANSFER', text: `${club?.name} linked with summer reinforcements as the board backs new signings.` },
    { tag: 'FORM',     text: `Squad morale remains high ahead of the upcoming fixture run.` },
    { tag: 'SCOUT',    text: topPlayer ? `${topPlayer.name} continues to attract interest from top clubs across Europe.` : 'Scouts report positive findings on potential targets.' },
    { tag: 'BOARD',    text: `Board confident in the manager's project as the season gets underway.` },
    { tag: 'INJURY',   text: `Medical team reports the squad is in good health ahead of the next match.` },
  ];
}

/* ── Main ── */
export default function Dashboard() {
  const { myClub, squad, results, season, week, budget } = useGameStore();

  const topPerformer = useMemo(() =>
    squad?.length ? squad.slice().sort((a, b) => b.overall - a.overall)[0] : null
  , [squad]);

  const form = useMemo(() =>
    (results || []).slice(-5).map(r => {
      const mg = r.isHome ? r.homeGoals : r.awayGoals;
      const og = r.isHome ? r.awayGoals : r.homeGoals;
      return mg > og ? 'W' : mg === og ? 'D' : 'L';
    })
  , [results]);

  const wdl = useMemo(() => {
    const calc = (fn) => (results || []).filter(r => {
      const mg = r.isHome ? r.homeGoals : r.awayGoals;
      const og = r.isHome ? r.awayGoals : r.homeGoals;
      return fn(mg, og);
    }).length;
    return {
      w: calc((m, o) => m > o),
      d: calc((m, o) => m === o),
      l: calc((m, o) => m < o),
    };
  }, [results]);

  const lastResult = results?.length ? results[results.length - 1] : null;
  const accentColor = CLUB_COLOR[myClub?.name] || '#00e87a';
  const newsItems = generateNews(myClub, squad);

  return (
    <>
      <style>{`
        @keyframes dashIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .ds { animation: dashIn 0.35s ease both; }
        .ds:nth-child(1){animation-delay:.04s} .ds:nth-child(2){animation-delay:.08s}
        .ds:nth-child(3){animation-delay:.12s} .ds:nth-child(4){animation-delay:.16s}
        .ds:nth-child(5){animation-delay:.20s} .ds:nth-child(6){animation-delay:.24s}
        .ds:nth-child(7){animation-delay:.28s} .ds:nth-child(8){animation-delay:.32s}
        .ds:nth-child(9){animation-delay:.36s}
        .news-row:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-1)',
        padding: '14px 14px 80px',
        display: 'flex', flexDirection: 'column', gap: 10,
        maxWidth: 600, margin: '0 auto',
      }}>

        {/* 1. HERO STRIP */}
        <div className="ds" style={{
          background: `linear-gradient(135deg, ${accentColor}18 0%, var(--bg-4) 100%)`,
          border: `1px solid ${accentColor}30`,
          borderRadius: 10, padding: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <MiniClubBadge name={myClub?.name} size={46} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 900,
                fontSize: 'clamp(15px,4vw,19px)', color: 'var(--text)',
                letterSpacing: 0.5, lineHeight: 1.1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{myClub?.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 3 }}>{myClub?.league}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
            <span style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44`, borderRadius: 4, padding: '3px 10px', fontFamily: 'var(--font-mono)', fontSize: 10, color: accentColor, letterSpacing: 1.5, textTransform: 'uppercase' }}>S{season}</span>
            <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 10px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase' }}>W{week}</span>
          </div>
        </div>

        {/* 2 + 3. NEXT FIXTURE + LAST RESULT */}
        <div className="ds" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          <Card>
            <CardHeader label="Next Fixture" accent="var(--green)" />
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 88 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MiniClubBadge name={myClub?.name} size={22} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>VS</span>
                <div style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--bg-5)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)' }}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M2 12h20"/></svg>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-dim)' }}>TBD</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>Fixtures pending</div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader label="Last Result" accent={
              form.length ? (form[form.length-1] === 'W' ? 'var(--green)' : form[form.length-1] === 'D' ? 'var(--yellow)' : 'var(--red)') : 'var(--border)'
            } />
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 88 }}>
              {lastResult ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{lastResult.homeGoals}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>–</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{lastResult.awayGoals}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{lastResult.opponent || 'vs Opponent'}</div>
                </>
              ) : (
                <>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--bg-5)', lineHeight: 1 }}>—</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase' }}>No result yet</span>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* 4. FORM */}
        <Card className="ds">
          <CardHeader label="Form" accent="var(--text-muted)" />
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
            {form.length > 0 ? (
              <>
                {form.map((r, i) => <FormDot key={i} result={r} />)}
                {form.length < 5 && Array.from({ length: 5 - form.length }).map((_, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-5)', border: '1px solid var(--border)' }} />
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
                  {[['W', wdl.w, 'var(--green)'], ['D', wdl.d, 'var(--yellow)'], ['L', wdl.l, 'var(--red)']].map(([l, v, c]) => (
                    <div key={l} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-5)', border: '1px solid var(--border)' }} />
                ))}
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase' }}>No matches yet</span>
              </>
            )}
          </div>
        </Card>

        {/* 5. TOP PERFORMER */}
        <Card className="ds">
          <CardHeader label="Top Performer" accent="var(--yellow)" />
          {topPerformer ? (
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(topPerformer.name)}&background=1e242d&color=e8edf2&size=80&bold=true`}
                alt={topPerformer.name}
                style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topPerformer.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                  <span style={{ background: 'var(--bg-5)', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 7px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{topPerformer.position}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, alignSelf: 'center' }}>{topPerformer.nationality}</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 900, color: 'var(--yellow)', lineHeight: 1 }}>{topPerformer.overall}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>OVR</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>No squad data</div>
          )}
        </Card>

        {/* 6. SEASON STATS */}
        <Card className="ds">
          <CardHeader label="Season Stats" accent="var(--blue)" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', padding: '14px 10px' }}>
            {[
              ['Played', results.length, 'var(--text)'],
              ['Won',    wdl.w,          'var(--green)'],
              ['Drawn',  wdl.d,          'var(--yellow)'],
              ['Lost',   wdl.l,          'var(--red)'],
              ['Budget', fmt(budget),    'var(--green)'],
            ].map(([label, value, color], i, arr) => (
              <div key={label} style={{ textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none', padding: '0 4px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: label === 'Budget' ? 13 : 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* 7. LEAGUE SNAPSHOT */}
        <Card className="ds">
          <CardHeader label="League Table" accent="var(--green)" />
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 26px 26px 26px 34px', gap: 4, padding: '6px 14px', borderBottom: '1px solid var(--border)' }}>
              {['#', 'Club', 'P', 'W', 'GD', 'Pts'].map(h => (
                <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: h === 'Club' ? 'left' : 'center' }}>{h}</span>
              ))}
            </div>
            {[1, 2, 3, 4, 5].map(pos => {
              const isUser = pos === 1;
              return (
                <div key={pos} style={{
                  display: 'grid', gridTemplateColumns: '24px 1fr 26px 26px 26px 34px',
                  gap: 4, padding: '8px 14px',
                  background: isUser ? `${accentColor}10` : 'transparent',
                  borderLeft: isUser ? `2px solid ${accentColor}` : '2px solid transparent',
                  borderBottom: pos < 5 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isUser ? accentColor : 'var(--text-muted)', textAlign: 'center', alignSelf: 'center', fontWeight: isUser ? 700 : 400 }}>{pos}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                    {isUser ? (
                      <>
                        <MiniClubBadge name={myClub?.name} size={17} />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{myClub?.name}</span>
                      </>
                    ) : (
                      <>
                        <div style={{ width: 17, height: 17, borderRadius: 3, background: 'var(--bg-5)', border: '1px solid var(--border)', flexShrink: 0 }} />
                        <div style={{ width: '70%', height: 9, borderRadius: 3, background: 'var(--bg-5)' }} />
                      </>
                    )}
                  </div>
                  {[
                    isUser ? results.length     : null,
                    isUser ? wdl.w              : null,
                    isUser ? '0'                : null,
                    isUser ? wdl.w * 3 + wdl.d : null,
                  ].map((val, i) => (
                    <span key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: isUser ? 700 : 400, color: isUser ? 'var(--text)' : 'var(--bg-5)', textAlign: 'center', alignSelf: 'center' }}>
                      {val !== null ? val : '—'}
                    </span>
                  ))}
                </div>
              );
            })}
            <div style={{ padding: '8px 14px 10px', textAlign: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>Full table available in Competitions</span>
            </div>
          </div>
        </Card>

        {/* 8. MORALE */}
        <Card className="ds">
          <CardHeader label="Squad Morale" accent="var(--green)" />
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-dim)' }}>Good</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 800, color: 'var(--green)' }}>72</span>
            </div>
            <div style={{ height: 5, background: 'var(--bg-5)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '72%', background: 'linear-gradient(to right, var(--green), #00b85f)', borderRadius: 3 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5 }}>LOW</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5 }}>HIGH</span>
            </div>
          </div>
        </Card>

        {/* 9. NEWS FEED */}
        <Card className="ds">
          <CardHeader label="Club News" accent="var(--yellow)" />
          <div style={{ padding: '4px 0' }}>
            {newsItems.map((item, i) => {
              const tagColors = {
                TRANSFER: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', color: 'var(--blue)' },
                INJURY:   { bg: 'rgba(255,59,92,0.12)',  border: 'rgba(255,59,92,0.25)',  color: 'var(--red)' },
                BOARD:    { bg: 'rgba(245,197,24,0.12)', border: 'rgba(245,197,24,0.25)', color: 'var(--yellow)' },
                FORM:     { bg: 'rgba(0,232,122,0.10)',  border: 'rgba(0,232,122,0.2)',   color: 'var(--green)' },
                SCOUT:    { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' },
              };
              const tc = tagColors[item.tag] || tagColors.SCOUT;
              return (
                <div key={i} className="news-row" style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '11px 14px',
                  borderBottom: i < newsItems.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s', cursor: 'default',
                }}>
                  <span style={{
                    flexShrink: 0, padding: '2px 6px', borderRadius: 3, marginTop: 2,
                    fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    background: tc.bg, border: `1px solid ${tc.border}`, color: tc.color,
                  }}>{item.tag}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.65 }}>{item.text}</span>
                </div>
              );
            })}
          </div>
        </Card>

      </div>
    </>
  );
}