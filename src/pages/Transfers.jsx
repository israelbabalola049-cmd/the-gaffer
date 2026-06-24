import React, { useState, useMemo } from 'react';
import useGameStore from '../store/gameStore';
import { CLUB_COLOR, fmt } from '../components/Layout';

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const POS_COLOR = {
  GK:'#f5c518', DEF:'#3b82f6', CB:'#3b82f6', LB:'#3b82f6', RB:'#3b82f6', LWB:'#3b82f6', RWB:'#3b82f6',
  MID:'#00e87a', CM:'#00e87a', CDM:'#00e87a', CAM:'#00e87a', LM:'#00e87a', RM:'#00e87a', DM:'#00e87a',
  FWD:'#ff3b5c', ST:'#ff3b5c', LW:'#ff3b5c', RW:'#ff3b5c', CF:'#ff3b5c',
};
const posColor = (pos) => POS_COLOR[pos] || '#9aa3ae';
const posGroup = (pos) => {
  if (!pos) return 'MID';
  if (pos === 'GK') return 'GK';
  if (['DEF','CB','LB','RB','LWB','RWB'].includes(pos)) return 'DEF';
  if (['MID','CM','CDM','CAM','LM','RM','DM','AM'].includes(pos)) return 'MID';
  return 'FWD';
};
const ovrColor = (o) => o >= 85 ? '#f5c518' : o >= 75 ? '#00e87a' : o >= 65 ? '#3b82f6' : '#9aa3ae';

function natCode(nat) {
  const map = { 'England':'gb-eng','France':'fr','Spain':'es','Germany':'de','Brazil':'br','Argentina':'ar','Portugal':'pt','Belgium':'be','Netherlands':'nl','Italy':'it','Norway':'no','Poland':'pl','Senegal':'sn','Egypt':'eg','Nigeria':'ng','Cameroon':'cm','Morocco':'ma','Algeria':'dz','Uruguay':'uy','Colombia':'co','Japan':'jp','South Korea':'kr','Croatia':'hr','Denmark':'dk','Sweden':'se','Switzerland':'ch','Scotland':'gb-sct','Wales':'gb-wls','Ireland':'ie','USA':'us','Mexico':'mx' };
  return map[nat] || 'un';
}

/* ── Scout helpers ── */
const SCOUT_REGIONS   = ['Europe','S. America','Africa','Asia','N. America'];
const SCOUT_POSITIONS = ['Any','GK','DEF','MID','FWD'];
const SCOUT_DURATIONS = [{ label:'1W', weeks:1, quality:'Basic' },{ label:'2W', weeks:2, quality:'Standard' },{ label:'3W', weeks:3, quality:'Premium' }];
const SCOUT_NATS = { 'Europe':['England','France','Spain','Germany','Portugal','Belgium','Netherlands','Italy','Norway','Denmark'],'S. America':['Brazil','Argentina','Uruguay','Colombia'],'Africa':['Nigeria','Senegal','Egypt','Morocco','Cameroon'],'Asia':['Japan','South Korea'],'N. America':['USA','Mexico'] };
const SCOUT_CLUBS = ['Real Madrid','Barcelona','Manchester City','Liverpool','Arsenal','Chelsea','Bayern Munich','PSG','AC Milan','Inter Milan','Atletico Madrid','Borussia Dortmund','Tottenham','Aston Villa'];
const SCOUT_FIRST = ['Luca','Marco','Rafael','Kai','Erling','Kylian','Vinicius','Pedri','Jude','Phil','Bukayo','Declan','Bruno','Lautaro','Victor','Theo','Ferran','Khvicha','Takumi','Randal'];
const SCOUT_LAST  = ['Silva','Salah','Bellingham','Saka','Havertz','Odegaard','Haaland','Kane','Son','Rice','Fernandes','De Bruyne','Martinez','Osimhen','Hakimi','Camavinga','Valverde','Olmo','Musiala','Guirassy'];
const POS_BY_GROUP = { Any:['GK','CB','LB','RB','CM','CDM','CAM','LW','RW','ST','CF'], GK:['GK'], DEF:['CB','LB','RB'], MID:['CM','CDM','CAM','LM','RM'], FWD:['ST','LW','RW','CF'] };

function seededRand(seed) { let s = seed; return () => { s = (s*9301+49297)%233280; return s/233280; }; }

function genScoutResults(id, region, pos, quality) {
  const rand = seededRand(id);
  const count = quality==='Basic'?3:quality==='Standard'?5:8;
  const nats = SCOUT_NATS[region] || SCOUT_NATS['Europe'];
  const positions = POS_BY_GROUP[pos] || POS_BY_GROUP['Any'];
  return Array.from({ length:count }, (_, i) => {
    const ovr = Math.floor(rand()*25)+65;
    const val = Math.floor((ovr-60)*(ovr-60)*1200*(rand()*0.4+0.8));
    return { id:`sr_${id}_${i}`, name:`${SCOUT_FIRST[Math.floor(rand()*SCOUT_FIRST.length)]} ${SCOUT_LAST[Math.floor(rand()*SCOUT_LAST.length)]}`, position:positions[Math.floor(rand()*positions.length)], nationality:nats[Math.floor(rand()*nats.length)], club:SCOUT_CLUBS[Math.floor(rand()*SCOUT_CLUBS.length)], overall:ovr, potential:Math.min(99,ovr+Math.floor(rand()*12)), age:Math.floor(rand()*14)+19, value:val, wage:Math.floor(val/52/1000)*1000, pace:Math.min(99,Math.floor(rand()*25)+ovr-10), shooting:Math.min(99,Math.floor(rand()*25)+ovr-12), passing:Math.min(99,Math.floor(rand()*20)+ovr-8), defending:Math.min(99,Math.floor(rand()*25)+ovr-14), physical:Math.min(99,Math.floor(rand()*20)+ovr-8) };
  });
}

/* ─────────────────────────────────────────
   SMALL SHARED COMPONENTS
───────────────────────────────────────── */
const BoxLabel = ({ text, accent }) => (
  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, flexShrink:0 }}>
    <div style={{ width:2, height:10, background: accent||'#556070', flexShrink:0 }} />
    <span style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', color:'#556070', letterSpacing:3, textTransform:'uppercase' }}>{text}</span>
  </div>
);

const Pill = ({ text, active, accent, onClick, small }) => (
  <button onClick={onClick} style={{ padding: small?'2px 6px':'3px 8px', background: active?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${active?accent:'rgba(255,255,255,0.07)'}`, color: active?accent:'#556070', fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', letterSpacing:0.5, cursor:'pointer', transition:'all 0.12s', flexShrink:0 }}>
    {text}
  </button>
);

const StatBar = ({ label, value }) => {
  const color = value>=85?'#f5c518':value>=75?'#00e87a':value>=65?'#3b82f6':'#9aa3ae';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070', letterSpacing:1, width:24, textTransform:'uppercase', flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, height:2, background:'rgba(255,255,255,0.07)' }}><div style={{ width:`${value}%`, height:'100%', background:color }} /></div>
      <span style={{ fontFamily:"var(--font-display)", fontSize:10, fontWeight:700, color, width:20, textAlign:'right' }}>{value}</span>
    </div>
  );
};

/* ── Player row used across multiple boxes ── */
function PlayerRow({ player, index, selected, accent, onClick, extra }) {
  const isSel = selected?.id === player.id;
  return (
    <div onClick={onClick} style={{ display:'grid', gridTemplateColumns:`18px 1fr 26px 24px 30px${extra?' 50px':''}`, padding:'4px 8px', alignItems:'center', cursor:'pointer', background: isSel?`${accent}12`:'transparent', borderLeft: isSel?`2px solid ${accent}`:'2px solid transparent', borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background 0.1s' }}
      onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background='rgba(255,255,255,0.025)'; }}
      onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background='transparent'; }}
    >
      <span style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070' }}>{index+1}</span>
      <div style={{ minWidth:0 }}>
        <div style={{ fontFamily:"var(--font-display)", fontSize:10, fontWeight:700, color:'#f0f2f5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:0.2 }}>{player.name}</div>
        {player.club && <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{player.club}</div>}
      </div>
      <span style={{ fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, color:ovrColor(player.overall) }}>{player.overall}</span>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#9aa3b2' }}>{player.age}</span>
      <span style={{ fontFamily:"var(--font-display)", fontSize:8, fontWeight:700, color:posColor(player.position) }}>{player.position}</span>
      {extra && <span style={{ fontFamily:"var(--font-display)", fontSize:9, fontStyle:'italic', color:'#9aa3b2', textAlign:'right' }}>{extra(player)}</span>}
    </div>
  );
}

/* ── Floating detail card (shown when a player is selected) ── */
function DetailCard({ player, accent, budget, mode, onAction, onShortlist, shortlisted, onClose }) {
  if (!player) return null;
  const canAfford = budget >= (player.value||0);
  return (
    <div style={{ position:'absolute', right:0, top:0, bottom:0, width:200, background:'rgba(7,10,15,0.97)', borderLeft:'1px solid rgba(255,255,255,0.1)', display:'flex', flexDirection:'column', overflow:'hidden', zIndex:10, animation:'trFadeIn 0.15s ease' }}>
      <div style={{ padding:'8px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:36, height:36, background:`linear-gradient(135deg,${ovrColor(player.overall)}22,${ovrColor(player.overall)}44)`, border:`1px solid ${ovrColor(player.overall)}55`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"var(--font-display)", fontSize:16, fontWeight:900, color:ovrColor(player.overall), flexShrink:0 }}>{player.overall}</div>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:12, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', lineHeight:1.1 }}>{player.name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
              <span style={{ fontFamily:"var(--font-display)", fontSize:8, fontWeight:700, color:posColor(player.position), background:`${posColor(player.position)}18`, border:`1px solid ${posColor(player.position)}33`, padding:'1px 4px' }}>{player.position}</span>
              {player.nationality && <img src={`https://flagcdn.com/16x12/${natCode(player.nationality)}.png`} alt="" style={{ height:8 }} onError={e=>e.target.style.display='none'} />}
              {player.age && <span style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070' }}>{player.age}y</span>}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ width:18, height:18, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#556070', fontSize:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
      </div>

      <div style={{ padding:'8px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, display:'flex', flexDirection:'column', gap:4 }}>
        {player.pace      != null && <StatBar label="PAC" value={player.pace} />}
        {player.shooting  != null && <StatBar label="SHO" value={player.shooting} />}
        {player.passing   != null && <StatBar label="PAS" value={player.passing} />}
        {player.defending != null && <StatBar label="DEF" value={player.defending} />}
        {player.physical  != null && <StatBar label="PHY" value={player.physical} />}
        {player.potential != null && <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}><span style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070', letterSpacing:1, width:24 }}>POT</span><span style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:900, color:accent }}>↑{player.potential}</span></div>}
      </div>

      {player.value && (
        <div style={{ padding:'6px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070', letterSpacing:2, textTransform:'uppercase' }}>Value</div>
          <div style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:900, fontStyle:'italic', color: mode==='sell'?'#f5c518':canAfford?'#00e87a':'#ff3b5c' }}>{fmt(player.value)}</div>
          {player.wage && <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070', marginTop:1 }}>{fmt(player.wage)} / wk</div>}
        </div>
      )}

      <div style={{ padding:'8px 10px', display:'flex', flexDirection:'column', gap:5 }}>
        {mode === 'buy' && (
          <button onClick={()=>onAction(player)} disabled={!canAfford} style={{ width:'100%', padding:'6px', background: canAfford?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${canAfford?accent:'rgba(255,255,255,0.1)'}`, color: canAfford?accent:'#556070', fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, fontStyle:'italic', letterSpacing:2, textTransform:'uppercase', cursor: canAfford?'pointer':'not-allowed' }}>
            {canAfford?`Sign — ${fmt(player.value)}`:'No Budget'}
          </button>
        )}
        {mode === 'sell' && (
          <button onClick={()=>onAction(player)} style={{ width:'100%', padding:'6px', background:'rgba(255,59,92,0.08)', border:'1px solid rgba(255,59,92,0.25)', color:'#ff3b5c', fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, fontStyle:'italic', letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
            Sell — {fmt(player.value)}
          </button>
        )}
        {mode === 'promote' && (
          <button onClick={()=>onAction(player)} style={{ width:'100%', padding:'6px', background:`${accent}22`, border:`1px solid ${accent}55`, color:accent, fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, fontStyle:'italic', letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
            Promote
          </button>
        )}
        {(mode === 'buy' || mode === 'scout') && (
          <button onClick={()=>onShortlist(player)} style={{ width:'100%', padding:'5px', background: shortlisted?'rgba(255,59,92,0.08)':'rgba(255,255,255,0.03)', border:`1px solid ${shortlisted?'rgba(255,59,92,0.3)':'rgba(255,255,255,0.07)'}`, color: shortlisted?'#ff3b5c':'#556070', fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', letterSpacing:1.5, textTransform:'uppercase', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill={shortlisted?'#ff3b5c':'none'} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {shortlisted?'Unsave':'Shortlist'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   BENTO BOX WRAPPER
───────────────────────────────────────── */
const BentoBox = ({ children, style = {} }) => (
  <div style={{ background:'rgba(7,10,15,0.82)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', ...style }}>
    {children}
  </div>
);

const BoxHeader = ({ label, accent, right }) => (
  <div style={{ padding:'7px 10px 6px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <div style={{ width:2, height:10, background:accent, flexShrink:0 }} />
      <span style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', color:'rgba(255,255,255,0.4)', letterSpacing:3, textTransform:'uppercase' }}>{label}</span>
    </div>
    {right}
  </div>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
/* ── Search Players Section ── */
function SearchSection({ section, allPlayers, accent, shortlist, budget, handleBuy, toggleShortlist,
  searchScreen, setSearchScreen, sfName, setSfName, sfPos, setSfPos, sfNat, setSfNat,
  sfTeam, setSfTeam, sfLeague, setSfLeague, sfAge, setSfAge, sfStatus, setSfStatus,
  sfResTabs, setSfResTabs, sfSel, setSfSel, sfResults, setSfResults }) {

  const sfLeagues = React.useMemo(()=>['Any',...new Set((allPlayers||[]).map(p=>p.league||p.club).filter(Boolean))].slice(0,20),[allPlayers]);
  const sfNats    = React.useMemo(()=>['Any',...new Set((allPlayers||[]).map(p=>p.nationality).filter(Boolean))].sort(),[allPlayers]);
  const sfTeams   = React.useMemo(()=>['Any',...new Set((allPlayers||[]).map(p=>p.club).filter(Boolean))].sort(),[allPlayers]);

  const runSearch = () => {
    let res = allPlayers||[];
    if (sfName)         res = res.filter(p=>p.name?.toLowerCase().includes(sfName.toLowerCase()));
    if (sfPos!=='Any')  res = res.filter(p=>posGroup(p.position)===sfPos);
    if (sfNat!=='Any')  res = res.filter(p=>p.nationality===sfNat);
    if (sfTeam!=='Any') res = res.filter(p=>p.club===sfTeam);
    res = res.filter(p=>(p.age||22)>=sfAge[0] && (p.age||22)<=sfAge[1]);
    return res.sort((a,b)=>b.overall-a.overall).slice(0,60);
  };
  const handleSubmit = () => { setSfResults(runSearch()); setSearchScreen('results'); setSfSel(null); };

  const tabFiltered = searchScreen==='results' ? (
    sfResTabs==='ALL' ? sfResults :
    sfResTabs==='ATT' ? sfResults.filter(p=>['ST','CF','LW','RW','FWD'].includes(p.position)) :
    sfResTabs==='MID' ? sfResults.filter(p=>['CM','CAM','CDM','LM','RM','DM','AM'].includes(p.position)) :
    sfResTabs==='DEF' ? sfResults.filter(p=>['CB','LB','RB','LWB','RWB'].includes(p.position)) :
    sfResults.filter(p=>p.position==='GK')
  ) : [];
  const sfSelPlayer = tabFiltered.find(p=>p.id===sfSel)||null;

  return (
    <BentoBox style={{ gridColumn: section?'1':'2', gridRow:'1', padding:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {searchScreen === 'filters' && (
        <>
          <div style={{ padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070', letterSpacing:2, textTransform:'uppercase' }}>Transfers</span>
            <span style={{ color:'#3b4555' }}>›</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:accent, letterSpacing:2, textTransform:'uppercase' }}>Search</span>
          </div>
          <div style={{ flex:1, padding:10, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gridTemplateRows:'repeat(2,1fr)', gap:8, overflow:'hidden' }}>
            {[
              { label:'Player Name', i:0, extra: <input value={sfName} onChange={e=>setSfName(e.target.value)} placeholder="Any" style={{ width:'100%', background:'rgba(0,0,0,0.3)', border:`1px solid ${accent}44`, color:'#f0f2f5', fontFamily:"var(--font-display)", fontSize:11, fontStyle:'italic', fontWeight:700, padding:'4px 8px', outline:'none', marginTop:6 }} /> },
              { label:'Position',    i:1, value: sfPos,    onClick: ()=>setSfPos(['Any','ATT','MID','DEF','GK'][['Any','ATT','MID','DEF','GK'].indexOf(sfPos)+1]||'Any') },
              { label:'Nationality', i:2, value: sfNat,    dropdown: sfNats,    setter: setSfNat },
              { label:'Transfer Status', i:3, value: sfStatus, onClick: ()=>setSfStatus(sfStatus==='Any'?'Transfer Listed':'Any') },
              { label:'Age Range',   i:4, ageSlider: true },
              { label:'League',      i:5, value: sfLeague, dropdown: sfLeagues, setter: setSfLeague },
              { label:'Team',        i:6, value: sfTeam,   dropdown: sfTeams,   setter: setSfTeam },
            ].map((f)=>(
              <div key={f.i} onClick={f.onClick} style={{ background: f.i===0?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${f.i===0?accent:'rgba(255,255,255,0.08)'}`, padding:'10px 12px', cursor: f.onClick?'pointer':'default', display:'flex', flexDirection:'column', justifyContent:'space-between', overflow:'hidden' }}>
                <div style={{ fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, fontStyle:'italic', color: f.i===0?accent:'#9aa3b2', letterSpacing:1, textTransform:'uppercase' }}>{f.label}</div>
                {f.extra}
                {f.ageSlider && (
                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:6 }}>
                    {[['Min',0],['Max',1]].map(([lbl,idx])=>(
                      <div key={lbl} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070' }}>{lbl}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <button onClick={e=>{e.stopPropagation();setSfAge(a=>{const n=[...a];n[idx]=Math.max(idx===0?14:sfAge[0],n[idx]-1);return n;})}} style={{ width:18,height:18,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#9aa3b2',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1 }}>-</button>
                          <span style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:900, color:'#f0f2f5', width:24, textAlign:'center' }}>{sfAge[idx]}</span>
                          <button onClick={e=>{e.stopPropagation();setSfAge(a=>{const n=[...a];n[idx]=Math.min(idx===1?50:sfAge[1],n[idx]+1);return n;})}} style={{ width:18,height:18,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#9aa3b2',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1 }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {f.dropdown && (
                  <select value={f.value} onChange={e=>{e.stopPropagation();f.setter(e.target.value);}} onClick={e=>e.stopPropagation()} style={{ marginTop:6, width:'100%', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', color:'#f0f2f5', fontFamily:"var(--font-display)", fontSize:10, fontStyle:'italic', fontWeight:700, padding:'3px 6px', cursor:'pointer', outline:'none', appearance:'none' }}>
                    {f.dropdown.map(o=><option key={o} value={o} style={{background:'#0c1018'}}>{o}</option>)}
                  </select>
                )}
                {!f.extra && !f.ageSlider && !f.dropdown && (
                  <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', marginTop:4 }}>{f.value}</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding:'8px 10px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:8, flexShrink:0 }}>
            <button onClick={()=>{setSfName('');setSfPos('Any');setSfNat('Any');setSfTeam('Any');setSfLeague('Any');setSfAge([16,45]);setSfStatus('Any');}} style={{ padding:'8px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#556070', fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, fontStyle:'italic', letterSpacing:1, textTransform:'uppercase', cursor:'pointer' }}>Reset</button>
            <button onClick={handleSubmit} style={{ flex:1, padding:'8px', background:`${accent}22`, border:`1px solid ${accent}55`, color:accent, fontFamily:"var(--font-display)", fontSize:11, fontWeight:900, fontStyle:'italic', letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>Submit Search</button>
          </div>
        </>
      )}
      {searchScreen === 'results' && (
        <>
          <div style={{ padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            <button onClick={()=>setSearchScreen('filters')} style={{ background:'none', border:'none', color:'#556070', cursor:'pointer', fontFamily:"var(--font-mono)", fontSize:8, letterSpacing:1, display:'flex', alignItems:'center', gap:4 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>Search
            </button>
            <span style={{ color:'#3b4555' }}>›</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:accent, letterSpacing:2, textTransform:'uppercase' }}>Results</span>
            <span style={{ marginLeft:'auto', fontFamily:"var(--font-mono)", fontSize:7, color:'#3b4555' }}>{sfResults.length} players</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', borderBottom:'2px solid rgba(255,255,255,0.07)', paddingLeft:4, flexShrink:0 }}>
            {['ALL','ATT','MID','DEF','GK'].map(t=>(
              <button key={t} onClick={()=>setSfResTabs(t)} style={{ padding:'7px 14px', background:'transparent', border:'none', borderBottom: sfResTabs===t?`2px solid ${accent}`:'2px solid transparent', marginBottom:'-2px', color: sfResTabs===t?'#f0f2f5':'#556070', fontFamily:"var(--font-display)", fontSize:9, fontWeight:900, fontStyle:'italic', letterSpacing:1, textTransform:'uppercase', cursor:'pointer', transition:'all 0.12s' }}>{t}</button>
            ))}
          </div>
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            <div style={{ width:'42%', flexShrink:0, display:'flex', flexDirection:'column', borderRight:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
              <div style={{ padding:'6px 10px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
                <span style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', textTransform:'uppercase' }}>Search Results</span>
              </div>
              <div style={{ flex:1, overflowY:'auto' }}>
                {tabFiltered.length===0 ? (
                  <div style={{ padding:16, textAlign:'center', fontFamily:"var(--font-mono)", fontSize:7, color:'#3b4555', letterSpacing:2 }}>NO RESULTS</div>
                ) : tabFiltered.map((p,i)=>{
                  const isSel=sfSel===p.id, isSL=shortlist.some(s=>s.id===p.id);
                  return (
                    <div key={p.id} onClick={()=>setSfSel(p.id)} className="tr-hov"
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', background: isSel?`${accent}12`:'transparent', borderLeft: isSel?`3px solid ${accent}`:'3px solid transparent', transition:'all 0.1s' }}>
                      <div style={{ width:32, height:32, background:`${posColor(p.position)}18`, border:`1px solid ${posColor(p.position)}33`, borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, color:ovrColor(p.overall) }}>{p.overall}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:700, color: isSel?'#f0f2f5':'#c8d0da', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                        <div style={{ display:'flex', gap:6, marginTop:2 }}>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:posColor(p.position) }}>{p.position}</span>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#3b4555' }}>Age {p.age}</span>
                        </div>
                      </div>
                      {isSL && <svg width="8" height="8" viewBox="0 0 24 24" fill={accent} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {!sfSelPlayer ? (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1e2a38" strokeWidth="1.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#1e2a38', letterSpacing:3, textTransform:'uppercase' }}>Select a player</span>
                </div>
              ) : (
                <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                  <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', position:'relative', overflow:'hidden', flexShrink:0 }}>
                    <div style={{ position:'absolute', right:-10, top:-14, fontFamily:"var(--font-display)", fontSize:120, fontWeight:900, color:'rgba(255,255,255,0.03)', lineHeight:1, userSelect:'none' }}>{sfSelPlayer.overall}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070' }}>{sfSelPlayer.club}</span>
                      <img src={`https://flagcdn.com/w20/${natCode(sfSelPlayer.nationality)}.png`} alt="" style={{ height:11, borderRadius:1, marginLeft:'auto' }} onError={e=>e.target.style.display='none'} />
                      <span style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', color:posColor(sfSelPlayer.position) }}>{sfSelPlayer.position}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
                      <div>
                        <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', lineHeight:1 }}>{sfSelPlayer.name}</div>
                        <div style={{ display:'flex', gap:12, marginTop:6 }}>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070' }}>Age {sfSelPlayer.age}</span>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070' }}>Foot {sfSelPlayer.foot||'Right'}</span>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:"var(--font-display)", fontSize:44, fontWeight:900, color:ovrColor(sfSelPlayer.overall), lineHeight:1 }}>{sfSelPlayer.overall}</div>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070', letterSpacing:2 }}>OVR</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:16, marginTop:10 }}>
                      {[['Value',sfSelPlayer.value?fmt(sfSelPlayer.value):'—'],['Wage',sfSelPlayer.wage?`£${(sfSelPlayer.wage/1e3).toFixed(0)}K/w`:'—'],['Release','—']].map(([l,v])=>(
                        <div key={l}>
                          <div style={{ fontFamily:"var(--font-display)", fontSize:12, fontWeight:700, fontStyle:'italic', color:'#d0d4da' }}>{v}</div>
                          <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#445060', letterSpacing:1, textTransform:'uppercase', marginTop:2 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex:1, overflowY:'auto', padding:'10px 16px' }}>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#445060', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Attributes</div>
                    {[['PAC',sfSelPlayer.pace??70],['SHO',sfSelPlayer.shooting??70],['PAS',sfSelPlayer.passing??70],['DRI',sfSelPlayer.dribbling??70],['DEF',sfSelPlayer.defending??70],['PHY',sfSelPlayer.physical??70]].map(([lbl,val])=>{
                      const c=val>=85?'#f5c518':val>=75?'#00e87a':val>=60?'#3b82f6':'#9aa3ae';
                      return (
                        <div key={lbl} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070', letterSpacing:1.5, width:28, flexShrink:0 }}>{lbl}</span>
                          <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                            <div style={{ width:`${val}%`, height:'100%', background:c, transition:'width 0.4s' }} />
                          </div>
                          <span style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:900, color:c, width:26, textAlign:'right', flexShrink:0 }}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:8, flexShrink:0 }}>
                    <button onClick={()=>handleBuy(sfSelPlayer)} style={{ flex:2, padding:'9px', background:`${accent}22`, border:`1px solid ${accent}55`, color:accent, fontFamily:"var(--font-display)", fontSize:11, fontWeight:900, fontStyle:'italic', letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>Make Offer</button>
                    <button onClick={()=>toggleShortlist(sfSelPlayer)} style={{ flex:1, padding:'9px', background: shortlist.some(s=>s.id===sfSelPlayer.id)?'rgba(255,59,92,0.08)':'rgba(255,255,255,0.04)', border:`1px solid ${shortlist.some(s=>s.id===sfSelPlayer.id)?'rgba(255,59,92,0.3)':'rgba(255,255,255,0.1)'}`, color: shortlist.some(s=>s.id===sfSelPlayer.id)?'#ff3b5c':'#9aa3b2', fontFamily:"var(--font-display)", fontSize:11, fontWeight:900, fontStyle:'italic', letterSpacing:1, textTransform:'uppercase', cursor:'pointer' }}>
                      {shortlist.some(s=>s.id===sfSelPlayer.id)?'Shortlisted ★':'Shortlist'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </BentoBox>
  );
}


/* ── Scout star rating helper ── */
function ScoutStars({ rating = 3, color = '#f5c518' }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width="9" height="9" viewBox="0 0 24 24" fill={i<=rating?color:'rgba(255,255,255,0.15)'} stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

/* ── ScoutSection component ── */
function ScoutSection({
  section, accent, week, budget,
  resolvedMissions, activeMissions, completedMissions,
  scoutRegion, setScoutRegion, scoutPos, setScoutPos,
  scoutDuration, setScoutDuration, sendScout,
  scoutScreen, setScoutScreen,
  activeScout, setActiveScout,
  scoutReportSel, setScoutReportSel,
  scoutReportTab, setScoutReportTab,
  scoutDeepPlayer, setScoutDeepPlayer,
  shortlist, toggleShortlist, handleBuy, fmt,
}) {

  /* Build 6 scout slots — fill from missions, pad with empty */
  const SCOUT_NAMES = ['Christiaan Boogaard','Brian Peters','Milan Van Den Bossche','Joshua Girault','Zander Poulsen','Bento Martins'];
  const SCOUT_REGIONS_DISPLAY = ['Europe','S. America','Africa','Asia','N. America','Oceania'];

  const slots = SCOUT_NAMES.map((name, i) => {
    const mission = resolvedMissions[i] || null;
    return {
      name,
      region: mission ? mission.region : SCOUT_REGIONS_DISPLAY[i],
      players: mission?.done ? mission.results.length : 0,
      active: mission && !mission.done,
      done: mission?.done || false,
      mission,
      rating: 3 + (i % 3),
      weeksLeft: mission && !mission.done ? mission.dueWeek - week : null,
    };
  });

  /* Active scout's mission results */
  const activeMission = activeScout !== null ? slots[activeScout]?.mission : null;
  const reportPlayers = activeMission?.results || [];
  const tabFiltered = scoutReportTab==='ALL' ? reportPlayers
    : scoutReportTab==='ATT' ? reportPlayers.filter(p=>['ST','CF','LW','RW','FWD'].includes(p.position))
    : scoutReportTab==='MID' ? reportPlayers.filter(p=>['CM','CAM','CDM','LM','RM','DM','AM'].includes(p.position))
    : scoutReportTab==='DEF' ? reportPlayers.filter(p=>['CB','LB','RB','LWB','RWB'].includes(p.position))
    : reportPlayers.filter(p=>p.position==='GK');

  /* Position breakdown for hub summary */
  const allFound = completedMissions.flatMap(m=>m.results||[]);
  const breakdown = {
    Strikers:    allFound.filter(p=>['ST','CF','FWD'].includes(p.position)).length,
    Midfielders: allFound.filter(p=>['CM','CAM','CDM','LM','RM','DM','AM'].includes(p.position)).length,
    Defenders:   allFound.filter(p=>['CB','LB','RB','LWB','RWB'].includes(p.position)).length,
    Goalkeepers: allFound.filter(p=>p.position==='GK').length,
  };

  const BG = 'rgba(255,255,255,0.03)';
  const BORDER = '1px solid rgba(255,255,255,0.08)';

  /* ── Scout deploy modal state ── */
  const [showDeployModal, setShowDeployModal] = React.useState(false);
  const [deploySlot,      setDeploySlot]      = React.useState(null);
  const [modalRegion,     setModalRegion]      = React.useState('Europe');
  const [modalPos,        setModalPos]         = React.useState('Any');
  const [modalDuration,   setModalDuration]    = React.useState(SCOUT_DURATIONS[1]);
  const [hoveredSlot,     setHoveredSlot]      = React.useState(null);

  // Sidebar shows the hovered or clicked scout's data
  const sidebarIdx  = hoveredSlot !== null ? hoveredSlot : activeScout;
  const sidebarSlot = sidebarIdx !== null ? slots[sidebarIdx] : null;
  const sidebarMission = sidebarSlot?.mission;
  const sidebarFound  = sidebarMission?.done ? sidebarMission.results : [];
  const sidebarBreakdown = {
    Strikers:    sidebarFound.filter(p=>['ST','CF','FWD'].includes(p.position)).length,
    Midfielders: sidebarFound.filter(p=>['CM','CAM','CDM','LM','RM','DM','AM'].includes(p.position)).length,
    Defenders:   sidebarFound.filter(p=>['CB','LB','RB','LWB','RWB'].includes(p.position)).length,
    Goalkeepers: sidebarFound.filter(p=>p.position==='GK').length,
  };
  const sidebarTotal = sidebarFound.length;

  const handleDeploy = () => {
    setScoutRegion(modalRegion);
    setScoutPos(modalPos);
    setScoutDuration(modalDuration);
    sendScout();
    setShowDeployModal(false);
  };

  /* ── Screen: HUB ── */
  if (scoutScreen === 'hub') return (
    <BentoBox style={{ gridColumn: section?'1':'3', gridRow: section?'1':'1/3', padding:0, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>

      {/* BG image */}
      <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1524015368236-bbf6f72545b6?auto=format&fit=crop&w=900&q=60')", backgroundSize:'cover', backgroundPosition:'center', opacity:0.08, pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(6,8,9,0.3) 0%, rgba(6,8,9,0.85) 100%)', pointerEvents:'none' }} />

      {/* Header */}
      <div style={{ position:'relative', padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070', letterSpacing:2, textTransform:'uppercase' }}>Transfers</span>
        <span style={{ color:'#3b4555' }}>›</span>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:accent, letterSpacing:2, textTransform:'uppercase' }}>Scouting Network</span>
      </div>

      <div style={{ position:'relative', flex:1, display:'flex', overflow:'hidden' }}>

        {/* Left — 6 scout slots (narrower) */}
        <div style={{ flex:1, padding:12, display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr 1fr', gap:10, overflow:'hidden' }}>
          {[0,1,2,3,4,5].map(i => {
            const s = slots[i];
            const isEmpty = !s?.mission;
            const isActive = activeScout === i;
            const isHov = hoveredSlot === i;
            return (
              <div key={i}
                onClick={()=>{
                  if (isEmpty) { setDeploySlot(i); setShowDeployModal(true); }
                  else { setActiveScout(i); setScoutScreen('report'); setScoutReportSel(null); setScoutReportTab('ALL'); }
                }}
                onMouseEnter={()=>setHoveredSlot(i)}
                onMouseLeave={()=>setHoveredSlot(null)}
                style={{
                  background: isActive?`${accent}15`: s?.done?'rgba(0,232,122,0.06)': s?.active?'rgba(245,197,24,0.05)': isHov?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive?accent: s?.done?'rgba(0,232,122,0.25)': s?.active?'rgba(245,197,24,0.2)': isHov?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.07)'}`,
                  borderRadius:3, padding:'12px 14px', cursor:'pointer',
                  display:'flex', flexDirection:'column', gap:8,
                  transition:'all 0.12s', position:'relative', overflow:'hidden',
                }}
              >
                {/* Status indicator */}
                <div style={{ position:'absolute', top:10, right:10 }}>
                  {s?.active && <div style={{ width:8, height:8, borderRadius:'50%', background:'#f5c518', animation:'scoutPulse 1.5s infinite' }} />}
                  {s?.done   && <div style={{ width:8, height:8, borderRadius:'50%', background:'#00e87a' }} />}
                </div>

                {isEmpty ? (
                  /* Empty slot — + button */
                  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', border:'1.5px dashed rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:20, color:'rgba(255,255,255,0.2)', lineHeight:1 }}>+</span>
                    </div>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'rgba(255,255,255,0.2)', letterSpacing:2, textTransform:'uppercase' }}>Hire Scout</span>
                  </div>
                ) : (
                  <>
                    {/* Name */}
                    <div style={{ fontFamily:"var(--font-display)", fontSize:12, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', lineHeight:1.2, textTransform:'uppercase', letterSpacing:0.5, paddingRight:14 }}>{s.name}</div>

                    {/* Region */}
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070', letterSpacing:1 }}>
                      {s.region} · {s.active ? 'Scouting' : s.done ? 'Report Ready' : 'Area Scouting'}
                    </div>

                    {/* Players count */}
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.players>0?accent:'#3b4555'} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      <span style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:900, color: s.players>0?accent:'#3b4555' }}>{s.players}</span>
                      {s.active && s.weeksLeft !== null && (
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#f5c518', marginLeft:2 }}>{s.weeksLeft}w left</span>
                      )}
                    </div>

                    {/* Stars */}
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#445060', letterSpacing:1.5, textTransform:'uppercase' }}>Judgment</span>
                      <ScoutStars rating={s.rating} color={accent} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Right — wider sidebar, shows selected scout's data */}
        <div style={{ width:240, flexShrink:0, borderLeft:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', padding:16, gap:16, overflow:'hidden' }}>

          {!sidebarSlot || !sidebarSlot.mission ? (
            /* No scout selected */
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, opacity:0.3 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f0f2f5" strokeWidth="1"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#f0f2f5', letterSpacing:2, textTransform:'uppercase', textAlign:'center' }}>Hover a scout to preview</span>
            </div>
          ) : (
            <>
              {/* Scout name */}
              <div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', lineHeight:1.2, textTransform:'uppercase' }}>{sidebarSlot.name}</div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070', letterSpacing:1, marginTop:4 }}>{sidebarSlot.region}</div>
                <div style={{ marginTop:6 }}><ScoutStars rating={sidebarSlot.rating} color={accent} /></div>
              </div>

              <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:14 }}>
                {/* Header label */}
                <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', textTransform:'uppercase', letterSpacing:0.5, marginBottom:12 }}>Players Scouted</div>

                {/* Total count */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa3b2" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:900, color:'#f0f2f5' }}>{sidebarTotal}</span>
                </div>

                {/* Donut + breakdown side by side (perpendicular) */}
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {/* Donut */}
                  <svg width="80" height="80" viewBox="0 0 80 80" style={{ flexShrink:0 }}>
                    <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14"/>
                    {sidebarTotal > 0 && [
                      { key:'Strikers',    col:'#ff3b5c' },
                      { key:'Midfielders', col:accent    },
                      { key:'Defenders',   col:'#3b82f6' },
                      { key:'Goalkeepers', col:'#f5c518' },
                    ].reduce((acc, item) => {
                      const pct = sidebarBreakdown[item.key] / sidebarTotal;
                      const circ = 2 * Math.PI * 30;
                      const dash = pct * circ;
                      const offset = -(acc.offset);
                      acc.els.push(
                        <circle key={item.key} cx="40" cy="40" r="30" fill="none" stroke={item.col} strokeWidth="14"
                          strokeDasharray={`${dash} ${circ}`}
                          strokeDashoffset={offset}
                          transform="rotate(-90 40 40)" opacity={sidebarBreakdown[item.key]>0?1:0}/>
                      );
                      acc.offset -= dash;
                      return acc;
                    }, { offset: 0, els: [] }).els}
                  </svg>

                  {/* Breakdown list */}
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                    {[['Strikers','#ff3b5c'],['Midfielders',accent],['Defenders','#3b82f6'],['Goalkeepers','#f5c518']].map(([pos,col])=>(
                      <div key={pos} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:col, flexShrink:0 }} />
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#9aa3b2' }}>{pos}</span>
                        </div>
                        <span style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:900, color:col }}>{sidebarBreakdown[pos]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div style={{ marginTop:'auto', padding:'10px 12px', background: sidebarSlot.done?'rgba(0,232,122,0.06)':'rgba(245,197,24,0.06)', border:`1px solid ${sidebarSlot.done?'rgba(0,232,122,0.2)':'rgba(245,197,24,0.2)'}`, borderRadius:2 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background: sidebarSlot.done?'#00e87a':'#f5c518', animation: sidebarSlot.active?'scoutPulse 1.5s infinite':undefined }} />
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color: sidebarSlot.done?'#00e87a':'#f5c518', letterSpacing:1, textTransform:'uppercase' }}>
                    {sidebarSlot.done ? 'Report Ready' : `Scouting · ${sidebarSlot.weeksLeft}w left`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Deploy Modal ── */}
      {showDeployModal && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', zIndex:20, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowDeployModal(false)}>
          <div style={{ width:340, background:'#0c1018', border:'1px solid rgba(255,255,255,0.12)', borderRadius:4, overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', letterSpacing:0.5, textTransform:'uppercase' }}>Deploy Scout</span>
              <button onClick={()=>setShowDeployModal(false)} style={{ width:24, height:24, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#9aa3b2', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:16 }}>

              {/* Region */}
              <div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Scouting Region</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {['Europe','S. America','Africa','Asia','N. America','Oceania'].map(r=>(
                    <button key={r} onClick={()=>setModalRegion(r)} style={{ padding:'5px 10px', background: modalRegion===r?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${modalRegion===r?accent:'rgba(255,255,255,0.08)'}`, color: modalRegion===r?accent:'#9aa3b2', fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', cursor:'pointer' }}>{r}</button>
                  ))}
                </div>
              </div>

              {/* Position Focus */}
              <div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Position Focus</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {['Any','GK','DEF','MID','FWD','ST','CM','CB'].map(p=>(
                    <button key={p} onClick={()=>setModalPos(p)} style={{ padding:'5px 10px', background: modalPos===p?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${modalPos===p?accent:'rgba(255,255,255,0.08)'}`, color: modalPos===p?accent:'#9aa3b2', fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', cursor:'pointer' }}>{p}</button>
                  ))}
                </div>
              </div>

              {/* Scout Duration */}
              <div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Scout Duration</div>
                <div style={{ display:'flex', gap:6 }}>
                  {SCOUT_DURATIONS.map(d=>(
                    <button key={d.label} onClick={()=>setModalDuration(d)} style={{ flex:1, padding:'8px 6px', background: modalDuration.label===d.label?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${modalDuration.label===d.label?accent:'rgba(255,255,255,0.08)'}`, color: modalDuration.label===d.label?accent:'#9aa3b2', fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, fontStyle:'italic', cursor:'pointer', textAlign:'center' }}>
                      <div>{d.label}</div>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color: modalDuration.label===d.label?`${accent}88`:'#3a4455', marginTop:3 }}>{d.quality}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deploy button */}
              <button onClick={handleDeploy} style={{ width:'100%', padding:'11px', background:`${accent}22`, border:`1px solid ${accent}55`, color:accent, fontFamily:"var(--font-display)", fontSize:13, fontWeight:900, fontStyle:'italic', letterSpacing:3, textTransform:'uppercase', cursor:'pointer', marginTop:4 }}>
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </BentoBox>
  );

  /* ── Screen: REPORT ── */
  if (scoutScreen === 'report') {
    const scout = slots[activeScout];
    return (
      <BentoBox style={{ gridColumn: section?'1':'3', gridRow: section?'1':'1/3', padding:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Breadcrumb */}
        <div style={{ padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <button onClick={()=>setScoutScreen('hub')} style={{ background:'none', border:'none', color:'#556070', cursor:'pointer', fontFamily:"var(--font-mono)", fontSize:8, letterSpacing:1, display:'flex', alignItems:'center', gap:4 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>Scouts
          </button>
          <span style={{ color:'#3b4555' }}>›</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:accent, letterSpacing:2, textTransform:'uppercase' }}>Scout Report</span>
        </div>

        {/* Scout name bar */}
        <div style={{ padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:32, height:32, background:`${accent}18`, border:`1px solid ${accent}33`, borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:900, fontStyle:'italic', color:'#f0f2f5' }}>{scout?.name}</div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', letterSpacing:1 }}>Area Scouting · {scout?.region}</div>
          </div>
          <ScoutStars rating={scout?.rating||3} color={accent} />
        </div>

        {/* Pos tabs */}
        <div style={{ display:'flex', alignItems:'flex-end', borderBottom:'2px solid rgba(255,255,255,0.07)', paddingLeft:4, flexShrink:0 }}>
          {['ALL','ATT','MID','DEF','GK'].map(t=>(
            <button key={t} onClick={()=>setScoutReportTab(t)} style={{ padding:'7px 14px', background:'transparent', border:'none', borderBottom: scoutReportTab===t?`2px solid ${accent}`:'2px solid transparent', marginBottom:'-2px', color: scoutReportTab===t?'#f0f2f5':'#556070', fontFamily:"var(--font-display)", fontSize:9, fontWeight:900, fontStyle:'italic', letterSpacing:1, textTransform:'uppercase', cursor:'pointer', transition:'all 0.12s' }}>{t}</button>
          ))}
        </div>

        {/* Body: list + detail */}
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* Left list */}
          <div style={{ width:'45%', flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
              <span style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', textTransform:'uppercase' }}>
                {scout?.done ? 'Players Found' : scout?.active ? 'Scouting…' : 'No Mission'}
              </span>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              {tabFiltered.length === 0 ? (
                <div style={{ padding:20, textAlign:'center', fontFamily:"var(--font-mono)", fontSize:8, color:'#3b4555', letterSpacing:2 }}>
                  {scout?.active ? 'SCOUTING IN PROGRESS' : 'NO PLAYERS FOUND'}
                </div>
              ) : tabFiltered.map((p,i)=>{
                const isSel = scoutReportSel?.id===p.id;
                return (
                  <div key={p.id}
                    onClick={()=>setScoutReportSel(p)}
                    onDoubleClick={()=>{ setScoutReportSel(p); setScoutDeepPlayer(p); setScoutScreen('player'); }}
                    className="tr-hov"
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', background: isSel?`${accent}12`:'transparent', borderLeft: isSel?`3px solid ${accent}`:'3px solid transparent', transition:'all 0.1s' }}>
                    <div style={{ width:36, height:36, background:`${posColor(p.position)}18`, border:`1px solid ${posColor(p.position)}33`, borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, flexDirection:'column', gap:1 }}>
                      <span style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:900, color:ovrColor(p.overall) }}>{p.overall}</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:700, color: isSel?'#f0f2f5':'#c8d0da', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                      <div style={{ display:'flex', gap:6, marginTop:2 }}>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:posColor(p.position) }}>{p.position}</span>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#3b4555' }}>Age {p.age}</span>
                      </div>
                    </div>
                    <img src={`https://flagcdn.com/w20/${natCode(p.nationality)}.png`} alt="" style={{ height:10, borderRadius:1, flexShrink:0 }} onError={e=>e.target.style.display='none'} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right detail */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {!scoutReportSel ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1e2a38" strokeWidth="1.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#1e2a38', letterSpacing:3, textTransform:'uppercase' }}>Select a player</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#1e2a38', letterSpacing:1 }}>Double-click for full profile</span>
              </div>
            ) : (
              <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                {/* Player header */}
                <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', position:'relative', overflow:'hidden', flexShrink:0 }}>
                  <div style={{ position:'absolute', right:-10, top:-14, fontFamily:"var(--font-display)", fontSize:120, fontWeight:900, color:'rgba(255,255,255,0.03)', lineHeight:1, userSelect:'none' }}>{scoutReportSel.overall}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070' }}>{scoutReportSel.club}</span>
                    <img src={`https://flagcdn.com/w20/${natCode(scoutReportSel.nationality)}.png`} alt="" style={{ height:11, borderRadius:1, marginLeft:'auto' }} onError={e=>e.target.style.display='none'} />
                  </div>
                  <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', lineHeight:1 }}>{scoutReportSel.name}</div>
                      <div style={{ display:'flex', gap:10, marginTop:5 }}>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070' }}>Age {scoutReportSel.age}</span>
                        <span style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', color:posColor(scoutReportSel.position) }}>{scoutReportSel.position}</span>
                      </div>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#3b4555', marginTop:4, letterSpacing:1 }}>Found by scout {scout?.name?.split(' ').slice(-1)[0]}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:"var(--font-display)", fontSize:40, fontWeight:900, color:ovrColor(scoutReportSel.overall), lineHeight:1 }}>{scoutReportSel.overall}</div>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070', letterSpacing:2 }}>OVR</div>
                    </div>
                  </div>
                </div>

                {/* Summary stats — shown/hidden ranges like FIFA */}
                <div style={{ flex:1, overflowY:'auto', padding:'10px 16px' }}>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#445060', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Summary</div>
                  {[['Athleticism',scoutReportSel.pace??70],['Technical',scoutReportSel.dribbling??70],['Shooting',scoutReportSel.shooting??70],['Passing',scoutReportSel.passing??70],['Defending',scoutReportSel.defending??70],['Mentality',scoutReportSel.physical??70]].map(([lbl,val])=>{
                    const c=val>=85?'#f5c518':val>=75?'#00e87a':val>=60?'#3b82f6':'#9aa3ae';
                    const lo=Math.max(0,val-8), hi=Math.min(99,val+8);
                    return (
                      <div key={lbl} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', width:70, flexShrink:0 }}>{lbl}</span>
                        <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ width:`${val}%`, height:'100%', background:c }} />
                        </div>
                        <span style={{ fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, color:c, width:36, textAlign:'right', flexShrink:0 }}>{lo} - {hi}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:8, flexShrink:0 }}>
                  <button onClick={()=>{ setScoutDeepPlayer(scoutReportSel); setScoutScreen('player'); }} style={{ flex:1, padding:'9px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#9aa3b2', fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, fontStyle:'italic', letterSpacing:1.5, textTransform:'uppercase', cursor:'pointer' }}>Full Profile</button>
                  <button onClick={()=>toggleShortlist(scoutReportSel)} style={{ flex:1, padding:'9px', background:`${accent}18`, border:`1px solid ${accent}44`, color:accent, fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, fontStyle:'italic', letterSpacing:1.5, textTransform:'uppercase', cursor:'pointer' }}>
                    {shortlist.some(s=>s.id===scoutReportSel.id)?'Shortlisted':'Shortlist'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </BentoBox>
    );
  }

  /* ── Screen: PLAYER DEEP DIVE ── */
  if (scoutScreen === 'player' && scoutDeepPlayer) {
    const p = scoutDeepPlayer;
    const oc = ovrColor(p.overall);
    const pc = posColor(p.position);
    return (
      <BentoBox style={{ gridColumn: section?'1':'3', gridRow: section?'1':'1/3', padding:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Breadcrumb */}
        <div style={{ padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <button onClick={()=>setScoutScreen('report')} style={{ background:'none', border:'none', color:'#556070', cursor:'pointer', fontFamily:"var(--font-mono)", fontSize:8, letterSpacing:1, display:'flex', alignItems:'center', gap:4 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>Report
          </button>
          <span style={{ color:'#3b4555' }}>›</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:accent, letterSpacing:2, textTransform:'uppercase' }}>{p.name}</span>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Top section */}
          <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
            {/* Avatar */}
            <div style={{ width:80, height:80, background:`${pc}18`, border:`1px solid ${pc}33`, borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={pc} strokeWidth="1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:pc, letterSpacing:2 }}>{p.position}</span>
                <img src={`https://flagcdn.com/w20/${natCode(p.nationality)}.png`} alt="" style={{ height:12 }} onError={e=>e.target.style.display='none'} />
              </div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:26, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', lineHeight:1, marginBottom:6 }}>{p.name}</div>
              <div style={{ display:'flex', gap:16 }}>
                <div><span style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:900, color:oc }}>{p.overall}</span><span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', marginLeft:4 }}>OVR</span></div>
                <div><span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#9aa3b2' }}>Age </span><span style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:900, color:'#f0f2f5' }}>{p.age}</span></div>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[['Club',p.club||'—'],['Nationality',p.nationality||'—'],['Height','—'],['Preferred Foot',p.foot||'Right'],['Value',fmt(p.value||0)],['Weekly Wage',p.wage?`£${(p.wage/1e3).toFixed(0)}K/w`:'—']].map(([l,v])=>(
              <div key={l} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', padding:'7px 10px' }}>
                <div style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:700, color:'#d0d4da' }}>{v}</div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#445060', letterSpacing:1, textTransform:'uppercase', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Full stats */}
          <div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#445060', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Attributes</div>
            {[['PAC',p.pace??70],['SHO',p.shooting??70],['PAS',p.passing??70],['DRI',p.dribbling??70],['DEF',p.defending??70],['PHY',p.physical??70]].map(([lbl,val])=>{
              const c=val>=85?'#f5c518':val>=75?'#00e87a':val>=60?'#3b82f6':'#9aa3ae';
              return (
                <div key={lbl} style={{ display:'flex', alignItems:'center', gap:12, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:'#556070', letterSpacing:1.5, width:32, flexShrink:0 }}>{lbl}</span>
                  <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ width:`${val}%`, height:'100%', background:c }} />
                  </div>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:900, color:c, width:28, textAlign:'right', flexShrink:0 }}>{val}</span>
                </div>
              );
            })}
          </div>

          {/* Scout notes */}
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', padding:'10px 12px' }}>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#445060', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Scouting Notes</div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:10, fontStyle:'italic', color:'#9aa3b2', lineHeight:1.6 }}>
              {p.overall>=82?'World-class talent. Highly recommended signing.'
               :p.overall>=75?'Strong player with good potential. Worth pursuing.'
               :'Decent option. May suit rotation or development role.'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding:'10px 18px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:10, flexShrink:0 }}>
          <button onClick={()=>handleBuy(p)} style={{ flex:2, padding:'10px', background:`${accent}22`, border:`1px solid ${accent}55`, color:accent, fontFamily:"var(--font-display)", fontSize:12, fontWeight:900, fontStyle:'italic', letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>Make Offer</button>
          <button onClick={()=>toggleShortlist(p)} style={{ flex:1, padding:'10px', background: shortlist.some(s=>s.id===p.id)?'rgba(255,59,92,0.08)':'rgba(255,255,255,0.04)', border:`1px solid ${shortlist.some(s=>s.id===p.id)?'rgba(255,59,92,0.3)':'rgba(255,255,255,0.1)'}`, color: shortlist.some(s=>s.id===p.id)?'#ff3b5c':'#9aa3b2', fontFamily:"var(--font-display)", fontSize:12, fontWeight:900, fontStyle:'italic', letterSpacing:1, textTransform:'uppercase', cursor:'pointer' }}>
            {shortlist.some(s=>s.id===p.id)?'Shortlisted':'Shortlist'}
          </button>
        </div>
      </BentoBox>
    );
  }

  return null;
}


/* ── Academy player detail component ── */
function AcademyDetail({ p, accent, fmt, handlePromote }) {
  const oc = ovrColor(p.overall);
  const pc = posColor(p.position);
  const potColor = p.potential>=85?'#f5c518':p.potential>=78?'#00e87a':'#9aa3ae';
  const stats = [['PAC',p.pace??65],['SHO',p.shooting??60],['PAS',p.passing??63],['DRI',p.dribbling??66],['DEF',p.defending??55],['PHY',p.physical??62]];
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', position:'relative', overflow:'hidden', flexShrink:0 }}>
        <div style={{ position:'absolute', right:-8, top:-12, fontFamily:"var(--font-display)", fontSize:110, fontWeight:900, color:'rgba(255,255,255,0.03)', lineHeight:1, userSelect:'none' }}>{p.overall}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
          <span style={{ padding:'2px 7px', border:`1px solid ${pc}55`, fontFamily:"var(--font-mono)", fontSize:8, color:pc, letterSpacing:1.5 }}>{p.position}</span>
          <img src={`https://flagcdn.com/w20/${natCode(p.nationality)}.png`} alt="" style={{ height:12, borderRadius:1 }} onError={e=>e.target.style.display='none'} />
          <span style={{ marginLeft:'auto', fontFamily:"var(--font-mono)", fontSize:8, color:'#3b4555' }}>{p.nationality}</span>
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', lineHeight:1 }}>{p.name}</div>
            <div style={{ display:'flex', gap:10, marginTop:5 }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070' }}>Age {p.age}</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070' }}>Foot {p.foot||'Right'}</span>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:42, fontWeight:900, color:oc, lineHeight:1 }}>{p.overall}</div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070', letterSpacing:2 }}>OVR</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:16, marginTop:10 }}>
          {[['Value',p.value?fmt(p.value):'—'],['Potential',p.potential],['Wage',p.wage?`£${(p.wage/1e3).toFixed(0)}K/w`:'—']].map(([l,v])=>(
            <div key={l}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:12, fontWeight:700, fontStyle:'italic', color: l==='Potential'?potColor:'#d0d4da' }}>{v}</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#445060', letterSpacing:1, textTransform:'uppercase', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'10px 16px', display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#445060', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Attributes</div>
          {stats.map(([lbl,val])=>{
            const c=val>=75?'#00e87a':val>=60?'#3b82f6':'#9aa3ae';
            return (
              <div key={lbl} style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070', letterSpacing:1.5, width:28, flexShrink:0 }}>{lbl}</span>
                <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ width:`${val}%`, height:'100%', background:c }} />
                </div>
                <span style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:900, color:c, width:24, textAlign:'right', flexShrink:0 }}>{val}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            ['Skill Moves','★★★☆☆'],['Weak Foot','★★★☆☆'],
            ['Attack Work',p.potential>=78?'High':'Medium'],['Def Work',p.potential>=80?'High':'Low'],
            ['Traits','—'],['Growth',p.potential-p.overall>12?'High':p.potential-p.overall>6?'Medium':'Low'],
          ].map(([l,v])=>(
            <div key={l} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', padding:'6px 8px' }}>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#445060', letterSpacing:1.5, textTransform:'uppercase', marginBottom:3 }}>{l}</div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:700, color:'#d0d4da' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:8, flexShrink:0 }}>
        <button onClick={()=>handlePromote(p)} style={{ flex:1, padding:'9px', background:`${accent}22`, border:`1px solid ${accent}55`, color:accent, fontFamily:"var(--font-display)", fontSize:11, fontWeight:900, fontStyle:'italic', letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>Promote to First Team</button>
      </div>
    </div>
  );
}

/* ── History Section component (FM-style) ── */
function HistorySection({ history, fmt, accent }) {
  const totalIn  = history.filter(h=>h.type==='out').reduce((s,h)=>s+(h.fee||0),0);
  const totalOut = history.filter(h=>h.type==='in').reduce((s,h)=>s+(h.fee||0),0);
  const netSpend = totalOut - totalIn;
  return (
    <BentoBox style={{ gridColumn:'1', gridRow:'1', padding:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', letterSpacing:0.5, textTransform:'uppercase' }}>Transfer History</span>
        </div>
        {/* Net spend pill */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', letterSpacing:1 }}>Net Spend</span>
          <span style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:900, fontStyle:'italic', color: netSpend>0?'#ff3b5c':'#00e87a' }}>
            {netSpend>0?'-':'+'}{fmt(Math.abs(netSpend))}
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 120px 120px 100px', gap:8, padding:'8px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
        {['Date','Name','From','To','Fee'].map(h=>(
          <span key={h} style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#445060', letterSpacing:1.5, textTransform:'uppercase', textAlign: h==='Fee'?'right': h==='Name'?'left':'center' }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {history.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1e2a38" strokeWidth="1.2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#1e2a38', letterSpacing:3, textTransform:'uppercase' }}>No transfers yet</span>
          </div>
        ) : history.map((h, i) => {
          const isIn = h.type === 'in';
          return (
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'60px 1fr 120px 120px 100px', gap:8,
              padding:'12px 16px', alignItems:'center',
              borderBottom:'1px solid rgba(255,255,255,0.04)',
              background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              transition:'background 0.1s',
            }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
              onMouseLeave={e=>e.currentTarget.style.background= i%2===0?'transparent':'rgba(255,255,255,0.01)'}
            >
              {/* Date */}
              <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070' }}>
                Wk {h.week}
              </span>

              {/* Player name + flag */}
              <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                {/* Avatar circle */}
                <div style={{ width:32, height:32, borderRadius:2, background:`${isIn?'rgba(0,232,122,0.08)':'rgba(255,59,92,0.08)'}`, border:`1px solid ${isIn?'rgba(0,232,122,0.2)':'rgba(255,59,92,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isIn?'#00e87a':'#ff3b5c'} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:0.3, textTransform:'uppercase' }}>{h.player}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color: isIn?'#00e87a':'#ff3b5c', letterSpacing:1 }}>{isIn ? '↓ SIGNED' : '↑ SOLD'}</span>
                  </div>
                </div>
              </div>

              {/* From club */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <div style={{ width:22, height:22, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#556070" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#9aa3b2', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.fromClub||'—'}</span>
              </div>

              {/* Arrow + To club */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3b4555" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <div style={{ width:22, height:22, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#556070" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#9aa3b2', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.toClub||'—'}</span>
              </div>

              {/* Fee */}
              <div style={{ textAlign:'right' }}>
                <span style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:900, fontStyle:'italic', color: isIn?'#ff3b5c':'#00e87a' }}>{fmt(h.fee||0)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </BentoBox>
  );
}

export default function Transfers() {
  const { myClub, squad, youthPlayers, allPlayers, allClubs, allLeagues, budget, week, buyPlayer, sellPlayer, promoteYouthPlayer } = useGameStore();
  const accent = myClub?.color || CLUB_COLOR[myClub?.name] || '#00e87a';

  /* ── Shared selection state ── */
  const [selMyPlayer,    setSelMyPlayer]    = useState(null);
  const [selShortPlayer, setSelShortPlayer] = useState(null);
  const [selScoutPlayer, setSelScoutPlayer] = useState(null);
  const [selYouth,       setSelYouth]       = useState(null);

  /* ── Transfer Hub tabs ── */
  const [hubTab, setHubTab] = useState('shortlist');
  const [hubSel, setHubSel] = useState(null);

  /* ── Shortlist ── */
  const [shortlist, setShortlist] = useState([]);
  const toggleShortlist = (p) => setShortlist(prev => prev.some(s=>s.id===p.id) ? prev.filter(s=>s.id!==p.id) : [...prev, p]);

  /* ── History ── */
  const [history, setHistory] = useState([]);
  const addHistory = (entry) => setHistory(prev => [entry, ...prev].slice(0, 30));

  /* ── My Players filters ── */
  const [myPosFilter, setMyPosFilter] = useState('All');
  const filteredSquad = useMemo(() => {
    let list = squad||[];
    if (myPosFilter !== 'All') list = list.filter(p=>posGroup(p.position)===myPosFilter);
    return [...list].sort((a,b)=>b.overall-a.overall);
  }, [squad, myPosFilter]);

  /* ── Shortlist / search ── */
  const [search, setSearch]       = useState('');
  const [shPosFilter, setShPos]   = useState('All');
  const [shSort, setShSort]       = useState('overall');

  /* ── Search Players screen state ── */
  const [searchScreen, setSearchScreen] = useState('filters'); // 'filters' | 'results'
  const [sfName,    setSfName]    = useState('');
  const [sfPos,     setSfPos]     = useState('Any');
  const [sfAge,     setSfAge]     = useState([16, 45]);
  const [sfLeague,  setSfLeague]  = useState('Any');
  const [sfNat,     setSfNat]     = useState('Any');
  const [sfTeam,    setSfTeam]    = useState('Any');
  const [sfStatus,  setSfStatus]  = useState('Any');
  const [sfResTabs, setSfResTabs] = useState('ALL');
  const [sfSel,     setSfSel]     = useState(null);
  const [sfResults, setSfResults] = useState([]);
  const searchPool = useMemo(() => {
    let list = allPlayers||[];
    if (shPosFilter !== 'All') list = list.filter(p=>posGroup(p.position)===shPosFilter);
    if (search) list = list.filter(p=>p.name?.toLowerCase().includes(search.toLowerCase())||p.club?.toLowerCase().includes(search.toLowerCase()));
    return [...list].sort((a,b)=>shSort==='overall'?b.overall-a.overall:shSort==='value'?(b.value||0)-(a.value||0):(a.age||0)-(b.age||0)).slice(0,80);
  }, [allPlayers, shPosFilter, search, shSort]);

  /* ── Scout ── */
  const [scoutRegion,   setScoutRegion]   = useState('Europe');
  const [scoutPos,      setScoutPos]      = useState('Any');
  const [scoutDuration, setScoutDuration] = useState(SCOUT_DURATIONS[1]);
  const [missions, setMissions]           = useState([]);
  const [viewMission,   setViewMission]   = useState(null);
  const [scoutScreen,   setScoutScreen]   = useState('hub');    // 'hub' | 'report' | 'player'
  const [activeScout,   setActiveScout]   = useState(null);     // selected scout slot
  const [scoutReportSel, setScoutReportSel] = useState(null);   // selected player in report
  const [scoutReportTab, setScoutReportTab] = useState('ALL');   // ALL ATT MID DEF GK
  const [scoutDeepPlayer, setScoutDeepPlayer] = useState(null); // double-click player

  const resolvedMissions = useMemo(() =>
    missions.map(m => (!m.done && week >= m.dueWeek)
      ? { ...m, done:true, results:genScoutResults(m.id, m.region, m.posFilter, m.quality) }
      : m
    ), [missions, week]
  );

  const sendScout = () => {
    const id = Date.now();
    setMissions(prev => [...prev, { id, region:scoutRegion, posFilter:scoutPos, quality:scoutDuration.quality, dueWeek:week+scoutDuration.weeks, done:false, results:[] }]);
  };

  /* ── Actions ── */
  const handleBuy = (player) => {
    buyPlayer(player, player.value||0);
    addHistory({ type:'in', player:player.name, fee:player.value||0, week });
    setSelShortPlayer(null);
    setSelScoutPlayer(null);
  };
  const handleSell = (player) => {
    sellPlayer(player, player.value||0);
    addHistory({ type:'out', player:player.name, fee:player.value||0, week });
    setSelMyPlayer(null);
  };
  const handlePromote = (player) => {
    promoteYouthPlayer(player.id);
    addHistory({ type:'in', player:player.name+' (youth)', fee:0, week });
    setSelYouth(null);
  };

  /* sync selections after squad changes */
  const syncedMyPlayer = useMemo(() => selMyPlayer ? (squad||[]).find(p=>p.id===selMyPlayer.id)||null : null, [selMyPlayer, squad]);
  const syncedYouth    = useMemo(() => selYouth    ? (youthPlayers||[]).find(p=>p.id===selYouth.id)||null : null, [selYouth, youthPlayers]);

  const activeMissions    = resolvedMissions.filter(m=>!m.done);
  const completedMissions = resolvedMissions.filter(m=>m.done);

  const [section, setSection] = useState(null); // null = hub landing

  /* ── Section card data ── */
  const SECTIONS = [
    {
      id: 'myplayers',
      label: 'Transfer Hub',
      sub: 'Manage & sell your squad',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      color: accent,
      bg: 'https://images.unsplash.com/photo-1726070740577-94d83143684b?auto=format&fit=crop&w=900&q=80', bgGradient: 'linear-gradient(160deg, #0d1b2a 0%, #1b3a4b 40%, #2c5364 70%, #1b6ca8 100%)',
    },
    {
      id: 'search',
      label: 'Search Players',
      sub: 'Search & shortlist players',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      ),
      color: '#3b82f6',
      bg: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=60', bgGradient: 'linear-gradient(160deg, #0a0f1e 0%, #1a1f3c 40%, #2d3561 70%, #1a2980 100%)',
    },
    {
      id: 'scout',
      label: 'Scouting',
      sub: 'Deploy scouts worldwide',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      ),
      badgePulse: activeMissions.length > 0,
      color: '#f5c518',
      bg: 'https://images.unsplash.com/photo-1524015368236-bbf6f72545b6?auto=format&fit=crop&w=900&q=80', bgGradient: 'linear-gradient(160deg, #1a1200 0%, #2d2200 40%, #3d3400 70%, #5c4e00 100%)',
    },
    {
      id: 'youth',
      label: 'Academy',
      sub: 'Youth players & prospects',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
      color: '#00e87a',
      bg: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?auto=format&fit=crop&w=900&q=60', bgGradient: 'linear-gradient(160deg, #001a00 0%, #002200 40%, #003300 70%, #004d00 100%)',
    },
    {
      id: 'history',
      label: 'History',
      sub: 'Transfer history & deals',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
        </svg>
      ),
      color: '#a78bfa',
      bg: 'https://images.unsplash.com/photo-1681505504714-4ded1bc247e7?auto=format&fit=crop&w=900&q=80', bgGradient: 'linear-gradient(160deg, #1a0a00 0%, #2d1b00 40%, #3d2314 70%, #5c3317 100%)',
    },
  ];

  const STYLES = `
    @keyframes trFadeIn { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:translateX(0)} }
    @keyframes trSlideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes scoutPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    input[type=text]:focus, select:focus { outline:none; }
    select option { background:#0c1018; color:#f0f2f5; }
    .tr-hov:hover { background:rgba(255,255,255,0.025) !important; }
  `;

  /* ── Budget bar (shared across all views) ── */

  /* ── HUB LANDING ── */
  if (!section) {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
        <style>{STYLES}</style>
        <div style={{ flex:1, padding:'10px', display:'grid', gridTemplateColumns:'repeat(6,1fr)', gridTemplateRows:'repeat(2,1fr)', gap:10, overflow:'hidden' }}>
          {SECTIONS.map((s,i) => (
            <button
              key={s.id}
              className="sec-card"
              onClick={()=>setSection(s.id)}
              style={{
                gridColumn: i < 3 ? 'span 2' : 'span 3',
                background:'rgba(255,255,255,0.02)',
                border:`1px solid rgba(255,255,255,0.07)`,
                borderRadius:4,
                padding:'18px',
                textAlign:'left',
                cursor:'pointer',
                display:'flex',
                flexDirection:'column',
                justifyContent:'flex-end',
                gap:8,
                position:'relative',
                overflow:'hidden',
                animation:'trSlideIn 0.2s ease both',
                transition:'border-color 0.15s',
              }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.18)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}
            >
              {/* Background — gradient base always, image on top if available */}
              {s.bgGradient && (
                <div style={{ position:'absolute', inset:0, background:s.bgGradient }} />
              )}
              {s.bg && (
                <div style={{ position:'absolute', inset:0, backgroundImage:`url(${s.bg})`, backgroundSize:'cover', backgroundPosition:'center', opacity:0.5 }} />
              )}
              {/* Gradient overlay for legibility */}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(7,10,15,0.1) 0%, rgba(7,10,15,0.88) 100%)' }} />

              {/* Content */}
              <div style={{ position:'relative', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ color:`${s.color}cc` }}>{s.icon}</div>
                {s.badgePulse && <div style={{ width:6, height:6, borderRadius:'50%', background:s.color, animation:'scoutPulse 1.5s infinite' }} />}
              </div>
              <div style={{ position:'relative' }}>
                <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', letterSpacing:0.5, lineHeight:1, marginBottom:5 }}>{s.label}</div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#9aa3b2', letterSpacing:1.5, textTransform:'uppercase', lineHeight:1.5 }}>{s.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── SECTION VIEWS — same bento grid content but filtered by section ── */
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <style>{STYLES}</style>
      <div style={{ flex:1, overflow:'hidden', padding:'8px', display:'grid', gap:'6px',
        ...(section === 'myplayers' ? { gridTemplateColumns:'1fr', gridTemplateRows:'1fr' } :
            section === 'search'    ? { gridTemplateColumns:'1fr', gridTemplateRows:'1fr' } :
            section === 'scout'     ? { gridTemplateColumns:'1fr', gridTemplateRows:'1fr' } :
            section === 'youth'     ? { gridTemplateColumns:'1fr', gridTemplateRows:'1fr' } :
            section === 'history'   ? { gridTemplateColumns:'1fr', gridTemplateRows:'1fr' } :
            { gridTemplateColumns:'220px 1fr 180px', gridTemplateRows:'1fr 130px' })
      }}>

        {/* ═══════════════════════════════
            BOX 1 — TRANSFER HUB (FIFA style)
        ═══════════════════════════════ */}
        {(section === 'myplayers' || !section) && (() => {
          const sentOffers     = [];
          const receivedOffers = [];
          const hubPlayers     = hubTab==='shortlist' ? shortlist
                               : hubTab==='sent'      ? sentOffers
                               : hubTab==='received'  ? receivedOffers
                               : filteredSquad;
          const hubPlayer = hubPlayers.find(p=>p.id===hubSel) || null;
          const HUB_TABS = [
            { id:'shortlist', label:'Shortlist'       },
            { id:'sent',      label:'Sent Offers'     },
            { id:'received',  label:'Received Offers' },
            { id:'listed',    label:'Transfer Listed' },
          ];
          return (
            <BentoBox style={{ gridColumn:'1', gridRow: section?'1':'1/3', display:'flex', flexDirection:'column', overflow:'hidden', padding:0 }}>
              {/* ── Tabs — compact left-aligned like FIFA ── */}
              <div style={{ display:'flex', alignItems:'flex-end', borderBottom:'2px solid rgba(255,255,255,0.07)', flexShrink:0, paddingLeft:4 }}>
                {HUB_TABS.map(t=>(
                  <button key={t.id} onClick={()=>{ setHubTab(t.id); setHubSel(null); }} style={{
                    padding:'10px 18px', background: hubTab===t.id?'rgba(255,255,255,0.05)':'transparent',
                    border:'none', borderBottom: hubTab===t.id?`2px solid ${accent}`:'2px solid transparent',
                    marginBottom:'-2px',
                    color: hubTab===t.id?'#f0f2f5':'#556070',
                    fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, fontStyle:'italic',
                    letterSpacing:1, textTransform:'uppercase', cursor:'pointer', transition:'all 0.12s',
                    whiteSpace:'nowrap',
                  }}>{t.label}</button>
                ))}
              </div>

              {/* ── Body: list left + overview right ── */}
              <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

                {/* Left — player list */}
                <div style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', borderRight:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
                  {/* Pos filters */}
                  <div style={{ display:'flex', gap:4, padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
                    {['All','GK','DEF','MID','FWD'].map(f=>(
                      <button key={f} onClick={()=>setMyPosFilter(f)} style={{ padding:'3px 8px', background: myPosFilter===f?`${accent}22`:'transparent', border:`1px solid ${myPosFilter===f?accent:'rgba(255,255,255,0.08)'}`, color: myPosFilter===f?accent:'#556070', fontFamily:"var(--font-display)", fontSize:8, fontWeight:700, fontStyle:'italic', cursor:'pointer' }}>{f}</button>
                    ))}
                  </div>
                  {/* Column headers */}
                  <div style={{ display:'grid', gridTemplateColumns:'22px 1fr 36px 28px 36px', gap:6, padding:'5px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
                    {['#','PLAYER','OVR','AGE','POS'].map(h=>(
                      <span key={h} style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#445060', letterSpacing:1.5, textTransform:'uppercase', textAlign: h==='PLAYER'?'left':'center' }}>{h}</span>
                    ))}
                  </div>
                  {/* List */}
                  <div style={{ flex:1, overflowY:'auto' }}>
                    {hubPlayers.length === 0 ? (
                      <div style={{ padding:24, textAlign:'center', fontFamily:"var(--font-mono)", fontSize:8, color:'#3b4555', letterSpacing:2 }}>
                        {hubTab==='sent'?'NO SENT OFFERS':hubTab==='received'?'NO OFFERS RECEIVED':hubTab==='listed'?'NO PLAYERS LISTED':'SHORTLIST EMPTY'}
                      </div>
                    ) : hubPlayers.map((p,i)=>{
                      const isSel = hubSel===p.id;
                      return (
                        <div key={p.id} onClick={()=>setHubSel(p.id)} className="tr-hov"
                          style={{ display:'grid', gridTemplateColumns:'22px 1fr 36px 28px 36px', gap:6, padding:'9px 10px', alignItems:'center', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', background: isSel?`${accent}12`:'transparent', borderLeft: isSel?`3px solid ${accent}`:'3px solid transparent', transition:'all 0.1s' }}>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#445060', textAlign:'center' }}>{i+1}</span>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontFamily:"var(--font-display)", fontSize:12, fontWeight:700, color: isSel?'#f0f2f5':'#c8d0da', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                            <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#445060', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>{p.club||myClub?.name}</div>
                          </div>
                          <span style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:900, color:ovrColor(p.overall), textAlign:'center' }}>{p.overall}</span>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:'#9aa3b2', textAlign:'center' }}>{p.age}</span>
                          <span style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, color:posColor(p.position), textAlign:'center' }}>{p.position}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right — player overview */}
                <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                  {!hubPlayer ? (
                    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10 }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1e2a38" strokeWidth="1.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#1e2a38', letterSpacing:3, textTransform:'uppercase' }}>Select a player</span>
                    </div>
                  ) : (
                    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                      {/* Header */}
                      <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', position:'relative', overflow:'hidden', flexShrink:0 }}>
                        <div style={{ position:'absolute', right:-10, top:-16, fontFamily:"var(--font-display)", fontSize:130, fontWeight:900, color:'rgba(255,255,255,0.03)', lineHeight:1, userSelect:'none' }}>{hubPlayer.overall}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:posColor(hubPlayer.position), letterSpacing:2 }}>{hubPlayer.position}</span>
                          <img src={`https://flagcdn.com/w20/${natCode(hubPlayer.nationality)}.png`} alt="" style={{ height:12, borderRadius:1 }} onError={e=>e.target.style.display='none'} />
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#445060', marginLeft:'auto' }}>{hubPlayer.club||myClub?.name}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
                          <div>
                            <div style={{ fontFamily:"var(--font-display)", fontSize:26, fontWeight:900, fontStyle:'italic', color:'#f0f2f5', lineHeight:1, letterSpacing:0.5 }}>{hubPlayer.name}</div>
                            <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070', marginTop:5, letterSpacing:1 }}>Age {hubPlayer.age} · {hubPlayer.nationality}</div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontFamily:"var(--font-display)", fontSize:48, fontWeight:900, color:ovrColor(hubPlayer.overall), lineHeight:1 }}>{hubPlayer.overall}</div>
                            <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', letterSpacing:2 }}>OVR</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:20, marginTop:14 }}>
                          {[['Value',hubPlayer.value?fmt(hubPlayer.value):'—'],['Wage',hubPlayer.wage?`£${(hubPlayer.wage/1e3).toFixed(0)}K/w`:'—'],['Release','—']].map(([l,v])=>(
                            <div key={l}>
                              <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:700, fontStyle:'italic', color:'#d0d4da' }}>{v}</div>
                              <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#445060', letterSpacing:1, textTransform:'uppercase', marginTop:2 }}>{l}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Attributes */}
                      <div style={{ flex:1, overflowY:'auto', padding:'12px 20px' }}>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#445060', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Attributes</div>
                        {[['PAC',hubPlayer.pace??hubPlayer.speed??70],['SHO',hubPlayer.shooting??70],['PAS',hubPlayer.passing??70],['DRI',hubPlayer.dribbling??70],['DEF',hubPlayer.defending??70],['PHY',hubPlayer.physical??hubPlayer.physicality??70]].map(([lbl,val])=>{
                          const c = val>=85?'#f5c518':val>=75?'#00e87a':val>=60?'#3b82f6':'#9aa3ae';
                          return (
                            <div key={lbl} style={{ display:'flex', alignItems:'center', gap:12, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                              <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:'#556070', letterSpacing:1.5, width:32, flexShrink:0 }}>{lbl}</span>
                              <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                                <div style={{ width:`${val}%`, height:'100%', background:c, transition:'width 0.4s ease' }} />
                              </div>
                              <span style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:900, color:c, width:28, textAlign:'right', flexShrink:0 }}>{val}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:10, flexShrink:0 }}>
                        {hubTab==='shortlist' && <>
                          <button onClick={()=>handleBuy(hubPlayer)} style={{ flex:2, padding:'10px', background:`${accent}22`, border:`1px solid ${accent}55`, color:accent, fontFamily:"var(--font-display)", fontSize:12, fontWeight:900, fontStyle:'italic', letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>Make Offer</button>
                          <button onClick={()=>toggleShortlist(hubPlayer)} style={{ flex:1, padding:'10px', background:'rgba(255,59,92,0.08)', border:'1px solid rgba(255,59,92,0.25)', color:'#ff3b5c', fontFamily:"var(--font-display)", fontSize:12, fontWeight:900, fontStyle:'italic', letterSpacing:1, textTransform:'uppercase', cursor:'pointer' }}>Remove</button>
                        </>}
                        {hubTab==='listed' && <button onClick={()=>handleSell(hubPlayer)} style={{ flex:1, padding:'10px', background:'rgba(255,59,92,0.08)', border:'1px solid rgba(255,59,92,0.25)', color:'#ff3b5c', fontFamily:"var(--font-display)", fontSize:12, fontWeight:900, fontStyle:'italic', letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>Sell Player</button>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </BentoBox>
          );
        })()}

        {/* ═══════════════════════════════
            BOX 2 — SEARCH PLAYERS
        ═══════════════════════════════ */}
        {(section === 'search' || !section) && <SearchSection
          section={section} allPlayers={allPlayers} accent={accent}
          shortlist={shortlist} budget={budget} handleBuy={handleBuy} toggleShortlist={toggleShortlist}
          searchScreen={searchScreen} setSearchScreen={setSearchScreen}
          sfName={sfName} setSfName={setSfName} sfPos={sfPos} setSfPos={setSfPos}
          sfNat={sfNat} setSfNat={setSfNat} sfTeam={sfTeam} setSfTeam={setSfTeam}
          sfLeague={sfLeague} setSfLeague={setSfLeague} sfAge={sfAge} setSfAge={setSfAge}
          sfStatus={sfStatus} setSfStatus={setSfStatus} sfResTabs={sfResTabs} setSfResTabs={setSfResTabs}
          sfSel={sfSel} setSfSel={setSfSel} sfResults={sfResults} setSfResults={setSfResults}
        />}

                {/* ═══════════════════════════════
            BOX 3 — SCOUT (FIFA-style)
        ═══════════════════════════════ */}
        {(section === 'scout' || !section) && <ScoutSection
          section={section} accent={accent} week={week} budget={budget} fmt={fmt}
          resolvedMissions={resolvedMissions} activeMissions={activeMissions} completedMissions={completedMissions}
          scoutRegion={scoutRegion} setScoutRegion={setScoutRegion}
          scoutPos={scoutPos} setScoutPos={setScoutPos}
          scoutDuration={scoutDuration} setScoutDuration={setScoutDuration}
          sendScout={sendScout}
          scoutScreen={scoutScreen} setScoutScreen={setScoutScreen}
          activeScout={activeScout} setActiveScout={setActiveScout}
          scoutReportSel={scoutReportSel} setScoutReportSel={setScoutReportSel}
          scoutReportTab={scoutReportTab} setScoutReportTab={setScoutReportTab}
          scoutDeepPlayer={scoutDeepPlayer} setScoutDeepPlayer={setScoutDeepPlayer}
          shortlist={shortlist} toggleShortlist={toggleShortlist} handleBuy={handleBuy}
        />}

        {/* ═══════════════════════════════
            BOX 4 — YOUTH (bottom middle)
            row: 2, col: 2 split left
        ═══════════════════════════════ */}
        {(section === 'youth' || !section) && <BentoBox style={{ gridColumn: section?'1':'2', gridRow:'2', padding:0, display:'flex', flexDirection:'column', overflow:'hidden', height:'100%' }}>
          {/* Header */}
          <div style={{ padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070', letterSpacing:2, textTransform:'uppercase' }}>Career</span>
              <span style={{ color:'#3b4555' }}>›</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:accent, letterSpacing:2, textTransform:'uppercase' }}>Youth Academy</span>
            </div>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#3b4555' }}>{(youthPlayers||[]).length} prospects</span>
          </div>

          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            {/* Left — player list */}
            <div style={{ width:'48%', flexShrink:0, display:'flex', flexDirection:'column', borderRight:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
              {/* Column headers */}
              <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 28px 36px 36px 60px', gap:4, padding:'6px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
                {['POS','NAME','AGE','OVR','POT','PLAN'].map(h=>(
                  <span key={h} style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#445060', letterSpacing:1.5, textTransform:'uppercase', textAlign: h==='NAME'?'left':'center' }}>{h}</span>
                ))}
              </div>
              {/* List */}
              <div style={{ flex:1, overflowY:'auto' }}>
                {(youthPlayers||[]).length === 0 ? (
                  <div style={{ padding:20, textAlign:'center', fontFamily:"var(--font-mono)", fontSize:7, color:'#3b4555', letterSpacing:2 }}>No youth players</div>
                ) : (youthPlayers||[]).map((p,i)=>{
                  const isSel = syncedYouth?.id===p.id;
                  const potColor = p.potential>=85?'#f5c518':p.potential>=78?'#00e87a':'#9aa3ae';
                  const plan = p.potential>=82?'Attacking...':p.potential>=75?'Balanced':'Sweeper...';
                  return (
                    <div key={p.id} onClick={()=>setSelYouth(p)} className="tr-hov"
                      style={{ display:'grid', gridTemplateColumns:'32px 1fr 28px 36px 36px 60px', gap:4, padding:'8px 10px', alignItems:'center', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', background: isSel?`${accent}12`:'transparent', borderLeft: isSel?`3px solid ${accent}`:'3px solid transparent', transition:'all 0.1s' }}>
                      {/* POS badge */}
                      <div style={{ display:'flex', justifyContent:'center' }}>
                        <span style={{ fontFamily:"var(--font-display)", fontSize:8, fontWeight:900, color:posColor(p.position), letterSpacing:0.5 }}>{p.position}</span>
                      </div>
                      {/* Name */}
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:700, fontStyle:'italic', color: isSel?'#f0f2f5':'#c8d0da', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                      </div>
                      {/* Age */}
                      <div style={{ textAlign:'center', fontFamily:"var(--font-display)", fontSize:11, fontWeight:700, color:'#9aa3b2' }}>{p.age}</div>
                      {/* OVR */}
                      <div style={{ textAlign:'center', fontFamily:"var(--font-display)", fontSize:12, fontWeight:900, color:ovrColor(p.overall) }}>{p.overall}</div>
                      {/* POT */}
                      <div style={{ textAlign:'center', fontFamily:"var(--font-display)", fontSize:12, fontWeight:900, color:potColor }}>{p.potential}</div>
                      {/* Plan */}
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{plan}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right — player detail */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {!syncedYouth ? (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1e2a38" strokeWidth="1.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#1e2a38', letterSpacing:3, textTransform:'uppercase' }}>Select a player</span>
                </div>
              ) : <AcademyDetail p={syncedYouth} accent={accent} fmt={fmt} handlePromote={handlePromote} />}
            </div>
          </div>
        </BentoBox>}

        {/* ═══════════════════════════════
            BOX 5 — HISTORY
        ═══════════════════════════════ */}
        {section === 'history' && <HistorySection history={history} fmt={fmt} accent={accent} />}

      </div>
    </div>
  );
}