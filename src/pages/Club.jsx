import { useState, useMemo, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';
import { ClubBadge, CLUB_COLOR, fmt } from '../components/Layout';

/* ── helpers ── */
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

/* Deterministic pseudo-random helpers seeded by player id, so values are
   stable across renders without needing real data fields yet. */
function seededRand(seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}
function getKitNumber(player) {
  if (!player) return '—';
  if (player.kitNumber) return player.kitNumber;
  if (player.number) return player.number;
  // Goalkeepers traditionally low single digits, outfielders spread 2–33
  if (player.position === 'GK') return (Math.floor(seededRand(player.id) * 3) + 1);
  return Math.floor(seededRand(player.id) * 32) + 2;
}
function getStamina(player) {
  if (!player) return 100;
  if (typeof player.stamina === 'number') return player.stamina;
  // Mocked — stable per player until real fitness tracking exists in the store
  return Math.floor(60 + seededRand(player.id + 0.5) * 40);
}
function staminaColor(v) {
  return v >= 75 ? '#00e87a' : v >= 45 ? '#f5c518' : '#ff3b5c';
}

const FORMATIONS = ['4-3-3','4-4-2','4-2-3-1','3-5-2','5-3-2','4-5-1','3-4-3'];

const FORMATION_POSITIONS = {
  '4-3-3':   [{pos:'GK',x:50,y:90},{pos:'RB',x:80,y:74},{pos:'CB',x:62,y:70},{pos:'CB',x:38,y:70},{pos:'LB',x:20,y:74},{pos:'CM',x:72,y:52},{pos:'CM',x:50,y:48},{pos:'CM',x:28,y:52},{pos:'RW',x:78,y:28},{pos:'ST',x:50,y:22},{pos:'LW',x:22,y:28}],
  '4-4-2':   [{pos:'GK',x:50,y:90},{pos:'RB',x:80,y:74},{pos:'CB',x:62,y:70},{pos:'CB',x:38,y:70},{pos:'LB',x:20,y:74},{pos:'RM',x:82,y:52},{pos:'CM',x:62,y:50},{pos:'CM',x:38,y:50},{pos:'LM',x:18,y:52},{pos:'ST',x:64,y:24},{pos:'ST',x:36,y:24}],
  '4-2-3-1': [{pos:'GK',x:50,y:90},{pos:'RB',x:80,y:74},{pos:'CB',x:62,y:70},{pos:'CB',x:38,y:70},{pos:'LB',x:20,y:74},{pos:'CDM',x:62,y:58},{pos:'CDM',x:38,y:58},{pos:'RM',x:78,y:40},{pos:'CAM',x:50,y:38},{pos:'LM',x:22,y:40},{pos:'ST',x:50,y:20}],
  '3-5-2':   [{pos:'GK',x:50,y:90},{pos:'CB',x:68,y:72},{pos:'CB',x:50,y:70},{pos:'CB',x:32,y:72},{pos:'RM',x:88,y:52},{pos:'CM',x:68,y:48},{pos:'CM',x:50,y:46},{pos:'CM',x:32,y:48},{pos:'LM',x:12,y:52},{pos:'ST',x:64,y:24},{pos:'ST',x:36,y:24}],
  '5-3-2':   [{pos:'GK',x:50,y:90},{pos:'RB',x:88,y:76},{pos:'CB',x:70,y:72},{pos:'CB',x:50,y:70},{pos:'CB',x:30,y:72},{pos:'LB',x:12,y:76},{pos:'CM',x:68,y:48},{pos:'CM',x:50,y:46},{pos:'CM',x:32,y:48},{pos:'ST',x:64,y:24},{pos:'ST',x:36,y:24}],
  '4-5-1':   [{pos:'GK',x:50,y:90},{pos:'RB',x:80,y:74},{pos:'CB',x:62,y:70},{pos:'CB',x:38,y:70},{pos:'LB',x:20,y:74},{pos:'RM',x:86,y:50},{pos:'CM',x:68,y:46},{pos:'CM',x:50,y:44},{pos:'CM',x:32,y:46},{pos:'LM',x:14,y:50},{pos:'ST',x:50,y:20}],
  '3-4-3':   [{pos:'GK',x:50,y:90},{pos:'CB',x:68,y:72},{pos:'CB',x:50,y:70},{pos:'CB',x:32,y:72},{pos:'RM',x:82,y:52},{pos:'CM',x:62,y:48},{pos:'CM',x:38,y:48},{pos:'LM',x:18,y:52},{pos:'RW',x:78,y:26},{pos:'ST',x:50,y:20},{pos:'LW',x:22,y:26}],
};

const PLAYER_ROLES = {
  GK:  ['Goalkeeper','Sweeper Keeper'],
  CB:  ['Ball-Playing CB','Stopper','Cover'],
  LB:  ['Full-Back','Wing-Back','Inverted FB'],
  RB:  ['Full-Back','Wing-Back','Inverted FB'],
  LWB: ['Wing-Back','Full-Back'],
  RWB: ['Wing-Back','Full-Back'],
  CM:  ['Box-to-Box','Deep Lying Playmaker','Mezzala','Carrilero'],
  CDM: ['Anchor','Half-Back','Deep Lying Playmaker','Defensive Mid'],
  CAM: ['Enganche','Advanced Playmaker','Shadow Striker'],
  LM:  ['Wide Midfielder','Winger','Inside Forward'],
  RM:  ['Wide Midfielder','Winger','Inside Forward'],
  ST:  ['Advanced Forward','Poacher','False Nine','Target Man','Pressing Forward'],
  LW:  ['Winger','Inside Forward','Wide Playmaker'],
  RW:  ['Winger','Inside Forward','Wide Playmaker'],
  CF:  ['Advanced Forward','Support Forward','Pressing Forward'],
};

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

/* ── Pitch SVG ── */
/* ── Position matcher for pitch ── */
function assignPlayersToSlots(squad, positions) {
  // Group positions so we never put an attacker at CB etc.
  const positionGroup = p => {
    if (!p) return 'MID';
    if (p === 'GK') return 'GK';
    if (['CB','LB','RB','LWB','RWB'].includes(p)) return 'DEF';
    if (['CDM','DM','CM','CAM','AM','LM','RM'].includes(p)) return 'MID';
    return 'FWD';
  };
  const slotGroup = slot => positionGroup(slot.pos);

  const used = new Set();
  // Two-pass: first assign exact position, then group match
  const result = new Array(positions.length).fill(null);

  // Pass 1 — exact position match, highest OVR first
  const byOvr = [...squad].sort((a,b)=>b.overall-a.overall);
  positions.forEach((slot, i) => {
    const match = byOvr.find(p => !used.has(p.id) && p.position === slot.pos);
    if (match) { result[i] = match; used.add(match.id); }
  });

  // Pass 2 — fill remaining slots with same group
  positions.forEach((slot, i) => {
    if (result[i]) return;
    const g = slotGroup(slot);
    const match = byOvr.find(p => !used.has(p.id) && positionGroup(p.position) === g);
    if (match) { result[i] = match; used.add(match.id); }
  });

  // Pass 3 — leave unmatched slots empty (don't force wrong-position players)
  // (null slots render as empty circles on pitch)

  return result;
}

function Pitch({ formation, assigned, selectedId, hoveredId, onSelectPlayer, onHoverPlayer, previewMode, accent, onSlotDrop, draggingFromSlot, setDraggingFromSlot }) {
  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];
  const list = assigned || new Array(positions.length).fill(null);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', borderRadius:4 }}>
      {/* Grass base */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 340 500" preserveAspectRatio="xMidYMid slice">
        <defs>
          {/* Alternating grass stripes */}
          <pattern id="stripe" x="0" y="0" width="340" height="45.5" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="340" height="22.75" fill="#2d6a2d"/>
            <rect x="0" y="22.75" width="340" height="22.75" fill="#2a622a"/>
          </pattern>
        </defs>
        {/* Grass */}
        <rect width="340" height="500" fill="url(#stripe)"/>

        {/* Pitch outline */}
        <rect x="14" y="14" width="312" height="472" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"/>

        {/* Halfway line */}
        <line x1="14" y1="250" x2="326" y2="250" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5"/>

        {/* Centre circle */}
        <circle cx="170" cy="250" r="52" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5"/>
        <circle cx="170" cy="250" r="3" fill="rgba(255,255,255,0.7)"/>

        {/* Top penalty area */}
        <rect x="72" y="14" width="196" height="80" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5"/>
        {/* Top 6-yard box */}
        <rect x="120" y="14" width="100" height="30" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1"/>
        {/* Top goal */}
        <rect x="140" y="8" width="60" height="12" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
        {/* Top penalty spot */}
        <circle cx="170" cy="68" r="2.5" fill="rgba(255,255,255,0.7)"/>
        {/* Top penalty arc */}
        <path d="M 120 94 A 52 52 0 0 1 220 94" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2"/>

        {/* Bottom penalty area */}
        <rect x="72" y="406" width="196" height="80" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5"/>
        {/* Bottom 6-yard box */}
        <rect x="120" y="456" width="100" height="30" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1"/>
        {/* Bottom goal */}
        <rect x="140" y="480" width="60" height="12" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
        {/* Bottom penalty spot */}
        <circle cx="170" cy="432" r="2.5" fill="rgba(255,255,255,0.7)"/>
        {/* Bottom penalty arc */}
        <path d="M 120 406 A 52 52 0 0 0 220 406" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2"/>

        {/* Corner arcs */}
        <path d="M 14 26 A 12 12 0 0 1 26 14" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1"/>
        <path d="M 314 26 A 12 12 0 0 0 326 14" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" transform="scale(-1,1) translate(-340,0)"/>
        <path d="M 14 474 A 12 12 0 0 0 26 486" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1"/>
        <path d="M 314 474 A 12 12 0 0 1 326 486" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" transform="scale(-1,1) translate(-340,0)"/>
      </svg>

      {/* Player tokens */}
      {positions.map((slot, i) => {
        const player = list[i];
        const isGkSlot = slot.pos === 'GK';
        const kit = isGkSlot ? '#e85ca3' : (accent || posColor(slot.pos));
        const isSelected = player && selectedId === player.id;
        const isHovered  = player && hoveredId  === player.id;
        const stamina = player ? getStamina(player) : null;
        const isDragOver = draggingFromSlot !== null && draggingFromSlot !== i;

        return (
          <div
            key={i}
            draggable={!previewMode && !!player}
            onDragStart={(e) => { if (previewMode || !player) return; setDraggingFromSlot?.(i); e.dataTransfer.effectAllowed = 'move'; }}
            onDragEnd={() => setDraggingFromSlot?.(null)}
            onDragOver={(e) => { if (previewMode) return; e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); if (previewMode) return; onSlotDrop?.(i); }}
            onClick={() => !previewMode && player && onSelectPlayer(player)}
            onMouseEnter={() => !previewMode && player && onHoverPlayer?.(player.id)}
            onMouseLeave={() => !previewMode && onHoverPlayer?.(null)}
            style={{
              position:'absolute',
              left:`${slot.x}%`, top:`${slot.y}%`,
              transform:'translate(-50%,-50%)',
              display:'flex', flexDirection:'column', alignItems:'center', gap:2,
              zIndex:2, cursor: (!previewMode && player) ? 'grab' : 'default',
              transition:'transform 0.15s',
              opacity: draggingFromSlot === i ? 0.4 : 1,
            }}
          >
            <div style={{
              position:'relative', width:36, height:36,
              filter: isSelected ? `drop-shadow(0 0 7px ${kit}cc)` : isHovered ? `drop-shadow(0 0 5px ${kit}88)` : isDragOver ? `drop-shadow(0 0 5px rgba(255,255,255,0.6))` : 'none',
              transition:'filter 0.15s',
              outline: isDragOver ? '2px dashed rgba(255,255,255,0.5)' : 'none',
              outlineOffset:3,
              borderRadius:'50%',
            }}>
              {/* Jersey SVG */}
              <svg viewBox="0 0 64 64" width="36" height="36" style={{ display:'block' }}>
                <path
                  d="M20 6 L8 14 L13 24 L20 20 L20 56 Q32 60 44 56 L44 20 L51 24 L56 14 L44 6 Q38 11 32 11 Q26 11 20 6 Z"
                  fill={previewMode ? `${kit}55` : (isSelected ? kit : `${kit}cc`)}
                  stroke={isSelected || isHovered ? '#fff' : 'rgba(255,255,255,0.55)'}
                  strokeWidth={isSelected ? 2.2 : 1.4}
                />
                {/* collar */}
                <path d="M26 8 Q32 14 38 8" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
              </svg>
              {/* Kit number badge */}
              {!previewMode && (
                <div style={{
                  position:'absolute', top:'48%', left:'50%', transform:'translate(-50%,-50%)',
                  fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:900, color:'#fff',
                  textShadow:'0 1px 2px rgba(0,0,0,0.6)', lineHeight:1, pointerEvents:'none',
                }}>
                  {player ? getKitNumber(player) : '?'}
                </div>
              )}
            </div>
            {/* Stamina bar — between shirt and name */}
            {!previewMode && player && (
              <div style={{ width:32, height:5, background:'rgba(0,0,0,0.55)', border:'1px solid rgba(255,255,255,0.15)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${stamina}%`, background:staminaColor(stamina), transition:'width 0.3s' }} />
              </div>
            )}
            {!previewMode && (
              <div style={{
                fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:700,
                color:'#fff', background:'rgba(0,0,0,0.72)',
                padding:'1px 5px', borderRadius:2,
                whiteSpace:'nowrap', maxWidth:52,
                overflow:'hidden', textOverflow:'ellipsis', letterSpacing:0.3,
              }}>
                {player ? player.name.split(' ').pop() : slot.pos}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Player Card (right panel) ── */
function PlayerCard({ player, accent }) {
  if (!player) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, opacity:0.3 }}>
      <div style={{ fontSize:32 }}>👤</div>
      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:'#556070', letterSpacing:2, textTransform:'uppercase' }}>Select a player</div>
    </div>
  );

  const pc = posColor(player.position);
  const oc = ovrColor(player.overall);
  const stats = [
    { label:'PAC', val: player.pace      || 50 },
    { label:'SHO', val: player.shooting  || 50 },
    { label:'PAS', val: player.passing   || 50 },
    { label:'DRI', val: player.dribbling || 50 },
    { label:'DEF', val: player.defending || 50 },
    { label:'PHY', val: player.physical  || 50 },
  ];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:0, overflow:'hidden' }}>
      {/* Header — with kit number watermark */}
      <div style={{ position:'relative', padding:'12px 12px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', overflow:'hidden' }}>
        {/* Kit number watermark — large ghost number bottom-left */}
        <div style={{ position:'absolute', left:-4, bottom:-16, fontFamily:"'Barlow Condensed',sans-serif", fontSize:140, fontWeight:900, color:'rgba(255,255,255,0.05)', lineHeight:1, userSelect:'none', pointerEvents:'none' }}>{getKitNumber(player)}</div>
        {/* Top row: pos badge + flag + OVR */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ background:`${pc}22`, border:`1px solid ${pc}55`, padding:'2px 7px', fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:pc, letterSpacing:1.5 }}>{player.position}</span>
            <img src={`https://flagcdn.com/w20/${nationalityToCode(player.nationality)}.png`} alt="" style={{ height:10, borderRadius:1, opacity:0.8 }} onError={e=>e.target.style.display='none'} />
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:36, fontWeight:900, color:oc, lineHeight:1 }}>{player.overall}</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:6, color:'#556070', letterSpacing:2 }}>OVR</div>
          </div>
        </div>
        {/* Name */}
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:900, color:'#f0f2f5', lineHeight:1, letterSpacing:0.5, marginBottom:2 }}>{player.name}</div>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070', letterSpacing:1, marginBottom:10 }}>{player.nationality} · {player.age} yrs</div>
        {/* Info row — clean label/value pairs, no boxes */}
        <div style={{ display:'flex', gap:16, marginTop:2 }}>
          {[
            ['KIT', getKitNumber(player)],
            ['VAL', player.value ? `£${(player.value/1e6).toFixed(1)}M` : '—'],
            ['WAGE', player.wage ? `£${(player.wage/1e3).toFixed(0)}K/w` : '—'],
          ].map(([l,v])=>(
            <div key={l} style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:6, color:'#445060', letterSpacing:1 }}>{l}</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color:'#c0c8d4' }}>{v}</span>
            </div>
          ))}
          {/* Boot foot icons */}
          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:6, color:'#445060', letterSpacing:1 }}>FOOT</span>
            <span style={{ fontSize:14, opacity:(player.foot||'Right')==='Left'?1:0.2, transform:'scaleX(-1)', display:'inline-block' }}>👟</span>
            <span style={{ fontSize:14, opacity:(player.foot||'Right')==='Right'?1:0.2, display:'inline-block' }}>👟</span>
          </div>
        </div>
        {/* Stamina bar */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:6, color:'#445060', letterSpacing:1.5, textTransform:'uppercase', flexShrink:0 }}>Stamina</span>
          <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${getStamina(player)}%`, background:staminaColor(getStamina(player)), transition:'width 0.3s' }} />
          </div>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:800, color:staminaColor(getStamina(player)), flexShrink:0 }}>{getStamina(player)}%</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding:'8px 12px', flex:1, overflowY:'auto' }}>
        {stats.map(({ label, val }) => {
          const c = val>=85?'#f5c518':val>=75?'#00e87a':val>=60?'#3b82f6':val>=45?'#9aa3ae':'#ff3b5c';
          return (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'#556070', letterSpacing:1.5, width:26, flexShrink:0 }}>{label}</span>
              <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${val}%`, background:c, transition:'width 0.4s ease' }} />
              </div>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:800, color:c, width:24, textAlign:'right', flexShrink:0 }}>{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Comparison Panel ── */
function ComparePanel({ playerA, playerB, accent, onSwap }) {
  const stats = ['pace','shooting','passing','dribbling','defending','physical'];
  const labels = ['PAC','SHO','PAS','DRI','DEF','PHY'];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Headers */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:4, padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', alignItems:'center' }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, color:'#f0f2f5', lineHeight:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{playerA.name.split(' ').pop()}</div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:posColor(playerA.position), letterSpacing:1 }}>{playerA.position}</div>
        </div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontStyle:'italic', color:'#556070', letterSpacing:2, textTransform:'uppercase' }}>vs</div>
        <div style={{ minWidth:0, textAlign:'right' }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, color:'#f0f2f5', lineHeight:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{playerB.name.split(' ').pop()}</div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:posColor(playerB.position), letterSpacing:1, textAlign:'right' }}>{playerB.position}</div>
        </div>
      </div>

      {/* OVR */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', alignItems:'center' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, fontWeight:900, color:ovrColor(playerA.overall) }}>{playerA.overall}</div>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070', letterSpacing:2 }}>OVR</div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, fontWeight:900, color:ovrColor(playerB.overall), textAlign:'right' }}>{playerB.overall}</div>
      </div>

      {/* Stat rows */}
      <div style={{ flex:1, overflowY:'auto', padding:'4px 12px' }}>
        {stats.map((stat, i) => {
          const a = playerA[stat] || 50;
          const b = playerB[stat] || 50;
          const aWins = a > b;
          const bWins = b > a;
          return (
            <div key={stat} style={{ display:'grid', gridTemplateColumns:'28px 1fr auto 1fr 28px', gap:4, alignItems:'center', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:900, color: aWins?'#00e87a':'#9aa3ae', textAlign:'left' }}>{a}</span>
              <div style={{ height:3, background:'rgba(255,255,255,0.07)', overflow:'hidden', display:'flex', justifyContent:'flex-end' }}>
                <div style={{ height:'100%', width:`${a}%`, background: aWins?'#00e87a':'rgba(255,255,255,0.2)', transition:'width 0.4s' }} />
              </div>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070', letterSpacing:1.5, textAlign:'center', width:26 }}>{labels[i]}</span>
              <div style={{ height:3, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${b}%`, background: bWins?'#00e87a':'rgba(255,255,255,0.2)', transition:'width 0.4s' }} />
              </div>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:900, color: bWins?'#00e87a':'#9aa3ae', textAlign:'right' }}>{b}</span>
            </div>
          );
        })}
      </div>

      {/* Swap button */}
      {onSwap && (
        <div style={{ flexShrink:0, padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onSwap} style={{ width:'100%', padding:'8px 0', background:`${accent}1c`, border:`1px solid ${accent}66`, color:accent, fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:900, letterSpacing:2, textTransform:'uppercase', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <span style={{ fontSize:14, lineHeight:1 }}>⇄</span> Swap Players
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Strategy Tab ── */
function StrategyTab({ accent }) {
  const [mentality, setMentality] = useState('Balanced');
  const [pressing, setPressing]   = useState('Medium');
  const [width, setWidth]         = useState(50);
  const [tempo, setTempo]         = useState(50);
  const [defLine, setDefLine]     = useState('Medium');

  const MENTALITIES = ['Defensive','Cautious','Balanced','Positive','Attacking'];
  const PRESSING    = ['Low Block','Medium','High Press','Gegenpressing'];
  const DEF_LINES   = ['Deep','Medium','High'];

  return (
    <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:14, overflowY:'auto', flex:1 }}>
      <Section label="Mentality">
        <div style={{ display:'flex', gap:4 }}>
          {MENTALITIES.map(m=>(
            <button key={m} onClick={()=>setMentality(m)} style={{ flex:1, padding:'6px 4px', background: mentality===m?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${mentality===m?accent:'rgba(255,255,255,0.08)'}`, color: mentality===m?accent:'#556070', fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', cursor:'pointer' }}>{m}</button>
          ))}
        </div>
      </Section>
      <Section label="Pressing">
        <div style={{ display:'flex', gap:4 }}>
          {PRESSING.map(p=>(
            <button key={p} onClick={()=>setPressing(p)} style={{ flex:1, padding:'6px 4px', background: pressing===p?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${pressing===p?accent:'rgba(255,255,255,0.08)'}`, color: pressing===p?accent:'#556070', fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', cursor:'pointer' }}>{p}</button>
          ))}
        </div>
      </Section>
      <Section label="Defensive Line">
        <div style={{ display:'flex', gap:4 }}>
          {DEF_LINES.map(d=>(
            <button key={d} onClick={()=>setDefLine(d)} style={{ flex:1, padding:'6px 4px', background: defLine===d?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${defLine===d?accent:'rgba(255,255,255,0.08)'}`, color: defLine===d?accent:'#556070', fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', cursor:'pointer' }}>{d}</button>
          ))}
        </div>
      </Section>
      <Section label={`Width — ${width}%`}>
        <input type="range" min={0} max={100} value={width} onChange={e=>setWidth(+e.target.value)} style={{ width:'100%', accentColor: accent }} />
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070' }}>Narrow</span>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070' }}>Wide</span>
        </div>
      </Section>
      <Section label={`Tempo — ${tempo}%`}>
        <input type="range" min={0} max={100} value={tempo} onChange={e=>setTempo(+e.target.value)} style={{ width:'100%', accentColor: accent }} />
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070' }}>Slow</span>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070' }}>Fast</span>
        </div>
      </Section>
    </div>
  );
}

/* ── Roles Tab ── */
function RolesTab({ squad, formation, accent }) {
  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];
  const assigned = assignPlayersToSlots(squad || [], positions);
  const [roles, setRoles] = useState({});

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {positions.map((slot, i) => {
          const player = assigned[i];
          const pc = posColor(slot.pos);
          const availableRoles = PLAYER_ROLES[slot.pos] || PLAYER_ROLES[posGroup(slot.pos)] || ['Default'];
          const currentRole = roles[i] || availableRoles[0];
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width:28, height:20, background:`${pc}22`, border:`1px solid ${pc}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:pc, letterSpacing:1, flexShrink:0 }}>{slot.pos}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color:'#f0f2f5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{player?.name || '—'}</div>
              </div>
              <select
                value={currentRole}
                onChange={e => setRoles(r=>({...r,[i]:e.target.value}))}
                style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${accent}44`, color:accent, fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, padding:'3px 6px', cursor:'pointer', outline:'none', flexShrink:0, maxWidth:140 }}
              >
                {availableRoles.map(r=><option key={r} value={r} style={{ background:'#0c1018' }}>{r}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Gameplan Tab ── */
function GameplanTab({ squad, accent }) {
  const [captain, setCaptain]     = useState(null);
  const [corners, setCorners]     = useState('Inswing');
  const [freeKicks, setFreeKicks] = useState('Direct');
  const [throwIns, setThrowIns]   = useState('Short');
  const [penalties, setPenalties] = useState(null);

  const sorted = [...(squad||[])].sort((a,b)=>b.overall-a.overall).slice(0,5);

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'12px', display:'flex', flexDirection:'column', gap:14 }}>
      <Section label="Captain">
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {sorted.map(p=>(
            <button key={p.id} onClick={()=>setCaptain(p.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background: captain===p.id?`${accent}15`:'rgba(255,255,255,0.03)', border:`1px solid ${captain===p.id?accent:'rgba(255,255,255,0.07)'}`, cursor:'pointer', textAlign:'left' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:`${posColor(p.position)}33`, border:`1px solid ${posColor(p.position)}66`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:900, color:'#fff' }}>{p.overall}</div>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color: captain===p.id?accent:'#9aa3b2', flex:1 }}>{p.name}</span>
              {captain===p.id && <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:accent, letterSpacing:1 }}>C</span>}
            </button>
          ))}
        </div>
      </Section>
      <Section label="Penalty Taker">
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {sorted.slice(0,3).map(p=>(
            <button key={p.id} onClick={()=>setPenalties(p.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background: penalties===p.id?`${accent}15`:'rgba(255,255,255,0.03)', border:`1px solid ${penalties===p.id?accent:'rgba(255,255,255,0.07)'}`, cursor:'pointer', textAlign:'left' }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color: penalties===p.id?accent:'#9aa3b2', flex:1 }}>{p.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section label="Corner Kicks">
        <div style={{ display:'flex', gap:4 }}>
          {['Inswing','Outswing','Short','Driven'].map(c=>(
            <button key={c} onClick={()=>setCorners(c)} style={{ flex:1, padding:'5px 4px', background: corners===c?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${corners===c?accent:'rgba(255,255,255,0.08)'}`, color: corners===c?accent:'#556070', fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:700, textTransform:'uppercase', cursor:'pointer' }}>{c}</button>
          ))}
        </div>
      </Section>
      <Section label="Free Kicks">
        <div style={{ display:'flex', gap:4 }}>
          {['Direct','Whipped','Short'].map(f=>(
            <button key={f} onClick={()=>setFreeKicks(f)} style={{ flex:1, padding:'5px 4px', background: freeKicks===f?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${freeKicks===f?accent:'rgba(255,255,255,0.08)'}`, color: freeKicks===f?accent:'#556070', fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:700, textTransform:'uppercase', cursor:'pointer' }}>{f}</button>
          ))}
        </div>
      </Section>
      <Section label="Throw-Ins">
        <div style={{ display:'flex', gap:4 }}>
          {['Short','Long','Mixed'].map(t=>(
            <button key={t} onClick={()=>setThrowIns(t)} style={{ flex:1, padding:'5px 4px', background: throwIns===t?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${throwIns===t?accent:'rgba(255,255,255,0.08)'}`, color: throwIns===t?accent:'#556070', fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:700, textTransform:'uppercase', cursor:'pointer' }}>{t}</button>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ── Lineup / Squad list (right panel when no player selected) ── */
function SquadList({ squad, youthPlayers, onSelect, selectedId, hoveredId, onHover, accent, compact, pitchIds, onOpenKitModal, setDraggingBenchId }) {
  const [posFilter, setPosFilter] = useState('ALL');
  const filtered = useMemo(()=>{
    if (!squad) return [];
    if (posFilter==='ALL') return squad;
    return squad.filter(p=>posGroup(p.position)===posFilter);
  },[squad,posFilter]);

  // All squad sorted by OVR
  const allSorted = useMemo(()=>[...(squad||[])].sort((a,b)=>b.overall-a.overall),[squad]);
  // Bench = players not assigned to pitch slots
  const bench = useMemo(()=>allSorted.filter(p=>!(pitchIds||new Set()).has(p.id)),[allSorted,pitchIds]);
  // For the list we show bench players (filtered by pos if needed)
  const sorted = useMemo(()=>{
    const src = posFilter==='ALL' ? bench : bench.filter(p=>posGroup(p.position)===posFilter);
    return src;
  },[bench,posFilter]);

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* pos filter */}
      <div style={{ display:'flex', gap:4, padding:'8px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        {['ALL','GK','DEF','MID','FWD'].map(f=>(
          <button key={f} onClick={()=>setPosFilter(f)} style={{ padding:'3px 8px', background: posFilter===f?`${accent}22`:'transparent', border:`1px solid ${posFilter===f?accent:'rgba(255,255,255,0.08)'}`, color: posFilter===f?accent:'#556070', fontFamily:"'Share Tech Mono',monospace", fontSize:8, letterSpacing:1.5, cursor:'pointer' }}>{f}</button>
        ))}
      </div>
      {/* section label + kit edit trigger */}
      <div style={{ padding:'5px 10px 3px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070', letterSpacing:2, textTransform:'uppercase' }}>Bench</span>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#3b4555' }}>{bench.length} players</span>
        </div>
        {onOpenKitModal && <button onClick={onOpenKitModal} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#556070', fontFamily:"'Share Tech Mono',monospace", fontSize:6, letterSpacing:1, padding:'2px 7px', cursor:'pointer' }}>KIT #</button>}
      </div>
      {/* header */}
      <div style={{ display:'grid', gridTemplateColumns:'26px 1fr 38px 32px 28px', gap:6, padding:'3px 10px 5px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        {['#','Player','OVR','AGE','POS'].map(h=>(
          <span key={h} style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070', letterSpacing:1.5, textTransform:'uppercase', textAlign: h==='Player'?'left':h==='#'?'center':'center' }}>{h}</span>
        ))}
      </div>
      {/* list */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {sorted.map((p, i)=>{
          const oc = ovrColor(p.overall);
          const pc = posColor(p.position);
          const isSelected = selectedId===p.id;
          const isHov = hoveredId===p.id;
          const isActive = isSelected||isHov;
          return (
            <div key={p.id}
              draggable
              onDragStart={(e) => { setDraggingBenchId?.(p.id); e.dataTransfer.effectAllowed = 'move'; }}
              onDragEnd={() => setDraggingBenchId?.(null)}
              onClick={()=>onSelect(p)}
              onMouseEnter={()=>onHover(p.id)}
              onMouseLeave={()=>onHover(null)}
              style={{
                display:'grid', gridTemplateColumns:'26px 1fr 38px 32px 28px', gap:6,
                padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)',
                cursor:'grab',
                background: isSelected?`${accent}10`:isHov?'rgba(255,255,255,0.03)':'transparent',
                borderLeft: isSelected?`2px solid ${accent}`:'2px solid transparent',
                transition:'all 0.1s',
              }}
            >
              {/* kit number = bench slot */}
              <div style={{ textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:900, color:'#556070', alignSelf:'center' }}>{allSorted.indexOf(p)+1}</div>
              {/* name + nationality */}
              <div style={{ minWidth:0 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:compact?11:13, fontWeight:700, color: isSelected?'#f0f2f5':'#d0d4da', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#3b4555', letterSpacing:0.5 }}>{p.nationality}</div>
              </div>
              {/* OVR */}
              <div style={{ textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:900, color:oc, alignSelf:'center' }}>{p.overall}</div>
              {/* AGE */}
              <div style={{ textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, color:'#9aa3b2', alignSelf:'center' }}>{p.age}</div>
              {/* position — plain text, no box */}
              <div style={{ textAlign:'center', fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:pc, letterSpacing:0.5, alignSelf:'center' }}>{p.position}</div>
            </div>
          );
        })}

        {/* Reserves — promoted youth players live here */}
        {youthPlayers?.length > 0 && (
          <>
            <div style={{ padding:'6px 10px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070', letterSpacing:2, textTransform:'uppercase' }}>Reserves</span>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#3b4555' }}>{youthPlayers.length} players</span>
            </div>
            {youthPlayers.map((p, i)=>{
              const pc = posColor(p.position);
              const isSelected = selectedId===p.id;
              const isHov = hoveredId===p.id;
              return (
                <div key={p.id} onClick={()=>onSelect(p)} onMouseEnter={()=>onHover(p.id)} onMouseLeave={()=>onHover(null)}
                  style={{
                    display:'grid', gridTemplateColumns:'26px 1fr 38px 32px 28px', gap:6,
                    padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)',
                    cursor:'pointer', opacity:0.65,
                    background: isSelected?'rgba(59,130,246,0.08)':isHov?'rgba(255,255,255,0.03)':'transparent',
                    borderLeft: isSelected?'2px solid #3b82f6':'2px solid transparent',
                    transition:'all 0.1s',
                  }}
                >
                  <div style={{ textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:900, color:'#3b4555', alignSelf:'center' }}>R{i+1}</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:compact?11:13, fontWeight:700, color:'#9aa3b2', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                    <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#3b82f6', letterSpacing:0.5 }}>Reserve · {p.potential} pot</div>
                  </div>
                  <div style={{ textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:900, color:'#9aa3b2', alignSelf:'center' }}>{p.overall}</div>
                  <div style={{ textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, color:'#9aa3b2', alignSelf:'center' }}>{p.age}</div>
                  <div style={{ textAlign:'center', fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:pc, letterSpacing:0.5, alignSelf:'center' }}>{p.position}</div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Kit Number Modal ── */
function KitNumberModal({ squad, accent, onClose }) {
  const [kitNumbers, setKitNumbers] = useState(() => {
    const init = {};
    (squad||[]).forEach(p => { init[p.id] = getKitNumber(p); });
    return init;
  });
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal]     = useState('');

  const sorted = [...(squad||[])].sort((a,b)=>(kitNumbers[a.id]||99)-(kitNumbers[b.id]||99));

  const startEdit = (p) => { setEditingId(p.id); setEditVal(String(kitNumbers[p.id]||'')); };
  const commitEdit = (p) => {
    const n = parseInt(editVal);
    if (!isNaN(n) && n>0 && n<=99) setKitNumbers(k=>({...k,[p.id]:n}));
    setEditingId(null);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ width:340, maxHeight:'70vh', background:'#0c1018', border:'1px solid rgba(255,255,255,0.1)', borderRadius:3, display:'flex', flexDirection:'column', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, color:'#f0f2f5', letterSpacing:1, textTransform:'uppercase' }}>Kit Numbers</span>
          <button onClick={onClose} style={{ width:22, height:22, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', color:'#9aa3b2', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {sorted.map(p=>{
            const pc = posColor(p.position);
            const isEditing = editingId===p.id;
            return (
              <div key={p.id} style={{ display:'grid', gridTemplateColumns:'44px 1fr 28px', gap:8, padding:'7px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', alignItems:'center' }}>
                <div onClick={()=>startEdit(p)} style={{ display:'flex', justifyContent:'center', cursor:'pointer' }}>
                  {isEditing ? (
                    <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                      onBlur={()=>commitEdit(p)} onKeyDown={e=>{ if(e.key==='Enter')commitEdit(p); if(e.key==='Escape')setEditingId(null); }}
                      style={{ width:36, textAlign:'center', background:'rgba(255,255,255,0.08)', border:`1px solid ${accent}`, color:'#f0f2f5', fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, padding:'2px 4px', outline:'none' }}
                    />
                  ) : (
                    <div style={{ width:36, height:26, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, color:'#c0c8d4', cursor:'pointer' }}>
                      {kitNumbers[p.id]||'—'}
                    </div>
                  )}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color:'#d0d4da', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:6, color:'#3b4555' }}>{p.age} yrs</div>
                </div>
                <div style={{ textAlign:'center', fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:pc }}>{p.position}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Add Team Sheet modal ── */
function AddTeamSheetModal({ accent, currentFormation, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [formationVal, setFormationVal] = useState(currentFormation || '4-3-3');
  const [mentality, setMentality] = useState('Balanced');

  const MENTALITIES = ['Defensive', 'Cautious', 'Balanced', 'Positive', 'Attacking'];

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), formation: formationVal, mentality });
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ width:380, background:'#0c1018', border:'1px solid rgba(255,255,255,0.1)', borderRadius:3, display:'flex', flexDirection:'column', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, color:'#f0f2f5', letterSpacing:1, textTransform:'uppercase' }}>Add Team Sheet</span>
          <button onClick={onClose} style={{ width:22, height:22, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', color:'#9aa3b2', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Name */}
          <div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Name</div>
            <input autoFocus value={name} onChange={e=>setName(e.target.value)}
              placeholder="e.g. vs Big Teams"
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#f0f2f5', fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, padding:'8px 10px', outline:'none', boxSizing:'border-box' }}
            />
          </div>

          {/* Formation */}
          <div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Formation</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {FORMATIONS.map(f => (
                <button key={f} onClick={()=>setFormationVal(f)}
                  style={{ padding:'5px 12px', background: formationVal===f?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${formationVal===f?accent:'rgba(255,255,255,0.08)'}`, color: formationVal===f?accent:'#9aa3b2', fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:900, letterSpacing:0.5, cursor:'pointer' }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Mentality */}
          <div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Mentality</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {MENTALITIES.map(m => (
                <button key={m} onClick={()=>setMentality(m)}
                  style={{ padding:'5px 10px', background: mentality===m?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${mentality===m?accent:'rgba(255,255,255,0.08)'}`, color: mentality===m?accent:'#9aa3b2', fontFamily:"'Share Tech Mono',monospace", fontSize:8, letterSpacing:0.5, cursor:'pointer', textTransform:'uppercase' }}>{m}</button>
              ))}
            </div>
          </div>

          <button onClick={handleCreate} disabled={!name.trim()}
            style={{ padding:'9px 0', background: name.trim()?`${accent}22`:'rgba(255,255,255,0.03)', border:`1px solid ${name.trim()?accent:'rgba(255,255,255,0.1)'}`, color: name.trim()?accent:'#3b4555', fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:900, letterSpacing:2, textTransform:'uppercase', cursor: name.trim()?'pointer':'default', marginTop:2 }}>
            Create Team Sheet
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Section wrapper ── */
function Section({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'#556070', letterSpacing:2, textTransform:'uppercase' }}>{label}</div>
      {children}
    </div>
  );
}

/* ── Bench strip ── */
function BenchStrip({ squad, pitchIds, accent, onSlotDrop, draggingFromSlot, setDraggingFromSlot, draggingBenchId, setDraggingBenchId }) {
  const sorted = [...(squad||[])].sort((a,b)=>b.overall-a.overall);
  const subs = sorted.filter(p => !(pitchIds||new Set()).has(p.id));

  if (!subs.length) return null;

  const isPitchDragActive = draggingFromSlot !== null;

  return (
    <div
      onDragOver={(e) => { if (isPitchDragActive) e.preventDefault(); }}
      onDrop={(e) => { e.preventDefault(); if (isPitchDragActive) { onSlotDrop?.('bench'); } }}
      style={{
        flexShrink:0, borderTop:'1px solid rgba(255,255,255,0.07)', padding:'8px 8px 4px',
        background: isPitchDragActive ? 'rgba(255,255,255,0.03)' : 'transparent',
        transition:'background 0.15s',
      }}
    >
      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>
        Subs {isPitchDragActive && <span style={{ color:accent }}>· drop here to bench</span>}
      </div>
      <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none' }}>
        {subs.map(p=>{
          const isGk = p.position === 'GK';
          const kit = isGk ? '#e85ca3' : (accent || posColor(p.position));
          const stamina = getStamina(p);
          return (
            <div key={p.id}
              draggable
              onDragStart={(e) => { setDraggingBenchId?.(p.id); e.dataTransfer.effectAllowed = 'move'; }}
              onDragEnd={() => setDraggingBenchId?.(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (draggingFromSlot !== null) onSlotDrop?.('bench'); }}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0, cursor:'grab' }}
            >
              <div style={{ position:'relative', width:30, height:30 }}>
                <svg viewBox="0 0 64 64" width="30" height="30" style={{ display:'block' }}>
                  <path d="M20 6 L8 14 L13 24 L20 20 L20 56 Q32 60 44 56 L44 20 L51 24 L56 14 L44 6 Q38 11 32 11 Q26 11 20 6 Z" fill={`${kit}cc`} stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                </svg>
                <div style={{ position:'absolute', top:'48%', left:'50%', transform:'translate(-50%,-50%)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:900, color:'#fff', textShadow:'0 1px 2px rgba(0,0,0,0.6)' }}>{getKitNumber(p)}</div>
              </div>
              <div style={{ width:30, height:3, background:'rgba(0,0,0,0.55)', border:'1px solid rgba(255,255,255,0.15)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${stamina}%`, background:staminaColor(stamina) }} />
              </div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:8, fontWeight:700, color:'#9aa3b2', whiteSpace:'nowrap', maxWidth:44, overflow:'hidden', textOverflow:'ellipsis' }}>{p.name.split(' ').pop()}</div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:6, color:posColor(p.position), letterSpacing:1 }}>{p.position}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SQUAD HUB — full player list
══════════════════════════════════════════ */
function SquadHubView({ squad, youthPlayers, accent, onBack }) {
  const [posFilter, setPosFilter] = useState('ALL');
  const allPlayers = useMemo(() => {
    const main = (squad || []).map(p => ({ ...p, _type: 'squad' }));
    const youth = (youthPlayers || []).map(p => ({ ...p, _type: 'loan' }));
    return [...main, ...youth].sort((a, b) => b.overall - a.overall);
  }, [squad, youthPlayers]);

  const filtered = useMemo(() => {
    if (posFilter === 'ALL') return allPlayers;
    return allPlayers.filter(p => posGroup(p.position) === posFilter);
  }, [allPlayers, posFilter]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9aa3b2', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700, padding: '4px 10px', cursor: 'pointer', letterSpacing: 1 }}>← BACK</button>
        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 900, color: '#f0f2f5', letterSpacing: 1, textTransform: 'uppercase' }}>Squad Hub</span>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#556070', letterSpacing: 1.5, marginLeft: 4 }}>{allPlayers.length} PLAYERS</span>
      </div>
      {/* Pos filter */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map(f => (
          <button key={f} onClick={() => setPosFilter(f)} style={{ padding: '3px 10px', background: posFilter === f ? `${accent}22` : 'transparent', border: `1px solid ${posFilter === f ? accent : 'rgba(255,255,255,0.08)'}`, color: posFilter === f ? accent : '#556070', fontFamily: "'Share Tech Mono',monospace", fontSize: 8, letterSpacing: 1.5, cursor: 'pointer' }}>{f}</button>
        ))}
      </div>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 40px 32px 32px 50px', gap: 6, padding: '4px 14px 6px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {['#', 'Player', 'OVR', 'AGE', 'POS', 'STATUS'].map(h => (
          <span key={h} style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 1.5, textAlign: h === 'Player' ? 'left' : 'center' }}>{h}</span>
        ))}
      </div>
      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map((p, i) => {
          const oc = ovrColor(p.overall);
          const pc = posColor(p.position);
          const isLoan = p._type === 'loan';
          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 40px 32px 32px 50px', gap: 6, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', background: isLoan ? 'rgba(245,197,24,0.03)' : 'transparent' }}>
              <div style={{ textAlign: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 900, color: '#3b4555' }}>{i + 1}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, color: '#d0d4da', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#3b4555', letterSpacing: 0.5 }}>{p.nationality}</div>
              </div>
              <div style={{ textAlign: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 900, color: oc }}>{p.overall}</div>
              <div style={{ textAlign: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#9aa3b2' }}>{p.age}</div>
              <div style={{ textAlign: 'center', fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: pc, letterSpacing: 0.5 }}>{p.position}</div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 6, letterSpacing: 1, padding: '2px 5px', border: `1px solid ${isLoan ? '#f5c51855' : `${accent}44`}`, color: isLoan ? '#f5c518' : accent, borderRadius: 2 }}>{isLoan ? 'LOAN' : 'SQUAD'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   EDIT PLAYERS VIEW
══════════════════════════════════════════ */
function EditPlayersView({ squad, accent, onBack }) {
  const [editingId, setEditingId] = useState(null);
  const [edits, setEdits] = useState({});
  const sorted = useMemo(() => [...(squad || [])].sort((a, b) => b.overall - a.overall), [squad]);

  const ATTR_KEYS = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
  const ATTR_LABELS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

  const editingPlayer = editingId ? sorted.find(p => p.id === editingId) : null;
  const playerEdits = editingId ? (edits[editingId] || {}) : {};

  const getValue = (key) => playerEdits[key] !== undefined ? playerEdits[key] : (editingPlayer?.[key] || '');
  const setValue = (key, val) => setEdits(e => ({ ...e, [editingId]: { ...(e[editingId] || {}), [key]: val } }));

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Player list */}
      <div style={{ width: editingPlayer ? 200 : '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: editingPlayer ? '1px solid rgba(255,255,255,0.07)' : 'none', transition: 'width 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9aa3b2', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700, padding: '4px 10px', cursor: 'pointer', letterSpacing: 1 }}>← BACK</button>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 900, color: '#f0f2f5', letterSpacing: 1, textTransform: 'uppercase' }}>Edit Players</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sorted.map(p => {
            const pc = posColor(p.position);
            const oc = ovrColor(p.overall);
            const isSelected = editingId === p.id;
            return (
              <div key={p.id} onClick={() => setEditingId(isSelected ? null : p.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: isSelected ? `${accent}12` : 'transparent', borderLeft: isSelected ? `2px solid ${accent}` : '2px solid transparent', transition: 'all 0.1s' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${pc}33`, border: `1.5px solid ${pc}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 900, color: oc, flexShrink: 0 }}>{p.overall}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, color: isSelected ? '#f0f2f5' : '#d0d4da', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 6, color: pc, letterSpacing: 1 }}>{p.position}</div>
                </div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#3b4555', letterSpacing: 1 }}>EDIT</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit panel */}
      {editingPlayer && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeIn 0.15s ease' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 900, color: '#f0f2f5', letterSpacing: 0.5 }}>{editingPlayer.name}</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 1.5, textTransform: 'uppercase' }}>{editingPlayer.position} · {editingPlayer.age} yrs</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Name edit */}
            <div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5 }}>Name</div>
              <input value={getValue('name')} onChange={e => setValue('name', e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f2f5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, padding: '6px 10px', outline: 'none', boxSizing: 'border-box' }}
                placeholder={editingPlayer.name} />
            </div>
            {/* Attributes */}
            <div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Attributes</div>
              {ATTR_KEYS.map((key, i) => {
                const val = parseInt(getValue(key)) || editingPlayer[key] || 50;
                const c = val >= 85 ? '#f5c518' : val >= 75 ? '#00e87a' : val >= 60 ? '#3b82f6' : val >= 45 ? '#9aa3ae' : '#ff3b5c';
                return (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 44px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 1.5 }}>{ATTR_LABELS[i]}</span>
                    <input type="range" min={1} max={99} value={val}
                      onChange={e => setValue(key, parseInt(e.target.value))}
                      style={{ accentColor: accent }} />
                    <input type="number" min={1} max={99} value={val}
                      onChange={e => setValue(key, parseInt(e.target.value) || val)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${c}44`, color: c, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 900, padding: '3px 6px', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }} />
                  </div>
                );
              })}
            </div>
            {/* Save button */}
            <button style={{ padding: '8px 0', background: `${accent}22`, border: `1px solid ${accent}`, color: accent, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', marginTop: 4 }}>
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const TABS = [
  { id:'lineup',    label:'Lineup'    },
  { id:'formation', label:'Formation' },
  { id:'strategy',  label:'Strategy'  },
  { id:'roles',     label:'Roles'     },
  { id:'gameplan',  label:'Gameplan'  },
];

export default function Team() {
  const { squad, youthPlayers, formation, setFormation, myClub, teamSheets, activeTeamSheetId, setActiveTeamSheet, addTeamSheet, deleteTeamSheet } = useGameStore();
  const accent = myClub?.color || CLUB_COLOR[myClub?.name] || '#00e87a';

  // hub navigation: null = hub landing, 'tactics' = big card, 'squadhub' = squad hub, 'editplayers' = edit
  const [hubView, setHubView] = useState(null);
  const [tab, setTab]               = useState('lineup');
  const [selectedPlayer, setSelected] = useState(null);
  const [hoveredId, setHovered]       = useState(null);
  const [showKitModal, setShowKitModal] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);

  // ── Lineup state (slot index -> playerId or null), persists manual swaps ──
  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];
  const [lineupIds, setLineupIds] = useState(() =>
    assignPlayersToSlots(squad || [], positions).map(p => p ? p.id : null)
  );
  const [draggingFromSlot, setDraggingFromSlot] = useState(null);
  const [draggingBenchId, setDraggingBenchId] = useState(null);

  // Re-derive lineup whenever formation changes (different slot count/shape)
  // or the squad itself changes (e.g. a transfer). Manual in-session swaps
  // are preserved across re-renders triggered by anything else.
  const prevFormation = useRef(formation);
  const prevSquadRef  = useRef(squad);
  useEffect(() => {
    const formationChanged = prevFormation.current !== formation;
    const squadChanged = prevSquadRef.current !== squad;
    if (formationChanged || squadChanged) {
      setLineupIds(assignPlayersToSlots(squad || [], FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3']).map(p => p ? p.id : null));
      prevFormation.current = formation;
      prevSquadRef.current = squad;
    }
  }, [formation, squad]);

  const findPlayer = (id) => (squad || []).find(p => p.id === id) || null;
  const pitchAssigned = useMemo(() => lineupIds.map(id => findPlayer(id)), [lineupIds, squad]);
  const pitchIds = useMemo(() => new Set(pitchAssigned.filter(Boolean).map(p => p.id)), [pitchAssigned]);

  // Swap two pitch slots (GK can only swap with GK)
  const swapPitchSlots = (i, j) => {
    if (i === j) return;
    const slotA = positions[i], slotB = positions[j];
    if ((slotA.pos === 'GK') !== (slotB.pos === 'GK')) return; // block GK <-> outfield
    setLineupIds(prev => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  // Swap a bench player into a pitch slot (the slot's current occupant goes to bench)
  const swapBenchIntoSlot = (benchPlayerId, slotIndex) => {
    const benchPlayer = findPlayer(benchPlayerId);
    if (!benchPlayer) return;
    const slot = positions[slotIndex];
    const isGkSlot = slot.pos === 'GK';
    const benchIsGk = benchPlayer.position === 'GK';
    if (isGkSlot !== benchIsGk) return; // GK slot only accepts GK, outfield slot only accepts outfield
    setLineupIds(prev => {
      const next = [...prev];
      next[slotIndex] = benchPlayerId;
      return next;
    });
  };

  const handleSlotDrop = (targetSlotIndex) => {
    if (targetSlotIndex === 'bench') {
      // Dragging a pitch player onto the bench strip — just vacate that slot
      if (draggingFromSlot !== null) {
        setLineupIds(prev => {
          const next = [...prev];
          next[draggingFromSlot] = null;
          return next;
        });
        setDraggingFromSlot(null);
      }
      return;
    }
    if (draggingBenchId !== null) {
      swapBenchIntoSlot(draggingBenchId, targetSlotIndex);
      setDraggingBenchId(null);
      return;
    }
    if (draggingFromSlot !== null) {
      swapPitchSlots(draggingFromSlot, targetSlotIndex);
      setDraggingFromSlot(null);
    }
  };

  const handleSelectPlayer = (p) => {
    if (selectedPlayer?.id === p.id) { setSelected(null); return; }
    setSelected(p);
  };

  // Compare: any selected player + hovering any OTHER player (list or pitch)
  const showCompare = !!(selectedPlayer && hoveredId && hoveredId !== selectedPlayer.id);
  const hoveredPlayer = showCompare ? (squad||[]).find(p=>p.id===hoveredId) || (youthPlayers||[]).find(p=>p.id===hoveredId) : null;

  // Swap the two currently-compared players (selected <-> hovered), wherever they sit
  const swapComparedPlayers = () => {
    if (!selectedPlayer || !hoveredPlayer) return;
    const slotA = lineupIds.indexOf(selectedPlayer.id);
    const slotB = lineupIds.indexOf(hoveredPlayer.id);
    if (slotA !== -1 && slotB !== -1) { swapPitchSlots(slotA, slotB); return; }
    if (slotA !== -1 && slotB === -1) { swapBenchIntoSlot(hoveredPlayer.id, slotA); return; }
    if (slotB !== -1 && slotA === -1) { swapBenchIntoSlot(selectedPlayer.id, slotB); return; }
    // both on bench — nothing to swap positionally
  };

  // Navigate into big card (tactics) at a specific tab
  const openTactics = (startTab = 'lineup') => {
    setTab(startTab);
    setHubView('tactics');
  };

  // ── Sub-views ──
  if (hubView === 'squadhub') {
    return (
      <>
        <style>{`@keyframes fadeIn { from{opacity:0} to{opacity:1} }`}</style>
        <div style={{ height: '100%', overflow: 'hidden', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease' }}>
          <SquadHubView squad={squad} youthPlayers={youthPlayers} accent={accent} onBack={() => setHubView(null)} />
        </div>
      </>
    );
  }

  if (hubView === 'editplayers') {
    return (
      <>
        <style>{`@keyframes fadeIn { from{opacity:0} to{opacity:1} }`}</style>
        <div style={{ height: '100%', overflow: 'hidden', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease' }}>
          <EditPlayersView squad={squad} accent={accent} onBack={() => setHubView(null)} />
        </div>
      </>
    );
  }

  if (hubView === 'teamsheets') {
    const sheets = teamSheets || [];
    const activeSheet = sheets.find(s => s.id === activeTeamSheetId) || sheets[0];

    return (
      <>
        <style>{`@keyframes fadeIn { from{opacity:0} to{opacity:1} }`}</style>
        <div style={{ height: '100%', overflow: 'hidden', background: 'var(--bg-1)', display: 'flex', animation: 'fadeIn 0.2s ease' }}>

          {/* Left — list of saved team sheets */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <button onClick={() => setHubView(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9aa3b2', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700, padding: '4px 10px', cursor: 'pointer', letterSpacing: 1 }}>← BACK</button>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 900, color: '#f0f2f5', letterSpacing: 1, textTransform: 'uppercase' }}>Team Sheets</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {sheets.map(s => {
                const isActive = s.id === activeTeamSheetId;
                return (
                  <button key={s.id} onClick={() => setActiveTeamSheet(s.id)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 4, background: isActive ? `${accent}14` : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? `${accent}55` : 'rgba(255,255,255,0.07)'}`, borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 900, color: isActive ? accent : '#d0d4da', letterSpacing: 0.3, textTransform: 'uppercase' }}>{s.name}</span>
                      <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: isActive ? accent : '#556070', letterSpacing: 0.5 }}>{s.formation}</span>
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 0.5, lineHeight: 1.4 }}>{s.mentality}</div>
                    {isActive && (
                      <div style={{ position: 'absolute', top: 8, right: 8, fontFamily: "'Share Tech Mono',monospace", fontSize: 6, color: accent, letterSpacing: 1, border: `1px solid ${accent}55`, padding: '1px 5px' }}>ACTIVE</div>
                    )}
                  </button>
                );
              })}
              {sheets.length === 0 && (
                <div style={{ padding: '20px 12px', textAlign: 'center', fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#3b4555', letterSpacing: 0.5 }}>No team sheets yet</div>
              )}
            </div>
            {/* Add team sheet */}
            <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <button onClick={() => setShowAddSheet(true)}
                style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: `1px dashed ${accent}55`, borderRadius: 3, color: accent, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Add Team Sheet
              </button>
            </div>
          </div>

          {/* Right — wide preview of the ACTIVE sheet, clickable to open full screen */}
          <div onClick={() => activeSheet && openTactics(tab)} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: activeSheet ? 'pointer' : 'default', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'transparent' }} />
            {activeSheet ? (
              <>
                {/* Header */}
                <div style={{ flexShrink: 0, padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 6, position: 'relative' }}>
                  <div>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>{activeSheet.mentality} · Team Sheet</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, fontWeight: 900, color: '#f0f2f5', lineHeight: 1, letterSpacing: 0.5 }}>
                      {activeSheet.name} <span style={{ color: accent, marginLeft: 4 }}>· {activeSheet.formation}</span>
                      <span style={{ color: accent, marginLeft: 6 }}>▶</span>
                    </div>
                  </div>
                </div>

                {/* Preview body — pitch shape for the active sheet's formation */}
                <div style={{ flex: 1, overflow: 'hidden', pointerEvents: 'none', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0 }}>
                  <div style={{ width: '100%', height: 'auto', maxHeight: '100%', aspectRatio: '0.68', filter: 'blur(1.5px) saturate(0.65) brightness(0.7)', opacity: 0.78 }}>
                    <Pitch formation={activeSheet.formation} assigned={assignPlayersToSlots(squad || [], FORMATION_POSITIONS[activeSheet.formation] || FORMATION_POSITIONS['4-3-3'])} selectedId={null} hoveredId={null} onSelectPlayer={() => {}} previewMode accent={accent} />
                  </div>
                  <div style={{ position: 'absolute', inset: 10, background: 'linear-gradient(180deg, rgba(7,10,15,0) 55%, rgba(7,10,15,0.55) 100%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', inset: 10, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.35)', pointerEvents: 'none' }} />
                </div>

                <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 6, fontFamily: "'Share Tech Mono',monospace", fontSize: 6, color: '#556070', letterSpacing: 2, textTransform: 'uppercase', padding: '2px 7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,10,15,0.6)' }}>Preview</div>
                <div style={{ position: 'absolute', bottom: 12, right: 14, zIndex: 6, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 700, fontStyle: 'italic', color: accent, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.7 }}>Open →</div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, color: '#556070', letterSpacing: 1, textTransform: 'uppercase' }}>No team sheet selected</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#3b4555', letterSpacing: 0.5 }}>Add a team sheet to get started</div>
              </div>
            )}
          </div>

        </div>
        {showAddSheet && (
          <AddTeamSheetModal
            accent={accent}
            currentFormation={formation}
            onClose={() => setShowAddSheet(false)}
            onCreate={(sheet) => { addTeamSheet(sheet); setShowAddSheet(false); }}
          />
        )}
      </>
    );
  }

  if (hubView === 'tactics') {
    return (
      <>
        <style>{`@keyframes fadeIn { from{opacity:0} to{opacity:1} } select option { background:#0c1018; color:#f0f2f5; }`}</style>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-1)', animation: 'fadeIn 0.2s ease' }}>
          {/* Back bar */}
          <div style={{ flexShrink: 0, padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(7,10,15,0.6)' }}>
            <button onClick={() => setHubView(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9aa3b2', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700, padding: '4px 10px', cursor: 'pointer', letterSpacing: 1 }}>← BACK</button>
            {/* Top tab nav */}
            <div style={{ display: 'flex', gap: 2 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '5px 14px', background: tab === t.id ? `${accent}18` : 'transparent', border: 'none', borderBottom: tab === t.id ? `2px solid ${accent}` : '2px solid transparent', color: tab === t.id ? accent : '#556070', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 700, fontStyle: 'italic', letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>{t.label}</button>
              ))}
            </div>
          </div>
          {/* Main content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative' }}>
            <TacticsBigCard
              squad={squad} youthPlayers={youthPlayers} formation={formation} setFormation={setFormation}
              accent={accent} tab={tab} setTab={setTab}
              selectedPlayer={selectedPlayer} setSelected={setSelected}
              hoveredId={hoveredId} setHovered={setHovered}
              pitchIds={pitchIds} pitchAssigned={pitchAssigned}
              showKitModal={showKitModal} setShowKitModal={setShowKitModal}
              showCompare={showCompare} hoveredPlayer={hoveredPlayer}
              handleSelectPlayer={handleSelectPlayer}
              draggingFromSlot={draggingFromSlot} setDraggingFromSlot={setDraggingFromSlot}
              draggingBenchId={draggingBenchId} setDraggingBenchId={setDraggingBenchId}
              onSlotDrop={handleSlotDrop}
              onSwapCompared={swapComparedPlayers}
            />
          </div>
        </div>
        {showKitModal && <KitNumberModal squad={squad} accent={accent} onClose={() => setShowKitModal(false)} />}
      </>
    );
  }

  // ── Default: Hub Landing ──
  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes hubIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        select option { background:#0c1018; color:#f0f2f5; }
        .hub-small-card:hover { border-color: rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.05) !important; }
      `}</style>

      <div style={{ height: '100%', overflow: 'hidden', background: 'var(--bg-1)', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 2, padding: 2, animation: 'hubIn 0.25s ease', boxSizing: 'border-box' }}>

        {/* ══ LEFT — 2×2 small cards ══ */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr 1fr', gap: 2 }}>

          {/* Squad — top-left, does nothing, shows badge */}
          <div className="hub-small-card" style={{ background: 'var(--bg-1)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px', cursor: 'default', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -10, top: -10, opacity: 0.06, fontSize: 90, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>◈</div>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Squad</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 900, color: '#f0f2f5', lineHeight: 1 }}>Club Squad</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: accent, letterSpacing: 1 }}>{(squad || []).length} players</div>
              </div>
              <ClubBadge club={myClub} size={38} />
            </div>
          </div>

          {/* Squad Hub — top-right */}
          <div className="hub-small-card" onClick={() => setHubView('squadhub')} style={{ background: 'var(--bg-1)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -10, top: -10, opacity: 0.06, fontSize: 90, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>◎</div>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Players</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 900, color: '#f0f2f5', lineHeight: 1 }}>Squad Hub</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#3b4555', letterSpacing: 1 }}>All · Loans · Youth</div>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, color: '#3b4555' }}>›</span>
            </div>
          </div>

          {/* Team Sheets — bottom-left */}
          <div className="hub-small-card" onClick={() => setHubView('teamsheets')} style={{ background: 'var(--bg-1)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -10, top: -10, opacity: 0.06, fontSize: 90, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>⬡</div>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Tactics</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 900, color: '#f0f2f5', lineHeight: 1 }}>Team Sheets</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#3b4555', letterSpacing: 1 }}>{(teamSheets || []).length} saved sheet{(teamSheets || []).length === 1 ? '' : 's'}</div>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, color: '#3b4555' }}>›</span>
            </div>
          </div>

          {/* Edit Players — bottom-right */}
          <div className="hub-small-card" onClick={() => setHubView('editplayers')} style={{ background: 'var(--bg-1)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -10, top: -10, opacity: 0.06, fontSize: 90, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>◇</div>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Management</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 900, color: '#f0f2f5', lineHeight: 1 }}>Edit Players</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#3b4555', letterSpacing: 1 }}>Name · Attributes</div>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, color: '#3b4555' }}>›</span>
            </div>
          </div>

        </div>

        {/* ══ RIGHT — Big Tactics Card (shows whichever sheet is active) ══ */}
        <div onClick={() => openTactics(tab)} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'pointer', position: 'relative', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 }}>
          {/* Click-target overlay — no hover feedback, fully inert */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'transparent' }} />
          {/* Header */}
          <div style={{ flexShrink: 0, padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 6, position: 'relative' }}>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Tactics · Formation · Roles</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, fontWeight: 900, color: '#f0f2f5', lineHeight: 1, letterSpacing: 0.5 }}>
                {(TABS.find(t => t.id === tab) || TABS[0]).label === 'Lineup' || (TABS.find(t => t.id === tab) || TABS[0]).label === 'Formation'
                  ? formation
                  : (TABS.find(t => t.id === tab) || TABS[0]).label}
                <span style={{ color: accent, marginLeft: 6 }}>▶</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {TABS.map(t => (
                <span key={t.id} style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 6, color: tab === t.id ? accent : '#3b4555', letterSpacing: 1, padding: '2px 6px', border: `1px solid ${tab === t.id ? `${accent}55` : 'rgba(255,255,255,0.06)'}`, textTransform: 'uppercase' }}>{t.label}</span>
              ))}
            </div>
          </div>

          {/* Preview body — reflects active tab */}
          {(tab === 'lineup' || tab === 'formation') ? (
            <div style={{ flex: 1, overflow: 'hidden', pointerEvents: 'none', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0 }}>
              <div style={{
                width: '100%', height: 'auto', maxHeight: '100%', aspectRatio: '0.68',
                filter: 'blur(1.5px) saturate(0.65) brightness(0.7)',
                opacity: 0.78,
              }}>
                <Pitch formation={formation} assigned={assignPlayersToSlots(squad || [], FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'])} selectedId={null} hoveredId={null} onSelectPlayer={() => {}} previewMode accent={accent} />
              </div>
              {/* Preview scrim — subtle vignette + dim to read as "not live" */}
              <div style={{ position: 'absolute', inset: 10, background: 'linear-gradient(180deg, rgba(7,10,15,0) 55%, rgba(7,10,15,0.55) 100%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: 10, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.35)', pointerEvents: 'none' }} />
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'hidden', pointerEvents: 'none', padding: 14, position: 'relative', minHeight: 0 }}>
              <div style={{
                height: '100%', overflow: 'hidden',
                filter: 'blur(2.5px) saturate(0.6) brightness(0.65)',
                opacity: 0.7,
                transform: 'scale(1.01)',
              }}>
                {tab === 'strategy' && <StrategyTab accent={accent} />}
                {tab === 'roles'    && <RolesTab squad={squad} formation={formation} accent={accent} />}
                {tab === 'gameplan' && <GameplanTab squad={squad} accent={accent} />}
              </div>
              <div style={{ position: 'absolute', inset: 14, background: 'linear-gradient(180deg, rgba(7,10,15,0) 55%, rgba(7,10,15,0.55) 100%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: 14, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.35)', pointerEvents: 'none' }} />
            </div>
          )}

          {/* Preview badge + open hint */}
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 6, fontFamily: "'Share Tech Mono',monospace", fontSize: 6, color: '#556070', letterSpacing: 2, textTransform: 'uppercase', padding: '2px 7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,10,15,0.6)' }}>Preview</div>
          <div style={{ position: 'absolute', bottom: 12, right: 14, zIndex: 6, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 700, fontStyle: 'italic', color: accent, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.7 }}>Open →</div>
        </div>

      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   TACTICS BIG CARD (extracted for reuse)
══════════════════════════════════════════ */
function TacticsBigCard({ squad, youthPlayers, formation, setFormation, accent, tab, setTab, selectedPlayer, setSelected, hoveredId, setHovered, pitchIds, pitchAssigned, showKitModal, setShowKitModal, showCompare, hoveredPlayer, handleSelectPlayer, draggingFromSlot, setDraggingFromSlot, draggingBenchId, setDraggingBenchId, onSlotDrop, onSwapCompared }) {
  return (
    <>
      {/* LEFT — Pitch */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ flex: 1, padding: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          <div style={{ width: '100%', maxWidth: '100%', height: 'auto', maxHeight: '100%', aspectRatio: '0.68' }}>
            <Pitch
              formation={formation} assigned={pitchAssigned}
              selectedId={selectedPlayer?.id} hoveredId={hoveredId}
              onSelectPlayer={handleSelectPlayer} onHoverPlayer={setHovered}
              accent={accent}
              onSlotDrop={onSlotDrop}
              draggingFromSlot={draggingFromSlot} setDraggingFromSlot={setDraggingFromSlot}
            />
          </div>
        </div>
        <BenchStrip
          squad={squad} pitchIds={pitchIds} accent={accent}
          onSlotDrop={onSlotDrop}
          draggingFromSlot={draggingFromSlot} setDraggingFromSlot={setDraggingFromSlot}
          draggingBenchId={draggingBenchId} setDraggingBenchId={setDraggingBenchId}
        />
      </div>

      {/* RIGHT — Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {tab === 'lineup' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: selectedPlayer ? '45%' : '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: selectedPlayer ? '1px solid rgba(255,255,255,0.06)' : 'none', transition: 'width 0.2s ease' }}>
              <SquadList squad={squad} youthPlayers={youthPlayers} onSelect={handleSelectPlayer} selectedId={selectedPlayer?.id} hoveredId={hoveredId} onHover={setHovered} accent={accent} compact={!!selectedPlayer} pitchIds={pitchIds} onOpenKitModal={() => setShowKitModal(true)} setDraggingBenchId={setDraggingBenchId} />
            </div>
            {selectedPlayer && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeIn 0.18s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                  <button onClick={() => setSelected(null)} style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#9aa3b2', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                </div>
                {showCompare && hoveredPlayer ? <ComparePanel playerA={selectedPlayer} playerB={hoveredPlayer} accent={accent} onSwap={onSwapCompared} /> : <PlayerCard player={selectedPlayer} accent={accent} />}
              </div>
            )}
          </div>
        )}
        {tab === 'formation' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#556070', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Select Formation</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {FORMATIONS.map(f => (
                  <button key={f} onClick={() => setFormation(f)} style={{ padding: '5px 12px', background: formation === f ? `${accent}22` : 'rgba(255,255,255,0.03)', border: `1px solid ${formation === f ? accent : 'rgba(255,255,255,0.08)'}`, color: formation === f ? accent : '#9aa3b2', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 900, letterSpacing: 0.5, cursor: 'pointer' }}>{f}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: 8 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 48, fontWeight: 900, color: accent, lineHeight: 1 }}>{formation}</div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#556070', letterSpacing: 2, textTransform: 'uppercase' }}>Active formation</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {formation.split('-').map((n, i) => {
                  const labels = ['DEF', 'MID', 'FWD'];
                  return (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 900, color: '#f0f2f5' }}>{n}</div>
                      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#556070', letterSpacing: 1.5 }}>{i === 0 ? 'GK' : labels[i - 1]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {tab === 'strategy' && <StrategyTab accent={accent} />}
        {tab === 'roles'    && <RolesTab squad={squad} formation={formation} accent={accent} />}
        {tab === 'gameplan' && <GameplanTab squad={squad} accent={accent} />}
      </div>
    </>
  );
}