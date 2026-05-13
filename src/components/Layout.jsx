import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';

const NAV = [
  {
    to: '/home', label: 'Home', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  {
    to: '/club', label: 'Club', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    )
  },
  {
    to: '/matchday', label: 'Matchday', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    )
  },
  {
    to: '/competitions', label: 'Compete', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="14 11 17 8 20 11" />
        <path d="M17 8v13" />
        <path d="M8 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3" />
        <polyline points="10 13 7 16 10 19" />
        <path d="M7 16h7" />
      </svg>
    )
  },
  {
    to: '/manager', label: 'Manager', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="12" />
        <path d="M12 12h.01" strokeWidth="3" />
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
  const abbr = CLUB_ABBR[club?.name] || club?.name?.slice(0, 3).toUpperCase() || '—';
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

export { ClubBadge, CLUB_COLOR, CLUB_ABBR, CLUB_BADGE_URL, fmt };

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
        /* ── Global top bar ── */
        .top-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 150;
          height: 52px;
          background: rgba(6,8,9,0.96);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          gap: 12px;
        }
        .top-bar-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .top-bar-club-name {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: 0.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .top-bar-center {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .top-bar-chip {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 4px;
          padding: 3px 8px;
        }
        .top-bar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .top-bar-budget {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          color: var(--green);
          letter-spacing: 0.5px;
        }
        .top-bar-bell {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .top-bar-bell:hover { color: var(--text); }

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
            padding-top: 52px !important;
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

        @media (min-width: 769px) {
          .top-bar {
            left: var(--sidebar-w);
          }
          .main-content {
            padding-top: 52px !important;
          }
        }
      `}</style>

      {/* ── Global Top Bar ── */}
      {myClub && (
        <div className="top-bar">
          <div className="top-bar-left">
            <ClubBadge club={myClub} size={28} />
            <span className="top-bar-club-name">{myClub.name}</span>
          </div>
          <div className="top-bar-center">
            <span className="top-bar-chip">S{season}</span>
            <span className="top-bar-chip">W{week}</span>
          </div>
          <div className="top-bar-right">
            <span className="top-bar-budget">{fmt(budget)}</span>
            <button className="top-bar-bell" title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          </div>
        </div>
      )}

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