import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const NAV = [
  { to: '/home',         label: 'Home'         },
  { to: '/club',         label: 'Team'         },
  { to: '/transfers',    label: 'Transfers'    },
  { to: '/competitions', label: 'Competitions' },
  { to: '/manager',      label: 'Manager'      },
];

export const CLUB_COLOR = {
  'Real Madrid': '#FEBE10', 'Barcelona': '#A50044', 'Manchester City': '#6CABDD',
  'Liverpool': '#C8102E', 'Arsenal': '#EF0107', 'Chelsea': '#034694',
  'Manchester United': '#DA291C', 'Tottenham': '#132257', 'Bayern Munich': '#DC052D',
  'PSG': '#003370', 'AC Milan': '#FB090B', 'Inter Milan': '#0068A8',
  'Atletico Madrid': '#CB3524', 'Bayer Leverkusen': '#E32221',
  'Brighton': '#0057B8', 'Aston Villa': '#670E36',
  'Borussia Dortmund': '#FDE100', 'Juventus': '#555',
};

export const CLUB_ABBR = {
  'Real Madrid': 'RM', 'Barcelona': 'FCB', 'Manchester City': 'MCI',
  'Liverpool': 'LFC', 'Arsenal': 'ARS', 'Chelsea': 'CHE',
  'Manchester United': 'MUN', 'Tottenham': 'TOT', 'Bayern Munich': 'FCB',
  'PSG': 'PSG', 'AC Milan': 'MIL', 'Inter Milan': 'INT',
  'Atletico Madrid': 'ATM', 'Bayer Leverkusen': 'B04',
  'Brighton': 'BHA', 'Aston Villa': 'AVL',
  'Borussia Dortmund': 'BVB', 'Juventus': 'JUV',
};

export const CLUB_BADGE_URL = {
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

export const fmt = (n) => {
  if (!n) return '—';
  if (n >= 1e9) return `£${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `£${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `£${(n / 1e3).toFixed(0)}K`;
  return `£${n}`;
};

export function ClubBadge({ club, size = 40 }) {
  // Prefer badgeUrl from the club data object (same source as Home.jsx startup)
  // Fall back to the hardcoded map, then to an SVG text fallback
  const color = club?.color || CLUB_COLOR[club?.name] || '#888';
  const abbr  = CLUB_ABBR[club?.name] || club?.name?.slice(0, 3).toUpperCase() || '—';
  const url   = club?.badgeUrl || CLUB_BADGE_URL[club?.name];
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return <img src={url} alt={club?.name} onError={() => setFailed(true)}
      style={{
        width: size, height: size, objectFit: 'contain', flexShrink: 0,
        imageRendering: '-webkit-optimize-contrast',
      }} />;
  }
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      background: `linear-gradient(135deg, ${color}22, ${color}44)`,
      border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.28, color, letterSpacing: 1,
    }}>{abbr}</div>
  );
}

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=1920&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80',
  'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1920&q=80',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1920&q=80',
];

export default function Layout({ children }) {
  const { myClub, budget, season, week, resetGame, managerRating, managerProfile } = useGameStore();
  const navigate = useNavigate();
  const accentColor = myClub?.color || CLUB_COLOR[myClub?.name] || '#00e87a';

  // Performance bar — green ≥65, yellow 40-64, red <40
  const rating = managerRating ?? 50;
  const perfColor = rating >= 65 ? '#00e87a' : rating >= 40 ? '#f5c518' : '#ff3b5c';
  const managerName = managerProfile?.name || myClub?.name || '';

  const handleReset = () => {
    if (confirm('Start a new game? Your current save will be lost.')) {
      resetGame();
      navigate('/');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600;1,700;1,900&family=Barlow:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Share+Tech+Mono&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-1: #04060a;
          --bg-2: #070a0f;
          --bg-3: #0c1018;
          --bg-4: #111620;
          --bg-5: #181e2a;
          --border: rgba(255,255,255,0.07);
          --border-mid: rgba(255,255,255,0.13);
          --text: #f0f2f5;
          --text-dim: #9aa3b2;
          --text-muted: #556070;
          --green: #00e87a;
          --yellow: #f5c518;
          --red: #ff3b5c;
          --font-display: 'Barlow Condensed', sans-serif;
          --font-body: 'Barlow', sans-serif;
          --font-mono: 'Share Tech Mono', monospace;
        }

        html, body, #root {
          width: 100%; height: 100%;
          overflow: hidden;
          background: #04060a;
          color: var(--text);
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        /* ── Full BG ── */
        .g-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image: url('${BG_IMAGES[1]}');
          background-size: cover;
          background-position: center;
          filter: brightness(0.25) saturate(0.5);
        }
        .g-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 20%, rgba(4,6,10,0.9) 100%);
        }

        /* ── Floating topbar ── */
        .g-topbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 500;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          pointer-events: none;
        }
        /* inner must match box width exactly */
        .g-topbar-inner {
          width: min(1200px, calc(100% - 120px));
          display: flex;
          align-items: center;
          pointer-events: all;
        }

        .g-topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        .g-topbar-clubname {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 700;
          font-style: italic;
          color: rgba(255,255,255,0.88);
          letter-spacing: 1px;
          text-transform: uppercase;
          text-shadow: 0 2px 16px rgba(0,0,0,0.9);
        }
        .g-topbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .g-topbar-stat {
          text-align: right;
        }
        .g-topbar-stat-val {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 700;
          font-style: italic;
          color: rgba(255,255,255,0.85);
          letter-spacing: 0.5px;
          line-height: 1;
          text-shadow: 0 2px 12px rgba(0,0,0,0.9);
          display: block;
        }
        .g-topbar-stat-label {
          font-family: var(--font-mono);
          font-size: 8px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 2px;
          display: block;
        }
        .g-topbar-sep {
          width: 1px; height: 22px;
          background: rgba(255,255,255,0.1);
        }
        .g-topbar-btn {
          background: none; border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.35);
          display: flex; align-items: center;
          padding: 4px;
          transition: color 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .g-topbar-btn:hover { color: rgba(255,255,255,0.75); }

        /* ── Outer shell ── */
        .g-shell {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 64px;
          padding-bottom: 40px;
        }

        /* ── The box — wide landscape rectangle ── */
        .g-box {
          width: min(1200px, calc(100% - 120px));
          height: min(580px, calc(100vh - 130px));
          display: flex;
          flex-direction: column;
          border-radius: 0;
          overflow: hidden;
          background: rgba(7,10,15,0.88);
          border: 1px solid rgba(255,255,255,0.09);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03) inset,
            0 24px 80px rgba(0,0,0,0.75),
            0 0 100px rgba(0,0,0,0.5);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
        }

        /* thin club-color line at very top of box */
        .g-box-accent {
          height: 2px;
          flex-shrink: 0;
          background: linear-gradient(to right, var(--club-accent, #00e87a) 0%, transparent 60%);
        }

        /* ── Tabs ── */
        .g-tabs {
          display: flex;
          align-items: stretch;
          height: 40px;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: rgba(4,6,10,0.55);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .g-tabs::-webkit-scrollbar { display: none; }

        .g-tab {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 140px;
          flex-shrink: 0;
          padding: 0 24px;
          text-decoration: none;
          color: rgba(255,255,255,0.32);
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          font-style: italic;
          letter-spacing: 3px;
          text-transform: uppercase;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          border-right: 1px solid rgba(255,255,255,0.05);
          transition: color 0.15s, background 0.15s;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
          position: relative;
        }
        .g-tab:hover {
          color: rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.02);
        }
        .g-tab.active {
          color: rgba(255,255,255,0.9);
          border-bottom-color: rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.03);
        }

        /* ── Content ── */
        .g-content {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          background: var(--bg-2);
        }
        .g-content::-webkit-scrollbar { width: 3px; }
        .g-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); }

        /* ── Page animation ── */
        .g-page {
          padding: 20px;
          min-height: 100%;
          animation: gPageIn 0.2s ease both;
        }
        @keyframes gPageIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Shared utility classes for child pages ── */
        .g-card {
          background: var(--bg-3);
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .g-card-header {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
        }
        .g-card-title {
          font-family: var(--font-display);
          font-size: 10px; font-weight: 700; font-style: italic;
          color: var(--text-muted); letter-spacing: 2.5px; text-transform: uppercase;
        }
        .g-card-accent { width: 3px; height: 12px; background: var(--green); flex-shrink: 0; }
        .g-card-body { padding: 14px; }

        .g-grid { display: grid; gap: 10px; }
        .g-grid-2 { grid-template-columns: 1fr 1fr; }
        .g-grid-3 { grid-template-columns: 1fr 1fr 1fr; }

        .g-badge {
          display: inline-flex; align-items: center;
          padding: 2px 8px;
          font-family: var(--font-display); font-size: 10px;
          font-weight: 700; font-style: italic;
          letter-spacing: 1.5px; text-transform: uppercase;
        }
        .g-badge-green  { background: rgba(0,232,122,0.12);  color: var(--green);  border: 1px solid rgba(0,232,122,0.25);  }
        .g-badge-yellow { background: rgba(245,197,24,0.12); color: var(--yellow); border: 1px solid rgba(245,197,24,0.25); }
        .g-badge-red    { background: rgba(255,59,92,0.12);  color: var(--red);    border: 1px solid rgba(255,59,92,0.25);  }
        .g-badge-muted  { background: var(--bg-5);           color: var(--text-muted); border: 1px solid var(--border);    }

        .g-section-label {
          font-family: var(--font-display);
          font-size: 10px; font-weight: 600; font-style: italic;
          color: var(--text-muted); letter-spacing: 3px;
          text-transform: uppercase; margin-bottom: 10px;
        }
      `}</style>

      {/* BG */}
      <div className="g-bg" />

      {/* Floating top bar */}
      <header className="g-topbar">
        <div className="g-topbar-inner">
          <div className="g-topbar-left">
            {myClub && (
              <>
                <ClubBadge club={myClub} size={32} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span className="g-topbar-clubname">{managerName}</span>
                  <div style={{
                    width: 90, height: 3, background: 'rgba(255,255,255,0.1)',
                    borderRadius: 2, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${rating}%`, height: '100%',
                      background: perfColor,
                      boxShadow: `0 0 6px ${perfColor}80`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="g-topbar-right">
            {myClub && (
              <>
                <div className="g-topbar-stat">
                  <span className="g-topbar-stat-val">{fmt(budget)}</span>
                  <span className="g-topbar-stat-label">Budget</span>
                </div>
                <div className="g-topbar-sep" />
                <div className="g-topbar-stat">
                  <span className="g-topbar-stat-val">Season {season}</span>
                  <span className="g-topbar-stat-label">Week {week}</span>
                </div>
                <div className="g-topbar-sep" />
              </>
            )}
            <button className="g-topbar-btn" title="New Game" onClick={handleReset}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Shell + box */}
      <div className="g-shell">
        <div className="g-box" style={{ '--club-accent': accentColor }}>

          {/* Tabs */}
          <nav className="g-tabs">
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `g-tab${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Content */}
          <div className="g-content">
            {children}
          </div>

        </div>
      </div>
    </>
  );
}