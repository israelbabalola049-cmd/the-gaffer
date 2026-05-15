/* ═══════════════════════════════════════════════════════
   THE GAFFER — Match Engine v2
   Pure logic, no React. Imported by LiveSim + Matchday.
═══════════════════════════════════════════════════════ */

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ─── Competition colours ─── */
export const COMP_COLORS = {
  'Premier League':   '#7c3aed',
  'La Liga':          '#e8631a',
  'Bundesliga':       '#d20515',
  'Serie A':          '#1a3a6b',
  'Ligue 1':          '#001f5f',
  'Champions League': '#1a3a6b',
  'Europa League':    '#c05000',
  'Conference League':'#0a5c36',
  'FA Cup':           '#003087',
  'Carabao Cup':      '#003087',
  'Copa del Rey':     '#000080',
  'DFB-Pokal':        '#222222',
  'Coppa Italia':     '#009246',
  'Coupe de France':  '#002395',
  'Cup':              '#003087',
  'Domestic Cup':     '#003087',
};

export const COMP_ACCENT = {
  'Premier League':   '#a855f7',
  'La Liga':          '#f97316',
  'Bundesliga':       '#ef4444',
  'Serie A':          '#3b82f6',
  'Ligue 1':          '#60a5fa',
  'Champions League': '#fbbf24',
  'Europa League':    '#f97316',
  'Conference League':'#4ade80',
  'FA Cup':           '#60a5fa',
  'Carabao Cup':      '#4ade80',
  'Copa del Rey':     '#facc15',
  'DFB-Pokal':        '#e5e7eb',
  'Coppa Italia':     '#4ade80',
  'Coupe de France':  '#60a5fa',
  'Cup':              '#facc15',
  'Domestic Cup':     '#facc15',
};

/* ─── Team rating from squad ─── */
export function getTeamRating(players) {
  if (!players?.length) return 70;
  const top11 = [...players].sort((a, b) => b.overall - a.overall).slice(0, 11);
  return Math.round(top11.reduce((s, p) => s + p.overall, 0) / top11.length);
}

export function getPositionalRatings(players) {
  if (!players?.length) return { att: 70, mid: 70, def: 70 };
  const att = players.filter(p => ['ST','LW','RW','CF','CAM'].includes(p.position));
  const mid = players.filter(p => ['CM','CDM','LM','RM'].includes(p.position));
  const def = players.filter(p => ['CB','LB','RB','LWB','RWB','GK'].includes(p.position));
  const avg = arr => arr.length ? Math.round(arr.reduce((s,p) => s + p.overall, 0) / arr.length) : 70;
  return { att: avg(att), mid: avg(mid), def: avg(def) };
}

/* ─── Tactics modifiers ─── */
const TACTICS = {
  attacking:  { attMod: 8,  defMod: -5, possMod: 5 },
  balanced:   { attMod: 0,  defMod: 0,  possMod: 0 },
  defensive:  { attMod: -5, defMod: 8,  possMod: -3 },
  counter:    { attMod: 3,  defMod: 3,  possMod: -5 },
  highpress:  { attMod: 5,  defMod: -3, possMod: 8 },
};

/* ─── Team talk modifiers ─── */
export const TEAM_TALKS = [
  {
    id: 'destroy',
    label: '"We go out there and destroy them."',
    tone: 'Aggressive',
    desc: 'No mercy. All out attack from the first whistle.',
    attMod: 7, defMod: -4, moraleMod: 5,
    color: 'var(--red)',
  },
  {
    id: 'disciplined',
    label: '"Stay disciplined. Don\'t give them space."',
    tone: 'Defensive',
    desc: 'Compact shape, frustrate them, hit on the break.',
    attMod: -3, defMod: 8, moraleMod: 2,
    color: 'var(--blue)',
  },
  {
    id: 'moment',
    label: '"This is our moment. The fans are watching."',
    tone: 'Inspired',
    desc: 'Tap into the crowd energy. Anything can happen.',
    attMod: 4, defMod: 0, moraleMod: 10,
    color: '#a855f7',
  },
  {
    id: 'simple',
    label: '"Keep it simple. Execute the plan."',
    tone: 'Composed',
    desc: 'Low risk, consistent. Do what we do well.',
    attMod: 2, defMod: 2, moraleMod: 3,
    color: 'var(--green)',
  },
  {
    id: 'believe',
    label: '"I believe in every single one of you."',
    tone: 'Emotional',
    desc: 'Individual confidence spike — anyone can be the hero.',
    attMod: 3, defMod: 1, moraleMod: 8,
    color: 'var(--yellow)',
  },
];

/* ─── Commentary pools ─── */
const C = {
  goal: (name, min) => pick([
    `${min}' GOAL! ${name} drills it into the bottom corner. Clinical.`,
    `${min}' ${name} scores! The place erupts!`,
    `${min}' Stunning finish from ${name}. No chance for the keeper.`,
    `${min}' ${name} with the perfect run and finish. 1-0!`,
    `${min}' It's in! ${name} was in the right place at the right time.`,
    `${min}' GOAL! ${name} makes it look easy. Textbook stuff.`,
    `${min}' ${name} curls one into the far corner. Absolute beauty.`,
  ]),
  goalOpp: (name, min) => pick([
    `${min}' Goal conceded. ${name} punishes a lapse in concentration.`,
    `${min}' ${name} levels it up. The defence caught napping.`,
    `${min}' Oh no. ${name} capitalises on a mistake at the back.`,
    `${min}' ${name} strikes. Can't afford to give them that much space.`,
    `${min}' It's in. ${name} catches the keeper off his line.`,
  ]),
  miss: (min) => pick([
    `${min}' Great chance goes begging. Should have scored that.`,
    `${min}' Off the post! So close to breaking the deadlock.`,
    `${min}' Shot straight at the keeper. Needs to do better.`,
    `${min}' Blazed over the bar. Frustrating miss.`,
    `${min}' Offside flag goes up. Chance ruled out.`,
  ]),
  missOpp: (min) => pick([
    `${min}' Lucky escape. They really should have scored there.`,
    `${min}' Brilliant block from the defender. Crisis averted.`,
    `${min}' Keeper to the rescue! Magnificent stop.`,
    `${min}' Crossbar! Fortune smiles on us.`,
    `${min}' VAR check... play on. Narrow escape.`,
  ]),
  yellowCard: (name, min) => pick([
    `${min}' YELLOW CARD. ${name} goes into the book. Needs to be careful.`,
    `${min}' Referee books ${name} for that cynical challenge.`,
    `${min}' ${name} shown the yellow. Risky tackle that.`,
  ]),
  yellowOpp: (name, min) => pick([
    `${min}' Opposition player booked. That's a yellow card.`,
    `${min}' ${name} picks up a yellow. We can use that space now.`,
    `${min}' Referee has a word with ${name} — yellow card.`,
  ]),
  redCard: (name, min) => pick([
    `${min}' RED CARD! ${name} is sent off! Down to ten men.`,
    `${min}' Straight red for ${name}. Absolute madness. Huge moment.`,
  ]),
  redOpp: (name, min) => pick([
    `${min}' RED CARD for the opposition! ${name} is off. Massive advantage.`,
    `${min}' They're down to ten men! ${name} given his marching orders.`,
  ]),
  injury: (name, min) => pick([
    `${min}' ${name} goes down injured. Looks like a substitution is needed.`,
    `${min}' Physio on the pitch for ${name}. Could be a problem.`,
  ]),
  penalty: (scored, name, min) => scored
    ? pick([`${min}' PENALTY SCORED! ${name} steps up and converts. Cool as you like.`, `${min}' ${name} sends the keeper the wrong way. 1-0 from the spot!`])
    : pick([`${min}' PENALTY MISSED! ${name} blazes it over. Huge let-off.`, `${min}' Keeper saves the penalty! Unbelievable!`]),
  penaltyOpp: (scored, min) => scored
    ? pick([`${min}' Penalty converted by the opposition. Gutting.`, `${min}' They score from the spot. Hard to take.`])
    : pick([`${min}' Penalty saved! Keeper is a hero. Huge moment.`, `${min}' Opposition miss the penalty! Back of the net stays empty.`]),
  wonderSave: (min) => pick([
    `${min}' WONDER SAVE! Keeper tips it onto the bar. Unreal reflexes.`,
    `${min}' How did he keep that out?! Incredible goalkeeping.`,
    `${min}' Keeper claws it away at full stretch. Outstanding.`,
  ]),
  varCheck: (min) => pick([
    `${min}' VAR is checking... decision stands. Play on.`,
    `${min}' Referee goes to the monitor. This could take a while.`,
    `${min}' Long VAR check... and the goal stands! Wild scenes.`,
  ]),
  atmosphere: (min) => pick([
    `${min}' The crowd is electric. Atmosphere cranked up to the max.`,
    `${min}' Fans on their feet as the game reaches a critical moment.`,
    `${min}' Noise levels are incredible inside the stadium right now.`,
  ]),
  pressure: (min) => pick([
    `${min}' Good spell of possession for the home side.`,
    `${min}' Both teams cancelling each other out in midfield.`,
    `${min}' Compact defensive shape making it difficult.`,
    `${min}' Lots of quality in this game. End-to-end football.`,
  ]),
  foul: (min) => pick([
    `${min}' Foul given. Free kick in a dangerous area.`,
    `${min}' Referee stops play. Players crowd around.`,
    `${min}' Strong challenge there — referee waves play on.`,
  ]),
  halfTime: () => `HALF TIME. Teams head to the dressing rooms.`,
  fullTime: () => `FULL TIME. The final whistle blows!`,
};

/* ─── xG calculation ─── */
function calcXG(shots, onTarget, goals) {
  const baseXG = (shots * 0.09) + (onTarget * 0.22) + (goals * 0.15);
  return Math.min(5.0, parseFloat((baseXG + Math.random() * 0.3).toFixed(2)));
}

/* ─── Player rating generator ─── */
function generatePlayerRatings(squad, goals, assists, yellowCards, redCards) {
  return squad.map(player => {
    let rating = 6.0 + (Math.random() * 1.5);
    // boost for goals
    const playerGoals = goals.filter(g => g.scorerId === player.id).length;
    const playerAssists = assists.filter(a => a.assistId === player.id).length;
    rating += playerGoals * 0.8;
    rating += playerAssists * 0.4;
    // penalty for cards
    if (yellowCards.includes(player.id)) rating -= 0.3;
    if (redCards.includes(player.id)) rating -= 1.2;
    // overall rating influences base
    rating += (player.overall - 75) * 0.03;
    return {
      ...player,
      matchRating: parseFloat(clamp(rating, 4.5, 9.9).toFixed(1)),
    };
  });
}

/* ─── MAIN MATCH SIMULATOR ─── */
export function simulateFullMatch({
  mySquad,
  oppClubName,
  oppClubBudget = 0,
  isHome,
  tactics = 'balanced',
  teamTalkId = 'simple',
  confBonus = 0,         // morale modifier from press conference
  moraleMap = {},        // playerId -> 0-100
}) {
  /* ratings */
  const myPos = getPositionalRatings(mySquad);
  const oppRaw = clamp(70 + (oppClubBudget / 25_000_000), 62, 91);
  const oppPos = { att: oppRaw - 1, mid: oppRaw, def: oppRaw + 1 };

  const tact = TACTICS[tactics] || TACTICS.balanced;
  const talk = TEAM_TALKS.find(t => t.id === teamTalkId) || TEAM_TALKS[3];

  /* chaos factor — keeps upsets alive */
  const chaos = rnd(0, 18);

  const myAttEff  = clamp(myPos.att  + tact.attMod + talk.attMod + confBonus + (isHome ? 4 : 0) + chaos * 0.4, 50, 100);
  const myDefEff  = clamp(myPos.def  + tact.defMod + talk.defMod + confBonus * 0.5 + (isHome ? 3 : 0), 50, 100);
  const oppAttEff = clamp(oppPos.att + (isHome ? 0 : 4) + (18 - chaos) * 0.4, 50, 100);
  const oppDefEff = clamp(oppPos.def + (isHome ? 0 : 3), 50, 100);

  /* goal simulation */
  function simGoals(att, def) {
    const strength = clamp((att - def + 12) / 22, 0.2, 2.4);
    const r = Math.random() * strength;
    if (r < 0.10) return 0;
    if (r < 0.38) return 1;
    if (r < 0.68) return 2;
    if (r < 0.85) return 3;
    if (r < 0.94) return 4;
    return 5;
  }

  let myGoals  = simGoals(myAttEff,  oppDefEff);
  let oppGoals = simGoals(oppAttEff, myDefEff);

  /* scoreline psychology — trailing team gets small push */
  if (myGoals < oppGoals && Math.random() > 0.55) myGoals  = Math.min(myGoals + 1, oppGoals);
  if (oppGoals < myGoals && Math.random() > 0.65) oppGoals = Math.min(oppGoals + 1, myGoals);

  /* select scorers from squad */
  const attackers = mySquad.filter(p => ['ST','LW','RW','CF','CAM'].includes(p.position));
  const midfielders = mySquad.filter(p => ['CM','CDM','LM','RM'].includes(p.position));
  const goalPool = attackers.length ? [...attackers, ...attackers, ...midfielders] : mySquad;

  const goals = [];
  const assists = [];
  const myYellowIds = [];
  const myRedIds = [];

  for (let g = 0; g < myGoals; g++) {
    const scorer = pick(goalPool);
    const assistCandidates = mySquad.filter(p => p.id !== scorer.id);
    const assistor = Math.random() > 0.3 && assistCandidates.length ? pick(assistCandidates) : null;
    goals.push({ scorerId: scorer.id, scorerName: scorer.name, assistId: assistor?.id, assistName: assistor?.name });
    if (assistor) assists.push({ assistId: assistor.id });
  }

  /* yellow/red cards */
  mySquad.forEach(p => {
    if (Math.random() < 0.07) myYellowIds.push(p.id);
    if (Math.random() < 0.012) myRedIds.push(p.id);
  });

  /* shots & possession */
  const myShots    = myGoals * rnd(3, 5) + rnd(2, 6);
  const oppShots   = oppGoals * rnd(3, 5) + rnd(1, 5);
  const myOnTarget = Math.max(myGoals, Math.round(myShots * 0.45));
  const oppOnTarget= Math.max(oppGoals, Math.round(oppShots * 0.42));
  const myPoss     = clamp(Math.round(50 + (myPos.mid - oppPos.mid) * 0.4 + tact.possMod + rnd(-5, 5)), 30, 70);
  const oppPoss    = 100 - myPoss;
  const myCorners  = rnd(2, 9);
  const oppCorners = rnd(1, 8);
  const myFouls    = rnd(6, 16);
  const oppFouls   = rnd(5, 15);

  const myXG  = calcXG(myShots, myOnTarget, myGoals);
  const oppXG = calcXG(oppShots, oppOnTarget, oppGoals);

  /* player ratings */
  const ratedSquad = generatePlayerRatings(mySquad, goals, assists, myYellowIds, myRedIds);
  const motm = ratedSquad.slice().sort((a, b) => b.matchRating - a.matchRating)[0];

  /* ─── Commentary event stream ─── */
  const events = [];

  /* minute pools */
  const firstHalfMins  = [6,9,13,17,22,26,30,34,38,42,44].sort(() => Math.random() - 0.5);
  const secondHalfMins = [47,51,55,58,62,66,70,74,78,82,86,89].sort(() => Math.random() - 0.5);

  let myScored  = 0;
  let oppScored = 0;
  let myHadRed  = false;

  const oppName = oppClubName?.split(' ')[0] || 'Opponent';

  /* assign goal minutes */
  const goalMins = [];
  const oppGoalMins = [];
  const allMins = [...firstHalfMins, ...secondHalfMins];

  const shuffledMins = [...allMins].sort(() => Math.random() - 0.5);
  for (let i = 0; i < myGoals && i < shuffledMins.length; i++)     goalMins.push(shuffledMins[i]);
  for (let i = myGoals; i < myGoals + oppGoals && i < shuffledMins.length; i++) oppGoalMins.push(shuffledMins[i]);

  /* build first half */
  firstHalfMins.forEach(min => {
    if (goalMins.includes(min) && myScored < myGoals) {
      const g = goals[myScored];
      events.push({ min, type: 'goal', side: 'my', text: C.goal(g.scorerName.split(' ').pop(), min), scorerName: g.scorerName, assistName: g.assistName });
      myScored++;
    } else if (oppGoalMins.includes(min) && oppScored < oppGoals) {
      events.push({ min, type: 'goalOpp', side: 'opp', text: C.goalOpp(oppName, min) });
      oppScored++;
    } else {
      const r = Math.random();
      if (r < 0.06 && !myHadRed && Math.random() < 0.012) {
        const victim = pick(mySquad);
        myHadRed = true;
        myRedIds.push(victim.id);
        events.push({ min, type: 'redCard', side: 'my', text: C.redCard(victim.name.split(' ').pop(), min) });
      } else if (r < 0.08) {
        events.push({ min, type: 'redCardOpp', side: 'opp', text: C.redOpp(oppName, min) });
      } else if (r < 0.14) {
        const victim = pick(mySquad);
        events.push({ min, type: 'yellowCard', side: 'my', text: C.yellowCard(victim.name.split(' ').pop(), min) });
      } else if (r < 0.20) {
        events.push({ min, type: 'yellowOpp', side: 'opp', text: C.yellowOpp(oppName, min) });
      } else if (r < 0.26) {
        events.push({ min, type: 'miss', side: 'my', text: C.miss(min) });
      } else if (r < 0.32) {
        events.push({ min, type: 'missOpp', side: 'opp', text: C.missOpp(min) });
      } else if (r < 0.36) {
        events.push({ min, type: 'wonderSave', side: 'my', text: C.wonderSave(min) });
      } else if (r < 0.39) {
        events.push({ min, type: 'var', side: 'neutral', text: C.varCheck(min) });
      } else if (r < 0.44) {
        events.push({ min, type: 'atmosphere', side: 'neutral', text: C.atmosphere(min) });
      } else if (r < 0.56) {
        events.push({ min, type: 'foul', side: 'neutral', text: C.foul(min) });
      } else {
        events.push({ min, type: 'info', side: 'neutral', text: C.pressure(min) });
      }
    }
  });

  events.push({ min: 45, type: 'halftime', side: 'neutral', text: C.halfTime() });

  /* build second half */
  secondHalfMins.forEach(min => {
    if (goalMins.includes(min) && myScored < myGoals) {
      const g = goals[myScored];
      events.push({ min, type: 'goal', side: 'my', text: C.goal(g.scorerName.split(' ').pop(), min), scorerName: g.scorerName, assistName: g.assistName });
      myScored++;
    } else if (oppGoalMins.includes(min) && oppScored < oppGoals) {
      events.push({ min, type: 'goalOpp', side: 'opp', text: C.goalOpp(oppName, min) });
      oppScored++;
    } else {
      const r = Math.random();
      if (r < 0.06) {
        events.push({ min, type: 'injury', side: 'my', text: C.injury(pick(mySquad).name.split(' ').pop(), min) });
      } else if (r < 0.10) {
        events.push({ min, type: 'miss', side: 'my', text: C.miss(min) });
      } else if (r < 0.14) {
        events.push({ min, type: 'missOpp', side: 'opp', text: C.missOpp(min) });
      } else if (r < 0.18) {
        const victim = pick(mySquad);
        events.push({ min, type: 'yellowCard', side: 'my', text: C.yellowCard(victim.name.split(' ').pop(), min) });
      } else if (r < 0.22) {
        events.push({ min, type: 'yellowOpp', side: 'opp', text: C.yellowOpp(oppName, min) });
      } else if (r < 0.25) {
        events.push({ min, type: 'wonderSave', side: 'my', text: C.wonderSave(min) });
      } else if (r < 0.28) {
        events.push({ min, type: 'var', side: 'neutral', text: C.varCheck(min) });
      } else if (r < 0.34) {
        events.push({ min, type: 'atmosphere', side: 'neutral', text: C.atmosphere(min) });
      } else if (r < 0.44) {
        events.push({ min, type: 'foul', side: 'neutral', text: C.foul(min) });
      } else {
        events.push({ min, type: 'info', side: 'neutral', text: C.pressure(min) });
      }
    }
  });

  events.push({ min: 90, type: 'fulltime', side: 'neutral', text: C.fullTime() });

  /* sort by minute */
  events.sort((a, b) => a.min - b.min);

  return {
    myGoals,
    oppGoals,
    goals,          // [{ scorerId, scorerName, assistName, min }]
    events,         // full commentary stream
    ratedSquad,     // squad with matchRating
    motm,
    stats: {
      myShots, oppShots, myOnTarget, oppOnTarget,
      myPoss, oppPoss,
      myCorners, oppCorners,
      myFouls, oppFouls,
      myXG, oppXG,
      myYellowCount: myYellowIds.length,
      oppYellowCount: rnd(0, 3),
      myRedCount: myRedIds.length,
      oppRedCount: Math.random() < 0.015 ? 1 : 0,
    },
  };
}