import { useState, useMemo, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const fmtVal = (n) => {
  if (!n) return '—';
  if (n >= 1e9) return `£${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `£${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `£${(n/1e3).toFixed(0)}K`;
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

function ClubBadgeMini({ name, size = 28 }) {
  const [failed, setFailed] = useState(false);
  const url = CLUB_BADGE_URL[name];
  const color = CLUB_COLOR[name] || '#888';
  const abbr = name?.slice(0,3).toUpperCase() || '?';
  if (url && !failed) {
    return <img src={url} alt={name} onError={() => setFailed(true)}
      style={{ width:size, height:size, objectFit:'contain', flexShrink:0 }} />;
  }
  return (
    <div style={{
      width:size, height:size, borderRadius:5, flexShrink:0,
      background:`${color}22`, border:`1.5px solid ${color}44`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'var(--font-display)', fontSize:size*0.28, color, letterSpacing:0.5,
    }}>{abbr}</div>
  );
}

/* ─────────────────────────────────────────
   FIXTURE GENERATOR
   Generates a round-robin league schedule
───────────────────────────────────────── */
function generateFixtures(myClub, allClubs, season) {
  const leagueClubs = allClubs.filter(c => c.league === myClub.league && c.name !== myClub.name);
  if (!leagueClubs.length) return [];

  const fixtures = [];
  let week = 1;

  // home and away against every league club
  leagueClubs.forEach((opponent, i) => {
    fixtures.push({
      id: `s${season}-w${week}-h`,
      week: week,
      home: myClub.name,
      away: opponent.name,
      isHome: true,
      competition: myClub.league,
      played: false,
      homeGoals: null,
      awayGoals: null,
    });
    week++;
    fixtures.push({
      id: `s${season}-w${week}-a`,
      week: week,
      home: opponent.name,
      away: myClub.name,
      isHome: false,
      competition: myClub.league,
      played: false,
      homeGoals: null,
      awayGoals: null,
    });
    week++;
  });

  // add a cup run (simple knockout, 4 rounds)
  const cupOpponents = [...leagueClubs].sort(() => Math.random() - 0.5).slice(0, 4);
  cupOpponents.forEach((opponent, i) => {
    const roundNames = ['Round of 32','Quarter-Final','Semi-Final','Final'];
    fixtures.push({
      id: `s${season}-cup-${i}`,
      week: week,
      home: i % 2 === 0 ? myClub.name : opponent.name,
      away: i % 2 === 0 ? opponent.name : myClub.name,
      isHome: i % 2 === 0,
      competition: 'Cup',
      cupRound: roundNames[i],
      played: false,
      homeGoals: null,
      awayGoals: null,
    });
    week += 2;
  });

  return fixtures;
}

/* ─────────────────────────────────────────
   MATCH ENGINE
───────────────────────────────────────── */
function getTeamRating(squad) {
  if (!squad || !squad.length) return 70;
  const top11 = [...squad].sort((a,b) => b.overall - a.overall).slice(0,11);
  return Math.round(top11.reduce((s,p) => s+p.overall, 0) / top11.length);
}

function simulateGoals(attRating, defRating, talkBonus = 0) {
  const strength = Math.max(0.3, Math.min(2.5, (attRating + talkBonus - defRating + 10) / 20));
  const base = Math.random() * strength;
  if (base < 0.15) return 0;
  if (base < 0.45) return 1;
  if (base < 0.75) return 2;
  if (base < 0.90) return 3;
  if (base < 0.97) return 4;
  return 5;
}

const COMMENTARY = {
  goal:     (name, min) => [`${min}' GOAL! ${name} finds the back of the net!`, `${min}' ${name} scores! The crowd erupts!`, `${min}' Clinical finish from ${name}!`],
  miss:     (min) => [`${min}' Great chance goes begging.`, `${min}' Shot straight at the keeper.`, `${min}' Off the post! So close.`],
  save:     (min) => [`${min}' Brilliant save from the goalkeeper!`, `${min}' Denied! What a stop.`],
  foul:     (min) => [`${min}' Foul given. Free kick opportunity.`, `${min}' Referee stops play.`],
  pressure: (min) => [`${min}' Sustained pressure from the attacking side.`, `${min}' Good spell of possession.`],
  halfTime: ()    => [`HALF TIME. Teams head to the dressing rooms.`],
  fullTime: ()    => [`FULL TIME. The final whistle blows!`],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateCommentary(myGoals, oppGoals, myName, oppName, squad) {
  const events = [];
  const topScorer = squad?.length ? [...squad].sort((a,b) => b.shooting - a.shooting)[0] : null;
  const scorerName = topScorer ? topScorer.name.split(' ').pop() : myName;

  // first half events
  let myHalf1 = 0, oppHalf1 = 0;
  const totalFirst = myGoals > 0 ? Math.ceil(myGoals * 0.6) : 0;
  const oppFirst   = oppGoals > 0 ? Math.ceil(oppGoals * 0.5) : 0;

  const firstHalfMins = [8,14,19,23,28,33,37,41,44].sort(() => Math.random()-0.5);
  let scored = 0, conceded = 0;

  for (let i = 0; i < 9; i++) {
    const min = firstHalfMins[i];
    if (scored < totalFirst && Math.random() > 0.5) {
      events.push({ min, type:'goal', text: pick(COMMENTARY.goal(scorerName, min)), side:'my' });
      scored++;
    } else if (conceded < oppFirst && Math.random() > 0.6) {
      events.push({ min, type:'goal', text: pick(COMMENTARY.goal(oppName.split(' ')[0], min)), side:'opp' });
      conceded++;
    } else if (Math.random() > 0.7) {
      events.push({ min, type:'chance', text: pick(Math.random()>0.5 ? COMMENTARY.miss(min) : COMMENTARY.save(min)) });
    } else {
      events.push({ min, type:'info', text: pick(COMMENTARY.pressure(min)) });
    }
  }

  events.push({ min:45, type:'halftime', text: pick(COMMENTARY.halfTime()) });

  // second half
  const secondHalfMins = [48,53,57,62,67,71,75,80,85,88].sort(() => Math.random()-0.5);
  let scored2 = scored, conceded2 = conceded;

  for (let i = 0; i < 10; i++) {
    const min = secondHalfMins[i];
    if (scored2 < myGoals && Math.random() > 0.4) {
      events.push({ min, type:'goal', text: pick(COMMENTARY.goal(scorerName, min)), side:'my' });
      scored2++;
    } else if (conceded2 < oppGoals && Math.random() > 0.5) {
      events.push({ min, type:'goal', text: pick(COMMENTARY.goal(oppName.split(' ')[0], min)), side:'opp' });
      conceded2++;
    } else if (Math.random() > 0.65) {
      events.push({ min, type:'chance', text: pick(COMMENTARY.miss(min)) });
    } else {
      events.push({ min, type:'info', text: pick(COMMENTARY.foul(min)) });
    }
  }

  events.push({ min:90, type:'fulltime', text: pick(COMMENTARY.fullTime()) });

  return events.sort((a,b) => a.min - b.min);
}

/* ─────────────────────────────────────────
   SUB COMPONENTS
───────────────────────────────────────── */
function Card({ children, style }) {
  return (
    <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', ...style }}>
      {children}
    </div>
  );
}

function CompBadge({ competition }) {
  const isLeague = competition !== 'Cup';
  const color = isLeague ? 'var(--green)' : 'var(--yellow)';
  const bg = isLeague ? 'rgba(0,232,122,0.1)' : 'rgba(245,197,24,0.1)';
  const border = isLeague ? 'rgba(0,232,122,0.25)' : 'rgba(245,197,24,0.25)';
  return (
    <span style={{
      background:bg, border:`1px solid ${border}`, borderRadius:3,
      padding:'2px 7px', fontFamily:'var(--font-mono)', fontSize:8,
      color, letterSpacing:1.5, textTransform:'uppercase', flexShrink:0,
    }}>{isLeague ? 'League' : 'Cup'}</span>
  );
}

/* ─────────────────────────────────────────
   SCREENS
───────────────────────────────────────── */

/* 1. PRE-MATCH */
function PreMatch({ fixture, myClub, myRating, oppRating, onKickOff, onBack }) {
  const [talk, setTalk] = useState(null);
  const oppName = fixture.isHome ? fixture.away : fixture.home;
  const accColor = CLUB_COLOR[myClub?.name] || '#00e87a';

  const talks = [
    { id:'motivate', label:'Motivate', desc:'Fire them up. Attack with intent.', bonus:3, color:'var(--green)' },
    { id:'calm',     label:'Stay Calm', desc:'Control the game. Be patient.', bonus:1, color:'var(--blue)' },
    { id:'demand',   label:'Demand More', desc:'No excuses. Maximum effort.', bonus:2, color:'var(--red)' },
  ];

  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:14 }}>

      {/* back */}
      <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:2, textTransform:'uppercase', cursor:'pointer', display:'flex', alignItems:'center', gap:6, padding:0, alignSelf:'flex-start' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      {/* matchup card */}
      <Card>
        <div style={{ padding:'20px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <CompBadge competition={fixture.competition} />
            {fixture.cupRound && (
              <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:1.5 }}>{fixture.cupRound}</span>
            )}
            <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:1.5 }}>WEEK {fixture.week}</span>
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            {/* home */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 }}>
              <ClubBadgeMini name={fixture.home} size={44} />
              <span style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'var(--text)', textAlign:'center', lineHeight:1.2 }}>{fixture.home}</span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color: fixture.isHome ? accColor : 'var(--text-muted)' }}>{fixture.isHome ? myRating : oppRating}</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:7, color:'var(--text-muted)', letterSpacing:2 }}>OVR</span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:'var(--text-muted)' }}>VS</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:1.5 }}>{fixture.isHome ? 'HOME' : 'AWAY'}</span>
            </div>

            {/* away */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 }}>
              <ClubBadgeMini name={fixture.away} size={44} />
              <span style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'var(--text)', textAlign:'center', lineHeight:1.2 }}>{fixture.away}</span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color: !fixture.isHome ? accColor : 'var(--text-muted)' }}>{!fixture.isHome ? myRating : oppRating}</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:7, color:'var(--text-muted)', letterSpacing:2 }}>OVR</span>
            </div>
          </div>
        </div>
      </Card>

      {/* team talk */}
      <div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>Team Talk</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {talks.map(t => (
            <button key={t.id} onClick={() => setTalk(t.id)} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'12px 14px', borderRadius:8, cursor:'pointer', transition:'all 0.15s',
              background: talk===t.id ? `${t.color === 'var(--green)' ? 'rgba(0,232,122,0.12)' : t.color === 'var(--blue)' ? 'rgba(59,130,246,0.12)' : 'rgba(255,59,92,0.12)'}` : 'var(--bg-3)',
              border: talk===t.id ? `1px solid ${t.color === 'var(--green)' ? 'rgba(0,232,122,0.4)' : t.color === 'var(--blue)' ? 'rgba(59,130,246,0.4)' : 'rgba(255,59,92,0.4)'}` : '1px solid var(--border)',
            }}>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color: talk===t.id ? t.color : 'var(--text)', letterSpacing:0.5 }}>{t.label}</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{t.desc}</div>
              </div>
              <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${talk===t.id ? t.color : 'var(--border-mid)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {talk===t.id && <div style={{ width:8, height:8, borderRadius:'50%', background:t.color }} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* kick off */}
      <button
        onClick={() => onKickOff(talks.find(t => t.id === talk)?.bonus || 0)}
        disabled={!talk}
        style={{
          width:'100%', padding:'16px', borderRadius:8,
          background: talk ? 'var(--green)' : 'var(--bg-4)',
          border: 'none', color: talk ? '#000' : 'var(--text-muted)',
          fontFamily:'var(--font-display)', fontSize:16, fontWeight:800,
          letterSpacing:1.5, cursor: talk ? 'pointer' : 'not-allowed',
          transition:'all 0.2s', marginTop:4,
        }}
      >
        KICK OFF
      </button>
    </div>
  );
}

/* 2. LIVE SIM */
function LiveSim({ fixture, myGoals, oppGoals, events, minute, isFinished, onSub, onFinish }) {
  const myName = fixture.isHome ? fixture.home : fixture.away;
  const oppName = fixture.isHome ? fixture.away : fixture.home;
  const myScore = fixture.isHome ? myGoals : oppGoals;
  const oppScore = fixture.isHome ? oppGoals : myGoals;
  const result = myGoals > oppGoals ? 'W' : myGoals === oppGoals ? 'D' : 'L';
  const resultColor = result === 'W' ? 'var(--green)' : result === 'D' ? 'var(--yellow)' : 'var(--red)';
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [events]);

  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>

      {/* scoreboard */}
      <Card>
        <div style={{ padding:'16px', textAlign:'center' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <ClubBadgeMini name={fixture.home} size={36} />
              <span style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'var(--text-dim)', textAlign:'center', lineHeight:1.2 }}>{fixture.home}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:44, fontWeight:900, color:'var(--text)', lineHeight:1 }}>{fixture.isHome ? myScore : oppScore}</span>
                <span style={{ fontFamily:'var(--font-display)', fontSize:24, color:'var(--text-muted)' }}>–</span>
                <span style={{ fontFamily:'var(--font-display)', fontSize:44, fontWeight:900, color:'var(--text)', lineHeight:1 }}>{fixture.isHome ? oppScore : myScore}</span>
              </div>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:2,
                color: isFinished ? resultColor : 'var(--text-muted)',
                background: isFinished ? `${resultColor === 'var(--green)' ? 'rgba(0,232,122,0.1)' : resultColor === 'var(--yellow)' ? 'rgba(245,197,24,0.1)' : 'rgba(255,59,92,0.1)'}` : 'var(--bg-4)',
                border: `1px solid ${isFinished ? resultColor : 'var(--border)'}`,
                borderRadius:4, padding:'2px 10px',
              }}>
                {isFinished ? 'FT' : `${minute}'`}
              </div>
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <ClubBadgeMini name={fixture.away} size={36} />
              <span style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'var(--text-dim)', textAlign:'center', lineHeight:1.2 }}>{fixture.away}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* commentary feed */}
      <Card>
        <div style={{ padding:'8px 14px 4px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase' }}>Live Commentary</span>
        </div>
        <div ref={feedRef} style={{ height:200, overflowY:'auto', padding:'8px 0' }}>
          {events.map((e, i) => {
            const isGoal = e.type === 'goal';
            const isHalf = e.type === 'halftime';
            const isFull = e.type === 'fulltime';
            const isMy = e.side === 'my';
            return (
              <div key={i} style={{
                display:'flex', gap:10, padding:'6px 14px',
                background: isGoal ? (isMy ? 'rgba(0,232,122,0.05)' : 'rgba(255,59,92,0.05)') : 'transparent',
                borderLeft: isGoal ? `2px solid ${isMy ? 'var(--green)' : 'var(--red)'}` : '2px solid transparent',
                borderBottom: (isHalf || isFull) ? '1px solid var(--border)' : 'none',
                animation:'fadeSlideIn 0.3s ease both',
              }}>
                <span style={{
                  fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700,
                  color: isGoal ? (isMy ? 'var(--green)' : 'var(--red)') : isHalf || isFull ? 'var(--yellow)' : 'var(--text-muted)',
                  width:24, flexShrink:0, paddingTop:1,
                }}>{isHalf || isFull ? '—' : `${e.min}'`}</span>
                <span style={{ fontFamily:'var(--font-body)', fontSize:12, color: isGoal ? 'var(--text)' : isHalf || isFull ? 'var(--text-dim)' : 'var(--text-muted)', lineHeight:1.5 }}>{e.text}</span>
              </div>
            );
          })}
          {!events.length && (
            <div style={{ padding:'20px 14px', fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>
              Waiting for kick off...
            </div>
          )}
        </div>
      </Card>

      {/* actions */}
      {isFinished ? (
        <button onClick={onFinish} style={{
          width:'100%', padding:'16px', borderRadius:8,
          background:'var(--green)', border:'none', color:'#000',
          fontFamily:'var(--font-display)', fontSize:16, fontWeight:800,
          letterSpacing:1.5, cursor:'pointer',
        }}>
          VIEW REPORT
        </button>
      ) : (
        <button onClick={onSub} style={{
          width:'100%', padding:'14px', borderRadius:8,
          background:'var(--bg-3)', border:'1px solid var(--border)', color:'var(--text-dim)',
          fontFamily:'var(--font-display)', fontSize:14, fontWeight:700,
          letterSpacing:1, cursor:'pointer',
        }}>
          Make Substitution
        </button>
      )}
    </div>
  );
}

/* 3. POST MATCH */
function PostMatch({ fixture, myGoals, oppGoals, squad, onContinue }) {
  const myName = fixture.isHome ? fixture.home : fixture.away;
  const oppName = fixture.isHome ? fixture.away : fixture.home;
  const result = myGoals > oppGoals ? 'W' : myGoals === oppGoals ? 'D' : 'L';
  const resultColor = result === 'W' ? 'var(--green)' : result === 'D' ? 'var(--yellow)' : 'var(--red)';
  const resultLabel = result === 'W' ? 'Victory' : result === 'D' ? 'Draw' : 'Defeat';
  const topPlayer = squad?.length ? [...squad].sort((a,b) => b.overall - a.overall)[0] : null;

  const myShots = myGoals * 3 + Math.floor(Math.random()*5) + 2;
  const oppShots = oppGoals * 3 + Math.floor(Math.random()*5) + 2;
  const myPoss = Math.floor(40 + Math.random()*20);
  const oppPoss = 100 - myPoss;

  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:14 }}>

      {/* result hero */}
      <div style={{
        textAlign:'center', padding:'24px 16px',
        background:`linear-gradient(135deg, ${resultColor === 'var(--green)' ? 'rgba(0,232,122,0.08)' : resultColor === 'var(--yellow)' ? 'rgba(245,197,24,0.08)' : 'rgba(255,59,92,0.08)'} 0%, var(--bg-3) 100%)`,
        border:`1px solid ${resultColor === 'var(--green)' ? 'rgba(0,232,122,0.2)' : resultColor === 'var(--yellow)' ? 'rgba(245,197,24,0.2)' : 'rgba(255,59,92,0.2)'}`,
        borderRadius:10,
      }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:13, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase', marginBottom:8 }}>{resultLabel}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:8 }}>
          <ClubBadgeMini name={fixture.home} size={40} />
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'var(--font-display)', fontSize:52, fontWeight:900, color:'var(--text)', lineHeight:1 }}>{fixture.isHome ? myGoals : oppGoals}</span>
            <span style={{ fontFamily:'var(--font-display)', fontSize:28, color:'var(--text-muted)' }}>–</span>
            <span style={{ fontFamily:'var(--font-display)', fontSize:52, fontWeight:900, color:'var(--text)', lineHeight:1 }}>{fixture.isHome ? oppGoals : myGoals}</span>
          </div>
          <ClubBadgeMini name={fixture.away} size={40} />
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--text-muted)' }}>{fixture.home}</span>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)' }}>vs</span>
          <span style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--text-muted)' }}>{fixture.away}</span>
        </div>
      </div>

      {/* match stats */}
      <Card>
        <div style={{ padding:'12px 14px 4px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase' }}>Match Stats</span>
        </div>
        <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:12 }}>
          {[
            ['Shots', myShots, oppShots],
            ['Possession', `${myPoss}%`, `${oppPoss}%`],
          ].map(([label, myVal, oppVal]) => (
            <div key={label}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'var(--green)' }}>{myVal}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', alignSelf:'center' }}>{label}</span>
                <span style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'var(--red)' }}>{oppVal}</span>
              </div>
              {label === 'Possession' && (
                <div style={{ height:4, background:'var(--bg-5)', borderRadius:2, overflow:'hidden', display:'flex' }}>
                  <div style={{ width:`${myPoss}%`, background:'var(--green)', borderRadius:'2px 0 0 2px' }} />
                  <div style={{ width:`${oppPoss}%`, background:'var(--red)', borderRadius:'0 2px 2px 0' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* top performer */}
      {topPlayer && (
        <Card>
          <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:8, background:'var(--bg-4)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'var(--font-display)', fontSize:11, fontWeight:800, color:'var(--text-muted)' }}>
              {topPlayer.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color:'var(--text)' }}>{topPlayer.name}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', marginTop:2 }}>Man of the Match</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color:'var(--yellow)', lineHeight:1 }}>{topPlayer.overall}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:1.5 }}>OVR</div>
            </div>
          </div>
        </Card>
      )}

      <button onClick={onContinue} style={{
        width:'100%', padding:'16px', borderRadius:8,
        background:'var(--green)', border:'none', color:'#000',
        fontFamily:'var(--font-display)', fontSize:16, fontWeight:800,
        letterSpacing:1.5, cursor:'pointer',
      }}>
        CONTINUE
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function Matchday() {
  const { myClub, squad, allClubs, formation, week, season, results, addResult, advanceWeek } = useGameStore();

  const [tab, setTab] = useState('calendar');
  const [screen, setScreen] = useState('calendar'); // calendar | prematch | livesim | postmatch
  const [activeFixture, setActiveFixture] = useState(null);
  const [talkBonus, setTalkBonus] = useState(0);
  const [simEvents, setSimEvents] = useState([]);
  const [simMinute, setSimMinute] = useState(0);
  const [simFinished, setSimFinished] = useState(false);
  const [myGoals, setMyGoals] = useState(0);
  const [oppGoals, setOppGoals] = useState(0);
  const simRef = useRef(null);

  /* generate fixtures once per club/season */
  const fixtures = useMemo(() => {
    if (!myClub || !allClubs) return [];
    return generateFixtures(myClub, allClubs, season);
  }, [myClub, allClubs, season]);

  /* mark played fixtures from results */
  const playedIds = useMemo(() => new Set(results.map(r => r.fixtureId)), [results]);

  const myRating = useMemo(() => getTeamRating(squad), [squad]);

  const upcomingFixtures = fixtures.filter(f => !playedIds.has(f.id));
  const playedFixtures   = fixtures.filter(f => playedIds.has(f.id));

  /* ── Start match sim ── */
  function handleKickOff(bonus) {
    setTalkBonus(bonus);
    const oppName = activeFixture.isHome ? activeFixture.away : activeFixture.home;
    const oppClub = allClubs?.find(c => c.name === oppName);
    const oppPlayers = squad ? [] : []; // we don't have opp squad, use club rating proxy
    const oppRatingVal = oppClub ? Math.min(90, Math.max(60, 70 + (oppClub.budget || 0) / 20000000)) : 72;

    const myAtt  = myRating + bonus;
    const myDef  = myRating - 2;
    const oppAtt = oppRatingVal;
    const oppDef = oppRatingVal - 2;

    const mg = simulateGoals(myAtt, oppDef, 0);
    const og = simulateGoals(oppAtt, myDef, 0);

    setMyGoals(mg);
    setOppGoals(og);

    const commentary = generateCommentary(mg, og, myClub.name, oppName, squad);
    setSimEvents([]);
    setSimMinute(0);
    setSimFinished(false);
    setScreen('livesim');

    /* stream events with delays */
    let i = 0;
    simRef.current = setInterval(() => {
      if (i >= commentary.length) {
        clearInterval(simRef.current);
        setSimFinished(true);
        return;
      }
      const ev = commentary[i];
      setSimEvents(prev => [...prev, ev]);
      setSimMinute(ev.min);
      i++;
    }, 600);
  }

  useEffect(() => () => clearInterval(simRef.current), []);

  function handleFinish() { setScreen('postmatch'); }

  function handleContinue() {
    const result = {
      fixtureId: activeFixture.id,
      week: activeFixture.week,
      competition: activeFixture.competition,
      isHome: activeFixture.isHome,
      opponent: activeFixture.isHome ? activeFixture.away : activeFixture.home,
      homeGoals: activeFixture.isHome ? myGoals : oppGoals,
      awayGoals: activeFixture.isHome ? oppGoals : myGoals,
      myGoals,
      oppGoals,
    };
    addResult(result);
    advanceWeek();
    setScreen('calendar');
    setActiveFixture(null);
    setSimEvents([]);
  }

  function handlePlay(fixture) {
    setActiveFixture(fixture);
    setScreen('prematch');
  }

  const oppRatingForFixture = (fixture) => {
    const oppName = fixture.isHome ? fixture.away : fixture.home;
    const oppClub = allClubs?.find(c => c.name === oppName);
    return oppClub ? Math.round(Math.min(90, Math.max(60, 70 + (oppClub.budget||0)/20000000))) : 72;
  };

  /* ── RENDER ── */
  if (screen === 'prematch' && activeFixture) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-1)', paddingBottom:80 }}>
        <PreMatch
          fixture={activeFixture}
          myClub={myClub}
          myRating={myRating}
          oppRating={oppRatingForFixture(activeFixture)}
          onKickOff={handleKickOff}
          onBack={() => setScreen('calendar')}
        />
      </div>
    );
  }

  if (screen === 'livesim' && activeFixture) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-1)', paddingBottom:80 }}>
        <LiveSim
          fixture={activeFixture}
          myGoals={myGoals}
          oppGoals={oppGoals}
          events={simEvents}
          minute={simMinute}
          isFinished={simFinished}
          onSub={() => {}}
          onFinish={handleFinish}
        />
      </div>
    );
  }

  if (screen === 'postmatch' && activeFixture) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-1)', paddingBottom:80 }}>
        <PostMatch
          fixture={activeFixture}
          myGoals={myGoals}
          oppGoals={oppGoals}
          squad={squad}
          onContinue={handleContinue}
        />
      </div>
    );
  }

  /* ── CALENDAR ── */
  return (
    <>
      <style>{`
        @keyframes fadeSlideIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        .fix-card { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid var(--border); transition:background 0.12s; }
        .play-btn { background:var(--green); border:none; color:#000; font-family:var(--font-display); font-size:11px; font-weight:800; padding:7px 14px; border-radius:6px; cursor:pointer; letter-spacing:1; white-space:nowrap; -webkit-tap-highlight-color:transparent; flex-shrink:0; }
        .sim-btn  { background:var(--bg-4); border:1px solid var(--border); color:var(--text-muted); font-family:var(--font-display); font-size:11px; font-weight:700; padding:7px 12px; border-radius:6px; cursor:pointer; letter-spacing:0.5; white-space:nowrap; flex-shrink:0; }
        .section-label { padding:10px 16px 6px; font-family:var(--font-mono); font-size:8px; color:var(--text-muted); letter-spacing:3px; text-transform:uppercase; background:var(--bg-2); border-bottom:1px solid var(--border); border-top:1px solid var(--border); }
      `}</style>

      <div style={{ minHeight:'100vh', background:'var(--bg-1)', paddingBottom:80 }}>

        {/* tab bar */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--bg-1)', position:'sticky', top:52, zIndex:10 }}>
          {['calendar','results'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, padding:'12px', background:'none', border:'none',
              borderBottom: tab===t ? '2px solid var(--green)' : '2px solid transparent',
              color: tab===t ? 'var(--green)' : 'var(--text-muted)',
              fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:2, textTransform:'uppercase',
              cursor:'pointer', transition:'all 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {/* season header */}
        <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--border)' }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'var(--text)', letterSpacing:0.5 }}>Season {season}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase', marginTop:2 }}>{myClub?.league} · {fixtures.length} fixtures</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:'var(--green)' }}>W{week}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>Current Week</div>
          </div>
        </div>

        {/* CALENDAR TAB */}
        {tab === 'calendar' && (
          <div>
            {upcomingFixtures.length === 0 && (
              <div style={{ padding:'40px 16px', textAlign:'center', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>
                Season complete
              </div>
            )}

            {upcomingFixtures.map((fixture, i) => {
              const isNext = i === 0;
              return (
                <div key={fixture.id} className="fix-card" style={{ background: isNext ? 'rgba(0,232,122,0.03)' : 'transparent', borderLeft: isNext ? '2px solid var(--green)' : '2px solid transparent' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:2, width:28, flexShrink:0, alignItems:'center' }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color: isNext ? 'var(--green)' : 'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase' }}>W{fixture.week}</span>
                    <CompBadge competition={fixture.competition} />
                  </div>

                  <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                    <ClubBadgeMini name={fixture.home} size={24} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color: fixture.isHome ? 'var(--text)' : 'var(--text-dim)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:80 }}>{fixture.home}</span>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)' }}>vs</span>
                        <span style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color: !fixture.isHome ? 'var(--text)' : 'var(--text-dim)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:80 }}>{fixture.away}</span>
                      </div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:1, marginTop:2 }}>
                        {fixture.isHome ? 'Home' : 'Away'}{fixture.cupRound ? ` · ${fixture.cupRound}` : ''}
                      </div>
                    </div>
                    <ClubBadgeMini name={fixture.away} size={24} />
                  </div>

                  {isNext ? (
                    <button className="play-btn" onClick={() => handlePlay(fixture)}>PLAY</button>
                  ) : (
                    <button className="sim-btn" onClick={() => handlePlay(fixture)}>SIM</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* RESULTS TAB */}
        {tab === 'results' && (
          <div>
            {results.length === 0 && (
              <div style={{ padding:'40px 16px', textAlign:'center', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>
                No results yet
              </div>
            )}
            {[...results].reverse().map((r, i) => {
              const result = r.myGoals > r.oppGoals ? 'W' : r.myGoals === r.oppGoals ? 'D' : 'L';
              const rc = result === 'W' ? 'var(--green)' : result === 'D' ? 'var(--yellow)' : 'var(--red)';
              return (
                <div key={i} className="fix-card">
                  <div style={{ width:20, height:20, borderRadius:4, background: result==='W'?'rgba(0,232,122,0.12)':result==='D'?'rgba(245,197,24,0.12)':'rgba(255,59,92,0.12)', border:`1px solid ${rc}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:11, fontWeight:800, color:rc, flexShrink:0 }}>{result}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      vs {r.opponent}
                    </div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', marginTop:2 }}>
                      W{r.week} · {r.competition}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'var(--text)' }}>{r.homeGoals}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>–</span>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'var(--text)' }}>{r.awayGoals}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}