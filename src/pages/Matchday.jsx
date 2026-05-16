import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import useGameStore from '../store/gameStore';
import LiveSim from '../matchday/LiveSim';
import PostMatch from '../matchday/PostMatch';
import { runMatch } from '../engine/matchEngine';

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
        position: 'sticky', top: 52, zIndex: 15,
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
  const { squad, myClub, allClubs, season = 1, results = [], addResult, advanceWeek } = store;

  const [tab, setTab]                     = useState('preview');
  const [screen, setScreen]               = useState('calendar');
  const [activeFixture, setActiveFixture] = useState(null);
  const [currentDay, setCurrentDay]       = useState(1);

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

  /* Fixtures */
  const fixtures = useMemo(() => {
    if (!myClub || !allClubs) return [];
    return generateFixtures(myClub, allClubs, season);
  }, [myClub, allClubs, season]);

  const playedIds   = useMemo(() => new Set(results.map(r => r.fixtureId)), [results]);
  const myRating    = useMemo(() => getTeamRating(squad), [squad]);
  const upcomingFix = fixtures.filter(f => !playedIds.has(f.id));
  const nextFixture = upcomingFix[0] || null;

  function getOppRating(fixture) {
    if (!fixture) return 72;
    const oppName = fixture.isHome ? fixture.away : fixture.home;
    const oppClub = allClubs?.find(c => c.name === oppName);
    return oppClub
      ? Math.round(Math.min(90, Math.max(60, 70 + (oppClub.budget || 0) / 20_000_000)))
      : 72;
  }

  function handleDayTap(day, fixture) {
    if (day > currentDay) setCurrentDay(day);
    if (fixture && !playedIds.has(fixture.id)) {
      setActiveFixture(fixture);
      setScreen('prematch');
    }
  }

  function handlePlayFromPreview() {
    if (nextFixture) {
      setActiveFixture(nextFixture);
      setScreen('prematch');
    }
  }

  /* ── Kick off ── */
  function handleKickOff({ talkBonus, tactic, confBonus, lineup, formation }) {
    setMatchLineup(lineup || []);

    const oppName   = activeFixture.isHome ? activeFixture.away : activeFixture.home;
    const oppRating = getOppRating(activeFixture);

    const result = runMatch({
      mySquad:    lineup?.length ? lineup : squad,
      myRating:   myRating + (talkBonus || 0) + (confBonus?.rating || 0),
      oppRating,
      oppClubName: oppName,
      tactic:      tactic || 'balanced',
      isHome:      activeFixture.isHome,
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

  /* ── Continue after postmatch ── */
  function handleContinue() {
    if (!activeFixture || !matchResult) return;

    const oppName = activeFixture.isHome ? activeFixture.away : activeFixture.home;
    const scorers = matchResult.goals?.map(g => ({ name: g.scorerName, min: g.min || 0 })) || [];

    addResult({
      fixtureId:   activeFixture.id,
      week:        activeFixture.week,
      competition: activeFixture.competition,
      isHome:      activeFixture.isHome,
      opponent:    oppName,
      homeGoals:   activeFixture.isHome ? matchResult.myGoals : matchResult.oppGoals,
      awayGoals:   activeFixture.isHome ? matchResult.oppGoals : matchResult.myGoals,
      myGoals:     matchResult.myGoals,
      oppGoals:    matchResult.oppGoals,
      scorers,
    });

    if (advanceWeek) advanceWeek();

    const next = upcomingFix.find(f => !playedIds.has(f.id) && f.id !== activeFixture.id);
    if (next) setCurrentDay(next.day);

    setScreen('calendar');
    setActiveFixture(null);
    setMatchResult(null);
    setSimEvents([]);
    setSimMyGoals(0);
    setSimOppGoals(0);
    evtIdxRef.current = 0;
  }

  useEffect(() => () => clearInterval(simRef.current), []);

  /* ── PRE-MATCH ── */
  if (screen === 'prematch' && activeFixture) {
    return (
      <PreMatchFlow
        fixture={activeFixture}
        myClub={myClub}
        myRating={myRating}
        oppRating={getOppRating(activeFixture)}
        squad={squad}
        onKickOff={handleKickOff}
        onBack={() => setScreen('calendar')}
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

  /* ── CALENDAR VIEW ── */

  /*
   * Layout stacking (all position:sticky, z-index descending):
   *   Global nav bar        — rendered by Layout, height 52px, top:0,  z:30
   *   CalendarStrip         — top:52, z:15  (sticks just below nav)
   *   Tab bar               — top: 52 + calendarH, z:9  (sticks below calendar)
   *
   * We measure CalendarStrip's rendered height with a ResizeObserver so the
   * tab bar offset is always exact regardless of content changes.
   *
   * The outer wrapper has NO top padding — Layout's <main> already provides
   * the 52px offset. Adding paddingTop here would create the double-gap.
   */
  const calRef        = useRef(null);
  const [calH, setCalH] = useState(100);

  useEffect(() => {
    if (!calRef.current) return;
    const ro = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect?.height;
      if (h) setCalH(Math.round(h));
    });
    ro.observe(calRef.current);
    return () => ro.disconnect();
  }, []);

  const NAV_H    = 52;          // global nav bar height
  const TAB_TOP  = NAV_H + calH; // exact pixel where tab bar sticks

  return (
    <>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        div::-webkit-scrollbar { display: none; }
      `}</style>

      {/*
       * margin-top: 0  — Layout already offsets by 52px for the nav.
       * No additional paddingTop here.
       */}
      <div style={{ minHeight: '100vh', background: 'var(--bg-1)', paddingBottom: 100, marginTop: 0 }}>

        {/* CalendarStrip — ref so we can measure its height */}
        <div ref={calRef}>
          <CalendarStrip
            fixtures={fixtures}
            currentDay={currentDay}
            onDayTap={handleDayTap}
            playedIds={playedIds}
          />
        </div>

        {/* Tab bar — sticks at exactly (nav height + calendar height) */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-1)',
          position: 'sticky',
          top: TAB_TOP,
          zIndex: 9,
        }}>
          {['preview', 'results'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '12px 0', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--green)' : '2px solid transparent',
              color: tab === t ? 'var(--green)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2.5,
              textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {t === 'preview' ? 'Preview' : 'Results'}
            </button>
          ))}
        </div>

        {tab === 'preview' && (
          <PreviewTab
            nextFixture={nextFixture}
            myClub={myClub}
            myRating={myRating}
            oppRating={getOppRating(nextFixture)}
            onPlay={handlePlayFromPreview}
            results={results}
          />
        )}

        {tab === 'results' && (
          <ResultsTab results={results} fixtures={fixtures} />
        )}
      </div>
    </>
  );
}