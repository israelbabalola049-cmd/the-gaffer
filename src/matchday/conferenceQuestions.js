/* ═══════════════════════════════════════════════════════
   THE GAFFER — Press Conference Questions v2
   Pre-match and post-match question pools.
   Each question has 4 answers. Effects are hidden.
   2 answers are "good" (randomised per session).
═══════════════════════════════════════════════════════ */

/* Effect values */
const GOOD   = { morale: 4,  managerRating: 1  };
const GREAT  = { morale: 6,  managerRating: 2  };
const BAD    = { morale: -6, managerRating: -2 };
const NEUTRAL= { morale: 1,  managerRating: 0  };
const BACK   = { morale: -3, managerRating: -1 };

/* ─── PRE-MATCH QUESTIONS ─── */
export const PRE_MATCH_QUESTIONS = [
  {
    id: 'pm1',
    question: 'Your opponents are in excellent form. Are you worried about what they bring to the table?',
    answers: [
      { text: 'Worried? No. Respectful? Absolutely. We know what they are capable of.', effect: GOOD },
      { text: 'Look, we focus on ourselves. What they do is their business.', effect: NEUTRAL },
      { text: 'Not worried at all. We are the better team and we will show that.', effect: BACK },
      { text: 'I think every match brings challenges. We are well prepared for this one.', effect: GREAT },
    ],
  },
  {
    id: 'pm2',
    question: 'There are reports that one of your key players is unsettled. How does that affect preparation?',
    answers: [
      { text: 'That is club business and I will not be discussing it publicly.', effect: GOOD },
      { text: 'There are no issues in my dressing room. We are fully focused.', effect: NEUTRAL },
      { text: 'These stories are completely fabricated. Whoever leaked this will answer to me.', effect: BAD },
      { text: 'Every player in my squad is a professional. They will give everything tomorrow.', effect: GREAT },
    ],
  },
  {
    id: 'pm3',
    question: 'You have lost your last two matches. What has changed in training this week?',
    answers: [
      { text: 'We went back to basics. Shape, intensity, and belief. Simple as that.', effect: GREAT },
      { text: 'The performances have not been as bad as the results suggest.', effect: NEUTRAL },
      { text: 'Nothing has changed. We trust the process and the results will follow.', effect: BACK },
      { text: 'We watched the footage, identified the issues, and worked hard to fix them.', effect: GOOD },
    ],
  },
  {
    id: 'pm4',
    question: 'This is being called a must-win game. Do you agree with that label?',
    answers: [
      { text: 'Every game is must-win when you want to be at the top. So yes.', effect: GOOD },
      { text: 'I do not like that pressure framing. We take every game the same way.', effect: NEUTRAL },
      { text: 'Absolutely. We need the three points and we will go get them.', effect: GREAT },
      { text: 'Must-win is a strong word. We need to play well and see what happens.', effect: BACK },
    ],
  },
  {
    id: 'pm5',
    question: 'Your striker has been silent in front of goal for four matches. Is he under pressure?',
    answers: [
      { text: 'Strikers go through dry spells. His work rate has been excellent. Goals will come.', effect: GOOD },
      { text: 'I back him completely. He is one of the best in this league.', effect: GREAT },
      { text: 'He needs to do better. He knows that and so does everyone else.', effect: BAD },
      { text: 'We are working with him individually. He is close to something big.', effect: NEUTRAL },
    ],
  },
  {
    id: 'pm6',
    question: 'There are suggestions the board is not fully behind you. How do you respond to that?',
    answers: [
      { text: 'My relationship with the board is strong. We speak regularly and we are aligned.', effect: GOOD },
      { text: 'I do not deal in rumours. I focus on the pitch.', effect: NEUTRAL },
      { text: 'Those suggestions are completely false and frankly disrespectful.', effect: BAD },
      { text: 'Results speak for themselves. When we win, everyone is happy.', effect: GREAT },
    ],
  },
  {
    id: 'pm7',
    question: 'Some fans think you are being too conservative with your tactics. Are they right?',
    answers: [
      { text: 'The fans are entitled to their views. I respect that. But I make the tactical decisions.', effect: GOOD },
      { text: 'Maybe they have a point. We will be more adventurous tomorrow.', effect: GREAT },
      { text: 'The fans want wins. If conservative gets us wins, everyone is happy.', effect: NEUTRAL },
      { text: 'I do not manage based on social media comments.', effect: BACK },
    ],
  },
  {
    id: 'pm8',
    question: 'How would you describe the mood in the dressing room going into this one?',
    answers: [
      { text: 'Focused, hungry, and ready. Best I have seen it all season.', effect: GREAT },
      { text: 'Good. The lads are professional and they prepare properly every week.', effect: NEUTRAL },
      { text: 'I do not discuss the dressing room publicly. That stays internal.', effect: GOOD },
      { text: 'There is real excitement. Everyone wants to be part of tomorrow.', effect: GOOD },
    ],
  },
  {
    id: 'pm9',
    question: 'Your opponents have an ex-player who knows your system well. Does that concern you?',
    answers: [
      { text: 'He knows our old system. We have evolved since he left.', effect: GREAT },
      { text: 'He is a quality player but he is not playing for us anymore. Simple.', effect: NEUTRAL },
      { text: 'Every player who leaves takes some knowledge with them. We adapt.', effect: GOOD },
      { text: 'That is not something I am going to lose sleep over.', effect: BACK },
    ],
  },
  {
    id: 'pm10',
    question: 'This club knocked you out of a cup competition last season. Is revenge a motivation?',
    answers: [
      { text: 'Revenge is a strong word but this squad remembers. We have long memories.', effect: GREAT },
      { text: 'We do not need external motivation. We want the three points. Full stop.', effect: GOOD },
      { text: 'That result still hurts. The players are fired up about it, I will tell you that.', effect: GOOD },
      { text: 'Last season is gone. We focus on what is in front of us.', effect: NEUTRAL },
    ],
  },
  {
    id: 'pm11',
    question: 'Your captain has been carrying a knock. Will he play?',
    answers: [
      { text: 'He is a warrior. If he can walk, he will want to play. We will assess him.', effect: NEUTRAL },
      { text: 'He has been cleared to play. He will be fine.', effect: GOOD },
      { text: 'I will not be revealing my team selection ahead of the match.', effect: GOOD },
      { text: 'We are not taking risks with him. Results matter but so does his welfare.', effect: GREAT },
    ],
  },
  {
    id: 'pm12',
    question: 'How important is home advantage in a game like this?',
    answers: [
      { text: 'It is massive. Our fans are the twelfth man and they will make the difference.', effect: GREAT },
      { text: 'Important, but football is decided on the pitch not in the stands.', effect: NEUTRAL },
      { text: 'I believe more in quality than atmosphere.', effect: BACK },
      { text: 'Playing at home gives us an edge. We want to use that to the fullest.', effect: GOOD },
    ],
  },
];

/* ─── POST-MATCH QUESTIONS ─── */
export const POST_MATCH_QUESTIONS = [
  /* win-specific */
  {
    id: 'post_w1',
    condition: 'win',
    question: 'That was a dominant performance. What was the key to the victory?',
    answers: [
      { text: 'Organisation and belief. We executed the gameplan perfectly.', effect: GREAT },
      { text: 'The players deserve all the credit. They were outstanding today.', effect: GOOD },
      { text: 'We were better in every department. Simple.', effect: NEUTRAL },
      { text: 'Hard work on the training ground paid off. You get out what you put in.', effect: GOOD },
    ],
  },
  {
    id: 'post_w2',
    condition: 'win',
    question: 'Is this a turning point in your season?',
    answers: [
      { text: 'It is a statement. We mean business and the table will reflect that.', effect: GREAT },
      { text: 'We take it one game at a time. Three points is three points.', effect: NEUTRAL },
      { text: 'I have been saying all along we are capable of this. Now people see it.', effect: BACK },
      { text: 'It is a big win. We need to build momentum now and keep going.', effect: GOOD },
    ],
  },
  {
    id: 'post_w3',
    condition: 'win',
    question: 'Your striker was exceptional today. What has changed for him?',
    answers: [
      { text: 'Confidence. When strikers are flying, you get out of their way and let them go.', effect: GREAT },
      { text: 'He has been working hard. Today was his reward.', effect: GOOD },
      { text: 'I told him this week he would score. He needed to hear it from me.', effect: NEUTRAL },
      { text: 'He is a top player. Top players deliver in big moments.', effect: GOOD },
    ],
  },
  /* loss-specific */
  {
    id: 'post_l1',
    condition: 'loss',
    question: 'That was a tough afternoon. Where did it go wrong?',
    answers: [
      { text: 'We made individual errors and a team of that quality punishes you. Lessons learned.', effect: GOOD },
      { text: 'The result does not reflect how we played. We deserved more.', effect: BACK },
      { text: 'I am not going to sit here and make excuses. We were not good enough today.', effect: GREAT },
      { text: 'It is a setback but setbacks build character. We will respond.', effect: GOOD },
    ],
  },
  {
    id: 'post_l2',
    condition: 'loss',
    question: 'The performance raised serious questions. Are your tactics wrong for this squad?',
    answers: [
      { text: 'My tactics are not wrong. The execution let us down today.', effect: NEUTRAL },
      { text: 'Every manager reassesses after a defeat. I will be doing that tonight.', effect: GREAT },
      { text: 'Tactical questions after one loss? Give me a break.', effect: BAD },
      { text: 'It is fair to ask. I will look at the footage and make whatever changes are needed.', effect: GOOD },
    ],
  },
  {
    id: 'post_l3',
    condition: 'loss',
    question: 'Your striker missed two clear chances. Is his confidence shot?',
    answers: [
      { text: 'He will be the first to admit he needs to do better. I back him to bounce back.', effect: GOOD },
      { text: 'Strikers miss chances. He is still the right man for us.', effect: NEUTRAL },
      { text: 'He was let down by the service today. I would not blame him alone.', effect: GREAT },
      { text: 'That is not a conversation I am having publicly about one of my players.', effect: GOOD },
    ],
  },
  /* draw-specific */
  {
    id: 'post_d1',
    condition: 'draw',
    question: 'A point from that game — are you satisfied?',
    answers: [
      { text: 'We came for three. A point is not what we wanted but we move on.', effect: GOOD },
      { text: 'Given how the game went, I will take that. It could have gone either way.', effect: NEUTRAL },
      { text: 'Satisfied? No. But we showed resilience and that matters.', effect: GREAT },
      { text: 'A point keeps us in contention. We focus on the next one.', effect: GOOD },
    ],
  },
  {
    id: 'post_d2',
    condition: 'draw',
    question: 'You dominated large spells but could not find a winner. Is the lack of clinical edge a worry?',
    answers: [
      { text: 'It is something we are working on. We create enough chances — we need to convert them.', effect: GREAT },
      { text: 'We will create chances again in the next game. The goals will come.', effect: NEUTRAL },
      { text: 'I would rather have those chances and not score than not have them at all.', effect: BACK },
      { text: 'Fair point. We need more cutting edge in the final third.', effect: GOOD },
    ],
  },
  /* generic post-match */
  {
    id: 'post_g1',
    condition: 'any',
    question: 'The red card was a massive moment. How did it change your thinking?',
    answers: [
      { text: 'When you go down to ten men you have to be pragmatic. We reorganised quickly.', effect: GOOD },
      { text: 'It was a stupid challenge and it cost us. That cannot happen.', effect: NEUTRAL },
      { text: 'A red card is always a blow, but the players showed great character to respond.', effect: GREAT },
      { text: 'Those are moments that define seasons. We learned something today.', effect: GOOD },
    ],
  },
  {
    id: 'post_g2',
    condition: 'any',
    question: 'The fans gave you tremendous support today. What does that mean to you?',
    answers: [
      { text: 'Everything. They are the heartbeat of this club. We play for them.', effect: GREAT },
      { text: 'The fans are always there for us. We need to repay that faith with results.', effect: GOOD },
      { text: 'I love this fanbase. Their energy in the second half pushed us over the line.', effect: GOOD },
      { text: 'We appreciate them. Now we need to give them more moments like this.', effect: NEUTRAL },
    ],
  },
  {
    id: 'post_g3',
    condition: 'any',
    question: 'Man of the match was outstanding. How important is it having that quality in your squad?',
    answers: [
      { text: 'He is world class. When he performs like that the whole team rises with him.', effect: GREAT },
      { text: 'We have quality throughout this squad. Today was his day. Next week it could be someone else.', effect: GOOD },
      { text: 'I am more proud of the collective than any individual today.', effect: NEUTRAL },
      { text: 'He was brilliant. He deserves all the praise. What a player.', effect: GOOD },
    ],
  },
  {
    id: 'post_g4',
    condition: 'any',
    question: 'Your next fixture is against a top side. Is this result good or bad preparation for that?',
    answers: [
      { text: 'It gives us confidence. Or a wake-up call. Either way, we are ready.', effect: GREAT },
      { text: 'Every result teaches you something. We will be ready.', effect: GOOD },
      { text: 'We do not look ahead. Next game is next game.', effect: NEUTRAL },
      { text: 'This result tells me exactly what we need to work on before that match.', effect: GOOD },
    ],
  },
];

/* ─── Question picker ─── */
export function pickQuestions(pool, condition, count = 3) {
  /* Questions with no 'condition' field (e.g. PRE_MATCH_QUESTIONS) are
     always eligible. Questions with a condition only match if it equals
     the requested condition or is explicitly 'any'. */
  const eligible = pool.filter(q =>
    q.condition === undefined || q.condition === condition || q.condition === 'any'
  );
  const shuffled = eligible.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(q => {
    /* randomise which 2 answers are "good" each session */
    const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const goodIdx = [indices[0], indices[1]];
    return {
      ...q,
      answers: q.answers.map((a, i) => ({
        ...a,
        /* re-weight: always assign two good slots randomly */
        effect: goodIdx.includes(i) ? (Math.random() > 0.4 ? GOOD : GREAT) : (Math.random() > 0.5 ? NEUTRAL : BAD),
      })),
    };
  });
}