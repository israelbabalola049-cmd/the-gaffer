import { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';

const FORMATIONS = {
  '4-3-3': { slots: [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'LB', x: 15, y: 72 }, { pos: 'CB', x: 35, y: 72 }, { pos: 'CB', x: 65, y: 72 }, { pos: 'RB', x: 85, y: 72 },
    { pos: 'CM', x: 25, y: 52 }, { pos: 'CM', x: 50, y: 52 }, { pos: 'CM', x: 75, y: 52 },
    { pos: 'LW', x: 18, y: 25 }, { pos: 'ST', x: 50, y: 20 }, { pos: 'RW', x: 82, y: 25 },
  ]},
  '4-4-2': { slots: [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'LB', x: 15, y: 72 }, { pos: 'CB', x: 35, y: 72 }, { pos: 'CB', x: 65, y: 72 }, { pos: 'RB', x: 85, y: 72 },
    { pos: 'LM', x: 15, y: 52 }, { pos: 'CM', x: 37, y: 52 }, { pos: 'CM', x: 63, y: 52 }, { pos: 'RM', x: 85, y: 52 },
    { pos: 'ST', x: 35, y: 22 }, { pos: 'ST', x: 65, y: 22 },
  ]},
  '4-2-3-1': { slots: [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'LB', x: 15, y: 72 }, { pos: 'CB', x: 35, y: 72 }, { pos: 'CB', x: 65, y: 72 }, { pos: 'RB', x: 85, y: 72 },
    { pos: 'CDM', x: 35, y: 58 }, { pos: 'CDM', x: 65, y: 58 },
    { pos: 'LW', x: 18, y: 38 }, { pos: 'CAM', x: 50, y: 38 }, { pos: 'RW', x: 82, y: 38 },
    { pos: 'ST', x: 50, y: 18 },
  ]},
  '3-5-2': { slots: [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'CB', x: 25, y: 72 }, { pos: 'CB', x: 50, y: 72 }, { pos: 'CB', x: 75, y: 72 },
    { pos: 'LM', x: 12, y: 52 }, { pos: 'CM', x: 30, y: 52 }, { pos: 'CM', x: 50, y: 52 }, { pos: 'CM', x: 70, y: 52 }, { pos: 'RM', x: 88, y: 52 },
    { pos: 'ST', x: 35, y: 22 }, { pos: 'ST', x: 65, y: 22 },
  ]},
  '5-3-2': { slots: [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'LWB', x: 10, y: 68 }, { pos: 'CB', x: 27, y: 73 }, { pos: 'CB', x: 50, y: 75 }, { pos: 'CB', x: 73, y: 73 }, { pos: 'RWB', x: 90, y: 68 },
    { pos: 'CM', x: 25, y: 50 }, { pos: 'CM', x: 50, y: 50 }, { pos: 'CM', x: 75, y: 50 },
    { pos: 'ST', x: 35, y: 22 }, { pos: 'ST', x: 65, y: 22 },
  ]},
};

const COMPAT = {
  GK: ['GK'], CB: ['CB'], LB: ['LB','CB'], RB: ['RB','CB'],
  CDM: ['CDM','CM'], CM: ['CM','CDM','CAM'], CAM: ['CAM','CM'],
  LM: ['LM','LW'], RM: ['RM','RW'], LW: ['LW','LM','CAM'], RW: ['RW','RM','CAM'],
  ST: ['ST','CAM','LW','RW'], LWB: ['LB','LM'], RWB: ['RB','RM'],
};

function autoPickXI(formation, squad) {
  const slots = FORMATIONS[formation].slots;
  const usedIds = new Set();
  return slots.map(slot => {
    const compat = COMPAT[slot.pos] || [slot.pos];
    const player = squad.filter(p => !usedIds.has(p.id) && compat.includes(p.position))
      .sort((a, b) => b.overall - a.overall)[0] || null;
    if (player) usedIds.add(player.id);
    return { ...slot, player };
  });
}

export default function Tactics() {
  const { squad, formation, setFormation, setStarting11 } = useGameStore();
  const [pitchSlots, setPitchSlots] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [showBench, setShowBench] = useState(false);

  useEffect(() => {
    const auto = autoPickXI(formation, squad);
    setPitchSlots(auto);
    setStarting11(auto.filter(s => s.player).map(s => s.player));
  }, [formation, squad]);

  const handleSwapBench = (benchPlayer) => {
    if (dragging === null) return;
    const newSlots = [...pitchSlots];
    const existingIdx = newSlots.findIndex(s => s.player?.id === benchPlayer.id);
    if (existingIdx !== -1) newSlots[existingIdx] = { ...newSlots[existingIdx], player: newSlots[dragging].player };
    newSlots[dragging] = { ...newSlots[dragging], player: benchPlayer };
    setPitchSlots(newSlots);
    setStarting11(newSlots.filter(s => s.player).map(s => s.player));
    setDragging(null);
    setShowBench(false);
  };

  const startingIds = new Set(pitchSlots.filter(s => s.player).map(s => s.player.id));
  const bench = squad.filter(p => !startingIds.has(p.id)).sort((a, b) => b.overall - a.overall);
  const teamRating = pitchSlots.filter(s => s.player).length
    ? Math.round(pitchSlots.filter(s => s.player).reduce((sum, s) => sum + s.player.overall, 0) / pitchSlots.filter(s => s.player).length)
    : 0;

  return (
    <>
      <style>{`
        .tactics-layout {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .tactics-layout {
            grid-template-columns: 1fr;
          }
        }
        .formation-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .formation-scroll::-webkit-scrollbar { display: none; }
        .bench-sheet {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 300;
          background: var(--bg-2);
          border-radius: 16px 16px 0 0;
          border-top: 1px solid var(--border-mid);
          padding: 16px 16px 32px;
          max-height: 60vh;
          overflow-y: auto;
          animation: sheetUp 0.25s ease;
        }
        @keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        .bench-overlay {
          position: fixed; inset: 0; z-index: 299;
          background: rgba(0,0,0,0.5);
        }
      `}</style>

      <div className="page-header">
        <h2>TACTICS</h2>
        <p>Formation · Starting XI · Rating {teamRating}</p>
      </div>

      <div className="page-body">
        {/* Formation selector — scrollable */}
        <div className="formation-scroll" style={{ marginBottom: 20 }}>
          {Object.keys(FORMATIONS).map(f => (
            <button key={f} onClick={() => setFormation(f)} style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid', flexShrink: 0,
              borderColor: formation === f ? 'var(--green)' : 'var(--border)',
              background: formation === f ? 'var(--green-dim)' : 'var(--bg-3)',
              color: formation === f ? 'var(--green)' : 'var(--text-dim)',
              fontSize: 13, fontFamily: 'var(--font-mono)', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>{f}</button>
          ))}
        </div>

        <div className="tactics-layout">
          {/* Pitch */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', paddingBottom: '140%', background: 'linear-gradient(180deg, #0d2414 0%, #0a1f10 100%)' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 140" preserveAspectRatio="none">
                <rect x="5" y="5" width="90" height="130" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
                <line x1="5" y1="70" x2="95" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
                <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
                <rect x="22" y="5" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
                <rect x="22" y="113" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
                <rect x="38" y="3" width="24" height="4" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
                <rect x="38" y="133" width="24" height="4" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
              </svg>
              {pitchSlots.map((slot, idx) => {
                const isSelected = dragging === idx;
                const p = slot.player;
                return (
                  <div key={idx} onClick={() => {
                    setDragging(dragging === idx ? null : idx);
                    if (dragging !== idx) setShowBench(true);
                  }} style={{
                    position: 'absolute', left: `${slot.x}%`, top: `${slot.y}%`,
                    transform: 'translate(-50%, -50%)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 3, cursor: 'pointer', zIndex: isSelected ? 10 : 1,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: isSelected ? 'var(--green)' : p ? 'var(--bg-2)' : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${isSelected ? 'var(--green)' : p ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
                      color: isSelected ? '#000' : 'var(--text)',
                      boxShadow: isSelected ? '0 0 12px var(--green)' : 'none',
                    }}>
                      {p ? p.overall : '?'}
                    </div>
                    <div style={{
                      background: 'rgba(0,0,0,0.75)', borderRadius: 4, padding: '1px 5px',
                      fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text)',
                      whiteSpace: 'nowrap', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {p ? p.name.split(' ').pop() : slot.pos}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile bench trigger */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {dragging !== null ? '⚡ Tap bench to swap' : `Bench: ${bench.length} players`}
              </div>
              <button onClick={() => setShowBench(true)} style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-mid)',
                background: 'var(--bg-3)', color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer',
              }}>View Bench</button>
            </div>
          </div>

          {/* Desktop bench sidebar */}
          <div style={{ display: 'none' }} className="tactics-bench-desktop">
            <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Bench ({bench.length})</div>
              {dragging !== null && <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>Tap to swap</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 520, overflowY: 'auto' }}>
              {bench.map(p => (
                <div key={p.id} onClick={() => handleSwapBench(p)} className="card" style={{
                  padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                  cursor: dragging !== null ? 'pointer' : 'default',
                  border: dragging !== null ? '1px solid var(--green)' : '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0,
                    color: p.overall >= 88 ? 'var(--green)' : p.overall >= 83 ? 'var(--yellow)' : 'var(--text-dim)',
                  }}>{p.overall}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.position}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Tap a player on the pitch to select, then pick a bench player to swap.
        </div>
      </div>

      {/* Mobile bench bottom sheet */}
      {showBench && (
        <>
          <div className="bench-overlay" onClick={() => { setShowBench(false); setDragging(null); }} />
          <div className="bench-sheet">
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--bg-5)', margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Bench ({bench.length}) {dragging !== null ? '· Tap to swap' : ''}
              </div>
              {dragging !== null && <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>⚡ Swap mode</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {bench.map(p => (
                <div key={p.id} onClick={() => handleSwapBench(p)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 8,
                  background: dragging !== null ? 'var(--bg-3)' : 'var(--bg-3)',
                  border: dragging !== null ? '1px solid var(--green)' : '1px solid var(--border)',
                  cursor: dragging !== null ? 'pointer' : 'default',
                  transition: 'all 0.1s',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 14, flexShrink: 0,
                    color: p.overall >= 88 ? 'var(--green)' : p.overall >= 83 ? 'var(--yellow)' : 'var(--text-dim)',
                  }}>{p.overall}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.position}</div>
                  </div>
                  {dragging !== null && <div style={{ color: 'var(--green)', fontSize: 18 }}>⇄</div>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (min-width: 769px) {
          .tactics-bench-desktop { display: block !important; }
        }
      `}</style>
    </>
  );
}