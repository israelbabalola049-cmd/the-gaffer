import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const CLUB_COLOR = {
  'Real Madrid': '#FEBE10', 'Barcelona': '#A50044', 'Manchester City': '#6CABDD',
  'Liverpool': '#C8102E', 'Arsenal': '#EF0107', 'Chelsea': '#034694',
  'Manchester United': '#DA291C', 'Tottenham': '#132257', 'Bayern Munich': '#DC052D',
  'PSG': '#003370', 'AC Milan': '#FB090B', 'Inter Milan': '#0068A8',
  'Atletico Madrid': '#CB3524', 'Bayer Leverkusen': '#E32221',
  'Brighton': '#0057B8', 'Aston Villa': '#670E36',
  'Borussia Dortmund': '#FDE100', 'Juventus': '#555',
};

const CLUB_BADGE_URL = {
  'Manchester City':   'https://resources.premierleague.com/premierleague/badges/50/t43.png',
  'Liverpool':         'https://resources.premierleague.com/premierleague/badges/50/t14.png',
  'Arsenal':           'https://resources.premierleague.com/premierleague/badges/50/t3.png',
  'Chelsea':           'https://resources.premierleague.com/premierleague/badges/50/t8.png',
  'Manchester United': 'https://resources.premierleague.com/premierleague/badges/50/t1.png',
  'Tottenham':         'https://resources.premierleague.com/premierleague/badges/50/t6.png',
  'Aston Villa':       'https://resources.premierleague.com/premierleague/badges/50/t7.png',
  'Brighton':          'https://resources.premierleague.com/premierleague/badges/50/t36.png',
};

const DIFFICULTY_LABELS = { amateur: 'Amateur', 'semi-pro': 'Semi-Pro', professional: 'Professional' };
const SPEED_LABELS = { slow: 'Slow', normal: 'Normal', fast: 'Fast' };

const PLACEHOLDER_OBJECTIVES = [
  { label: 'Finish Top 4',        target: 4,   current: 1,  met: false },
  { label: 'Reach Cup Quarter-Final', target: 1, current: 0, met: false },
  { label: 'Win 15 League Games', target: 15,  current: 0,  met: false },
  { label: 'Keep 10 Clean Sheets',target: 10,  current: 0,  met: false },
];

const PLACEHOLDER_JOB_OFFERS = [
  { club: 'Real Madrid',        league: 'La Liga',        prestige: 'World Class' },
  { club: 'Bayern Munich',      league: 'Bundesliga',     prestige: 'World Class' },
];

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1e9) return `£${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `£${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `£${(n / 1e3).toFixed(0)}K`;
  return `£${n}`;
};

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */
function ClubBadge({ name, size = 24 }) {
  const url = CLUB_BADGE_URL[name];
  const color = CLUB_COLOR[name] || '#888';
  if (url) return (
    <img src={url} alt={name}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={e => e.target.style.display = 'none'}
    />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: 4, flexShrink: 0,
      background: `linear-gradient(135deg, ${color}22, ${color}44)`,
      border: `1px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.3, color,
    }}>{name?.slice(0, 3).toUpperCase()}</div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-3)',
      border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden',
      ...style,
    }}>{children}</div>
  );
}

function CardHeader({ label, accent, right }) {
  return (
    <div style={{
      padding: '10px 14px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {accent && <div style={{ width: 3, height: 12, borderRadius: 2, background: accent, flexShrink: 0 }} />}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>{label}</span>
      </div>
      {right}
    </div>
  );
}

function SkeletonLine({ w = '100%', h = 10 }) {
  return <div style={{ width: w, height: h, borderRadius: 3, background: 'var(--bg-5)', opacity: 0.7 }} />;
}

/* ─────────────────────────────────────────
   RATING RING
───────────────────────────────────────── */
function RatingRing({ value = 50, size = 64, color = '#00e87a' }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontFamily="'Barlow Condensed', sans-serif" fontSize={size * 0.28} fontWeight="900">
        {value}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────
   TROPHY ICON
───────────────────────────────────────── */
function TrophyIcon({ color = '#f5c518', size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8 21h8M12 17v4M6 3H4a2 2 0 0 0-2 2v3a4 4 0 0 0 4 4M18 3h2a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 3h12v9a6 6 0 0 1-12 0V3z" fill={`${color}20`} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ─────────────────────────────────────────
   SETTINGS TOGGLE
───────────────────────────────────────── */
function SegmentControl({ options, value, onChange, accent = 'var(--green)' }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--bg-5)',
      border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2,
    }}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{
            flex: 1, padding: '7px 4px',
            background: active ? accent : 'transparent',
            border: 'none', borderRadius: 6,
            fontFamily: 'var(--font-mono)', fontSize: 9,
            letterSpacing: 1, textTransform: 'uppercase',
            color: active ? '#000' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.2s',
            fontWeight: active ? 700 : 400,
            WebkitTapHighlightColor: 'transparent',
          }}>{opt.label}</button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   NEW GAME CONFIRM MODAL
───────────────────────────────────────── */
function NewGameModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(4,6,10,0.94)',
      backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      animation: 'mgIn 0.2s ease both',
    }}>
      <style>{`@keyframes mgIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }`}</style>
      <div style={{
        background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '28px 24px', maxWidth: 340, width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,59,92,0.12)', border: '1px solid rgba(255,59,92,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8, letterSpacing: 0.5 }}>Start New Game?</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.65, marginBottom: 24 }}>
          Your current save will be permanently deleted. This cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px', background: 'var(--bg-5)',
            border: '1px solid var(--border)', borderRadius: 8,
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: 1.5, textTransform: 'uppercase',
            color: 'var(--text-dim)', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '11px', background: 'var(--red)',
            border: 'none', borderRadius: 8,
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: 1.5, textTransform: 'uppercase',
            color: '#fff', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   JOB OFFER MODAL
───────────────────────────────────────── */
function JobOfferModal({ offer, onAccept, onDecline }) {
  const color = CLUB_COLOR[offer.club] || '#00e87a';
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(4,6,10,0.96)', backdropFilter: 'blur(24px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'mgIn 0.25s ease both',
    }}>
      <div style={{
        background: 'var(--bg-3)', border: `1px solid ${color}30`,
        borderRadius: 14, padding: '28px 24px', maxWidth: 340, width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 16 }}>
          <ClubBadge name={offer.club} size={52} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: 0.5, marginBottom: 4 }}>{offer.club}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{offer.league}</div>
        <div style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 4, background: `${color}18`, border: `1px solid ${color}40`, fontFamily: 'var(--font-mono)', fontSize: 9, color, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>{offer.prestige}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.65, marginBottom: 24 }}>
          {offer.club} are interested in appointing you as their new manager. This is a significant opportunity. Do you want to accept?
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onDecline} style={{
            flex: 1, padding: '11px', background: 'var(--bg-5)',
            border: '1px solid var(--border)', borderRadius: 8,
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: 1.5, textTransform: 'uppercase',
            color: 'var(--text-dim)', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}>Decline</button>
          <button onClick={onAccept} style={{
            flex: 1, padding: '11px', background: color,
            border: 'none', borderRadius: 8,
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: 1.5, textTransform: 'uppercase',
            color: '#fff', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}>Accept</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function Manager() {
  const { myClub, budget, season, week, squad, resetGame } = useGameStore();
  const navigate = useNavigate();

  const [difficulty, setDifficulty]     = useState('semi-pro');
  const [gameSpeed, setGameSpeed]       = useState('normal');
  const [showNewGame, setShowNewGame]   = useState(false);
  const [activeOffer, setActiveOffer]   = useState(null);
  const [dismissedOffers, setDismissed] = useState([]);

  const accentColor = CLUB_COLOR[myClub?.name] || '#00e87a';
  const managerName = useGameStore(s => s.managerName) || 'The Gaffer';
  const managerRating = useGameStore(s => s.managerRating) || 50;
  const careerHistory = useGameStore(s => s.careerHistory) || [];
  const awards = useGameStore(s => s.awards) || [];
  const wages = useGameStore(s => s.wages) || (squad?.reduce((sum, p) => sum + (p.wage || 0), 0));

  const visibleOffers = PLACEHOLDER_JOB_OFFERS.filter(o => !dismissedOffers.includes(o.club));

  const handleNewGame = () => {
    resetGame();
    navigate('/');
  };

  const ratingColor = managerRating >= 70 ? 'var(--green)' : managerRating >= 40 ? 'var(--yellow)' : 'var(--red)';
  const ratingLabel = managerRating >= 80 ? 'Elite'
    : managerRating >= 65 ? 'Experienced'
    : managerRating >= 50 ? 'Established'
    : managerRating >= 35 ? 'Developing'
    : 'Rookie';

  return (
    <>
      <style>{`
        @keyframes pageIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .mgr-page { animation: pageIn 0.3s ease both; }
        .mgr-card { animation: pageIn 0.3s ease both; }
        .mgr-card:nth-child(1){animation-delay:.04s} .mgr-card:nth-child(2){animation-delay:.08s}
        .mgr-card:nth-child(3){animation-delay:.12s} .mgr-card:nth-child(4){animation-delay:.16s}
        .mgr-card:nth-child(5){animation-delay:.20s} .mgr-card:nth-child(6){animation-delay:.24s}
        .mgr-card:nth-child(7){animation-delay:.28s}
        .offer-row:hover { background: rgba(255,255,255,0.03) !important; }
        .setting-row:hover { background: rgba(255,255,255,0.02) !important; }
      `}</style>

      {showNewGame && (
        <NewGameModal onConfirm={handleNewGame} onCancel={() => setShowNewGame(false)} />
      )}

      {activeOffer && (
        <JobOfferModal
          offer={activeOffer}
          onAccept={() => setActiveOffer(null)}
          onDecline={() => { setDismissed(d => [...d, activeOffer.club]); setActiveOffer(null); }}
        />
      )}

      <div className="mgr-page" style={{
        minHeight: '100vh', background: 'var(--bg-1)',
        padding: '16px 14px 80px',
        display: 'flex', flexDirection: 'column', gap: 10,
        maxWidth: 600, margin: '0 auto',
      }}>

        {/* ── 1. MANAGER CARD ── */}
        <div className="mgr-card" style={{
          background: `linear-gradient(135deg, ${accentColor}14 0%, var(--bg-4) 100%)`,
          border: `1px solid ${accentColor}28`,
          borderRadius: 10, padding: '18px 16px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(managerName)}&background=1e242d&color=e8edf2&size=120&bold=true&length=2`}
              alt={managerName}
              style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', border: `2px solid ${accentColor}40` }}
            />
            <div style={{
              position: 'absolute', bottom: -4, right: -4,
              background: 'var(--bg-2)', border: `1px solid ${accentColor}40`,
              borderRadius: 6, padding: '1px 5px',
              fontFamily: 'var(--font-mono)', fontSize: 8, color: accentColor, letterSpacing: 1,
            }}>S{season}</div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(15px,4vw,20px)', fontWeight: 900, color: 'var(--text)', letterSpacing: 0.5, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{managerName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <ClubBadge name={myClub?.name} size={16} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{myClub?.name}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 4,
                background: `${ratingColor === 'var(--green)' ? 'rgba(0,232,122,0.12)' : ratingColor === 'var(--yellow)' ? 'rgba(245,197,24,0.12)' : 'rgba(255,59,92,0.12)'}`,
                border: `1px solid ${ratingColor === 'var(--green)' ? 'rgba(0,232,122,0.3)' : ratingColor === 'var(--yellow)' ? 'rgba(245,197,24,0.3)' : 'rgba(255,59,92,0.3)'}`,
                fontFamily: 'var(--font-mono)', fontSize: 9, color: ratingColor, letterSpacing: 1.5, textTransform: 'uppercase',
              }}>{ratingLabel}</span>
            </div>
          </div>

          {/* Rating ring */}
          <RatingRing value={managerRating} size={62} color={ratingColor} />
        </div>

        {/* ── 2. BOARD OBJECTIVES ── */}
        <Card className="mgr-card">
          <CardHeader label="Board Objectives" accent="var(--yellow)"
            right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5 }}>S{season}</span>}
          />
          <div style={{ padding: '4px 0' }}>
            {PLACEHOLDER_OBJECTIVES.map((obj, i) => {
              const pct = Math.min(100, Math.round((obj.current / obj.target) * 100));
              const barColor = obj.met ? 'var(--green)' : pct > 60 ? 'var(--yellow)' : 'var(--red)';
              return (
                <div key={i} style={{ padding: '12px 14px', borderBottom: i < PLACEHOLDER_OBJECTIVES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: obj.met ? 'var(--text)' : 'var(--text-dim)' }}>{obj.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>{obj.current}/{obj.target}</span>
                      {obj.met && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-5)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: '10px 14px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>Objectives set by board at season start</span>
          </div>
        </Card>

        {/* ── 3. FINANCES ── */}
        <Card className="mgr-card">
          <CardHeader label="Club Finances" accent="var(--green)" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {[
              { label: 'Transfer Budget', value: fmt(budget), color: 'var(--green)', border: true },
              { label: 'Weekly Wages',    value: fmt(wages),  color: 'var(--red)',   border: false },
              { label: 'Transfer Spend',  value: '£0',        color: 'var(--text)',  border: true },
              { label: 'Revenue',         value: '—',         color: 'var(--text)',  border: false },
            ].map(({ label, value, color, border }, i) => (
              <div key={label} style={{
                padding: '16px 14px',
                borderRight: border ? '1px solid var(--border)' : 'none',
                borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 5 }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── 4. CAREER HISTORY ── */}
        <Card className="mgr-card">
          <CardHeader label="Career History" accent="var(--blue)" />
          {careerHistory.length > 0 ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 50px 40px', gap: 8, padding: '7px 14px', borderBottom: '1px solid var(--border)' }}>
                {['Club', 'League', 'Seasons', 'Trophies'].map(h => (
                  <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {careerHistory.map((entry, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 50px 40px', gap: 8, padding: '10px 14px', borderBottom: i < careerHistory.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <ClubBadge name={entry.club} size={18} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.club}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{entry.league}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text)', textAlign: 'center' }}>{entry.seasons}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--yellow)', textAlign: 'center' }}>{entry.trophies}</span>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {/* Current club as first entry */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 40px', gap: 8, padding: '7px 14px', borderBottom: '1px solid var(--border)' }}>
                {['Club', 'Seasons', 'Trophies'].map(h => (
                  <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 40px', gap: 8, padding: '12px 14px', alignItems: 'center', borderLeft: `2px solid ${accentColor}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClubBadge name={myClub?.name} size={20} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{myClub?.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: accentColor, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>Current</div>
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text)', textAlign: 'center' }}>{season}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--yellow)', textAlign: 'center' }}>0</span>
              </div>
            </div>
          )}
        </Card>

        {/* ── 5. AWARDS SHELF ── */}
        <Card className="mgr-card">
          <CardHeader label="Awards" accent="var(--yellow)" />
          {awards.length > 0 ? (
            <div style={{ padding: '14px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {awards.map((award, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--bg-4)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <TrophyIcon color={award.color || '#f5c518'} size={28} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center' }}>{award.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12, opacity: 0.2 }}>
                {[1, 2, 3].map(i => <TrophyIcon key={i} color="var(--text-muted)" size={28} />)}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>No awards yet — win something</div>
            </div>
          )}
        </Card>

        {/* ── 6. JOB OFFERS ── */}
        <Card className="mgr-card">
          <CardHeader label="Job Offers" accent="var(--green)"
            right={
              visibleOffers.length > 0
                ? <span style={{ background: 'var(--green)', color: '#000', borderRadius: 10, padding: '1px 7px', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700 }}>{visibleOffers.length}</span>
                : null
            }
          />
          {visibleOffers.length > 0 ? (
            <div style={{ padding: '4px 0' }}>
              {visibleOffers.map((offer, i) => {
                const color = CLUB_COLOR[offer.club] || '#888';
                return (
                  <div key={offer.club} className="offer-row" onClick={() => setActiveOffer(offer)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    borderBottom: i < visibleOffers.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background 0.15s',
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                    <ClubBadge name={offer.club} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: 0.5 }}>{offer.club}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 3 }}>{offer.league}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                      <span style={{ padding: '3px 9px', borderRadius: 4, background: `${color}18`, border: `1px solid ${color}35`, fontFamily: 'var(--font-mono)', fontSize: 8, color, letterSpacing: 1.5, textTransform: 'uppercase' }}>{offer.prestige}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>No offers at this time</div>
            </div>
          )}
        </Card>

        {/* ── 7. SETTINGS ── */}
        <Card className="mgr-card">
          <CardHeader label="Settings" accent="var(--text-muted)" />
          <div style={{ padding: '4px 0' }}>

            {/* Game speed */}
            <div className="setting-row" style={{ padding: '14px', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-dim)' }}>Game Speed</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{SPEED_LABELS[gameSpeed]}</span>
              </div>
              <SegmentControl
                options={[{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }]}
                value={gameSpeed}
                onChange={setGameSpeed}
                accent="var(--green)"
              />
            </div>

            {/* Difficulty */}
            <div className="setting-row" style={{ padding: '14px', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-dim)' }}>Difficulty</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{DIFFICULTY_LABELS[difficulty]}</span>
              </div>
              <SegmentControl
                options={[{ value: 'amateur', label: 'Amateur' }, { value: 'semi-pro', label: 'Semi-Pro' }, { value: 'professional', label: 'Pro' }]}
                value={difficulty}
                onChange={setDifficulty}
                accent="var(--yellow)"
              />
            </div>

            {/* Save slot */}
            <div className="setting-row" style={{ padding: '14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-dim)' }}>Save Slot</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 3 }}>the-gaffer-save</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px rgba(0,232,122,0.6)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Saved</span>
              </div>
            </div>

            {/* Week / Season info */}
            <div className="setting-row" style={{ padding: '14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-dim)' }}>Current Progress</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5 }}>Season {season}, Week {week}</span>
            </div>

            {/* New game */}
            <div style={{ padding: '14px' }}>
              <button onClick={() => setShowNewGame(true)} style={{
                width: '100%', padding: '12px',
                background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)',
                borderRadius: 8, cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                letterSpacing: 2, textTransform: 'uppercase', color: 'var(--red)',
                transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,92,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,59,92,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,59,92,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,59,92,0.25)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                </svg>
                New Game
              </button>
            </div>

          </div>
        </Card>

      </div>
    </>
  );
}