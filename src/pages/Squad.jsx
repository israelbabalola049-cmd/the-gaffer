import { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';

const POSITIONS = ['All', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

const fmt = (n) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
};

const ratingColor = (r) => r >= 85 ? 'var(--green)' : r >= 70 ? 'var(--text)' : 'var(--text-muted)';

function FlagImg({ nationality, size = 18 }) {
  const codes = {
    'France':'fr','Brazil':'br','England':'gb-eng','Germany':'de','Croatia':'hr',
    'Uruguay':'uy','Spain':'es','Portugal':'pt','Belgium':'be','Argentina':'ar',
    'Norway':'no','Poland':'pl','Austria':'at','Netherlands':'nl','Italy':'it',
    'Senegal':'sn','Egypt':'eg','Nigeria':'ng','Ghana':'gh','Ivory Coast':'ci',
    'Morocco':'ma','South Korea':'kr','Japan':'jp','Colombia':'co','Ecuador':'ec',
    'Hungary':'hu','Georgia':'ge','Denmark':'dk','Scotland':'gb-sct','Switzerland':'ch',
    'Slovenia':'si','Wales':'gb-wls','Ukraine':'ua','Jamaica':'jm','Ireland':'ie',
  };
  const code = codes[nationality];
  if (!code) return <span style={{ fontSize: size * 0.8 }}>🌍</span>;
  return (
    <img
      src={`https://flagcdn.com/${size * 2}x${Math.round(size * 1.5)}/${code}.png`}
      alt={nationality}
      style={{ width: size, height: Math.round(size * 0.75), objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
      onError={e => { e.target.style.display = 'none'; }}
    />
  );
}

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

const CLUB_COLORS = {
  'Real Madrid':'#FEBE10','Barcelona':'#A50044','Manchester City':'#6CABDD',
  'Liverpool':'#C8102E','Arsenal':'#EF0107','Chelsea':'#034694',
  'Manchester United':'#DA291C','Tottenham':'#132257','Bayern Munich':'#DC052D',
  'PSG':'#003370','AC Milan':'#FB090B','Inter Milan':'#0068A8',
  'Atletico Madrid':'#CB3524','Bayer Leverkusen':'#E32221',
  'Brighton':'#0057B8','Aston Villa':'#670E36','Galatasaray':'#F6A623','Besiktas':'#333',
};

function ClubBadgeImg({ clubName, size = 24 }) {
  const [failed, setFailed] = useState(false);
  const url = CLUB_BADGE_URL[clubName];
  const color = CLUB_COLORS[clubName] || '#555';
  const abbr = clubName?.split(' ').map(w => w[0]).join('').slice(0, 3) || '?';
  if (url && !failed) {
    return (
      <img src={url} alt={clubName} onError={() => setFailed(true)}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 4, flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-cond)', fontSize: size * 0.32, color, fontWeight: 700,
    }}>{abbr}</div>
  );
}

function PlayerCard({ player, onClose }) {
  const [photo, setPhoto] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(true);

  useEffect(() => {
    if (!player) return;
    setPhoto(null);
    setPhotoLoading(true);
    const name = (player.wiki || player.name).replace(/ /g, '_');
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(d => { if (d.thumbnail?.source) setPhoto(d.thumbnail.source); })
      .catch(() => {})
      .finally(() => setPhotoLoading(false));
  }, [player?.id]);

  if (!player) {
    return (
      <div style={{
        width: '100%', height: '100%', minHeight: 400,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        <div style={{ fontSize: 48, opacity: 0.12 }}>👤</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
          Select a player<br />to view their card
        </p>
      </div>
    );
  }

  const cardAccent = player.overall >= 88 ? '#f5c518'
    : player.overall >= 83 ? '#9db5cc'
    : '#cd8b52';

  const cardBg = player.overall >= 88
    ? 'linear-gradient(170deg, #1f1900 0%, #2d2400 40%, #1a1500 100%)'
    : player.overall >= 83
    ? 'linear-gradient(170deg, #111927 0%, #192030 40%, #0f151e 100%)'
    : 'linear-gradient(170deg, #1c1200 0%, #261a00 40%, #141000 100%)';

  const attrs = [
    { label: 'PAC', value: player.pace },
    { label: 'SHO', value: player.shooting },
    { label: 'PAS', value: player.passing },
    { label: 'DRI', value: player.dribbling },
    { label: 'DEF', value: player.defending },
    { label: 'PHY', value: player.physical },
  ];

  return (
    <div className="squad-card-panel fade-up">
      <button className="squad-card-close" onClick={onClose}>✕</button>
      <div className="squad-fifa-card" style={{ background: cardBg, '--card-accent': cardAccent }}>
        <div className="sfc-top">
          <div className="sfc-ovr-block">
            <span className="sfc-overall">{player.overall}</span>
            <span className="sfc-pos">{player.position}</span>
          </div>
          <div className="sfc-badge-block">
            <ClubBadgeImg clubName={player.club} size={28} />
            <FlagImg nationality={player.nationality} size={22} />
          </div>
        </div>
        <div className="sfc-photo-wrap">
          {photoLoading && <div className="sfc-skeleton" />}
          {!photoLoading && photo && (
            <img src={photo} alt={player.name} className="sfc-photo" onError={() => setPhoto(null)} />
          )}
          {!photoLoading && !photo && (
            <div className="sfc-initials">
              {player.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
          )}
        </div>
        <div className="sfc-name">{player.name.split(' ').slice(-1)[0].toUpperCase()}</div>
        <div className="sfc-divider" />
        <div className="sfc-stats">
          {attrs.map(({ label, value }) => (
            <div key={label} className="sfc-stat-item">
              <span className="sfc-stat-num"
                style={{ color: value >= 85 ? 'var(--green)' : value >= 70 ? cardAccent : 'var(--text-muted)' }}>
                {value}
              </span>
              <span className="sfc-stat-lbl">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="squad-card-info">
        <div className="sci-name">{player.name}</div>
        <div className="sci-sub">
          <FlagImg nationality={player.nationality} size={14} />
          <span>{player.nationality}</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>{player.age} yrs</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <ClubBadgeImg clubName={player.club} size={14} />
          <span>{player.club}</span>
        </div>
        <div className="sci-finance">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>VALUE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--green)' }}>£{fmt(player.value)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>WAGE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--yellow)' }}>£{fmt(player.wage)}/w</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary"
            style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '8px 0' }}
            onClick={onClose}>Close</button>
          <button className="btn btn-danger"
            style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '8px 0' }}>
            Transfer List
          </button>
        </div>
      </div>
    </div>
  );
}

/* Mobile bottom sheet modal */
function MobileModal({ player, onClose }) {
  if (!player) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480,
        background: 'var(--bg-2)',
        borderRadius: '16px 16px 0 0',
        padding: '20px 20px 32px',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'sheetUp 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--bg-5)', margin: '0 auto 20px',
        }} />
        <PlayerCard player={player} onClose={onClose} />
      </div>
      <style>{`@keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </div>
  );
}

export default function Squad() {
  const { squad, myClub } = useGameStore();
  const [posFilter, setPosFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('overall');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const filtered = squad
    .filter(p =>
      (posFilter === 'All' || p.position === posFilter) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));

  const avgOvr = squad.length ? Math.round(squad.reduce((s, p) => s + p.overall, 0) / squad.length) : 0;
  const avgAge = squad.length ? (squad.reduce((s, p) => s + p.age, 0) / squad.length).toFixed(1) : 0;

  const selectedPlayer = squad.find(p => p.id === selected) || null;

  return (
    <>
      <style>{`
        .squad-mobile-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.1s;
          -webkit-tap-highlight-color: transparent;
        }
        .squad-mobile-row:active { background: var(--bg-3); }
        .squad-mobile-row.selected { background: rgba(0,232,122,0.05); border-left: 2px solid var(--green); }
        .squad-filter-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .squad-filter-scroll::-webkit-scrollbar { display: none; }
        .filter-pill {
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
          transition: all 0.12s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .filter-pill:hover { color: var(--text); border-color: var(--border-strong); }
        .filter-pill.active { background: var(--green-dim); border-color: var(--green); color: var(--green); }
      `}</style>

      {isMobile && <MobileModal player={selectedPlayer} onClose={() => setSelected(null)} />}

      <div className="squad-layout">

        {/* ── List column ── */}
        <div className="squad-list-col">
          <div className="page-header">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>{myClub?.name}</div>
            <h2>SQUAD</h2>
            <p>{squad.length} players · avg {avgOvr} overall · avg age {avgAge}</p>
          </div>

          <div className="page-body">
            {/* Search */}
            <input
              placeholder="Search players..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ marginBottom: 12 }}
            />

            {/* Position filter — horizontal scroll on mobile */}
            <div className="squad-filter-scroll" style={{ marginBottom: 16 }}>
              {POSITIONS.map(pos => (
                <button key={pos} className={`filter-pill ${posFilter === pos ? 'active' : ''}`}
                  onClick={() => setPosFilter(pos)}>{pos}</button>
              ))}
            </div>

            {/* Mobile: card-style rows */}
            {isMobile ? (
              <div style={{ margin: '0 -16px' }}>
                {filtered.map((p, idx) => (
                  <div key={p.id}
                    className={`squad-mobile-row${selected === p.id ? ' selected' : ''}`}
                    onClick={() => setSelected(selected === p.id ? null : p.id)}
                  >
                    {/* Number */}
                    <div style={{ width: 24, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--text-faint)', flexShrink: 0 }}>{idx + 1}</div>

                    {/* Badge */}
                    <ClubBadgeImg clubName={p.club} size={22} />

                    {/* Name + nationality */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <FlagImg nationality={p.nationality} size={11} />
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.nationality}</span>
                      </div>
                    </div>

                    {/* Position badge */}
                    <div style={{
                      padding: '2px 7px', borderRadius: 4,
                      background: 'var(--bg-4)', border: '1px solid var(--border-mid)',
                      fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)',
                      flexShrink: 0,
                    }}>{p.position}</div>

                    {/* OVR */}
                    <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 18, color: ratingColor(p.overall), width: 32, textAlign: 'right', flexShrink: 0 }}>{p.overall}</div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop: full table */
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 38, textAlign: 'center' }}>#</th>
                        <th>Player</th>
                        <th>Pos</th>
                        <th>Age</th>
                        {[
                          { key: 'overall', label: 'OVR' },
                          { key: 'pace', label: 'PAC' },
                          { key: 'shooting', label: 'SHO' },
                          { key: 'passing', label: 'PAS' },
                          { key: 'dribbling', label: 'DRI' },
                          { key: 'defending', label: 'DEF' },
                        ].map(col => (
                          <th key={col.key}
                            style={{ cursor: 'pointer', color: sortBy === col.key ? 'var(--green)' : undefined, userSelect: 'none' }}
                            onClick={() => setSortBy(col.key)}>
                            {col.label}{sortBy === col.key ? ' ▾' : ''}
                          </th>
                        ))}
                        <th>Wage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p, idx) => (
                        <tr key={p.id}
                          onClick={() => setSelected(selected === p.id ? null : p.id)}
                          style={{
                            cursor: 'pointer',
                            background: selected === p.id ? 'rgba(0,232,122,0.05)' : undefined,
                            borderLeft: selected === p.id ? '2px solid var(--green)' : '2px solid transparent',
                          }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--text-muted)', opacity: 0.4 }}>{idx + 1}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <ClubBadgeImg clubName={p.club} size={20} />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-cond)', letterSpacing: 0.5 }}>{p.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                                  <FlagImg nationality={p.nationality} size={13} />
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.nationality}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td><span style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--bg-4)', border: '1px solid var(--border-mid)', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>{p.position}</span></td>
                          <td className="mono" style={{ fontSize: 12 }}>{p.age}</td>
                          <td className="mono" style={{ fontSize: 13, fontWeight: 700, color: ratingColor(p.overall) }}>{p.overall}</td>
                          <td className="mono" style={{ fontSize: 12, color: p.pace >= 85 ? 'var(--green)' : 'var(--text-dim)' }}>{p.pace}</td>
                          <td className="mono" style={{ fontSize: 12, color: p.shooting >= 85 ? 'var(--green)' : 'var(--text-dim)' }}>{p.shooting}</td>
                          <td className="mono" style={{ fontSize: 12, color: p.passing >= 85 ? 'var(--green)' : 'var(--text-dim)' }}>{p.passing}</td>
                          <td className="mono" style={{ fontSize: 12, color: p.dribbling >= 85 ? 'var(--green)' : 'var(--text-dim)' }}>{p.dribbling}</td>
                          <td className="mono" style={{ fontSize: 12, color: p.defending >= 75 ? 'var(--green)' : 'var(--text-dim)' }}>{p.defending}</td>
                          <td className="mono" style={{ fontSize: 12, color: 'var(--yellow)' }}>{(p.wage / 1000).toFixed(0)}K/w</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!isMobile && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Click any player to view FIFA card · Click column headers to sort
              </div>
            )}
          </div>
        </div>

        {/* ── Right: FIFA Card (desktop only) ── */}
        {!isMobile && (
          <div className="squad-card-col">
            <PlayerCard player={selectedPlayer} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </>
  );
}