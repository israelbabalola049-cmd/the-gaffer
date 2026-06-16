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
                      <img src={`https://flagcdn.com/w20/${nationalityToCode(sfSelPlayer.nationality)}.png`} alt="" style={{ height:11, borderRadius:1, marginLeft:'auto' }} onError={e=>e.target.style.display='none'} />
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
                          <img src={`https://flagcdn.com/w20/${nationalityToCode(hubPlayer.nationality)}.png`} alt="" style={{ height:12, borderRadius:1 }} onError={e=>e.target.style.display='none'} />
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
            BOX 3 — SCOUT (tall right)
            row: 1/3, col: 3
        ═══════════════════════════════ */}
        {(section === 'scout' || !section) && <BentoBox style={{ gridColumn: section?'1':'3', gridRow: section?'1':'1/3' }}>
          <BoxHeader label="Scout" accent={accent} />

          {/* Form */}
          <div style={{ padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, display:'flex', flexDirection:'column', gap:7 }}>
            <div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070', letterSpacing:1.5, textTransform:'uppercase', marginBottom:3 }}>Region</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                {SCOUT_REGIONS.map(r=>(
                  <Pill key={r} text={r} active={scoutRegion===r} accent={accent} onClick={()=>setScoutRegion(r)} small />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070', letterSpacing:1.5, textTransform:'uppercase', marginBottom:3 }}>Position</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                {SCOUT_POSITIONS.map(p=>(
                  <Pill key={p} text={p} active={scoutPos===p} accent={accent} onClick={()=>setScoutPos(p)} small />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070', letterSpacing:1.5, textTransform:'uppercase', marginBottom:3 }}>Duration</div>
              <div style={{ display:'flex', gap:3 }}>
                {SCOUT_DURATIONS.map(d=>(
                  <button key={d.label} onClick={()=>setScoutDuration(d)} style={{ flex:1, padding:'4px 3px', background: scoutDuration.label===d.label?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${scoutDuration.label===d.label?accent:'rgba(255,255,255,0.06)'}`, color: scoutDuration.label===d.label?accent:'#556070', fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', cursor:'pointer', textAlign:'center' }}>
                    <div>{d.label}</div>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:5, color: scoutDuration.label===d.label?`${accent}88`:'#3a4455', letterSpacing:1 }}>{d.quality}</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={sendScout} style={{ width:'100%', padding:'6px', background:`${accent}18`, border:`1px solid ${accent}44`, color:accent, fontFamily:"var(--font-display)", fontSize:10, fontWeight:900, fontStyle:'italic', letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
              Deploy
            </button>
          </div>

          {/* Missions */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {resolvedMissions.length === 0 && (
              <div style={{ padding:14, textAlign:'center', fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', letterSpacing:1.5, opacity:0.5 }}>No missions</div>
            )}
            {activeMissions.map(m=>(
              <div key={m.id} style={{ padding:'6px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:'#f5c518', animation:'scoutPulse 1.5s ease-in-out infinite', flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', color:'#f0f2f5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.region} · {m.posFilter}</div>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070', letterSpacing:1 }}>{m.quality} · W{m.dueWeek-week} left</div>
                </div>
              </div>
            ))}
            {completedMissions.map(m=>(
              <div key={m.id} onClick={()=>{ setViewMission(viewMission?.id===m.id?null:m); setSelScoutPlayer(null); }} style={{ padding:'6px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', gap:6, cursor:'pointer', background: viewMission?.id===m.id?`${accent}10`:'transparent', borderLeft: viewMission?.id===m.id?`2px solid ${accent}`:'2px solid transparent' }}
                onMouseEnter={e=>{if(viewMission?.id!==m.id)e.currentTarget.style.background='rgba(255,255,255,0.02)';}}
                onMouseLeave={e=>{if(viewMission?.id!==m.id)e.currentTarget.style.background='transparent';}}
              >
                <div style={{ width:5, height:5, borderRadius:'50%', background:'#00e87a', flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', color:'#f0f2f5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.region} · {m.posFilter}</div>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#00e87a', letterSpacing:1 }}>{m.results.length} found · {m.quality}</div>
                </div>
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#556070" strokeWidth="2.5"><polyline points={viewMission?.id===m.id?"18 15 12 9 6 15":"9 18 15 12 9 6"}/></svg>
              </div>
            ))}

            {/* Expanded mission results */}
            {viewMission && (
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                {viewMission.results.map((p,i)=>(
                  <div key={p.id} onClick={()=>setSelScoutPlayer(p)} className="tr-hov" style={{ display:'grid', gridTemplateColumns:'16px 1fr 24px 26px', padding:'4px 10px', alignItems:'center', cursor:'pointer', background: selScoutPlayer?.id===p.id?`${accent}12`:'transparent', borderLeft: selScoutPlayer?.id===p.id?`2px solid ${accent}`:'2px solid transparent', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070' }}>{i+1}</span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, color:'#f0f2f5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070' }}>{p.age}y · {fmt(p.value)}</div>
                    </div>
                    <span style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:900, color:ovrColor(p.overall) }}>{p.overall}</span>
                    <span style={{ fontFamily:"var(--font-display)", fontSize:7, fontWeight:700, color:posColor(p.position) }}>{p.position}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DetailCard player={selScoutPlayer} accent={accent} budget={budget} mode="scout" onAction={handleBuy} onShortlist={toggleShortlist} shortlisted={shortlist.some(s=>s.id===selScoutPlayer?.id)} onClose={()=>setSelScoutPlayer(null)} />
        </BentoBox>}

        {/* ═══════════════════════════════
            BOX 4 — YOUTH (bottom middle)
            row: 2, col: 2 split left
        ═══════════════════════════════ */}
        {(section === 'youth' || !section) && <BentoBox style={{ gridColumn: section?'1':'2', gridRow:'2', position:'relative' }}>
          <BoxHeader label="Youth Academy" accent={accent} />
          <div style={{ flex:1, overflowY:'auto' }}>
            {(youthPlayers||[]).length === 0 ? (
              <div style={{ padding:10, textAlign:'center', fontFamily:"var(--font-mono)", fontSize:7, color:'#556070' }}>No youth players</div>
            ) : (youthPlayers||[]).map((p,i)=>{
              const isSel = syncedYouth?.id===p.id;
              const potColor = p.potential>=85?'#f5c518':p.potential>=78?'#00e87a':'#9aa3ae';
              return (
                <div key={p.id} onClick={()=>setSelYouth(p)} className="tr-hov" style={{ display:'grid', gridTemplateColumns:'16px 1fr 24px 32px 24px', padding:'4px 8px', alignItems:'center', cursor:'pointer', background: isSel?`${accent}12`:'transparent', borderLeft: isSel?`2px solid ${accent}`:'2px solid transparent', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'#556070' }}>{i+1}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, color:'#f0f2f5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                  </div>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:900, color:ovrColor(p.overall) }}>{p.overall}</span>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, color:potColor }}>↑{p.potential}</span>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:7, fontWeight:700, color:posColor(p.position) }}>{p.position}</span>
                </div>
              );
            })}
          </div>
          <DetailCard player={syncedYouth} accent={accent} budget={budget} mode="promote" onAction={handlePromote} onShortlist={()=>{}} shortlisted={false} onClose={()=>setSelYouth(null)} />
        </BentoBox>}

        {/* ═══════════════════════════════
            BOX 5 — HISTORY
        ═══════════════════════════════ */}
        {section === 'history' && (() => {
          const totalIn  = history.filter(h=>h.type==='out').reduce((s,h)=>s+(h.fee||0),0);
          const totalOut = history.filter(h=>h.type==='in').reduce((s,h)=>s+(h.fee||0),0);
          const netSpend = totalOut - totalIn;
          return (
            <BentoBox style={{ gridColumn:'1', gridRow:'1' }}>
              <BoxHeader label="Transfer History" accent={accent} />
              <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:16 }}>

                {/* Net spend summary */}
                <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', padding:'12px 14px' }}>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Net Spend (Season)</div>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <span style={{ fontFamily:"var(--font-display)", fontSize:24, fontWeight:900, fontStyle:'italic', color: netSpend>0?'#ff3b5c':'#00e87a' }}>
                      {netSpend>0?'-':'+'}{fmt(Math.abs(netSpend))}
                    </span>
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#ff3b5c' }}>Spent: {fmt(totalOut)}</span>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#00e87a' }}>Recouped: {fmt(totalIn)}</span>
                    </div>
                  </div>
                </div>

                {/* Transaction log */}
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Transaction Log</div>
                  <div style={{ flex:1, overflowY:'auto', border:'1px solid rgba(255,255,255,0.06)' }}>
                    {history.length === 0 ? (
                      <div style={{ padding:16, textAlign:'center', fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', letterSpacing:2 }}>NO TRANSACTIONS YET</div>
                    ) : history.map((h,i)=>(
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'50px 1fr 80px 60px', padding:'8px 12px', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:900, fontStyle:'italic', color: h.type==='in'?'#00e87a':'#ff3b5c', letterSpacing:1 }}>{h.type==='in'?'IN':'OUT'}</span>
                        <span style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:700, color:'#f0f2f5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.player}</span>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070' }}>Week {h.week}</span>
                        <span style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:900, fontStyle:'italic', color: h.type==='in'?'#ff3b5c':'#00e87a', textAlign:'right' }}>{h.type==='in'?'-':'+'}{fmt(h.fee)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BentoBox>
          );
        })()}

      </div>
    </div>
  );
}