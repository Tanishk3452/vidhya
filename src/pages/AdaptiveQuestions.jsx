import { useState, useEffect, useRef } from 'react'
import { Clock, Lightbulb, ChevronRight, CheckCircle, XCircle, Zap, Trophy, Loader2, Settings2 } from 'lucide-react'
import { questionsAPI } from '../services/api'

const JEE_SYLLABUS = {
  Physics: ['Rotational Motion', 'Thermodynamics', 'Electrostatics', 'Optics', 'Modern Physics', 'Kinematics', 'Waves', 'Magnetism'],
  Chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Equilibrium', 'Atomic Structure', 'Solutions'],
  Mathematics: ['Calculus', 'Algebra', 'Coordinate Geometry', 'Trigonometry', 'Probability', 'Complex Numbers', 'Integration', 'Matrices']
}

const difficultyColors = {
  Easy: { bg:'rgba(0,255,136,0.1)', color:'#00ff88', border:'rgba(0,255,136,0.3)' },
  Medium: { bg:'rgba(255,217,61,0.1)', color:'#ffd93d', border:'rgba(255,217,61,0.3)' },
  Hard: { bg:'rgba(255,107,107,0.1)', color:'#ff6b6b', border:'rgba(255,107,107,0.3)' },
}

const subjectColors = {
  Physics: '#6c63ff', Chemistry: '#00d4aa', Mathematics: '#ff6b6b'
}

export default function AdaptiveQuestions() {
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [config, setConfig] = useState({ subject: '', topic: '', difficulty: '' })
  
  const [q, setQ] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120)
  const [score, setScore] = useState({ correct: 0, wrong: 0, total: 0 })
  const [filter, setFilter] = useState('')
  const [submissionData, setSubmissionData] = useState(null)
  const timerRef = useRef()

  const fetchNextQuestion = async () => {
    setLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      let mappedDiff = ''
      if(config.difficulty === 'Weak') mappedDiff = 'Easy'
      if(config.difficulty === 'Intermediate') mappedDiff = 'Medium'
      if(config.difficulty === 'Expert') mappedDiff = 'Hard'

      const res = await questionsAPI.getNext(
        user.id || 'demo-user-001', 
        config.subject || '',
        config.topic || '',
        mappedDiff
      )
      
      setQ(res.data)
      setTimeLeft(120)
      setSelected(null)
      setRevealed(false)
      setShowHint(false)
      setSubmissionData(null)
      
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); return 0 }
          return t - 1
        })
      }, 1000)
    } catch (err) {
      console.error("Failed to load adaptive question:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if(isSessionActive) {
      fetchNextQuestion()
    }
    return () => clearInterval(timerRef.current)
  }, [isSessionActive])

  const handleStartSession = () => {
    setIsSessionActive(true)
    setScore({ correct: 0, wrong: 0, total: 0 })
    setCurrentIndex(0)
  }

  const handleSelect = (idx) => {
    if (revealed) return
    setSelected(idx)
  }

  const handleReveal = async () => {
    if (selected === null || !q) return
    clearInterval(timerRef.current)
    setRevealed(true)
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const res = await questionsAPI.submit({
        user_id: user.id || 'demo-user-001',
        question_id: q.id,
        selected_index: selected,
        time_taken_seconds: 120 - timeLeft
      })
      
      setSubmissionData(res.data)
      
      setScore(prev => ({
        correct: prev.correct + (res.data.correct ? 1 : 0),
        wrong: prev.wrong + (!res.data.correct ? 1 : 0),
        total: prev.total + 1
      }))
    } catch (err) {
      console.error("Submit failed", err)
    }
  }

  const handleNext = () => {
    setCurrentIndex(i => i + 1)
    fetchNextQuestion()
  }

  const timerColor = timeLeft > 60 ? 'var(--secondary)' : timeLeft > 30 ? 'var(--warning)' : 'var(--accent)'
  const timerPct = (timeLeft / 120) * 100

  const optionState = (idx) => {
    if (!revealed) return selected === idx ? 'selected' : ''
    // If backend submission returned, use it to accurately map the correct index, otherwise fallback locally.
    const trueCorrect = submissionData ? submissionData.correct_index : q.correct_index
    if (idx === trueCorrect) return 'correct'
    if (idx === selected && idx !== trueCorrect) return 'incorrect'
    return ''
  }

  if (!isSessionActive) {
    const availableTopics = config.subject ? JEE_SYLLABUS[config.subject] : []
    return (
      <div className="card" style={{ maxWidth:'600px', margin:'2rem auto', padding:'2rem', animation:'fadeInUp 0.5s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'2rem' }}>
          <div style={{ padding:'1rem', background:'rgba(108,99,255,0.1)', borderRadius:'var(--radius-lg)' }}>
            <Settings2 color="var(--primary)" size={32} />
          </div>
          <div>
            <h2 style={{ fontSize:'1.5rem', color:'var(--text-primary)', marginBottom:'0.25rem' }}>Adaptive Engine Setup</h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Configure exactly what you want Gemini to test you on.</p>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          <div>
            <label style={{ display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)', fontSize:'0.85rem' }}>Target Subject (Optional)</label>
            <select 
              className="input-field" 
              value={config.subject} 
              onChange={e => setConfig({ ...config, subject: e.target.value, topic: '' })}
            >
              <option value="">Any Subject (Global Adaptive Loop)</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
            </select>
          </div>
          
          <div>
            <label style={{ display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)', fontSize:'0.85rem' }}>Target Chapter (Optional)</label>
            <select 
              className="input-field" 
              value={config.topic} 
              onChange={e => setConfig({ ...config, topic: e.target.value })}
              disabled={!config.subject}
            >
              <option value="">Any Chapter</option>
              {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)', fontSize:'0.85rem' }}>Starting Skill Tier (Optional)</label>
            <select 
              className="input-field" 
              value={config.difficulty} 
              onChange={e => setConfig({ ...config, difficulty: e.target.value })}
            >
              <option value="">Auto-Detect via History</option>
              <option value="Weak">Weak (Easy Questions)</option>
              <option value="Intermediate">Intermediate (Medium Questions)</option>
              <option value="Expert">Expert (Hard Questions)</option>
            </select>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width:'100%', padding:'1rem', fontSize:'1.05rem', marginTop:'1rem' }}
            onClick={handleStartSession}
          >
            Launch Adaptive Session
          </button>
        </div>
      </div>
    )
  }

  if (loading && !q) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'50vh', gap: '1rem' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Generating your personalized question via AI...</span>
      </div>
    )
  }

  if (!q) return null

  const dc = difficultyColors[q.difficulty] || difficultyColors['Medium']

  return (
    <div style={{ animation:'fadeInUp 0.5s ease' }}>
      {/* Header Info */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span className="badge" style={{ background:'var(--bg-glass)', color: dc.color, border:`1px solid ${dc.border}` }}>
            {q.difficulty} Level
          </span>
          <span className="badge" style={{ background:'var(--bg-glass)', color:'var(--text-secondary)', border:'1px solid var(--border)' }}>
            {q.subject} • {q.topic}
          </span>
        </div>
        
        <button 
            onClick={() => { setIsSessionActive(false); setQ(null) }} 
            style={{ background:'transparent', border:'none', color:'var(--text-muted)', fontSize:'0.85rem', cursor:'pointer' }}
        >
          ← Back to Setup
        </button>
      </div>
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
                  {revealed && idx === (submissionData?.correct_index ?? q.correct_index) && <CheckCircle size={18} color="#00ff88" style={{ marginLeft:'auto', flexShrink:0 }} />}
                  {revealed && idx === selected && idx !== (submissionData?.correct_index ?? q.correct_index) && <XCircle size={18} color="var(--accent)" style={{ marginLeft:'auto', flexShrink:0 }} />}
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
                  {loading ? <Loader2 size={16} className="spin" /> : 'Submit Answer'}
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
          {revealed && submissionData && (
            <div style={{
              background: submissionData.correct ? 'rgba(0,255,136,0.05)' : 'rgba(255,107,107,0.05)',
              border:`1px solid ${submissionData.correct ? 'rgba(0,255,136,0.2)' : 'rgba(255,107,107,0.2)'}`,
              borderRadius:'var(--radius-lg)', padding:'1.25rem'
            }}>
              <div style={{
                fontSize:'0.8rem', fontWeight:'700',
                color: submissionData.correct ? '#00ff88' : 'var(--accent)',
                marginBottom:'0.6rem'
              }}>
                {submissionData.correct ? '✅ Correct! Well done!' : '❌ Incorrect — Let\'s understand why:'}
              </div>
              <pre style={{
                fontSize:'0.83rem', color:'var(--text-secondary)',
                whiteSpace:'pre-wrap', lineHeight:'1.7', fontFamily:'inherit'
              }}>{submissionData.explanation || q.explanation}</pre>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'0.6rem' }}>
              <span style={{ fontSize:'0.8rem', fontWeight:'700', color:'var(--primary-light)' }}>🤖 AI Adaptive Engine</span>
              {submissionData?.skill_level && (
                <span className="badge" style={{ background: 'var(--primary-dark)', color: 'white', fontSize: '0.65rem' }}>
                  Skill Level: {submissionData.skill_level}
                </span>
              )}
            </div>
            
            <p style={{ fontSize:'0.83rem', color:'var(--text-secondary)', lineHeight:'1.6' }}>
              Based on your historical performance, this question mapped to <strong style={{color:'var(--text-primary)'}}>{q.topic}</strong>. 
              The difficulty was precisely generated at <strong style={{color: dc.color}}>{q.difficulty}</strong> using Gemini to match your exact competency baseline.
            </p>
            <div style={{ marginTop:'0.75rem', padding:'0.65rem', background:'var(--bg-glass)',
              borderRadius:'var(--radius-md)', fontSize:'0.8rem', color:'var(--text-muted)' }}>
              💡 Tip: Answering these continuously automatically tailors the upcoming AI generations to close your weakest skill gaps instantly!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
