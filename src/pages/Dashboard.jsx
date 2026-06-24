import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';

const fmt = (n) => {
  if (!n) return '—';
  if (n >= 1e9) return `£${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `£${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `£${(n / 1e3).toFixed(0)}K`;
  return `£${n}`;
};

const CLUB_COLOR = {
  'Real Madrid':'#FEBE10','Barcelona':'#A50044','Manchester City':'#6CABDD',
  'Liverpool':'#C8102E','Arsenal':'#EF0107','Chelsea':'#034694',
  'Manchester United':'#DA291C','Tottenham':'#132257','Bayern Munich':'#DC052D',
  'PSG':'#003370','AC Milan':'#FB090B','Inter Milan':'#0068A8',
  'Atletico Madrid':'#CB3524','Bayer Leverkusen':'#E32221',
  'Brighton':'#0057B8','Aston Villa':'#670E36',
  'Borussia Dortmund':'#FDE100','Juventus':'#555',
};

const CLUB_IMAGES = {
  default: [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80',
    'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=600&q=80',
    'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&q=80',
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80',
  ],
};

function getNewsImages(clubName) {
  return CLUB_IMAGES[clubName] || CLUB_IMAGES.default;
}

function generateNews(club, squad) {
  const top = squad?.slice().sort((a, b) => b.overall - a.overall)[0];
  return [
    { text: `${club?.name || 'Club'} linked with summer reinforcements as the board backs new signings ahead of the window.`, date: '2d ago' },
    { text: `Squad morale remains high ahead of the upcoming fixture run. Players responding well in training.`, date: '3d ago' },
    { text: top ? `${top.name} continues to attract interest from top clubs across Europe.` : 'Scouts report positive findings from latest assessment.', date: '4d ago' },
    { text: `Board confident in the manager's project as the season gets underway. Facilities investment approved.`, date: '5d ago' },
    { text: `Youth academy graduate earns first team call-up after impressive performances this week.`, date: '6d ago' },
  ];
}

const OBJECTIVES = [
  { title: 'Win the league',  current: 0, target: 38 },
  { title: 'Reach Cup Final', current: 0, target: 5  },
  { title: 'Score 80 goals',  current: 0, target: 80 },
  { title: '15 clean sheets', current: 0, target: 15 },
];

const DAYS_SHORT   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function gameDay2Date(gameDay) {
  const base = new Date(2024, 7, 1);
  base.setDate(base.getDate() + gameDay - 1);
  return base;
}

/* ── Transfers-style shared components ── */
const BentoBox = ({ children, style = {} }) => (
  <div style={{
    background: 'rgba(7,10,15,0.82)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 4,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', position: 'relative',
    minHeight: 0, minWidth: 0,
    ...style,
  }}>
    {children}
  </div>
);

const BoxHeader = ({ label, accent, right }) => (
  <div style={{ padding:'7px 10px 6px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <div style={{ width:2, height:10, background: accent || '#556070', flexShrink:0 }} />
      <span style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', color:'rgba(255,255,255,0.4)', letterSpacing:3, textTransform:'uppercase' }}>{label}</span>
    </div>
    {right}
  </div>
);

/* ── Club badge SVG (same as Home.jsx ClubBadgeFallback) ── */
function ClubBadgeSVG({ club, size = 110 }) {
  const color = club?.color || '#888';
  const name  = club?.name  || '';
  const hash  = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const style = hash % 5;
  const half  = size / 2;
  const s     = size;
  const shields = [
    `M ${half} ${s*.06} L ${s*.92} ${s*.22} L ${s*.92} ${s*.58} Q ${s*.92} ${s*.82} ${half} ${s*.96} Q ${s*.08} ${s*.82} ${s*.08} ${s*.58} L ${s*.08} ${s*.22} Z`,
    `M ${s*.1} ${s*.28} Q ${s*.1} ${s*.08} ${half} ${s*.06} Q ${s*.9} ${s*.08} ${s*.9} ${s*.28} L ${s*.9} ${s*.62} Q ${s*.9} ${s*.84} ${half} ${s*.96} Q ${s*.1} ${s*.84} ${s*.1} ${s*.62} Z`,
    `M ${s*.1} ${s*.1} L ${s*.9} ${s*.1} L ${s*.9} ${s*.65} Q ${s*.9} ${s*.84} ${half} ${s*.96} Q ${s*.1} ${s*.84} ${s*.1} ${s*.65} Z`,
    `M ${half} ${s*.04} L ${s*.9} ${s*.26} L ${s*.9} ${s*.68} L ${half} ${s*.96} L ${s*.1} ${s*.68} L ${s*.1} ${s*.26} Z`,
    `M ${s*.1} ${s*.18} L ${s*.35} ${s*.06} L ${half} ${s*.14} L ${s*.65} ${s*.06} L ${s*.9} ${s*.18} L ${s*.9} ${s*.62} Q ${s*.9} ${s*.84} ${half} ${s*.96} Q ${s*.1} ${s*.84} ${s*.1} ${s*.62} Z`,
  ];
  const abbr = name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  return (
    <svg width={size} height={size} viewBox={`0 0 ${s} ${s}`}>
      <defs>
        <linearGradient id={`dbg-${abbr}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.12"/>
        </linearGradient>
      </defs>
      <path d={shields[style]} fill={`url(#dbg-${abbr}-${size})`} stroke={color} strokeWidth={s*.025} strokeLinejoin="round"/>
      <path d={shields[style]} fill="none" stroke={color} strokeWidth={s*.012} strokeLinejoin="round" opacity="0.3"
        transform={`scale(0.82) translate(${s*.1} ${s*.1})`}/>
      <text x={half} y={half + s*.06} textAnchor="middle"
        fontFamily="'Barlow Condensed',sans-serif" fontWeight="900"
        fontSize={s*.22} fill={color} letterSpacing={s*.01}>{abbr}</text>
    </svg>
  );
}

/* ── Badge: real image first, SVG fallback ── */
function BadgeImg({ club, size = 48 }) {
  if (!club?.badgeUrl) return <ClubBadgeSVG club={club} size={size}/>;
  return (
    <img src={club.badgeUrl} alt={club?.name || ''}
      style={{ width:size, height:size, objectFit:'contain' }}
      onError={e => { e.currentTarget.style.display='none'; }}
    />
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { myClub, squad, results = [], season = 1, week = 1, budget, fixtures = [], leagueTable = [], allClubs = [] } = useGameStore();

  const accent = myClub?.color || CLUB_COLOR[myClub?.name] || '#00e87a';

  const myFixtures = useMemo(() => {
    if (!myClub) return [];
    return fixtures.map(f => ({ ...f, isHome: f.home === myClub.name }));
  }, [fixtures, myClub]);

  const upcomingFix  = useMemo(() => myFixtures.filter(f => !f.played), [myFixtures]);
  const nextFixture  = useMemo(() => upcomingFix.find(f => f.week === week) || upcomingFix[0] || null, [upcomingFix, week]);
  const isMatchday   = !!(nextFixture && nextFixture.week === week);
  const weeksUntil   = nextFixture ? nextFixture.week - week : null;

  const oppName = nextFixture ? (nextFixture.isHome ? nextFixture.away : nextFixture.home) : null;
  const oppClub = useMemo(() => (allClubs || []).find(c => c.name === oppName) || null, [allClubs, oppName]);

  // Formatted match date
  const fixDate  = nextFixture?.gameDay ? gameDay2Date(nextFixture.gameDay) : null;
  const dateStr  = fixDate
    ? `${DAYS_SHORT[fixDate.getDay()]}, ${fixDate.getDate()} ${MONTHS_FULL[fixDate.getMonth()]} ${fixDate.getFullYear()}`
    : null;

  const homeTeam = nextFixture?.isHome ? myClub?.name   : oppName;
  const awayTeam = nextFixture?.isHome ? oppName         : myClub?.name;
  const homeClub = nextFixture?.isHome ? myClub          : oppClub;
  const awayClub = nextFixture?.isHome ? oppClub         : myClub;

  const wdl = useMemo(() => {
    const calc = (fn) => (results || []).filter(r => fn(r.myGoals, r.oppGoals)).length;
    return { w: calc((m,o)=>m>o), d: calc((m,o)=>m===o), l: calc((m,o)=>m<o) };
  }, [results]);

  const recentResults = useMemo(() => [...(results||[])].reverse().slice(0,5), [results]);
  const myForm = recentResults.map(r => r.myGoals > r.oppGoals ? 'W' : r.myGoals === r.oppGoals ? 'D' : 'L');

  const newsItems  = generateNews(myClub, squad);
  const newsImages = getNewsImages(myClub?.name);

  const weekStrip = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const w = week + i;
      const fixForWeek = myFixtures.find(f => f.week === w && !f.played);
      return {
        week: w,
        isCurrent: w === week,
        isMatch: !!fixForWeek,
        opponent: fixForWeek ? (fixForWeek.isHome ? fixForWeek.away : fixForWeek.home) : null,
      };
    });
  }, [week, myFixtures]);

  const areas = {
    news:       { gridColumn:'1 / 5', gridRow:'1 / 4' },
    objectives: { gridColumn:'1 / 5', gridRow:'4 / 5' },
    playtrain:  { gridColumn:'5 / 7', gridRow:'1 / 2' },
    calendar:   { gridColumn:'7 / 9', gridRow:'1 / 2' },
    standings:  { gridColumn:'5 / 7', gridRow:'2 / 5' },
    inbox:      { gridColumn:'7 / 9', gridRow:'2 / 5' },
  };

  return (
    <>
      <style>{`
        .db-news-item:hover { opacity: 0.85; }
        .db-inbox-row:hover { background: rgba(255,255,255,0.03) !important; }
        @keyframes dbIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .db-play-btn { transition: filter 0.15s; cursor: pointer; border: none; outline: none; }
        .db-play-btn:hover { filter: brightness(1.1); }
        .db-play-btn:active { transform: scale(0.98); }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        gap: 5, padding: 6,
        width: '100%',
        height: 'calc(min(580px, 100vh - 130px) - 44px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>

        {/* ── NEWS ── */}
        <BentoBox style={{ ...areas.news, animation: 'dbIn 0.25s ease both' }}>
          <BoxHeader label="News" accent={accent} />
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {newsItems.map((item, i) => (
              <div key={i} className="db-news-item" style={{
                flex: 1, position: 'relative', cursor: 'default', transition: 'opacity 0.15s',
                borderBottom: i < newsItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                minHeight: 0, overflow: 'hidden',
              }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:`url(${newsImages[i % newsImages.length]})`, backgroundSize:'cover', backgroundPosition:'center', opacity:0.12 }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(7,10,15,0.96) 40%, rgba(7,10,15,0.3) 100%)' }} />
                <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', padding:'7px 10px', height:'100%', gap:8, boxSizing:'border-box' }}>
                  <div style={{ width:2, alignSelf:'stretch', background:`${accent}55`, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"var(--font-display)", fontSize:10, color:'#c8d0dc', lineHeight:1.55 }}>{item.text}</div>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', letterSpacing:1.5, marginTop:3 }}>{item.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BentoBox>

        {/* ── OBJECTIVES ── */}
        <BentoBox style={{ ...areas.objectives, animation: 'dbIn 0.25s 0.04s ease both' }}>
          <BoxHeader label="Season Objectives" accent={accent} />
          <div style={{ flex:1, display:'flex', gap:5, padding:'6px 8px', alignItems:'stretch' }}>
            {OBJECTIVES.map((obj, i) => {
              const pct = Math.round((obj.current / obj.target) * 100);
              return (
                <div key={i} style={{ flex:1, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', padding:'6px 8px', display:'flex', flexDirection:'column', gap:4 }}>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', color:'#9aa3b2', textTransform:'uppercase', letterSpacing:1 }}>{obj.title}</div>
                  <div style={{ height:2, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:accent }} />
                  </div>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', letterSpacing:1 }}>{obj.current} / {obj.target}</div>
                </div>
              );
            })}
          </div>
        </BentoBox>

        {/* ── PLAY MATCH — FIFA card style ── */}
        <button
          className="db-play-btn"
          onClick={() => navigate('/matchday')}
          style={{
            ...areas.playtrain,
            animation: 'dbIn 0.25s 0.08s ease both',
            background: 'rgba(7,10,15,0.82)',
            border: `1px solid ${accent}55`,
            borderRadius: 4,
            display: 'flex', flexDirection: 'row',
            overflow: 'hidden', position: 'relative',
            minHeight: 0, minWidth: 0, padding: 0,
          }}
        >
          {/* LEFT — stacked text, top-aligned */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'10px 12px', position:'relative', zIndex:2 }}>
            {/* Top block */}
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:900, fontStyle:'italic', letterSpacing:2, textTransform:'uppercase', color:'#ffffff', lineHeight:1 }}>
                Play Match
              </div>
              {nextFixture ? (
                <>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'rgba(255,255,255,0.5)', letterSpacing:0.3, lineHeight:1.4 }}>
                    {dateStr || '—'}
                  </div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', color:'rgba(255,255,255,0.75)', letterSpacing:0.5 }}>
                    {nextFixture.isHome ? 'Home' : 'Away'} v {oppName}
                  </div>
                </>
              ) : (
                <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#556070', letterSpacing:1 }}>
                  {weeksUntil !== null ? `Match in ${weeksUntil} wk${weeksUntil!==1?'s':''}` : 'No fixture'}
                </div>
              )}
            </div>

            {/* Bottom — league badge row */}
            {nextFixture && (
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span style={{ fontFamily:"var(--font-display)", fontSize:9, fontWeight:700, fontStyle:'italic', color:'rgba(255,255,255,0.45)', letterSpacing:1 }}>
                  {myClub?.league || 'League'}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT — opponent crest fills full right half, bleeds all edges */}
          <div style={{ width:'50%', flexShrink:0, position:'relative', overflow:'hidden' }}>
            {/* Left fade so crest bleeds into bg naturally */}
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(7,10,15,0.9) 0%, rgba(7,10,15,0.3) 30%, transparent 70%)', zIndex:1, pointerEvents:'none' }} />
            {(oppClub || oppName) && (
              <div style={{ position:'absolute', inset:'-10px -10px -10px -5px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <ClubBadgeSVG club={oppClub || { name: oppName, color: '#aaaaaa' }} size={150} />
              </div>
            )}
          </div>
        </button>

        {/* ── UPCOMING FIXTURES ── */}
        <BentoBox style={{ ...areas.calendar, animation:'dbIn 0.25s 0.12s ease both' }}>
          <BoxHeader label={`Season ${season} · Week ${week}`} accent={accent} />
          <div style={{ display:'flex', gap:3, flex:1, alignItems:'center', padding:'4px 8px' }}>
            {weekStrip.map((w, i) => (
              <div key={i} style={{
                flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:2, padding:'4px 2px',
                background: w.isCurrent ? `${accent}18` : 'transparent',
                border: w.isCurrent ? `1px solid ${accent}44` : '1px solid transparent',
              }}>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:6, color:w.isCurrent ? accent : '#445060', letterSpacing:1 }}>WK</div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:w.isCurrent?900:400, fontStyle:'italic', color:w.isCurrent?accent:'#9aa3b2', lineHeight:1 }}>{w.week}</div>
                <div style={{ width:4, height:4, borderRadius:'50%', background:w.isMatch?'#f5c518':'transparent' }} />
              </div>
            ))}
          </div>
        </BentoBox>

        {/* ── STANDINGS ── */}
        <BentoBox style={{ ...areas.standings, animation:'dbIn 0.25s 0.16s ease both' }}>
          <BoxHeader label={myClub?.league || 'League'} accent={accent} />
          <div style={{ flex:1, padding:'4px 8px', display:'flex', flexDirection:'column', justifyContent:'center', gap:1, overflowY:'auto' }}>
            {leagueTable.length === 0 ? (
              <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:'#556070', textAlign:'center', padding:'12px 0' }}>No table data</div>
            ) : leagueTable.slice(0,8).map((row, i) => {
              const isMe = row.isUser;
              return (
                <div key={row.clubName} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 6px', background:isMe?`${accent}0d`:'transparent', borderLeft:isMe?`2px solid ${accent}`:'2px solid transparent', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#445060', width:12, flexShrink:0 }}>{i+1}</span>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:10, fontWeight:isMe?700:400, fontStyle:isMe?'italic':'normal', color:isMe?'#f0f2f5':'#9aa3b2', flex:1, letterSpacing:0.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.clubName}</span>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:900, color:isMe?accent:'#556070' }}>{row.points}</span>
                </div>
              );
            })}

            {recentResults.length > 0 && (
              <>
                <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'5px 0' }} />
                <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:'#445060', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Form</div>
                <div style={{ display:'flex', gap:3 }}>
                  {myForm.map((r,i) => {
                    const c = r==='W'?'#00e87a':r==='D'?'#f5c518':'#ff3b5c';
                    return (
                      <div key={i} style={{ flex:1, padding:'3px 0', background:`${c}0d`, border:`1px solid ${c}22`, display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
                        <span style={{ fontFamily:"var(--font-display)", fontSize:11, fontWeight:900, fontStyle:'italic', color:c }}>{r}</span>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:6, color:'rgba(255,255,255,0.25)' }}>{recentResults[i]?.myGoals}–{recentResults[i]?.oppGoals}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </BentoBox>

        {/* ── INBOX ── */}
        <BentoBox style={{ ...areas.inbox, animation:'dbIn 0.25s 0.20s ease both' }}>
          <BoxHeader
            label="Inbox"
            accent={accent}
            right={<span style={{ background:accent, color:'#0a0e16', fontFamily:"var(--font-mono)", fontSize:7, fontWeight:700, padding:'1px 6px' }}>3</span>}
          />
          <div style={{ flex:1, overflowY:'auto' }}>
            {[
              { text:'Board approved your transfer budget for the window.', unread:true },
              { text:"Agent: Key player's representatives want contract talks.", unread:true },
              { text:'Pre-season schedule confirmed. First match Aug 3rd.', unread:true },
              { text:'New training facilities now available for use.', unread:false },
            ].map((msg, i) => (
              <div key={i} className="db-inbox-row" style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', transition:'background 0.12s' }}>
                <div style={{ width:2, alignSelf:'stretch', flexShrink:0, background: msg.unread ? accent : 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontFamily:"var(--font-display)", fontSize:9, color:msg.unread?'#c8d0dc':'#445060', lineHeight:1.6 }}>{msg.text}</span>
              </div>
            ))}
          </div>
        </BentoBox>

      </div>
    </>
  );
}