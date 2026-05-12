import { useState } from 'react';
import useGameStore from '../store/gameStore';

const POSITIONS = ['All', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const fmt = (n) => n >= 1e6 ? `£${(n/1e6).toFixed(1)}M` : `£${(n/1e3).toFixed(0)}K`;

export default function Transfers() {
  const { allPlayers, squad, budget, buyPlayer, sellPlayer } = useGameStore();
  const [tab, setTab] = useState('market');
  const [posFilter, setPosFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);

  const squadIds = new Set(squad.map(p => p.id));
  const source = tab === 'market' ? allPlayers.filter(p => !squadIds.has(p.id)) : squad;

  const filtered = source.filter(p => {
    const matchPos = posFilter === 'All' || p.position === posFilter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchPos && matchSearch;
  }).sort((a, b) => b.overall - a.overall);

  const ovrColor = (o) => o >= 88 ? 'var(--green)' : o >= 83 ? 'var(--yellow)' : 'var(--text)';

  return (
    <>
      <style>{`
        .pos-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .pos-scroll::-webkit-scrollbar { display: none; }
        .pos-pill {
          padding: 5px 11px;
          border-radius: 5px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border: 1px solid var(--border-mid);
          background: var(--bg-3);
          color: var(--text-muted);
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.12s;
          -webkit-tap-highlight-color: transparent;
        }
        .pos-pill.active { background: var(--green-dim); border-color: var(--green); color: var(--green); }
        .transfer-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.1s;
          -webkit-tap-highlight-color: transparent;
        }
        .transfer-card:active { background: var(--bg-3); }
        .transfer-card:last-child { border-bottom: none; }
      `}</style>

      <div className="page-header">
        <h2>TRANSFERS</h2>
        <p>Budget: <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{fmt(budget)}</span></p>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['market', 'sell'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid',
              borderColor: tab === t ? 'var(--green)' : 'var(--border)',
              background: tab === t ? 'var(--green-dim)' : 'var(--bg-3)',
              color: tab === t ? 'var(--green)' : 'var(--text-muted)',
              fontSize: 13, fontFamily: 'var(--font-mono)', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}>{t === 'market' ? '🛒 Buy' : '💰 Sell'}</button>
          ))}
        </div>

        {/* Search */}
        <input
          placeholder="Search players..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          style={{ marginBottom: 10 }}
        />

        {/* Position filter */}
        <div className="pos-scroll" style={{ marginBottom: 16 }}>
          {POSITIONS.map(pos => (
            <button key={pos} className={`pos-pill${posFilter === pos ? ' active' : ''}`}
              onClick={() => setPosFilter(pos)}>{pos}</button>
          ))}
        </div>

        {/* Player list — mobile card style */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.slice(0, 50).length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              No players found
            </div>
          ) : (
            filtered.slice(0, 50).map(p => (
              <div key={p.id} className="transfer-card">
                {/* OVR circle */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--bg-4)', border: '1px solid var(--border-mid)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 15,
                  color: ovrColor(p.overall), flexShrink: 0,
                }}>{p.overall}</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '1px 6px', borderRadius: 3,
                      background: 'var(--bg-4)', border: '1px solid var(--border-mid)',
                      fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)',
                    }}>{p.position}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{p.age}y</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)' }}>{fmt(p.value)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--yellow)' }}>£{(p.wage/1000).toFixed(0)}K/w</span>
                  </div>
                </div>

                {/* Action button */}
                {tab === 'market' ? (
                  <button
                    style={{
                      padding: '7px 14px', borderRadius: 6, border: 'none', flexShrink: 0,
                      background: budget < p.value ? 'var(--bg-4)' : 'var(--green)',
                      color: budget < p.value ? 'var(--text-muted)' : '#000',
                      fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 12,
                      cursor: budget < p.value ? 'not-allowed' : 'pointer',
                      letterSpacing: 0.5,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    disabled={budget < p.value}
                    onClick={() => setConfirm({ player: p, action: 'buy' })}
                  >{budget < p.value ? 'No funds' : 'Sign'}</button>
                ) : (
                  <button
                    style={{
                      padding: '7px 14px', borderRadius: 6, flexShrink: 0,
                      background: 'var(--bg-4)', border: '1px solid var(--red)',
                      color: 'var(--red)',
                      fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 12,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onClick={() => setConfirm({ player: p, action: 'sell' })}
                  >Sell</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)', display: 'flex',
          alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
        }} onClick={() => setConfirm(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 480,
            background: 'var(--bg-2)',
            borderRadius: '16px 16px 0 0',
            border: '1px solid var(--border-mid)',
            padding: '24px 20px 40px',
            animation: 'sheetUp 0.25s ease',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--bg-5)', margin: '0 auto 20px' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1, marginBottom: 6 }}>
              {confirm.action === 'buy' ? 'SIGN PLAYER' : 'SELL PLAYER'}
            </div>
            <div style={{ fontFamily: 'var(--font-cond)', fontSize: 18, color: 'var(--text)', marginBottom: 4 }}>
              {confirm.player.name}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
              {confirm.action === 'buy'
                ? `Fee: ${fmt(confirm.player.value)} · Wage: £${(confirm.player.wage/1000).toFixed(0)}K/w`
                : `You'll receive: ${fmt(Math.round(confirm.player.value * 0.8))}`}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 8, border: 'none',
                  background: confirm.action === 'buy' ? 'var(--green)' : 'var(--red)',
                  color: confirm.action === 'buy' ? '#000' : '#fff',
                  fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
                  letterSpacing: 1, cursor: 'pointer',
                }}
                onClick={() => {
                  confirm.action === 'buy'
                    ? buyPlayer(confirm.player, confirm.player.value)
                    : sellPlayer(confirm.player, Math.round(confirm.player.value * 0.8));
                  setConfirm(null);
                }}
              >Confirm</button>
              <button
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 8,
                  background: 'var(--bg-3)', border: '1px solid var(--border-mid)',
                  color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 15,
                  fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
                }}
                onClick={() => setConfirm(null)}
              >Cancel</button>
            </div>
          </div>
          <style>{`@keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
        </div>
      )}
    </>
  );
}