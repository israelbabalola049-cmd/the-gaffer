import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import PreMatch from '../matchday/PreMatch';
import LiveSim from '../matchday/LiveSim';
import PostMatch from '../matchday/PostMatch';
import { simulateFullMatch as runMatch } from '../matchday/matchEngine';

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */

const COMP = {
  'Premier League':    { color: '#3d0064', accent: '#a855f7', label: 'PL' },
  'La Liga':           { color: '#c2410c', accent: '#f97316', label: 'LL' },
  'Bundesliga':        { color: '#d20515', accent: '#ef4444', label: 'BL' },
  'Serie A':           { color: '#1a1a6b', accent: '#6366f1', label: 'SA' },
  'Ligue 1':           { color: '#001f5f', accent: '#3b82f6', label: 'L1' },
  'Champions League':  { color: '#1a3a6b', accent: '#fbbf24', label: 'UCL' },
  'Europa League':     { color: '#7c2d12', accent: '#fb923c', label: 'UEL' },
  'Conference League': { color: '#0a5c36', accent: '#34d399', label: 'UECL' },
  'FA Cup':            { color: '#003087', accent: '#60a5fa', label: 'FAC' },
  'Carabao Cup':       { color: '#003087', accent: '#4ade80', label: 'CC' },
  'Cup':               { color: '#c9a227', accent: '#fbbf24', label: 'CUP' },
};
const getComp = n => COMP[n] || { color: '#1a1a1a', accent: '#555', label: '?' };

const CLUB_COLOR = {
  'Real Madrid':'#FEBE10','Barcelona':'#A50044','Manchester City':'#6CABDD',
  'Liverpool':'#C8102E','Arsenal':'#EF0107','Chelsea':'#034694',
  'Manchester United':'#DA291C','Tottenham':'#132257','Bayern Munich':'#DC052D',
  'PSG':'#003370','AC Milan':'#FB090B','Inter Milan':'#0068A8',
  'Atletico Madrid':'#CB3524','Bayer Leverkusen':'#E32221',
  'Brighton':'#0057B8','Aston Villa':'#670E36',
  'Borussia Dortmund':'#FDE100','Juventus':'#555',
};

/* SVG-based badge URLs — clean renders, no cutout artefacts */
const CLUB_BADGE = {
  'Manchester City':
    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'Liverpool':
    'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'Arsenal':
    'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  'Chelsea':
    'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'Manchester United':
    'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  'Tottenham':
    'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  'Aston Villa':
    'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_FC_new_crest.svg',
  'Brighton':
    'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_FC_logo.svg',
  'Bayern Munich':
    'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'Real Madrid':
    'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'Barcelona':
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'PSG':
    'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  'AC Milan':
    'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  'Inter Milan':
    'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  'Juventus':
    'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon_%28black%29.svg',
  'Atletico Madrid':
    'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  'Borussia Dortmund':
    'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'Bayer Leverkusen':
    'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
};

/* Season starts in August — map game month index to real month */
const SEASON_START_MONTH = 7; // August (0-indexed)
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function gameMonthLabel(gameMonthIdx) {
  return MONTH_NAMES[(SEASON_START_MONTH + gameMonthIdx) % 12];
}

const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '3-4-3'];

const FORMATION_POSITIONS = {
  '4-3-3':   [
    { x:50, y:88, pos:'GK' },
    { x:15, y:70, pos:'LB' }, { x:35, y:72, pos:'CB' }, { x:65, y:72, pos:'CB' }, { x:85, y:70, pos:'RB' },
    { x:22, y:50, pos:'CM' }, { x:50, y:47, pos:'CM' }, { x:78, y:50, pos:'CM' },
    { x:15, y:25, pos:'LW' }, { x:50, y:22, pos:'ST' }, { x:85, y:25, pos:'RW' },
  ],
  '4-4-2':   [
    { x:50, y:88, pos:'GK' },
    { x:15, y:70, pos:'LB' }, { x:35, y:72, pos:'CB' }, { x:65, y:72, pos:'CB' }, { x:85, y:70, pos:'RB' },
    { x:12, y:50, pos:'LM' }, { x:35, y:50, pos:'CM' }, { x:65, y:50, pos:'CM' }, { x:88, y:50, pos:'RM' },
    { x:35, y:22, pos:'ST' }, { x:65, y:22, pos:'ST' },
  ],
  '4-2-3-1': [
    { x:50, y:88, pos:'GK' },
    { x:15, y:70, pos:'LB' }, { x:35, y:72, pos:'CB' }, { x:65, y:72, pos:'CB' }, { x:85, y:70, pos:'RB' },
    { x:35, y:55, pos:'CDM' }, { x:65, y:55, pos:'CDM' },
    { x:15, y:35, pos:'LM' }, { x:50, y:38, pos:'CAM' }, { x:85, y:35, pos:'RM' },
    { x:50, y:18, pos:'ST' },
  ],
  '3-5-2':   [
    { x:50, y:88, pos:'GK' },
    { x:25, y:72, pos:'CB' }, { x:50, y:74, pos:'CB' }, { x:75, y:72, pos:'CB' },
    { x:10, y:50, pos:'LWB' }, { x:30, y:52, pos:'CM' }, { x:50, y:50, pos:'CM' }, { x:70, y:52, pos:'CM' }, { x:90, y:50, pos:'RWB' },
    { x:35, y:22, pos:'ST' }, { x:65, y:22, pos:'ST' },
  ],
  '5-3-2':   [
    { x:50, y:88, pos:'GK' },
    { x:10, y:70, pos:'LWB' }, { x:28, y:72, pos:'CB' }, { x:50, y:74, pos:'CB' }, { x:72, y:72, pos:'CB' }, { x:90, y:70, pos:'RWB' },
    { x:25, y:48, pos:'CM' }, { x:50, y:46, pos:'CM' }, { x:75, y:48, pos:'CM' },
    { x:35, y:22, pos:'ST' }, { x:65, y:22, pos:'ST' },
  ],
  '3-4-3':   [
    { x:50, y:88, pos:'GK' },
    { x:25, y:72, pos:'CB' }, { x:50, y:74, pos:'CB' }, { x:75, y:72, pos:'CB' },
    { x:12, y:52, pos:'LM' }, { x:38, y:52, pos:'CM' }, { x:62, y:52, pos:'CM' }, { x:88, y:52, pos:'RM' },
    { x:18, y:22, pos:'LW' }, { x:50, y:18, pos:'ST' }, { x:82, y:22, pos:'RW' },
  ],
};

/* ═══════════════════════════════════════════════
   PRESS CONFERENCE QUESTIONS
═══════════════════════════════════════════════ */

const PRE_QUESTIONS = [
  {
    q: "Your squad is full of egos right now. How do you keep them unified?",
    answers: [
      { text: "I remind them trophies speak louder than egos. No one wins alone.", good: true },
      { text: "I let them express themselves — happy players play better.", good: false },
      { text: "Strict discipline. Anyone who disrupts the group is dropped.", good: true },
      { text: "It's not really a problem I'm losing sleep over, to be honest.", good: false },
    ],
    effect: { morale: 4, rating: 1 },
  },
  {
    q: "The media is saying your striker lacks big-game mentality. Your response?",
    answers: [
      { text: "He's been excellent in training. He'll prove people wrong on the pitch.", good: true },
      { text: "I agree, honestly. I'm considering dropping him for this one.", good: false },
      { text: "The media can say what they like. My trust in him doesn't waver.", good: true },
      { text: "These questions don't help anyone. Next.", good: false },
    ],
    effect: { morale: 3, rating: 1 },
  },
  {
    q: "You're the underdog heading into this. Does that relieve pressure or add it?",
    answers: [
      { text: "Being underestimated is exactly where we thrive. Watch us.", good: true },
      { text: "There's no pressure. We just focus on our own performance.", good: false },
      { text: "It adds pressure — I expect nothing less than three points regardless.", good: false },
      { text: "It frees us. No expectations means we can play without fear.", good: true },
    ],
    effect: { morale: 5, rating: 1 },
  },
  {
    q: "Three matches without a win. Is this a crisis?",
    answers: [
      { text: "Not at all. We've been unlucky with results, but the performances are there.", good: true },
      { text: "I'll be honest — yes. We need a reaction and we need it now.", good: false },
      { text: "We've been performing well. The squad is fully behind the process.", good: true },
      { text: "Results define crisis. We're not panicking, but we're not happy either.", good: false },
    ],
    effect: { morale: -3, rating: -1 },
  },
  {
    q: "Reports claim your captain wants to leave at the end of the season. Comment?",
    answers: [
      { text: "My captain is fully committed. I speak to him daily — this is noise.", good: true },
      { text: "Every player has a price. If the right offer comes, we'll discuss.", good: false },
      { text: "I won't address speculation. He plays on Saturday, that's all that matters.", good: true },
      { text: "It concerns me. I'd be lying if I said it doesn't affect the group.", good: false },
    ],
    effect: { morale: 4, rating: 2 },
  },
  {
    q: "Your opponents have 15 goals in the last 4 games. How do you stop them?",
    answers: [
      { text: "Organisation and compactness. We'll frustrate them and hit on the break.", good: true },
      { text: "We focus on ourselves. You control what you can control.", good: false },
      { text: "We've done our homework. We know exactly where they're vulnerable.", good: true },
      { text: "Honestly, you can't fully stop quality. You just hope to limit it.", good: false },
    ],
    effect: { morale: 3, rating: 1 },
  },
  {
    q: "A top club linked with your best player. Will you fight to keep him?",
    answers: [
      { text: "Absolutely. He's not going anywhere. This club matches his ambitions.", good: true },
      { text: "We'll cross that bridge when we come to it. He's focused right now.", good: false },
      { text: "Money talks in football. But our project speaks louder than any fee.", good: true },
      { text: "I can't control his ambitions. I can only control the environment I build.", good: false },
    ],
    effect: { morale: 3, rating: 1 },
  },
  {
    q: "This match is a must-win for top-four ambitions. Agree?",
    answers: [
      { text: "Every game is a final at this stage. That mindset is non-negotiable.", good: true },
      { text: "In football nothing is ever must-win — but we want three points badly.", good: true },
      { text: "I don't use that language. It creates unnecessary pressure on the group.", good: false },
      { text: "Yes, bluntly — we need this. No sugarcoating it.", good: false },
    ],
    effect: { morale: 4, rating: 1 },
  },
];

const POST_QUESTIONS_WIN = [
  {
    q: "A convincing performance. What was the key to unlocking them today?",
    answers: [
      { text: "Pressing high and winning second balls. We suffocated their build-up.", good: true },
      { text: "We were just better. Simple as that.", good: false },
      { text: "The tactical setup gave us overloads on the left — we exploited that.", good: true },
      { text: "Honestly? A bit of luck plus quality. Hard to stop.", good: false },
    ],
    effect: { morale: 4, rating: 1 },
  },
  {
    q: "Your striker was anonymous for 70 minutes before scoring. Happy with that?",
    answers: [
      { text: "He stayed in the game mentally and punished them when it mattered. That's elite.", good: true },
      { text: "No, he needs to be more involved. I'll be having that conversation with him.", good: false },
      { text: "Strikers live for those moments. He delivered. That's all I ask.", good: true },
      { text: "It worried me at half-time, I'll be honest. But he answered.", good: false },
    ],
    effect: { morale: 3, rating: 1 },
  },
  {
    q: "Can you sustain this level for the rest of the season?",
    answers: [
      { text: "We train for exactly this. Consistency is the hallmark of a winning team.", good: true },
      { text: "One game at a time. Today means nothing if we drop points next week.", good: true },
      { text: "Hard to say. We'll take it game by game and see where it takes us.", good: false },
      { text: "I don't want to set expectations. Football can change very quickly.", good: false },
    ],
    effect: { morale: 3, rating: 1 },
  },
];

const POST_QUESTIONS_LOSS = [
  {
    q: "A tough afternoon. Was that the worst performance of your tenure?",
    answers: [
      { text: "Not at all. We had chances — the result is harsh given the performance.", good: true },
      { text: "Yes. I won't hide from that. We simply weren't good enough today.", good: false },
      { text: "Results can be deceiving. We played well in phases.", good: true },
      { text: "I'll need to see it back. I'm too frustrated to be fair right now.", good: false },
    ],
    effect: { morale: -3, rating: -1 },
  },
  {
    q: "Three points dropped. Is the dressing room still behind you?",
    answers: [
      { text: "100%. Losing together is what defines a squad. We'll come back stronger.", good: true },
      { text: "I'll ask them. It's a question I can't answer for them.", good: false },
      { text: "I have total faith in this group. One result doesn't break us.", good: true },
      { text: "That's a question for them, not me. All I can do is lead.", good: false },
    ],
    effect: { morale: -4, rating: -2 },
  },
  {
    q: "Where does the blame lie for today's result?",
    answers: [
      { text: "It starts with me. I set the team up and the setup didn't work today.", good: true },
      { text: "Individual errors cost us. I won't point fingers publicly though.", good: false },
      { text: "It's collective. We win together, we lose together.", good: true },
      { text: "I'd rather not assign blame right now. Let me process this first.", good: false },
    ],
    effect: { morale: -2, rating: -1 },
  },
];

const POST_QUESTIONS_DRAW = [
  {
    q: "A point from this — satisfied or frustrated?",
    answers: [
      { text: "Both. We had enough chances to win it but we defended well when we needed to.", good: true },
      { text: "Satisfied. Against this opposition, a point is a good result.", good: false },
      { text: "Frustrated. We let them back in after controlling the first half.", good: true },
      { text: "Neither. We'll move on and focus on the next one.", good: false },
    ],
    effect: { morale: 1, rating: 0 },
  },
  {
    q: "The dropped points could be costly by season's end. Are you worried?",
    answers: [
      { text: "Every dropped point matters at this level. We know that. We'll respond.", good: true },
      { text: "It's one result. I'm not going to catastrophise over one game.", good: false },
      { text: "We'll assess at the end of the season. Right now the focus is on recovery.", good: true },
      { text: "I'm not in the business of worrying. I'm in the business of winning.", good: false },
    ],
    effect: { morale: 0, rating: 0 },
  },
];

/* ═══════════════════════════════════════════════
   TEAM TALKS
═══════════════════════════════════════════════ */

const TEAM_TALKS = [
  {
    id: 'destroy',
    label: 'We go out there and destroy them.',
    quote: '"No mercy. Attack from the first whistle. I want them rattled before half-time."',
    tone: 'Aggressive',
    bonus: 3, tactic: 'attacking', moraleMod: 5,
    color: '#ef4444',
  },
  {
    id: 'discipline',
    label: "Stay disciplined. Don't give them space.",
    quote: '"Shape is everything today. We win the battle in midfield and the rest follows."',
    tone: 'Tactical',
    bonus: 1, tactic: 'defensive', moraleMod: 1,
    color: '#3b82f6',
  },
  {
    id: 'moment',
    label: 'This is our moment. The fans are behind us.',
    quote: '"Seventy thousand people out there believe in you. Don\'t let the moment pass."',
    tone: 'Inspirational',
    bonus: 2, tactic: 'balanced', moraleMod: 7,
    color: '#f59e0b',
  },
  {
    id: 'simple',
    label: 'Keep it simple. Execute the plan.',
    quote: '"No heroics. We\'ve trained for this. Trust the system, trust each other."',
    tone: 'Composed',
    bonus: 1, tactic: 'balanced', moraleMod: 2,
    color: '#10b981',
  },
  {
    id: 'believe',
    label: 'I believe in every single one of you.',
    quote: '"From the first name on the sheet to the last sub on the bench — you\'re all ready."',
    tone: 'Personal',
    bonus: 2, tactic: 'balanced', moraleMod: 8,
    color: '#8b5cf6',
  },
];

/* ═══════════════════════════════════════════════
   SHARED HELPERS
═══════════════════════════════════════════════ */

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function ClubBadge({ name, size = 28 }) {
  const [failed, setFailed] = useState(false);
  const url = CLUB_BADGE[name];
  const color = CLUB_COLOR[name] || '#555';
  const abbr = (name || '?').slice(0, 3).toUpperCase();
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setFailed(true)}
        style={{
          width: size, height: size,
          objectFit: 'contain', flexShrink: 0,
          /* No background — SVGs render clean without a box */
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 5, flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.28,
      color, letterSpacing: 0.5, fontWeight: 700,
    }}>{abbr}</div>
  );
}

function FormDot({ result }) {
  const c = result === 'W' ? '#00e87a' : result === 'D' ? '#f5c518' : '#ff3b5c';
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />;
}

function getTeamRating(squad) {
  if (!squad?.length) return 70;
  const top11 = [...squad].sort((a, b) => b.overall - a.overall).slice(0, 11);
  return Math.round(top11.reduce((s, p) => s + p.overall, 0) / top11.length);
}

/* ─── Fixture generator ─── */
function generateFixtures(myClub, allClubs, season) {
  if (!myClub || !allClubs?.length) return [];
  const leagueClubs = allClubs.filter(c => c.league === myClub.league && c.name !== myClub.name);
  if (!leagueClubs.length) return [];

  const fixtures = [];
  let week = 1;

  leagueClubs.forEach(opp => {
    fixtures.push({
      id: `s${season}-w${week}-h`,
      week, day: week * 7 - 3,
      home: myClub.name, away: opp.name, isHome: true,
      competition: myClub.league, played: false,
      homeGoals: null, awayGoals: null,
    });
    week++;
    fixtures.push({
      id: `s${season}-w${week}-a`,
      week, day: week * 7 - 3,
      home: opp.name, away: myClub.name, isHome: false,
      competition: myClub.league, played: false,
      homeGoals: null, awayGoals: null,
    });
    week++;
  });

  const cupOpps = [...leagueClubs].sort(() => Math.random() - 0.5).slice(0, 4);
  const rounds = ['Round of 32', 'Quarter-Final', 'Semi-Final', 'Final'];
  cupOpps.forEach((opp, i) => {
    const isH = i % 2 === 0;
    fixtures.push({
      id: `s${season}-cup-${i}`,
      week, day: week * 7 - 1,
      home: isH ? myClub.name : opp.name,
      away: isH ? opp.name : myClub.name,
      isHome: isH,
      competition: 'Cup', cupRound: rounds[i],
      played: false, homeGoals: null, awayGoals: null,
    });
    week += 2;
  });

  return fixtures;
}

/* ═══════════════════════════════════════════════
   CALENDAR STRIP
   - Uses real calendar dates starting from Aug 1
   - Days of month shown, not absolute game day numbers
   - No "Day X" label — shows month name only
   - Only days with fixtures OR within ±21 days of
     current day are rendered (sparse approach)
═══════════════════════════════════════════════ */

const SEASON_START = { year: 2024, month: 7 }; // August (0-indexed)

function gameDay2Date(gameDay) {
  /* gameDay 1 = Aug 1. Returns { d, m, y } */
  const startMs = new Date(SEASON_START.year, SEASON_START.month, 1).getTime();
  const date    = new Date(startMs + (gameDay - 1) * 86400000);
  return { d: date.getDate(), m: date.getMonth(), y: date.getFullYear() };
}

function CalendarStrip({ fixtures, currentDay, onDayTap, playedIds }) {
  const stripRef  = useRef(null);
  const headerRef = useRef(null);

  /* Build day range: first fixture day - 7  to  last fixture day + 14, min 60 days */
  const { minDay, maxDay } = useMemo(() => {
    if (!fixtures.length) return { minDay: 1, maxDay: 60 };
    const days = fixtures.map(f => f.day);
    return {
      minDay: Math.max(1, Math.min(...days) - 7),
      maxDay: Math.max(...days) + 14,
    };
  }, [fixtures]);

  const fixByDay = useMemo(() => {
    const m = {};
    fixtures.forEach(f => { (m[f.day] = m[f.day] || []).push(f); });
    return m;
  }, [fixtures]);

  const days = useMemo(() => {
    const arr = [];
    for (let d = minDay; d <= maxDay; d++) {
      const { d: dom, m, y } = gameDay2Date(d);
      arr.push({
        gameDay: d,
        dom,
        monthName: MONTH_NAMES[m],
        year: y,
        dayName: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][(d - 1) % 7],
        fixtures: fixByDay[d] || [],
      });
    }
    return arr;
  }, [minDay, maxDay, fixByDay]);

  /* Month label for the header — based on currentDay */
  const currentDayInfo = gameDay2Date(currentDay);

  /* Auto-scroll so current day is centered */
  useEffect(() => {
    if (stripRef.current) {
      const CELL_W = 58;
      const idx = days.findIndex(d => d.gameDay === currentDay);
      if (idx >= 0) {
        const target = idx * CELL_W - stripRef.current.clientWidth / 2 + CELL_W / 2;
        stripRef.current.scrollLeft = Math.max(0, target);
      }
    }
  }, [currentDay, days]);

  return (
    <div
      ref={headerRef}
      style={{
        position: 'sticky', top: 0, zIndex: 15,
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Month label row — compact */}
      <div style={{
        padding: '5px 16px 2px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 8,
          color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase',
        }}>
          {currentDayInfo.monthName.toUpperCase()} {currentDayInfo.year}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', opacity: 0.4 }}>·</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', opacity: 0.5 }}>S1</span>
      </div>

      {/* Scrollable day strip */}
      <div
        ref={stripRef}
        style={{
          display: 'flex', overflowX: 'auto', scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 6,
        }}
      >
        {days.map(({ gameDay, dom, monthName, dayName, fixtures: dayFix }) => {
          const isCurrent = gameDay === currentDay;
          const isPast    = gameDay < currentDay;
          const hasFix    = dayFix.length > 0;
          const isPlayed  = hasFix && dayFix.every(f => playedIds.has(f.id));
          const firstFix  = dayFix[0];
          const comp      = firstFix ? getComp(firstFix.competition) : null;
          const oppName   = firstFix ? (firstFix.isHome ? firstFix.away : firstFix.home) : null;

          /* Hide past non-fixture days that are far behind current */
          if (isPast && !hasFix && (currentDay - gameDay) > 5) return null;

          return (
            <div
              key={gameDay}
              onClick={() => onDayTap(gameDay, firstFix || null)}
              style={{
                flexShrink: 0, width: 58,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 2, padding: '2px 0 4px',
                cursor: 'pointer',
                background: isCurrent ? 'rgba(0,232,122,0.06)' : 'transparent',
                borderBottom: isCurrent ? '2px solid var(--green)' : '2px solid transparent',
                opacity: isPast && !hasFix ? 0.25 : isPast && isPlayed ? 0.55 : 1,
                transition: 'background 0.15s',
              }}
            >
              {/* Day abbreviation */}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 7,
                letterSpacing: 1, textTransform: 'uppercase',
                color: isCurrent ? 'var(--green)' : 'var(--text-muted)',
              }}>{dayName}</span>

              {/* Day of month number */}
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 17,
                fontWeight: isCurrent ? 900 : 500, lineHeight: 1,
                color: isCurrent ? 'var(--green)' : isPast ? 'var(--text-muted)' : 'var(--text)',
              }}>{dom}</span>

              {/* Fixture indicator */}
              {hasFix ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: 1 }}>
                  {/* Competition colour bar */}
                  <div style={{
                    width: 22, height: 3, borderRadius: 2,
                    background: isPlayed ? '#333' : comp.accent,
                  }} />
                  {/* Opponent badge */}
                  <ClubBadge name={oppName} size={20} />
                </div>
              ) : (
                /* Spacer to keep rows aligned */
                <div style={{ height: 25 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PREVIEW TAB
═══════════════════════════════════════════════ */

function PreviewTab({ nextFixture, myClub, myRating, oppRating, onPlay, results }) {
  if (!nextFixture) {
    return (
      <div style={{
        padding: '80px 16px', textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase',
      }}>
        Season Complete
      </div>
    );
  }

  const comp    = getComp(nextFixture.competition);
  const myColor = CLUB_COLOR[myClub?.name] || '#00e87a';
  const myForm  = results.slice(-5).map(r =>
    r.myGoals > r.oppGoals ? 'W' : r.myGoals === r.oppGoals ? 'D' : 'L'
  );

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Competition label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: comp.accent }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: comp.accent, letterSpacing: 3, textTransform: 'uppercase' }}>
          {nextFixture.competition}{nextFixture.cupRound ? ` · ${nextFixture.cupRound}` : ''}
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2 }}>
          WK {nextFixture.week} · {nextFixture.isHome ? 'HOME' : 'AWAY'}
        </span>
      </div>

      {/* Matchup hero */}
      <div style={{
        background: `linear-gradient(140deg, ${comp.color}55 0%, var(--bg-3) 100%)`,
        border: `1px solid ${comp.accent}33`, borderRadius: 12,
        padding: '24px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {/* Home club */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ClubBadge name={nextFixture.home} size={54} />
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              color: 'var(--text)', textAlign: 'center', lineHeight: 1.3, letterSpacing: 0.3,
            }}>{nextFixture.home}</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, lineHeight: 1, color: nextFixture.isHome ? myColor : 'var(--text-muted)' }}>
              {nextFixture.isHome ? myRating : oppRating}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 2 }}>OVR</span>
          </div>

          {/* VS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: 'var(--text-muted)' }}>VS</span>
            <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
          </div>

          {/* Away club */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ClubBadge name={nextFixture.away} size={54} />
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              color: 'var(--text)', textAlign: 'center', lineHeight: 1.3, letterSpacing: 0.3,
            }}>{nextFixture.away}</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, lineHeight: 1, color: !nextFixture.isHome ? myColor : 'var(--text-muted)' }}>
              {!nextFixture.isHome ? myRating : oppRating}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 2 }}>OVR</span>
          </div>
        </div>
      </div>

      {/* Squad comparison */}
      <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>
          Squad Comparison
        </span>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['ATT', Math.round(myRating * 1.02), Math.round(oppRating * 0.98)],
            ['MID', Math.round(myRating * 0.99), Math.round(oppRating * 1.01)],
            ['DEF', Math.round(myRating * 0.97), Math.round(oppRating * 1.03)],
          ].map(([label, mv, ov]) => {
            const total = mv + ov || 1;
            const pct   = Math.round((mv / total) * 100);
            return (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: myColor }}>{mv}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, alignSelf: 'center' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>{ov}</span>
                </div>
                <div style={{ height: 3, background: 'var(--bg-5)', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${pct}%`, background: myColor }} />
                  <div style={{ flex: 1, background: '#333' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form + H2H */}
      <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Your Form
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {myForm.length
                ? myForm.map((r, i) => <FormDot key={i} result={r} />)
                : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>No matches yet</span>
              }
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8 }}>
              H2H
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
              No previous meetings
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button onClick={onPlay} style={{
        width: '100%', padding: 16, borderRadius: 10, border: 'none',
        background: `linear-gradient(135deg, ${comp.accent}, ${myColor})`,
        color: '#000', fontFamily: 'var(--font-display)', fontSize: 15,
        fontWeight: 900, letterSpacing: 2, cursor: 'pointer',
      }}>
        SET UP MATCH
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   RESULTS TAB
═══════════════════════════════════════════════ */

function ResultsTab({ results, fixtures }) {
  const [compFilter, setCompFilter] = useState('All');
  const [expanded, setExpanded]     = useState(null);

  const comps = useMemo(() => {
    const s = new Set(results.map(r => r.competition));
    return ['All', ...s];
  }, [results]);

  const filtered = compFilter === 'All' ? results : results.filter(r => r.competition === compFilter);

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 16px',
        scrollbarWidth: 'none', borderBottom: '1px solid var(--border)',
      }}>
        {comps.map(c => (
          <button key={c} onClick={() => setCompFilter(c)} style={{
            flexShrink: 0, padding: '5px 14px', borderRadius: 20,
            background: compFilter === c ? 'var(--green)' : 'var(--bg-3)',
            border: compFilter === c ? 'none' : '1px solid var(--border)',
            color: compFilter === c ? '#000' : 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1.5,
            textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{
          padding: '60px 16px', textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase',
        }}>
          No results yet
        </div>
      )}

      {[...filtered].reverse().map((r, i) => {
        const result = r.myGoals > r.oppGoals ? 'W' : r.myGoals === r.oppGoals ? 'D' : 'L';
        const rc     = result === 'W' ? '#00e87a' : result === 'D' ? '#f5c518' : '#ff3b5c';
        const comp   = getComp(r.competition);
        const isOpen = expanded === i;

        return (
          <div key={i} onClick={() => setExpanded(isOpen ? null : i)} style={{ cursor: 'pointer' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 16px', borderBottom: '1px solid var(--border)',
              borderLeft: `3px solid ${comp.accent}`,
              background: isOpen ? 'var(--bg-2)' : 'transparent',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 5, flexShrink: 0,
                background: `${rc}18`, border: `1px solid ${rc}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, color: rc,
              }}>{result}</div>

              <ClubBadge name={r.opponent} size={24} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                  color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  vs {r.opponent}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: comp.accent, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>
                  {r.competition} · W{r.week}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>{r.homeGoals}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>–</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>{r.awayGoals}</span>
              </div>
            </div>

            {isOpen && r.scorers?.length > 0 && (
              <div style={{
                padding: '10px 16px 14px', background: 'var(--bg-2)',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 7 }}>
                  Scorers
                </div>
                {r.scorers.map((s, j) => (
                  <div key={j} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-dim)', marginBottom: 3 }}>
                    {s.name} <span style={{ color: 'var(--text-muted)' }}>{s.min}'</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PRE-MATCH FLOW
═══════════════════════════════════════════════ */

function PreMatchFlow({ fixture, myClub, myRating, oppRating, squad, onKickOff, onBack }) {
  const [step, setStep]           = useState('conference');
  const [confSkipped, setConfSkipped] = useState(false);
  const [confQs]     = useState(() =>
    [...PRE_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 3).map(q => ({
      ...q, answers: [...q.answers].sort(() => Math.random() - 0.5),
    }))
  );
  const [confIdx, setConfIdx]     = useState(0);
  const [confResult, setConfResult] = useState(null);
  const [confDone, setConfDone]   = useState(false);
  const [confBonus, setConfBonus] = useState({ morale: 0, rating: 0 });
  const [formation, setFormation] = useState(FORMATIONS[0]);
  const [selectedTalk, setSelectedTalk] = useState(null);
  const [lineup, setLineup]       = useState([]);

  const comp     = getComp(fixture.competition);
  const myColor  = CLUB_COLOR[myClub?.name] || '#00e87a';
  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];

  useEffect(() => {
    if (squad?.length) setLineup([...squad].sort((a, b) => b.overall - a.overall).slice(0, 11));
  }, [squad]);

  const steps   = confSkipped ? ['team', 'talk'] : ['conference', 'team', 'talk'];
  const stepIdx = steps.indexOf(step);

  function handleAnswer(ans) {
    setConfResult({ good: ans.good });
    const eff = confQs[confIdx].effect;
    if (ans.good) {
      setConfBonus(b => ({ morale: b.morale + eff.morale, rating: b.rating + eff.rating }));
    } else {
      setConfBonus(b => ({ morale: b.morale - Math.floor(eff.morale / 2), rating: b.rating - 1 }));
    }
    setTimeout(() => {
      setConfResult(null);
      if (confIdx + 1 >= confQs.length) setConfDone(true);
      else setConfIdx(n => n + 1);
    }, 1300);
  }

  function handleKickOffFinal() {
    const talk = TEAM_TALKS.find(t => t.id === selectedTalk);
    onKickOff({ talkBonus: talk?.bonus || 0, tactic: talk?.tactic || 'balanced', confBonus, lineup, formation, talk });
  }

  const StepBar = () => (
    <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0' }}>
      {steps.map((s, i) => (
        <div key={s} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i <= stepIdx ? comp.accent : 'var(--bg-5)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );

  const NavRow = ({ title, onLeft, leftLabel = 'Back', onRight, rightLabel }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px 4px' }}>
      <button onClick={onLeft} style={{
        background: 'none', border: 'none', color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2,
        cursor: 'pointer', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {leftLabel}
      </button>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2 }}>
        {title}
      </span>
      {onRight
        ? <button onClick={onRight} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.5, cursor: 'pointer', textTransform: 'uppercase' }}>{rightLabel}</button>
        : <div style={{ width: 48 }} />
      }
    </div>
  );

  /* ── CONFERENCE ── */
  if (step === 'conference') {
    const q = confQs[confIdx];
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column' }}>
        <StepBar />
        <NavRow
          title="PRE-MATCH CONFERENCE"
          onLeft={onBack}
          onRight={() => { setConfSkipped(true); setStep('team'); }}
          rightLabel="Skip"
        />

        {confDone ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '0 32px', gap: 24,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              Conference Done
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              {[['Morale', confBonus.morale], ['Manager Rtg', confBonus.rating]].map(([lbl, val]) => (
                <div key={lbl} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900,
                    color: val >= 0 ? 'var(--green)' : '#ff3b5c',
                  }}>
                    {val >= 0 ? '+' : ''}{val}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
                    {lbl}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep('team')} style={{
              padding: '14px 48px', borderRadius: 8,
              background: comp.accent, border: 'none', color: '#000',
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, letterSpacing: 2, cursor: 'pointer',
            }}>SELECT TEAM</button>
          </div>
        ) : (
          <div style={{ flex: 1, padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: 'var(--bg-4)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
              <div style={{
                background: 'var(--bg-3)', border: '1px solid var(--border)',
                borderRadius: '0 10px 10px 10px', padding: '14px 16px', flex: 1,
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                  Question {confIdx + 1} of {confQs.length}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>
                  {q.q}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.answers.map((ans, i) => (
                <button key={i}
                  onClick={() => { if (!confResult) handleAnswer(ans); }}
                  style={{
                    padding: '13px 15px', borderRadius: 9, textAlign: 'left',
                    cursor: confResult ? 'default' : 'pointer',
                    background: 'var(--bg-3)', border: '1px solid var(--border)',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', lineHeight: 1.45 }}>
                    {ans.text}
                  </span>
                </button>
              ))}
            </div>

            {confResult && (
              <div style={{
                padding: '11px 16px', borderRadius: 8, textAlign: 'center',
                background: confResult.good ? 'rgba(0,232,122,0.09)' : 'rgba(255,59,92,0.09)',
                border: `1px solid ${confResult.good ? 'rgba(0,232,122,0.3)' : 'rgba(255,59,92,0.3)'}`,
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                color: confResult.good ? 'var(--green)' : '#ff3b5c',
              }}>
                {confResult.good
                  ? `Strong response · Morale +${confQs[confIdx].effect.morale}`
                  : `Awkward silence · Morale -${Math.floor(confQs[confIdx].effect.morale / 2)}`
                }
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── TEAM SELECTION ── */
  if (step === 'team') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column' }}>
        <StepBar />
        <NavRow title="TEAM SELECTION" onLeft={() => setStep('conference')} />

        <div style={{ overflowX: 'auto', scrollbarWidth: 'none', padding: '10px 16px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {FORMATIONS.map(f => (
              <button key={f} onClick={() => setFormation(f)} style={{
                flexShrink: 0, padding: '5px 14px', borderRadius: 20,
                background: formation === f ? comp.accent : 'var(--bg-3)',
                border: formation === f ? 'none' : '1px solid var(--border)',
                color: formation === f ? '#000' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: 1,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{f}</button>
            ))}
          </div>
        </div>

        <div style={{ margin: '0 16px', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', display: 'block' }}>
            <defs>
              <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0a2e0a" />
                <stop offset="100%" stopColor="#0d3d0d" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#grass)" />
            <rect x="5" y="5" width="90" height="90" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
            <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
            <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.25)" />
            <rect x="30" y="5" width="40" height="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
            <rect x="30" y="81" width="40" height="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />

            {positions.map((p, i) => {
              const player = lineup[i];
              return (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="5.2" fill={myColor} opacity="0.88" />
                  <circle cx={p.x} cy={p.y} r="5.2" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
                  <text x={p.x} y={p.y + 0.9} textAnchor="middle" dominantBaseline="middle" fontSize="2.7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">
                    {player ? player.name.split(' ').pop().slice(0, 4) : p.pos}
                  </text>
                  <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize="2.1" fill="rgba(255,255,255,0.45)" fontFamily="sans-serif">
                    {p.pos}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ padding: '14px 16px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
            Starting XI
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {positions.map((p, i) => {
              const player = lineup[i];
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 12px', background: 'var(--bg-3)',
                  borderRadius: 7, border: '1px solid var(--border)',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: comp.accent, width: 34, letterSpacing: 1 }}>{p.pos}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text)', flex: 1 }}>{player?.name || '—'}</span>
                  {player && <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{player.overall}</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '0 16px 20px' }}>
          <button onClick={() => setStep('talk')} style={{
            width: '100%', padding: 15, borderRadius: 9,
            background: comp.accent, border: 'none', color: '#000',
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800,
            letterSpacing: 2, cursor: 'pointer',
          }}>TEAM TALK</button>
        </div>
      </div>
    );
  }

  /* ── TEAM TALK ── */
  if (step === 'talk') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column' }}>
        <StepBar />
        <NavRow title="TEAM TALK" onLeft={() => setStep('team')} />

        <div style={{ padding: '20px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 6px' }}>
            The dressing room falls silent. Every player looks to you. What do you say?
          </p>

          {TEAM_TALKS.map(t => {
            const sel = selectedTalk === t.id;
            return (
              <button key={t.id} onClick={() => setSelectedTalk(t.id)} style={{
                padding: '15px 16px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                background: sel ? `${t.color}14` : 'var(--bg-3)',
                border: sel ? `1px solid ${t.color}55` : '1px solid var(--border)',
                borderLeft: sel ? `3px solid ${t.color}` : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: sel ? t.color : 'var(--text)', letterSpacing: 0.3, flex: 1 }}>
                    {t.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: t.color, letterSpacing: 1.5, textTransform: 'uppercase', flexShrink: 0, marginLeft: 8, marginTop: 2 }}>
                    {t.tone}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  {t.quote}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '0 16px 24px' }}>
          <button
            onClick={handleKickOffFinal}
            disabled={!selectedTalk}
            style={{
              width: '100%', padding: 16, borderRadius: 9, border: 'none',
              background: selectedTalk ? `linear-gradient(135deg, ${comp.accent}, ${myColor})` : 'var(--bg-4)',
              color: selectedTalk ? '#000' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 900,
              letterSpacing: 2, cursor: selectedTalk ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            KICK OFF
          </button>
        </div>
      </div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════
   MAIN MATCHDAY COMPONENT
═══════════════════════════════════════════════ */

export default function Matchday() {
  const store = useGameStore();
  const {
    squad, myClub, allClubs, season = 1, week = 1,
    fixtures: storeFixtures = [], results = [],
    recordMatchResult, trainDay,
  } = store;
  const navigate = useNavigate();

  const [tab, setTab]                     = useState('preview');
  const [screen, setScreen]               = useState('calendar');
  const [activeFixture, setActiveFixture] = useState(null);
  const [confDone, setConfDone]           = useState(false);
  const [confBonus, setConfBonus]         = useState({ morale: 0, managerRating: 0 });

  /* Match state */
  const [matchResult, setMatchResult]   = useState(null);
  const [simEvents, setSimEvents]       = useState([]);
  const [simMinute, setSimMinute]       = useState(0);
  /* ─── FIX: score is derived only from streamed events, not from matchResult directly ─── */
  const [simMyGoals, setSimMyGoals]     = useState(0);
  const [simOppGoals, setSimOppGoals]   = useState(0);
  const [simFinished, setSimFinished]   = useState(false);
  const [simSpeed, setSimSpeed]         = useState(1);
  const [matchLineup, setMatchLineup]   = useState([]);

  const simRef    = useRef(null);
  const speedRef  = useRef(1);
  const evtIdxRef = useRef(0);

  /* ─── Fixtures come from the store (single source of truth) ───
     augment with isHome for backward compatibility with the rest
     of this component, which expects fixture.isHome everywhere. ─── */
  const fixtures = useMemo(() => {
    if (!myClub) return [];
    return storeFixtures.map(f => ({ ...f, isHome: f.home === myClub.name, day: f.week }));
  }, [storeFixtures, myClub]);

  const myRating    = useMemo(() => getTeamRating(squad), [squad]);
  const upcomingFix = useMemo(() => fixtures.filter(f => !f.played), [fixtures]);
  /* Matchday = there's an unplayed fixture scheduled for the current week */
  const nextFixture = useMemo(
    () => upcomingFix.find(f => f.week === week) || upcomingFix[0] || null,
    [upcomingFix, week]
  );
  const isMatchday  = !!(nextFixture && nextFixture.week === week);

  /* Squad sorted GK→DEF→MID→ATT, used by the training screen.
     Moved here (before any early returns) to satisfy React's
     rules of hooks — useMemo must run on every render. */
  const POS_ORDER = { GK:0, CB:1, RB:1, LB:1, RWB:1, LWB:1, CDM:2, CM:2, CAM:3, RM:3, LM:3, RW:4, LW:4, ST:5, CF:5 };
  const firstTeamSquad = useMemo(() => {
    if (!squad?.length) return [];
    return [...squad].sort((a,b) => {
      const pa = POS_ORDER[a.position] ?? 9;
      const pb = POS_ORDER[b.position] ?? 9;
      if (pa !== pb) return pa - pb;
      return (b.overall || 0) - (a.overall || 0);
    });
  }, [squad]);

  function getOppRating(fixture) {
    if (!fixture) return 72;
    const oppName = fixture.isHome ? fixture.away : fixture.home;
    const oppClub = allClubs?.find(c => c.name === oppName);
    return oppClub
      ? Math.round(Math.min(90, Math.max(60, 70 + (oppClub.budget || 0) / 20_000_000)))
      : 72;
  }

  /* ─── On matchday, show the press conference first (once per fixture) ─── */
  useEffect(() => {
    if (isMatchday && nextFixture && !confDone && screen === 'calendar') {
      setActiveFixture(nextFixture);
      setScreen('prematch');
    }
  }, [isMatchday, nextFixture?.id, confDone, screen]);

  function handleDayTap(day, fixture) {
    if (fixture && !fixture.played) {
      setActiveFixture(fixture);
      setScreen('prematch');
    }
  }

  function handlePlayFromPreview() {
    if (nextFixture) {
      setActiveFixture(nextFixture);
      handleKickOff();
    }
  }

  /* ── Kick off — conference already happened in the prematch step;
       team selection/talk steps were removed, so we run with the full
       squad and default tactics, applying the conference's confBonus ── */
  function handleKickOff() {
    setMatchLineup(squad || []);

    const oppName   = activeFixture.isHome ? activeFixture.away : activeFixture.home;
    const oppClub   = allClubs?.find(c => c.name === oppName);
    const oppBudget = oppClub?.budget || 0;

    const result = runMatch({
      mySquad:      squad,
      oppClubName:  oppName,
      oppClubBudget: oppBudget,
      isHome:       activeFixture.isHome,
      tactics:      'balanced',
      teamTalkId:   'simple',
      confBonus:    confBonus?.morale || 0,
      moraleMap:    {},
    });

    setMatchResult(result);
    setSimEvents([]);
    setSimMinute(0);
    /* ─── Reset live score counters to 0 — they build up as events stream ─── */
    setSimMyGoals(0);
    setSimOppGoals(0);
    setSimFinished(false);
    setSimSpeed(1);
    speedRef.current = 1;
    evtIdxRef.current = 0;
    setScreen('livesim');

    function startTick() {
      clearInterval(simRef.current);
      simRef.current = setInterval(() => {
        const idx = evtIdxRef.current;
        if (idx >= result.events.length) {
          clearInterval(simRef.current);
          setSimFinished(true);
          return;
        }
        const ev = result.events[idx];

        /* Strip any numeric prefix from commentary text before appending */
        const cleanEv = {
          ...ev,
          text: (ev.text || '').replace(/^\d+'\s*/, '').replace(/^\d+\s+/, ''),
        };

        setSimEvents(prev => [...prev, cleanEv]);
        setSimMinute(ev.min);

        /* Update live score ONLY when a goal event is streamed */
        if (ev.type === 'goal' && ev.side === 'my')  setSimMyGoals(g => g + 1);
        if (ev.type === 'goal' && ev.side === 'opp') setSimOppGoals(g => g + 1);
        if (ev.type === 'goalOpp')                   setSimOppGoals(g => g + 1);

        evtIdxRef.current = idx + 1;
      }, Math.round(750 / speedRef.current));
    }

    startTick();
  }

  function handleSpeedChange(s) {
    setSimSpeed(s);
    speedRef.current = s;
    clearInterval(simRef.current);
    simRef.current = setInterval(() => {
      const idx = evtIdxRef.current;
      if (!matchResult || idx >= matchResult.events.length) {
        clearInterval(simRef.current);
        setSimFinished(true);
        return;
      }
      const ev = matchResult.events[idx];
      const cleanEv = {
        ...ev,
        text: (ev.text || '').replace(/^\d+'\s*/, '').replace(/^\d+\s+/, ''),
      };
      setSimEvents(prev => [...prev, cleanEv]);
      setSimMinute(ev.min);
      if (ev.type === 'goal' && ev.side === 'my')  setSimMyGoals(g => g + 1);
      if (ev.type === 'goal' && ev.side === 'opp') setSimOppGoals(g => g + 1);
      if (ev.type === 'goalOpp')                   setSimOppGoals(g => g + 1);
      evtIdxRef.current = idx + 1;
    }, Math.round(750 / s));
  }

  /* ── Skip to result ── */
  function handleFinish() {
    clearInterval(simRef.current);
    if (matchResult) {
      /* Show all events at once, cleaned */
      const cleaned = matchResult.events.map(ev => ({
        ...ev,
        text: (ev.text || '').replace(/^\d+'\s*/, '').replace(/^\d+\s+/, ''),
      }));
      setSimEvents(cleaned);
      /* Set final scores from the engine result */
      setSimMyGoals(matchResult.myGoals);
      setSimOppGoals(matchResult.oppGoals);
    }
    setSimFinished(true);
    setScreen('postmatch');
  }

  function handleContinue() {
    if (!activeFixture || !matchResult) return;

    const homeGoals = activeFixture.isHome ? matchResult.myGoals : matchResult.oppGoals;
    const awayGoals = activeFixture.isHome ? matchResult.oppGoals : matchResult.myGoals;

    /* Single source of truth: store records the score matchEngine already
       computed — updates fixtures, leagueTable, results, week, managerRating */
    recordMatchResult(activeFixture.id, { homeGoals, awayGoals });

    /* Go back to dashboard — it will show the next state */
    navigate('/home');
  }

  useEffect(() => () => clearInterval(simRef.current), []);

  /* ── PRE-MATCH: Press Conference only ── */
  if (screen === 'prematch' && activeFixture) {
    return (
      <PreMatch
        fixture={activeFixture}
        onComplete={({ confBonus: bonus }) => {
          setConfBonus(bonus || { morale: 0, managerRating: 0 });
          setConfDone(true);
          setScreen('calendar');
        }}
        onCancel={() => { setConfDone(true); setScreen('calendar'); }}
      />
    );
  }

  /* ── LIVE SIM ── */
  if (screen === 'livesim' && activeFixture) {
    return (
      <LiveSim
        fixture={activeFixture}
        myClubName={myClub?.name}
        myGoals={simMyGoals}
        oppGoals={simOppGoals}
        events={simEvents}
        minute={simMinute}
        isFinished={simFinished}
        squad={squad}
        lineup={matchLineup}
        speed={simSpeed}
        onSpeedChange={handleSpeedChange}
        onFinish={handleFinish}
        onSub={() => {}}
      />
    );
  }

  /* ── POST-MATCH ── */
  if (screen === 'postmatch' && activeFixture && matchResult) {
    return (
      <PostMatch
        fixture={activeFixture}
        myClubName={myClub?.name}
        myGoals={matchResult.myGoals}
        oppGoals={matchResult.oppGoals}
        squad={squad}
        events={simEvents}
        myXg={matchResult.myXg}
        oppXg={matchResult.oppXg}
        lineup={matchLineup}
        onContinue={handleContinue}
      />
    );
  }


  /* ══════════════════════════════════════
     HUB SHARED DERIVED STATE
  ══════════════════════════════════════ */

  const oppName      = nextFixture ? (nextFixture.isHome ? nextFixture.away : nextFixture.home) : null;
  const oppRatingVal = getOppRating(nextFixture);
  const myColor      = CLUB_COLOR[myClub?.name] || '#00e87a';
  const comp         = nextFixture ? getComp(nextFixture.competition) : { color:'#1a1a1a', accent:'#00e87a', label:'?' };
  const recentResults = results.slice(-5).reverse();
  const myForm        = recentResults.map(r => r.myGoals > r.oppGoals ? 'W' : r.myGoals === r.oppGoals ? 'D' : 'L');

  const fontStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700;1,900&family=Share+Tech+Mono&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    :root {
      --bg-1:#04060a; --bg-2:#070a0f; --bg-3:#0c1018; --bg-4:#111620; --bg-5:#181e2a;
      --border:rgba(255,255,255,0.07); --text:#f0f2f5; --text-dim:#9aa3b2; --text-muted:#556070;
      --green:#00e87a; --yellow:#f5c518; --red:#ff3b5c;
      --font-display:'Barlow Condensed',sans-serif;
      --font-mono:'Share Tech Mono',monospace;
    }
    html,body,#root { width:100%;height:100%;overflow:hidden;background:#04060a; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
    @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.45} }
    @keyframes shine  { 0%{background-position:200% center} 100%{background-position:-200% center} }
    ::-webkit-scrollbar { width:3px; }
    ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
  `;

  const WRAP = { position:'fixed', inset:0, zIndex:9999, fontFamily:"'Barlow Condensed',sans-serif" };
  const BG   = (url) => ({ position:'absolute', inset:0, backgroundImage:`url('${url}')`, backgroundSize:'cover', backgroundPosition:'center' });
  const OVL  = (bg)  => ({ position:'absolute', inset:0, background: bg });
  const CON  = { position:'relative', zIndex:1, width:'100%', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' };

  /* ══════════════════════════════════════
     MATCHDAY SCREEN
  ══════════════════════════════════════ */
  if (isMatchday && nextFixture) {

    const LEAGUE_OVERLAY = {
      'Premier League': 'linear-gradient(160deg, rgba(61,0,100,0.86) 0%, rgba(4,6,10,0.92) 55%)',
      'La Liga':        'linear-gradient(160deg, rgba(194,65,12,0.86) 0%, rgba(4,6,10,0.92) 55%)',
      'Bundesliga':     'linear-gradient(160deg, rgba(210,5,21,0.84) 0%, rgba(4,6,10,0.92) 55%)',
      'Serie A':        'linear-gradient(160deg, rgba(26,26,107,0.86) 0%, rgba(4,6,10,0.92) 55%)',
      'Ligue 1':        'linear-gradient(160deg, rgba(0,31,95,0.86)  0%, rgba(4,6,10,0.92) 55%)',
    };
    const leagueOverlay = LEAGUE_OVERLAY[nextFixture.competition] || 'rgba(4,6,10,0.86)';

    return (
      <div style={WRAP}>
        <style>{fontStyle}</style>
        <div style={BG('https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=80')} />
        <div style={OVL(leagueOverlay)} />

        <div style={CON}>

          {/* ── watermark + competition pill ── */}
          <div style={{ textAlign:'center', paddingTop:32, position:'relative', animation:'fadeUp 0.4s ease both' }}>
            <div style={{
              fontFamily:"'Barlow Condensed',sans-serif", fontSize:88, fontWeight:900,
              letterSpacing:10, color:'rgba(255,255,255,0.04)', textTransform:'uppercase',
              lineHeight:1, pointerEvents:'none', userSelect:'none',
              position:'absolute', width:'100%', top:10, left:0,
            }}>Matchday</div>
            <div style={{ position:'relative', zIndex:1, display:'inline-flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <span style={{
                fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:5,
                textTransform:'uppercase', color:comp.accent,
              }}>
                {nextFixture.competition}{nextFixture.cupRound ? ` · ${nextFixture.cupRound}` : ''}
              </span>
            </div>
          </div>

          {/* ── Clubs + H2H ── */}
          <div style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center',
            padding:'0 60px', gap:48,
            animation:'fadeUp 0.45s 0.08s ease both',
          }}>

            {/* My club */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              {/* You indicator */}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                <svg width="10" height="8" viewBox="0 0 10 8">
                  <polygon points="5,0 10,8 0,8" fill={myColor} />
                </svg>
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, letterSpacing:3, color:myColor, textTransform:'uppercase' }}>You</span>
              </div>
              <ClubBadge name={myClub?.name} size={108} />
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:900, letterSpacing:1, color:'#fff', textTransform:'uppercase', lineHeight:1 }}>
                  {myClub?.name}
                </div>
                <div style={{
                  fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, fontWeight:900,
                  letterSpacing:6, color:'rgba(255,255,255,0.06)', textTransform:'uppercase',
                  lineHeight:1, marginTop:2,
                }}>
                  {nextFixture.isHome ? 'Home' : 'Away'}
                </div>
              </div>
              {myForm.length > 0 && (
                <div style={{ display:'flex', gap:5 }}>
                  {myForm.slice(0,5).map((r,i)=>{
                    const c = r==='W'?'#00e87a':r==='D'?'#f5c518':'#ff3b5c';
                    return <div key={i} style={{ width:24,height:24,background:`${c}14`,border:`1px solid ${c}44`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:900,color:c }}>{r}</div>;
                  })}
                </div>
              )}
            </div>

            {/* Centre — VS on top, then H2H stats, then button */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, minWidth:210 }}>
              <span style={{
                fontFamily:"'Barlow Condensed',sans-serif", fontSize:52, fontWeight:900,
                color:'rgba(255,255,255,0.1)', letterSpacing:10, lineHeight:1,
              }}>VS</span>

              {/* H2H stat bars */}
              <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:12 }}>
                {[['ATT', myRating+2, oppRatingVal-2], ['MID', myRating, oppRatingVal], ['DEF', myRating-2, oppRatingVal+2]].map(([lbl,mv,ov])=>{
                  const pct = Math.round(((mv)/(mv+ov||1))*100);
                  return (
                    <div key={lbl}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900, color:myColor }}>{mv}</span>
                        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:'rgba(255,255,255,0.28)', letterSpacing:3, alignSelf:'center' }}>{lbl}</span>
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900, color:'rgba(255,255,255,0.38)' }}>{ov}</span>
                      </div>
                      <div style={{ height:4, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background:myColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Start Match button */}
              <button
                onClick={handlePlayFromPreview}
                style={{
                  width:'100%', padding:'15px 0', border:'none', cursor:'pointer',
                  background:`linear-gradient(90deg, ${comp.accent} 0%, ${myColor} 50%, ${comp.accent} 100%)`,
                  backgroundSize:'200% auto',
                  animation:'shine 3s linear infinite',
                  color:'#000', fontFamily:"'Barlow Condensed',sans-serif",
                  fontSize:15, fontWeight:900, letterSpacing:4, textTransform:'uppercase',
                  borderRadius:4,
                  boxShadow:`0 2px 20px ${comp.accent}40`,
                }}
              >
                ▶ Start Match
              </button>
            </div>

            {/* Opponent */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ height:22 }} />
              <ClubBadge name={oppName} size={108} />
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:900, letterSpacing:1, color:'#fff', textTransform:'uppercase', lineHeight:1 }}>
                  {oppName}
                </div>
                <div style={{
                  fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, fontWeight:900,
                  letterSpacing:6, color:'rgba(255,255,255,0.06)', textTransform:'uppercase',
                  lineHeight:1, marginTop:2,
                }}>
                  {nextFixture.isHome ? 'Away' : 'Home'}
                </div>
              </div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'rgba(255,255,255,0.28)', letterSpacing:2 }}>
                OVR {oppRatingVal}
              </div>
            </div>
          </div>

          {/* Bottom form strip */}
          {recentResults.length > 0 && (
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'12px 60px', display:'flex', gap:8, alignItems:'center', animation:'fadeUp 0.5s 0.15s ease both' }}>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.18)', letterSpacing:2, textTransform:'uppercase', marginRight:8 }}>Last {recentResults.length}</span>
              {myForm.slice(0,5).map((r,i)=>{
                const c = r==='W'?'#00e87a':r==='D'?'#f5c518':'#ff3b5c';
                return <div key={i} style={{ padding:'3px 12px', border:`1px solid ${c}2a`, background:`${c}0a`, fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:900, color:c, display:'flex', alignItems:'center', gap:6 }}>
                  <span>{r}</span><span style={{ color:'rgba(255,255,255,0.35)', fontSize:10 }}>{recentResults[i]?.myGoals}–{recentResults[i]?.oppGoals}</span>
                </div>;
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     TRAINING DAY SCREEN
  ══════════════════════════════════════ */
  const DRILLS = [
    { id:'tactical',  label:'Tactical',   desc:'Pressing & shape work',       time:'25 min',
      bg:'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80' },
    { id:'finishing', label:'Finishing',  desc:'Shooting & movement drills',  time:'20 min',
      bg:'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1200&q=80' },
    { id:'setpieces', label:'Set Pieces', desc:'Dead ball routines & corners', time:'15 min',
      bg:'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80' },
    { id:'physical',  label:'Physical',   desc:'Sprint intervals & agility',  time:'15 min',
      bg:'https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=1200&q=80' },
  ];

  return (
    <TrainingScreen
      squad={firstTeamSquad}
      myClub={myClub}
      DRILLS={DRILLS}
      onDone={() => { trainDay(); navigate('/home'); }}
    />
  );
}

/* ══════════════════════════════════════
   TRAINING SCREEN COMPONENT
══════════════════════════════════════ */
const POS_COLOR = {
  GK:'#f5c518', CB:'#6CABDD', RB:'#6CABDD', LB:'#6CABDD', RWB:'#6CABDD', LWB:'#6CABDD',
  CDM:'#a78bfa', CM:'#a78bfa', CAM:'#a78bfa', RM:'#a78bfa', LM:'#a78bfa',
  RW:'#00e87a', LW:'#00e87a', ST:'#ff6b6b', CF:'#ff6b6b',
};

const GRADES = [
  { grade:'S', color:'#ffd700', label:'Outstanding', prob:0.10 },
  { grade:'A', color:'#00e87a', label:'Excellent',   prob:0.25 },
  { grade:'B', color:'#6CABDD', label:'Good',        prob:0.38 },
  { grade:'C', color:'#f5c518', label:'Average',     prob:0.20 },
  { grade:'D', color:'#ff6b6b', label:'Poor',        prob:0.07 },
];

function rollGrade() {
  const r = Math.random(); let acc = 0;
  for (const g of GRADES) { acc += g.prob; if (r < acc) return g; }
  return GRADES[GRADES.length - 1];
}

function TrainingScreen({ squad, myClub, DRILLS, onDone }) {

  const safeSquad = squad || [];

  /* ── Position groups ── */
  const isDef = (pos) => ['GK','CB','RB','LB','RWB','LWB'].includes(pos);
  const isMid = (pos) => ['CDM','CM','CAM','RM','LM'].includes(pos);
  const isAtt = (pos) => ['RW','LW','ST','CF'].includes(pos);

  const defenders  = safeSquad.filter(p => isDef(p.position));
  const midfielders= safeSquad.filter(p => isMid(p.position));
  const attackers  = safeSquad.filter(p => isAtt(p.position));

  /* ── Drill pools — 5 per group, one picked at random per session ── */
  const DRILL_POOL = {
    defenders: [
      { label:'Inside The Zone Defending', category:'Defending', intensity:'Heavy' },
      { label:'Last Man Standing',         category:'Defending', intensity:'Medium' },
      { label:'Aerial Dominance',          category:'Defending', intensity:'Heavy' },
      { label:'Defending Scenarios',       category:'Defending', intensity:'Heavy' },
      { label:'Recovery Runs',             category:'Defending', intensity:'Light' },
    ],
    midfielders: [
      { label:'Extreme Hot Potato',        category:'Passing', intensity:'Heavy' },
      { label:'Tiki-Taka Triangles',       category:'Passing', intensity:'Medium' },
      { label:'Press Resistance',          category:'Passing', intensity:'Heavy' },
      { label:'Switch Of Play Mastery',    category:'Passing', intensity:'Medium' },
      { label:'Box-To-Box Conditioning',   category:'Physical', intensity:'Heavy' },
    ],
    attackers: [
      { label:'Inside The Zone Dribbling', category:'Dribbling', intensity:'Heavy' },
      { label:'Clinical Finishing',        category:'Shooting', intensity:'Medium' },
      { label:'1v1 Isolation',             category:'Dribbling', intensity:'Heavy' },
      { label:'Movement In The Box',       category:'Shooting', intensity:'Light' },
      { label:'Counter Attack Speed',      category:'Dribbling', intensity:'Medium' },
    ],
  };

  /* Pick one random drill per group, stable for the session */
  const [sessionDrills] = useState(() => ({
    defenders:   DRILL_POOL.defenders[Math.floor(Math.random() * DRILL_POOL.defenders.length)],
    midfielders: DRILL_POOL.midfielders[Math.floor(Math.random() * DRILL_POOL.midfielders.length)],
    attackers:   DRILL_POOL.attackers[Math.floor(Math.random() * DRILL_POOL.attackers.length)],
  }));

  const DRILL_COLUMNS = [
    { id:'col-def', ...sessionDrills.defenders,   players: defenders   },
    { id:'col-mid', ...sessionDrills.midfielders, players: midfielders },
    { id:'col-att', ...sessionDrills.attackers,   players: attackers   },
  ].filter(col => col.players.length > 0);

  const [completedDrills, setCompletedDrills] = useState({});
  const [activeDrillId,   setActiveDrillId]    = useState(null);
  const [showSummary,     setShowSummary]      = useState(false);

  const allDone   = DRILL_COLUMNS.every(c => completedDrills[c.id]);
  const nextDrill = DRILL_COLUMNS.find(c => !completedDrills[c.id]);

  const GRADE_ROWS = [
    { grade:'A', color:'#00e87a', pts:25, xp:500 },
    { grade:'B', color:'#6CABDD', pts:20, xp:400 },
    { grade:'C', color:'#f5c518', pts:10, xp:350 },
    { grade:'D', color:'#f97316', pts:5,  xp:200 },
    { grade:'F', color:'#ff3b5c', pts:1,  xp:50  },
  ];
  const PROBS = [0.15, 0.35, 0.30, 0.15, 0.05];

  function rollGrade() {
    const r = Math.random(); let acc = 0;
    for (let i = 0; i < GRADE_ROWS.length; i++) { acc += PROBS[i]; if (r < acc) return GRADE_ROWS[i]; }
    return GRADE_ROWS[GRADE_ROWS.length - 1];
  }

  function playNextDrill() {
    if (!nextDrill) return;
    setActiveDrillId(nextDrill.id);
    setTimeout(() => {
      setCompletedDrills(prev => ({ ...prev, [nextDrill.id]: rollGrade() }));
      setActiveDrillId(null);
    }, 1400);
  }

  function simulateAll() {
    const newC = { ...completedDrills };
    DRILL_COLUMNS.forEach(c => { if (!newC[c.id]) newC[c.id] = rollGrade(); });
    setCompletedDrills(newC);
  }

  function playerFitness(p)   { return 70 + ((p.overall || 70) % 30); }
  function playerSharpness(p) { return 40 + ((p.overall || 70) % 60); }

  const POS_C = {
    GK:'#f5c518', CB:'#6CABDD', RB:'#6CABDD', LB:'#6CABDD', RWB:'#6CABDD', LWB:'#6CABDD',
    CDM:'#a78bfa', CM:'#a78bfa', CAM:'#a78bfa', RM:'#a78bfa', LM:'#a78bfa',
    RW:'#00e87a', LW:'#00e87a', ST:'#ff6b6b', CF:'#ff6b6b',
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Share+Tech+Mono&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    html,body,#root { width:100%;height:100%;overflow:hidden;background:#04060a; }
    @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
    @keyframes gradeIn { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
    @keyframes spin    { to{transform:rotate(360deg)} }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
    .drill-row:hover { background:rgba(255,255,255,0.03) !important; }
    .footer-btn { transition:filter 0.15s, transform 0.1s; }
    .footer-btn:hover { filter:brightness(1.12); }
    .footer-btn:active { transform:scale(0.99); }
  `;

  /* ── SUMMARY ── */
  if (showSummary) {
    const entries   = Object.entries(completedDrills);
    const avgPts    = entries.reduce((a,[,g])=>a+(g?.pts||0),0)/(entries.length||1);
    const sessGrade = avgPts>=22?GRADE_ROWS[0]:avgPts>=16?GRADE_ROWS[1]:avgPts>=10?GRADE_ROWS[2]:avgPts>=4?GRADE_ROWS[3]:GRADE_ROWS[4];
    return (
      <div style={{ position:'fixed',inset:0,zIndex:9999,fontFamily:"'Barlow Condensed',sans-serif" }}>
        <style>{css}</style>
        <div style={{ position:'absolute',inset:0,backgroundImage:"url('https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1920&q=80')",backgroundSize:'cover',backgroundPosition:'center' }}/>
        <div style={{ position:'absolute',inset:0,background:'rgba(4,6,10,0.88)' }}/>
        <div style={{ position:'relative',zIndex:1,width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:28,animation:'fadeUp 0.4s ease both' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'#00e87a',letterSpacing:5,textTransform:'uppercase',marginBottom:6 }}>Session Complete</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:48,fontWeight:900,color:'#fff',letterSpacing:2 }}>{myClub?.name||'Training'}</div>
          </div>
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8 }}>
            <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'rgba(255,255,255,0.3)',letterSpacing:3,textTransform:'uppercase' }}>Overall</div>
            <div style={{ width:96,height:96,borderRadius:4,border:`3px solid ${sessGrade.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Barlow Condensed',sans-serif",fontSize:60,fontWeight:900,color:sessGrade.color,boxShadow:`0 0 40px ${sessGrade.color}44`,animation:'gradeIn 0.5s ease both' }}>{sessGrade.grade}</div>
          </div>
          <div style={{ display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center' }}>
            {DRILL_COLUMNS.map(col => {
              const g = completedDrills[col.id];
              if (!g) return null;
              return (
                <div key={col.id} style={{ padding:'14px 20px',borderRadius:4,background:`${g.color}0c`,border:`1px solid ${g.color}2a`,display:'flex',flexDirection:'column',alignItems:'center',gap:6,minWidth:140 }}>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:7,color:'rgba(255,255,255,0.3)',letterSpacing:2,textTransform:'uppercase',textAlign:'center' }}>{col.label}</div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:48,fontWeight:900,color:g.color,lineHeight:1 }}>{g.grade}</div>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:7,color:g.color,letterSpacing:1 }}>{g.pts} pts · {g.xp} xp</div>
                </div>
              );
            })}
          </div>
          <button onClick={onDone} style={{ padding:'14px 48px',borderRadius:4,border:'none',cursor:'pointer',background:'#00e87a',fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:900,letterSpacing:4,textTransform:'uppercase',color:'#000' }}>
            Back to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  /* ── MAIN ── */
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, fontFamily:"'Barlow Condensed',sans-serif" }}>
      <style>{css}</style>

      {/* Full-bleed bg */}
      <div style={{ position:'absolute',inset:0,backgroundImage:"url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80')",backgroundSize:'cover',backgroundPosition:'center' }}/>
      <div style={{ position:'absolute',inset:0,background:'rgba(4,6,10,0.82)' }}/>

      <div style={{ position:'relative', zIndex:1, width:'100%', height:'100%', display:'flex', flexDirection:'column', padding:'28px 32px 20px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom:18, flexShrink:0, animation:'fadeUp 0.3s ease both' }}>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'#00e87a', letterSpacing:4, textTransform:'uppercase', marginBottom:5 }}>{myClub?.name}</div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, fontWeight:900, color:'#fff', letterSpacing:1, lineHeight:1 }}>Training Day</div>
        </div>

        {/* ── Drill columns ── */}
        <div style={{ flex:1, display:'flex', gap:14, minHeight:0, animation:'fadeUp 0.35s 0.05s ease both' }}>
          {DRILL_COLUMNS.map(col => {
            const grade  = completedDrills[col.id];
            const isBusy = activeDrillId === col.id;
            return (
              <div key={col.id} style={{
                flex:1, display:'flex', flexDirection:'column', minWidth:0, position:'relative',
                borderRadius:4,
                background: 'rgba(7,10,15,0.82)',
                border: `1px solid ${grade ? grade.color+'33' : 'rgba(255,255,255,0.07)'}`,
                overflow:'hidden',
                transition:'background 0.3s, border-color 0.3s',
              }}>

                {/* Column header */}
                <div style={{ padding:'14px 18px 10px', flexShrink:0 }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:900, color:'#fff', letterSpacing:0.5, textTransform:'uppercase', marginBottom:10, lineHeight:1.15 }}>
                    {col.label}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.32)', letterSpacing:1.5, textTransform:'uppercase' }}>Best Grade</span>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:900, color: grade ? grade.color : 'rgba(255,255,255,0.4)' }}>
                        {grade ? grade.grade : 'N/A'}
                      </span>
                    </div>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.25)', letterSpacing:1.5, textTransform:'uppercase' }}>
                      {grade ? `${grade.pts} pts` : 'Drill Results'}
                    </span>
                  </div>
                </div>

                {/* Sub-header row */}
                <div style={{ display:'flex', alignItems:'center', padding:'7px 18px', borderTop:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
                  <span style={{ flex:1, fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.3)', letterSpacing:1.5, textTransform:'uppercase' }}>
                    {col.category} | {col.intensity}
                  </span>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.3)', letterSpacing:1.5, textTransform:'uppercase', width:46, textAlign:'center' }}>Fitness</span>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:'rgba(255,255,255,0.3)', letterSpacing:1.5, textTransform:'uppercase', width:62, textAlign:'right' }}>Sharpness</span>
                </div>

                {/* Player rows */}
                <div style={{ flex:1, overflowY:'auto' }}>
                  {col.players.map((p,i) => {
                    const fit = playerFitness(p);
                    const shp = playerSharpness(p);
                    const posColor = POS_C[p.position] || '#888';
                    return (
                      <div key={i} className="drill-row" style={{
                        display:'flex', alignItems:'center', gap:10, padding:'9px 18px',
                        borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.12s',
                      }}>
                        {/* Avatar placeholder */}
                        <div style={{
                          width:34, height:34, borderRadius:'50%', flexShrink:0,
                          background:`linear-gradient(135deg, ${posColor}33, ${posColor}11)`,
                          border:`1px solid ${posColor}44`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:900, color:posColor,
                        }}>{p.name?.[0] || '?'}</div>

                        {/* Name + position */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {p.name}
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <div style={{ width:6, height:6, borderRadius:'50%', background:posColor }}/>
                            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'rgba(255,255,255,0.35)' }}>{p.position} · {p.overall} OVR</span>
                          </div>
                        </div>

                        {/* Fitness */}
                        <div style={{ width:46, display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}>
                          <span style={{ color:'#f5c518', fontSize:11 }}>⚡</span>
                          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>{fit}</span>
                        </div>

                        {/* Sharpness */}
                        <div style={{ width:62, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:3 }}>
                          <span style={{ color:'#00e87a', fontSize:11 }}>◆</span>
                          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>{shp}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Busy overlay */}
                {isBusy && (
                  <div style={{ position:'absolute', inset:0, borderRadius:4, background:'rgba(4,6,10,0.7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.1)', borderTopColor:'#00e87a', animation:'spin 0.9s linear infinite' }}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer buttons ── */}
        <div style={{ display:'flex', gap:14, marginTop:14, flexShrink:0, animation:'fadeUp 0.35s 0.1s ease both' }}>
          {!allDone ? (
            <button
              className="footer-btn"
              onClick={playNextDrill}
              disabled={!!activeDrillId}
              style={{
                flex:1, padding:'16px 0', borderRadius:4, border:'1px solid rgba(255,255,255,0.14)', cursor: activeDrillId ? 'default' : 'pointer',
                background:'rgba(255,255,255,0.05)',
                fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:900, letterSpacing:3,
                textTransform:'uppercase', color:'rgba(255,255,255,0.85)',
              }}
            >
              {activeDrillId ? 'Running...' : 'Play Next Drill'}
            </button>
          ) : (
            <button
              className="footer-btn"
              onClick={()=>setShowSummary(true)}
              style={{
                flex:1, padding:'16px 0', borderRadius:4, border:'none', cursor:'pointer',
                background:'#00e87a',
                fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:900, letterSpacing:3,
                textTransform:'uppercase', color:'#000',
              }}
            >
              View Summary →
            </button>
          )}

          <button
            className="footer-btn"
            onClick={simulateAll}
            disabled={allDone}
            style={{
              flex:1, padding:'16px 0', borderRadius:4, border:'none', cursor: allDone ? 'default' : 'pointer',
              background: allDone ? 'rgba(255,255,255,0.05)' : 'linear-gradient(90deg, #00e87a, #00b85f)',
              fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:900, letterSpacing:3,
              textTransform:'uppercase', color: allDone ? 'rgba(255,255,255,0.25)' : '#000',
            }}
          >
            Simulate All
          </button>
        </div>
      </div>
    </div>
  );
}