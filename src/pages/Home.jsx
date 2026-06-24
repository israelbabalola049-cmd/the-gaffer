import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';

/* ─── Slideshow ─── */
const SLIDES = [
  { url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=85', pos: 'center center', motion: 'zoom-in' },
  { url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1920&q=85', pos: 'center 30%',   motion: 'pan-right' },
  { url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1920&q=85', pos: 'center center', motion: 'zoom-out' },
  { url: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=1920&q=85', pos: 'center 40%',   motion: 'pan-left' },
  { url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1920&q=85', pos: 'center center', motion: 'zoom-in' },
  { url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=85', pos: 'center 20%',   motion: 'pan-right' },
  { url: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1920&q=85', pos: 'center center', motion: 'zoom-out' },
  { url: 'https://images.unsplash.com/photo-1551958219-acbc0b81e5f5?w=1920&q=85', pos: 'center 35%',   motion: 'pan-left' },
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
  if (n >= 1e9) return `£${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `£${(n/1e6).toFixed(0)}M`;
  if (n >= 1e3) return `£${(n/1e3).toFixed(0)}K`;
  return `£${n}`;
};

const getStats = (clubName, allPlayers) => {
  const players = (allPlayers||[]).filter(p => p.club === clubName);
  if (!players.length) return { att:0, mid:0, def:0, ovr:0 };
  const avg = arr => arr.length ? Math.round(arr.reduce((s,p) => s+p.overall, 0)/arr.length) : 0;
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
    <div style={{ display:'flex', gap:5, justifyContent:'center' }}>
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

/* ─── Club Badge Fallback ─── */
function ClubBadgeFallback({ club, size=110 }) {
  const color = club?.color || '#888';
  const name  = club?.name  || '';
  const hash  = name.split('').reduce((a,c) => a+c.charCodeAt(0), 0);
  const style = hash % 5;
  const half  = size/2;
  const s     = size;
  const shields = [
    `M ${half} ${s*.06} L ${s*.92} ${s*.22} L ${s*.92} ${s*.58} Q ${s*.92} ${s*.82} ${half} ${s*.96} Q ${s*.08} ${s*.82} ${s*.08} ${s*.58} L ${s*.08} ${s*.22} Z`,
    `M ${s*.1} ${s*.28} Q ${s*.1} ${s*.08} ${half} ${s*.06} Q ${s*.9} ${s*.08} ${s*.9} ${s*.28} L ${s*.9} ${s*.62} Q ${s*.9} ${s*.84} ${half} ${s*.96} Q ${s*.1} ${s*.84} ${s*.1} ${s*.62} Z`,
    `M ${s*.1} ${s*.1} L ${s*.9} ${s*.1} L ${s*.9} ${s*.65} Q ${s*.9} ${s*.84} ${half} ${s*.96} Q ${s*.1} ${s*.84} ${s*.1} ${s*.65} Z`,
    `M ${half} ${s*.04} L ${s*.9} ${s*.26} L ${s*.9} ${s*.68} L ${half} ${s*.96} L ${s*.1} ${s*.68} L ${s*.1} ${s*.26} Z`,
    `M ${s*.1} ${s*.18} L ${s*.35} ${s*.06} L ${half} ${s*.14} L ${s*.65} ${s*.06} L ${s*.9} ${s*.18} L ${s*.9} ${s*.62} Q ${s*.9} ${s*.84} ${half} ${s*.96} Q ${s*.1} ${s*.84} ${s*.1} ${s*.62} Z`,
  ];
  const abbr = name.split(' ').map(w=>w[0]).join('').slice(0,3).toUpperCase();
  return (
    <svg width={size} height={size} viewBox={`0 0 ${s} ${s}`}>
      <defs>
        <linearGradient id={`fbg-${abbr}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.12"/>
        </linearGradient>
      </defs>
      <path d={shields[style]} fill={`url(#fbg-${abbr})`} stroke={color} strokeWidth={s*.025} strokeLinejoin="round"/>
      <path d={shields[style]} fill="none" stroke={color} strokeWidth={s*.012} strokeLinejoin="round" opacity="0.3"
        transform={`scale(0.82) translate(${s*.1} ${s*.1})`}/>
      <text x={half} y={half+s*.06} textAnchor="middle"
        fontFamily="'Barlow Condensed',sans-serif" fontWeight="900"
        fontSize={s*.22} fill={color} letterSpacing={s*.01}>{abbr}</text>
    </svg>
  );
}

/* ─── Badge with fallback ─── */
function BadgeImg({ club, size=110 }) {
  const [failed, setFailed] = useState(false);
  if (!club?.badgeUrl || failed) return <ClubBadgeFallback club={club} size={size}/>;
  return (
    <img src={club.badgeUrl} alt={club.name}
      style={{ width:size, height:size, objectFit:'contain' }}
      onError={() => setFailed(true)}
    />
  );
}

/* ─── Arrow — invisible until parent card is focused/hovered ─── */
function ArrowBtn({ dir, onClick, visible }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', padding: '8px',
      cursor: 'pointer', flexShrink: 0,
      color: visible ? 'rgba(255,255,255,0.85)' : 'transparent',
      transition: 'color 0.18s',
      WebkitTapHighlightColor: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: visible ? 'all' : 'none',
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left'
          ? <polyline points="15 18 9 12 15 6"/>
          : <polyline points="9 18 15 12 9 6"/>}
      </svg>
    </button>
  );
}

/* ─── Kit Shirt ─── */
function KitShirt({ color, accent, label }) {
  const c = color || '#333';
  const a = accent || '#fff';
  const id = `sh-${label}`;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <svg width="96" height="100" viewBox="0 0 200 210" fill="none">
        <defs>
          <filter id={id}>
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.45"/>
          </filter>
          <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.1"/>
            <stop offset="50%" stopColor="#fff" stopOpacity="0.03"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.08"/>
          </linearGradient>
        </defs>
        <path d="M 72 18 C 72 18 80 8 100 8 C 120 8 128 18 128 18 L 158 10 L 192 52 L 162 66 L 158 190 L 42 190 L 38 66 L 8 52 L 42 10 Z"
          fill={c} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinejoin="round" filter={`url(#${id})`}/>
        <path d="M 72 18 C 72 18 80 8 100 8 C 120 8 128 18 128 18 L 158 10 L 192 52 L 162 66 L 158 190 L 42 190 L 38 66 L 8 52 L 42 10 Z"
          fill={`url(#g-${id})`}/>
        <path d="M 82 20 L 100 44 L 118 20" fill="none" stroke={a} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
        <line x1="72" y1="18" x2="42" y2="10" stroke={a} strokeWidth="1.5" opacity="0.2"/>
        <line x1="128" y1="18" x2="158" y2="10" stroke={a} strokeWidth="1.5" opacity="0.2"/>
        <path d="M 10 48 L 38 62" stroke={a} strokeWidth="4" strokeLinecap="round" opacity="0.35"/>
        <path d="M 190 48 L 162 62" stroke={a} strokeWidth="4" strokeLinecap="round" opacity="0.35"/>
        <path d="M 42 184 L 158 184" stroke={a} strokeWidth="3" strokeLinecap="round" opacity="0.2"/>
      </svg>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:2, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:4, padding:'3px 10px' }}>{label}</span>
    </div>
  );
}

/* ─── Section ─── */
function Section({ label, children }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:3, textTransform:'uppercase', marginBottom:12, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{label}</div>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════
   UNIFIED MODAL — single mounted component,
   phase controls which content is shown
   phases: 'profile' | 'mode' | 'clubs' | 'detail'
   ════════════════════════════════════════════ */
const DAYS   = Array.from({length:31}, (_,i) => String(i+1).padStart(2,'0'));
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS  = Array.from({length:50}, (_,i) => String(2005-i));

function UnifiedModal({ isOpen, onClose, onComplete, allClubs, allPlayers }) {
  const [phase, setPhase]             = useState('profile');
  const [prevPhase, setPrevPhase]     = useState(null);
  const [animDir, setAnimDir]         = useState('forward'); // 'forward' | 'back'
  const [animKey, setAnimKey]         = useState(0);
  const [managerData, setManagerData] = useState(null);

  // Club selector state
  const leagues     = useMemo(() => [...new Set((allClubs||[]).map(c=>c.league).filter(Boolean))], [allClubs]);
  const [leagueIdx, setLeagueIdx] = useState(0);
  const [clubIdx, setClubIdx]     = useState(0);
  const [cardKey, setCardKey]     = useState(0);
  const [detailClub, setDetailClub] = useState(null);

  // Card hover state for arrow visibility
  const [countryHovered, setCountryHovered] = useState(false);
  const [clubHovered, setClubHovered]       = useState(false);
  const [leagueHovered, setLeagueHovered]   = useState(false);

  // Profile form state
  const [name, setName]   = useState('');
  const [day, setDay]     = useState('01');
  const [month, setMonth] = useState('Jan');
  const [year, setYear]   = useState('1990');
  const [err, setErr]     = useState('');

  const currentLeague = leagues[leagueIdx] || '';
  const clubsInLeague = useMemo(() => (allClubs||[]).filter(c=>c.league===currentLeague), [allClubs, currentLeague]);
  const currentClub   = clubsInLeague[clubIdx] || null;
  const country       = LEAGUE_COUNTRY[currentLeague] || { name: currentLeague, flag: '🌍' };
  const leagueLogo    = LEAGUE_LOGO[currentLeague] || null;
  const color         = currentClub?.color || '#888';
  const stats         = currentClub ? getStats(currentClub.name, allPlayers) : { att:0,mid:0,def:0,ovr:0 };
  const stars         = getStars(stats.ovr);

  // Reset to profile when modal opens
  useEffect(() => {
    if (isOpen) { setPhase('profile'); setAnimKey(k=>k+1); }
  }, [isOpen]);

  const goTo = (next, dir='forward') => {
    setAnimDir(dir);
    setPrevPhase(phase);
    setPhase(next);
    setAnimKey(k=>k+1);
  };

  const prevLeague = () => { setLeagueIdx(i=>(i-1+leagues.length)%leagues.length); setClubIdx(0); setCardKey(k=>k+1); };
  const nextLeague = () => { setLeagueIdx(i=>(i+1)%leagues.length); setClubIdx(0); setCardKey(k=>k+1); };
  const prevClub   = () => { setClubIdx(i=>(i-1+clubsInLeague.length)%clubsInLeague.length); setCardKey(k=>k+1); };
  const nextClub   = () => { setClubIdx(i=>(i+1)%clubsInLeague.length); setCardKey(k=>k+1); };

  useEffect(() => {
    if (!isOpen || phase !== 'clubs') return;
    const h = (e) => {
      if (e.key==='ArrowLeft')  prevClub();
      if (e.key==='ArrowRight') nextClub();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, phase, clubsInLeague.length]);

  if (!isOpen) return null;

  /* ── Phase: Profile ── */
  const renderProfile = () => (
    <div key={`phase-${animKey}`} style={{ width:'100%', maxWidth:420, animation:`phaseIn 0.3s ease` }}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:3, textTransform:'uppercase', marginBottom:8 }}>Step 1 of 3</div>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(24px,6vw,38px)', color:'#fff', letterSpacing:2, textTransform:'uppercase', lineHeight:1, marginBottom:8 }}>Manager Profile</div>
      <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:36, lineHeight:1.6 }}>Tell us who's taking the hot seat.</div>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>Full Name</div>
        <input className="mgr-input" placeholder="e.g. Alex Ferguson"
          value={name} onChange={e=>{ setName(e.target.value); setErr(''); }}
          onKeyDown={e=>e.key==='Enter' && handleProfileNext()}
          maxLength={40}
        />
      </div>
      <div style={{ marginBottom:32 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>Date of Birth</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr 1.2fr', gap:10 }}>
          <select className="mgr-select" value={day} onChange={e=>setDay(e.target.value)}>
            {DAYS.map(d=><option key={d}>{d}</option>)}
          </select>
          <select className="mgr-select" value={month} onChange={e=>setMonth(e.target.value)}>
            {MONTHS.map(m=><option key={m}>{m}</option>)}
          </select>
          <select className="mgr-select" value={year} onChange={e=>setYear(e.target.value)}>
            {YEARS.map(y=><option key={y}>{y}</option>)}
          </select>
        </div>
      </div>
      {err && <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'#ff3b5c', letterSpacing:1, marginBottom:16 }}>{err}</div>}
      <button onClick={handleProfileNext} className="mgr-btn-primary">Continue →</button>
    </div>
  );

  const handleProfileNext = () => {
    if (!name.trim()) { setErr('Enter your manager name.'); return; }
    if (name.trim().length < 2) { setErr('Name must be at least 2 characters.'); return; }
    setErr('');
    setManagerData({ name: name.trim(), dob: `${day} ${month} ${year}` });
    goTo('mode');
  };

  /* ── Phase: Career Mode ── */
  const renderMode = () => (
    <div key={`phase-${animKey}`} style={{ width:'100%', maxWidth:480, animation:'phaseIn 0.3s ease' }}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:3, textTransform:'uppercase', marginBottom:8 }}>Step 2 of 3</div>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(24px,6vw,38px)', color:'#fff', letterSpacing:2, textTransform:'uppercase', lineHeight:1, marginBottom:8 }}>Choose Your Path</div>
      <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:36, lineHeight:1.6 }}>How do you want to start your managerial career?</div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <button onClick={()=>goTo('clubs')} className="mgr-mode-btn mgr-mode-btn-active">
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:10 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'rgba(0,232,122,0.15)', border:'1px solid rgba(0,232,122,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e87a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:20, color:'#fff', letterSpacing:2, textTransform:'uppercase' }}>Take Charge</div>
          </div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.7, textAlign:'left' }}>Step into the dugout of an existing professional club. Choose your squad, set your tactics, and chase glory from day one.</div>
        </button>

        <button className="mgr-mode-btn mgr-mode-btn-disabled" style={{ cursor:'not-allowed', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:12, right:14, fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:2, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:4, padding:'3px 8px' }}>Coming Soon</div>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:10 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:20, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase' }}>Build From Scratch</div>
          </div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(255,255,255,0.25)', lineHeight:1.7, textAlign:'left' }}>Create your own club from the ground up. Name it, design it, register it in Division 3, and grind your way to the top.</div>
        </button>
      </div>
    </div>
  );

  /* ── Phase: Club Selector ── */
  const renderClubs = () => (
    <div key={`phase-${animKey}`} style={{ width:'100%', maxWidth:400, animation:'phaseIn 0.3s ease', display:'flex', flexDirection:'column', gap:12 }}>

      {/* Step indicator */}
      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:3, textTransform:'uppercase', marginBottom:4 }}>Step 3 of 3</div>

      {/* Country card */}
      <div
        style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:4, padding:'14px 4px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'default' }}
        onMouseEnter={()=>setCountryHovered(true)}
        onMouseLeave={()=>setCountryHovered(false)}
        onTouchStart={()=>setCountryHovered(true)}
        onTouchEnd={()=>setTimeout(()=>setCountryHovered(false),1200)}
      >
        <ArrowBtn dir="left" onClick={prevLeague} visible={countryHovered}/>
        <div style={{ textAlign:'center', flex:1 }}>
          <div style={{ fontSize:26, lineHeight:1, marginBottom:5 }}>{country.flag}</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:15, letterSpacing:3, textTransform:'uppercase', color:'#fff', lineHeight:1 }}>{country.name}</div>
        </div>
        <ArrowBtn dir="right" onClick={nextLeague} visible={countryHovered}/>
      </div>

      {/* Club card */}
      {currentClub ? (
        <div key={cardKey}
          style={{ background:`linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)`, border:`1.5px solid ${color}55`, borderRadius:4, padding:'28px 52px', display:'flex', flexDirection:'column', alignItems:'center', gap:14, boxShadow:`0 0 60px ${color}20, 0 16px 48px rgba(0,0,0,0.5)`, animation:'cardIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', position:'relative', overflow:'hidden' }}
          onMouseEnter={()=>setClubHovered(true)}
          onMouseLeave={()=>setClubHovered(false)}
          onTouchStart={()=>setClubHovered(true)}
          onTouchEnd={()=>setTimeout(()=>setClubHovered(false),1200)}
        >
          {/* Badge watermark background */}
          {currentClub.badgeUrl && (
            <img src={currentClub.badgeUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain', opacity:0.08, pointerEvents:'none', padding:24 }} onError={e=>e.target.style.display='none'}/>
          )}

          {/* Side arrows — visible on hover/touch */}
          <div style={{ position:'absolute', left:6, top:'50%', transform:'translateY(-50%)', zIndex:2 }}>
            <ArrowBtn dir="left" onClick={e=>{e.stopPropagation();prevClub();}} visible={clubHovered}/>
          </div>
          <div style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', zIndex:2 }}>
            <ArrowBtn dir="right" onClick={e=>{e.stopPropagation();nextClub();}} visible={clubHovered}/>
          </div>

          <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:12, width:'100%' }}>
            {/* Club name */}
            <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(16px,4vw,24px)', letterSpacing:2, textTransform:'uppercase', color:'#fff', textAlign:'center', lineHeight:1.1, textShadow:`0 0 30px ${color}60` }}>{currentClub.name}</div>
            {/* Badge — centered hero */}
            <BadgeImg club={currentClub} size={110}/>
            {/* Stars */}
            <Stars count={stars}/>
          </div>
        </div>
      ) : (
        <div style={{ textAlign:'center', color:'rgba(255,255,255,0.25)', fontFamily:'var(--font-mono)', fontSize:12, padding:40 }}>No clubs in this league</div>
      )}

      {/* League card */}
      <div
        style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:4, padding:'14px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}
        onMouseEnter={()=>setLeagueHovered(true)}
        onMouseLeave={()=>setLeagueHovered(false)}
        onTouchStart={()=>setLeagueHovered(true)}
        onTouchEnd={()=>setTimeout(()=>setLeagueHovered(false),1200)}
      >
        <div style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <ArrowBtn dir="left" onClick={prevLeague} visible={leagueHovered}/>
          <div style={{ textAlign:'center', flex:1 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>League</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:17, color:'#fff', letterSpacing:1 }}>{currentLeague}</div>
            {leagueLogo && (
              <img src={leagueLogo} alt={currentLeague}
                style={{ height:24, width:'auto', objectFit:'contain', margin:'6px auto 0', display:'block', opacity:0.8 }}
                onError={e=>e.target.style.display='none'}
              />
            )}
          </div>
          <ArrowBtn dir="right" onClick={nextLeague} visible={leagueHovered}/>
        </div>
      </div>

      {/* Select button */}
      {currentClub && (
        <button onClick={()=>{ setDetailClub(currentClub); setPhase('detail'); setAnimKey(k=>k+1); }} className="mgr-btn-primary">
          Select Club
        </button>
      )}
    </div>
  );

  /* ── Phase: Club Detail ── */
  const renderDetail = () => {
    if (!detailClub) return null;
    const dColor = detailClub.color || '#4ade80';
    const dStats = getStats(detailClub.name, allPlayers);
    return (
      <div key={`phase-${animKey}`} style={{ width:'100%', maxWidth:960, animation:'phaseIn 0.3s ease', height:'100%', display:'flex', flexDirection:'column' }}>

        {/* Badge bg */}
        {detailClub.badgeUrl && (
          <div style={{ position:'fixed', inset:0, zIndex:0, backgroundImage:`url(${detailClub.badgeUrl})`, backgroundSize:'40%', backgroundPosition:'center', backgroundRepeat:'no-repeat', opacity:0.04, pointerEvents:'none' }}/>
        )}
        <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', background:`radial-gradient(ellipse at 50% 40%, ${dColor}0d 0%, transparent 60%)` }}/>

        <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', height:'100%', gap:14 }}>

          {/* Club header */}
          <div style={{ display:'flex', alignItems:'center', gap:18, paddingBottom:14, borderBottom:`1px solid rgba(255,255,255,0.07)`, flexShrink:0 }}>
            <BadgeImg club={detailClub} size={56}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.28)', letterSpacing:3, textTransform:'uppercase', marginBottom:4 }}>{detailClub.league} · Est. {detailClub.founded}</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(20px,3vw,32px)', color:'#fff', letterSpacing:3, textTransform:'uppercase', lineHeight:1 }}>{detailClub.name}</div>
            </div>
            {/* Squad stats */}
            <div style={{ display:'flex', gap:0, flexShrink:0, border:'1px solid rgba(255,255,255,0.08)' }}>
              {[['ATT',dStats.att],['MID',dStats.mid],['DEF',dStats.def],['OVR',dStats.ovr]].map(([lbl,val],i,arr) => (
                <div key={lbl} style={{ textAlign:'center', padding:'8px 16px', background: lbl==='OVR' ? `${dColor}11` : 'rgba(255,255,255,0.03)', borderRight: i<arr.length-1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:lbl==='OVR'?dColor:'#fff', lineHeight:1 }}>{val||'—'}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginTop:4 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-column body */}
          <div style={{ display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:14, flex:1, minHeight:0 }}>

            {/* Left column */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, minHeight:0 }}>

              {/* History */}
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:4, padding:'14px 18px', flex:1, minHeight:0, overflow:'hidden', position:'relative' }}>
                <div style={{ position:'absolute', top:0, left:0, width:2, height:'100%', background:dColor, opacity:0.6 }}/>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.28)', letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>Club History</div>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.8, margin:0, fontWeight:300 }}>{detailClub.history}</p>
              </div>

              {/* Stadium + Budget side by side */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, flexShrink:0 }}>
                <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:4, padding:'14px 18px' }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.28)', letterSpacing:3, textTransform:'uppercase', marginBottom:8 }}>Stadium</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'#fff', letterSpacing:1, lineHeight:1.2 }}>{detailClub.stadium}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:5 }}>{detailClub.capacity?.toLocaleString() || '—'} cap.</div>
                </div>
                <div style={{ background:`${dColor}08`, border:`1px solid ${dColor}22`, borderRadius:4, padding:'14px 18px' }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.28)', letterSpacing:3, textTransform:'uppercase', marginBottom:8 }}>Budget</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, color:dColor, lineHeight:1 }}>{fmt(detailClub.budget)}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:5 }}>to spend</div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, minHeight:0 }}>

              {/* Kits */}
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:4, padding:'14px 18px', flexShrink:0 }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.28)', letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>Kits</div>
                <div style={{ display:'flex', gap:20, justifyContent:'center' }}>
                  <KitShirt color={detailClub.kitHome} accent={detailClub.kitAway} label="Home"/>
                  <KitShirt color={detailClub.kitAway} accent={detailClub.kitHome} label="Away"/>
                </div>
              </div>

              {/* Board Expectations */}
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:4, padding:'14px 18px', flex:1, minHeight:0, overflow:'hidden' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.28)', letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>Board Expectations</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {(detailClub.expectations||[]).map((exp,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:dColor, flexShrink:0, marginTop:2, letterSpacing:1 }}>0{i+1}</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.5 }}>{exp}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button onClick={()=>onComplete(detailClub, managerData)} className="mgr-btn-primary" style={{ flexShrink:0, borderRadius:4 }}>
            Advance as Manager →
          </button>
        </div>
      </div>
    );
  };

  /* ── Nav helpers ── */
  const canGoBack = phase !== 'profile';
  const handleBack = () => {
    if (phase === 'mode')   goTo('profile', 'back');
    if (phase === 'clubs')  goTo('mode', 'back');
    if (phase === 'detail') { setDetailClub(null); goTo('clubs', 'back'); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500 }}>
      {/* ── Backdrop ── */}
      <div style={{ position:'absolute', inset:0, background:'rgba(4,6,10,0.97)', backdropFilter:'blur(10px)' }}/>

      {/* ── No full-screen badge bg — each phase manages its own ── */}

      {/* ── Top bar: close only ── */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'18px 20px' }}>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:2, textTransform:'uppercase', WebkitTapHighlightColor:'transparent' }}
          onMouseEnter={e=>e.currentTarget.style.color='#fff'}
          onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.35)'}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Close
        </button>
      </div>

      {/* ── Phase content ── */}
      <div style={{ position:'relative', zIndex:5, width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent: phase==='detail' ? 'flex-start' : 'center', padding: phase==='detail' ? 'clamp(56px,8vw,72px) clamp(40px,7vw,100px) clamp(16px,2vh,24px)' : 'clamp(60px,10vw,80px) clamp(16px,4vw,32px)', overflowY: 'hidden' }}>
        {phase === 'profile' && renderProfile()}
        {phase === 'mode'    && renderMode()}
        {phase === 'clubs'   && renderClubs()}
        {phase === 'detail'  && renderDetail()}
      </div>
    </div>
  );
}

/* ─── Rotating hero headlines ─── */
const HEADLINES = [
  { top: 'READY TO', mid: 'TAKE ON', hot: 'THE HOT', bot: 'SEAT?' },
  { top: 'BUILD YOUR', mid: 'DYNASTY.', hot: 'WRITE', bot: 'HISTORY.' },
  { top: 'THE BOARD', mid: 'IS WATCHING.', hot: 'DELIVER', bot: 'OR LEAVE.' },
  { top: 'EVERY WEEK', mid: 'MATTERS.', hot: 'LEAD FROM', bot: 'THE FRONT.' },
];

/* ─── Main Home ─── */
export default function Home() {
  const { allClubs, allPlayers, chooseClub, setManagerProfile } = useGameStore();
  const navigate = useNavigate();

  const [slide, setSlide]                   = useState(0);
  const [loaded, setLoaded]                 = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [loaderDone, setLoaderDone]         = useState(false);
  const [modalOpen, setModalOpen]           = useState(false);
  const [howToPlay, setHowToPlay]           = useState(false);
  const [headlineIdx, setHeadlineIdx]       = useState(0);
  const [headlineVisible, setHeadlineVisible] = useState(true);
  const [isPortrait, setIsPortrait]         = useState(false);
  const [viewportHeight, setViewportHeight] = useState(null);

  /* Loader */
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

  /* Slideshow */
  useEffect(() => {
    if (!loaded) return;
    const t = setInterval(() => setSlide(s => (s+1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [loaded]);

  /* Portrait detection + real visible viewport height
     (vh/dvh alone don't reliably reflect mobile browser chrome —
     address bar, toolbars — especially mid-rotation on iOS Safari) */
  useEffect(() => {
    const check = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      const h = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(h);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    window.visualViewport?.addEventListener('resize', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
      window.visualViewport?.removeEventListener('resize', check);
    };
  }, []);

  /* Headline rotation */
  useEffect(() => {
    if (!loaded) return;
    const t = setInterval(() => {
      setHeadlineVisible(false);
      setTimeout(() => {
        setHeadlineIdx(i => (i + 1) % HEADLINES.length);
        setHeadlineVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(t);
  }, [loaded]);

  /* Body scroll lock */
  useEffect(() => {
    document.body.style.overflow = (modalOpen || howToPlay) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen, howToPlay]);

  const handleComplete = (club, managerData) => {
    chooseClub(club);
    if (setManagerProfile && managerData) setManagerProfile(managerData);
    setModalOpen(false);
    navigate('/home');
  };

  return (
    <>
      <style>{`
        @keyframes slideUp  { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes phaseIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bgFade   { from{opacity:0} to{opacity:0.07} }
        @keyframes cardIn   { from{opacity:0;transform:scale(0.92) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes tagFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        /* Ken Burns motion variants */
        @keyframes kb-zoom-in   { from{transform:scale(1) translate(0,0)}       to{transform:scale(1.12) translate(-1.5%,-1%)} }
        @keyframes kb-zoom-out  { from{transform:scale(1.12) translate(0,0)}    to{transform:scale(1) translate(1%,0.5%)} }
        @keyframes kb-pan-right { from{transform:scale(1.08) translate(-3%,0)}  to{transform:scale(1.08) translate(0%,0)} }
        @keyframes kb-pan-left  { from{transform:scale(1.08) translate(0%,-1%)} to{transform:scale(1.08) translate(-3%,0)} }

        .ts-slide-bg { position:absolute; inset:0; opacity:0; transition:opacity 2s ease; overflow:hidden; }
        .ts-slide-bg.active { opacity:1; }
        .kb-inner { position:absolute; inset:-6%; background-size:cover; will-change:transform; }
        .ts-slide-bg.active .kb-inner.motion-zoom-in   { animation:kb-zoom-in   7s ease-in-out forwards; }
        .ts-slide-bg.active .kb-inner.motion-zoom-out  { animation:kb-zoom-out  7s ease-in-out forwards; }
        .ts-slide-bg.active .kb-inner.motion-pan-right { animation:kb-pan-right 7s ease-in-out forwards; }
        .ts-slide-bg.active .kb-inner.motion-pan-left  { animation:kb-pan-left  7s ease-in-out forwards; }

        .hero-h1    { opacity:0; animation:slideUp 0.9s 0.1s both ease; }
        .hero-sub   { opacity:0; animation:slideUp 0.7s 0.35s both ease; }
        .hero-btns  { opacity:0; animation:slideUp 0.7s 0.55s both ease; }
        .hero-stats { opacity:0; animation:fadeIn  0.8s 0.8s both ease; }

        .ts-start-btn:hover { background:#2ecc71 !important; box-shadow:0 4px 28px rgba(74,222,128,0.4) !important; }
        .ts-start-btn:active { transform:scale(0.97); }
        .ts-howto-btn:hover { color:rgba(255,255,255,0.75) !important; border-color:rgba(255,255,255,0.35) !important; }

        .tagline-text {
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .tagline-text.visible { opacity:1; transform:translateY(0); }
        .tagline-text.hidden  { opacity:0; transform:translateY(6px); }

        /* Modal shared styles */
        .mgr-input {
          background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.12);
          border-radius:4px; padding:14px 16px; color:#fff;
          font-family:'Barlow',sans-serif; font-size:15px; width:100%;
          outline:none; transition:border-color 0.2s; box-sizing:border-box;
        }
        .mgr-input:focus { border-color:rgba(0,232,122,0.6); }
        .mgr-input::placeholder { color:rgba(255,255,255,0.2); }
        .mgr-select {
          background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.12);
          border-radius:4px; padding:12px 10px; color:#fff;
          font-family:'Barlow Condensed',sans-serif; font-size:15px;
          outline:none; cursor:pointer; transition:border-color 0.2s;
          appearance:none; -webkit-appearance:none; text-align:center;
        }
        .mgr-select:focus { border-color:rgba(0,232,122,0.6); }
        .mgr-select option { background:#0f1318; }
        .mgr-btn-primary {
          width:100%; padding:14px 0; background:#4ade80; color:#000;
          border:none; border-radius:4px; font-family:'Barlow Condensed',sans-serif;
          font-size:15px; font-weight:700; letter-spacing:3px; text-transform:uppercase;
          cursor:pointer; box-shadow:0 4px 20px rgba(74,222,128,0.25);
          transition:all 0.2s; -webkit-tap-highlight-color:transparent; display:block;
        }
        .mgr-btn-primary:hover { background:#2ecc71; }
        .mgr-mode-btn {
          background:rgba(255,255,255,0.05); border-radius:4px;
          padding:24px 28px; text-align:left; width:100%;
          transition:all 0.2s; -webkit-tap-highlight-color:transparent;
        }
        .mgr-mode-btn-active { border:1.5px solid rgba(0,232,122,0.4); cursor:pointer; }
        .mgr-mode-btn-active:hover { background:rgba(0,232,122,0.08); border-color:rgba(0,232,122,0.7); }
        .mgr-mode-btn-disabled { border:1.5px solid rgba(255,255,255,0.1); }

        /* How to Play modal */
        .htp-section { margin-bottom:32px; }
        .htp-section-title {
          font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700;
          letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.3);
          margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.06);
        }
        .htp-step {
          display:flex; gap:14px; margin-bottom:14px; align-items:flex-start;
        }
        .htp-step-num {
          width:26px; height:26px; border-radius:6px; background:rgba(74,222,128,0.12);
          border:1px solid rgba(74,222,128,0.3); display:flex; align-items:center;
          justify-content:center; font-family:'Share Tech Mono',monospace; font-size:11px;
          color:#4ade80; flex-shrink:0; margin-top:1px;
        }
        .htp-step-text { font-size:14px; color:rgba(255,255,255,0.65); line-height:1.65; }
        .htp-step-text strong { color:rgba(255,255,255,0.9); font-weight:600; }
        .htp-pill {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12);
          border-radius:6px; padding:4px 10px;
          font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700;
          letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.6);
          margin:3px 4px 3px 0;
        }
        .htp-accent { color:#4ade80; }
      `}</style>

      {/* Portrait overlay — mobile only */}
      {isPortrait && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#060a06', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:32 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2"/>
            <path d="M12 18h.01"/>
          </svg>
          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, letterSpacing:4, color:'#fff', textTransform:'uppercase', textAlign:'center' }}>Rotate Your Device</div>
          <div style={{ fontFamily:'Barlow, sans-serif', fontSize:14, color:'rgba(255,255,255,0.4)', textAlign:'center', lineHeight:1.7, maxWidth:260 }}>
            The Gaffer is best experienced in landscape mode. Please rotate your screen to continue.
          </div>
        </div>
      )}

      {/* Loader */}
      <div style={{ position:'fixed', inset:0, zIndex:9998, background:'#060a06', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, opacity:loaderDone?0:1, transition:'opacity 0.5s ease', pointerEvents:loaderDone?'none':'all' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(26px,7vw,46px)', letterSpacing:8, color:'#4ade80', textTransform:'uppercase' }}>THE GAFFER</div>
        <div style={{ width:'clamp(180px,48vw,260px)', height:2, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${loaderProgress}%`, background:'#4ade80', transition:'width 0.15s linear', borderRadius:2 }}/>
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:3, color:'rgba(255,255,255,0.25)', textTransform:'uppercase' }}>{loaderProgress}%</div>
      </div>

      {/* Slideshow bg */}
      <div style={{ position:'fixed', inset:0, zIndex:0, display: modalOpen ? 'none' : 'block' }}>
        {SLIDES.map((s, i) => (
          <div key={i} className={`ts-slide-bg ${i===slide?'active':''}`}>
            <div className={`kb-inner motion-${s.motion}`}
              style={{ backgroundImage:`url(${s.url})`, backgroundPosition:s.pos }}/>
          </div>
        ))}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(4,6,10,0.97) 0%, rgba(4,6,10,0.82) 50%, rgba(4,6,10,0.35) 100%)' }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(4,6,10,0.98) 0%, rgba(4,6,10,0.4) 30%, transparent 60%)' }}/>
      </div>

      {/* Hero — sized to the REAL visible viewport (accounts for mobile browser
          chrome), scrolls as a fallback if anything still doesn't fit */}
      <div style={{
        position:'relative', zIndex:1,
        width:'100vw', height: viewportHeight ? `${viewportHeight}px` : '100dvh',
        display:'flex', flexDirection:'column',
        opacity: loaded ? 1 : 0, transition:'opacity 0.5s ease',
        overflowY:'auto', overflowX:'hidden',
      }}>
        {/* Main content — fills remaining space */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
          paddingTop:'clamp(24px,5vh,60px)',
          paddingBottom:'clamp(16px,3vh,32px)',
          paddingLeft:'max(clamp(24px,8vw,80px), env(safe-area-inset-left))',
          paddingRight:'max(clamp(24px,8vw,80px), env(safe-area-inset-right))',
        }}>
          <div style={{ maxWidth:620 }}>
            <h1 className="hero-h1" style={{
              fontFamily:'var(--font-display)', fontWeight:900,
              fontSize:'clamp(26px, min(8vw, 11vh), 100px)',
              letterSpacing:'clamp(1px,0.3vw,3px)', lineHeight:0.88,
              color:'#fff', marginBottom:'clamp(10px,3vh,28px)', textTransform:'uppercase',
              transition:'opacity 0.4s ease, transform 0.4s ease',
              opacity: headlineVisible ? 1 : 0,
              transform: headlineVisible ? 'translateY(0)' : 'translateY(8px)',
            }}>
              {HEADLINES[headlineIdx].top}<br/>
              {HEADLINES[headlineIdx].mid}<br/>
              <span style={{ color:'#4ade80', textShadow:'0 0 40px rgba(74,222,128,0.5)' }}>
                {HEADLINES[headlineIdx].hot}
              </span><br/>
              {HEADLINES[headlineIdx].bot}
            </h1>

            {/* Static tagline */}
            <p className="hero-sub" style={{
              fontSize:'clamp(12px,2vw,15px)', color:'rgba(255,255,255,0.45)',
              lineHeight:1.7, fontWeight:300, maxWidth:380, margin:0,
              marginBottom:'clamp(10px,3vh,36px)',
            }}>
              Build a dynasty. Dominate the league. Prove you've got what it takes.
            </p>

            <div className="hero-btns" style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button className="ts-start-btn" onClick={()=>setModalOpen(true)} style={{ background:'#4ade80', color:'#000', border:'none', borderRadius:6, fontFamily:'var(--font-display)', fontSize:'clamp(12px,2vw,14px)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', padding:'clamp(10px,2vh,14px) clamp(20px,3vw,32px)', cursor:'pointer', boxShadow:'0 4px 20px rgba(74,222,128,0.25)', transition:'all 0.2s', display:'flex', alignItems:'center', gap:8, WebkitTapHighlightColor:'transparent' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Start Career
              </button>
              <button className="ts-howto-btn" onClick={()=>setHowToPlay(true)} style={{ background:'transparent', color:'rgba(255,255,255,0.45)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, fontFamily:'var(--font-display)', fontSize:'clamp(12px,2vw,14px)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', padding:'clamp(10px,2vh,14px) clamp(20px,3vw,32px)', cursor:'pointer', transition:'all 0.2s', WebkitTapHighlightColor:'transparent' }}>
                How to Play
              </button>
            </div>
          </div>
        </div>

        {/* Stats strip — pinned to bottom */}
        <div className="hero-stats" style={{
          display:'flex', gap:'clamp(20px,5vw,64px)',
          paddingTop:'clamp(8px,2vh,24px)',
          paddingBottom:'clamp(8px,2vh,24px)',
          paddingLeft:'max(clamp(24px,8vw,80px), env(safe-area-inset-left))',
          paddingRight:'max(clamp(24px,8vw,80px), env(safe-area-inset-right))',
          borderTop:'1px solid rgba(255,255,255,0.06)',
          background:'rgba(4,6,10,0.6)', backdropFilter:'blur(8px)',
          flexShrink:0,
        }}>
          {[['18','Top Clubs'],['6','Leagues'],['100+','Real Players']].map(([val,label])=>(
            <div key={label}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(16px, min(4vw, 4.5vh), 30px)', color:'#4ade80', lineHeight:1 }}>{val}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'clamp(8px,1.2vw,10px)', color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How to Play modal */}
      {howToPlay && (
        <div style={{ position:'fixed', inset:0, zIndex:600, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(4,6,10,0.96)', backdropFilter:'blur(12px)' }} onClick={()=>setHowToPlay(false)}/>
          <div style={{
            position:'relative', zIndex:1, width:'100%', maxWidth:600,
            maxHeight:'88dvh', overflowY:'auto', margin:'0 16px',
            background:'rgba(12,16,24,0.95)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:4, padding:'clamp(24px,4vw,40px)',
          }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
              <div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:3, textTransform:'uppercase', marginBottom:6 }}>The Gaffer</div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(22px,5vw,32px)', color:'#fff', letterSpacing:2, textTransform:'uppercase', lineHeight:1 }}>How to Play</div>
              </div>
              <button onClick={()=>setHowToPlay(false)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:4, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.5)', flexShrink:0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Intro */}
            <div style={{ background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:4, padding:'16px 20px', marginBottom:32 }}>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.65)', lineHeight:1.75, margin:0 }}>
                You are the manager. Every decision — from squad selection to transfer strategy — is yours. Build a winning culture, satisfy the board, and leave your mark on the game.
              </p>
            </div>

            {/* Getting Started */}
            <div className="htp-section">
              <div className="htp-section-title">Getting Started</div>
              <div className="htp-step">
                <div className="htp-step-num">1</div>
                <div className="htp-step-text"><strong>Create your manager.</strong> Set your name and date of birth — this is your identity throughout the save.</div>
              </div>
              <div className="htp-step">
                <div className="htp-step-num">2</div>
                <div className="htp-step-text"><strong>Choose a club.</strong> Browse clubs across 6 major leagues. Each club comes with a real squad, a budget, and board expectations. Pick your challenge.</div>
              </div>
              <div className="htp-step">
                <div className="htp-step-num">3</div>
                <div className="htp-step-text"><strong>Review the dossier.</strong> Before confirming, study the club's squad strength, stadium, kits, and transfer budget. Know what you're walking into.</div>
              </div>
            </div>

            {/* The Interface */}
            <div className="htp-section">
              <div className="htp-section-title">The Interface</div>
              <div className="htp-step">
                <div className="htp-step-num" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.5)' }}>⚽</div>
                <div className="htp-step-text">
                  Navigate between five sections using the top tabs:
                  <div style={{ display:'flex', flexWrap:'wrap', marginTop:10 }}>
                    {[['Home','Dashboard & fixtures'],['Team','Squad & tactics'],['Transfers','Buy & sell players'],['Competitions','League table & results'],['Manager','Your profile & stats']].map(([tab, desc]) => (
                      <div key={tab} style={{ marginBottom:8, marginRight:8 }}>
                        <span className="htp-pill">{tab}</span>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Matchday */}
            <div className="htp-section">
              <div className="htp-section-title">Matchday</div>
              <div className="htp-step">
                <div className="htp-step-num">1</div>
                <div className="htp-step-text"><strong>Pre-match team talk.</strong> Set the tone in the dressing room. Your words affect player morale and performance — choose wisely based on the occasion.</div>
              </div>
              <div className="htp-step">
                <div className="htp-step-num">2</div>
                <div className="htp-step-text"><strong>Live simulation.</strong> Watch the match unfold in real time. Key moments, goals, and cards are generated dynamically based on your squad quality and tactics.</div>
              </div>
              <div className="htp-step">
                <div className="htp-step-num">3</div>
                <div className="htp-step-text"><strong>Post-match report.</strong> Review what happened, how players rated, and what the result means for your standing with the board.</div>
              </div>
            </div>

            {/* Transfers */}
            <div className="htp-section">
              <div className="htp-section-title">Transfers & Squad Management</div>
              <div className="htp-step">
                <div className="htp-step-num" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.5)' }}>£</div>
                <div className="htp-step-text">Use the <strong>Transfers</strong> section to scout players, make bids, and manage your shortlist. Your budget is finite — spend it wisely. The Youth Academy produces talent over time, so don't neglect it.</div>
              </div>
            </div>

            {/* Tips */}
            <div className="htp-section" style={{ marginBottom:0 }}>
              <div className="htp-section-title">Tips from the Dugout</div>
              {[
                'Check board expectations before every transfer window — signing the wrong player can cost you your job.',
                "A strong defensive line wins you points you'd otherwise draw or lose. Midfield creativity wins you the ones you'd otherwise draw.",
                'Your manager rating reflects recent results. A bad run will have the board calling.',
              ].map((tip, i) => (
                <div key={i} className="htp-step">
                  <div className="htp-step-num" style={{ background:'rgba(245,197,24,0.1)', border:'1px solid rgba(245,197,24,0.25)', color:'#f5c518' }}>→</div>
                  <div className="htp-step-text">{tip}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Career modal */}
      <UnifiedModal
        isOpen={modalOpen}
        onClose={()=>setModalOpen(false)}
        onComplete={handleComplete}
        allClubs={allClubs||[]}
        allPlayers={allPlayers||[]}
      />
    </>
  );
}