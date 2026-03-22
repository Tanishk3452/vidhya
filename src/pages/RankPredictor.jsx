import { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, Lightbulb, Target, Award } from 'lucide-react'
import { rankAPI } from '../services/api'

const suggestions = {
  Physics: [
    "Improve Physics accuracy by 10% to boost rank significantly.",
    "Focus on Electromagnetic Waves — it has a high weightage of ~12% in JEE Advanced.",
    "Attempt at least 15 Physics questions daily for the next 2 weeks.",
  ],
  Chemistry: [
    "Electrochemistry is your biggest weak area — spend 2h daily for 5 days.",
    "Solve previous year questions for Organic — they repeat patterns frequently.",
    "Use reaction flowcharts for better memorization of mechanisms.",
  ],
  Mathematics: [
    "Complex Numbers need special attention — 8-10 questions appear yearly.",
    "Improve integration speed — you're taking 30s more than average JEE toppers.",
    "Practice Probability from FIITJEE material for concept clarity.",
  ],
  General: [
    "Your consistency score (8.4/10) is excellent — maintain this pattern.",
    "You're 800 ranks away from IIT cutoff — achievable in 6 weeks with focus.",
    "Reduce revision gaps — currently 4+ days since your last Chemistry revision.",
  ]
}

function GaugeMeter({ rankEstimate }) {
  const maxRank = 50000
  const pct = Math.min(100, Math.max(0, ((maxRank - rankEstimate) / maxRank) * 100))
  const angle = (pct / 100) * 180 - 90

  const rankLabel =
    rankEstimate <= 500 ? '🏆 Top 500 — IIT Bombay, Delhi, Madras (CS)' :
    rankEstimate <= 2000 ? '🥇 Top 2000 — IIT (Core/Top branches)' :
    rankEstimate <= 5000 ? '🥈 Top 5000 — IIT (Other branches)' :
    rankEstimate <= 15000 ? '🥉 Top 15000 — NIT Top (CS/EC)' :
    '📚 Keep working — NIT / IIIT range'

  return (
    <div style={{ textAlign:'center' }}>
      {/* SVG Gauge */}
      <svg width="240" height="140" viewBox="0 0 240 140" style={{ overflow:'visible', margin:'0 auto', display:'block' }}>
        {/* Background arc */}
        <path
          d="M 20 120 A 100 100 0 0 1 220 120"
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" strokeLinecap="round"
        />
        {/* Colored arc — gradient effect via segments */}
        <path d="M 20 120 A 100 100 0 0 1 120 20" fill="none" stroke="rgba(255,107,107,0.6)" strokeWidth="18" strokeLinecap="round" />
        <path d="M 120 20 A 100 100 0 0 1 220 120" fill="none" stroke="rgba(0,212,170,0.6)" strokeWidth="18" strokeLinecap="round" />

        {/* Active overlay */}
        <path
          d="M 20 120 A 100 100 0 0 1 220 120"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${pct * 3.14} 314`}
          style={{ transition:'stroke-dasharray 1.5s ease' }}
        />

        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b6b" />
            <stop offset="50%" stopColor="#ffd93d" />
            <stop offset="100%" stopColor="#00d4aa" />
          </linearGradient>
        </defs>

        {/* Needle */}
        <g transform={`translate(120, 120) rotate(${angle})`}>
          <line x1="0" y1="0" x2="0" y2="-85" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="0" cy="0" r="8" fill="#6c63ff" />
        </g>

        {/* Labels */}
        <text x="10" y="138" fontSize="10" fill="rgba(255,107,107,0.8)" fontWeight="bold">Worst</text>
        <text x="195" y="138" fontSize="10" fill="rgba(0,212,170,0.8)" fontWeight="bold">Best</text>
      </svg>

      <div style={{
        fontSize:'2.8rem', fontWeight:'900', fontFamily:"'Outfit',sans-serif",
        background:'var(--grad-primary)', WebkitBackgroundClip:'text',
        WebkitTextFillColor:'transparent', backgroundClip:'text',
        lineHeight:1, margin:'0.5rem 0'
      }}>
        ~{rankEstimate.toLocaleString()}
      </div>
      <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:'0.75rem' }}>Predicted JEE Advanced Rank</div>
      <div style={{
        background:'rgba(108,99,255,0.08)', border:'1px solid rgba(108,99,255,0.2)',
        borderRadius:'var(--radius-md)', padding:'0.6rem 1rem',
        fontSize:'0.83rem', fontWeight:'600', color:'var(--primary-light)'
      }}>
        {rankLabel}
      </div>
    </div>
  )
}

export default function RankPredictor() {
  const [accuracy, setAccuracy] = useState(78)
  const [speed, setSpeed] = useState(72)
  const [consistency, setConsistency] = useState(68)
  const [rankEstimate, setRankEstimate] = useState(4200)
  const [activeTip, setActiveTip] = useState('General')

  const [collegePredict, setCollegePredict] = useState('')
  const [apiTips, setApiTips] = useState([])
  const debounceRef = useRef(null)

  // Instant local formula so gauge feels live
  useEffect(() => {
    const composite = (accuracy * 0.5 + speed * 0.3 + consistency * 0.2)
    const rank = Math.round(50000 * Math.pow((100 - composite) / 100, 2.5))
    setRankEstimate(Math.max(50, Math.min(50000, rank)))

    // Debounced API call (500ms after user stops moving sliders)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await rankAPI.predict({ accuracy, speed, consistency, exam: 'JEE Advanced' })
        const d = res.data
        setRankEstimate(d.predicted_rank)
        setCollegePredict(d.college_prediction)
        if (d.improvement_tips?.length) setApiTips(d.improvement_tips)
      } catch { /* keep local formula if backend offline */ }
    }, 500)
  }, [accuracy, speed, consistency])

  const improvementScenarios = [
    {
      action: `Improve Physics accuracy by 10%`,
      impact: `~${Math.round(rankEstimate * 0.18).toLocaleString()} rank boost`,
      diff: '+10% Physics',
      color: '#6c63ff'
    },
    {
      action: 'Solve 20 more questions daily',
      impact: `~${Math.round(rankEstimate * 0.12).toLocaleString()} rank boost`,
      diff: '+Speed',
      color: '#00d4aa'
    },
    {
      action: 'Zero missed days this month',
      impact: `~${Math.round(rankEstimate * 0.08).toLocaleString()} rank boost`,
      diff: '+Consistency',
      color: '#ffd93d'
    },
  ]

  return (
    <div style={{ animation:'fadeInUp 0.5s ease' }}>
      <div className="grid-2">
        {/* Left: Controls */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          {/* Sliders Card */}
          <div className="card" style={{ padding:'1.75rem' }}>
            <h3 style={{ fontSize:'1.05rem', fontWeight:'700', marginBottom:'1.5rem' }}>
              🎛️ Adjust Your Parameters
            </h3>

            {[
              { label:'Accuracy', key:'accuracy', val:accuracy, set:setAccuracy, color:'var(--primary-light)', low:'Needs work', high:'Excellent' },
              { label:'Speed (Attempts/hr)', key:'speed', val:speed, set:setSpeed, color:'var(--secondary)', low:'Slow', high:'Very Fast' },
              { label:'Consistency (Study regularity)', key:'consistency', val:consistency, set:setConsistency, color:'var(--warning)', low:'Irregular', high:'Disciplined' },
            ].map(({ label, val, set, color, low, high }) => (
              <div key={label} style={{ marginBottom:'1.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.6rem' }}>
                  <label style={{ fontSize:'0.88rem', fontWeight:'600' }}>{label}</label>
                  <span style={{ fontWeight:'800', color, fontFamily:"'Outfit',sans-serif", fontSize:'1rem' }}>{val}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={val}
                  onChange={e => set(Number(e.target.value))}
                  style={{ ['--track-color']: color }}
                />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.3rem' }}>
                  <span>{low}</span><span>{high}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Improvement Scenarios */}
          <div className="card" style={{ padding:'1.5rem' }}>
            <h3 style={{ fontSize:'1rem', fontWeight:'700', marginBottom:'1rem' }}>🚀 Improvement Scenarios</h3>
            {improvementScenarios.map(({ action, impact, diff, color }) => (
              <div key={action} style={{
                display:'flex', gap:'1rem', alignItems:'center',
                padding:'0.75rem', borderRadius:'var(--radius-md)',
                background:'var(--bg-glass)', border:'1px solid var(--border)',
                marginBottom:'0.65rem', transition:'var(--transition)'
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border-glow)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <div style={{
                  width:'8px', height:'8px', borderRadius:'50%',
                  background:color, flexShrink:0, boxShadow:`0 0 8px ${color}`
                }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'0.85rem', fontWeight:'600' }}>{action}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{diff}</div>
                </div>
                <div style={{
                  fontSize:'0.78rem', fontWeight:'700', color:'var(--secondary)',
                  background:'rgba(0,212,170,0.1)', padding:'0.25rem 0.6rem',
                  borderRadius:'var(--radius-full)', border:'1px solid rgba(0,212,170,0.25)',
                  whiteSpace:'nowrap'
                }}>
                  ↑ {impact}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Gauge + Tips */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          {/* Gauge Card */}
          <div className="card" style={{ padding:'2rem', textAlign:'center' }}>
            <div className="badge badge-primary" style={{ margin:'0 auto 1rem', width:'fit-content' }}>
              🤖 AI Prediction (Real-time)
            </div>
            {collegePredict && (
              <div style={{ marginBottom:'0.75rem', fontSize:'0.82rem', color:'var(--secondary)', fontWeight:'600' }}>
                {collegePredict}
              </div>
            )}
            <GaugeMeter rankEstimate={rankEstimate} />

            <div style={{ marginTop:'1.5rem', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
              {[
                { label:'Best Case', val:`~${Math.max(50, rankEstimate - Math.round(rankEstimate*0.35)).toLocaleString()}`, color:'var(--secondary)' },
                { label:'Expected', val:`~${rankEstimate.toLocaleString()}`, color:'var(--primary-light)' },
                { label:'Worst Case', val:`~${(rankEstimate + Math.round(rankEstimate*0.4)).toLocaleString()}`, color:'var(--accent)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{
                  background:'var(--bg-glass)', border:'1px solid var(--border)',
                  borderRadius:'var(--radius-md)', padding:'0.75rem', textAlign:'center'
                }}>
                  <div style={{ fontSize:'1rem', fontWeight:'800', color, fontFamily:"'Outfit',sans-serif" }}>{val}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Tips */}
          <div className="card" style={{ padding:'1.5rem' }}>
            <h3 style={{ fontSize:'1rem', fontWeight:'700', marginBottom:'1rem' }}>💡 Personalized Improvement Tips</h3>
            <div style={{ display:'flex', gap:'0.4rem', marginBottom:'1rem', flexWrap:'wrap' }}>
              {Object.keys(suggestions).map(key => (
                <button
                  key={key}
                  onClick={() => setActiveTip(key)}
                  style={{
                    padding:'0.35rem 0.85rem', borderRadius:'var(--radius-full)',
                    fontSize:'0.77rem', fontWeight:'600', cursor:'pointer',
                    transition:'var(--transition)', border:'1px solid',
                    background: activeTip === key ? 'rgba(108,99,255,0.15)' : 'transparent',
                    borderColor: activeTip === key ? 'rgba(108,99,255,0.4)' : 'var(--border)',
                    color: activeTip === key ? 'var(--primary-light)' : 'var(--text-muted)'
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
              {suggestions[activeTip].map((tip, i) => (
                <div key={i} style={{
                  display:'flex', gap:'0.75rem', padding:'0.75rem',
                  background:'var(--bg-glass)', borderRadius:'var(--radius-md)',
                  border:'1px solid var(--border)'
                }}>
                  <Lightbulb size={15} style={{ color:'var(--warning)', flexShrink:0, marginTop:'2px' }} />
                  <p style={{ fontSize:'0.83rem', color:'var(--text-secondary)', lineHeight:'1.5' }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
