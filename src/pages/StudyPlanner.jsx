import { useState, useEffect } from 'react'
import { Brain, Plus, Loader2, CheckCircle, Circle, Zap, Calendar, Clock, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { studyPlanAPI } from '../services/api'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']
const EXAMS = ['JEE Advanced', 'JEE Mains', 'NEET', 'UPSC', 'GATE', 'CAT']

const slotTypeColors = {
  Study: { bg: 'rgba(108,99,255,0.12)', color: 'var(--primary-light)', border: 'rgba(108,99,255,0.3)' },
  Practice: { bg: 'rgba(0,212,170,0.12)', color: 'var(--secondary)', border: 'rgba(0,212,170,0.3)' },
  Test: { bg: 'rgba(255,107,107,0.12)', color: 'var(--accent)', border: 'rgba(255,107,107,0.3)' },
  Revision: { bg: 'rgba(255,217,61,0.12)', color: 'var(--warning)', border: 'rgba(255,217,61,0.3)' },
  Rest: { bg: 'rgba(180,180,180,0.1)', color: 'var(--text-muted)', border: 'rgba(180,180,180,0.2)' },
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('neurolearn_user') || '{}') } catch { return {} }
}

export default function StudyPlanner() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [activeDay, setActiveDay] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const [todayProgress, setTodayProgress] = useState({ completed: 0, total: 0, percent: 0 })

  // Form state
  const [form, setForm] = useState({
    exam: 'JEE Advanced',
    weak_subjects: [],
    hours_per_day: 6,
    exam_date: '',
  })

  const user = getUser()
  const userId = user.id || 'demo-user-001'
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  useEffect(() => {
    loadPlan()
  }, [])

  const loadPlan = async () => {
    setLoading(true)
    try {
      const [planRes, progressRes] = await Promise.all([
        studyPlanAPI.get(userId),
        studyPlanAPI.getTodayProgress(userId),
      ])
      if (planRes.data?.plan?.length > 0) {
        setPlan(planRes.data)
        // Default to today's day tab
        const todayInPlan = planRes.data.plan.find(d => d.day === todayName)
        setActiveDay(todayInPlan ? todayName : planRes.data.plan[0]?.day)
      } else {
        setPlan(null) // No plan yet — show prompt
      }
      setTodayProgress(progressRes.data || { completed: 0, total: 0, percent: 0 })
    } catch (err) {
      console.error('Failed to load plan:', err)
      setPlan(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (form.weak_subjects.length === 0) {
      showToast('Please select at least one weak subject')
      return
    }
    setGenerating(true)
    try {
      const res = await studyPlanAPI.generate(userId, form)
      setPlan(res.data)
      setActiveDay(todayName)
      setShowForm(false)
      showToast('✅ Study plan generated!')
      loadPlan() // refresh progress
    } catch (err) {
      showToast('Failed to generate plan. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleSlot = async (day, slotIndex, slot) => {
    const newCompleted = !slot.completed

    // Optimistic UI update
    setPlan(prev => {
      const updated = { ...prev }
      updated.plan = updated.plan.map(d => {
        if (d.day !== day) return d
        const slots = [...d.slots]
        slots[slotIndex] = { ...slots[slotIndex], completed: newCompleted }
        return { ...d, slots }
      })
      return updated
    })

    try {
      const res = await studyPlanAPI.completeSlot({
        user_id: userId,
        day,
        slot_index: slotIndex,
        subject: slot.subject,
        topic: slot.topic,
        completed: newCompleted,
      })

      if (newCompleted && res.data?.xp_awarded) {
        showToast(`+${res.data.xp_awarded} XP earned! 🎉`)
        // Update stored user XP so header reflects it
        const storedUser = getUser()
        storedUser.xp = (storedUser.xp || 0) + res.data.xp_awarded
        localStorage.setItem('neurolearn_user', JSON.stringify(storedUser))
        window.dispatchEvent(new Event('storage'))
      }

      // Refresh today's progress bar
      if (day === todayName) {
        const progressRes = await studyPlanAPI.getTodayProgress(userId)
        setTodayProgress(progressRes.data || todayProgress)
      }
    } catch (err) {
      // Revert optimistic update on error
      setPlan(prev => {
        const updated = { ...prev }
        updated.plan = updated.plan.map(d => {
          if (d.day !== day) return d
          const slots = [...d.slots]
          slots[slotIndex] = { ...slots[slotIndex], completed: !newCompleted }
          return { ...d, slots }
        })
        return updated
      })
      showToast('Failed to save. Try again.')
    }
  }

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const toggleSubject = (subject) => {
    setForm(prev => ({
      ...prev,
      weak_subjects: prev.weak_subjects.includes(subject)
        ? prev.weak_subjects.filter(s => s !== subject)
        : [...prev.weak_subjects, subject]
    }))
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: 'var(--text-muted)' }} />
    </div>
  )

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease' }}>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 999,
          background: 'var(--bg-card)', border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-md)', padding: '0.75rem 1.25rem',
          fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)', animation: 'fadeInUp 0.2s ease'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={22} style={{ color: 'var(--primary-light)' }} /> AI Study Planner
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            Tick slots as you complete them — progress syncs to your dashboard
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} />
          {plan ? 'Regenerate Plan' : 'Generate Plan'}
        </button>
      </div>

      {/* No plan prompt */}
      {!plan && !showForm && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Brain size={48} style={{ color: 'var(--primary-light)', margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>No Study Plan Yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Generate a personalized 7-day plan tailored to your exam and weak subjects.
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Generate My Plan
          </button>
        </div>
      )}

      {/* Generate form */}
      {showForm && (
        <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1.25rem' }}>
            {plan ? 'Generate New Plan' : 'Create Your Study Plan'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Exam */}
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Target Exam
              </label>
              <select
                value={form.exam}
                onChange={e => setForm(f => ({ ...f, exam: e.target.value }))}
                className="input-field"
                style={{ width: '100%' }}
              >
                {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {/* Hours */}
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Study Hours/Day: <strong>{form.hours_per_day}h</strong>
              </label>
              <input
                type="range" min={2} max={12} step={0.5}
                value={form.hours_per_day}
                onChange={e => setForm(f => ({ ...f, hours_per_day: parseFloat(e.target.value) }))}
                style={{ width: '100%', marginTop: '0.5rem' }}
              />
            </div>
          </div>

          {/* Exam date */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              Exam Date (optional)
            </label>
            <input
              type="date"
              value={form.exam_date}
              onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))}
              className="input-field"
              style={{ width: '100%' }}
            />
          </div>

          {/* Weak subjects */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.6rem' }}>
              Weak Subjects (select all that apply)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSubject(s)}
                  style={{
                    padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)',
                    border: `1px solid ${form.weak_subjects.includes(s) ? 'var(--primary-light)' : 'var(--border)'}`,
                    background: form.weak_subjects.includes(s) ? 'rgba(108,99,255,0.15)' : 'var(--bg-glass)',
                    color: form.weak_subjects.includes(s) ? 'var(--primary-light)' : 'var(--text-muted)',
                    fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {form.weak_subjects.includes(s) ? '✓ ' : ''}{s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={generating}
              style={{ flex: 1 }}
            >
              {generating
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating with AI...</>
                : <><Brain size={16} /> Generate 7-Day Plan</>
              }
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Plan display */}
      {plan && (
        <>
          {/* Today's progress bar */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} style={{ color: 'var(--primary-light)' }} />
                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Today's Progress — {todayName}</span>
              </div>
              <span style={{ fontWeight: '700', color: 'var(--primary-light)', fontSize: '0.9rem' }}>
                {todayProgress.completed}/{todayProgress.total} slots · {todayProgress.percent}%
              </span>
            </div>
            <div className="progress-bar" style={{ height: '8px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${todayProgress.percent}%`,
                  transition: 'width 0.5s ease',
                  background: todayProgress.percent === 100
                    ? 'var(--secondary)'
                    : 'var(--grad-primary)'
                }}
              />
            </div>
            {todayProgress.percent === 100 && (
              <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', marginTop: '0.5rem', fontWeight: '600' }}>
                🎉 All done for today! Great work!
              </p>
            )}
          </div>

          {/* Plan info bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <BookOpen size={14} /> {plan.exam || 'Exam'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <Clock size={14} /> Generated {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : 'recently'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--secondary)' }}>
              <Zap size={14} /> +10 XP per completed slot
            </div>
          </div>

          {/* Day tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {plan.plan.map(({ day }) => {
              const daySlots = plan.plan.find(d => d.day === day)?.slots || []
              const dayDone = daySlots.filter(s => s.completed).length
              const isToday = day === todayName
              const isActive = day === activeDay
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  style={{
                    padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                    border: `1px solid ${isActive ? 'var(--primary-light)' : 'var(--border)'}`,
                    background: isActive ? 'rgba(108,99,255,0.15)' : 'var(--bg-glass)',
                    color: isActive ? 'var(--primary-light)' : 'var(--text-muted)',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  {isToday ? '📍 ' : ''}{day.slice(0, 3)}
                  {dayDone > 0 && (
                    <span style={{
                      marginLeft: '0.35rem', fontSize: '0.7rem',
                      color: dayDone === daySlots.length ? 'var(--secondary)' : 'var(--primary-light)'
                    }}>
                      {dayDone}/{daySlots.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Active day slots */}
          {plan.plan.filter(d => d.day === activeDay).map(({ day, slots }) => (
            <div key={day} className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '1rem' }}>
                {day === todayName ? `📍 Today — ${day}` : day}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400', marginLeft: '0.75rem' }}>
                  {slots.filter(s => s.completed).length}/{slots.length} completed
                </span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {slots.map((slot, i) => {
                  const typeStyle = slotTypeColors[slot.type] || slotTypeColors.Study
                  return (
                    <div
                      key={i}
                      onClick={() => handleToggleSlot(day, i, slot)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${slot.completed ? 'rgba(0,212,170,0.4)' : 'var(--border)'}`,
                        background: slot.completed ? 'rgba(0,212,170,0.06)' : 'var(--bg-glass)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        opacity: slot.completed ? 0.8 : 1,
                      }}
                      onMouseOver={e => !slot.completed && (e.currentTarget.style.borderColor = 'var(--border-glow)')}
                      onMouseOut={e => !slot.completed && (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      {/* Checkbox */}
                      <div style={{ flexShrink: 0 }}>
                        {slot.completed
                          ? <CheckCircle size={22} style={{ color: 'var(--secondary)' }} />
                          : <Circle size={22} style={{ color: 'var(--text-muted)' }} />
                        }
                      </div>

                      {/* Time */}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: '60px', fontWeight: '600' }}>
                        {slot.time}
                      </div>

                      {/* Subject + topic */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: '700', fontSize: '0.92rem',
                          textDecoration: slot.completed ? 'line-through' : 'none',
                          color: slot.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                        }}>
                          {slot.subject}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {slot.topic} · {slot.duration}
                        </div>
                      </div>

                      {/* Type badge */}
                      <div style={{
                        padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)',
                        background: typeStyle.bg, color: typeStyle.color,
                        border: `1px solid ${typeStyle.border}`,
                        fontSize: '0.72rem', fontWeight: '700', flexShrink: 0
                      }}>
                        {slot.type}
                      </div>

                      {/* XP badge when done */}
                      {slot.completed && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', fontWeight: '700', flexShrink: 0 }}>
                          +10 XP
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Tips */}
          {plan.tips?.length > 0 && (
            <div className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
              <h4 style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                💡 AI Study Tips
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {plan.tips.map((tip, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '0.6rem', fontSize: '0.85rem',
                    color: 'var(--text-secondary)', lineHeight: '1.5'
                  }}>
                    <span style={{ color: 'var(--primary-light)', fontWeight: '700', flexShrink: 0 }}>
                      {i + 1}.
                    </span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}