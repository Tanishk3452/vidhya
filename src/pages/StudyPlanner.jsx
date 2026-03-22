import { useState, useEffect } from 'react'
import { Brain, Clock, BookOpen, Calendar, CheckCircle, Sparkles, Loader, Loader2 } from 'lucide-react'
import { studyPlanAPI } from '../services/api'
import axios from 'axios'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'History', 'Geography']
const EXAMS = ['JEE Advanced', 'JEE Mains', 'NEET', 'UPSC', 'GATE', 'CAT']

const subjectColors = {
  Physics: '#6c63ff', Chemistry: '#00d4aa', Mathematics: '#ff6b6b',
  Biology: '#00ff88', English: '#ffd93d', History: '#b44eff', Geography: '#4ecdc4'
}

const typeColors = {
  Study: { bg:'rgba(108,99,255,0.12)', color:'#8b85ff', border:'rgba(108,99,255,0.25)' },
  Practice: { bg:'rgba(0,212,170,0.12)', color:'#00d4aa', border:'rgba(0,212,170,0.25)' },
  Revision: { bg:'rgba(255,217,61,0.12)', color:'#ffd93d', border:'rgba(255,217,61,0.25)' },
  Test: { bg:'rgba(255,107,107,0.12)', color:'#ff6b6b', border:'rgba(255,107,107,0.25)' },
  Rest: { bg:'rgba(78,205,196,0.12)', color:'#4ecdc4', border:'rgba(78,205,196,0.25)' },
  Other: { bg:'rgba(180,78,255,0.12)', color:'#b44eff', border:'rgba(180,78,255,0.25)  ' },
}

export default function StudyPlanner() {
  const [exam, setExam] = useState('JEE Advanced')
  const [weakSubjects, setWeakSubjects] = useState(['Physics', 'Chemistry'])
  const [hoursPerDay, setHoursPerDay] = useState(6)
  const [targetDate, setTargetDate] = useState('2025-05-10')
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState('Monday')
  const [planData, setPlanData] = useState([])  // Strictly populated dynamically now!
  const [planTips, setPlanTips] = useState([])
  const [planAllocation, setPlanAllocation] = useState({})

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const uid = user.id || "demo-user-001";
        const res = await axios.get(`http://localhost:8000/api/study-plan?user_id=${uid}`);
        if (res.data && res.data.plan && res.data.plan.length > 0) {
          setPlanData(res.data.plan);
          setPlanTips(res.data.tips || []);
          setPlanAllocation(res.data.time_allocation || {});
          setGenerated(true);
        }
      } catch (err) {
        console.error("No active plan in MongoDB");
      }
      setLoading(false);
    };
    fetchPlan();
  }, []);

  const toggleSubject = (s) => {
    setWeakSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const uid = user.id || "demo-user-001";
      const res = await axios.post(`http://localhost:8000/api/study-plan/generate?user_id=${uid}`, {
        exam,
        weak_subjects: weakSubjects,
        hours_per_day: hoursPerDay,
        exam_date: targetDate,
      })
      const data = res.data
      if (data.plan && data.plan.length) setPlanData(data.plan)
      if (data.tips && data.tips.length) setPlanTips(data.tips)
      if (data.time_allocation) setPlanAllocation(data.time_allocation)
      setGenerated(true)
    } catch (err) {
      console.error("Error generating AI Plan", err)
    } finally {
      setLoading(false)
    }
  }

  const displayPlan = planData
  const activeSlots = displayPlan.find(d => d.day === activeDay)?.slots || []

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-white" /></div>;

  return (
    <div style={{ animation:'fadeInUp 0.5s ease' }}>
      {!generated ? (
        <div style={{ maxWidth:'700px', margin:'0 auto' }}>
          <div className="card" style={{ marginBottom:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' }}>
              <div style={{
                width:'52px', height:'52px', borderRadius:'var(--radius-lg)',
                background:'rgba(108,99,255,0.15)', display:'flex',
                alignItems:'center', justifyContent:'center'
              }}>
                <Brain size={26} color="var(--primary-light)" />
              </div>
              <div>
                <h2 style={{ fontSize:'1.25rem', fontWeight:'800', fontFamily:"'Outfit',sans-serif" }}>
                  Generate Your Study Plan
                </h2>
                <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>
                  Tell our AI about your exam and goals
                </p>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              {/* Exam */}
              <div>
                <label className="input-label">Target Exam</label>
                <select className="input-field" value={exam} onChange={e => setExam(e.target.value)} id="exam-select">
                  {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Weak subjects */}
              <div>
                <label className="input-label">Weak Subjects (select all that apply)</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginTop:'0.5rem' }}>
                  {SUBJECTS.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleSubject(s)}
                      style={{
                        padding:'0.4rem 1rem',
                        borderRadius:'var(--radius-full)',
                        border:'1.5px solid',
                        cursor:'pointer',
                        fontSize:'0.83rem', fontWeight:'600',
                        transition:'var(--transition)',
                        background: weakSubjects.includes(s) ? `rgba(${s==='Physics'?'108,99,255':s==='Chemistry'?'0,212,170':'255,107,107'},0.15)` : 'var(--bg-glass)',
                        borderColor: weakSubjects.includes(s) ? (subjectColors[s] || 'var(--primary)') : 'var(--border)',
                        color: weakSubjects.includes(s) ? (subjectColors[s] || 'var(--primary)') : 'var(--text-secondary)',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hours per day */}
              <div>
                <label className="input-label">
                  Daily Study Hours: <span style={{ color:'var(--primary-light)', fontWeight:'700' }}>{hoursPerDay}h</span>
                </label>
                <input
                  type="range" min={2} max={14} value={hoursPerDay}
                  onChange={e => setHoursPerDay(Number(e.target.value))}
                  id="hours-slider"
                />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.25rem' }}>
                  <span>2h</span><span>8h</span><span>14h</span>
                </div>
              </div>

              {/* Target date */}
              <div>
                <label className="input-label">Exam Date</label>
                <input
                  className="input-field" type="date"
                  value={targetDate} onChange={e => setTargetDate(e.target.value)}
                  id="exam-date"
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ width:'100%', padding:'0.9rem', fontSize:'0.95rem', marginTop:'0.5rem' }}
                onClick={handleGenerate}
                id="generate-plan-btn"
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <Loader size={18} style={{ animation:'spin 1s linear infinite' }} />
                    AI is generating your personalized plan...
                  </span>
                ) : (
                  <><Sparkles size={17} /> Generate My Study Plan</>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Plan Header */}
          <div className="card mb-3" style={{ background:'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(180,78,255,0.08))' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
              <div>
                <div className="badge badge-primary" style={{ marginBottom:'0.5rem' }}>
                  ✨ AI-Generated Plan
                </div>
                <h2 style={{ fontSize:'1.4rem', fontWeight:'800', fontFamily:"'Outfit',sans-serif", marginBottom:'0.25rem' }}>
                  Your 7-Day {exam} Study Plan
                </h2>
                <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>
                  Optimized for {hoursPerDay}h/day · Focused on: {weakSubjects.join(', ')}
                </p>
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setGenerated(false)}>Regenerate</button>
                <button className="btn btn-primary btn-sm">Save Plan</button>
              </div>
            </div>
          </div>

          {/* Day Selector */}
          <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', overflowX:'auto', paddingBottom:'0.25rem' }}>
            {displayPlan.map(({ day }) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`tab-btn ${activeDay === day ? 'active' : ''}`}
                style={{ minWidth:'100px' }}
              >
                {day.slice(0,3)}
              </button>
            ))}
          </div>

          {/* Schedule */}
          <div className="grid-2">
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <h3 style={{ fontSize:'1.05rem', fontWeight:'700', marginBottom:'0.25rem' }}>
                📅 {activeDay}'s Schedule
              </h3>
              {activeSlots.map(({ time, subject, topic, type }) => {
                const tc = typeColors[type] || typeColors.Other
                const sc = subjectColors[subject] || 'var(--text-muted)'
                return (
                  <div key={`${time}-${topic}`} className="schedule-item">
                    <div className="schedule-dot" style={{ background: sc, marginTop:'5px' }} />
                    <div style={{ minWidth:'90px' }}>
                      <div className="schedule-time">{time}</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <h4 style={{ fontSize:'0.9rem', fontWeight:'600' }}>{topic}</h4>
                      <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.35rem', alignItems:'center' }}>
                        <span style={{ fontSize:'0.72rem', color: sc, fontWeight:'600' }}>{subject}</span>
                        <span style={{
                          fontSize:'0.7rem', fontWeight:'600', padding:'0.15rem 0.5rem',
                          borderRadius:'var(--radius-full)',
                          background: tc.bg, color: tc.color, border:`1px solid ${tc.border}`
                        }}>{type}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tips */}
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="card" style={{ padding:'1.25rem' }}>
                <h3 style={{ fontSize:'1rem', fontWeight:'700', marginBottom:'1rem' }}>📌 AI Study Tips</h3>
                {planTips.map((tip, i) => (
                  <div key={i} style={{ display:'flex', gap:'0.75rem', marginBottom:'0.85rem' }}>
                    <div style={{
                      width:'22px', height:'22px', borderRadius:'50%',
                      background:'rgba(108,99,255,0.15)', display:'flex',
                      alignItems:'center', justifyContent:'center',
                      fontSize:'0.7rem', fontWeight:'800', color:'var(--primary-light)',
                      flexShrink:0, marginTop:'2px'
                    }}>{i+1}</div>
                    <p style={{ fontSize:'0.83rem', color:'var(--text-secondary)', lineHeight:'1.5' }}>{tip}</p>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding:'1.25rem', background:'rgba(0,212,170,0.05)', borderColor:'rgba(0,212,170,0.2)' }}>
                <h3 style={{ fontSize:'1rem', fontWeight:'700', marginBottom:'0.75rem' }}>📊 Time Allocation</h3>
                {Object.entries(planAllocation).map(([s, pct], i) => {
                  const cs = ['#6c63ff','#00d4aa','#ff6b6b','#ffd93d','#b44eff','#4ecdc4']
                  return (
                    <div key={s} style={{ marginBottom:'0.75rem' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', marginBottom:'0.35rem' }}>
                        <span style={{ fontWeight:'600' }}>{s}</span>
                        <span style={{ color:'var(--text-muted)' }}>{pct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          width:`${pct}%`,
                          background: Object.values(subjectColors)[i]
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
