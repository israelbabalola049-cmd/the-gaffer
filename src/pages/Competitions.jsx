import { useState, useMemo } from 'react';
import useGameStore from '../store/gameStore';

/* ─────────────────────────────────────────
   COMPETITION DATA
───────────────────────────────────────── */
const COMPETITIONS = {
  'Premier League': {
    id: 'pl',
    name: 'Premier League',
    shortName: 'PL',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg',
    color: '#3d0064',
    accent: '#a855f7',
    type: 'league',
    country: 'England',
    founded: 1992,
    teams: 20,
    history: 'The Premier League is the top tier of English football, founded in 1992 when the First Division clubs broke away from the Football League. It rapidly became the most-watched football league on the planet, broadcasting to over 200 countries. The competition is famed for its intensity, unpredictability, and world-class talent. Manchester United have won the most titles, while Leicester City\'s 2016 triumph remains the greatest sporting upset of the modern era.',
    pastWinners: ['Manchester City', 'Liverpool', 'Chelsea', 'Arsenal', 'Manchester United'],
    prize: '£160M+',
  },
  'FA Cup': {
    id: 'facup',
    name: 'FA Cup',
    shortName: 'FA Cup',
    logo: 'https://upload.wikimedia.org/wikipedia/en/6/6d/FA_Cup_logo.svg',
    color: '#003087',
    accent: '#60a5fa',
    type: 'cup',
    country: 'England',
    founded: 1871,
    teams: 700,
    history: 'The FA Cup is the oldest domestic football cup competition in the world, dating back to 1871. Open to all clubs in the English football pyramid, it is famous for its giant-killing upsets and the romance of lower league clubs defeating Premier League giants. Wembley Stadium hosts the final each May in front of nearly 90,000 fans. Arsenal hold the record with 14 wins.',
    pastWinners: ['Arsenal', 'Chelsea', 'Manchester City', 'Liverpool', 'Tottenham'],
    prize: '£2.25M',
  },
  'Carabao Cup': {
    id: 'carabao',
    name: 'Carabao Cup',
    shortName: 'EFL Cup',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/5c/EFL_Cup.svg',
    color: '#00703c',
    accent: '#4ade80',
    type: 'cup',
    country: 'England',
    founded: 1960,
    teams: 92,
    history: 'Known as the League Cup or EFL Cup, the Carabao Cup has been sponsored by the Thai energy drink brand since 2017. It is the secondary cup competition in English football, featuring all 92 clubs from the Premier League and EFL. Manchester City have dominated the competition in recent years, winning it in unprecedented back-to-back seasons. The final is held at Wembley.',
    pastWinners: ['Manchester City', 'Liverpool', 'Chelsea', 'Manchester United', 'Aston Villa'],
    prize: '£100K',
  },
  'Champions League': {
    id: 'ucl',
    name: 'Champions League',
    shortName: 'UCL',
    logo: 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg',
    color: '#0a1628',
    accent: '#fbbf24',
    type: 'european',
    country: 'Europe',
    founded: 1955,
    teams: 36,
    history: 'The UEFA Champions League is the pinnacle of club football. Founded as the European Cup in 1955, it was rebranded in 1992 and expanded to include group stages. Real Madrid are the competition\'s most successful club with 15 titles. The iconic anthem, the star-studded squads, and the drama of knockout football make it the most prestigious club competition in the world. The final is one of the most-watched annual sporting events globally.',
    pastWinners: ['Real Madrid', 'Liverpool', 'Manchester City', 'Bayern Munich', 'Chelsea'],
    prize: '£100M+',
  },
  'Europa League': {
    id: 'uel',
    name: 'Europa League',
    shortName: 'UEL',
    logo: 'https://upload.wikimedia.org/wikipedia/en/9/93/UEFA_Europa_League_logo.svg',
    color: '#0d1a2d',
    accent: '#f97316',
    type: 'european',
    country: 'Europe',
    founded: 1971,
    teams: 36,
    history: 'Originally the UEFA Cup, the Europa League was rebranded in 2009 with a new format and identity. It serves as a gateway to European glory for clubs that narrowly miss the Champions League, as well as the winners of domestic cups. Clubs can also qualify directly through the Europa League to the Champions League via the play-off rounds. Sevilla FC are the undisputed kings with seven titles.',
    pastWinners: ['Sevilla', 'Atletico Madrid', 'Liverpool', 'Chelsea', 'Arsenal'],
    prize: '£18M+',
  },
  'Conference League': {
    id: 'uecl',
    name: 'Conference League',
    shortName: 'UECL',
    logo: 'https://upload.wikimedia.org/wikipedia/en/2/27/UEFA_Europa_Conference_League_logo.svg',
    color: '#0a2e1a',
    accent: '#4ade80',
    type: 'european',
    country: 'Europe',
    founded: 2021,
    teams: 36,
    history: 'The UEFA Europa Conference League is the newest of UEFA\'s three major club competitions, launched in 2021. It gives clubs from smaller leagues and lower-ranked nations the chance to compete in European football. West Ham United became the first English winners in 2023 and Chelsea followed in 2024. Though it lacks the prestige of its older siblings, it offers genuine European glory for clubs punching upward.',
    pastWinners: ['Chelsea', 'West Ham', 'Fiorentina', 'Roma', 'Villarreal'],
    prize: '£4M+',
  },
  'La Liga': {
    id: 'laliga',
    name: 'La Liga',
    shortName: 'La Liga',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/13/LaLiga.svg',
    color: '#1a0a00',
    accent: '#f97316',
    type: 'league',
    country: 'Spain',
    founded: 1929,
    teams: 20,
    history: 'La Liga is the top professional football division of the Spanish football league system. Administered by the Liga Nacional de Fútbol Profesional, it has been dominated for decades by Real Madrid and FC Barcelona — two of the most successful clubs in world football. Lionel Messi and Cristiano Ronaldo defined an era in this league. La Liga is widely regarded as one of the two best leagues in the world alongside the Premier League.',
    pastWinners: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Valencia', 'Sevilla'],
    prize: '£150M+',
  },
  'Copa del Rey': {
    id: 'copadelrey',
    name: 'Copa del Rey',
    shortName: 'Copa',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/58/Copa_del_Rey_logo.svg',
    color: '#000080',
    accent: '#facc15',
    type: 'cup',
    country: 'Spain',
    founded: 1903,
    teams: 83,
    history: 'The Copa del Rey (Cup of the King) is the main domestic cup competition in Spanish football. It is one of the oldest football competitions in the world. The tournament is famed for its giant-killing upsets and the prestige attached to Wembley-equivalent final venues across Spain. Barcelona are the most successful club in the competition\'s history with 31 titles, followed by Athletic Club with 23.',
    pastWinners: ['Barcelona', 'Real Madrid', 'Athletic Club', 'Atletico Madrid', 'Valencia'],
    prize: '£1.8M',
  },
  'Bundesliga': {
    id: 'bundesliga',
    name: 'Bundesliga',
    shortName: 'Bundesliga',
    logo: 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
    color: '#d20515',
    accent: '#ef4444',
    type: 'league',
    country: 'Germany',
    founded: 1963,
    teams: 18,
    history: 'The Bundesliga is the top tier of German football and one of the most attended leagues in the world. Founded in 1963, it is famous for its passionate fan culture, affordable tickets, and standing terrace sections (Stehplatz). Bayern Munich have dominated the league with an unprecedented run of 11 consecutive titles, though Borussia Dortmund and Bayer Leverkusen regularly challenge. The league is a breeding ground for world-class talent.',
    pastWinners: ['Bayern Munich', 'Borussia Dortmund', 'Bayer Leverkusen', 'RB Leipzig', 'Borussia Mönchengladbach'],
    prize: '£95M+',
  },
  'DFB-Pokal': {
    id: 'dfbpokal',
    name: 'DFB-Pokal',
    shortName: 'DFB-Pokal',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/DFB-Pokal_Logo.svg',
    color: '#000000',
    accent: '#e5e7eb',
    type: 'cup',
    country: 'Germany',
    founded: 1935,
    teams: 64,
    history: 'The DFB-Pokal is the main football cup competition in Germany, organised by the German Football Association. It follows a knockout format with 64 clubs from all levels of German football. The final is traditionally held at the Olympiastadion in Berlin. Bayern Munich are the most successful club with 20 titles. An upset against a top Bundesliga side by a lower-division club is one of the most celebrated moments in German football.',
    pastWinners: ['Bayern Munich', 'Borussia Dortmund', 'Bayer Leverkusen', 'Werder Bremen', 'Eintracht Frankfurt'],
    prize: '£500K',
  },
  'Serie A': {
    id: 'seriea',
    name: 'Serie A',
    shortName: 'Serie A',
    logo: 'https://upload.wikimedia.org/wikipedia/en/e/e1/Serie_A_logo_%282019%29.svg',
    color: '#1a1a2e',
    accent: '#3b82f6',
    type: 'league',
    country: 'Italy',
    founded: 1929,
    teams: 20,
    history: 'Serie A is the top football league in Italy and one of the most historically prestigious in the world. The league dominated European football in the 1980s and 90s when Italian clubs ruled the Champions League. Juventus hold the record for most Serie A titles with 36. The league is renowned for its tactical sophistication and defensive mastery. Inter Milan\'s recent resurgence and AC Milan\'s Champions League win have revived its European standing.',
    pastWinners: ['Inter Milan', 'AC Milan', 'Juventus', 'Napoli', 'Roma'],
    prize: '£130M+',
  },
  'Coppa Italia': {
    id: 'coppaitalia',
    name: 'Coppa Italia',
    shortName: 'Coppa',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/ac/Coppa_Italia_logo.svg',
    color: '#009246',
    accent: '#4ade80',
    type: 'cup',
    country: 'Italy',
    founded: 1922,
    teams: 40,
    history: 'The Coppa Italia is the main cup competition in Italian football. Juventus are the most successful club with 15 titles. The competition features clubs from Serie A and Serie B, with the format including knockout rounds from the round of 32 onwards. The final is a two-legged affair played at the home grounds of each finalist. A Coppa Italia win grants entry into the UEFA Europa League.',
    pastWinners: ['Juventus', 'Inter Milan', 'AC Milan', 'Roma', 'Napoli'],
    prize: '£1.2M',
  },
  'Ligue 1': {
    id: 'ligue1',
    name: 'Ligue 1',
    shortName: 'Ligue 1',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Ligue1_logo_2024-25.svg',
    color: '#001f5f',
    accent: '#60a5fa',
    type: 'league',
    country: 'France',
    founded: 1932,
    teams: 18,
    history: 'Ligue 1 is the top professional football league in France. It has been dominated by Paris Saint-Germain since the Qatari takeover in 2011, who have won the title in 9 of the last 12 seasons. However, Monaco\'s 2017 title and Lille\'s stunning 2021 triumph showed the league can still produce shock champions. France\'s league is a proven factory for global superstars, producing Kylian Mbappé, Zinedine Zidane, and many others.',
    pastWinners: ['PSG', 'Monaco', 'Lille', 'Lyon', 'Marseille'],
    prize: '£90M+',
  },
  'Coupe de France': {
    id: 'coupefrance',
    name: 'Coupe de France',
    shortName: 'Coupe',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/f/fa/Logo_Coupe_de_France.svg',
    color: '#002395',
    accent: '#60a5fa',
    type: 'cup',
    country: 'France',
    founded: 1917,
    teams: 9000,
    history: 'The Coupe de France is the main football cup competition in France, with over 9,000 clubs entering from all levels of French football. It is one of the most inclusive cup competitions in the world. PSG are the most successful club in the modern era, while Marseille hold the overall record. The magic of the competition lies in amateur and semi-professional clubs competing against Ligue 1 giants.',
    pastWinners: ['PSG', 'Marseille', 'Monaco', 'Lyon', 'Toulouse'],
    prize: '£150K',
  },
};

/* Club → eligible competitions mapping */
const CLUB_COMPETITIONS = {
  'Manchester City':    ['Premier League', 'FA Cup', 'Carabao Cup', 'Champions League'],
  'Liverpool':          ['Premier League', 'FA Cup', 'Carabao Cup', 'Champions League'],
  'Arsenal':            ['Premier League', 'FA Cup', 'Carabao Cup', 'Champions League'],
  'Chelsea':            ['Premier League', 'FA Cup', 'Carabao Cup', 'Conference League'],
  'Manchester United':  ['Premier League', 'FA Cup', 'Carabao Cup', 'Europa League'],
  'Tottenham':          ['Premier League', 'FA Cup', 'Carabao Cup', 'Europa League'],
  'Aston Villa':        ['Premier League', 'FA Cup', 'Carabao Cup', 'Champions League'],
  'Brighton':           ['Premier League', 'FA Cup', 'Carabao Cup', 'Europa League'],
  'Real Madrid':        ['La Liga', 'Copa del Rey', 'Champions League'],
  'Barcelona':          ['La Liga', 'Copa del Rey', 'Champions League'],
  'Atletico Madrid':    ['La Liga', 'Copa del Rey', 'Champions League'],
  'Bayer Leverkusen':   ['Bundesliga', 'DFB-Pokal', 'Champions League'],
  'Bayern Munich':      ['Bundesliga', 'DFB-Pokal', 'Champions League'],
  'Borussia Dortmund':  ['Bundesliga', 'DFB-Pokal', 'Champions League'],
  'PSG':                ['Ligue 1', 'Coupe de France', 'Champions League'],
  'AC Milan':           ['Serie A', 'Coppa Italia', 'Champions League'],
  'Inter Milan':        ['Serie A', 'Coppa Italia', 'Champions League'],
  'Juventus':           ['Serie A', 'Coppa Italia', 'Europa League'],
};

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

function ClubBadge({ name, size = 20 }) {
  const url = CLUB_BADGE_URL[name];
  const color = CLUB_COLOR[name] || '#888';
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />;
  return (
    <div style={{
      width: size, height: size, borderRadius: 3, flexShrink: 0,
      background: `linear-gradient(135deg, ${color}22, ${color}44)`,
      border: `1px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.3, color,
    }}>{name?.slice(0, 3).toUpperCase()}</div>
  );
}

/* ─────────────────────────────────────────
   COMPETITION HISTORY MODAL
───────────────────────────────────────── */
function CompetitionModal({ comp, onClose, onEnter }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 800,
      background: 'rgba(4,6,10,0.96)',
      backdropFilter: 'blur(24px)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
      animation: 'modalIn 0.3s ease both',
    }}>
      <style>{`@keyframes modalIn { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Color bar top */}
      <div style={{ height: 4, background: `linear-gradient(to right, ${comp.accent}, ${comp.accent}44)`, flexShrink: 0 }} />

      <div style={{ flex: 1, maxWidth: 540, margin: '0 auto', width: '100%', padding: 'clamp(24px,5vw,40px) clamp(18px,5vw,32px) 40px' }}>

        {/* Close */}
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, width: 38, height: 38, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          marginBottom: 28, WebkitTapHighlightColor: 'transparent',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* Logo + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            width: 90, height: 90, borderRadius: 20, padding: 12,
            background: `linear-gradient(135deg, ${comp.color}, ${comp.color}cc)`,
            border: `1px solid ${comp.accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 32px ${comp.accent}20`,
          }}>
            <img
              src={comp.logo}
              alt={comp.name}
              style={{ width: 60, height: 60, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,5vw,28px)', fontWeight: 900, color: '#fff', letterSpacing: 1, lineHeight: 1.1 }}>{comp.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: comp.accent, letterSpacing: 3, textTransform: 'uppercase', marginTop: 6 }}>{comp.country} · Est. {comp.founded}</div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 28 }}>
          {[
            ['Founded', comp.founded],
            ['Teams', comp.teams],
            ['Prize', comp.prize],
          ].map(([label, val]) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: comp.accent, lineHeight: 1 }}>{val}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* History */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: comp.accent, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 1, background: `${comp.accent}30` }} />
            History
            <div style={{ flex: 1, height: 1, background: `${comp.accent}30` }} />
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.75, margin: 0 }}>{comp.history}</p>
        </div>

        {/* Past winners */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Recent Winners</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {comp.pastWinners.map((w, i) => (
              <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: i === 0 ? comp.accent : 'var(--text-muted)', width: 20, textAlign: 'center' }}>{i + 1}</span>
                <ClubBadge name={w} size={20} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-dim)' }}>{w}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enter button */}
        <button onClick={onEnter} style={{
          width: '100%', padding: '14px 0',
          background: comp.accent, color: '#000',
          border: 'none', borderRadius: 8,
          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800,
          letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer',
          boxShadow: `0 4px 24px ${comp.accent}30`,
          transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent',
          filter: 'brightness(1)',
        }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
          Enter Competition
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */
function SubNav({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0,
      padding: '0 14px 12px', scrollbarWidth: 'none',
    }}>
      {tabs.map(tab => (
        <button key={tab} onClick={() => onChange(tab)} style={{
          flexShrink: 0, padding: '7px 16px', borderRadius: 20,
          border: `1px solid ${active === tab ? 'var(--green)' : 'rgba(255,255,255,0.08)'}`,
          background: active === tab ? 'rgba(0,232,122,0.12)' : 'transparent',
          color: active === tab ? 'var(--green)' : 'var(--text-muted)',
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.5,
          textTransform: 'uppercase', cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s',
        }}>{tab}</button>
      ))}
    </div>
  );
}

function SkeletonRow({ cols = 6 }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{ height: 10, borderRadius: 3, background: 'var(--bg-5)', flex: i === 1 ? 2 : 1, opacity: 0.6 }} />
      ))}
    </div>
  );
}

function PlaceholderState({ label }) {
  return (
    <div style={{ padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-4)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TABLE TAB
───────────────────────────────────────── */
function TableTab({ myClub, accentColor }) {
  const cols = ['#', 'Club', 'P', 'W', 'D', 'L', 'GD', 'Pts'];
  return (
    <div style={{ padding: '0 0 10px' }}>
      {/* header */}
      <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 28px 28px 28px 28px 32px 36px', gap: 4, padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
        {cols.map(h => (
          <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: h === 'Club' ? 'left' : 'center' }}>{h}</span>
        ))}
      </div>
      {/* user row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '24px 1fr 28px 28px 28px 28px 32px 36px',
        gap: 4, padding: '9px 14px',
        background: `${accentColor}10`,
        borderLeft: `2px solid ${accentColor}`,
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: accentColor, textAlign: 'center', alignSelf: 'center', fontWeight: 700 }}>1</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
          <ClubBadge name={myClub?.name} size={17} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{myClub?.name}</span>
        </div>
        {['0','0','0','0','0','0'].map((v, i) => (
          <span key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text)', textAlign: 'center', alignSelf: 'center' }}>{v}</span>
        ))}
      </div>
      {/* skeleton rows */}
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonRow key={i} cols={8} />
      ))}
      <div style={{ padding: '14px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>Live table available once season begins</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CUPS TAB
───────────────────────────────────────── */
function CupsTab({ clubCompetitions, enteredComps, onCompClick }) {
  const cups = clubCompetitions.filter(c => c.type === 'cup' || c.type === 'european');

  if (!cups.length) return <PlaceholderState label="No cup competitions available" />;

  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {cups.map(comp => {
        const entered = enteredComps.includes(comp.id);
        return (
          <div key={comp.id} onClick={() => onCompClick(comp)} style={{
            background: 'var(--bg-3)', border: `1px solid ${entered ? comp.accent + '40' : 'var(--border)'}`,
            borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
            transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = comp.accent + '60'}
            onMouseLeave={e => e.currentTarget.style.borderColor = entered ? comp.accent + '40' : 'var(--border)'}
          >
            {/* Color strip */}
            <div style={{ height: 3, background: `linear-gradient(to right, ${comp.accent}, ${comp.accent}44)` }} />
            <div style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12, flexShrink: 0, padding: 8,
                background: `linear-gradient(135deg, ${comp.color}, ${comp.color}cc)`,
                border: `1px solid ${comp.accent}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src={comp.logo} alt={comp.name} style={{ width: 36, height: 36, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: 0.5 }}>{comp.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>{comp.country} · {comp.teams} clubs</div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 4, fontSize: 9,
                  fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase',
                  background: entered ? `${comp.accent}20` : 'var(--bg-5)',
                  color: entered ? comp.accent : 'var(--text-muted)',
                  border: `1px solid ${entered ? comp.accent + '40' : 'var(--border)'}`,
                }}>{entered ? 'Active' : 'Not started'}</span>
                {!entered && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: comp.accent, letterSpacing: 1, opacity: 0.7 }}>Tap to view</span>
                )}
              </div>
            </div>
            {/* Round progress placeholder */}
            {entered && (
              <div style={{ padding: '0 14px 14px' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['R1', 'R2', 'R3', 'QF', 'SF', 'F'].map((r, i) => (
                    <div key={r} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i === 0 ? comp.accent : 'var(--bg-5)',
                      opacity: i === 0 ? 1 : 0.4,
                    }} />
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 6 }}>Round 1</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   STATS TAB
───────────────────────────────────────── */
function StatsTab() {
  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { label: 'Top Scorers', icon: '⚽' },
        { label: 'Assists',     icon: '🎯' },
        { label: 'Clean Sheets',icon: '🧤' },
      ].map(({ label }) => (
        <div key={label} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--green)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>{label}</span>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', width: 20, textAlign: 'center' }}>{i + 1}</span>
              <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-5)', border: '1px solid var(--border)' }} />
                <div>
                  <div style={{ width: 80, height: 9, borderRadius: 3, background: 'var(--bg-5)', marginBottom: 5 }} />
                  <div style={{ width: 50, height: 7, borderRadius: 3, background: 'var(--bg-4)' }} />
                </div>
              </div>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-5)', border: '1px solid var(--border)' }} />
            </div>
          ))}
          <div style={{ padding: '10px', textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>Available once season begins</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   RESULTS TAB
───────────────────────────────────────── */
function ResultsTab({ results, myClub }) {
  const [filterComp, setFilterComp] = useState('All');

  const compsInResults = useMemo(() => {
    const tags = [...new Set((results || []).map(r => r.competition).filter(Boolean))];
    return ['All', ...tags];
  }, [results]);

  const filtered = useMemo(() =>
    (results || []).filter(r => filterComp === 'All' || r.competition === filterComp)
  , [results, filterComp]);

  if (!results?.length) {
    return <PlaceholderState label="No results yet this season" />;
  }

  return (
    <div style={{ padding: '0 0 10px' }}>
      {/* Competition filter */}
      {compsInResults.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 14px 12px', scrollbarWidth: 'none' }}>
          {compsInResults.map(c => (
            <button key={c} onClick={() => setFilterComp(c)} style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 20,
              border: `1px solid ${filterComp === c ? 'var(--green)' : 'var(--border)'}`,
              background: filterComp === c ? 'rgba(0,232,122,0.1)' : 'transparent',
              color: filterComp === c ? 'var(--green)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.5,
              textTransform: 'uppercase', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}>{c}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <PlaceholderState label="No results for this competition" />
      ) : (
        filtered.slice().reverse().map((result, i) => {
          const myGoals = result.isHome ? result.homeGoals : result.awayGoals;
          const oppGoals = result.isHome ? result.awayGoals : result.homeGoals;
          const outcome = myGoals > oppGoals ? 'W' : myGoals === oppGoals ? 'D' : 'L';
          const outcomeColor = outcome === 'W' ? 'var(--green)' : outcome === 'D' ? 'var(--yellow)' : 'var(--red)';
          const compData = Object.values(COMPETITIONS).find(c => c.name === result.competition);

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              borderBottom: '1px solid var(--border)',
              borderLeft: `2px solid ${outcomeColor}`,
            }}>
              {/* Outcome badge */}
              <div style={{
                width: 28, height: 28, borderRadius: 5, flexShrink: 0,
                background: `${outcomeColor === 'var(--green)' ? 'rgba(0,232,122,0.12)' : outcomeColor === 'var(--yellow)' ? 'rgba(245,197,24,0.12)' : 'rgba(255,59,92,0.12)'}`,
                border: `1px solid ${outcomeColor === 'var(--green)' ? 'rgba(0,232,122,0.3)' : outcomeColor === 'var(--yellow)' ? 'rgba(245,197,24,0.3)' : 'rgba(255,59,92,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800, color: outcomeColor,
              }}>{outcome}</div>

              {/* Match info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <ClubBadge name={myClub?.name} size={15} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 900, color: 'var(--text)' }}>{myGoals}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>–</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 900, color: 'var(--text)' }}>{oppGoals}</span>
                  <ClubBadge name={result.opponent} size={15} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.opponent || 'Opponent'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {compData && (
                    <img src={compData.logo} alt={result.competition} style={{ width: 12, height: 12, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                  )}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {result.competition || 'League'} · {result.isHome ? 'Home' : 'Away'} · Wk {result.week || '—'}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function Competitions() {
  const { myClub, results, season } = useGameStore();
  const [activeTab, setActiveTab] = useState('Table');
  const [activeComp, setActiveComp] = useState(null);
  const [enteredComps, setEnteredComps] = useState([]);

  const accentColor = CLUB_COLOR[myClub?.name] || '#00e87a';

  const clubCompetitions = useMemo(() => {
    const names = CLUB_COMPETITIONS[myClub?.name] || ['Premier League', 'FA Cup', 'Carabao Cup'];
    return names.map(n => COMPETITIONS[n]).filter(Boolean);
  }, [myClub]);

  const leagueComp = useMemo(() => clubCompetitions.find(c => c.type === 'league'), [clubCompetitions]);

  const handleEnterComp = (comp) => {
    setEnteredComps(prev => prev.includes(comp.id) ? prev : [...prev, comp.id]);
    setActiveComp(null);
  };

  return (
    <>
      <style>{`
        @keyframes pageIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .comp-page { animation: pageIn 0.3s ease both; }
      `}</style>

      {/* Competition history modal */}
      {activeComp && (
        <CompetitionModal
          comp={activeComp}
          onClose={() => setActiveComp(null)}
          onEnter={() => handleEnterComp(activeComp)}
        />
      )}

      <div className="comp-page" style={{
        minHeight: '100vh', background: 'var(--bg-1)',
        display: 'flex', flexDirection: 'column',
        paddingBottom: 80,
      }}>

        {/* Page header */}
        <div style={{ padding: '16px 14px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--text)', letterSpacing: 0.5 }}>Competitions</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 10px' }}>Season {season}</div>
          </div>
          {/* Competition logos strip */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {clubCompetitions.map(comp => (
              <button key={comp.id} onClick={() => setActiveComp(comp)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'var(--bg-3)', border: `1px solid ${enteredComps.includes(comp.id) ? comp.accent + '40' : 'var(--border)'}`,
                borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = comp.accent + '60'}
                onMouseLeave={e => e.currentTarget.style.borderColor = enteredComps.includes(comp.id) ? comp.accent + '40' : 'var(--border)'}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 5, padding: 3,
                  background: `linear-gradient(135deg, ${comp.color}, ${comp.color}bb)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <img src={comp.logo} alt={comp.shortName} style={{ width: 16, height: 16, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: enteredComps.includes(comp.id) ? comp.accent : 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{comp.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sub-nav */}
        <SubNav tabs={['Table', 'Cups', 'Stats', 'Results']} active={activeTab} onChange={setActiveTab} />

        {/* Tab content */}
        <div style={{ flex: 1, background: 'var(--bg-2)', borderTop: '1px solid var(--border)' }}>

          {activeTab === 'Table' && (
            <div style={{ background: 'var(--bg-3)', margin: '12px 14px', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                {leagueComp && (
                  <div style={{ width: 22, height: 22, borderRadius: 4, padding: 3, background: `linear-gradient(135deg, ${leagueComp.color}, ${leagueComp.color}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={leagueComp.logo} alt={leagueComp.name} style={{ width: 14, height: 14, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                  </div>
                )}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>{leagueComp?.name || 'League'}</span>
              </div>
              <TableTab myClub={myClub} accentColor={accentColor} />
            </div>
          )}

          {activeTab === 'Cups' && (
            <CupsTab
              clubCompetitions={clubCompetitions}
              enteredComps={enteredComps}
              onCompClick={setActiveComp}
            />
          )}

          {activeTab === 'Stats' && <StatsTab />}

          {activeTab === 'Results' && (
            <div style={{ background: 'var(--bg-3)', margin: '12px 14px', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--green)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>Season {season} Results</span>
              </div>
              <ResultsTab results={results} myClub={myClub} />
            </div>
          )}

        </div>
      </div>
    </>
  );
}