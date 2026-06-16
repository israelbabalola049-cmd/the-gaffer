import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';

/* ── club colours ── */
const CLUB_COLOR = {
  'Real Madrid':'#FEBE10','Barcelona':'#A50044','Manchester City':'#6CABDD',
  'Liverpool':'#C8102E','Arsenal':'#EF0107','Chelsea':'#034694',
  'Manchester United':'#DA291C','Tottenham':'#132257','Bayern Munich':'#DC052D',
  'PSG':'#003370','AC Milan':'#FB090B','Inter Milan':'#0068A8',
  'Atletico Madrid':'#CB3524','Bayer Leverkusen':'#E32221',
  'Brighton':'#0057B8','Aston Villa':'#670E36',
  'Borussia Dortmund':'#FDE100','Juventus':'#888',
};
const CLUB_BADGE_URL = {
  'Manchester City':   'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'Liverpool':         'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'Arsenal':           'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  'Chelsea':           'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'Manchester United': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  'Tottenham':         'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  'Aston Villa':       'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_FC_new_crest.svg',
  'Brighton':          'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_FC_logo.svg',
  'Bayern Munich':     'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'Real Madrid':       'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'Barcelona':         'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'PSG':               'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  'AC Milan':          'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  'Inter Milan':       'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  'Juventus':          'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon_%28black%29.svg',
  'Atletico Madrid':   'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  'Borussia Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'Bayer Leverkusen':  'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
};

const PLACEHOLDER_JOB_OFFERS = [
  { club:'Real Madrid',   league:'La Liga',    prestige:'World Class' },
  { club:'Bayern Munich', league:'Bundesliga', prestige:'World Class' },
];

/* ── sub-components ── */
function ClubBadge({ name, size=24 }) {
  const [failed, setFailed] = useState(false);
  const url   = CLUB_BADGE_URL[name];
  const color = CLUB_COLOR[name] || '#888';
  if (url && !failed)
    return <img src={url} alt={name} onError={()=>setFailed(true)} style={{ width:size, height:size, objectFit:'contain', flexShrink:0 }} />;
  return (
    <div style={{ width:size, height:size, flexShrink:0, background:`${color}22`, border:`1px solid ${color}55`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:size*0.32, color, fontWeight:700 }}>
      {name?.slice(0,3).toUpperCase()}
    </div>
  );
}

/* modal — new game */
function NewGameModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(4,6,10,0.96)', backdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#0c1018', border:'1px solid rgba(255,59,92,0.3)', padding:'36px 32px', maxWidth:340, width:'100%', textAlign:'center' }}>
        <div style={{ width:48, height:48, background:'rgba(255,59,92,0.08)', border:'1px solid rgba(255,59,92,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff3b5c" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', marginBottom:10 }}>Start New Game?</div>
        <p style={{ fontFamily:"'Barlow',sans-serif", fontSize:13, color:'#556070', lineHeight:1.65, marginBottom:28 }}>Your current save will be permanently deleted. This cannot be undone.</p>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onCancel}  style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#9aa3b2', fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:'12px', background:'#ff3b5c', border:'none', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

/* modal — job offer */
function JobOfferModal({ offer, onAccept, onDecline }) {
  const color = CLUB_COLOR[offer.club] || '#00e87a';
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(4,6,10,0.97)', backdropFilter:'blur(24px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#0c1018', border:`1px solid ${color}30`, padding:'36px 32px', maxWidth:340, width:'100%', textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><ClubBadge name={offer.club} size={60}/></div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', marginBottom:4 }}>{offer.club}</div>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'#556070', letterSpacing:2, marginBottom:14 }}>{offer.league}</div>
        <div style={{ display:'inline-block', padding:'3px 14px', background:`${color}18`, border:`1px solid ${color}40`, fontFamily:"'Share Tech Mono',monospace", fontSize:8, color, letterSpacing:2, textTransform:'uppercase', marginBottom:26 }}>{offer.prestige}</div>
        <p style={{ fontFamily:"'Barlow',sans-serif", fontSize:13, color:'#556070', lineHeight:1.65, marginBottom:28 }}>{offer.club} want to appoint you as their new manager. Do you accept?</p>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onDecline} style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#9aa3b2', fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>Decline</button>
          <button onClick={onAccept} style={{ flex:1, padding:'12px', background:color, border:'none', color:'#000', fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>Accept</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function Manager() {
  const navigate  = useNavigate();
  const store     = useGameStore();
  const { myClub, budget, season, week, squad, objectives, careerHistory, awards, managerRating, resetGame } = store;

  const [difficulty, setDifficulty]   = useState('semi-pro');
  const [gameSpeed, setGameSpeed]     = useState('normal');
  const [showNewGame, setShowNewGame] = useState(false);
  const [activeOffer, setActiveOffer] = useState(null);
  const [dismissed, setDismissed]     = useState([]);
  const [activePanel, setActivePanel] = useState(null); // 'career' | 'settings' | 'offers'

  const accent       = CLUB_COLOR[myClub?.name] || '#00e87a';
  const managerName  = useGameStore(s => s.managerProfile?.name) || 'The Gaffer';
  const rating       = managerRating || 50;
  const ratingColor  = rating >= 75 ? '#00e87a' : rating >= 50 ? '#f5c518' : '#ff3b5c';
  const ratingLabel  = rating >= 75 ? 'Above Target' : rating >= 50 ? 'On Track' : 'Under Pressure';

  const wages        = store.wages ?? 0;
  const revenue      = store.revenue ?? 0;
  const profit       = revenue - wages;

  const visibleOffers = PLACEHOLDER_JOB_OFFERS.filter(o => !dismissed.includes(o.club));
  const displayObjs   = objectives?.length ? objectives : [
    { text:'Finish in the top half',        met:false },
    { text:'Reach the cup quarter-finals',  met:false },
    { text:'Sign two quality players',      met:false },
    { text:'Improve squad overall rating',  met:false },
  ];

  /* shared tile style */
  const tile = (extra={}) => ({
    background:'rgba(10,14,22,0.97)',
    border:'1px solid rgba(255,255,255,0.08)',
    padding:'14px 16px',
    display:'flex',
    flexDirection:'column',
    gap:8,
    overflow:'hidden',
    position:'relative',
    ...extra,
  });

  const tileHeader = (label) => (
    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:900, color:'rgba(255,255,255,0.35)', letterSpacing:3, textTransform:'uppercase', marginBottom:2 }}>{label}</div>
  );

  /* ── Slide-over panel (Career History / Settings / Job Offers) ── */
  const PanelOverlay = () => {
    if (!activePanel) return null;
    return (
      <div onClick={()=>setActivePanel(null)} style={{ position:'absolute', inset:0, zIndex:50, background:'rgba(4,6,10,0.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'stretch', justifyContent:'flex-end' }}>
        <div onClick={e=>e.stopPropagation()} style={{ width:340, background:'#0a0e18', borderLeft:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* panel header */}
          <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', letterSpacing:0.5 }}>
              {activePanel === 'career' ? 'My Career' : activePanel === 'settings' ? 'Settings' : 'Job Offers'}
            </span>
            <button onClick={()=>setActivePanel(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* panel body */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px 0' }}>

            {activePanel === 'career' && (
              <>
                {/* Manager card */}
                <div style={{ padding:'12px 18px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(managerName)}&background=141a26&color=e8edf2&size=120&bold=true&length=2`} alt={managerName} style={{ width:52, height:52, border:`2px solid ${accent}30` }}/>
                    <div>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontStyle:'italic', fontSize:20, fontWeight:900, color:'#f0f2f5' }}>{managerName}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5 }}>
                        <ClubBadge name={myClub?.name} size={14}/>
                        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'rgba(255,255,255,0.3)', letterSpacing:1.5, textTransform:'uppercase' }}>{myClub?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:1, background:'rgba(255,255,255,0.05)' }}>
                    {[['Season', `S${season}`], ['Week', `W${week}`], ['Squad', squad?.length ?? '—']].map(([l,v])=>(
                      <div key={l} style={{ background:'#0a0e18', padding:'8px 0', textAlign:'center' }}>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:900, color:'#f0f2f5' }}>{v}</div>
                        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:6.5, color:'rgba(255,255,255,0.22)', letterSpacing:2, textTransform:'uppercase', marginTop:2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* History table */}
                <div style={{ padding:'0 18px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 40px 56px', gap:4, padding:'10px 0 6px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    {['Club','Pos','Trophies'].map(h=>(
                      <span key={h} style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:6.5, color:'rgba(255,255,255,0.2)', letterSpacing:1.5, textTransform:'uppercase', textAlign:h==='Club'?'left':'center' }}>{h}</span>
                    ))}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 40px 56px', gap:4, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', borderLeft:`2px solid ${accent}`, paddingLeft:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <ClubBadge name={myClub?.name} size={18}/>
                      <div>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'#f0f2f5' }}>{myClub?.name}</div>
                        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:6.5, color:accent, letterSpacing:1, marginTop:1 }}>Current</div>
                      </div>
                    </div>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, color:'rgba(255,255,255,0.3)', textAlign:'center', alignSelf:'center' }}>—</span>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, color:'#f5c518', textAlign:'center', alignSelf:'center' }}>0</span>
                  </div>
                  {(!careerHistory || careerHistory.length === 0) && (
                    <div style={{ padding:'18px 0', textAlign:'center' }}>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.14)', letterSpacing:2, textTransform:'uppercase' }}>No previous clubs</span>
                    </div>
                  )}
                  {careerHistory?.map((e,i)=>(
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 40px 56px', gap:4, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <ClubBadge name={e.club} size={18}/>
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'#9aa3b2' }}>{e.club}</span>
                      </div>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, color:'#f0f2f5', textAlign:'center', alignSelf:'center' }}>{e.position}</span>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, color:'#f5c518', textAlign:'center', alignSelf:'center' }}>{e.trophies||0}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activePanel === 'settings' && (
              <div style={{ padding:'4px 18px', display:'flex', flexDirection:'column', gap:20 }}>
                {/* Difficulty */}
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:1 }}>Difficulty</span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:accent, letterSpacing:1.5, textTransform:'uppercase' }}>{difficulty}</span>
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    {[['amateur','Amateur'],['semi-pro','Semi-Pro'],['professional','Pro']].map(([v,l])=>(
                      <button key={v} onClick={()=>setDifficulty(v)} style={{ flex:1, padding:'9px 4px', background: difficulty===v?`${accent}20`:'rgba(255,255,255,0.03)', border:`1px solid ${difficulty===v?accent:'rgba(255,255,255,0.08)'}`, color: difficulty===v?accent:'rgba(255,255,255,0.3)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', cursor:'pointer', transition:'all 0.15s' }}>{l}</button>
                    ))}
                  </div>
                </div>
                {/* Game Speed */}
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:1 }}>Game Speed</span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:accent, letterSpacing:1.5, textTransform:'uppercase' }}>{gameSpeed}</span>
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    {[['slow','Slow'],['normal','Normal'],['fast','Fast']].map(([v,l])=>(
                      <button key={v} onClick={()=>setGameSpeed(v)} style={{ flex:1, padding:'9px 4px', background: gameSpeed===v?`${accent}20`:'rgba(255,255,255,0.03)', border:`1px solid ${gameSpeed===v?accent:'rgba(255,255,255,0.08)'}`, color: gameSpeed===v?accent:'rgba(255,255,255,0.3)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', cursor:'pointer', transition:'all 0.15s' }}>{l}</button>
                    ))}
                  </div>
                </div>
                {/* Save */}
                <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:1 }}>Save File</div>
                    <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.2)', letterSpacing:1, marginTop:3 }}>the-gaffer-save · S{season} W{week}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:'#00e87a', boxShadow:'0 0 8px rgba(0,232,122,0.7)' }}/>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'#00e87a', letterSpacing:1.5 }}>SAVED</span>
                  </div>
                </div>
                {/* New game */}
                <button onClick={()=>{ setActivePanel(null); setShowNewGame(true); }} style={{ padding:'12px', background:'rgba(255,59,92,0.07)', border:'1px solid rgba(255,59,92,0.2)', color:'#ff3b5c', fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:900, fontStyle:'italic', letterSpacing:2, textTransform:'uppercase', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.15s' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
                  Start New Game
                </button>
              </div>
            )}

            {activePanel === 'offers' && (
              <>
                {visibleOffers.length === 0 ? (
                  <div style={{ padding:'40px 18px', textAlign:'center', opacity:0.35 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:10 }}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                    <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.28)', letterSpacing:2, textTransform:'uppercase' }}>No offers right now</div>
                  </div>
                ) : visibleOffers.map((offer, i) => {
                  const c = CLUB_COLOR[offer.club] || '#888';
                  return (
                    <div key={offer.club} onClick={()=>{ setActivePanel(null); setActiveOffer(offer); }}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer', borderLeft:`3px solid ${c}`, transition:'background 0.1s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <ClubBadge name={offer.club} size={36}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:900, color:'#f0f2f5' }}>{offer.club}</div>
                        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.3)', letterSpacing:1.5, marginTop:2 }}>{offer.league}</div>
                      </div>
                      <span style={{ padding:'2px 10px', background:`${c}18`, border:`1px solid ${c}35`, fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:c, letterSpacing:1, textTransform:'uppercase' }}>{offer.prestige}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ── RENDER ── */
  return (
    <>
      <style>{`
        .mgr-action { cursor:pointer; transition:filter 0.15s, transform 0.1s; }
        .mgr-action:hover { filter:brightness(1.15); transform:translateY(-1px); }
        .mgr-action:active { transform:scale(0.97); }
        @keyframes mgrIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {showNewGame && <NewGameModal onConfirm={()=>{ resetGame(); navigate('/'); }} onCancel={()=>setShowNewGame(false)} />}
      {activeOffer  && <JobOfferModal offer={activeOffer} onAccept={()=>setActiveOffer(null)} onDecline={()=>{ setDismissed(d=>[...d,activeOffer.club]); setActiveOffer(null); }} />}

      {/* wrapper — relative so overlay positions correctly */}
      <div style={{ padding:8, height:'calc(min(580px, 100vh - 130px) - 44px)', boxSizing:'border-box', display:'flex', flexDirection:'column', gap:6, position:'relative', overflow:'hidden', animation:'mgrIn 0.25s ease both' }}>

        <PanelOverlay/>

        {/* ══ TOP ROW — 3 cols ══ */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 180px 1fr', gap:6, flex:'0 0 auto' }}>

          {/* NOTIFICATIONS */}
          <div style={{ background:'rgba(10,14,22,0.97)', border:'1px solid rgba(255,255,255,0.07)', padding:'14px 16px', display:'flex', flexDirection:'column', gap:8, overflow:'hidden' }}>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.25)', letterSpacing:3, textTransform:'uppercase' }}>Notifications</div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0', opacity:0.3 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:1, textTransform:'uppercase' }}>No New Items</span>
            </div>
          </div>

          {/* FINANCES */}
          <div style={{ background:'rgba(10,14,22,0.97)', border:'1px solid rgba(255,255,255,0.07)', padding:'14px 16px', display:'flex', flexDirection:'column', gap:8, overflow:'hidden' }}>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.25)', letterSpacing:3, textTransform:'uppercase' }}>Finances</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.25)', letterSpacing:2, textTransform:'uppercase', marginBottom:3 }}>Profit</div>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={profit>=0?'#00e87a':'#ff3b5c'} strokeWidth="2.5" strokeLinecap="round"><polyline points={profit>=0?"5 15 12 8 19 15":"5 9 12 16 19 9"}/></svg>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:900, color: profit>=0?'#00e87a':'#ff3b5c', lineHeight:1 }}>{profit>=0?'+':'-'}£{Math.abs(profit/1e6).toFixed(1)}M</span>
                </div>
              </div>
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:8 }}>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.25)', letterSpacing:2, textTransform:'uppercase', marginBottom:2 }}>Transfer Budget</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, fontWeight:900, color:'#f0f2f5' }}>£{budget>=1e6?`${(budget/1e6).toFixed(1)}M`:budget>=1e3?`${(budget/1e3).toFixed(0)}K`:budget||0}</div>
              </div>
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:8 }}>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.25)', letterSpacing:2, textTransform:'uppercase', marginBottom:2 }}>Weekly Wages</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, fontWeight:900, color: wages>0?'#ff3b5c':'#f0f2f5' }}>£{wages>=1e6?`${(wages/1e6).toFixed(2)}M`:wages>=1e3?`${(wages/1e3).toFixed(0)}K`:wages||'0'}</div>
              </div>
            </div>
          </div>

          {/* BOARD EXPECTATIONS — card style with bg image */}
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', padding:'14px 16px', display:'flex', flexDirection:'column', gap:8, overflow:'hidden', position:'relative' }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg, #1a0a00 0%, #2d1500 40%, #3d2000 70%, #5c3a00 100%)' }}/>
            <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=900&q=80')", backgroundSize:'cover', backgroundPosition:'center', opacity:0.5 }}/>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(7,10,15,0.2) 0%, rgba(7,10,15,0.88) 100%)' }}/>
            <div style={{ position:'relative', fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.4)', letterSpacing:3, textTransform:'uppercase' }}>Board Expectations</div>
            <div style={{ position:'relative', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:48, height:48, background:ratingColor, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:900, color:'#000', lineHeight:1 }}>{rating}</span>
              </div>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, fontWeight:900, color:'#f0f2f5' }}>{ratingLabel}</span>
            </div>
            <div style={{ position:'relative', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:8 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:900, color:'rgba(255,255,255,0.45)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Latest Objectives</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {displayObjs.slice(0,3).map((obj, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:7 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background: obj.met ? '#00e87a' : 'rgba(255,255,255,0.15)', flexShrink:0, marginTop:3 }}/>
                    <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color: obj.met ? '#f0f2f5' : 'rgba(255,255,255,0.45)', lineHeight:1.4 }}>{obj.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ BOTTOM ROW ══ */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6, flex:1 }}>

          {/* YOUTH STAFF — card style with bg image */}
          <button className="mgr-action" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:4, padding:'18px', textAlign:'left', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'flex-end', gap:8, position:'relative', overflow:'hidden', transition:'border-color 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.18)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}
          >
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg, #001a00 0%, #002800 40%, #004d00 70%, #006600 100%)' }}/>
            <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=60')", backgroundSize:'cover', backgroundPosition:'center', opacity:0.5 }}/>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(7,10,15,0.1) 0%, rgba(7,10,15,0.88) 100%)' }}/>
            <div style={{ position:'relative', color:'rgba(0,232,122,0.8)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div style={{ position:'relative' }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', letterSpacing:0.5, lineHeight:1, marginBottom:5 }}>Youth Staff</div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#9aa3b2', letterSpacing:1.5, textTransform:'uppercase', lineHeight:1.5 }}>Find new talent for your youth squad</div>
            </div>
          </button>

          {/* MY CAREER — card style with bg image */}
          <button className="mgr-action" onClick={()=>setActivePanel('career')} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:4, padding:'18px', textAlign:'left', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'flex-end', gap:8, position:'relative', overflow:'hidden', transition:'border-color 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.18)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}
          >
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg, #0a1628 0%, #0f2040 40%, #1a3358 70%, #0d1f3c 100%)' }}/>
            <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=60')", backgroundSize:'cover', backgroundPosition:'center', opacity:0.5 }}/>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(7,10,15,0.1) 0%, rgba(7,10,15,0.88) 100%)' }}/>
            <div style={{ position:'relative', color:`${accent}cc` }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div style={{ position:'relative' }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', letterSpacing:0.5, lineHeight:1, marginBottom:5 }}>My Career</div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#9aa3b2', letterSpacing:1.5, textTransform:'uppercase', lineHeight:1.5 }}>View history and manager profile</div>
            </div>
          </button>

          {/* SETTINGS — plain dark */}
          <div className="mgr-action" onClick={()=>setActivePanel('settings')} style={{ background:'rgba(10,14,22,0.97)', border:'1px solid rgba(255,255,255,0.07)', padding:'18px', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'space-between', overflow:'hidden', transition:'border-color 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.18)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}
          >
            <div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.25)', letterSpacing:3, textTransform:'uppercase', marginBottom:8 }}>Settings</div>
              <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.5 }}>Difficulty, speed and save options</div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
          </div>

          {/* BROWSE JOBS — plain dark */}
          <div className="mgr-action" onClick={()=>setActivePanel('offers')} style={{ background:'rgba(10,14,22,0.97)', border:'1px solid rgba(255,255,255,0.07)', padding:'18px', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'space-between', overflow:'hidden', transition:'border-color 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.18)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}
          >
            <div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.25)', letterSpacing:3, textTransform:'uppercase', marginBottom:8 }}>Browse Jobs</div>
              <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.5 }}>
                {visibleOffers.length > 0 ? `${visibleOffers.length} offer${visibleOffers.length>1?'s':''} waiting` : 'No offers right now'}
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
              {visibleOffers.length > 0 && (
                <div style={{ display:'flex', gap:6 }}>
                  {visibleOffers.slice(0,2).map(o=><ClubBadge key={o.club} name={o.club} size={22}/>)}
                </div>
              )}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeLinecap="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}