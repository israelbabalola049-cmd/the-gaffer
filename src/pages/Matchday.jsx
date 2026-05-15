import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import useGameStore from '../store/gameStore';

/* ═══════════════════════════════════════════════
   CONSTANTS & CONFIG
═══════════════════════════════════════════════ */

const COMP_COLORS = {
  'Premier League':     { primary:'#3d0064', accent:'#a855f7', label:'PL' },
  'La Liga':            { primary:'#c2410c', accent:'#f97316', label:'LL' },
  'Bundesliga':         { primary:'#d20515', accent:'#ef4444', label:'BL' },
  'Serie A':            { primary:'#1a1a6b', accent:'#6366f1', label:'SA' },
  'Ligue 1':            { primary:'#001f5f', accent:'#3b82f6', label:'L1' },
  'Champions League':   { primary:'#1a3a6b', accent:'#60a5fa', label:'UCL' },
  'Europa League':      { primary:'#c05000', accent:'#fb923c', label:'UEL' },
  'Conference League':  { primary:'#0a5c36', accent:'#34d399', label:'UECL' },
  'FA Cup':             { primary:'#003087', accent:'#60a5fa', label:'FAC' },
  'Carabao Cup':        { primary:'#003087', accent:'#4ade80', label:'CC' },
  'Cup':                { primary:'#c9a227', accent:'#fbbf24', label:'CUP' },
};

const getComp = (name) => COMP_COLORS[name] || { primary:'#333', accent:'#888', label:'?' };

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

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function ClubBadge({ name, size = 28 }) {
  const [failed, setFailed] = useState(false);
  const url = CLUB_BADGE_URL[name];
  const color = CLUB_COLOR[name] || '#888';
  const abbr = name?.slice(0, 3).toUpperCase() || '?';
  if (url && !failed) {
    return <img src={url} alt={name} onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 5, flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.28, color, letterSpacing: 0.5,
    }}>{abbr}</div>
  );
}

function FormDot({ result }) {
  const c = result === 'W' ? '#00e87a' : result === 'D' ? '#f5c518' : '#ff3b5c';
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />;
}

/* ═══════════════════════════════════════════════
   FIXTURE GENERATOR
═══════════════════════════════════════════════ */

function generateFixtures(myClub, allClubs, season) {
  const leagueClubs = allClubs.filter(c => c.league === myClub.league && c.name !== myClub.name);
  if (!leagueClubs.length) return [];

  const fixtures = [];
  let week = 1;

  // Round-robin league
  leagueClubs.forEach((opponent) => {
    fixtures.push({
      id: `s${season}-w${week}-h`,
      week, day: week * 7 - 3,
      home: myClub.name, away: opponent.name, isHome: true,
      competition: myClub.league, played: false,
      homeGoals: null, awayGoals: null,
    });
    week++;
    fixtures.push({
      id: `s${season}-w${week}-a`,
      week, day: week * 7 - 3,
      home: opponent.name, away: myClub.name, isHome: false,
      competition: myClub.league, played: false,
      homeGoals: null, awayGoals: null,
    });
    week++;
  });

  // Cup knockout
  const cupOpponents = [...leagueClubs].sort(() => Math.random() - 0.5).slice(0, 4);
  const roundNames = ['Round of 32', 'Quarter-Final', 'Semi-Final', 'Final'];
  cupOpponents.forEach((opponent, i) => {
    fixtures.push({
      id: `s${season}-cup-${i}`,
      week, day: week * 7 - 1,
      home: i % 2 === 0 ? myClub.name : opponent.name,
      away: i % 2 === 0 ? opponent.name : myClub.name,
      isHome: i % 2 === 0,
      competition: 'Cup', cupRound: roundNames[i],
      played: false, homeGoals: null, awayGoals: null,
    });
    week += 2;
  });

  return fixtures;
}

/* ═══════════════════════════════════════════════
   MATCH ENGINE
═══════════════════════════════════════════════ */

function getTeamRating(squad) {
  if (!squad?.length) return 70;
  const top11 = [...squad].sort((a, b) => b.overall - a.overall).slice(0, 11);
  return Math.round(top11.reduce((s, p) => s + p.overall, 0) / top11.length);
}

function simulateFullMatch(myRating, oppRating, talkBonus = 0, tacticsMod = 0, isHome = true) {
  const homeAdv = isHome ? 4 : -2;
  const chaos = rnd(0, 18);
  const myStr = Math.max(45, Math.min(95, myRating + talkBonus + tacticsMod + homeAdv + rnd(-5, 5)));
  const oppStr = Math.max(45, Math.min(95, oppRating + rnd(-5, 5) + chaos * 0.3));

  const myXg = Math.max(0.1, (myStr - oppStr * 0.6) / 20 + Math.random() * 0.8);
  const oppXg = Math.max(0.1, (oppStr - myStr * 0.5) / 22 + Math.random() * 0.7);

  const scoreGoals = (xg) => {
    const chance = Math.random();
    if (xg > 2.0) return chance < 0.15 ? 4 : chance < 0.4 ? 3 : chance < 0.7 ? 2 : 1;
    if (xg > 1.4) return chance < 0.1 ? 3 : chance < 0.35 ? 2 : chance < 0.7 ? 1 : 0;
    if (xg > 0.9) return chance < 0.05 ? 3 : chance < 0.25 ? 2 : chance < 0.55 ? 1 : 0;
    if (xg > 0.5) return chance < 0.2 ? 2 : chance < 0.5 ? 1 : 0;
    return chance < 0.25 ? 1 : 0;
  };

  return {
    myGoals: scoreGoals(myXg),
    oppGoals: scoreGoals(oppXg),
    myXg: parseFloat(myXg.toFixed(2)),
    oppXg: parseFloat(oppXg.toFixed(2)),
  };
}

/* ─── Commentary pools ─── */
const COMMS = {
  goal:    (n, min) => pick([
    `${min}' GOAL! ${n} rifles it into the corner!`,
    `${min}' ${n} scores! Clinical finish — the crowd goes wild!`,
    `${min}' Beautiful move, ${n} tucks it away calmly!`,
    `${min}' What a strike from ${n}! Top bins!`,
    `${min}' ${n} doesn't miss from there — 1 more!`,
  ]),
  oppGoal: (n, min) => pick([
    `${min}' Goal conceded. ${n} punishes a defensive lapse.`,
    `${min}' ${n} makes it count. The defence caught cold.`,
    `${min}' Unfortunate. ${n} finds the net — back to work.`,
    `${min}' ${n} scores. They take advantage of the mistake.`,
  ]),
  shot:    (min) => pick([
    `${min}' Shot! Straight at the keeper.`,
    `${min}' Great chance goes begging — just over the bar.`,
    `${min}' Off the post! So agonisingly close.`,
    `${min}' Curled effort — keeper tips it round.`,
  ]),
  save:    (min) => pick([
    `${min}' Brilliant save! Keeps the score level.`,
    `${min}' The goalkeeper pulls off a world-class stop!`,
    `${min}' Denied! That was destined for the net.`,
  ]),
  yellow:  (n, min) => pick([
    `${min}' Yellow card shown to ${n} for a rash challenge.`,
    `${min}' Referee books ${n}. One more and he's walking.`,
    `${min}' Cynical foul — ${n} gets a booking.`,
  ]),
  red:     (n, min) => pick([
    `${min}' RED CARD! ${n} is off — down to ten men!`,
    `${min}' Straight red for ${n}! Reckless tackle, no argument.`,
  ]),
  injury:  (n, min) => pick([
    `${min}' ${n} goes down holding his ankle — looks serious.`,
    `${min}' Trainer on the pitch — ${n} can't continue.`,
  ]),
  penalty: (n, min, scored) => scored
    ? `${min}' PENALTY scored by ${n}! Keeper went the wrong way!`
    : `${min}' Penalty MISSED by ${n}! The keeper guesses right!`,
  var:     (min) => `${min}' VAR check underway... the referee goes to the monitor.`,
  wonder:  (min) => pick([
    `${min}' WONDER SAVE! Absolutely unbelievable stop!`,
    `${min}' The keeper just denied a certain goal — what reflexes!`,
  ]),
  crossbar:(min) => pick([
    `${min}' Off the crossbar! Inches away from a goal!`,
    `${min}' The post denies them — the frame of the goal saves it!`,
  ]),
  press:   (min) => pick([
    `${min}' Good pressure from the attacking side.`,
    `${min}' Ball recycled well — probing for an opening.`,
    `${min}' Neat passing sequence building toward goal.`,
    `${min}' Possession held patiently looking for the break.`,
  ]),
  foul:    (min) => pick([
    `${min}' Foul given. Free kick in a dangerous position.`,
    `${min}' Play stopped — both benches react.`,
    `${min}' The referee brings play to a halt.`,
  ]),
  halfTime:() => '— HALF TIME —',
  fullTime:() => '— FULL TIME —',
};

function buildCommentary(myGoals, oppGoals, myName, oppName, squad) {
  const players = squad?.length ? squad : [];
  const getPlayer = () => players.length
    ? players[Math.floor(Math.random() * Math.min(11, players.length))].name.split(' ').pop()
    : myName;

  const events = [];

  // Place goals across the 90 mins
  const allMins = Array.from({ length: 90 }, (_, i) => i + 1);
  const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
  const goalMins = shuffle(allMins);

  let myScored = 0, oppScored = 0;
  const goalEvents = [];

  // Assign goal minutes
  goalMins.forEach(min => {
    if (myScored < myGoals && Math.random() > 0.5) {
      goalEvents.push({ min, side: 'my' });
      myScored++;
    } else if (oppScored < oppGoals && Math.random() > 0.5) {
      goalEvents.push({ min, side: 'opp' });
      oppScored++;
    }
  });
  // Fill remaining goals
  goalMins.forEach(min => {
    if (myScored < myGoals && !goalEvents.find(e => e.min === min && e.side === 'my')) {
      goalEvents.push({ min: rnd(5, 89), side: 'my' });
      myScored++;
    }
  });
  goalMins.forEach(min => {
    if (oppScored < oppGoals && !goalEvents.find(e => e.min === min && e.side === 'opp')) {
      goalEvents.push({ min: rnd(5, 89), side: 'opp' });
      oppScored++;
    }
  });

  goalEvents.forEach(({ min, side }) => {
    const scorer = getPlayer();
    events.push({
      min, type: 'goal', side,
      text: side === 'my' ? COMMS.goal(scorer, min) : COMMS.oppGoal(oppName.split(' ')[0], min),
      scorer,
    });
  });

  // Random events
  const eventPool = [
    ...Array.from({ length: 5 }, () => ({ min: rnd(1, 44), type: 'shot',    text: COMMS.shot(rnd(1, 44)) })),
    ...Array.from({ length: 4 }, () => ({ min: rnd(46, 89), type: 'shot',   text: COMMS.shot(rnd(46, 89)) })),
    ...Array.from({ length: 3 }, () => ({ min: rnd(5, 85), type: 'save',    text: COMMS.save(rnd(5, 85)) })),
    ...Array.from({ length: 2 }, () => ({ min: rnd(10, 80), type: 'yellow', text: COMMS.yellow(getPlayer(), rnd(10, 80)) })),
    ...Array.from({ length: 6 }, () => ({ min: rnd(1, 44), type: 'info',    text: COMMS.press(rnd(1, 44)) })),
    ...Array.from({ length: 6 }, () => ({ min: rnd(46, 89), type: 'info',   text: COMMS.press(rnd(46, 89)) })),
    ...Array.from({ length: 3 }, () => ({ min: rnd(5, 85), type: 'foul',    text: COMMS.foul(rnd(5, 85)) })),
  ];

  // Rare events
  if (Math.random() < 0.15) events.push({ min: rnd(20, 85), type: 'red',      text: COMMS.red(getPlayer(), rnd(20, 85)) });
  if (Math.random() < 0.20) events.push({ min: rnd(10, 80), type: 'crossbar', text: COMMS.crossbar(rnd(10, 80)) });
  if (Math.random() < 0.18) events.push({ min: rnd(30, 80), type: 'wonder',   text: COMMS.wonder(rnd(30, 80)) });
  if (Math.random() < 0.12) events.push({ min: rnd(40, 85), type: 'var',      text: COMMS.var(rnd(40, 85)) });
  if (Math.random() < 0.10) {
    const pMin = rnd(15, 85);
    const pScored = Math.random() > 0.25;
    events.push({ min: pMin, type: 'penalty', side: pScored ? 'my' : 'none', text: COMMS.penalty(getPlayer(), pMin, pScored) });
  }
  if (Math.random() < 0.15) events.push({ min: rnd(30, 75), type: 'injury', text: COMMS.injury(getPlayer(), rnd(30, 75)) });

  const all = [...events, ...eventPool];
  all.push({ min: 45, type: 'halftime', text: COMMS.halfTime() });
  all.push({ min: 90, type: 'fulltime', text: COMMS.fullTime() });

  return all.sort((a, b) => a.min - b.min || (a.type === 'goal' ? -1 : 1));
}

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
      { text: "Honestly? A bit of luck plus quality. That combination is hard to stop.", good: false },
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
];

/* ═══════════════════════════════════════════════
   TEAM TALK OPTIONS
═══════════════════════════════════════════════ */

const TEAM_TALKS = [
  {
    id: 'destroy',
    label: 'We go out there and destroy them.',
    quote: '"No mercy. Attack from the first whistle. I want them rattled before half-time."',
    tone: 'Aggressive',
    bonus: 3, tactic: 'attack', moraleMod: 5,
    color: '#ef4444',
  },
  {
    id: 'discipline',
    label: 'Stay disciplined. Don\'t give them space.',
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
    quote: '"From the first name on the team sheet to the last sub on the bench — you\'re all ready."',
    tone: 'Personal',
    bonus: 2, tactic: 'balanced', moraleMod: 8,
    color: '#8b5cf6',
  },
];

const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '3-4-3'];

/* ═══════════════════════════════════════════════
   FORMATION PITCH LAYOUT
═══════════════════════════════════════════════ */

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
   CALENDAR STRIP
═══════════════════════════════════════════════ */

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function CalendarStrip({ fixtures, currentDay, onDayTap, playedIds }) {
  const stripRef = useRef(null);
  const totalDays = Math.max(currentDay + 21, fixtures.length ? fixtures[fixtures.length - 1].day + 7 : 60);

  // Map fixture days
  const fixByDay = useMemo(() => {
    const m = {};
    fixtures.forEach(f => {
      if (!m[f.day]) m[f.day] = [];
      m[f.day].push(f);
    });
    return m;
  }, [fixtures]);

  // Build day array
  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const monthIdx = Math.floor((dayNum - 1) / 30) % 12;
      const dayOfMonth = ((dayNum - 1) % 30) + 1;
      const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const dayName = dayNames[(dayNum - 1) % 7];
      return { dayNum, monthIdx, dayOfMonth, dayName, fixtures: fixByDay[dayNum] || [] };
    });
  }, [totalDays, fixByDay]);

  // Scroll to current day on mount
  useEffect(() => {
    if (stripRef.current) {
      const idx = currentDay - 1;
      const cellW = 56;
      stripRef.current.scrollLeft = Math.max(0, idx * cellW - 80);
    }
  }, [currentDay]);

  return (
    <div style={{ position: 'sticky', top: 52, zIndex: 15, background: 'var(--bg-1)', borderBottom: '1px solid var(--border)' }}>
      {/* Month label row */}
      <div style={{ padding: '6px 16px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>
          {MONTH_NAMES[days[currentDay - 1]?.monthIdx ?? 0]} · Season {1}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>
          Day {currentDay}
        </span>
      </div>

      {/* Day strip */}
      <div
        ref={stripRef}
        style={{
          display: 'flex', overflowX: 'auto', gap: 0,
          scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          paddingBottom: 4,
        }}
      >
        <style>{`.cal-strip::-webkit-scrollbar{display:none}`}</style>
        {days.map(({ dayNum, dayName, dayOfMonth, fixtures: dayFixtures }) => {
          const isCurrent = dayNum === currentDay;
          const isPast = dayNum < currentDay;
          const hasFixture = dayFixtures.length > 0;
          const isPlayed = hasFixture && dayFixtures.every(f => playedIds.has(f.id));
          const firstFixture = dayFixtures[0];
          const comp = firstFixture ? getComp(firstFixture.competition) : null;
          const oppName = firstFixture
            ? (firstFixture.isHome ? firstFixture.away : firstFixture.home)
            : null;

          return (
            <div
              key={dayNum}
              onClick={() => onDayTap(dayNum, firstFixture)}
              style={{
                flexShrink: 0, width: 56, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 2, padding: '4px 0 6px',
                cursor: 'pointer', position: 'relative',
                background: isCurrent ? 'rgba(0,232,122,0.06)' : 'transparent',
                borderBottom: isCurrent ? '2px solid var(--green)' : '2px solid transparent',
                opacity: isPast && !hasFixture ? 0.35 : 1,
                transition: 'background 0.15s',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: 1,
                color: isCurrent ? 'var(--green)' : 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>{dayName}</span>

              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: isCurrent ? 900 : 600,
                color: isCurrent ? 'var(--green)' : isPast ? 'var(--text-muted)' : 'var(--text)',
                lineHeight: 1,
              }}>{dayOfMonth}</span>

              {/* Fixture indicator */}
              {hasFixture && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: 2 }}>
                  {/* Competition color strip */}
                  <div style={{
                    width: 28, height: 3, borderRadius: 2,
                    background: isPlayed ? '#555' : comp.accent,
                    opacity: isPlayed ? 0.5 : 1,
                  }} />
                  {/* Opponent badge */}
                  <ClubBadge name={oppName} size={20} />
                </div>
              )}
              {!hasFixture && <div style={{ height: 25 }} />}
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
      <div style={{ padding: '60px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
        Season complete
      </div>
    );
  }

  const comp = getComp(nextFixture.competition);
  const oppName = nextFixture.isHome ? nextFixture.away : nextFixture.home;
  const myForm = results.slice(-5).map(r => r.myGoals > r.oppGoals ? 'W' : r.myGoals === r.oppGoals ? 'D' : 'L');
  const myColor = CLUB_COLOR[myClub?.name] || '#00e87a';

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 20, borderRadius: 2, background: comp.accent }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: comp.accent, letterSpacing: 3, textTransform: 'uppercase' }}>
          {nextFixture.competition} {nextFixture.cupRound ? `· ${nextFixture.cupRound}` : ''}
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2 }}>
          WEEK {nextFixture.week} · {nextFixture.isHome ? 'HOME' : 'AWAY'}
        </span>
      </div>

      {/* Matchup hero */}
      <div style={{
        background: `linear-gradient(135deg, ${comp.primary}44 0%, var(--bg-3) 100%)`,
        border: `1px solid ${comp.accent}33`,
        borderRadius: 12, padding: '20px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ClubBadge name={nextFixture.home} size={52} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>{nextFixture.home}</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: nextFixture.isHome ? myColor : 'var(--text-muted)', lineHeight: 1 }}>
              {nextFixture.isHome ? myRating : oppRating}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 2 }}>OVR</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--text-muted)' }}>VS</span>
            <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ClubBadge name={nextFixture.away} size={52} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>{nextFixture.away}</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: !nextFixture.isHome ? myColor : 'var(--text-muted)', lineHeight: 1 }}>
              {!nextFixture.isHome ? myRating : oppRating}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 2 }}>OVR</span>
          </div>
        </div>
      </div>

      {/* Stats comparison */}
      <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>Squad Comparison</span>
        {[
          ['ATT', Math.round(myRating * 1.02), Math.round(oppRating * 0.98)],
          ['MID', Math.round(myRating * 0.99), Math.round(oppRating * 1.01)],
          ['DEF', Math.round(myRating * 0.97), Math.round(oppRating * 1.03)],
        ].map(([label, myVal, oppVal]) => {
          const total = myVal + oppVal;
          const myPct = Math.round((myVal / total) * 100);
          return (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: myColor }}>{myVal}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, alignSelf: 'center' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{oppVal}</span>
              </div>
              <div style={{ height: 3, background: 'var(--bg-5)', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${myPct}%`, background: myColor, transition: 'width 0.4s' }} />
                <div style={{ flex: 1, background: '#555' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Form */}
      <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Your Form</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {myForm.length ? myForm.map((r, i) => <FormDot key={i} result={r} />) : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>No matches yet</span>}
            </div>
          </div>
          {/* H2H */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>H2H</div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>No previous meetings</span>
          </div>
        </div>
      </div>

      {/* Kick Off */}
      <button onClick={onPlay} style={{
        width: '100%', padding: 16, borderRadius: 10,
        background: `linear-gradient(135deg, ${comp.accent}, ${myColor})`,
        border: 'none', color: '#000',
        fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900,
        letterSpacing: 2, cursor: 'pointer', transition: 'opacity 0.2s',
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
  const [expanded, setExpanded] = useState(null);

  const comps = useMemo(() => {
    const s = new Set(results.map(r => r.competition));
    return ['All', ...s];
  }, [results]);

  const filtered = compFilter === 'All' ? results : results.filter(r => r.competition === compFilter);

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Competition filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 16px', scrollbarWidth: 'none', borderBottom: '1px solid var(--border)' }}>
        {comps.map(c => (
          <button key={c} onClick={() => setCompFilter(c)} style={{
            flexShrink: 0, padding: '5px 12px', borderRadius: 20,
            background: compFilter === c ? 'var(--green)' : 'var(--bg-3)',
            border: compFilter === c ? 'none' : '1px solid var(--border)',
            color: compFilter === c ? '#000' : 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1.5,
            textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '50px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
          No results yet
        </div>
      )}

      {[...filtered].reverse().map((r, i) => {
        const result = r.myGoals > r.oppGoals ? 'W' : r.myGoals === r.oppGoals ? 'D' : 'L';
        const rc = result === 'W' ? '#00e87a' : result === 'D' ? '#f5c518' : '#ff3b5c';
        const comp = getComp(r.competition);
        const isOpen = expanded === i;

        return (
          <div key={i} onClick={() => setExpanded(isOpen ? null : i)} style={{ cursor: 'pointer' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
              borderBottom: '1px solid var(--border)',
              borderLeft: `3px solid ${comp.accent}`,
              background: isOpen ? 'var(--bg-2)' : 'transparent',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 5,
                background: `${rc}18`, border: `1px solid ${rc}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, color: rc, flexShrink: 0,
              }}>{result}</div>

              <ClubBadge name={r.opponent} size={22} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  vs {r.opponent}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: comp.accent, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>
                  {r.competition} · W{r.week}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>{r.homeGoals}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>–</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>{r.awayGoals}</span>
              </div>
            </div>

            {isOpen && r.scorers && (
              <div style={{ padding: '10px 16px 12px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Scorers</div>
                {r.scorers.map((s, j) => (
                  <div key={j} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-dim)', marginBottom: 2 }}>
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
  const [step, setStep] = useState('conference'); // conference | team | talk
  const [confSkipped, setConfSkipped] = useState(false);
  const [confQs, setConfQs] = useState(() => {
    const shuffled = [...PRE_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map(q => ({
      ...q,
      answers: [...q.answers].sort(() => Math.random() - 0.5),
    }));
  });
  const [confIdx, setConfIdx] = useState(0);
  const [confAnswered, setConfAnswered] = useState([]);
  const [confResult, setConfResult] = useState(null); // { text, good }
  const [confDone, setConfDone] = useState(false);
  const [confBonus, setConfBonus] = useState({ morale: 0, rating: 0 });

  const [formation, setFormation] = useState(FORMATIONS[0]);
  const [selectedTalk, setSelectedTalk] = useState(null);
  const [lineup, setLineup] = useState([]); // player indices

  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];

  const myColor = CLUB_COLOR[myClub?.name] || '#00e87a';
  const comp = getComp(fixture.competition);
  const oppName = fixture.isHome ? fixture.away : fixture.home;

  // Auto-fill lineup from top 11
  useEffect(() => {
    if (squad?.length) {
      const top11 = [...squad].sort((a, b) => b.overall - a.overall).slice(0, 11);
      setLineup(top11);
    }
  }, [squad]);

  const steps = confSkipped ? ['team', 'talk'] : ['conference', 'team', 'talk'];
  const stepIdx = steps.indexOf(step);
  const totalSteps = steps.length;

  function handleAnswer(answer) {
    setConfResult({ text: answer.text, good: answer.good });
    const effect = confQs[confIdx].effect;
    if (answer.good) {
      setConfBonus(b => ({ morale: b.morale + effect.morale, rating: b.rating + effect.rating }));
    } else {
      setConfBonus(b => ({ morale: b.morale - Math.floor(effect.morale / 2), rating: b.rating - 1 }));
    }
    setTimeout(() => {
      setConfResult(null);
      if (confIdx + 1 >= confQs.length) {
        setConfDone(true);
      } else {
        setConfIdx(i => i + 1);
        setConfAnswered([]);
      }
    }, 1200);
  }

  function handleKickOffFinal() {
    const talk = TEAM_TALKS.find(t => t.id === selectedTalk);
    onKickOff({
      talkBonus: talk?.bonus || 0,
      tacticsMod: talk?.id === 'destroy' ? 3 : talk?.id === 'discipline' ? -2 : 0,
      confBonus,
      lineup,
      formation,
      talk,
    });
  }

  /* ─── STEP INDICATOR ─── */
  const StepBar = () => (
    <div style={{ display: 'flex', gap: 4, padding: '10px 16px 0', alignItems: 'center' }}>
      {steps.map((s, i) => (
        <div key={s} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i <= stepIdx ? comp.accent : 'var(--bg-5)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );

  /* ─── CONFERENCE ─── */
  if (step === 'conference') {
    const q = confQs[confIdx];
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column' }}>
        <StepBar />
        <div style={{ padding: '12px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2 }}>PRE-MATCH CONFERENCE</span>
          <button onClick={() => { setConfSkipped(true); setStep('team'); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.5, cursor: 'pointer', textTransform: 'uppercase' }}>
            Skip
          </button>
        </div>

        {confDone ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text)', textAlign: 'center' }}>Conference Done</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: confBonus.morale >= 0 ? 'var(--green)' : 'var(--red)' }}>{confBonus.morale >= 0 ? '+' : ''}{confBonus.morale}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>Morale</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: confBonus.rating >= 0 ? 'var(--green)' : 'var(--red)' }}>{confBonus.rating >= 0 ? '+' : ''}{confBonus.rating}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>Manager Rating</div>
              </div>
            </div>
            <button onClick={() => setStep('team')} style={{
              padding: '14px 40px', borderRadius: 8, background: comp.accent,
              border: 'none', color: '#000', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800,
              letterSpacing: 1.5, cursor: 'pointer',
            }}>SELECT TEAM</button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: 20 }}>
            {/* Journalist card */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-4)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
              </div>
              <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '0 10px 10px 10px', padding: '12px 14px', flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                  Q{confIdx + 1} of {confQs.length}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
                  {q.q}
                </div>
              </div>
            </div>

            {/* Answer options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.answers.map((ans, i) => {
                const isSelected = confAnswered.includes(i);
                return (
                  <button key={i} onClick={() => { if (!confResult) { setConfAnswered([i]); handleAnswer(ans); } }} style={{
                    padding: '12px 14px', borderRadius: 8, textAlign: 'left', cursor: confResult ? 'default' : 'pointer',
                    background: confResult && isSelected ? (ans.good ? 'rgba(0,232,122,0.1)' : 'rgba(255,59,92,0.1)') : 'var(--bg-3)',
                    border: confResult && isSelected
                      ? `1px solid ${ans.good ? 'rgba(0,232,122,0.5)' : 'rgba(255,59,92,0.5)'}`
                      : '1px solid var(--border)',
                    transition: 'all 0.2s',
                  }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                      {ans.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Effect flash */}
            {confResult && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, textAlign: 'center',
                background: confResult.good ? 'rgba(0,232,122,0.1)' : 'rgba(255,59,92,0.1)',
                border: `1px solid ${confResult.good ? 'rgba(0,232,122,0.3)' : 'rgba(255,59,92,0.3)'}`,
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                color: confResult.good ? 'var(--green)' : 'var(--red)',
                animation: 'fadeIn 0.2s ease',
              }}>
                {confResult.good
                  ? `Crowd reacts well · Morale +${confQs[confIdx].effect.morale}`
                  : `Awkward silence · Morale -${Math.floor(confQs[confIdx].effect.morale / 2)}`}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ─── TEAM SELECTION ─── */
  if (step === 'team') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column' }}>
        <StepBar />
        <div style={{ padding: '12px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setStep(confSkipped ? 'conference' : 'conference')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2 }}>TEAM SELECTION</span>
          <div style={{ width: 40 }} />
        </div>

        {/* Formation selector */}
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none', padding: '8px 16px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {FORMATIONS.map(f => (
              <button key={f} onClick={() => setFormation(f)} style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 16,
                background: formation === f ? comp.accent : 'var(--bg-3)',
                border: formation === f ? 'none' : '1px solid var(--border)',
                color: formation === f ? '#000' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: 1,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Pitch */}
        <div style={{ position: 'relative', margin: '0 16px', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', display: 'block' }}>
            {/* Pitch background */}
            <defs>
              <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0a2e0a" />
                <stop offset="100%" stopColor="#0d3b0d" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#grass)" />

            {/* Pitch markings */}
            <rect x="5" y="5" width="90" height="90" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
            <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
            <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.3)" />
            <rect x="30" y="5" width="40" height="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
            <rect x="30" y="81" width="40" height="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
            <rect x="38" y="5" width="24" height="7" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
            <rect x="38" y="88" width="24" height="7" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />

            {/* Player dots */}
            {positions.map((p, i) => {
              const player = lineup[i];
              return (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="5" fill={myColor} opacity="0.9" />
                  <circle cx={p.x} cy={p.y} r="5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                  <text x={p.x} y={p.y + 0.8} textAnchor="middle" dominantBaseline="middle" fontSize="2.8" fill="#fff" fontFamily="sans-serif" fontWeight="bold">
                    {player ? player.name.split(' ').pop().slice(0, 4) : p.pos}
                  </text>
                  <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize="2.2" fill="rgba(255,255,255,0.5)" fontFamily="sans-serif">
                    {p.pos}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Lineup list */}
        <div style={{ padding: '10px 16px 16px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
            Starting XI
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {positions.map((p, i) => {
              const player = lineup[i];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg-3)', borderRadius: 7, border: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: comp.accent, width: 32, letterSpacing: 1 }}>{p.pos}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text)', flex: 1 }}>{player?.name || '—'}</span>
                  {player && <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{player.overall}</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          <button onClick={() => setStep('talk')} style={{
            width: '100%', padding: 14, borderRadius: 8,
            background: comp.accent, border: 'none', color: '#000',
            fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800,
            letterSpacing: 1.5, cursor: 'pointer',
          }}>TEAM TALK</button>
        </div>
      </div>
    );
  }

  /* ─── TEAM TALK ─── */
  if (step === 'talk') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column' }}>
        <StepBar />
        <div style={{ padding: '12px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setStep('team')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2 }}>TEAM TALK</span>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, lineHeight: 1.5 }}>
            The dressing room falls silent. Every player looks to you. What do you say?
          </div>

          {TEAM_TALKS.map(t => {
            const isSelected = selectedTalk === t.id;
            return (
              <button key={t.id} onClick={() => setSelectedTalk(t.id)} style={{
                padding: '14px 16px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                background: isSelected ? `${t.color}18` : 'var(--bg-3)',
                border: isSelected ? `1px solid ${t.color}55` : '1px solid var(--border)',
                borderLeft: isSelected ? `3px solid ${t.color}` : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: isSelected ? t.color : 'var(--text)', letterSpacing: 0.5 }}>
                    {t.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: t.color, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.8, flexShrink: 0, marginLeft: 8, marginTop: 2 }}>
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

        <div style={{ padding: '0 16px 20px' }}>
          <button
            onClick={handleKickOffFinal}
            disabled={!selectedTalk}
            style={{
              width: '100%', padding: 16, borderRadius: 10,
              background: selectedTalk ? `linear-gradient(135deg, ${comp.accent}, ${myColor})` : 'var(--bg-4)',
              border: 'none', color: selectedTalk ? '#000' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900,
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
   LIVE SIM
═══════════════════════════════════════════════ */

function LiveSim({ fixture, myGoals, oppGoals, events, minute, isFinished, squad, onSub, onFinish, speed, onSpeedChange }) {
  const myName = fixture.isHome ? fixture.home : fixture.away;
  const oppName = fixture.isHome ? fixture.away : fixture.home;
  const myScore = fixture.isHome ? myGoals : oppGoals;
  const oppScore = fixture.isHome ? oppGoals : myGoals;
  const result = myGoals > oppGoals ? 'W' : myGoals === oppGoals ? 'D' : 'L';
  const rc = result === 'W' ? '#00e87a' : result === 'D' ? '#f5c518' : '#ff3b5c';
  const feedRef = useRef(null);
  const myColor = CLUB_COLOR[myClub?.name] || '#00e87a';

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [events]);

  const eventIcon = (type) => {
    if (type === 'goal')     return '⚽';
    if (type === 'yellow')   return '🟨';
    if (type === 'red')      return '🟥';
    if (type === 'injury')   return '🚑';
    if (type === 'penalty')  return '🎯';
    if (type === 'var')      return '📺';
    if (type === 'wonder')   return '🧤';
    if (type === 'crossbar') return '🏅';
    if (type === 'halftime' || type === 'fulltime') return '—';
    return '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-1)', paddingBottom: 80 }}>

      {/* Scoreboard — sticky */}
      <div style={{ position: 'sticky', top: 52, zIndex: 10, background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {/* Home */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <ClubBadge name={fixture.home} size={32} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>{fixture.home}</span>
            </div>

            {/* Score */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{fixture.isHome ? myScore : oppScore}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text-muted)' }}>–</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{fixture.isHome ? oppScore : myScore}</span>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
                color: isFinished ? rc : 'var(--text-muted)',
                background: isFinished ? `${rc}18` : 'var(--bg-4)',
                border: `1px solid ${isFinished ? rc + '44' : 'var(--border)'}`,
                borderRadius: 4, padding: '2px 10px',
              }}>
                {isFinished ? 'FT' : `${minute}'`}
              </div>
            </div>

            {/* Away */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <ClubBadge name={fixture.away} size={32} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>{fixture.away}</span>
            </div>
          </div>

          {/* Speed controls */}
          {!isFinished && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
              {[1, 2, 5].map(s => (
                <button key={s} onClick={() => onSpeedChange(s)} style={{
                  padding: '3px 10px', borderRadius: 12,
                  background: speed === s ? 'var(--green)' : 'var(--bg-4)',
                  border: speed === s ? 'none' : '1px solid var(--border)',
                  color: speed === s ? '#000' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: 1,
                  cursor: 'pointer',
                }}>{s}x</button>
              ))}
              <button onClick={onFinish} style={{
                padding: '3px 10px', borderRadius: 12,
                background: 'var(--bg-4)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1,
                cursor: 'pointer',
              }}>Skip</button>
            </div>
          )}
        </div>
      </div>

      {/* Commentary feed */}
      <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {events.map((e, i) => {
          const isGoal    = e.type === 'goal';
          const isHalf    = e.type === 'halftime';
          const isFull    = e.type === 'fulltime';
          const isSpecial = ['red', 'wonder', 'crossbar', 'var', 'penalty'].includes(e.type);
          const isMy      = e.side === 'my';
          const icon      = eventIcon(e.type);

          return (
            <div key={i} style={{
              display: 'flex', gap: 10, padding: isHalf || isFull ? '10px 16px' : '6px 16px',
              background: isGoal ? (isMy ? 'rgba(0,232,122,0.06)' : 'rgba(255,59,92,0.06)') : isSpecial ? 'rgba(255,255,255,0.02)' : 'transparent',
              borderLeft: isGoal
                ? `3px solid ${isMy ? '#00e87a' : '#ff3b5c'}`
                : isHalf || isFull ? '3px solid #f5c518' : '3px solid transparent',
              borderBottom: isHalf || isFull ? '1px solid var(--border)' : 'none',
              animation: 'fadeSlideIn 0.25s ease both',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, width: 26, flexShrink: 0, paddingTop: 1, color: isGoal ? (isMy ? '#00e87a' : '#ff3b5c') : isHalf || isFull ? '#f5c518' : 'var(--text-muted)' }}>
                {isHalf || isFull ? icon : `${e.min}'`}
              </span>
              {icon && !isHalf && !isFull && (
                <span style={{ fontSize: 12, flexShrink: 0 }}>{icon}</span>
              )}
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: isGoal ? 'var(--text)' : isHalf || isFull ? 'var(--text-dim)' : isSpecial ? 'var(--text-dim)' : 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>
                {e.text}
              </span>
            </div>
          );
        })}
        {!events.length && (
          <div style={{ padding: '30px 16px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Match about to begin...
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-1)' }}>
        {isFinished ? (
          <button onClick={onFinish} style={{
            width: '100%', padding: 15, borderRadius: 8,
            background: 'var(--green)', border: 'none', color: '#000',
            fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
            letterSpacing: 1.5, cursor: 'pointer',
          }}>VIEW MATCH REPORT</button>
        ) : (
          <button onClick={onSub} style={{
            width: '100%', padding: 13, borderRadius: 8,
            background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-dim)',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: 1, cursor: 'pointer',
          }}>Make Substitution</button>
        )}
      </div>
    </div>
  );
}

/* helper outside component since myClub isn't accessible in LiveSim directly */
let myClub = null;

/* ═══════════════════════════════════════════════
   POST MATCH
═══════════════════════════════════════════════ */

function PostMatch({ fixture, myGoals, oppGoals, squad, events, myXg, oppXg, lineup, onContinue }) {
  const [confStep, setConfStep] = useState('none'); // none | questions | done
  const [confQs] = useState(() => {
    const result = myGoals > oppGoals ? 'W' : myGoals === oppGoals ? 'D' : 'L';
    const pool = result === 'W' ? POST_QUESTIONS_WIN : POST_QUESTIONS_LOSS;
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 2).map(q => ({
      ...q,
      answers: [...q.answers].sort(() => Math.random() - 0.5),
    }));
  });
  const [confIdx, setConfIdx] = useState(0);
  const [confResult, setConfResult] = useState(null);
  const [confBonus, setConfBonus] = useState({ morale: 0, rating: 0 });
  const [confDone, setConfDone] = useState(false);

  const myName = fixture.isHome ? fixture.home : fixture.away;
  const oppName = fixture.isHome ? fixture.away : fixture.home;
  const result = myGoals > oppGoals ? 'W' : myGoals === oppGoals ? 'D' : 'L';
  const rc = result === 'W' ? '#00e87a' : result === 'D' ? '#f5c518' : '#ff3b5c';
  const resultLabel = result === 'W' ? 'Victory' : result === 'D' ? 'Draw' : 'Defeat';

  // Generate player ratings from events
  const playerRatings = useMemo(() => {
    const base = lineup?.length ? lineup : (squad?.slice(0, 11) || []);
    return base.map(p => {
      let rating = 6.0 + Math.random() * 1.2;
      // Bonus if they scored
      const scored = events?.filter(e => e.type === 'goal' && e.side === 'my' && e.scorer === p.name.split(' ').pop()).length || 0;
      rating += scored * 0.8;
      // Random variance based on overall
      rating += (p.overall - 75) / 30;
      rating = Math.min(9.9, Math.max(5.0, rating));
      return { ...p, matchRating: parseFloat(rating.toFixed(1)), goals: scored };
    });
  }, [lineup, squad, events]);

  const motm = playerRatings.length ? [...playerRatings].sort((a, b) => b.matchRating - a.matchRating)[0] : null;

  // Stats
  const myShots = (myGoals * 3) + rnd(2, 6);
  const oppShots = (oppGoals * 3) + rnd(2, 6);
  const mySot = myGoals + rnd(1, 3);
  const oppSot = oppGoals + rnd(1, 3);
  const myPoss = rnd(38, 62);
  const oppPoss = 100 - myPoss;
  const myFouls = rnd(6, 16);
  const oppFouls = rnd(6, 16);
  const myCorners = rnd(2, 8);
  const oppCorners = rnd(2, 8);
  const myYellows = events?.filter(e => e.type === 'yellow').length || rnd(0, 2);
  const oppYellows = rnd(0, 2);

  // Goal scorers
  const scorers = events?.filter(e => e.type === 'goal' && e.side === 'my').map(e => ({
    name: e.scorer || myName,
    min: e.min,
  })) || [];

  function handleConfAnswer(ans) {
    setConfResult({ good: ans.good });
    const effect = confQs[confIdx].effect;
    if (ans.good) setConfBonus(b => ({ morale: b.morale + effect.morale, rating: b.rating + effect.rating }));
    else setConfBonus(b => ({ morale: b.morale + effect.morale, rating: b.rating + effect.rating }));
    setTimeout(() => {
      setConfResult(null);
      if (confIdx + 1 >= confQs.length) setConfDone(true);
      else setConfIdx(i => i + 1);
    }, 1200);
  }

  // Post-match conference overlay
  if (confStep === 'questions') {
    if (confDone) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Conference Complete</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: confBonus.morale >= 0 ? '#00e87a' : '#ff3b5c' }}>{confBonus.morale >= 0 ? '+' : ''}{confBonus.morale}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>Morale</div>
            </div>
          </div>
          <button onClick={onContinue} style={{ padding: '14px 40px', borderRadius: 8, background: '#00e87a', border: 'none', color: '#000', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, letterSpacing: 1.5, cursor: 'pointer' }}>CONTINUE</button>
        </div>
      );
    }

    const q = confQs[confIdx];
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column', padding: 20, gap: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>POST-MATCH CONFERENCE</div>
        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '0 10px 10px 10px', padding: '14px 16px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{q.q}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.answers.map((ans, i) => (
            <button key={i} onClick={() => { if (!confResult) handleConfAnswer(ans); }} style={{
              padding: '12px 14px', borderRadius: 8, textAlign: 'left', cursor: confResult ? 'default' : 'pointer',
              background: confResult ? (ans.good ? 'rgba(0,232,122,0.1)' : 'rgba(255,59,92,0.1)') : 'var(--bg-3)',
              border: '1px solid var(--border)',
            }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)' }}>{ans.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-1)', paddingBottom: 80 }}>
      <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Result hero */}
      <div style={{
        padding: '28px 16px 20px',
        background: `linear-gradient(180deg, ${rc}14 0%, transparent 100%)`,
        borderBottom: `1px solid ${rc}22`,
        textAlign: 'center',
        animation: 'fadeSlideIn 0.4s ease',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: rc, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 10 }}>{resultLabel}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <ClubBadge name={fixture.home} size={44} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{fixture.home}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{fixture.isHome ? myGoals : oppGoals}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--text-muted)' }}>–</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{fixture.isHome ? oppGoals : myGoals}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <ClubBadge name={fixture.away} size={44} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{fixture.away}</span>
          </div>
        </div>

        {/* Scorers */}
        {scorers.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {scorers.map((s, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-dim)' }}>
                ⚽ {s.name} <span style={{ color: 'var(--text-muted)' }}>{s.min}'</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Full Stats */}
        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>Match Stats</span>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Shots', myShots, oppShots],
              ['On Target', mySot, oppSot],
              ['Possession', `${myPoss}%`, `${oppPoss}%`],
              ['xG', myXg?.toFixed(2) || '—', oppXg?.toFixed(2) || '—'],
              ['Fouls', myFouls, oppFouls],
              ['Corners', myCorners, oppCorners],
              ['Yellows', myYellows, oppYellows],
            ].map(([label, myVal, oppVal]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#00e87a', width: 40 }}>{myVal}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', flex: 1, textAlign: 'center' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', width: 40, textAlign: 'right' }}>{oppVal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MOTM */}
        {motm && (
          <div style={{ background: 'linear-gradient(135deg, rgba(245,197,24,0.1) 0%, var(--bg-3) 100%)', border: '1px solid rgba(245,197,24,0.3)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-4)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: '#f5c518' }}>
              {motm.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{motm.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#f5c518', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>Man of the Match</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900, color: '#f5c518', lineHeight: 1 }}>{motm.matchRating}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 1.5 }}>RATING</div>
            </div>
          </div>
        )}

        {/* Player Ratings */}
        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>Player Ratings</span>
          </div>
          {playerRatings.map((p, i) => {
            const ratingColor = p.matchRating >= 7.5 ? '#00e87a' : p.matchRating >= 6.5 ? '#f5c518' : '#ff3b5c';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: i < playerRatings.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text)', flex: 1 }}>{p.name}</span>
                {p.goals > 0 && <span style={{ fontSize: 11 }}>{'⚽'.repeat(p.goals)}</span>}
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: ratingColor, width: 32, textAlign: 'right' }}>{p.matchRating}</span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setConfStep('questions')} style={{
            flex: 1, padding: 13, borderRadius: 8,
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: 1, cursor: 'pointer',
          }}>POST CONFERENCE</button>
          <button onClick={onContinue} style={{
            flex: 1, padding: 13, borderRadius: 8,
            background: 'var(--green)', border: 'none', color: '#000',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800,
            letterSpacing: 1.5, cursor: 'pointer',
          }}>CONTINUE</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */

export default function Matchday() {
  const store = useGameStore();
  const { squad, allClubs, formation: storeFormation, week, season, results, addResult, advanceWeek } = store;
  myClub = store.myClub; // make accessible to LiveSim

  const [tab, setTab] = useState('preview');
  const [screen, setScreen] = useState('calendar'); // calendar | prematch | livesim | postmatch
  const [activeFixture, setActiveFixture] = useState(null);
  const [simEvents, setSimEvents] = useState([]);
  const [simMinute, setSimMinute] = useState(0);
  const [simFinished, setSimFinished] = useState(false);
  const [myGoals, setMyGoals] = useState(0);
  const [oppGoals, setOppGoals] = useState(0);
  const [myXg, setMyXg] = useState(0);
  const [oppXg, setOppXg] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [matchLineup, setMatchLineup] = useState([]);
  const simRef = useRef(null);
  const speedRef = useRef(1);

  // Generate fixtures
  const fixtures = useMemo(() => {
    if (!myClub || !allClubs) return [];
    return generateFixtures(myClub, allClubs, season);
  }, [myClub, allClubs, season]);

  const playedIds = useMemo(() => new Set(results.map(r => r.fixtureId)), [results]);
  const myRating  = useMemo(() => getTeamRating(squad), [squad]);

  const upcomingFixtures = fixtures.filter(f => !playedIds.has(f.id));
  const nextFixture      = upcomingFixtures[0] || null;

  function getOppRating(fixture) {
    if (!fixture) return 72;
    const oppName = fixture.isHome ? fixture.away : fixture.home;
    const oppClub = allClubs?.find(c => c.name === oppName);
    return oppClub ? Math.round(Math.min(90, Math.max(60, 70 + (oppClub.budget || 0) / 20000000))) : 72;
  }

  function handleDayTap(day, fixture) {
    if (day > currentDay) {
      // Advance to that day
      setCurrentDay(day);
    }
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

  function handleKickOff({ talkBonus, tacticsMod, confBonus, lineup, formation }) {
    setMatchLineup(lineup || []);
    const oppRating = getOppRating(activeFixture);
    const oppName   = activeFixture.isHome ? activeFixture.away : activeFixture.home;

    const result = simulateFullMatch(myRating, oppRating, talkBonus, tacticsMod, activeFixture.isHome);
    setMyGoals(result.myGoals);
    setOppGoals(result.oppGoals);
    setMyXg(result.myXg);
    setOppXg(result.oppXg);

    const commentary = buildCommentary(result.myGoals, result.oppGoals, myClub.name, oppName, squad);
    setSimEvents([]);
    setSimMinute(0);
    setSimFinished(false);
    setScreen('livesim');

    let i = 0;
    speedRef.current = 1;

    function tick() {
      clearInterval(simRef.current);
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
      }, Math.round(700 / speedRef.current));
    }
    tick();
  }

  function handleSpeedChange(s) {
    setSimSpeed(s);
    speedRef.current = s;
    // Restart ticker at new speed
    let i = simEvents.length;
    clearInterval(simRef.current);
    // Continue from current position
    const commentary = simEvents; // already have played events, but we need full
    // Simple approach: just change interval
    simRef.current = setInterval(() => {
      setSimFinished(prev => {
        if (prev) { clearInterval(simRef.current); return true; }
        return prev;
      });
    }, Math.round(700 / s));
  }

  function handleFinish() {
    clearInterval(simRef.current);
    setSimFinished(true);
    setScreen('postmatch');
  }

  function handleContinue() {
    const oppName = activeFixture.isHome ? activeFixture.away : activeFixture.home;
    const scorers = simEvents
      .filter(e => e.type === 'goal' && e.side === 'my')
      .map(e => ({ name: e.scorer || myClub.name, min: e.min }));

    addResult({
      fixtureId: activeFixture.id,
      week: activeFixture.week,
      competition: activeFixture.competition,
      isHome: activeFixture.isHome,
      opponent: oppName,
      homeGoals: activeFixture.isHome ? myGoals : oppGoals,
      awayGoals: activeFixture.isHome ? oppGoals : myGoals,
      myGoals,
      oppGoals,
      scorers,
    });
    advanceWeek();

    // Advance calendar to next fixture day
    const next = upcomingFixtures.find(f => !playedIds.has(f.id) && f.id !== activeFixture.id);
    if (next) setCurrentDay(next.day);

    setScreen('calendar');
    setActiveFixture(null);
    setSimEvents([]);
  }

  useEffect(() => () => clearInterval(simRef.current), []);

  /* ── PRE-MATCH ── */
  if (screen === 'prematch' && activeFixture) {
    return (
      <>
        <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
        <PreMatchFlow
          fixture={activeFixture}
          myClub={myClub}
          myRating={myRating}
          oppRating={getOppRating(activeFixture)}
          squad={squad}
          onKickOff={handleKickOff}
          onBack={() => setScreen('calendar')}
        />
      </>
    );
  }

  /* ── LIVE SIM ── */
  if (screen === 'livesim' && activeFixture) {
    return (
      <>
        <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}`}</style>
        <LiveSim
          fixture={activeFixture}
          myGoals={myGoals}
          oppGoals={oppGoals}
          events={simEvents}
          minute={simMinute}
          isFinished={simFinished}
          squad={squad}
          onSub={() => {}}
          onFinish={handleFinish}
          speed={simSpeed}
          onSpeedChange={handleSpeedChange}
        />
      </>
    );
  }

  /* ── POST MATCH ── */
  if (screen === 'postmatch' && activeFixture) {
    return (
      <>
        <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <PostMatch
          fixture={activeFixture}
          myGoals={myGoals}
          oppGoals={oppGoals}
          squad={squad}
          events={simEvents}
          myXg={myXg}
          oppXg={oppXg}
          lineup={matchLineup}
          onContinue={handleContinue}
        />
      </>
    );
  }

  /* ── CALENDAR VIEW ── */
  return (
    <>
      <style>{`
        @keyframes fadeSlideIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg-1)', paddingBottom: 80 }}>

        {/* Day Calendar Strip */}
        <CalendarStrip
          fixtures={fixtures}
          currentDay={currentDay}
          onDayTap={handleDayTap}
          playedIds={playedIds}
        />

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)', position: 'sticky', top: 52 + 68, zIndex: 9 }}>
          {['preview', 'results'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '11px', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--green)' : '2px solid transparent',
              color: tab === t ? 'var(--green)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {t === 'preview' ? 'Preview' : 'Results'}
            </button>
          ))}
        </div>

        {/* Tab content */}
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