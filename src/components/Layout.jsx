import { NavLink, useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';

const NAV = [
  {
    to: '/squad', label: 'Squad', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    to: '/tactics', label: 'Tactics', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </svg>
    )
  },
  {
    to: '/match', label: 'Match', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    )
  },
  {
    to: '/transfers', label: 'Transfers', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" />
      </svg>
    )
  },
  {
    to: '/results', label: 'Results', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    )
  },
];

const CLUB_COLOR = {
  'Real Madrid': '#FEBE10', 'Barcelona': '#A50044', 'Manchester City': '#6CABDD',
  'Liverpool': '#C8102E', 'Arsenal': '#EF0107', 'Chelsea': '#034694',
  'Manchester United': '#DA291C', 'Tottenham': '#132257', 'Bayern Munich': '#DC052D',
  'PSG': '#003370', 'AC Milan': '#FB090B', 'Inter Milan': '#0068A8',
  'Atletico Madrid': '#CB3524', 'Bayer Leverkusen': '#E32221',
  'Brighton': '#0057B8', 'Aston Villa': '#670E36',
  'Borussia Dortmund': '#FDE100', 'Juventus': '#555',
};

const CLUB_ABBR = {
  'Real Madrid': 'RM', 'Barcelona': 'FCB', 'Manchester City': 'MCI',
  'Liverpool': 'LFC', 'Arsenal': 'ARS', 'Chelsea': 'CHE',
  'Manchester United': 'MUN', 'Tottenham': 'TOT', 'Bayern Munich': 'FCB',
  'PSG': 'PSG', 'AC Milan': 'MIL', 'Inter Milan': 'INT',
  'Atletico Madrid': 'ATM', 'Bayer Leverkusen': 'B04',
  'Brighton': 'BHA', 'Aston Villa': 'AVL',
  'Borussia Dortmund': 'BVB', 'Juventus': 'JUV',
};

// Real badge URLs with fallback
const CLUB_BADGE_URL = {
  'Manchester City':    'https://resources.premierleague.com/premierleague/badges/50/t43.png',
  'Liverpool':          'https://resources.premierleague.com/premierleague/badges/50/t14.png',
  'Arsenal':            'https://resources.premierleague.com/premierleague/badges/50/t3.png',
  'Chelsea':            'https://resources.premierleague.com/premierleague/badges/50/t8.png',
  'Manchester United':  'https://resources.premierleague.com/premierleague/badges/50/t1.png',
  'Tottenham':          'https://resources.premierleague.com/premierleague/badges/50/t6.png',
  'Aston Villa':        'https://resources.premierleague.com/premierleague/badges/50/t7.png',
  'Brighton':           'https://resources.premierleague.com/premierleague/badges/50/t36.png',
};

const fmt = (n) => {
  if (!n) return '—';
  if (n >= 1e9) return `£${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `£${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `£${(n / 1e3).toFixed(0)}K`;
  return `£${n}`;
};

function ClubBadge({ club, size = 40 }) {
  const color = CLUB_COLOR[club?.name] || '#888';
  const abbr = CLUB_ABBR[club?.name] || club?.name?.slice(0,3).toUpperCase() || '—';
  const badgeUrl = CLUB_BADGE_URL[club?.name];
  const [imgFailed, setImgFailed] = useState(false);

  if (badgeUrl && !imgFailed) {
    return (
      <img
        src={badgeUrl}
        alt={club?.name}
        onError={() => setImgFailed(true)}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: `linear-gradient(135deg, ${color}22, ${color}44)`,
      border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.28,
      color, letterSpacing: 1,
    }}>{abbr}</div>
  );
}

import { useState } from 'react';

export default function Layout({ children }) {
  const { myClub, budget, season, week, resetGame } = useGameStore();
  const navigate = useNavigate();

  const handleReset = () => {
    if (confirm('Start a new game? Your current save will be lost.')) {
      resetGame();
      navigate('/');
    }
  };

  return (
    <>
      <style>{`
        /* ── Mobile bottom nav ── */
        .bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 200;
          background: rgba(8,11,15,0.97);
          border-top: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(16px);
          padding: 6px 0 max(6px, env(safe-area-inset-bottom));
        }
        .bottom-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-around;
        }
        .bottom-nav-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 6px 12px;
          text-decoration: none;
          color: rgba(255,255,255,0.35);
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: color 0.15s;
          -webkit-tap-highlight-color: transparent;
          min-width: 52px;
        }
        .bottom-nav-link svg { width: 20px; height: 20px; }
        .bottom-nav-link.active { color: var(--green); }
        .bottom-nav-link.active svg { filter: drop-shadow(0 0 4px rgba(0,232,122,0.5)); }

        /* ── Sidebar stadium bg ── */
        .sidebar {
          position: relative;
          overflow: hidden;
        }
        .sidebar-bg {
          position: absolute;
          inset: 0;
          background-image: url('https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&q=60');
          background-size: cover;
          background-position: center top;
          opacity: 0.06;
          pointer-events: none;
        }
        .sidebar > * { position: relative; z-index: 1; }

        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .bottom-nav { display: block !important; }
          .main-content {
            padding-bottom: 72px !important;
          }
          .page-header { padding: 20px 16px 0 !important; }
          .page-header h2 { font-size: 36px !important; }
          .page-body { padding: 0 16px 20px !important; }
          .match-screen {
            grid-template-columns: 1fr !important;
            padding: 0 16px 20px !important;
          }
        }
      `}</style>

      <div className="layout">
        {/* ── Desktop Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-bg" />

          <div className="sidebar-logo">
            <h1>THE GAFFER</h1>
            <span>Football Manager</span>
          </div>

          {myClub && (
            <div className="sidebar-club">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <ClubBadge club={myClub} size={36} />
                <div>
                  <div className="club-name">{myClub.name}</div>
                  <div className="club-league">{myClub.league}</div>
                </div>
              </div>
              <div className="club-budget">
                <span className="budget-label">Budget</span>
                <span className="budget-val">{fmt(budget)}</span>
              </div>
            </div>
          )}

          {myClub && (
            <div className="sidebar-season">
              <div className="season-chip">Season {season}</div>
              <div className="season-chip">Week {week}</div>
            </div>
          )}

          <div className="nav-section-label">Menu</div>

          <nav className="sidebar-nav">
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button
              className="btn btn-danger"
              style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
              onClick={handleReset}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
              </svg>
              New Game
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="main-content">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}