import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
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
        <path d="M4 4h16v10c0 4-4 7-8 8-4-1-8-4-8-8V4z" />
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
        <path d="M12 12h.01" strokeWidth="3" />
      </svg>
    )
  },
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
  const color = CLUB_COLOR[club?.name] || '#888';
  const abbr = CLUB_ABBR[club?.name] || club?.name?.slice(0, 3).toUpperCase() || '—';
  const badgeUrl = CLUB_BADGE_URL[club?.name];
  const [imgFailed, setImgFailed] = useState(false);

  if (badgeUrl && !imgFailed) {
    return (
      <img src={badgeUrl} alt={club?.name} onError={() => setImgFailed(true)}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 4, flexShrink: 0,
      background: `linear-gradient(135deg, ${color}22, ${color}44)`,
      border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.28, color, letterSpacing: 1,
    }}>{abbr}</div>
  );
}

/* ─────────────────────────────────────────
   BG IMAGES — Unsplash football/stadium
───────────────────────────────────────── */
const BG_IMAGES = [
  'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=1920&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80',
  'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1920&q=80',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1920&q=80',
  'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=1920&q=80',
];

/* ─────────────────────────────────────────
   LAYOUT
───────────────────────────────────────── */
export default function Layout({ children }) {
  const { myClub, budget, season, week, resetGame } = useGameStore();
  const navigate = useNavigate();
  const accentColor = CLUB_COLOR[myClub?.name] || '#00e87a';

  const bgImg = BG_IMAGES[1];

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
          --radius: 4px;
          --radius-md: 6px;
          --box-w: 1140px;
          --box-h: calc(100vh - 80px);
          --topbar-h: 56px;
          --tabs-h: 44px;
        }

        html, body, #root {
          height: 100%;
          overflow: hidden;
          background: #04060a;
          color: var(--text);
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        /* ── Full page BG ── */
        .g-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image: url('${bgImg}');
          background-size: cover;
          background-position: center;
          filter: brightness(0.28) saturate(0.6);
        }
        /* vignette overlay */
        .g-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 30%, rgba(4,6,10,0.85) 100%);
        }

        /* ── Floating top bar ── */
        .g-topbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 400;
          height: var(--topbar-h);
          display: flex;
          align-items: center;
          padding: 0 32px;
          /* fully transparent — content floats */
          background: transparent;
          /* subtle fade at top */
          -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
        }

        .g-topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        .g-topbar-clubname {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          font-style: italic;
          color: rgba(255,255,255,0.9);
          letter-spacing: 1px;
          text-transform: uppercase;
          text-shadow: 0 2px 12px rgba(0,0,0,0.8);
        }
        .g-topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .g-topbar-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .g-topbar-stat-val {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          font-style: italic;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.5px;
          line-height: 1;
          text-shadow: 0 2px 8px rgba(0,0,0,0.8);
        }
        .g-topbar-stat-label {
          font-family: var(--font-mono);
          font-size: 8px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .g-topbar-divider {
          width: 1px;
          height: 24px;
          background: rgba(255,255,255,0.12);
        }
        .g-topbar-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .g-topbar-btn:hover { color: rgba(255,255,255,0.8); }

        /* ── Outer shell — centers the box ── */
        .g-shell {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          pointer-events: none;
        }

        /* ── The big center box ── */
        .g-box {
          pointer-events: all;
          width: 100%;
          max-width: var(--box-w);
          height: var(--box-h);
          display: flex;
          flex-direction: column;
          border-radius: 8px;
          overflow: hidden;
          /* glass panel */
          background: rgba(7,10,15,0.82);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 32px 80px rgba(0,0,0,0.7),
            0 0 120px rgba(0,0,0,0.4);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        /* Accent line at very top of box — club color */
        .g-box-accent {
          height: 2px;
          flex-shrink: 0;
          background: linear-gradient(to right, var(--club-accent, #00e87a), transparent);
        }

        /* ── Tab nav — sits at top of box ── */
        .g-tabs {
          display: flex;
          align-items: stretch;
          height: var(--tabs-h);
          flex-shrink: 0;
          border-bottom: 1px solid var(--border);
          background: rgba(4,6,10,0.6);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .g-tabs::-webkit-scrollbar { display: none; }

        .g-tab {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 22px;
          text-decoration: none;
          color: var(--text-muted);
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          font-style: italic;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
          position: relative;
        }
        .g-tab svg { width: 14px; height: 14px; flex-shrink: 0; opacity: 0.6; transition: opacity 0.15s; }
        .g-tab:hover { color: var(--text-dim); background: rgba(255,255,255,0.03); }
        .g-tab.active {
          color: var(--green);
          border-bottom-color: var(--green);
          background: rgba(0,232,122,0.04);
        }
        .g-tab.active svg { opacity: 1; filter: drop-shadow(0 0 4px rgba(0,232,122,0.5)); }
        .g-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 22px; right: 22px;
          height: 2px;
          background: var(--green);
          box-shadow: 0 0 8px rgba(0,232,122,0.6);
          border-radius: 1px 1px 0 0;
        }

        /* spacer so tabs don't stretch full width */
        .g-tabs-spacer { flex: 1; }

        /* season/week/budget info sitting right side of tabs bar */
        .g-tabs-info {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0 16px;
          flex-shrink: 0;
          border-left: 1px solid var(--border);
        }
        .g-tabs-chip {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 600;
          font-style: italic;
          color: var(--text-muted);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 0 10px;
          border-right: 1px solid var(--border);
          height: 100%;
          display: flex;
          align-items: center;
        }
        .g-tabs-chip:last-child { border-right: none; }
        .g-tabs-budget {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          color: var(--green);
          letter-spacing: 0.5px;
          padding: 0 10px;
          display: flex;
          align-items: center;
        }

        /* ── Content area inside box ── */
        .g-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          background: var(--bg-2);
          position: relative;
        }
        .g-content::-webkit-scrollbar { width: 4px; }
        .g-content::-webkit-scrollbar-track { background: transparent; }
        .g-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

        /* ── Page wrapper for child pages ── */
        .g-page {
          padding: 20px;
          animation: gPageIn 0.2s ease both;
          min-height: 100%;
        }
        @keyframes gPageIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0);   }
        }

        /* ── Utility: card ── */
        .g-card {
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .g-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
        }
        .g-card-title {
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 700;
          font-style: italic;
          color: var(--text-muted);
          letter-spacing: 2.5px;
          text-transform: uppercase;
        }
        .g-card-accent { width: 3px; height: 12px; border-radius: 1px; background: var(--green); flex-shrink: 0; }
        .g-card-body { padding: 14px; }

        /* ── Utility: grid ── */
        .g-grid { display: grid; gap: 10px; }
        .g-grid-2 { grid-template-columns: 1fr 1fr; }
        .g-grid-3 { grid-template-columns: 1fr 1fr 1fr; }

        /* ── Utility: badges ── */
        .g-badge {
          display: inline-flex; align-items: center;
          padding: 2px 8px; border-radius: 2px;
          font-family: var(--font-display); font-size: 10px;
          font-weight: 700; font-style: italic;
          letter-spacing: 1.5px; text-transform: uppercase;
        }
        .g-badge-green { background: rgba(0,232,122,0.12); color: var(--green); border: 1px solid rgba(0,232,122,0.25); }
        .g-badge-yellow { background: rgba(245,197,24,0.12); color: var(--yellow); border: 1px solid rgba(245,197,24,0.25); }
        .g-badge-red { background: rgba(255,59,92,0.12); color: var(--red); border: 1px solid rgba(255,59,92,0.25); }
        .g-badge-muted { background: var(--bg-5); color: var(--text-muted); border: 1px solid var(--border); }

        /* ── Section label ── */
        .g-section-label {
          font-family: var(--font-display);
          font-size: 10px; font-weight: 600; font-style: italic;
          color: var(--text-muted); letter-spacing: 3px;
          text-transform: uppercase; margin-bottom: 10px;
        }
      `}</style>

      {/* Full page background */}
      <div className="g-bg" />

      {/* Floating top bar */}
      <header className="g-topbar">
        <div className="g-topbar-left">
          {myClub && (
            <>
              <ClubBadge club={myClub} size={28} />
              <span className="g-topbar-clubname">{myClub.name}</span>
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
              <div className="g-topbar-divider" />
              <div className="g-topbar-stat">
                <span className="g-topbar-stat-val">Season {season}</span>
                <span className="g-topbar-stat-label">Week {week}</span>
              </div>
              <div className="g-topbar-divider" />
            </>
          )}
          <button className="g-topbar-btn" title="New Game" onClick={handleReset}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Centered shell */}
      <div className="g-shell">
        <div className="g-box" style={{ '--club-accent': accentColor }}>

          {/* Club color accent line */}
          <div className="g-box-accent" />

          {/* Tab nav */}
          <nav className="g-tabs">
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `g-tab${isActive ? ' active' : ''}`}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
            <div className="g-tabs-spacer" />
            {myClub && (
              <div className="g-tabs-info">
                <span className="g-tabs-chip">S{season}</span>
                <span className="g-tabs-chip">Wk{week}</span>
                <span className="g-tabs-budget">{fmt(budget)}</span>
              </div>
            )}
          </nav>

          {/* Page content */}
          <div className="g-content">
            {children}
          </div>

        </div>
      </div>
    </>
  );
}