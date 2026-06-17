/* ═══════════════════════════════════════════════════════
   THE GAFFER — PreMatch.jsx
   Three-step flow: Press Conference → Team Selection → Team Talk
   Props: fixture, squad, formation, onComplete(config), onCancel
═══════════════════════════════════════════════════════ */
import { useState, useMemo, useEffect } from 'react';
import { TEAM_TALKS } from './matchEngine';
import { PRE_MATCH_QUESTIONS, pickQuestions } from './conferenceQuestions';

const FORMATIONS = ['4-3-3','4-4-2','4-2-3-1','3-5-2','5-3-2','4-5-1','3-4-3'];
const TACTICS_LIST = [
  { id: 'attacking',  label: 'Attacking',   desc: 'High line, all-out attack' },
  { id: 'balanced',   label: 'Balanced',    desc: 'Solid in all areas' },
  { id: 'defensive',  label: 'Defensive',   desc: 'Compact, hard to break' },
  { id: 'counter',    label: 'Counter',     desc: 'Absorb and hit on the break' },
  { id: 'highpress',  label: 'High Press',  desc: 'Press high, win it back fast' },
];

const POSITIONS_ORDER = ['GK','RB','CB','CB','LB','CDM','CM','CM','RW','ST','LW'];

/* ─── Same club color/badge maps as Matchday.jsx, for consistency app-wide ─── */
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

function ClubBadge({ name, size = 32, faded = false }) {
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
          width: size, height: size, objectFit: 'contain', flexShrink: 0,
          opacity: faded ? 0.07 : 1,
          filter: faded ? 'grayscale(0.3)' : 'none',
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
      opacity: faded ? 0.07 : 1,
    }}>{abbr}</div>
  );
}

/* ─── Step indicator ─── */
function StepBar({ step, total = 3 }) {
  const labels = ['Conference', 'Selection', 'Team Talk'];
  return (
    <div style={{ display: 'flex', gap: 6, padding: '14px 16px 0' }}>
      {labels.map((l, i) => (
        <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ height: 3, borderRadius: 2, background: i <= step ? 'var(--green)' : 'var(--bg-5)', transition: 'background 0.3s' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: i === step ? 'var(--green)' : 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════
   STEP 0 — PRESS CONFERENCE
════════════════════════════════════ */
function PressConference({ fixture, onDone, onSkip, onBack }) {
  const questions = useMemo(() => pickQuestions(PRE_MATCH_QUESTIONS, 'any', 3), []);
  const [qIdx, setQIdx]             = useState(0);
  const [answered, setAnswered]     = useState(null); // { text, effect }
  const [totals, setTotals]         = useState({ morale: 0, managerRating: 0 });
  const [flash, setFlash]           = useState(null); // last effect, for the bar's brief pulse

  const current = questions[qIdx];

  const handleAnswer = (answer) => {
    setAnswered(answer);
    setFlash(answer.effect);
    setTotals(prev => ({
      morale: prev.morale + answer.effect.morale,
      managerRating: prev.managerRating + answer.effect.managerRating,
    }));
    setTimeout(() => {
      setFlash(null);
      setAnswered(null);
      if (qIdx < questions.length - 1) {
        setQIdx(q => q + 1);
      } else {
        onDone({
          morale: totals.morale + answer.effect.morale,
          managerRating: totals.managerRating + answer.effect.managerRating,
        });
      }
    }, 1400);
  };

  /* ─── Keyboard shortcuts: X = back, F = skip ─── */
  useEffect(() => {
    function onKey(e) {
      const key = e.key.toLowerCase();
      if (key === 'x' && onBack) onBack();
      if (key === 'f') onSkip();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack, onSkip]);

  if (!current) return null;

  const moraleColor = totals.morale > 4 ? 'var(--green)' : totals.morale < -4 ? 'var(--red)' : 'var(--yellow)';
  const moralePct   = Math.min(100, Math.max(0, 50 + totals.morale * 4));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* ── Home/away crest split background ── */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <ClubBadge name={fixture?.home} size={420} faded />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <ClubBadge name={fixture?.away} size={420} faded />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, var(--bg-0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.55) 60%, var(--bg-0) 100%)' }} />
      </div>

      {/* ── Morale bar (persistent, top) ── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '14px 24px 0', flexShrink: 0 }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase', flexShrink: 0 }}>
            Squad Morale
          </span>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-4)', border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.15)',
            }} />
            <div style={{
              height: '100%', width: `${moralePct}%`, background: moraleColor,
              transition: 'width 0.5s ease, background 0.3s ease',
            }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800, color: moraleColor,
            width: 36, textAlign: 'right', flexShrink: 0, transition: 'color 0.3s ease',
          }}>{totals.morale > 0 ? '+' : ''}{totals.morale}</span>

          {/* Brief pulse label when an answer just landed */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase',
            color: flash ? (flash.morale > 0 ? 'var(--green)' : flash.morale < -3 ? 'var(--red)' : 'var(--yellow)') : 'transparent',
            transition: 'opacity 0.2s ease', opacity: flash ? 1 : 0, width: 90, flexShrink: 0,
          }}>
            {flash ? (flash.morale > 2 ? '+ Great' : flash.morale > 0 ? '+ Good' : flash.morale < -3 ? '− Backlash' : '~ Neutral') : ''}
          </span>
        </div>
      </div>

      {/* ── Main content, pushed further down the screen ── */}
      <div style={{
        position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '20px 24px 32px', maxWidth: 920, width: '100%', margin: '0 auto', gap: 26,
      }}>

        {/* Room header — sponsor backdrop strip */}
        <div style={{
          width: '100%', borderRadius: 10, overflow: 'hidden',
          border: '1px solid var(--border)', background: 'var(--bg-3)',
        }}>
          <div style={{
            padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'repeating-linear-gradient(115deg, var(--bg-4) 0px, var(--bg-4) 60px, var(--bg-5) 60px, var(--bg-5) 120px)',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.55)', letterSpacing: 3, textTransform: 'uppercase' }}>
              Pre-Match Press Conference
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 }}>
              {qIdx + 1} / {questions.length}
            </span>
          </div>

          {/* Question progress dots */}
          <div style={{ display: 'flex', gap: 6, padding: '12px 18px 0' }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i < qIdx ? 'var(--green)' : i === qIdx ? 'var(--text)' : 'var(--bg-5)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          {/* Podium scene */}
          <div style={{ padding: '28px 32px 24px', display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            {/* Journalist avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: 'var(--bg-4)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>

            {/* Speech card */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                Sky Sports · Reporter
              </div>
              <div style={{
                background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: '4px 14px 14px 14px',
                padding: '16px 20px', position: 'relative',
              }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{current.question}"
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answer options — desktop grid, your seat at the podium */}
        <div style={{
          width: '100%', display: 'grid',
          gridTemplateColumns: current.answers.length > 2 ? 'repeat(2, 1fr)' : 'repeat(1, 1fr)',
          gap: 12,
        }}>
          {current.answers.map((ans, i) => {
            const isPicked  = answered === ans;
            const tintColor = ans.effect.morale > 0 ? '#00e87a' : ans.effect.morale < -3 ? '#ff3b5c' : '#f5c518';
            return (
              <button key={i} onClick={() => !answered && handleAnswer(ans)} style={{
                background: isPicked ? `${tintColor}14` : 'var(--bg-3)',
                border: `1px solid ${isPicked ? `${tintColor}55` : 'var(--border)'}`,
                borderRadius: 10, padding: '16px 18px', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--text-dim)',
                lineHeight: 1.55, cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.18s', WebkitTapHighlightColor: 'transparent',
                opacity: answered && !isPicked ? 0.4 : 1,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}
                onMouseEnter={e => { if (!answered) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.background = 'var(--bg-4)'; } }}
                onMouseLeave={e => { if (!answered) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-3)'; } }}
              >
                <span style={{
                  flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--bg-5)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)',
                }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{ans.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Keyboard hint footer ── */}
      <div style={{
        position: 'relative', zIndex: 1, flexShrink: 0, padding: '0 24px 20px',
        display: 'flex', justifyContent: 'center', gap: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <kbd style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)',
            background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 4,
            padding: '2px 7px', minWidth: 18, textAlign: 'center',
          }}>X</kbd>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Go back</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <kbd style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)',
            background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 4,
            padding: '2px 7px', minWidth: 18, textAlign: 'center',
          }}>F</kbd>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Skip conference</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   STEP 1 — TEAM SELECTION
════════════════════════════════════ */
function TeamSelection({ squad, formation, onFormationChange, onDone }) {
  const [selected, setSelected]   = useState([]);
  const [subs, setSubs]           = useState([]);
  const [tactics, setTactics]     = useState('balanced');
  const [pickerFor, setPickerFor] = useState(null); // 'start' | 'sub'
  const [filterPos, setFilterPos] = useState('ALL');

  const positions = ['ALL','GK','DEF','MID','FWD'];
  const posMap = { GK: ['GK'], DEF: ['CB','LB','RB','LWB','RWB'], MID: ['CM','CDM','CAM','LM','RM'], FWD: ['ST','LW','RW','CF'] };

  const filtered = useMemo(() => {
    const base = squad.filter(p => !selected.find(s => s.id === p.id) && !subs.find(s => s.id === p.id));
    if (filterPos === 'ALL') return base;
    return base.filter(p => posMap[filterPos]?.includes(p.position));
  }, [squad, selected, subs, filterPos]);

  const addToStart = (player) => {
    if (selected.length >= 11) return;
    setSelected(prev => [...prev, player]);
    setPickerFor(null);
  };

  const addToSub = (player) => {
    if (subs.length >= 7) return;
    setSubs(prev => [...prev, player]);
    setPickerFor(null);
  };

  const removeFromStart = (id) => setSelected(prev => prev.filter(p => p.id !== id));
  const removeFromSub   = (id) => setSubs(prev => prev.filter(p => p.id !== id));

  const canContinue = selected.length === 11;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 16px 24px', gap: 14 }}>

      {/* Formation + Tactics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Formation selector */}
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Formation</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            {FORMATIONS.map(f => (
              <button key={f} onClick={() => onFormationChange(f)} style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: 6,
                border: `1px solid ${formation === f ? 'var(--green)' : 'var(--border)'}`,
                background: formation === f ? 'rgba(0,232,122,0.12)' : 'var(--bg-4)',
                color: formation === f ? 'var(--green)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Tactics selector */}
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Style</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            {TACTICS_LIST.map(t => (
              <button key={t.id} onClick={() => setTactics(t.id)} style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: 6,
                border: `1px solid ${tactics === t.id ? 'var(--yellow)' : 'var(--border)'}`,
                background: tactics === t.id ? 'rgba(245,197,24,0.10)' : 'var(--bg-4)',
                color: tactics === t.id ? 'var(--yellow)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Starting XI */}
      <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--green)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>Starting XI</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: selected.length === 11 ? 'var(--green)' : 'var(--text-muted)' }}>{selected.length}/11</span>
        </div>
        <div style={{ padding: '6px 0' }}>
          {selected.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: i < selected.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--green)', width: 18, textAlign: 'center' }}>{i + 1}</span>
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1e242d&color=e8edf2&size=60&bold=true`} alt={p.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 1 }}>{p.position}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{p.overall}</span>
              <button onClick={() => removeFromStart(p.id)} style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.2)', borderRadius: 5, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--red)', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
          {selected.length < 11 && (
            <button onClick={() => setPickerFor('start')} style={{ width: '100%', padding: '11px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green)', letterSpacing: 2, textTransform: 'uppercase', WebkitTapHighlightColor: 'transparent' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Player
            </button>
          )}
        </div>
      </div>

      {/* Subs bench */}
      <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--yellow)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, textTransform: 'uppercase' }}>Subs Bench</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--text-muted)' }}>{subs.length}/7</span>
        </div>
        <div style={{ padding: '6px 0' }}>
          {subs.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: i < subs.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1e242d&color=e8edf2&size=60&bold=true`} alt={p.name} style={{ width: 26, height: 26, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 1 }}>{p.position}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{p.overall}</span>
              <button onClick={() => removeFromSub(p.id)} style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.18)', borderRadius: 5, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--red)', flexShrink: 0 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
          {subs.length < 7 && (
            <button onClick={() => setPickerFor('sub')} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--yellow)', letterSpacing: 2, textTransform: 'uppercase', WebkitTapHighlightColor: 'transparent' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Sub
            </button>
          )}
        </div>
      </div>

      {/* Confirm */}
      <button onClick={() => canContinue && onDone({ starting11: selected, subs, tactics })} style={{
        padding: '14px', borderRadius: 8, border: 'none',
        background: canContinue ? 'var(--green)' : 'var(--bg-5)',
        color: canContinue ? '#000' : 'var(--text-muted)',
        fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800,
        letterSpacing: 3, textTransform: 'uppercase', cursor: canContinue ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent',
      }}>
        {canContinue ? 'Confirm Squad' : `Select ${11 - selected.length} more`}
      </button>

      {/* Player picker sheet */}
      {pickerFor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(4,6,10,0.92)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)', flex: 1, display: 'flex', flexDirection: 'column', marginTop: 'auto', maxHeight: '85vh', borderRadius: '14px 14px 0 0' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{pickerFor === 'start' ? 'Pick Starter' : 'Pick Sub'}</span>
              <button onClick={() => setPickerFor(null)} style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 6, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {/* Position filter */}
            <div style={{ display: 'flex', gap: 6, padding: '10px 14px', borderBottom: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {positions.map(pos => (
                <button key={pos} onClick={() => setFilterPos(pos)} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: `1px solid ${filterPos === pos ? 'var(--green)' : 'var(--border)'}`, background: filterPos === pos ? 'rgba(0,232,122,0.1)' : 'transparent', color: filterPos === pos ? 'var(--green)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>{pos}</button>
              ))}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.map((p, i) => (
                <button key={p.id} onClick={() => pickerFor === 'start' ? addToStart(p) : addToSub(p)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', WebkitTapHighlightColor: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1e242d&color=e8edf2&size=60&bold=true`} alt={p.name} style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 1 }}>{p.position} · {p.nationality}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{p.overall}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 1 }}>OVR</div>
                  </div>
                </button>
              ))}
              {!filtered.length && (
                <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>No available players</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════
   STEP 2 — TEAM TALK
════════════════════════════════════ */
function TeamTalk({ fixture, onDone }) {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 16px 24px', gap: 16 }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.65, textAlign: 'center' }}>
        The dressing room is silent. All eyes on you. Choose your words carefully.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {TEAM_TALKS.map(talk => (
          <button key={talk.id} onClick={() => setSelected(talk.id)} style={{
            background: selected === talk.id ? `${talk.color === 'var(--red)' ? 'rgba(255,59,92,0.12)' : talk.color === 'var(--blue)' ? 'rgba(59,130,246,0.12)' : talk.color === 'var(--green)' ? 'rgba(0,232,122,0.10)' : talk.color === 'var(--yellow)' ? 'rgba(245,197,24,0.10)' : 'rgba(168,85,247,0.10)'}` : 'var(--bg-3)',
            border: `1px solid ${selected === talk.id ? talk.color : 'var(--border)'}`,
            borderRadius: 10, padding: '14px', textAlign: 'left', cursor: 'pointer',
            transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent',
          }}
            onMouseEnter={e => { if (selected !== talk.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { if (selected !== talk.id) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: selected === talk.id ? talk.color : 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{talk.tone}</span>
              {selected === talk.id && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', lineHeight: 1.55, fontStyle: 'italic' }}>{talk.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 6 }}>{talk.desc}</div>
          </button>
        ))}
      </div>

      <button onClick={() => selected && onDone(selected)} style={{
        padding: '14px', borderRadius: 8, border: 'none',
        background: selected ? 'var(--green)' : 'var(--bg-5)',
        color: selected ? '#000' : 'var(--text-muted)',
        fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800,
        letterSpacing: 3, textTransform: 'uppercase', cursor: selected ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent',
      }}>
        {selected ? 'Kick Off' : 'Choose a tone first'}
      </button>
    </div>
  );
}

/* ════════════════════════════════════
   MAIN PreMatch COMPONENT
════════════════════════════════════ */
export default function PreMatch({ fixture, onComplete, onCancel }) {

  const handleConferenceDone = (bonus) => {
    onComplete({ confBonus: bonus });
  };

  const handleConferenceSkip = () => {
    onComplete({ confBonus: { morale: 0, managerRating: 0 } });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'var(--bg-0)', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease', overflow: 'hidden' }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes effectPop { from { opacity:0; transform:scale(0.9) } to { opacity:1; transform:scale(1) } }
      `}</style>

      {/* Header — club identifier only, no close button (use X key to go back) */}
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexShrink: 0 }}>
        <ClubBadge name={fixture?.home} size={26} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 1 }}>VS</span>
        <ClubBadge name={fixture?.away} size={26} />
      </div>

      <PressConference
        fixture={fixture}
        onDone={handleConferenceDone}
        onSkip={handleConferenceSkip}
        onBack={onCancel}
      />
    </div>
  );
}