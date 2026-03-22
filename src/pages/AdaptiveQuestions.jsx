import { useState, useEffect, useRef } from 'react'
import { Clock, Lightbulb, ChevronRight, CheckCircle, XCircle, Zap, Trophy } from 'lucide-react'

const questions = [
  {
    id: 1, subject: 'Physics', topic: 'Rotational Motion', difficulty: 'Hard',
    question: 'A solid cylinder of mass M and radius R rolls without slipping down an inclined plane of angle θ. What is the acceleration of the cylinder?',
    options: [
      'a = (2/3)g sin θ',
      'a = g sin θ',
      'a = (2/3)g cos θ',
      'a = (1/2)g sin θ'
    ],
    correct: 0,
    explanation: 'For a solid cylinder rolling without slipping, using the equation of motion with rotational inertia:\n\nI = (1/2)MR² for solid cylinder\n\nUsing Newton\'s law: Mg sinθ - f = Ma\nTorque equation: fR = Iα = (1/2)MR² × (a/R)\n\nSolving: f = (1/2)Ma\n∴ Mg sinθ = Ma + (1/2)Ma = (3/2)Ma\n∴ a = (2/3)g sinθ',
    tags: ['Rolling motion', 'Moment of inertia', 'Friction']
  },
  {
    id: 2, subject: 'Chemistry', topic: 'Organic Chemistry', difficulty: 'Medium',
    question: 'Which of the following reagents is used for the oxidation of primary alcohols to carboxylic acids?',
    options: [
      'PCC (Pyridinium chlorochromate)',
      'KMnO₄ / H₂SO₄',
      'NaBH₄',
      'LiAlH₄'
    ],
    correct: 1,
    explanation: 'KMnO₄/H₂SO₄ is a strong oxidizing agent that converts:\n• Primary alcohols → Carboxylic acids\n• Secondary alcohols → Ketones\n• Alkenes → Diols (in neutral/acidic)\n\nPCC only oxidizes primary alcohols to aldehydes (stops there).\nNaBH₄ and LiAlH₄ are REDUCING agents, not oxidizing.',
    tags: ['Alcohols', 'Oxidation', 'Organic reactions']
  },
  {
    id: 3, subject: 'Mathematics', topic: 'Integration', difficulty: 'Medium',
    question: 'Evaluate: ∫₀^π sin²(x) dx',
    options: [
      'π/4',
      'π/2',
      'π',
      '2π'
    ],
    correct: 1,
    explanation: 'Using the identity: sin²(x) = (1 - cos2x)/2\n\n∫₀^π sin²(x) dx = ∫₀^π (1 - cos2x)/2 dx\n\n= [x/2 - sin2x/4]₀^π\n\n= (π/2 - sin2π/4) - (0 - sin0/4)\n\n= π/2 - 0 - 0\n\n= π/2 ✅',
    tags: ['Definite integration', 'Trigonometry', 'Standard formulas']
  },
  {
    id: 4, subject: 'Physics', topic: 'Electrostatics', difficulty: 'Easy',
    question: 'The electric field inside a conducting sphere with total charge Q is:',
    options: [
      'Q/(4πε₀r²)',
      'Zero',
      'Q/(4πε₀R²)',
      'σ/ε₀'
    ],
    correct: 1,
    explanation: 'By Gauss\' Law, for a conducting sphere:\n\nAll charges reside on the SURFACE.\n\nInside the conductor: No free charges → E = 0\n\nThis is a fundamental property of conductors in electrostatic equilibrium. The field is only non-zero outside the sphere where it equals Q/(4πε₀r²).',
    tags: ['Gauss law', 'Conductors', 'Electric field']
  },
  {
    id: 5, subject: 'Chemistry', topic: 'Physical Chemistry', difficulty: 'Hard',
    question: 'For the reaction N₂(g) + 3H₂(g) ⇌ 2NH₃(g), if the pressure is increased by a factor of 4, the equilibrium constant Kp will:',
    options: [
      'Increase by factor of 16',
      'Decrease by factor of 16',
      'Remain unchanged',
      'Increase by factor of 4'
    ],
    correct: 2,
    explanation: 'The equilibrium constant K (both Kc and Kp) depends ONLY on temperature.\n\nChanging pressure (at constant temperature) shifts the equilibrium position but does NOT change the value of K.\n\nThis is a fundamental principle of chemical equilibrium — K is a constant at a given temperature regardless of concentration or pressure changes.',
    tags: ['Equilibrium', 'Le Chatelier', 'Kp']
  }
]

const difficultyColors = {
  Easy: { bg:'rgba(0,255,136,0.1)', color:'#00ff88', border:'rgba(0,255,136,0.3)' },
  Medium: { bg:'rgba(255,217,61,0.1)', color:'#ffd93d', border:'rgba(255,217,61,0.3)' },
  Hard: { bg:'rgba(255,107,107,0.1)', color:'#ff6b6b', border:'rgba(255,107,107,0.3)' },
}

const subjectColors = {
  Physics: '#6c63ff', Chemistry: '#00d4aa', Mathematics: '#ff6b6b'
}

export default function AdaptiveQuestions() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120)
  const [score, setScore] = useState({ correct: 0, wrong: 0, total: 0 })
  const [filter, setFilter] = useState('All')
  const timerRef = useRef()

  const q = questions[currentIndex % questions.length]
  const dc = difficultyColors[q.difficulty]

  useEffect(() => {
    setTimeLeft(120)
    setSelected(null)
    setRevealed(false)
    setShowHint(false)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [currentIndex])

  const handleSelect = (idx) => {
    if (revealed) return
    setSelected(idx)
  }

  const handleReveal = () => {
    if (selected === null) return
    clearInterval(timerRef.current)
    setRevealed(true)
    setScore(prev => ({
      correct: prev.correct + (selected === q.correct ? 1 : 0),
      wrong: prev.wrong + (selected !== q.correct ? 1 : 0),
      total: prev.total + 1
    }))
  }

  const handleNext = () => {
    setCurrentIndex(i => i + 1)
  }

  const timerColor = timeLeft > 60 ? 'var(--secondary)' : timeLeft > 30 ? 'var(--warning)' : 'var(--accent)'
  const timerPct = (timeLeft / 120) * 100

  const optionState = (idx) => {
    if (!revealed) return selected === idx ? 'selected' : ''
    if (idx === q.correct) return 'correct'
    if (idx === selected && idx !== q.correct) return 'incorrect'
    return ''
  }

  return (
    <div style={{ animation:'fadeInUp 0.5s ease' }}>
      {/* Score Bar */}
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <div className="card" style={{ flex:1, minWidth:'120px', padding:'1rem', textAlign:'center' }}>
          <div style={{ fontSize:'1.5rem', fontWeight:'800', color:'var(--secondary)', fontFamily:"'Outfit',sans-serif" }}>{score.correct}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Correct</div>
        </div>
        <div className="card" style={{ flex:1, minWidth:'120px', padding:'1rem', textAlign:'center' }}>
          <div style={{ fontSize:'1.5rem', fontWeight:'800', color:'var(--accent)', fontFamily:"'Outfit',sans-serif" }}>{score.wrong}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Wrong</div>
        </div>
        <div className="card" style={{ flex:1, minWidth:'120px', padding:'1rem', textAlign:'center' }}>
          <div style={{ fontSize:'1.5rem', fontWeight:'800', color:'var(--primary-light)', fontFamily:"'Outfit',sans-serif" }}>{score.total}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Attempted</div>
        </div>
        <div className="card" style={{ flex:1, minWidth:'120px', padding:'1rem', textAlign:'center' }}>
          <div style={{ fontSize:'1.5rem', fontWeight:'800', color:'var(--warning)', fontFamily:"'Outfit',sans-serif" }}>
            {score.total ? Math.round((score.correct/score.total)*100) : 0}%
          </div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Accuracy</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Question Card */}
        <div>
          {/* Timer + Meta */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <span style={{
                padding:'0.25rem 0.75rem', borderRadius:'var(--radius-full)',
                background: dc.bg, color: dc.color, border:`1px solid ${dc.border}`,
                fontSize:'0.75rem', fontWeight:'700'
              }}>{q.difficulty}</span>
              <span style={{
                padding:'0.25rem 0.75rem', borderRadius:'var(--radius-full)',
                background:'var(--bg-glass)', color: subjectColors[q.subject] || 'var(--text-secondary)',
                border:'1px solid var(--border)', fontSize:'0.75rem', fontWeight:'600'
              }}>{q.subject}</span>
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Q.{currentIndex+1} · {q.topic}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <Clock size={15} style={{ color: timerColor }} />
              <span style={{ fontWeight:'800', fontSize:'1rem', color: timerColor, fontFamily:"'Outfit',sans-serif" }}>
                {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}
              </span>
            </div>
          </div>

          {/* Timer bar */}
          <div className="progress-bar" style={{ marginBottom:'1.5rem', height:'4px' }}>
            <div className="progress-fill" style={{
              width:`${timerPct}%`,
              background: timerColor,
              transition:'width 1s linear'
            }} />
          </div>

          {/* Question */}
          <div className="question-card" key={q.id}>
            <p style={{ fontSize:'1rem', fontWeight:'500', lineHeight:'1.7', marginBottom:'1.5rem' }}>
              {q.question}
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem', marginBottom:'1.25rem' }}>
              {q.options.map((opt, idx) => (
                <div
                  key={idx}
                  id={`option-${idx}`}
                  className={`option-card ${optionState(idx)}`}
                  onClick={() => handleSelect(idx)}
                >
                  <div className="option-letter" style={{
                    background: optionState(idx) === 'correct' ? 'rgba(0,255,136,0.2)'
                      : optionState(idx) === 'incorrect' ? 'rgba(255,107,107,0.2)'
                      : optionState(idx) === 'selected' ? 'rgba(108,99,255,0.2)'
                      : 'var(--bg-glass)',
                    color: optionState(idx) === 'correct' ? '#00ff88'
                      : optionState(idx) === 'incorrect' ? 'var(--accent)'
                      : optionState(idx) === 'selected' ? 'var(--primary-light)'
                      : 'var(--text-muted)',
                    border:'none'
                  }}>
                    {['A','B','C','D'][idx]}
                  </div>
                  <span style={{ fontSize:'0.92rem', fontFamily:'monospace', fontWeight:'500' }}>{opt}</span>
                  {revealed && idx === q.correct && <CheckCircle size={18} color="#00ff88" style={{ marginLeft:'auto', flexShrink:0 }} />}
                  {revealed && idx === selected && idx !== q.correct && <XCircle size={18} color="var(--accent)" style={{ marginLeft:'auto', flexShrink:0 }} />}
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowHint(!showHint)}
                id="hint-btn"
              >
                <Lightbulb size={15} /> Hint
              </button>
              {!revealed ? (
                <button
                  className="btn btn-primary"
                  style={{ flex:1 }}
                  onClick={handleReveal}
                  id="submit-btn"
                  disabled={selected === null}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  style={{ flex:1 }}
                  onClick={handleNext}
                  id="next-btn"
                >
                  Next Question <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {/* Hint */}
          {showHint && (
            <div style={{
              background:'rgba(255,217,61,0.08)', border:'1px solid rgba(255,217,61,0.25)',
              borderRadius:'var(--radius-lg)', padding:'1.25rem'
            }}>
              <div style={{ fontSize:'0.8rem', fontWeight:'700', color:'var(--warning)', marginBottom:'0.5rem' }}>💡 Hint</div>
              <p style={{ fontSize:'0.88rem', color:'var(--text-secondary)', lineHeight:'1.6' }}>
                {q.subject === 'Physics' ? 'Think about the rotational equivalent of Newton\'s second law and the constraint equation for rolling without slipping.' :
                 q.subject === 'Chemistry' ? 'Focus on whether the reagent is an oxidizing or reducing agent and how strong it is.' :
                 'Try using a trigonometric identity to simplify sin²(x) before integrating.'}
              </p>
            </div>
          )}

          {/* Explanation */}
          {revealed && (
            <div style={{
              background: selected === q.correct ? 'rgba(0,255,136,0.05)' : 'rgba(255,107,107,0.05)',
              border:`1px solid ${selected === q.correct ? 'rgba(0,255,136,0.2)' : 'rgba(255,107,107,0.2)'}`,
              borderRadius:'var(--radius-lg)', padding:'1.25rem'
            }}>
              <div style={{
                fontSize:'0.8rem', fontWeight:'700',
                color: selected === q.correct ? '#00ff88' : 'var(--accent)',
                marginBottom:'0.6rem'
              }}>
                {selected === q.correct ? '✅ Correct! Well done!' : '❌ Incorrect — Let\'s understand why:'}
              </div>
              <pre style={{
                fontSize:'0.83rem', color:'var(--text-secondary)',
                whiteSpace:'pre-wrap', lineHeight:'1.7', fontFamily:'inherit'
              }}>{q.explanation}</pre>
            </div>
          )}

          {/* Tags */}
          <div className="card" style={{ padding:'1.25rem' }}>
            <div style={{ fontSize:'0.8rem', fontWeight:'700', color:'var(--text-muted)', marginBottom:'0.6rem' }}>Related Topics:</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
              {q.tags.map(t => (
                <span key={t} className="badge badge-primary" style={{ fontSize:'0.72rem' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="card" style={{ padding:'1.25rem', background:'rgba(108,99,255,0.04)' }}>
            <div style={{ fontSize:'0.8rem', fontWeight:'700', color:'var(--primary-light)', marginBottom:'0.6rem' }}>🤖 AI Adaptive Analysis</div>
            <p style={{ fontSize:'0.83rem', color:'var(--text-secondary)', lineHeight:'1.6' }}>
              Based on your recent performance, this question targets <strong style={{color:'var(--text-primary)'}}>{q.topic}</strong> — one of your identified weak areas. The difficulty is set to <strong style={{color: dc.color}}>{q.difficulty}</strong> because you've been performing well on easier questions in this topic.
            </p>
            <div style={{ marginTop:'0.75rem', padding:'0.65rem', background:'var(--bg-glass)',
              borderRadius:'var(--radius-md)', fontSize:'0.8rem', color:'var(--text-muted)' }}>
              💡 Tip: Solving 5 more questions in this topic will move you from <strong>weak → average</strong> territory.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
