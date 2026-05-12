import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';

/* ─── Slideshow ─────────────────────────────────────────────────────────── */
const SLIDES = [
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=85',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1920&q=85',
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1920&q=85',
  'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=1920&q=85',
];

/* ─── Club colours & abbreviations ──────────────────────────────────────── */
const CLUB_COLOR = {
  'Real Madrid': '#FEBE10', 'Barcelona': '#A50044', 'Manchester City': '#6CABDD',
  'Liverpool': '#C8102E', 'Arsenal': '#EF0107', 'Chelsea': '#034694',
  'Manchester United': '#DA291C', 'Tottenham': '#132257', 'Bayern Munich': '#DC052D',
  'PSG': '#003370', 'AC Milan': '#FB090B', 'Inter Milan': '#0068A8',
  'Atletico Madrid': '#CB3524', 'Bayer Leverkusen': '#E32221',
  'Brighton': '#0057B8', 'Aston Villa': '#670E36',
  'Borussia Dortmund': '#FDE100', 'Juventus': '#000000',
};

const CLUB_ABBR = {
  'Real Madrid': 'RM', 'Barcelona': 'FCB', 'Manchester City': 'MCI',
  'Liverpool': 'LFC', 'Arsenal': 'ARS', 'Chelsea': 'CHE',
  'Manchester United': 'MUN', 'Tottenham': 'TOT', 'Bayern Munich': 'FCB',
  'PSG': 'PSG', 'AC Milan': 'MIL', 'Inter Milan': 'INT',
  'Atletico Madrid': 'ATM', 'Bayer Leverkusen': 'B04',
  'Brighton': 'BHA', 'Aston Villa': 'AVL',
  'Borussia Dortmund': 'BVB', 'Juventus': 'JUV',
};

const LEAGUE_COUNTRY = {
  'Premier League':   { name: 'England',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'La Liga':          { name: 'Spain',       flag: '🇪🇸' },
  'Bundesliga':       { name: 'Germany',     flag: '🇩🇪' },
  'Serie A':          { name: 'Italy',       flag: '🇮🇹' },
  'Ligue 1':          { name: 'France',      flag: '🇫🇷' },
  'Champions League': { name: 'Europe',      flag: '🇪🇺' },
  'Eredivisie':       { name: 'Netherlands', flag: '🇳🇱' },
};

const fmt = (n) => {
  if (!n) return '—';
  if (n >= 1e9) return `£${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `£${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `£${(n / 1e3).toFixed(0)}K`;
  return `£${n}`;
};

const getStats = (clubName, allPlayers) => {
  const players = (allPlayers || []).filter(p => p.club === clubName);
  if (!players.length) return { att: 0, mid: 0, def: 0, ovr: 0 };
  const avg = arr => arr.length ? Math.round(arr.reduce((s, p) => s + p.overall, 0) / arr.length) : 0;
  return {
    att: avg(players.filter(p => ['ST','LW','RW','CAM','CF'].includes(p.position))),
    mid: avg(players.filter(p => ['CM','CDM','LM','RM'].includes(p.position))),
    def: avg(players.filter(p => ['CB','LB','RB','LWB','RWB','GK'].includes(p.position))),
    ovr: avg(players),
  };
};

const getStars = (ovr) => {
  if (ovr >= 88) return 5;
  if (ovr >= 85) return 4.5;
  if (ovr >= 82) return 4;
  if (ovr >= 79) return 3.5;
  return 3;
};

/* ─── Star Rating ────────────────────────────────────────────────────────── */
function Stars({ count }) {
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '10px 0 6px' }}>
      {[1,2,3,4,5].map(i => {
        const full = i <= Math.floor(count);
        const half = !full && i === Math.ceil(count) && count % 1 !== 0;
        return (
          <svg key={i} width="18" height="18" viewBox="0 0 24 24">
            {full ? (
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#f5c518" />
            ) : half ? (
              <>
                <defs><linearGradient id={`h${i}`}><stop offset="50%" stopColor="#f5c518"/><stop offset="50%" stopColor="rgba(255,255,255,0.1)"/></linearGradient></defs>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={`url(#h${i})`} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              </>
            ) : (
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            )}
          </svg>
        );
      })}
    </div>
  );
}

/* ─── Arrow Button ───────────────────────────────────────────────────────── */
function ArrowBtn({ dir, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '50%',
        width: 48, height: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: '#fff', fontSize: 22,
        flexShrink: 0,
        transition: 'background 0.15s',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
    >
      {dir === 'left' ? '‹' : '›'}
    </button>
  );
}

/* ─── Team Select Modal ──────────────────────────────────────────────────── */
function TeamSelectModal({ allClubs, allPlayers, onSelect, onClose }) {
  const leagues = useMemo(() => {
    return [...new Set((allClubs || []).map(c => c.league).filter(Boolean))];
  }, [allClubs]);

  const [leagueIdx, setLeagueIdx] = useState(0);
  const [clubIdx, setClubIdx] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  const currentLeague = leagues[leagueIdx] || '';
  const clubsInLeague = useMemo(() =>
    (allClubs || []).filter(c => c.league === currentLeague),
    [allClubs, currentLeague]
  );
  const currentClub = clubsInLeague[clubIdx] || null;

  const country = LEAGUE_COUNTRY[currentLeague] || { name: currentLeague, flag: '🌍' };
  const color = currentClub ? (CLUB_COLOR[currentClub.name] || '#888') : '#888';
  const abbr = currentClub ? (CLUB_ABBR[currentClub.name] || currentClub.name.slice(0,3).toUpperCase()) : '—';
  const stats = currentClub ? getStats(currentClub.name, allPlayers) : { att:0, mid:0, def:0, ovr:0 };
  const stars = getStars(stats.ovr);

  const prevLeague = () => { setLeagueIdx(i => (i - 1 + leagues.length) % leagues.length); setClubIdx(0); setCardKey(k => k+1); };
  const nextLeague = () => { setLeagueIdx(i => (i + 1) % leagues.length); setClubIdx(0); setCardKey(k => k+1); };
  const prevClub   = () => { setClubIdx(i => (i - 1 + clubsInLeague.length) % clubsInLeague.length); setCardKey(k => k+1); };
  const nextClub   = () => { setClubIdx(i => (i + 1) % clubsInLeague.length); setCardKey(k => k+1); };

  const handleConfirm = () => {
    if (!currentClub || confirming) return;
    setConfirming(true);
    setTimeout(() => onSelect(currentClub), 600);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  prevClub();
      if (e.key === 'ArrowRight') nextClub();
      if (e.key === 'Enter')      handleConfirm();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clubsInLeague.length, currentClub, confirming]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(4,6,10,0.97)',
      backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      animation: 'tsIn 0.3s ease',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes tsIn { from { opacity:0 } to { opacity:1 } }
        @keyframes cardIn { from { opacity:0; transform:scale(0.88) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* TOP: League selector */}
      <div style={{
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'clamp(14px,3.5vw,24px) clamp(16px,5vw,40px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%', width: 38, height: 38,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 15,
          flexShrink: 0, WebkitTapHighlightColor: 'transparent',
        }}>✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,3vw,20px)' }}>
          <ArrowBtn dir="left" onClick={prevLeague} />
          <div style={{ textAlign: 'center', minWidth: 'clamp(100px,28vw,160px)' }}>
            <div style={{ fontSize: 'clamp(22px,6vw,34px)', lineHeight: 1 }}>{country.flag}</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(12px,3vw,17px)',
              letterSpacing: 3, textTransform: 'uppercase',
              color: '#fff', marginTop: 5,
            }}>{country.name}</div>
          </div>
          <ArrowBtn dir="right" onClick={nextLeague} />
        </div>

        <div style={{ width: 38 }} />
      </div>

      {/* MIDDLE: Club card */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', padding: 'clamp(12px,3vw,24px) 0',
      }}>
        <div style={{
          width: 'clamp(48px,12vw,80px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', flexShrink: 0,
        }}>
          <ArrowBtn dir="left" onClick={prevClub} />
        </div>

        {currentClub ? (
          <div key={cardKey} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: `linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
            border: `1.5px solid ${color}45`,
            borderRadius: 16,
            padding: 'clamp(20px,4vw,36px) clamp(16px,5vw,48px)',
            width: '100%',
            maxWidth: 'clamp(240px,60vw,340px)',
            boxShadow: `0 0 80px ${color}15, 0 12px 50px rgba(0,0,0,0.6)`,
            animation: 'cardIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
              width: 240, height: 240, borderRadius: '50%',
              background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(11px,2.5vw,14px)',
              letterSpacing: 3, textTransform: 'uppercase',
              color, marginBottom: 12, textAlign: 'center',
              animation: 'fadeUp 0.3s ease',
            }}>{currentClub.name}</div>

            <div style={{
              width: 'clamp(88px,20vw,120px)',
              height: 'clamp(88px,20vw,120px)',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${color}22, ${color}48)`,
              border: `2px solid ${color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px,4.5vw,26px)',
              letterSpacing: 2, color,
              boxShadow: `0 8px 32px ${color}30`,
              flexShrink: 0,
            }}>{abbr}</div>

            <Stars count={stars} />

            <div style={{
              display: 'flex', width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, overflow: 'hidden',
              marginTop: 8, animation: 'fadeUp 0.35s ease',
            }}>
              {[['ATT', stats.att], ['MID', stats.mid], ['DEF', stats.def]].map(([lbl, val], i) => (
                <div key={lbl} style={{
                  flex: 1, textAlign: 'center',
                  padding: 'clamp(10px,2.5vw,14px) 0',
                  borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(20px,5vw,28px)',
                    color: '#fff', lineHeight: 1,
                  }}>{val || '—'}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(8px,1.8vw,10px)',
                    color: 'rgba(255,255,255,0.38)',
                    letterSpacing: 2, textTransform: 'uppercase', marginTop: 4,
                  }}>{lbl}</div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 10,
              fontFamily: 'var(--font-mono)',
              fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 1,
            }}>
              {clubIdx + 1} / {clubsInLeague.length}
            </div>
          </div>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            No clubs in this league
          </div>
        )}

        <div style={{
          width: 'clamp(48px,12vw,80px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', flexShrink: 0,
        }}>
          <ArrowBtn dir="right" onClick={nextClub} />
        </div>
      </div>

      {/* BOTTOM: League + budget + confirm */}
      <div style={{
        width: '100%',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(4,6,10,0.96)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 8,
        padding: 'clamp(14px,3.5vw,22px) clamp(20px,6vw,48px)',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(9px,2vw,11px)',
          letterSpacing: 3, textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
        }}>{currentLeague}</div>

        {currentClub && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(10px,2vw,12px)',
            color: 'var(--green)', letterSpacing: 1,
          }}>Transfer Budget: {fmt(currentClub.budget)}</div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!currentClub || confirming}
          style={{
            background: confirming ? 'rgba(74,222,128,0.35)' : 'var(--green)',
            color: '#000', border: 'none', borderRadius: 6,
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(13px,3vw,15px)',
            fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
            padding: 'clamp(12px,3vw,15px) clamp(32px,8vw,60px)',
            cursor: currentClub && !confirming ? 'pointer' : 'default',
            opacity: currentClub ? 1 : 0.3,
            transition: 'all 0.2s',
            boxShadow: currentClub ? '0 4px 20px rgba(74,222,128,0.22)' : 'none',
            width: '100%', maxWidth: 320,
            marginTop: 4,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {confirming ? 'Loading...' : 'SELECT CLUB'}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Home ──────────────────────────────────────────────────────────── */
export default function Home() {
  const { allClubs, allLeagues, allPlayers, chooseClub } = useGameStore();
  const navigate = useNavigate();

  const [slide, setSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [loaderDone, setLoaderDone] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 3;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setLoaderProgress(100);
        setTimeout(() => {
          setLoaderDone(true);
          setTimeout(() => setLoaded(true), 200);
        }, 350);
        return;
      }
      setLoaderProgress(progress);
    }, 70);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5500);
    return () => clearInterval(t);
  }, [loaded]);

  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const handleSelect = (club) => {
    chooseClub(club);
    setShowModal(false);
    navigate('/squad');
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(36px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        .ts-slide-bg {
          position:absolute; inset:0;
          background-size:cover; background-position:center;
          opacity:0; transition:opacity 1.6s ease;
        }
        .ts-slide-bg.active { opacity:1; }

        .hero-eyebrow { opacity:0; animation: slideUp 0.7s 0.1s both ease; }
        .hero-h1      { opacity:0; animation: slideUp 0.9s 0.3s both ease; }
        .hero-sub     { opacity:0; animation: slideUp 0.7s 0.55s both ease; }
        .hero-btns    { opacity:0; animation: slideUp 0.7s 0.75s both ease; }
        .hero-stats   { opacity:0; animation: fadeIn 0.8s 1.0s both ease; }

        .ts-start-btn:hover { background: #2ecc71 !important; box-shadow: 0 4px 28px rgba(74,222,128,0.4) !important; }
        .ts-start-btn:active { transform:scale(0.97); }
        .ts-howto-btn:hover { color: rgba(255,255,255,0.75) !important; border-color: rgba(255,255,255,0.35) !important; }
      `}</style>

      {/* Loader */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#060a06',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
        opacity: loaderDone ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: loaderDone ? 'none' : 'all',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(26px,7vw,46px)',
          letterSpacing: 8, color: '#4ade80',
          textTransform: 'uppercase',
        }}>THE GAFFER</div>

        <div style={{
          width: 'clamp(180px,48vw,260px)', height: 2,
          background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${loaderProgress}%`,
            background: '#4ade80',
            transition: 'width 0.15s linear', borderRadius: 2,
          }} />
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: 3, color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase',
        }}>{loaderProgress}%</div>
      </div>

      {/* Background slideshow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {SLIDES.map((url, i) => (
          <div key={i} className={`ts-slide-bg ${i === slide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${url})` }} />
        ))}
        {/* Left-to-right dark gradient so text stays readable */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(4,6,10,0.97) 0%, rgba(4,6,10,0.82) 50%, rgba(4,6,10,0.35) 100%)',
        }} />
        {/* Bottom fade for stats strip */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(4,6,10,0.98) 0%, rgba(4,6,10,0.4) 30%, transparent 60%)',
        }} />
      </div>

      {/* Hero — full viewport, flex column, space-between */}
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>

        {/* ── Main content block ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(60px,10vw,100px) clamp(24px,8vw,80px) clamp(40px,6vw,60px)',
        }}>
          <div style={{ maxWidth: 580 }}>

            {/* Eyebrow */}
            <div className="hero-eyebrow" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(10px,2vw,12px)',
              color: '#4ade80', textTransform: 'uppercase', letterSpacing: '3px',
              marginBottom: 'clamp(12px,3vw,20px)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ width: 28, height: 1, background: '#4ade80', display: 'inline-block' }} />
              Season 2024/25
            </div>

            {/* H1 */}
            <h1 className="hero-h1" style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(52px,12vw,108px)',
              letterSpacing: 'clamp(1px,0.3vw,3px)',
              lineHeight: 0.9, color: '#fff',
              marginBottom: 'clamp(16px,4vw,28px)',
              textTransform: 'uppercase', fontWeight: 900,
            }}>
              READY TO<br />
              TAKE THE<br />
              <span style={{
                color: '#4ade80',
                textShadow: '0 0 40px rgba(74,222,128,0.5)',
              }}>HOT</span> SEAT?
            </h1>

            {/* Subtitle */}
            <p className="hero-sub" style={{
              fontSize: 'clamp(13px,2.5vw,16px)',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.8, fontWeight: 300, maxWidth: 380,
              marginBottom: 'clamp(28px,5vw,44px)',
            }}>
              Build a dynasty. Dominate the league. Prove you've got what it takes.
            </p>

            {/* Buttons */}
            <div className="hero-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                className="ts-start-btn"
                onClick={() => setShowModal(true)}
                style={{
                  background: '#4ade80', color: '#000',
                  border: 'none', borderRadius: 6,
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(12px,2.5vw,14px)',
                  fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
                  padding: 'clamp(12px,3vw,14px) clamp(22px,5vw,32px)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(74,222,128,0.25)',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 8,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Start Career
              </button>

              <button
                className="ts-howto-btn"
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.45)',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(12px,2.5vw,14px)',
                  fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
                  padding: 'clamp(12px,3vw,14px) clamp(22px,5vw,32px)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >How to Play</button>
            </div>

          </div>
        </div>

        {/* ── Stats strip — sits at the bottom in normal flow ── */}
        <div className="hero-stats" style={{
          display: 'flex',
          gap: 'clamp(24px,6vw,64px)',
          padding: 'clamp(20px,4vw,32px) clamp(24px,8vw,80px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(4,6,10,0.6)',
          backdropFilter: 'blur(8px)',
        }}>
          {[['18', 'Top Clubs'], ['6', 'Leagues'], ['100+', 'Real Players']].map(([val, label]) => (
            <div key={label}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px,5vw,32px)',
                color: '#4ade80', lineHeight: 1,
              }}>{val}</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(9px,1.5vw,10px)',
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 4,
              }}>{label}</div>
            </div>
          ))}
        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <TeamSelectModal
          allClubs={allClubs || []}
          allPlayers={allPlayers || []}
          allLeagues={allLeagues || []}
          onSelect={handleSelect}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}