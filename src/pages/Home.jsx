import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';

/* ─── Slideshow ─── */
const SLIDES = [
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=85',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1920&q=85',
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1920&q=85',
  'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=1920&q=85',
];

const LEAGUE_COUNTRY = {
  'Premier League':   { name: 'England',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'La Liga':          { name: 'Spain',       flag: '🇪🇸' },
  'Bundesliga':       { name: 'Germany',     flag: '🇩🇪' },
  'Serie A':          { name: 'Italy',       flag: '🇮🇹' },
  'Ligue 1':          { name: 'France',      flag: '🇫🇷' },
  'Champions League': { name: 'Europe',      flag: '🇪🇺' },
  'Eredivisie':       { name: 'Netherlands', flag: '🇳🇱' },
  'Super Lig':        { name: 'Turkey',      flag: '🇹🇷' },
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

/* ─── Stars ─── */
function Stars({ count }) {
  return (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
      {[1,2,3,4,5].map(i => {
        const full = i <= Math.floor(count);
        const half = !full && i === Math.ceil(count) && count % 1 !== 0;
        return (
          <svg key={i} width="20" height="20" viewBox="0 0 24 24">
            {full ? (
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#f5c518" />
            ) : half ? (
              <>
                <defs><linearGradient id={`h${i}`}><stop offset="50%" stopColor="#f5c518"/><stop offset="50%" stopColor="rgba(255,255,255,0.1)"/></linearGradient></defs>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={`url(#h${i})`} stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
              </>
            ) : (
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
            )}
          </svg>
        );
      })}
    </div>
  );
}

/* ─── Sharp Arrow Button ─── */
function ArrowBtn({ dir, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'rgba(255,255,255,0.08)',
      border: '1.5px solid rgba(255,255,255,0.25)',
      borderRadius: 6, width: 40, height: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: '#fff', flexShrink: 0,
      transition: 'all 0.15s',
      WebkitTapHighlightColor: 'transparent',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left' ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
      </svg>
    </button>
  );
}

/* ─── Kit Shirt ─── */
function KitShirt({ color, accent, label }) {
  const c = color || '#333';
  const a = accent || '#fff';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="72" height="72" viewBox="0 0 100 100">
        <path d="M30 20 L10 40 L25 45 L25 85 L75 85 L75 45 L90 40 L70 20 L60 28 Q50 34 40 28 Z" fill={c} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
        <path d="M40 28 Q50 38 60 28" fill="none" stroke={a} strokeWidth="2"/>
        <line x1="10" y1="40" x2="25" y2="45" stroke={a} strokeWidth="1" opacity="0.4"/>
        <line x1="90" y1="40" x2="75" y2="45" stroke={a} strokeWidth="1" opacity="0.4"/>
      </svg>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
    </div>
  );
}

/* ─── Section wrapper ─── */
function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'rgba(255,255,255,0.3)', letterSpacing: 3,
        textTransform: 'uppercase', marginBottom: 12,
        paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>{label}</div>
      {children}
    </div>
  );
}

/* ─── Club Detail Modal ─── */
function ClubDetailModal({ club, allPlayers, onConfirm, onBack }) {
  const stats = getStats(club.name, allPlayers);
  const color = club.color || '#4ade80';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: 'rgba(4,6,10,0.98)',
      backdropFilter: 'blur(24px)',
      overflowY: 'auto',
      animation: 'detailIn 0.3s ease',
    }}>
      <style>{`@keyframes detailIn { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Badge watermark bg */}
      {club.badgeUrl && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: `url(${club.badgeUrl})`,
          backgroundSize: '55%', backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat', opacity: 0.04, pointerEvents: 'none',
        }}/>
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto', padding: 'clamp(24px,5vw,48px) clamp(20px,5vw,40px)' }}>

        {/* Back */}
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', padding: '8px 0', marginBottom: 28,
          WebkitTapHighlightColor: 'transparent',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>

        {/* Club header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          {club.badgeUrl ? (
            <img src={club.badgeUrl} alt={club.name} style={{ width: 72, height: 72, objectFit: 'contain' }}/>
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: 12, flexShrink: 0,
              background: `linear-gradient(135deg, ${color}22, ${color}44)`,
              border: `2px solid ${color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 20, color, letterSpacing: 1,
            }}>{club.name?.slice(0,3).toUpperCase()}</div>
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,5vw,32px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: 0.5 }}>{club.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 }}>{club.league}</div>
            <div style={{ marginTop: 10 }}><Stars count={getStars(stats.ovr)} /></div>
          </div>
        </div>

        {/* Stats */}
        <Section label="Squad Ratings">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[['OVR', stats.ovr, color], ['ATT', stats.att, '#ef4444'], ['MID', stats.mid, '#3b82f6'], ['DEF', stats.def, '#22c55e']].map(([lbl, val, c]) => (
              <div key={lbl} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: c, lineHeight: 1 }}>{val || '—'}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Kit */}
        <Section label="Kit">
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', padding: '8px 0' }}>
            <KitShirt color={color} accent="#fff" label="Home" />
            <KitShirt color="#1a1a2e" accent={color} label="Away" />
            <KitShirt color={color + '88'} accent="#fff" label="Third" />
          </div>
        </Section>

        {/* Club info */}
        <Section label="Club Info">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['League', club.league],
              ['Country', LEAGUE_COUNTRY[club.league]?.name || '—'],
              ['Budget', fmt(club.budget)],
              ['Transfer Budget', fmt(club.transferBudget || club.budget)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#fff', fontWeight: 600 }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Confirm */}
        <button onClick={onConfirm} style={{
          width: '100%', padding: '14px 0',
          background: '#4ade80', color: '#000', border: 'none', borderRadius: 8,
          fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
          letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(74,222,128,0.25)', transition: 'all 0.2s',
          WebkitTapHighlightColor: 'transparent',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#2ecc71'}
          onMouseLeave={e => e.currentTarget.style.background = '#4ade80'}
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
}

/* ─── Team Select Modal ─── */
function TeamSelectModal({ allClubs, allPlayers, allLeagues, onSelect, onClose }) {
  const [search, setSearch]         = useState('');
  const [activeLeague, setLeague]   = useState('All');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [detailClub, setDetailClub] = useState(null);

  const leagues = useMemo(() => ['All', ...new Set((allClubs || []).map(c => c.league).filter(Boolean))], [allClubs]);

  const filtered = useMemo(() => {
    return (allClubs || []).filter(c => {
      const matchLeague = activeLeague === 'All' || c.league === activeLeague;
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
      return matchLeague && matchSearch;
    });
  }, [allClubs, activeLeague, search]);

  const currentClub = filtered[currentIdx];

  useEffect(() => { setCurrentIdx(0); }, [activeLeague, search]);

  const prev = () => setCurrentIdx(i => (i - 1 + filtered.length) % filtered.length);
  const next = () => setCurrentIdx(i => (i + 1) % filtered.length);

  if (detailClub) {
    return (
      <ClubDetailModal
        club={detailClub}
        allPlayers={allPlayers}
        onConfirm={() => onSelect(detailClub)}
        onBack={() => setDetailClub(null)}
      />
    );
  }

  const color = currentClub?.color || '#4ade80';
  const stats = getStats(currentClub?.name, allPlayers);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(4,6,10,0.97)',
      backdropFilter: 'blur(20px)',
      overflowY: 'auto',
      animation: 'modalIn 0.25s ease',
    }}>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.98) } to { opacity:1; transform:scale(1) } }`}</style>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(20px,5vw,40px) clamp(16px,5vw,32px)', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,5vw,28px)', fontWeight: 800, color: '#fff', letterSpacing: 1 }}>Choose Your Club</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>{filtered.length} clubs available</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', WebkitTapHighlightColor: 'transparent' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clubs..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px 10px 36px', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* League filter */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
          {leagues.map(l => (
            <button key={l} onClick={() => setLeague(l)} style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20,
              border: `1px solid ${activeLeague === l ? '#4ade80' : 'rgba(255,255,255,0.1)'}`,
              background: activeLeague === l ? 'rgba(74,222,128,0.12)' : 'transparent',
              color: activeLeague === l ? '#4ade80' : 'rgba(255,255,255,0.4)',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.5,
              textTransform: 'uppercase', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}>{l}</button>
          ))}
        </div>

        {/* Club carousel */}
        {currentClub ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <ArrowBtn dir="left" onClick={prev} />
              <div style={{ flex: 1, background: `linear-gradient(135deg, ${color}0d, rgba(255,255,255,0.03))`, border: `1px solid ${color}22`, borderRadius: 12, padding: 'clamp(20px,4vw,28px)', textAlign: 'center', cursor: 'pointer' }} onClick={() => setDetailClub(currentClub)}>
                {currentClub.badgeUrl ? (
                  <img src={currentClub.badgeUrl} alt={currentClub.name} style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 16 }}/>
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: 16, margin: '0 auto 16px', background: `linear-gradient(135deg, ${color}22, ${color}44)`, border: `2px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 22, color, letterSpacing: 1 }}>
                    {currentClub.name?.slice(0,3).toUpperCase()}
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,4vw,24px)', fontWeight: 800, color: '#fff', marginBottom: 4 }}>{currentClub.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{currentClub.league}</div>
                <Stars count={getStars(stats.ovr)} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
                  {[['ATT', stats.att, '#ef4444'], ['MID', stats.mid, '#3b82f6'], ['DEF', stats.def, '#22c55e']].map(([lbl, val, c]) => (
                    <div key={lbl} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px 4px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: c }}>{val || '—'}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 14, letterSpacing: 1 }}>Tap for full details</div>
              </div>
              <ArrowBtn dir="right" onClick={next} />
            </div>

            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 20, letterSpacing: 1 }}>
              {currentIdx + 1} / {filtered.length}
            </div>

            {currentClub && (
              <button onClick={() => setDetailClub(currentClub)} style={{
                width: '100%', padding: '14px 0',
                background: '#4ade80', color: '#000', border: 'none', borderRadius: 8,
                fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
                letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(74,222,128,0.25)', transition: 'all 0.2s',
                WebkitTapHighlightColor: 'transparent',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#2ecc71'}
                onMouseLeave={e => e.currentTarget.style.background = '#4ade80'}
              >
                Select Club
              </button>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2 }}>
            NO CLUBS FOUND
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Home ─── */
export default function Home() {
  const { allClubs, allLeagues, allPlayers, chooseClub } = useGameStore();
  const navigate = useNavigate();

  const [slide, setSlide]               = useState(0);
  const [loaded, setLoaded]             = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [loaderDone, setLoaderDone]     = useState(false);
  const [showModal, setShowModal]       = useState(false);

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 3;
      if (progress >= 100) {
        progress = 100; clearInterval(interval);
        setLoaderProgress(100);
        setTimeout(() => { setLoaderDone(true); setTimeout(() => setLoaded(true), 200); }, 350);
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

  // ── CHANGED: navigate to /home (dashboard) after club select ──
  const handleSelect = (club) => { chooseClub(club); setShowModal(false); navigate('/home'); };

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(36px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        .ts-slide-bg { position:absolute; inset:0; background-size:cover; background-position:center; opacity:0; transition:opacity 1.6s ease; }
        .ts-slide-bg.active { opacity:1; }
        .hero-h1    { opacity:0; animation: slideUp 0.9s 0.1s both ease; }
        .hero-sub   { opacity:0; animation: slideUp 0.7s 0.35s both ease; }
        .hero-btns  { opacity:0; animation: slideUp 0.7s 0.55s both ease; }
        .hero-stats { opacity:0; animation: fadeIn 0.8s 0.8s both ease; }
        .ts-start-btn:hover { background: #2ecc71 !important; box-shadow: 0 4px 28px rgba(74,222,128,0.4) !important; }
        .ts-start-btn:active { transform: scale(0.97); }
        .ts-howto-btn:hover { color: rgba(255,255,255,0.75) !important; border-color: rgba(255,255,255,0.35) !important; }
      `}</style>

      {/* Loader */}
      <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#060a06', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, opacity: loaderDone ? 0 : 1, transition:'opacity 0.5s ease', pointerEvents: loaderDone ? 'none' : 'all' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(26px,7vw,46px)', letterSpacing:8, color:'#4ade80', textTransform:'uppercase' }}>THE GAFFER</div>
        <div style={{ width:'clamp(180px,48vw,260px)', height:2, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${loaderProgress}%`, background:'#4ade80', transition:'width 0.15s linear', borderRadius:2 }}/>
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:3, color:'rgba(255,255,255,0.25)', textTransform:'uppercase' }}>{loaderProgress}%</div>
      </div>

      {/* Slideshow bg */}
      <div style={{ position:'fixed', inset:0, zIndex:0 }}>
        {SLIDES.map((url, i) => <div key={i} className={`ts-slide-bg ${i === slide ? 'active' : ''}`} style={{ backgroundImage:`url(${url})` }}/>)}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(4,6,10,0.97) 0%, rgba(4,6,10,0.82) 50%, rgba(4,6,10,0.35) 100%)' }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(4,6,10,0.98) 0%, rgba(4,6,10,0.4) 30%, transparent 60%)' }}/>
      </div>

      {/* Hero */}
      <div style={{ position:'relative', zIndex:1, minHeight:'100dvh', display:'flex', flexDirection:'column', justifyContent:'space-between', opacity: loaded ? 1 : 0, transition:'opacity 0.5s ease' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'clamp(60px,10vw,100px) clamp(24px,8vw,80px) clamp(40px,6vw,60px)' }}>
          <div style={{ maxWidth: 620 }}>

            <h1 className="hero-h1" style={{
              fontFamily:'var(--font-display)', fontWeight:900,
              fontSize:'clamp(56px,13vw,120px)',
              letterSpacing:'clamp(1px,0.3vw,3px)',
              lineHeight:0.88, color:'#fff',
              marginBottom:'clamp(20px,4vw,32px)',
              textTransform:'uppercase',
            }}>
              READY<br/>
              TO TAKE ON<br/>
              THE <span style={{ color:'#4ade80', textShadow:'0 0 40px rgba(74,222,128,0.5)' }}>HOT</span><br/>
              SEAT?
            </h1>

            <p className="hero-sub" style={{ fontSize:'clamp(13px,2.5vw,16px)', color:'rgba(255,255,255,0.45)', lineHeight:1.8, fontWeight:300, maxWidth:380, marginBottom:'clamp(28px,5vw,44px)' }}>
              Build a dynasty. Dominate the league. Prove you've got what it takes.
            </p>

            <div className="hero-btns" style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button className="ts-start-btn" onClick={() => setShowModal(true)} style={{
                background:'#4ade80', color:'#000', border:'none', borderRadius:6,
                fontFamily:'var(--font-display)', fontSize:'clamp(12px,2.5vw,14px)',
                fontWeight:700, letterSpacing:2, textTransform:'uppercase',
                padding:'clamp(12px,3vw,14px) clamp(22px,5vw,32px)',
                cursor:'pointer', boxShadow:'0 4px 20px rgba(74,222,128,0.25)',
                transition:'all 0.2s', display:'flex', alignItems:'center', gap:8,
                WebkitTapHighlightColor:'transparent',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Start Career
              </button>
              <button className="ts-howto-btn" style={{
                background:'transparent', color:'rgba(255,255,255,0.45)',
                border:'1px solid rgba(255,255,255,0.15)', borderRadius:6,
                fontFamily:'var(--font-display)', fontSize:'clamp(12px,2.5vw,14px)',
                fontWeight:700, letterSpacing:2, textTransform:'uppercase',
                padding:'clamp(12px,3vw,14px) clamp(22px,5vw,32px)',
                cursor:'pointer', transition:'all 0.2s', WebkitTapHighlightColor:'transparent',
              }}>How to Play</button>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="hero-stats" style={{ display:'flex', gap:'clamp(24px,6vw,64px)', padding:'clamp(20px,4vw,32px) clamp(24px,8vw,80px)', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(4,6,10,0.6)', backdropFilter:'blur(8px)' }}>
          {[['18','Top Clubs'],['6','Leagues'],['100+','Real Players']].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(22px,5vw,32px)', color:'#4ade80', lineHeight:1 }}>{val}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'clamp(9px,1.5vw,10px)', color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

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