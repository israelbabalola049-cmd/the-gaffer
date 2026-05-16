/* ═══════════════════════════════════════════════════════
   THE GAFFER — PostMatch.jsx
   Post-match screen: result hero, stats, player ratings,
   MOTM, optional post-match press conference, continue.
   Props:
     fixture      – { id, home, away, isHome, competition }
     myClubName   – string
     myGoals      – number
     oppGoals     – number
     squad        – full squad array
     events       – commentary event array from live sim
     myXg         – number
     oppXg        – number
     lineup       – array of 11 players who started
     onContinue   – fn() — save result and go back to calendar
═══════════════════════════════════════════════════════ */
import { useState, useMemo } from 'react';

/* ─── Competition config (self-contained, no external import) ─── */
const COMP = {
  'Premier League':    { color: '#3d0064', accent: '#a855f7' },
  'La Liga':           { color: '#c2410c', accent: '#f97316' },
  'Bundesliga':        { color: '#d20515', accent: '#ef4444' },
  'Serie A':           { color: '#1a1a6b', accent: '#6366f1' },
  'Ligue 1':           { color: '#001f5f', accent: '#3b82f6' },
  'Champions League':  { color: '#1a3a6b', accent: '#fbbf24' },
  'Europa League':     { color: '#7c2d12', accent: '#fb923c' },
  'Conference League': { color: '#0a5c36', accent: '#34d399' },
  'FA Cup':            { color: '#003087', accent: '#60a5fa' },
  'Carabao Cup':       { color: '#003087', accent: '#4ade80' },
  'Cup':               { color: '#c9a227', accent: '#fbbf24' },
};
const getComp = n => COMP[n] || { color: '#1a1a1a', accent: '#555' };

/* ─── Post-match conference questions (inline) ─── */
const POST_MATCH_QUESTIONS = {
  win: [
    {
      question: "A convincing performance. What was the key to unlocking them today?",
      answers: [
        { text: "Pressing high and winning second balls. We suffocated their build-up.", effect: { morale: 5, managerRating: 1 } },
        { text: "We were just better. Simple as that.", effect: { morale: 1, managerRating: 0 } },
        { text: "The tactical setup gave us overloads on the left — we exploited that.", effect: { morale: 4, managerRating: 2 } },
        { text: "Honestly? A bit of luck plus quality. Hard to stop.", effect: { morale: -1, managerRating: -1 } },
      ],
    },
    {
      question: "Your striker was anonymous for 70 minutes then scored. Happy with that?",
      answers: [
        { text: "He stayed mentally sharp and punished them when it mattered. That's elite.", effect: { morale: 5, managerRating: 1 } },
        { text: "No, he needs to be more involved. I'll be having that conversation.", effect: { morale: -2, managerRating: 0 } },
        { text: "Strikers live for those moments. He delivered. That's all I ask.", effect: { morale: 4, managerRating: 1 } },
        { text: "It worried me at half-time, I'll be honest. But he answered.", effect: { morale: 1, managerRating: 0 } },
      ],
    },
    {
      question: "Can you sustain this level for the rest of the season?",
      answers: [
        { text: "We train for exactly this. Consistency is the hallmark of a winning team.", effect: { morale: 4, managerRating: 1 } },
        { text: "One game at a time. Today means nothing if we drop points next week.", effect: { morale: 3, managerRating: 1 } },
        { text: "Hard to say. We'll take it game by game.", effect: { morale: 0, managerRating: 0 } },
        { text: "I don't want to set expectations. Football can change quickly.", effect: { morale: -1, managerRating: -1 } },
      ],
    },
  ],
  loss: [
    {
      question: "A tough afternoon. Was that the worst performance of your tenure?",
      answers: [
        { text: "Not at all. We had chances — the result is harsh given the performance.", effect: { morale: 2, managerRating: 0 } },
        { text: "Yes. I won't hide from that. We simply weren't good enough today.", effect: { morale: -4, managerRating: -2 } },
        { text: "Results can be deceiving. We played well in phases.", effect: { morale: 1, managerRating: 0 } },
        { text: "I'll need to see it back. I'm too frustrated to be fair right now.", effect: { morale: -2, managerRating: -1 } },
      ],
    },
    {
      question: "Three points dropped. Is the dressing room still behind you?",
      answers: [
        { text: "100%. Losing together is what defines a squad. We'll come back stronger.", effect: { morale: 3, managerRating: 1 } },
        { text: "I'll ask them. It's a question I can't answer for them.", effect: { morale: -3, managerRating: -2 } },
        { text: "I have total faith in this group. One result doesn't break us.", effect: { morale: 2, managerRating: 1 } },
        { text: "All I can do is lead. The rest is up to them.", effect: { morale: -1, managerRating: 0 } },
      ],
    },
    {
      question: "Where does the blame lie for today's result?",
      answers: [
        { text: "It starts with me. I set the team up and the setup didn't work today.", effect: { morale: 3, managerRating: 1 } },
        { text: "Individual errors cost us. I won't point fingers publicly though.", effect: { morale: -2, managerRating: -1 } },
        { text: "It's collective. We win together, we lose together.", effect: { morale: 2, managerRating: 1 } },
        { text: "I'd rather not assign blame right now. Let me process this first.", effect: { morale: -1, managerRating: 0 } },
      ],
    },
  ],
  draw: [
    {
      question: "A point from this — satisfied or frustrated?",
      answers: [
        { text: "Both. We had enough to win it but we defended well when we needed to.", effect: { morale: 2, managerRating: 1 } },
        { text: "Satisfied. Against this opposition, a point is a good result.", effect: { morale: 1, managerRating: 0 } },
        { text: "Frustrated. We let them back in after controlling the first half.", effect: { morale: 2, managerRating: 1 } },
        { text: "Neither. We'll move on and focus on the next one.", effect: { morale: -1, managerRating: 0 } },
      ],
    },
    {
      question: "The dropped points could be costly. Are you worried?",
      answers: [
        { text: "Every dropped point matters at this level. We know that. We'll respond.", effect: { morale: 3, managerRating: 1 } },
        { text: "It's one result. I'm not going to catastrophise.", effect: { morale: 0, managerRating: 0 } },
        { text: "We'll assess at the end of the season. Right now the focus is recovery.", effect: { morale: 1, managerRating: 0 } },
        { text: "I'm not in the business of worrying. I'm in the business of winning.", effect: { morale: -1, managerRating: -1 } },
      ],
    },
  ],
};

function pickQuestions(pool, condition, count) {
  const list = pool[condition] || pool.draw;
  return [...list].sort(() => Math.random() - 0.5).slice(0, count).map(q => ({
    ...q,
    answers: [...q.answers].sort(() => Math.random() - 0.5),
  }));
}

/* ─── SVG badge URLs ─── */
const CLUB_BADGE_URL = {
  'Manchester City':   'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'Liverpool':         'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'Arsenal':           'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  'Chelsea':           'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'Manchester United': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  'Tottenham':         'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  'Aston Villa':       'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_FC_new_crest.svg',
  'Brighton':          'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_FC_logo.svg',
  'Bayern Munich':     'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'Real Madrid':       'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'Barcelona':         'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'PSG':               'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  'AC Milan':          'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  'Inter Milan':       'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  'Juventus':          'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon_%28black%29.svg',
  'Atletico Madrid':   'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  'Borussia Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'Bayer Leverkusen':  'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
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

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function ClubBadge({ name, size = 44 }) {
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
      width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.28, color, letterSpacing: 0.5,
    }}>{abbr}</div>
  );
}

/* ─── Star rating display ─── */
function RatingBadge({ rating }) {
  const color = rating >= 8.0 ? '#00e87a' : rating >= 7.0 ? '#a3e635' : rating >= 6.0 ? '#f5c518' : '#ff3b5c';
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
      background: `${color}18`, border: `1.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 900, color,
    }}>{rating.toFixed(1)}</div>
  );
}

/* ─── Stat row ─── */
function StatRow({ label, myVal, oppVal, highlight }) {
  const myN = parseFloat(String(myVal).replace('%', '')) || 0;
  const oppN = parseFloat(String(oppVal).replace('%', '')) || 0;
  const total = myN + oppN || 1;
  const myPct = Math.round((myN / total) * 100);
  const myColor = highlight || '#00e87a';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: myColor, width: 44 }}>{myVal}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', flex: 1, textAlign: 'center' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', width: 44, textAlign: 'right' }}>{oppVal}</span>
      </div>
      <div style={{ height: 2, background: 'var(--bg-5)', borderRadius: 1, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${myPct}%`, background: myColor, transition: 'width 0.6s ease', borderRadius: '1px 0 0 1px' }} />
        <div style={{ flex: 1, background: '#444' }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   POST-MATCH PRESS CONFERENCE
═══════════════════════════════════════════════ */
function PostMatchConference({ result, motmName, fixture, onDone }) {
  const condition = result === 'W' ? 'win' : result === 'L' ? 'loss' : 'draw';
  const questions = useMemo(() => pickQuestions(POST_MATCH_QUESTIONS, condition, 3), [condition]);

  const [qIdx, setQIdx]             = useState(0);
  const [answered, setAnswered]     = useState(null);
  const [showEffect, setShowEffect] = useState(false);
  const [totals, setTotals]         = useState({ morale: 0, managerRating: 0 });
  const [finished, setFinished]     = useState(false);

  const current = questions[qIdx];
  const resultLabel = result === 'W' ? 'Victory' : result === 'L' ? 'Defeat' : 'Draw';
  const resultColor = result === 'W' ? '#00e87a' : result === 'L' ? '#ff3b5c' : '#f5c518';

  function handleAnswer(ans) {
    if (answered) return;
    setAnswered(ans);
    setShowEffect(true);
    const newTotals = {
      morale:        totals.morale + ans.effect.morale,
      managerRating: totals.managerRating + ans.effect.managerRating,
    };
    setTimeout(() => {
      setShowEffect(false);
      setAnswered(null);
      if (qIdx < questions.length - 1) {
        setQIdx(q => q + 1);
        setTotals(newTotals);
      } else {
        setTotals(newTotals);
        setFinished(true);
      }
    }, 1400);
  }

  /* Conference done summary */
  if (finished) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', gap: 28, animation: 'fadeIn 0.4s ease',
      }}>
        <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Conference Complete</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>Press done</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Your words carry weight. The dressing room is listening.
          </div>
        </div>

        {/* Effects summary */}
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900, color: totals.morale >= 0 ? '#00e87a' : '#ff3b5c', lineHeight: 1 }}>
              {totals.morale >= 0 ? '+' : ''}{totals.morale}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 }}>Squad Morale</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900, color: totals.managerRating >= 0 ? '#00e87a' : '#ff3b5c', lineHeight: 1 }}>
              {totals.managerRating >= 0 ? '+' : ''}{totals.managerRating}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 }}>Manager Rating</div>
          </div>
        </div>

        <button onClick={() => onDone(totals)} style={{
          width: '100%', maxWidth: 320, padding: '15px', borderRadius: 8, border: 'none',
          background: 'var(--green)', color: '#000',
          fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 900,
          letterSpacing: 2, cursor: 'pointer',
        }}>
          CONTINUE
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes effectPop{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* Header */}
      <div style={{ padding: '18px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 20, borderRadius: 2, background: resultColor }} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Post-Match Conference</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>
            Question {qIdx + 1} of {questions.length}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {questions.map((_, i) => (
            <div key={i} style={{ width: 20, height: 3, borderRadius: 2, background: i <= qIdx ? resultColor : 'var(--bg-5)' }} />
          ))}
        </div>
      </div>

      {/* Context chip */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${resultColor}14`, border: `1px solid ${resultColor}30`, borderRadius: 6, padding: '4px 10px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: resultColor, letterSpacing: 2, textTransform: 'uppercase' }}>
            After a {resultLabel}
          </span>
        </div>
      </div>

      {/* Journalist header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-4)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>Press Room</div>
        </div>
      </div>

      {/* Question */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '4px 10px 10px 10px', padding: '16px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.65, fontStyle: 'italic' }}>
            "{current.question}"
          </div>
        </div>
      </div>

      {/* Effect flash */}
      {showEffect && answered && (
        <div style={{
          textAlign: 'center', padding: '12px 16px',
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: 1,
          color: answered.effect.morale > 0 ? '#00e87a' : answered.effect.morale < -2 ? '#ff3b5c' : '#f5c518',
          animation: 'effectPop 0.3s ease',
        }}>
          {answered.effect.morale > 2 ? '+ Squad Morale' : answered.effect.morale > 0 ? '+ Morale' : answered.effect.morale < -3 ? '- Morale Hit' : '~ Neutral'}
          {answered.effect.managerRating !== 0 && (
            <span style={{ marginLeft: 14, color: answered.effect.managerRating > 0 ? '#00e87a' : '#ff3b5c' }}>
              {answered.effect.managerRating > 0 ? '+ Rating' : '- Rating'}
            </span>
          )}
        </div>
      )}

      {/* Answers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px 24px', flex: 1 }}>
        {current.answers.map((ans, i) => (
          <button key={i} onClick={() => handleAnswer(ans)} disabled={!!answered} style={{
            background: answered === ans
              ? (ans.effect.morale > 0 ? 'rgba(0,232,122,0.12)' : ans.effect.morale < -2 ? 'rgba(255,59,92,0.12)' : 'rgba(245,197,24,0.10)')
              : 'var(--bg-3)',
            border: `1px solid ${answered === ans
              ? (ans.effect.morale > 0 ? 'rgba(0,232,122,0.4)' : ans.effect.morale < -2 ? 'rgba(255,59,92,0.4)' : 'rgba(245,197,24,0.4)')
              : 'var(--border)'}`,
            borderRadius: 8, padding: '13px 14px', textAlign: 'left',
            fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-dim)',
            lineHeight: 1.55, cursor: answered ? 'default' : 'pointer',
            transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent',
            opacity: answered && answered !== ans ? 0.45 : 1,
          }}
            onMouseEnter={e => { if (!answered) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { if (!answered) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {ans.text}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PostMatch COMPONENT
═══════════════════════════════════════════════ */
export default function PostMatch({
  fixture,
  myClubName,
  myGoals,
  oppGoals,
  squad,
  events,
  myXg,
  oppXg,
  lineup,
  onContinue,
}) {
  const [view, setView] = useState('report'); // report | conference

  const myName  = fixture.isHome ? fixture.home : fixture.away;
  const oppName = fixture.isHome ? fixture.away : fixture.home;

  const result      = myGoals > oppGoals ? 'W' : myGoals === oppGoals ? 'D' : 'L';
  const resultLabel = result === 'W' ? 'Victory' : result === 'D' ? 'Draw' : 'Defeat';
  const resultColor = result === 'W' ? '#00e87a' : result === 'D' ? '#f5c518' : '#ff3b5c';

  const myColor     = CLUB_COLOR[myClubName] || '#00e87a';
  const compAccent  = getComp(fixture?.competition).accent;

  /* ─── Player ratings derived from events ─── */
  const playerRatings = useMemo(() => {
    const base = lineup?.length ? lineup : (squad?.slice(0, 11) || []);
    return base.map(p => {
      const lastName = p.name.split(' ').pop();
      // Count goals from events
      const scored = events?.filter(
        e => e.type === 'goal' && e.side === 'my' &&
             (e.scorerName === p.name || e.scorer === lastName || e.scorer === p.name)
      ).length || 0;
      // Count assists
      const assisted = events?.filter(
        e => e.assistName === p.name
      ).length || 0;
      // Cards
      const yellowed = events?.filter(
        e => (e.type === 'yellowCard') && e.text?.includes(lastName)
      ).length || 0;
      const redded = events?.filter(
        e => (e.type === 'redCard') && e.text?.includes(lastName)
      ).length || 0;

      let rating = 6.0 + Math.random() * 1.0;
      rating += scored  * 0.9;
      rating += assisted * 0.5;
      rating -= yellowed * 0.3;
      rating -= redded  * 1.2;
      // Overall quality bias (small)
      rating += (p.overall - 75) / 40;
      rating = Math.min(9.9, Math.max(4.5, rating));

      return {
        ...p,
        matchRating: parseFloat(rating.toFixed(1)),
        goals: scored,
        assists: assisted,
        cards: yellowed + redded,
      };
    }).sort((a, b) => b.matchRating - a.matchRating);
  }, [lineup, squad, events]);

  const motm = playerRatings[0] || null;

  /* ─── Stats (some from events, rest generated) ─── */
  const stats = useMemo(() => {
    const myYellows = events?.filter(e => e.type === 'yellowCard').length || rnd(0, 2);
    const myReds    = events?.filter(e => e.type === 'redCard').length    || 0;
    const myShots   = myGoals * rnd(3, 5) + rnd(2, 6);
    const oppShots  = oppGoals * rnd(3, 5) + rnd(1, 5);
    const mySot     = Math.max(myGoals, Math.round(myShots * 0.44));
    const oppSot    = Math.max(oppGoals, Math.round(oppShots * 0.40));
    const myPoss    = rnd(36, 64);
    const oppPoss   = 100 - myPoss;
    const myFouls   = rnd(6, 16);
    const oppFouls  = rnd(5, 15);
    const myCorners = rnd(2, 9);
    const oppCorners= rnd(1, 8);
    return {
      myShots, oppShots, mySot, oppSot,
      myPoss, oppPoss, myFouls, oppFouls,
      myCorners, oppCorners, myYellows,
      oppYellows: rnd(0, 3),
      myReds, oppReds: Math.random() < 0.015 ? 1 : 0,
    };
  }, [events, myGoals, oppGoals]);

  /* ─── Goal scorers list ─── */
  const scorers = useMemo(() => {
    return events?.filter(e => e.type === 'goal' && e.side === 'my').map(e => ({
      name: e.scorerName || e.scorer || myName,
      min: e.min,
      assist: e.assistName || null,
    })) || [];
  }, [events, myName]);

  /* ─── Conference done handler ─── */
  function handleConferenceDone(totals) {
    onContinue({ confBonus: totals });
  }

  /* ─── Conference view ─── */
  if (view === 'conference') {
    return (
      <PostMatchConference
        result={result}
        motmName={motm?.name}
        fixture={fixture}
        onDone={handleConferenceDone}
      />
    );
  }

  /* ─── Main match report ─── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-1)', paddingBottom: 100 }}>
      <style>{`
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn    { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* ── Result hero ── */}
      <div style={{
        padding: '30px 16px 24px',
        background: `linear-gradient(180deg, ${resultColor}18 0%, transparent 100%)`,
        borderBottom: `1px solid ${resultColor}20`,
        textAlign: 'center',
        animation: 'fadeSlideIn 0.5s ease',
      }}>
        {/* Competition chip */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: compAccent }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: compAccent, letterSpacing: 3, textTransform: 'uppercase' }}>
            {fixture.competition}{fixture.cupRound ? ` · ${fixture.cupRound}` : ''}
          </span>
        </div>

        {/* Result label */}
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800,
          letterSpacing: 6, textTransform: 'uppercase', color: resultColor, marginBottom: 14,
        }}>{resultLabel}</div>

        {/* Clubs + score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ClubBadge name={fixture.home} size={48} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', maxWidth: 90, textAlign: 'center', lineHeight: 1.3 }}>
              {fixture.home}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 900,
              color: 'var(--text)', lineHeight: 1,
              textShadow: `0 0 30px ${resultColor}44`,
            }}>{fixture.isHome ? myGoals : oppGoals}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--border)', lineHeight: 1 }}>–</span>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 900,
              color: 'var(--text)', lineHeight: 1,
            }}>{fixture.isHome ? oppGoals : myGoals}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ClubBadge name={fixture.away} size={48} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', maxWidth: 90, textAlign: 'center', lineHeight: 1.3 }}>
              {fixture.away}
            </span>
          </div>
        </div>

        {/* Scorers */}
        {scorers.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {scorers.map((s, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(0,232,122,0.08)', border: '1px solid rgba(0,232,122,0.2)',
                borderRadius: 20, padding: '4px 10px',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00e87a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-dim)' }}>
                  {s.name.split(' ').pop()}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{s.min}'</span>
                {s.assist && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>
                    ({s.assist.split(' ').pop()})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── MOTM ── */}
        {motm && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,197,24,0.12) 0%, var(--bg-3) 100%)',
            border: '1px solid rgba(245,197,24,0.25)', borderRadius: 12,
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 14,
            animation: 'scaleIn 0.4s ease 0.1s both',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: 'rgba(245,197,24,0.12)', border: '1.5px solid rgba(245,197,24,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 900, color: '#f5c518',
            }}>
              {motm.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{motm.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#f5c518', letterSpacing: 2.5, textTransform: 'uppercase', marginTop: 3 }}>Man of the Match</div>
              {motm.goals > 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 3 }}>
                  {motm.goals} goal{motm.goals > 1 ? 's' : ''}{motm.assists > 0 ? ` · ${motm.assists} assist${motm.assists > 1 ? 's' : ''}` : ''}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: '#f5c518', lineHeight: 1 }}>{motm.matchRating.toFixed(1)}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 3 }}>Rating</div>
            </div>
          </div>
        )}

        {/* ── Match Stats ── */}
        <div style={{
          background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
          animation: 'scaleIn 0.4s ease 0.2s both',
        }}>
          <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>Match Stats</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: myColor, letterSpacing: 1 }}>{myName.split(' ')[0]}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 1 }}>vs</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 1 }}>{oppName.split(' ')[0]}</span>
            </div>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <StatRow label="Shots"     myVal={stats.myShots}        oppVal={stats.oppShots}   highlight={myColor} />
            <StatRow label="On Target" myVal={stats.mySot}          oppVal={stats.oppSot}     highlight={myColor} />
            <StatRow label="Possession" myVal={`${stats.myPoss}%`}  oppVal={`${stats.oppPoss}%`} highlight={myColor} />
            <StatRow label="xG"         myVal={(myXg ?? 0).toFixed(2)}  oppVal={(oppXg ?? 0).toFixed(2)} highlight={myColor} />
            <StatRow label="Corners"   myVal={stats.myCorners}      oppVal={stats.oppCorners} highlight={myColor} />
            <StatRow label="Fouls"     myVal={stats.myFouls}        oppVal={stats.oppFouls}   highlight={myColor} />
            <StatRow label="Yellows"   myVal={stats.myYellows}      oppVal={stats.oppYellows} highlight={myColor} />
            {(stats.myReds > 0 || stats.oppReds > 0) && (
              <StatRow label="Reds" myVal={stats.myReds} oppVal={stats.oppReds} highlight="#ff3b5c" />
            )}
          </div>
        </div>

        {/* ── Player Ratings ── */}
        <div style={{
          background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
          animation: 'scaleIn 0.4s ease 0.3s both',
        }}>
          <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>Player Ratings</span>
          </div>
          {playerRatings.map((p, i) => {
            const isMOTM = i === 0;
            return (
              <div key={p.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px',
                background: isMOTM ? 'rgba(245,197,24,0.04)' : 'transparent',
                borderBottom: i < playerRatings.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', width: 28, letterSpacing: 1, textTransform: 'uppercase' }}>{p.position}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                {p.goals > 0 && (
                  <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00e87a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                    {p.goals > 1 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#00e87a' }}>×{p.goals}</span>}
                  </div>
                )}
                {p.assists > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1 }}>A{p.assists}</span>
                )}
                {isMOTM && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f5c518', flexShrink: 0 }} />
                )}
                <RatingBadge rating={p.matchRating} />
              </div>
            );
          })}
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 10, animation: 'scaleIn 0.4s ease 0.35s both' }}>
          <button
            onClick={() => setView('conference')}
            style={{
              flex: 1, padding: '13px', borderRadius: 8,
              background: 'var(--bg-3)', border: '1px solid var(--border)',
              color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: 11,
              fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Conference
          </button>
          <button
            onClick={() => onContinue({})}
            style={{
              flex: 1, padding: '13px', borderRadius: 8, border: 'none',
              background: 'var(--green)', color: '#000',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 900,
              letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}