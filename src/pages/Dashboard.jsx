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

const cardBase = () => ({
  background: 'rgba(10,14,22,0.92)',
  border: '1px solid rgba(255,255,255,0.07)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
});

const Label = ({ text, color = '#556070' }) => (
  <div style={{
    padding: '5px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 9, fontWeight: 700, fontStyle: 'italic',
    letterSpacing: 3, textTransform: 'uppercase',
    color, flexShrink: 0,
  }}>{text}</div>
);

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ── fixture-day helpers (mirror Matchday logic) ── */
function gameDay2Date(gameDay) {
  const base = new Date(2024, 7, 1); // Aug 1 2024
  base.setDate(base.getDate() + gameDay - 1);
  return base;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { myClub, squad, results = [], season = 1, week = 1, budget, fixtures = [], leagueTable = [] } = useGameStore();

  const accent = myClub?.color || CLUB_COLOR[myClub?.name] || '#00e87a';

  /* Augment fixtures with isHome for convenience (same approach as Matchday.jsx) */
  const myFixtures = useMemo(() => {
    if (!myClub) return [];
    return fixtures.map(f => ({ ...f, isHome: f.home === myClub.name }));
  }, [fixtures, myClub]);

  /* Next unplayed fixture — matchday if it's scheduled for the current week */
  const upcomingFix  = useMemo(() => myFixtures.filter(f => !f.played), [myFixtures]);
  const nextFixture  = useMemo(() => upcomingFix.find(f => f.week === week) || upcomingFix[0] || null, [upcomingFix, week]);
  const isMatchday   = !!(nextFixture && nextFixture.week === week);
  const weeksUntil   = nextFixture ? nextFixture.week - week : null;

  const wdl = useMemo(() => {
    const calc = (fn) => (results || []).filter(r => fn(r.myGoals, r.oppGoals)).length;
    return { w: calc((m,o)=>m>o), d: calc((m,o)=>m===o), l: calc((m,o)=>m<o) };
  }, [results]);

  const recentResults = useMemo(() => [...(results||[])].reverse().slice(0,5), [results]);
  const myForm = recentResults.map(r => r.myGoals > r.oppGoals ? 'W' : r.myGoals === r.oppGoals ? 'D' : 'L');

  const newsItems  = generateNews(myClub, squad);
  const newsImages = getNewsImages(myClub?.name);

  /* Upcoming fixtures strip (next few weeks, not real calendar days) */
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

  const oppName = nextFixture ? (nextFixture.isHome ? nextFixture.away : nextFixture.home) : null;

  return (
    <>
      <style>{`
        .db-news-item { transition: opacity 0.15s; cursor: default; }
        .db-news-item:hover { opacity: 0.85; }
        .db-btn { transition: filter 0.15s, transform 0.1s; cursor: pointer; border: none; outline: none; }
        .db-btn:hover { filter: brightness(1.15); }
        .db-btn:active { transform: scale(0.97); }
        .db-inbox-row { transition: background 0.12s; cursor: pointer; }
        .db-inbox-row:hover { background: rgba(255,255,255,0.03) !important; }
        @keyframes dbIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
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
        <div style={{ ...cardBase(), ...areas.news, animation: 'dbIn 0.25s ease both' }}>
          <Label text="News" />
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {newsItems.map((item, i) => (
              <div key={i} className="db-news-item" style={{
                flex: 1, position: 'relative',
                borderBottom: i < newsItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                minHeight: 0, overflow: 'hidden',
              }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:`url(${newsImages[i % newsImages.length]})`, backgroundSize:'cover', backgroundPosition:'center', opacity:0.18 }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(10,14,22,0.9) 45%, rgba(10,14,22,0.25) 100%)' }} />
                <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', padding:'7px 10px', height:'100%', gap:8, boxSizing:'border-box' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Barlow', sans-serif", fontSize:10, color:'#c8d0dc', lineHeight:1.5 }}>{item.text}</div>
                    <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:7, color:'#556070', letterSpacing:1.5, marginTop:3 }}>{item.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── OBJECTIVES ── */}
        <div style={{ ...cardBase(), ...areas.objectives, animation: 'dbIn 0.25s 0.04s ease both' }}>
          <Label text="Season Objectives" />
          <div style={{ flex:1, display:'flex', gap:5, padding:'6px 8px', alignItems:'stretch' }}>
            {OBJECTIVES.map((obj, i) => {
              const pct = Math.round((obj.current / obj.target) * 100);
              return (
                <div key={i} style={{ flex:1, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', padding:'6px 8px', display:'flex', flexDirection:'column', gap:4 }}>
                  <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:9, fontWeight:700, fontStyle:'italic', color:'#9aa3b2', textTransform:'uppercase', letterSpacing:1 }}>{obj.title}</div>
                  <div style={{ height:2, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:accent }} />
                  </div>
                  <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:7, color:'#556070', letterSpacing:1 }}>{obj.current} / {obj.target}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PLAY / TRAIN ── */}
        <button
          className="db-btn"
          onClick={() => navigate('/matchday')}
          style={{
            ...cardBase(),
            ...areas.playtrain,
            animation: 'dbIn 0.25s 0.08s ease both',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 6, cursor: 'pointer',
            background: isMatchday
              ? `linear-gradient(160deg, ${accent}33 0%, ${accent}10 100%)`
              : 'rgba(10,14,22,0.92)',
            borderTop: `2px solid ${accent}`,
            width: '100%', position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Pulse ring on matchday */}
          {isMatchday && (
            <div style={{
              position:'absolute', width:80, height:80, borderRadius:'50%',
              border:`1px solid ${accent}44`,
              animation:'pulse 2s infinite',
            }} />
          )}
          <div style={{
            width:32, height:32, background:`${accent}22`, border:`1px solid ${accent}55`,
            display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1,
          }}>
            {isMatchday
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill={accent}><path d="M5 3l14 9-14 9V3z"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            }
          </div>
          <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:12, fontWeight:900, fontStyle:'italic', letterSpacing:3, textTransform:'uppercase', color:accent, position:'relative', zIndex:1 }}>
            {isMatchday ? 'Play Match' : 'Training'}
          </div>
          <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:7, color:'#556070', letterSpacing:1.5, textTransform:'uppercase', position:'relative', zIndex:1 }}>
            {isMatchday
              ? `vs ${oppName}`
              : weeksUntil !== null
                ? weeksUntil === 1 ? 'Match next week' : `Match in ${weeksUntil} weeks`
                : 'No fixture scheduled'
            }
          </div>
        </button>

        {/* ── UPCOMING FIXTURES ── */}
        <div style={{ ...cardBase(), ...areas.calendar, animation:'dbIn 0.25s 0.12s ease both', padding:'6px 8px', gap:4 }}>
          <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:7, color:'#556070', letterSpacing:2, textTransform:'uppercase', flexShrink:0 }}>
            Season {season} · Week {week}
          </div>
          <div style={{ display:'flex', gap:3, flex:1, alignItems:'center' }}>
            {weekStrip.map((w, i) => (
              <div key={i} style={{
                flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:2, padding:'4px 2px',
                background: w.isCurrent ? `${accent}22` : 'transparent',
                border: w.isCurrent ? `1px solid ${accent}55` : '1px solid transparent',
                borderRadius:2,
              }}>
                <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:6, color:w.isCurrent ? accent : '#556070', letterSpacing:1 }}>WK</div>
                <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:11, fontWeight:w.isCurrent?900:400, color:w.isCurrent?accent:'#9aa3b2', lineHeight:1 }}>{w.week}</div>
                <div style={{ width:4, height:4, borderRadius:'50%', background:w.isMatch?'#f5c518':'transparent' }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── STANDINGS ── */}
        <div style={{ ...cardBase(), ...areas.standings, animation:'dbIn 0.25s 0.16s ease both' }}>
          <Label text={myClub?.league || 'League'} />
          <div style={{ flex:1, padding:'4px 8px', display:'flex', flexDirection:'column', justifyContent:'center', gap:2, overflowY:'auto' }}>
            {leagueTable.length === 0 ? (
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'#556070', textAlign:'center', padding:'12px 0' }}>No table data</div>
            ) : leagueTable.slice(0,8).map((row, i) => {
              const isMe = row.isUser;
              return (
                <div key={row.clubName} style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 4px', background:isMe?'rgba(255,255,255,0.04)':'transparent', borderLeft:isMe?`2px solid ${accent}`:'2px solid transparent' }}>
                  <span style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:7, color:'#556070', width:10 }}>{i+1}</span>
                  <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:10, fontWeight:isMe?700:400, color:isMe?'#f0f2f5':'#9aa3b2', flex:1, letterSpacing:0.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.clubName}</span>
                  <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:10, fontWeight:700, color:isMe?accent:'#556070' }}>{row.points}</span>
                </div>
              );
            })}

            {/* Recent results strip */}
            {recentResults.length > 0 && (
              <>
                <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'6px 0' }} />
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'#556070', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Form</div>
                <div style={{ display:'flex', gap:4 }}>
                  {myForm.map((r,i) => {
                    const c = r==='W'?'#00e87a':r==='D'?'#f5c518':'#ff3b5c';
                    return (
                      <div key={i} style={{
                        flex:1, padding:'4px 0', background:`${c}10`, border:`1px solid ${c}33`,
                        display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                      }}>
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:900, color:c }}>{r}</span>
                        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.3)' }}>{recentResults[i]?.myGoals}–{recentResults[i]?.oppGoals}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── INBOX ── */}
        <div style={{ ...cardBase(), ...areas.inbox, animation:'dbIn 0.25s 0.20s ease both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
            <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:9, fontWeight:700, fontStyle:'italic', letterSpacing:3, textTransform:'uppercase', color:'#556070' }}>Inbox</span>
            <span style={{ background:accent, color:'#0a0e16', fontFamily:"'Share Tech Mono', monospace", fontSize:7, fontWeight:700, padding:'1px 5px', borderRadius:10 }}>3</span>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {[
              { text:'Board approved your transfer budget for the window.', unread:true },
              { text:"Agent: Key player's representatives want contract talks.", unread:true },
              { text:'Pre-season schedule confirmed. First match Aug 3rd.', unread:true },
              { text:'New training facilities now available for use.', unread:false },
            ].map((msg, i) => (
              <div key={i} className="db-inbox-row" style={{ display:'flex', alignItems:'flex-start', gap:7, padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width:5, height:5, borderRadius:'50%', flexShrink:0, marginTop:4, background:msg.unread?accent:'rgba(255,255,255,0.1)' }} />
                <span style={{ fontFamily:"'Barlow', sans-serif", fontSize:9, color:msg.unread?'#c8d0dc':'#556070', lineHeight:1.5 }}>{msg.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}