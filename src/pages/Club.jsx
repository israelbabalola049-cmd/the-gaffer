import { useState, useMemo } from 'react';
import useGameStore from '../store/gameStore';
import { ClubBadge, CLUB_COLOR, fmt } from '../components/Layout';

/* ── helpers ── */
const POS_COLOR = {
  GK: '#f5c518', DEF: '#3b82f6', CB: '#3b82f6', LB: '#3b82f6', RB: '#3b82f6',
  MID: '#00e87a', CM: '#00e87a', CDM: '#00e87a', CAM: '#00e87a', LM: '#00e87a', RM: '#00e87a',
  FWD: '#ff3b5c', ST: '#ff3b5c', LW: '#ff3b5c', RW: '#ff3b5c', CF: '#ff3b5c',
};
const posColor = (pos) => POS_COLOR[pos] || '#9aa3ae';

const posGroup = (pos) => {
  if (!pos) return 'MID';
  if (['GK'].includes(pos)) return 'GK';
  if (['DEF','CB','LB','RB','LWB','RWB'].includes(pos)) return 'DEF';
  if (['MID','CM','CDM','CAM','LM','RM','DM','AM'].includes(pos)) return 'MID';
  return 'FWD';
};

const ovrColor = (o) => o >= 85 ? '#f5c518' : o >= 75 ? '#00e87a' : o >= 65 ? '#3b82f6' : '#9aa3ae';

const fmtVal = (n) => {
  if (!n) return '—';
  if (n >= 1e9) return `£${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `£${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `£${(n/1e3).toFixed(0)}K`;
  return `£${n}`;
};

const FORMATIONS = ['4-3-3','4-4-2','4-2-3-1','3-5-2','5-3-2','4-5-1','3-4-3'];

/* formation → positions on pitch (x% from left, y% from top) */
const FORMATION_POSITIONS = {
  '4-3-3': [
    {pos:'GK',x:50,y:88},
    {pos:'RB',x:82,y:72},{pos:'CB',x:62,y:68},{pos:'CB',x:38,y:68},{pos:'LB',x:18,y:72},
    {pos:'CM',x:72,y:50},{pos:'CM',x:50,y:46},{pos:'CM',x:28,y:50},
    {pos:'RW',x:80,y:26},{pos:'ST',x:50,y:20},{pos:'LW',x:20,y:26},
  ],
  '4-4-2': [
    {pos:'GK',x:50,y:88},
    {pos:'RB',x:82,y:72},{pos:'CB',x:62,y:68},{pos:'CB',x:38,y:68},{pos:'LB',x:18,y:72},
    {pos:'RM',x:82,y:50},{pos:'CM',x:62,y:48},{pos:'CM',x:38,y:48},{pos:'LM',x:18,y:50},
    {pos:'ST',x:65,y:22},{pos:'ST',x:35,y:22},
  ],
  '4-2-3-1': [
    {pos:'GK',x:50,y:88},
    {pos:'RB',x:82,y:72},{pos:'CB',x:62,y:68},{pos:'CB',x:38,y:68},{pos:'LB',x:18,y:72},
    {pos:'CDM',x:62,y:56},{pos:'CDM',x:38,y:56},
    {pos:'RM',x:80,y:38},{pos:'CAM',x:50,y:36},{pos:'LM',x:20,y:38},
    {pos:'ST',x:50,y:18},
  ],
  '3-5-2': [
    {pos:'GK',x:50,y:88},
    {pos:'CB',x:70,y:70},{pos:'CB',x:50,y:66},{pos:'CB',x:30,y:70},
    {pos:'RM',x:88,y:50},{pos:'CM',x:68,y:46},{pos:'CM',x:50,y:44},{pos:'CM',x:32,y:46},{pos:'LM',x:12,y:50},
    {pos:'ST',x:65,y:22},{pos:'ST',x:35,y:22},
  ],
  '5-3-2': [
    {pos:'GK',x:50,y:88},
    {pos:'RB',x:88,y:72},{pos:'CB',x:70,y:68},{pos:'CB',x:50,y:66},{pos:'CB',x:30,y:68},{pos:'LB',x:12,y:72},
    {pos:'CM',x:68,y:46},{pos:'CM',x:50,y:44},{pos:'CM',x:32,y:46},
    {pos:'ST',x:65,y:22},{pos:'ST',x:35,y:22},
  ],
  '4-5-1': [
    {pos:'GK',x:50,y:88},
    {pos:'RB',x:82,y:72},{pos:'CB',x:62,y:68},{pos:'CB',x:38,y:68},{pos:'LB',x:18,y:72},
    {pos:'RM',x:88,y:48},{pos:'CM',x:68,y:44},{pos:'CM',x:50,y:42},{pos:'CM',x:32,y:44},{pos:'LM',x:12,y:48},
    {pos:'ST',x:50,y:18},
  ],
  '3-4-3': [
    {pos:'GK',x:50,y:88},
    {pos:'CB',x:70,y:70},{pos:'CB',x:50,y:68},{pos:'CB',x:30,y:70},
    {pos:'RM',x:82,y:50},{pos:'CM',x:60,y:46},{pos:'CM',x:40,y:46},{pos:'LM',x:18,y:50},
    {pos:'RW',x:80,y:24},{pos:'ST',x:50,y:18},{pos:'LW',x:20,y:24},
  ],
};

/* ── Stat Bar ── */
function StatRow({ label, value }) {
  const color = value >= 85 ? '#f5c518' : value >= 75 ? '#00e87a' : value >= 60 ? '#3b82f6' : value >= 45 ? '#9aa3ae' : '#ff3b5c';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', width:72, flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${value}%`, background:color, borderRadius:2, transition:'width 0.4s var(--ease)' }} />
      </div>
      <span style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, color, width:28, textAlign:'right', flexShrink:0 }}>{value}</span>
    </div>
  );
}

/* ── Player Bottom Sheet ── */
function PlayerSheet({ player, onClose, isOwned, onSell }) {
  const sellFee = Math.round((player.value || 0) * 0.8);
  const pc = posColor(player.position);
  const oc = ovrColor(player.overall);

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:300,
        animation:'fadeIn 0.2s ease',
      }} />
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:301,
        background:'var(--bg-2)', borderTop:'1px solid var(--border-mid)',
        borderRadius:'16px 16px 0 0',
        maxHeight:'88vh', overflowY:'auto',
        animation:'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
        paddingBottom:'max(24px, env(safe-area-inset-bottom))',
      }}>
        {/* drag handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
        </div>

        <div style={{ padding:'0 20px 20px' }}>

          {/* ── Header ── */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{
                  background:`${pc}22`, border:`1px solid ${pc}55`,
                  borderRadius:4, padding:'2px 8px',
                  fontFamily:'var(--font-mono)', fontSize:10, color:pc, letterSpacing:2,
                }}>{player.position}</span>
                <img
                  src={`https://flagcdn.com/w20/${nationalityToCode(player.nationality)}.png`}
                  alt={player.nationality}
                  style={{ height:12, borderRadius:1 }}
                  onError={e => e.target.style.display='none'}
                />
                <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', letterSpacing:1 }}>{player.nationality}</span>
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color:'var(--text)', letterSpacing:0.5, lineHeight:1 }}>{player.name}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{player.club}</div>
            </div>
            <div style={{ textAlign:'center', flexShrink:0, marginLeft:16 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:900, color:oc, lineHeight:1 }}>{player.overall}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>OVR</div>
            </div>
          </div>

          {/* ── Details grid ── */}
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:18,
            background:'var(--bg-3)', borderRadius:8, padding:'12px',
            border:'1px solid var(--border)',
          }}>
            {[
              ['Age',    player.age || '—'],
              ['Height', player.height || '—'],
              ['Weight', player.weight || '—'],
              ['Value',  fmtVal(player.value)],
              ['Wage',   player.wage ? `${fmtVal(player.wage)}/w` : '—'],
              ['Foot',   player.foot || 'Right'],
            ].map(([label, val]) => (
              <div key={label} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color:'var(--text)', lineHeight:1.2 }}>{val}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', marginTop:3 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ── Stats ── */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>Attributes</div>
            <StatRow label="Pace"      value={player.pace      || 50} />
            <StatRow label="Shooting"  value={player.shooting  || 50} />
            <StatRow label="Passing"   value={player.passing   || 50} />
            <StatRow label="Dribbling" value={player.dribbling || 50} />
            <StatRow label="Defending" value={player.defending || 50} />
            <StatRow label="Physical"  value={player.physical  || 50} />
          </div>

          {/* ── Actions ── */}
          {isOwned ? (
            <button
              onClick={() => { onSell(player, sellFee); onClose(); }}
              style={{
                width:'100%', padding:'14px', borderRadius:8,
                background:'rgba(255,59,92,0.12)', border:'1px solid rgba(255,59,92,0.35)',
                color:'var(--red)', fontFamily:'var(--font-display)', fontSize:15, fontWeight:700,
                letterSpacing:1, cursor:'pointer', transition:'background 0.15s',
              }}
            >
              Sell for {fmtVal(sellFee)}
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                width:'100%', padding:'14px', borderRadius:8,
                background:'rgba(0,232,122,0.1)', border:'1px solid rgba(0,232,122,0.3)',
                color:'var(--green)', fontFamily:'var(--font-display)', fontSize:15, fontWeight:700,
                letterSpacing:1, cursor:'pointer',
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* nationality → ISO 2-letter country code */
function nationalityToCode(nat) {
  const map = {
    'England':'gb-eng','France':'fr','Spain':'es','Germany':'de','Brazil':'br',
    'Argentina':'ar','Portugal':'pt','Belgium':'be','Netherlands':'nl','Italy':'it',
    'Norway':'no','Poland':'pl','Senegal':'sn','Egypt':'eg','Nigeria':'ng',
    'Cameroon':'cm','Morocco':'ma','Algeria':'dz','Uruguay':'uy','Colombia':'co',
    'Chile':'cl','Mexico':'mx','USA':'us','Canada':'ca','Japan':'jp',
    'South Korea':'kr','Australia':'au','Croatia':'hr','Denmark':'dk',
    'Sweden':'se','Switzerland':'ch','Austria':'at','Scotland':'gb-sct',
    'Wales':'gb-wls','Ireland':'ie','Czech Republic':'cz','Slovakia':'sk',
    'Hungary':'hu','Romania':'ro','Serbia':'rs','Slovenia':'si','Albania':'al',
    'Ukraine':'ua','Turkey':'tr','Greece':'gr','Russia':'ru',
  };
  return map[nat] || 'un';
}

/* ── Pitch SVG for Tactics ── */
function PitchFormation({ formation, squad }) {
  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];
  const sorted = [...(squad || [])].sort((a,b) => b.overall - a.overall);

  return (
    <div style={{ position:'relative', width:'100%', paddingBottom:'140%', background:'#1a3a1a', borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
      {/* pitch markings */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 100 140" preserveAspectRatio="none">
        {/* outer */}
        <rect x="2" y="2" width="96" height="136" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
        {/* centre line */}
        <line x1="2" y1="70" x2="98" y2="70" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
        {/* centre circle */}
        <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
        <circle cx="50" cy="70" r="0.8" fill="rgba(255,255,255,0.2)"/>
        {/* penalty areas */}
        <rect x="22" y="2" width="56" height="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
        <rect x="22" y="118" width="56" height="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
        {/* 6-yard boxes */}
        <rect x="36" y="2" width="28" height="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
        <rect x="36" y="130" width="28" height="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
      </svg>

      {/* player dots */}
      {positions.map((slot, i) => {
        const player = sorted[i];
        const pc = posColor(slot.pos);
        return (
          <div key={i} style={{
            position:'absolute',
            left:`${slot.x}%`, top:`${slot.y}%`,
            transform:'translate(-50%,-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            zIndex:2,
          }}>
            <div style={{
              width:28, height:28, borderRadius:'50%',
              background:`linear-gradient(135deg, ${pc}33, ${pc}66)`,
              border:`1.5px solid ${pc}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-display)', fontSize:9, fontWeight:800, color:'#fff',
              boxShadow:`0 0 8px ${pc}44`,
            }}>
              {player ? player.overall : '?'}
            </div>
            <div style={{
              fontFamily:'var(--font-display)', fontSize:8, fontWeight:700,
              color:'rgba(255,255,255,0.9)',
              background:'rgba(0,0,0,0.65)', borderRadius:3, padding:'1px 4px',
              whiteSpace:'nowrap', maxWidth:48, overflow:'hidden', textOverflow:'ellipsis',
              letterSpacing:0.3,
            }}>
              {player ? player.name.split(' ').pop() : slot.pos}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function Club() {
  const { squad, allPlayers, formation, setFormation, buyPlayer, sellPlayer, budget, myClub } = useGameStore();
  const [tab, setTab] = useState('squad');
  const [posFilter, setPosFilter] = useState('ALL');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [transferSearch, setTransferSearch] = useState('');
  const [transferPos, setTransferPos] = useState('ALL');

  const squadIds = useMemo(() => new Set((squad || []).map(p => p.id)), [squad]);

  const filteredSquad = useMemo(() => {
    if (!squad) return [];
    if (posFilter === 'ALL') return squad;
    return squad.filter(p => posGroup(p.position) === posFilter);
  }, [squad, posFilter]);

  const transferPlayers = useMemo(() => {
    return (allPlayers || []).filter(p => {
      if (squadIds.has(p.id)) return false;
      if (transferPos !== 'ALL' && posGroup(p.position) !== transferPos) return false;
      if (transferSearch && !p.name.toLowerCase().includes(transferSearch.toLowerCase()) && !p.club.toLowerCase().includes(transferSearch.toLowerCase())) return false;
      return true;
    }).slice(0, 40);
  }, [allPlayers, squadIds, transferPos, transferSearch]);

  const TABS = ['squad','tactics','transfers','youth','training'];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        .club-tab-btn { background:none; border:none; cursor:pointer; font-family:var(--font-mono); font-size:9px; letter-spacing:1.5px; text-transform:uppercase; padding:8px 12px; border-radius:6px; transition:all 0.15s; white-space:nowrap; -webkit-tap-highlight-color:transparent; }
        .club-tab-btn.active { background:var(--green); color:#000; }
        .club-tab-btn:not(.active) { color:var(--text-muted); }
        .pos-btn { background:none; border:1px solid var(--border); cursor:pointer; font-family:var(--font-mono); font-size:9px; letter-spacing:1.5px; text-transform:uppercase; padding:5px 10px; border-radius:20px; transition:all 0.15s; -webkit-tap-highlight-color:transparent; }
        .pos-btn.active { border-color:var(--green); color:var(--green); background:rgba(0,232,122,0.08); }
        .pos-btn:not(.active) { color:var(--text-muted); }
        .player-row { display:flex; align-items:center; gap:10px; padding:10px 16px; border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.12s; -webkit-tap-highlight-color:transparent; }
        .player-row:active { background:rgba(255,255,255,0.03); }
        .transfer-row { display:flex; align-items:center; gap:10px; padding:10px 16px; border-bottom:1px solid var(--border); }
        .formation-btn { background:none; border:1px solid var(--border); cursor:pointer; font-family:var(--font-display); font-size:13px; font-weight:700; padding:6px 14px; border-radius:6px; transition:all 0.15s; letter-spacing:0.5px; -webkit-tap-highlight-color:transparent; }
        .formation-btn.active { border-color:var(--green); color:var(--green); background:rgba(0,232,122,0.08); }
        .formation-btn:not(.active) { color:var(--text-muted); }
        .buy-btn { background:rgba(0,232,122,0.1); border:1px solid rgba(0,232,122,0.3); color:var(--green); font-family:var(--font-display); font-size:11px; font-weight:700; padding:5px 10px; border-radius:5px; cursor:pointer; white-space:nowrap; letter-spacing:0.5px; transition:background 0.15s; }
        .buy-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .transfer-search { width:100%; background:var(--bg-3); border:1px solid var(--border); border-radius:8px; padding:10px 14px; color:var(--text); font-family:var(--font-body); font-size:13px; outline:none; }
        .transfer-search::placeholder { color:var(--text-muted); }
        .transfer-search:focus { border-color:var(--border-mid); }
      `}</style>

      <div style={{ minHeight:'100vh', background:'var(--bg-1)', paddingBottom:80 }}>

        {/* ── Tab Bar ── */}
        <div style={{
          display:'flex', gap:4, overflowX:'auto', padding:'12px 12px 0',
          scrollbarWidth:'none', msOverflowStyle:'none',
          borderBottom:'1px solid var(--border)',
          background:'var(--bg-1)',
          position:'sticky', top:52, zIndex:10,
        }}>
          {TABS.map(t => (
            <button key={t} className={`club-tab-btn${tab===t?' active':''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {/* ══════════ SQUAD TAB ══════════ */}
        {tab === 'squad' && (
          <div>
            {/* pos filter */}
            <div style={{ display:'flex', gap:6, padding:'10px 16px', overflowX:'auto', scrollbarWidth:'none' }}>
              {['ALL','GK','DEF','MID','FWD'].map(f => (
                <button key={f} className={`pos-btn${posFilter===f?' active':''}`} onClick={() => setPosFilter(f)}>{f}</button>
              ))}
            </div>

            {/* header */}
            <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 36px 36px 56px', gap:6, padding:'6px 16px', borderBottom:'1px solid var(--border)' }}>
              {['POS','Player','OVR','AGE','VALUE'].map(h => (
                <span key={h} style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', textAlign: h==='Player'?'left':'center' }}>{h}</span>
              ))}
            </div>

            {filteredSquad.map(player => {
              const pc = posColor(player.position);
              const oc = ovrColor(player.overall);
              return (
                <div key={player.id} className="player-row" onClick={() => setSelectedPlayer({ player, isOwned:true })}>
                  <div style={{
                    width:32, height:20, borderRadius:3, flexShrink:0,
                    background:`${pc}18`, border:`1px solid ${pc}44`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-mono)', fontSize:8, color:pc, letterSpacing:1,
                  }}>{player.position}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{player.name}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:0.5, marginTop:1 }}>{player.nationality}</div>
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, color:oc }}>{player.overall}</span>
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:13, color:'var(--text-dim)' }}>{player.age}</span>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--text-muted)' }}>{fmtVal(player.value)}</span>
                  </div>
                </div>
              );
            })}

            {filteredSquad.length === 0 && (
              <div style={{ padding:'40px 16px', textAlign:'center', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>
                No players
              </div>
            )}
          </div>
        )}

        {/* ══════════ TACTICS TAB ══════════ */}
        {tab === 'tactics' && (
          <div style={{ padding:'16px' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>Formation</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
              {FORMATIONS.map(f => (
                <button key={f} className={`formation-btn${formation===f?' active':''}`} onClick={() => setFormation(f)}>{f}</button>
              ))}
            </div>
            <PitchFormation formation={formation} squad={squad} />
            <div style={{ marginTop:12, display:'flex', justifyContent:'center' }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>
                Players sorted by overall rating
              </span>
            </div>
          </div>
        )}

        {/* ══════════ TRANSFERS TAB ══════════ */}
        {tab === 'transfers' && (
          <div>
            <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
              <input
                className="transfer-search"
                placeholder="Search player or club..."
                value={transferSearch}
                onChange={e => setTransferSearch(e.target.value)}
              />
              <div style={{ display:'flex', gap:6 }}>
                {['ALL','GK','DEF','MID','FWD'].map(f => (
                  <button key={f} className={`pos-btn${transferPos===f?' active':''}`} onClick={() => setTransferPos(f)}>{f}</button>
                ))}
              </div>
            </div>

            {/* budget banner */}
            <div style={{ margin:'0 16px 12px', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>Transfer Budget</span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, color:'var(--green)' }}>{fmtVal(budget)}</span>
            </div>

            {/* header */}
            <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 36px 80px 70px', gap:6, padding:'6px 16px', borderBottom:'1px solid var(--border)' }}>
              {['POS','Player','OVR','Club','Fee'].map(h => (
                <span key={h} style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', textAlign: h==='Player'?'left':'center' }}>{h}</span>
              ))}
            </div>

            {transferPlayers.map(player => {
              const pc = posColor(player.position);
              const oc = ovrColor(player.overall);
              const fee = player.value || 0;
              const canAfford = budget >= fee;
              return (
                <div key={player.id} className="transfer-row">
                  <div style={{
                    width:32, height:20, borderRadius:3, flexShrink:0,
                    background:`${pc}18`, border:`1px solid ${pc}44`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-mono)', fontSize:8, color:pc, letterSpacing:1,
                  }}>{player.position}</div>
                  <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => setSelectedPlayer({ player, isOwned:false })}>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{player.name}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:0.5, marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{player.club}</div>
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, color:oc }}>{player.overall}</span>
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--text-muted)' }}>{fmtVal(fee)}</span>
                  </div>
                  <div style={{ flexShrink:0 }}>
                    <button
                      className="buy-btn"
                      disabled={!canAfford}
                      onClick={() => { buyPlayer(player, fee); }}
                    >
                      {canAfford ? 'Buy' : 'No funds'}
                    </button>
                  </div>
                </div>
              );
            })}

            {transferPlayers.length === 0 && (
              <div style={{ padding:'40px 16px', textAlign:'center', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>
                No players found
              </div>
            )}
          </div>
        )}

        {/* ══════════ YOUTH TAB ══════════ */}
        {tab === 'youth' && (
          <div style={{ padding:'40px 20px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--text-muted)', letterSpacing:1, marginBottom:8 }}>Youth Academy</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-muted)' }}>Coming in a future update</div>
          </div>
        )}

        {/* ══════════ TRAINING TAB ══════════ */}
        {tab === 'training' && (
          <div style={{ padding:'40px 20px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--text-muted)', letterSpacing:1, marginBottom:8 }}>Training Ground</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-muted)' }}>Coming in a future update</div>
          </div>
        )}

      </div>

      {/* ══════════ PLAYER BOTTOM SHEET ══════════ */}
      {selectedPlayer && (
        <PlayerSheet
          player={selectedPlayer.player}
          isOwned={selectedPlayer.isOwned}
          onClose={() => setSelectedPlayer(null)}
          onSell={(player, fee) => sellPlayer(player, fee)}
        />
      )}
    </>
  );
}