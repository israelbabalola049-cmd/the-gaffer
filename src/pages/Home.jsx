import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';

/* ─── Slideshow images ─── */
const SLIDES = [
  { url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=85', pos: 'center center' },
  { url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1920&q=85', pos: 'center 30%' },
  { url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1920&q=85', pos: 'center center' },
  { url: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=1920&q=85', pos: 'center 40%' },
  { url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1920&q=85', pos: 'center center' },
  { url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=85', pos: 'center 20%' },
  { url: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1920&q=85', pos: 'center center' },
  { url: 'https://images.unsplash.com/photo-1551958219-acbc0b81e5f5?w=1920&q=85', pos: 'center 35%' },
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
function ClubBadgeFallback({ club, size = 110 }) {
  const color = club?.color || '#888';
  const name  = club?.name  || '';
  const hash  = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const style = hash % 5;
  const half  = size / 2;
  const s     = size;
  const shields = [
    `M ${half} ${s*.06} L ${s*.92} ${s*.22} L ${s*.92} ${s*.58} Q ${s*.92} ${s*.82} ${half} ${s*.96} Q ${s*.08} ${s*.82} ${s*.08} ${s*.58} L ${s*.08} ${s*.22} Z`,
    `M ${s*.1} ${s*.28} Q ${s*.1} ${s*.08} ${half} ${s*.06} Q ${s*.9} ${s*.08} ${s*.9} ${s*.28} L ${s*.9} ${s*.62} Q ${s*.9} ${s*.84} ${half} ${s*.96} Q ${s*.1} ${s*.84} ${s*.1} ${s*.62} Z`,
    `M ${s*.1} ${s*.1} L ${s*.9} ${s*.1} L ${s*.9} ${s*.65} Q ${s*.9} ${s*.84} ${half} ${s*.96} Q ${s*.1} ${s*.84} ${s*.1} ${s*.65} Z`,
    `M ${half} ${s*.04} L ${s*.9} ${s*.26} L ${s*.9} ${s*.68} L ${half} ${s*.96} L ${s*.1} ${s*.68} L ${s*.1} ${s*.26} Z`,
    `M ${s*.1} ${s*.18} L ${s*.35} ${s*.06} L ${half} ${s*.14} L ${s*.65} ${s*.06} L ${s*.9} ${s*.18} L ${s*.9} ${s*.62} Q ${s*.9} ${s*.84} ${half} ${s*.96} Q ${s*.1} ${s*.84} ${s*.1} ${s*.62} Z`,
  ];
  const abbr = name.split(' ').map(w => w[0]).join('').slice(0,3).toUpperCase();
  return (
    <svg width={size} height={size} viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
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
        fontFamily="'Barlow Condensed', sans-serif" fontWeight="900"
        fontSize={s*.22} fill={color} letterSpacing={s*.01}>{abbr}</text>
    </svg>
  );
}

/* ─── Badge with fallback ─── */
function BadgeImg({ club, size = 110 }) {
  const [failed, setFailed] = useState(false);
  if (!club?.badgeUrl || failed) return <ClubBadgeFallback club={club} size={size} />;
  return (
    <img src={club.badgeUrl} alt={club.name}
      style={{ width: size, height: size, objectFit: 'contain' }}
      onError={() => setFailed(true)}
    />
  );
}

/* ─── Bare arrow — no box, invisible until hover ─── */
function ArrowBtn({ dir, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none', border: 'none', padding: '8px',
        cursor: 'pointer', flexShrink: 0,
        color: hovered ? '#fff' : 'transparent',
        transition: 'color 0.18s',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <svg width="72" height="72" viewBox="0 0 100 100">
        <path d="M30 20 L10 40 L25 45 L25 85 L75 85 L75 45 L90 40 L70 20 L60 28 Q50 34 40 28 Z" fill={c} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
        <path d="M40 28 Q50 38 60 28" fill="none" stroke={a} strokeWidth="2"/>
        <line x1="10" y1="40" x2="25" y2="45" stroke={a} strokeWidth="1" opacity="0.4"/>
        <line x1="90" y1="40" x2="75" y2="45" stroke={a} strokeWidth="1" opacity="0.4"/>
      </svg>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:1 }}>{label}</span>
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

/* ─── Club Detail Modal ─── */
function ClubDetailModal({ club, allPlayers, onConfirm, onBack }) {
  const stats = getStats(club.name, allPlayers);
  const color = club.color || '#4ade80';
  return (
    <div style={{ position:'fixed', inset:0, zIndex:700, background:'rgba(4,6,10,0.98)', backdropFilter:'blur(24px)', overflowY:'auto', animation:'detailIn 0.3s ease' }}>
      <style>{`@keyframes detailIn { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>
      {club.badgeUrl && (
        <div style={{ position:'fixed', inset:0, zIndex:0, backgroundImage:`url(${club.badgeUrl})`, backgroundSize:'55%', backgroundPosition:'center', backgroundRepeat:'no-repeat', opacity:0.04, pointerEvents:'none' }}/>
      )}
      <div style={{ position:'relative', zIndex:1, maxWidth:640, margin:'0 auto', padding:'clamp(24px,5vw,48px) clamp(20px,5vw,40px)' }}>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:2, textTransform:'uppercase', cursor:'pointer', padding:'8px 0', marginBottom:28, WebkitTapHighlightColor:'transparent' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:36 }}>
          <BadgeImg club={club} size={72}/>
          <div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:3, textTransform:'uppercase', marginBottom:6 }}>{club.league}</div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(22px,5vw,34px)', color:'#fff', letterSpacing:2, textTransform:'uppercase', lineHeight:1 }}>{club.name}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color, marginTop:6 }}>Est. {club.founded}</div>
          </div>
        </div>
        <Section label="Club History">
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.8, margin:0 }}>{club.history}</p>
        </Section>
        <Section label="Stadium">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'#fff', letterSpacing:1 }}>{club.stadium}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>Capacity: {club.capacity?.toLocaleString() || '—'}</div>
            </div>
            <div style={{ fontSize:36 }}>🏟</div>
          </div>
        </Section>
        <Section label="Kits">
          <div style={{ display:'flex', gap:36 }}>
            <KitShirt color={club.kitHome} accent={club.kitAway} label="Home"/>
            <KitShirt color={club.kitAway} accent={club.kitHome} label="Away"/>
          </div>
        </Section>
        <Section label="Board Expectations">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {(club.expectations || []).map((exp, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:22, height:22, borderRadius:4, flexShrink:0, background:`${color}22`, border:`1px solid ${color}55`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:10, color }}>{i+1}</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.5, paddingTop:2 }}>{exp}</div>
              </div>
            ))}
          </div>
        </Section>
        <Section label="Squad Strength">
          <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, overflow:'hidden' }}>
            {[['ATT',stats.att],['MID',stats.mid],['DEF',stats.def],['OVR',stats.ovr]].map(([lbl,val],i,arr) => (
              <div key={lbl} style={{ flex:1, textAlign:'center', padding:'14px 0', borderRight: i<arr.length-1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:26, color: lbl==='OVR' ? color : '#fff', lineHeight:1 }}>{val||'—'}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:2, textTransform:'uppercase', marginTop:4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </Section>
        <Section label="Transfer Budget">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:36, color:'#4ade80', letterSpacing:1 }}>{fmt(club.budget)}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'right', lineHeight:1.6 }}>Available for<br/>transfers</div>
          </div>
        </Section>
        <button onClick={onConfirm} style={{ width:'100%', padding:'16px 0', marginTop:8, background:'#4ade80', color:'#000', border:'none', borderRadius:8, fontFamily:'var(--font-display)', fontSize:17, fontWeight:700, letterSpacing:3, textTransform:'uppercase', cursor:'pointer', boxShadow:'0 4px 24px rgba(74,222,128,0.3)', transition:'all 0.2s', WebkitTapHighlightColor:'transparent' }}
          onMouseEnter={e => e.currentTarget.style.background='#2ecc71'}
          onMouseLeave={e => e.currentTarget.style.background='#4ade80'}
        >
          Advance as Manager →
        </button>
      </div>
    </div>
  );
}

/* ─── MODAL 3: Club Selector ─── */
function TeamSelectModal({ allClubs, allPlayers, onSelect, onBack }) {
  const leagues     = useMemo(() => [...new Set((allClubs||[]).map(c=>c.league).filter(Boolean))],[allClubs]);
  const [leagueIdx, setLeagueIdx]   = useState(0);
  const [clubIdx, setClubIdx]       = useState(0);
  const [cardKey, setCardKey]       = useState(0);
  const [detailClub, setDetailClub] = useState(null);

  const currentLeague = leagues[leagueIdx] || '';
  const clubsInLeague = useMemo(() => (allClubs||[]).filter(c=>c.league===currentLeague),[allClubs,currentLeague]);
  const currentClub   = clubsInLeague[clubIdx] || null;
  const country       = LEAGUE_COUNTRY[currentLeague] || { name: currentLeague, flag: '🌍' };
  const color         = currentClub?.color || '#888';
  const stats         = currentClub ? getStats(currentClub.name, allPlayers) : { att:0,mid:0,def:0,ovr:0 };
  const stars         = getStars(stats.ovr);

  const prevLeague = () => { setLeagueIdx(i=>(i-1+leagues.length)%leagues.length); setClubIdx(0); setCardKey(k=>k+1); };
  const nextLeague = () => { setLeagueIdx(i=>(i+1)%leagues.length); setClubIdx(0); setCardKey(k=>k+1); };
  const prevClub   = () => { setClubIdx(i=>(i-1+clubsInLeague.length)%clubsInLeague.length); setCardKey(k=>k+1); };
  const nextClub   = () => { setClubIdx(i=>(i+1)%clubsInLeague.length); setCardKey(k=>k+1); };

  useEffect(() => {
    const h = (e) => {
      if (detailClub) return;
      if (e.key==='ArrowLeft')  prevClub();
      if (e.key==='ArrowRight') nextClub();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [clubsInLeague.length, detailClub]);

  if (detailClub) {
    return <ClubDetailModal club={detailClub} allPlayers={allPlayers} onConfirm={()=>onSelect(detailClub)} onBack={()=>setDetailClub(null)}/>;
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(4,6,10,0.96)', backdropFilter:'blur(4px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', animation:'tsIn 0.3s ease' }}>
      <style>{`
        @keyframes tsIn   { from{opacity:0} to{opacity:1} }
        @keyframes cardIn { from{opacity:0;transform:scale(0.92) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes bgFade { from{opacity:0} to{opacity:0.07} }
      `}</style>

      {/* Badge bg */}
      {currentClub?.badgeUrl && (
        <div key={`bg-${cardKey}`} style={{ position:'fixed', inset:0, zIndex:0, backgroundImage:`url(${currentClub.badgeUrl})`, backgroundSize:'55%', backgroundPosition:'center', backgroundRepeat:'no-repeat', animation:'bgFade 0.4s ease forwards', pointerEvents:'none' }}/>
      )}
      <div style={{ position:'fixed', inset:0, zIndex:1, pointerEvents:'none', background:`radial-gradient(ellipse at 50% 50%, ${color}14 0%, transparent 65%)`, transition:'background 0.4s' }}/>

      {/* Back button */}
      <button onClick={onBack} style={{ position:'fixed', top:20, left:20, zIndex:10, background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:2, textTransform:'uppercase', cursor:'pointer', display:'flex', alignItems:'center', gap:8, WebkitTapHighlightColor:'transparent', padding:'8px 0' }}
        onMouseEnter={e=>e.currentTarget.style.color='#fff'}
        onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      {/* Sticky centered stack */}
      <div style={{ position:'relative', zIndex:3, width:'100%', maxWidth:400, padding:'0 clamp(16px,4vw,32px)', display:'flex', flexDirection:'column', gap:10 }}>

        {/* Country card */}
        <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'14px 4px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <ArrowBtn dir="left" onClick={prevLeague}/>
          <div style={{ textAlign:'center', flex:1 }}>
            <div style={{ fontSize:26, lineHeight:1, marginBottom:5 }}>{country.flag}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:15, letterSpacing:3, textTransform:'uppercase', color:'#fff', lineHeight:1 }}>{country.name}</div>
          </div>
          <ArrowBtn dir="right" onClick={nextLeague}/>
        </div>

        {/* Club card */}
        {currentClub ? (
          <div key={cardKey} style={{ background:`linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)`, border:`1.5px solid ${color}55`, borderRadius:16, padding:'28px 48px', display:'flex', flexDirection:'column', alignItems:'center', gap:14, boxShadow:`0 0 60px ${color}20, 0 16px 48px rgba(0,0,0,0.5)`, animation:'cardIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', position:'relative', overflow:'hidden' }}>
            {/* Badge watermark */}
            {currentClub.badgeUrl && (
              <img src={currentClub.badgeUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain', opacity:0.08, pointerEvents:'none', padding:24 }} onError={e=>e.target.style.display='none'}/>
            )}
            {/* Side arrows */}
            <div style={{ position:'absolute', left:4, top:'50%', transform:'translateY(-50%)', zIndex:2 }}>
              <ArrowBtn dir="left" onClick={e=>{e.stopPropagation();prevClub();}}/>
            </div>
            <div style={{ position:'absolute', right:4, top:'50%', transform:'translateY(-50%)', zIndex:2 }}>
              <ArrowBtn dir="right" onClick={e=>{e.stopPropagation();nextClub();}}/>
            </div>
            <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:12, width:'100%' }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(16px,4vw,24px)', letterSpacing:2, textTransform:'uppercase', color:'#fff', textAlign:'center', lineHeight:1.1, textShadow:`0 0 30px ${color}60` }}>{currentClub.name}</div>
              <Stars count={stars}/>
              <div style={{ display:'flex', width:'100%', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, overflow:'hidden' }}>
                {[['ATT',stats.att],['MID',stats.mid],['DEF',stats.def]].map(([lbl,val],i)=>(
                  <div key={lbl} style={{ flex:1, textAlign:'center', padding:'10px 0', borderRight:i<2?'1px solid rgba(255,255,255,0.07)':'none' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'#fff', lineHeight:1 }}>{val||'—'}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:2, textTransform:'uppercase', marginTop:3 }}>{lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.2)', letterSpacing:1 }}>{clubIdx+1} / {clubsInLeague.length}</div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign:'center', color:'rgba(255,255,255,0.25)', fontFamily:'var(--font-mono)', fontSize:12, padding:40 }}>No clubs in this league</div>
        )}

        {/* League card — read only */}
        <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 20px' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>League</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:17, color:'#fff', letterSpacing:1 }}>{currentLeague}</div>
        </div>

        {/* Select button */}
        {currentClub && (
          <button onClick={()=>setDetailClub(currentClub)} style={{ width:'100%', padding:'14px 0', background:'#4ade80', color:'#000', border:'none', borderRadius:8, fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, letterSpacing:3, textTransform:'uppercase', cursor:'pointer', boxShadow:'0 4px 20px rgba(74,222,128,0.25)', transition:'all 0.2s', WebkitTapHighlightColor:'transparent' }}
            onMouseEnter={e=>e.currentTarget.style.background='#2ecc71'}
            onMouseLeave={e=>e.currentTarget.style.background='#4ade80'}
          >
            Select Club
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── MODAL 2: Career Mode ─── */
function CareerModeModal({ onTakeCharge, onBuildFromScratch, onBack }) {
  const [scratchHover, setScratchHover] = useState(false);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(4,6,10,0.97)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', animation:'tsIn 0.3s ease', padding:'clamp(24px,6vw,48px) clamp(20px,5vw,40px)' }}>
      <style>{`@keyframes tsIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`}</style>

      <button onClick={onBack} style={{ position:'fixed', top:20, left:20, background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:2, textTransform:'uppercase', cursor:'pointer', display:'flex', alignItems:'center', gap:8, WebkitTapHighlightColor:'transparent' }}
        onMouseEnter={e=>e.currentTarget.style.color='#fff'}
        onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <div style={{ width:'100%', maxWidth:480 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:3, textTransform:'uppercase', marginBottom:8 }}>Step 2 of 3</div>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(24px,6vw,38px)', color:'#fff', letterSpacing:2, textTransform:'uppercase', lineHeight:1, marginBottom:8 }}>Choose Your Path</div>
        <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:36, lineHeight:1.6 }}>How do you want to start your managerial career?</div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Take Charge */}
          <button onClick={onTakeCharge} style={{ background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(0,232,122,0.4)', borderRadius:14, padding:'24px 28px', textAlign:'left', cursor:'pointer', transition:'all 0.2s', WebkitTapHighlightColor:'transparent', width:'100%' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(0,232,122,0.08)'; e.currentTarget.style.borderColor='rgba(0,232,122,0.7)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor='rgba(0,232,122,0.4)'; }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:10 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(0,232,122,0.15)', border:'1px solid rgba(0,232,122,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e87a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:20, color:'#fff', letterSpacing:2, textTransform:'uppercase' }}>Take Charge</div>
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Step into the dugout of an existing professional club. Choose your squad, set your tactics, and chase glory from day one.</div>
          </button>

          {/* Build From Scratch */}
          <button
            onClick={onBuildFromScratch}
            onMouseEnter={()=>setScratchHover(true)}
            onMouseLeave={()=>setScratchHover(false)}
            style={{ background:'rgba(255,255,255,0.03)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:14, padding:'24px 28px', textAlign:'left', cursor:'not-allowed', transition:'all 0.2s', WebkitTapHighlightColor:'transparent', width:'100%', position:'relative', overflow:'hidden' }}
          >
            {/* Coming Soon overlay */}
            <div style={{ position:'absolute', top:12, right:14, fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:2, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:4, padding:'3px 8px' }}>Coming Soon</div>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:10 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:20, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase' }}>Build From Scratch</div>
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(255,255,255,0.25)', lineHeight:1.7 }}>Create your own club from the ground up. Name it, design it, register it in Division 3, and grind your way to the top.</div>
          </button>

        </div>
      </div>
    </div>
  );
}

/* ─── MODAL 1: Manager Profile ─── */
const DAYS   = Array.from({length:31},(_,i)=>String(i+1).padStart(2,'0'));
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS  = Array.from({length:50},(_,i)=>String(2005-i));

function ManagerProfileModal({ onNext, onClose }) {
  const [name, setName]   = useState('');
  const [day, setDay]     = useState('01');
  const [month, setMonth] = useState('Jan');
  const [year, setYear]   = useState('1990');
  const [err, setErr]     = useState('');

  const handleNext = () => {
    if (!name.trim()) { setErr('Enter your manager name.'); return; }
    if (name.trim().length < 2) { setErr('Name must be at least 2 characters.'); return; }
    setErr('');
    onNext({ name: name.trim(), dob: `${day} ${month} ${year}` });
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(4,6,10,0.97)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', animation:'profileIn 0.3s ease', padding:'clamp(24px,6vw,48px) clamp(20px,5vw,40px)' }}>
      <style>{`
        @keyframes profileIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .mgr-input { background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.12); border-radius:8px; padding:14px 16px; color:#fff; font-family:'Barlow',sans-serif; font-size:15px; width:100%; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
        .mgr-input:focus { border-color:rgba(0,232,122,0.6); }
        .mgr-input::placeholder { color:rgba(255,255,255,0.2); }
        .mgr-select { background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.12); border-radius:8px; padding:12px 10px; color:#fff; font-family:'Barlow Condensed',sans-serif; font-size:15px; outline:none; cursor:pointer; transition:border-color 0.2s; appearance:none; -webkit-appearance:none; text-align:center; }
        .mgr-select:focus { border-color:rgba(0,232,122,0.6); }
        .mgr-select option { background:#0f1318; }
      `}</style>

      <button onClick={onClose} style={{ position:'fixed', top:20, right:20, background:'none', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:2, textTransform:'uppercase', WebkitTapHighlightColor:'transparent' }}
        onMouseEnter={e=>e.currentTarget.style.color='#fff'}
        onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.35)'}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        Close
      </button>

      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:3, textTransform:'uppercase', marginBottom:8 }}>Step 1 of 3</div>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(24px,6vw,38px)', color:'#fff', letterSpacing:2, textTransform:'uppercase', lineHeight:1, marginBottom:8 }}>Manager Profile</div>
        <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:36, lineHeight:1.6 }}>Tell us who's taking the hot seat.</div>

        {/* Name */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>Full Name</div>
          <input
            className="mgr-input"
            placeholder="e.g. Alex Ferguson"
            value={name}
            onChange={e=>{ setName(e.target.value); setErr(''); }}
            onKeyDown={e=>e.key==='Enter' && handleNext()}
            maxLength={40}
          />
        </div>

        {/* DOB */}
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

        {err && (
          <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'#ff3b5c', letterSpacing:1, marginBottom:16 }}>{err}</div>
        )}

        <button onClick={handleNext} style={{ width:'100%', padding:'14px 0', background:'#4ade80', color:'#000', border:'none', borderRadius:8, fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, letterSpacing:3, textTransform:'uppercase', cursor:'pointer', boxShadow:'0 4px 20px rgba(74,222,128,0.25)', transition:'all 0.2s', WebkitTapHighlightColor:'transparent' }}
          onMouseEnter={e=>e.currentTarget.style.background='#2ecc71'}
          onMouseLeave={e=>e.currentTarget.style.background='#4ade80'}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

/* ─── Main Home ─── */
export default function Home() {
  const { allClubs, allPlayers, chooseClub, setManagerProfile } = useGameStore();
  const navigate = useNavigate();

  const [slide, setSlide]                   = useState(0);
  const [kenBurnsKey, setKenBurnsKey]       = useState(0);
  const [loaded, setLoaded]                 = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [loaderDone, setLoaderDone]         = useState(false);

  // Modal flow: null | 'profile' | 'mode' | 'clubs'
  const [modal, setModal] = useState(null);
  const [managerData, setManagerData] = useState(null);

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

  /* Slideshow + Ken Burns cycle */
  useEffect(() => {
    if (!loaded) return;
    const t = setInterval(() => {
      setSlide(s => (s + 1) % SLIDES.length);
      setKenBurnsKey(k => k + 1);
    }, 6000);
    return () => clearInterval(t);
  }, [loaded]);

  /* Body scroll lock when modal open */
  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const handleProfileNext = (data) => {
    setManagerData(data);
    setModal('mode');
  };

  const handleTakeCharge = () => setModal('clubs');

  const handleBuildFromScratch = () => {
    // Placeholder — coming soon, do nothing
  };

  const handleSelect = (club) => {
    chooseClub(club);
    if (setManagerProfile && managerData) setManagerProfile(managerData);
    setModal(null);
    navigate('/home');
  };

  return (
    <>
      <style>{`
        @keyframes slideUp  { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes kbZoom   { from{transform:scale(1) translate(0,0)} to{transform:scale(1.12) translate(-2%,-1%)} }
        @keyframes kbZoom2  { from{transform:scale(1) translate(0,0)} to{transform:scale(1.10) translate(2%, 1%)} }
        @keyframes kbZoom3  { from{transform:scale(1.05) translate(-1%,0)} to{transform:scale(1.14) translate(1%,-2%)} }
        .ts-slide-bg { position:absolute; inset:0; background-size:cover; opacity:0; transition:opacity 1.8s ease; }
        .ts-slide-bg.active { opacity:1; }
        .ts-slide-bg.active .kb-inner { animation: kbZoom 7s ease-in-out forwards; }
        .kb-inner { position:absolute; inset:-8%; background-size:cover; background-position:inherit; will-change:transform; }
        .hero-h1    { opacity:0; animation:slideUp 0.9s 0.1s both ease; }
        .hero-sub   { opacity:0; animation:slideUp 0.7s 0.35s both ease; }
        .hero-btns  { opacity:0; animation:slideUp 0.7s 0.55s both ease; }
        .hero-stats { opacity:0; animation:fadeIn 0.8s 0.8s both ease; }
        .ts-start-btn:hover { background:#2ecc71 !important; box-shadow:0 4px 28px rgba(74,222,128,0.4) !important; }
        .ts-start-btn:active { transform:scale(0.97); }
        .ts-howto-btn:hover { color:rgba(255,255,255,0.75) !important; border-color:rgba(255,255,255,0.35) !important; }
      `}</style>

      {/* Loader */}
      <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#060a06', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, opacity:loaderDone?0:1, transition:'opacity 0.5s ease', pointerEvents:loaderDone?'none':'all' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(26px,7vw,46px)', letterSpacing:8, color:'#4ade80', textTransform:'uppercase' }}>THE GAFFER</div>
        <div style={{ width:'clamp(180px,48vw,260px)', height:2, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${loaderProgress}%`, background:'#4ade80', transition:'width 0.15s linear', borderRadius:2 }}/>
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:3, color:'rgba(255,255,255,0.25)', textTransform:'uppercase' }}>{loaderProgress}%</div>
      </div>

      {/* Ken Burns slideshow bg */}
      <div style={{ position:'fixed', inset:0, zIndex:0, display: modal ? 'none' : 'block' }}>
        {SLIDES.map((slide_item, i) => (
          <div key={i} className={`ts-slide-bg ${i === slide ? 'active' : ''}`} style={{ backgroundPosition: slide_item.pos }}>
            <div className="kb-inner" style={{ backgroundImage:`url(${slide_item.url})`, backgroundPosition: slide_item.pos }}/>
          </div>
        ))}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(4,6,10,0.97) 0%, rgba(4,6,10,0.82) 50%, rgba(4,6,10,0.35) 100%)' }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(4,6,10,0.98) 0%, rgba(4,6,10,0.4) 30%, transparent 60%)' }}/>
      </div>

      {/* Hero */}
      <div style={{ position:'relative', zIndex:1, minHeight:'100dvh', display:'flex', flexDirection:'column', justifyContent:'space-between', opacity:loaded?1:0, transition:'opacity 0.5s ease' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'clamp(60px,10vw,100px) clamp(24px,8vw,80px) clamp(40px,6vw,60px)' }}>
          <div style={{ maxWidth:620 }}>
            <h1 className="hero-h1" style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(56px,13vw,120px)', letterSpacing:'clamp(1px,0.3vw,3px)', lineHeight:0.88, color:'#fff', marginBottom:'clamp(20px,4vw,32px)', textTransform:'uppercase' }}>
              READY<br/>TO TAKE ON<br/>THE <span style={{ color:'#4ade80', textShadow:'0 0 40px rgba(74,222,128,0.5)' }}>HOT</span><br/>SEAT?
            </h1>
            <p className="hero-sub" style={{ fontSize:'clamp(13px,2.5vw,16px)', color:'rgba(255,255,255,0.45)', lineHeight:1.8, fontWeight:300, maxWidth:380, marginBottom:'clamp(28px,5vw,44px)' }}>
              Build a dynasty. Dominate the league. Prove you've got what it takes.
            </p>
            <div className="hero-btns" style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button className="ts-start-btn" onClick={()=>setModal('profile')} style={{ background:'#4ade80', color:'#000', border:'none', borderRadius:6, fontFamily:'var(--font-display)', fontSize:'clamp(12px,2.5vw,14px)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', padding:'clamp(12px,3vw,14px) clamp(22px,5vw,32px)', cursor:'pointer', boxShadow:'0 4px 20px rgba(74,222,128,0.25)', transition:'all 0.2s', display:'flex', alignItems:'center', gap:8, WebkitTapHighlightColor:'transparent' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Start Career
              </button>
              <button className="ts-howto-btn" style={{ background:'transparent', color:'rgba(255,255,255,0.45)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, fontFamily:'var(--font-display)', fontSize:'clamp(12px,2.5vw,14px)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', padding:'clamp(12px,3vw,14px) clamp(22px,5vw,32px)', cursor:'pointer', transition:'all 0.2s', WebkitTapHighlightColor:'transparent' }}>
                How to Play
              </button>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="hero-stats" style={{ display:'flex', gap:'clamp(24px,6vw,64px)', padding:'clamp(20px,4vw,32px) clamp(24px,8vw,80px)', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(4,6,10,0.6)', backdropFilter:'blur(8px)' }}>
          {[['18','Top Clubs'],['6','Leagues'],['100+','Real Players']].map(([val,label])=>(
            <div key={label}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(22px,5vw,32px)', color:'#4ade80', lineHeight:1 }}>{val}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'clamp(9px,1.5vw,10px)', color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal flow */}
      {modal === 'profile' && (
        <ManagerProfileModal
          onNext={handleProfileNext}
          onClose={()=>setModal(null)}
        />
      )}
      {modal === 'mode' && (
        <CareerModeModal
          onTakeCharge={handleTakeCharge}
          onBuildFromScratch={handleBuildFromScratch}
          onBack={()=>setModal('profile')}
        />
      )}
      {modal === 'clubs' && (
        <TeamSelectModal
          allClubs={allClubs||[]}
          allPlayers={allPlayers||[]}
          onSelect={handleSelect}
          onBack={()=>setModal('mode')}
        />
      )}
    </>
  );
}