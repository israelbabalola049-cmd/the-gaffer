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

const LEAGUE_LOGO = {
  'Premier League':   'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg',
  'La Liga':          'https://upload.wikimedia.org/wikipedia/commons/5/54/LaLiga_EA_Sports_logo_%28Vertical%29.svg',
  'Bundesliga':       'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
  'Serie A':          'https://upload.wikimedia.org/wikipedia/en/e/e1/Serie_A_logo_%282019%29.svg',
  'Ligue 1':          'https://upload.wikimedia.org/wikipedia/commons/e/e7/Ligue_1_McDonald%27s_logo.svg',
  'Champions League': 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg',
  'Eredivisie':       'https://upload.wikimedia.org/wikipedia/commons/0/09/Eredivisie_nieuw_logo_2017-.svg',
  'Super Lig':        'https://upload.wikimedia.org/wikipedia/commons/f/f4/S%C3%BCper_Lig_logo.svg',
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
          <svg key={i} width="22" height="22" viewBox="0 0 24 24">
            {full ? (
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#f5c518"/>
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

/* ─── Club Badge Fallback SVG ─── */
function ClubBadgeFallback({ club, size = 110 }) {
  const color = club?.color || '#888';
  const name = club?.name || '';
  // Pick a shape style based on club id or name hash so each club looks different
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const style = hash % 5; // 0–4 shield styles

  const half = size / 2;
  const s = size;

  // Shield paths scaled to `size`
  const shields = [
    // 0: Classic pointed bottom shield
    `M ${half} ${s * 0.06} L ${s * 0.92} ${s * 0.22} L ${s * 0.92} ${s * 0.58} Q ${s * 0.92} ${s * 0.82} ${half} ${s * 0.96} Q ${s * 0.08} ${s * 0.82} ${s * 0.08} ${s * 0.58} L ${s * 0.08} ${s * 0.22} Z`,
    // 1: Rounded top shield
    `M ${s * 0.1} ${s * 0.28} Q ${s * 0.1} ${s * 0.08} ${half} ${s * 0.06} Q ${s * 0.9} ${s * 0.08} ${s * 0.9} ${s * 0.28} L ${s * 0.9} ${s * 0.62} Q ${s * 0.9} ${s * 0.84} ${half} ${s * 0.96} Q ${s * 0.1} ${s * 0.84} ${s * 0.1} ${s * 0.62} Z`,
    // 2: Flat top shield
    `M ${s * 0.1} ${s * 0.1} L ${s * 0.9} ${s * 0.1} L ${s * 0.9} ${s * 0.65} Q ${s * 0.9} ${s * 0.84} ${half} ${s * 0.96} Q ${s * 0.1} ${s * 0.84} ${s * 0.1} ${s * 0.65} Z`,
    // 3: Badge hexagon-ish
    `M ${half} ${s * 0.04} L ${s * 0.9} ${s * 0.26} L ${s * 0.9} ${s * 0.68} L ${half} ${s * 0.96} L ${s * 0.1} ${s * 0.68} L ${s * 0.1} ${s * 0.26} Z`,
    // 4: Crest with notch top
    `M ${s * 0.1} ${s * 0.18} L ${s * 0.35} ${s * 0.06} L ${half} ${s * 0.14} L ${s * 0.65} ${s * 0.06} L ${s * 0.9} ${s * 0.18} L ${s * 0.9} ${s * 0.62} Q ${s * 0.9} ${s * 0.84} ${half} ${s * 0.96} Q ${s * 0.1} ${s * 0.84} ${s * 0.1} ${s * 0.62} Z`,
  ];

  const abbr = name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();

  return (
    <svg width={size} height={size} viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`fbg-${abbr}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.12"/>
        </linearGradient>
      </defs>
      {/* Shield fill */}
      <path d={shields[style]} fill={`url(#fbg-${abbr})`} stroke={color} strokeWidth={s * 0.025} strokeLinejoin="round"/>
      {/* Inner border */}
      <path d={shields[style]} fill="none" stroke={color} strokeWidth={s * 0.012} strokeLinejoin="round" opacity="0.3"
        transform={`scale(0.82) translate(${s * 0.1} ${s * 0.1})`}/>
      {/* Club abbreviation */}
      <text
        x={half} y={half + s * 0.06}
        textAnchor="middle"
        fontFamily="'Barlow Condensed', sans-serif"
        fontWeight="900"
        fontSize={s * 0.22}
        fill={color}
        letterSpacing={s * 0.01}
      >{abbr}</text>
    </svg>
  );
}

/* ─── Badge image with SVG fallback on error ─── */
function BadgeImg({ club, size = 110 }) {
  const [failed, setFailed] = useState(false);
  if (!club?.badgeUrl || failed) return <ClubBadgeFallback club={club} size={size} />;
  return (
    <img
      src={club.badgeUrl}
      alt={club.name}
      style={{ width: size, height: size, objectFit: 'contain' }}
      onError={() => setFailed(true)}
    />
  );
}

/* ─── Arrow Button ─── */
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

/* ─── Kit Shirt — clean accurate football shirt ─── */
function KitShirt({ color, accent, label }) {
  const c = color || '#1a1a2e';
  const a = accent || '#ffffff';
  const id = `sh-${label}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <svg width="96" height="100" viewBox="0 0 200 210" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.45"/>
          </filter>
          {/* Subtle fabric sheen gradient */}
          <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.1"/>
            <stop offset="50%" stopColor="#fff" stopOpacity="0.03"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.08"/>
          </linearGradient>
        </defs>

        {/*
          Shirt outline:
          - Collar notch at top center
          - Shoulder seams drop outward to sleeve ends
          - Sleeves angle down then cut flat at cuff
          - Body tapers slightly at waist, flares to hem
        */}
        <path
          d="
            M 72 18
            C 72 18  80 8  100 8
            C 120 8  128 18  128 18
            L 158 10
            L 192 52
            L 162 66
            L 158 190
            L 42 190
            L 38 66
            L 8 52
            L 42 10
            Z
          "
          fill={c}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          filter={`url(#${id})`}
        />

        {/* Sheen overlay */}
        <path
          d="
            M 72 18
            C 72 18  80 8  100 8
            C 120 8  128 18  128 18
            L 158 10
            L 192 52
            L 162 66
            L 158 190
            L 42 190
            L 38 66
            L 8 52
            L 42 10
            Z
          "
          fill={`url(#g-${id})`}
        />

        {/* V-collar */}
        <path
          d="M 82 20 L 100 44 L 118 20"
          fill="none"
          stroke={a}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* Left shoulder seam line */}
        <line x1="72" y1="18" x2="42" y2="10" stroke={a} strokeWidth="1.5" opacity="0.2"/>
        {/* Right shoulder seam line */}
        <line x1="128" y1="18" x2="158" y2="10" stroke={a} strokeWidth="1.5" opacity="0.2"/>

        {/* Left sleeve cuff band */}
        <path d="M 10 48 L 38 62" stroke={a} strokeWidth="4" strokeLinecap="round" opacity="0.35"/>
        {/* Right sleeve cuff band */}
        <path d="M 190 48 L 162 62" stroke={a} strokeWidth="4" strokeLinecap="round" opacity="0.35"/>

        {/* Hem band */}
        <path d="M 42 184 L 158 184" stroke={a} strokeWidth="3" strokeLinecap="round" opacity="0.2"/>

        {/* Side seam subtle line */}
        <line x1="42" y1="66" x2="42" y2="184" stroke={a} strokeWidth="1" opacity="0.08"/>
        <line x1="158" y1="66" x2="158" y2="184" stroke={a} strokeWidth="1" opacity="0.08"/>
      </svg>

      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 4, padding: '3px 10px',
      }}>{label}</span>
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
      background: 'rgba(4,6,10,0.97)',
      overflowY: 'auto',
      animation: 'detailIn 0.3s ease',
    }}>
      <style>{`@keyframes detailIn { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Sticky badge watermark — fixed so it doesn't scroll away */}
      {club.badgeUrl && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: `url(${club.badgeUrl})`,
          backgroundSize: '52%',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.05,
        }}/>
      )}
      {/* Color glow — also fixed */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 40%, ${color}0e 0%, transparent 60%)`,
      }}/>

      {/* Scrollable content sits above fixed bg */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto', padding: 'clamp(24px,5vw,48px) clamp(20px,5vw,40px)' }}>

        {/* Back */}
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', padding: '8px 0', marginBottom: 28,
          WebkitTapHighlightColor: 'transparent',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>

        {/* Club header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 }}>
          {club.badgeUrl && (
            <BadgeImg club={club} size={72} />
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>{club.league}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(22px,5vw,34px)', color: '#fff', letterSpacing: 2, textTransform: 'uppercase', lineHeight: 1 }}>{club.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, marginTop: 6 }}>Est. {club.founded}</div>
          </div>
        </div>

        <Section label="Club History">
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, margin: 0 }}>{club.history}</p>
        </Section>

        <Section label="Stadium">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#fff', letterSpacing: 1 }}>{club.stadium}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                Capacity: {club.capacity?.toLocaleString() || '—'}
              </div>
            </div>
            <div style={{ fontSize: 36 }}>🏟️</div>
          </div>
        </Section>

        <Section label="Kits">
          <div style={{ display: 'flex', gap: 28, justifyContent: 'center' }}>
            <KitShirt color={club.kitHome} accent={club.kitAway} label="Home" />
            <KitShirt color={club.kitAway} accent={club.kitHome} label="Away" />
          </div>
        </Section>

        <Section label="Board Expectations">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(club.expectations || []).map((exp, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                  background: `${color}22`, border: `1px solid ${color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 10, color,
                }}>{i + 1}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, paddingTop: 2 }}>{exp}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section label="Squad Strength">
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
            {[['ATT', stats.att], ['MID', stats.mid], ['DEF', stats.def], ['OVR', stats.ovr]].map(([lbl, val], i, arr) => (
              <div key={lbl} style={{ flex: 1, textAlign: 'center', padding: '14px 0', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: lbl === 'OVR' ? color : '#fff', lineHeight: 1 }}>{val || '—'}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section label="Transfer Budget">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: '#4ade80', letterSpacing: 1 }}>{fmt(club.budget)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'right', lineHeight: 1.6 }}>Available for<br/>transfers</div>
          </div>
        </Section>

        <button onClick={onConfirm} style={{
          width: '100%', padding: '16px 0', marginTop: 8,
          background: '#4ade80', color: '#000', border: 'none', borderRadius: 8,
          fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700,
          letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(74,222,128,0.3)', transition: 'all 0.2s',
          WebkitTapHighlightColor: 'transparent',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#2ecc71'}
          onMouseLeave={e => e.currentTarget.style.background = '#4ade80'}
        >
          Advance as Manager →
        </button>

        {/* Bottom padding so button isn't clipped */}
        <div style={{ height: 40 }}/>
      </div>
    </div>
  );
}

/* ─── Team Select Modal ─── */
function TeamSelectModal({ allClubs, allPlayers, onSelect, onClose }) {
  const leagues = useMemo(() => [...new Set((allClubs || []).map(c => c.league).filter(Boolean))], [allClubs]);

  const [leagueIdx, setLeagueIdx]   = useState(0);
  const [clubIdx, setClubIdx]       = useState(0);
  const [cardKey, setCardKey]       = useState(0);
  const [detailClub, setDetailClub] = useState(null);

  const currentLeague = leagues[leagueIdx] || '';
  const clubsInLeague = useMemo(() => (allClubs || []).filter(c => c.league === currentLeague), [allClubs, currentLeague]);
  const currentClub   = clubsInLeague[clubIdx] || null;
  const country       = LEAGUE_COUNTRY[currentLeague] || { name: currentLeague, flag: '🌍' };
  const leagueLogo    = LEAGUE_LOGO[currentLeague] || null;
  const color         = currentClub?.color || '#888';
  const stars         = getStars(getStats(currentClub?.name, allPlayers).ovr);

  const prevLeague = () => { setLeagueIdx(i => (i - 1 + leagues.length) % leagues.length); setClubIdx(0); setCardKey(k => k+1); };
  const nextLeague = () => { setLeagueIdx(i => (i + 1) % leagues.length); setClubIdx(0); setCardKey(k => k+1); };
  const prevClub   = () => { setClubIdx(i => (i - 1 + clubsInLeague.length) % clubsInLeague.length); setCardKey(k => k+1); };
  const nextClub   = () => { setClubIdx(i => (i + 1) % clubsInLeague.length); setCardKey(k => k+1); };

  useEffect(() => {
    const handler = (e) => {
      if (detailClub) return;
      if (e.key === 'ArrowLeft')  prevClub();
      if (e.key === 'ArrowRight') nextClub();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clubsInLeague.length, detailClub]);

  if (detailClub) {
    return <ClubDetailModal club={detailClub} allPlayers={allPlayers} onConfirm={() => onSelect(detailClub)} onBack={() => setDetailClub(null)} />;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, overflowY: 'auto', animation: 'tsIn 0.3s ease' }}>
      <style>{`
        @keyframes tsIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes cardIn { from { opacity:0; transform:scale(0.92) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes bgFade { from { opacity:0 } to { opacity:0.07 } }
      `}</style>

      {/* Full-screen badge bg */}
      {currentClub?.badgeUrl && (
        <div key={`bg-${cardKey}`} style={{
          position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: `url(${currentClub.badgeUrl})`,
          backgroundSize: '55%', backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          animation: 'bgFade 0.4s ease forwards',
        }}/>
      )}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'rgba(4,6,10,0.93)', backdropFilter: 'blur(3px)' }}/>
      <div style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 50%, ${color}14 0%, transparent 65%)`, transition: 'background 0.4s' }}/>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 3, minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(80px,10vw,100px) clamp(16px,4vw,32px) clamp(32px,5vw,48px)',
        gap: 12,
      }}>

        {/* Close */}
        <button onClick={onClose} style={{
          position: 'fixed', top: 20, right: 20, zIndex: 10,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6, padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 7,
          color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
          transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Close
        </button>

        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* 1. Country card */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <ArrowBtn dir="left" onClick={prevLeague} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 26, lineHeight: 1, marginBottom: 5 }}>{country.flag}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 3, textTransform: 'uppercase', color: '#fff', lineHeight: 1 }}>{country.name}</div>
            </div>
            <ArrowBtn dir="right" onClick={nextLeague} />
          </div>

          {/* 2. Club card — name → badge → stars, no stats */}
          {currentClub ? (
            <div key={cardKey} style={{
              background: `linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)`,
              border: `1.5px solid ${color}55`,
              borderRadius: 16,
              padding: '28px 20px 24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              boxShadow: `0 0 60px ${color}20, 0 16px 48px rgba(0,0,0,0.5)`,
              animation: 'cardIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              position: 'relative', overflow: 'hidden',
            }}>

              {/* Side arrows */}
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
                <ArrowBtn dir="left" onClick={e => { e.stopPropagation(); prevClub(); }}/>
              </div>
              <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
                <ArrowBtn dir="right" onClick={e => { e.stopPropagation(); nextClub(); }}/>
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', padding: '0 44px' }}>

                {/* Club name */}
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 900,
                  fontSize: 'clamp(17px,5vw,24px)', letterSpacing: 2,
                  textTransform: 'uppercase', color: '#fff', textAlign: 'center',
                  lineHeight: 1.1, textShadow: `0 0 30px ${color}60`,
                }}>{currentClub.name}</div>

                {/* Badge — centered hero image with SVG fallback */}
                {currentClub.badgeUrl ? (
                  <BadgeImg club={currentClub} size={110} />
                ) : (
                  <ClubBadgeFallback club={currentClub} size={110} />
                )}

                {/* Stars */}
                <Stars count={stars}/>


              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: 40 }}>
              No clubs in this league
            </div>
          )}

          {/* 3. League card — centered, with league logo */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' }}>League</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#fff', letterSpacing: 1 }}>{currentLeague}</div>
            {leagueLogo && (
              <img
                src={leagueLogo}
                alt={currentLeague}
                style={{ height: 28, width: 'auto', objectFit: 'contain', opacity: 0.85 }}
                onError={e => e.target.style.display = 'none'}
              />
            )}
          </div>

          {/* Select Club button */}
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
        </div>
      </div>
    </div>
  );
}

/* ─── Main Home ─── */
export default function Home() {
  const { allClubs, allLeagues, allPlayers, chooseClub } = useGameStore();
  const navigate = useNavigate();

  const [slide, setSlide]                   = useState(0);
  const [loaded, setLoaded]                 = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [loaderDone, setLoaderDone]         = useState(false);
  const [showModal, setShowModal]           = useState(false);

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

      {/* Slideshow bg — hidden when modal open so it doesn't bleed through */}
      <div style={{ position:'fixed', inset:0, zIndex:0, display: showModal ? 'none' : 'block' }}>
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