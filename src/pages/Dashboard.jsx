import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Target, Clock,
  ChevronRight, CheckCircle, XCircle, Loader2, Zap
} from 'lucide-react'
import { analyticsAPI, studyPlanAPI } from '../services/api'

function StatCard({ icon, label, value, change, color, bg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, color }}>{icon}</div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{label}</p>
        {change && (
          <div className={`stat-change ${change.startsWith('+') || change.includes('🔥') ? 'positive' : ''}`}>
            {change}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [topicBreakdown, setTopicBreakdown] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [todaySchedule, setTodaySchedule] = useState([])
  const [loading, setLoading] = useState(true)

  // Read stored user — same way Analytics does it
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('neurolearn_user') || '{}') } catch { return {} }
  })()
  const uid = storedUser.id || 'demo-user-001'
  const userName = storedUser.name || 'Student'
  const userExam = storedUser.exam || 'your exam'
  const userLevel = storedUser.level || 1

  // REPLACE your useEffect with this:
  useEffect(() => {
    Promise.all([
      analyticsAPI.getSummary(uid),
      analyticsAPI.getTopicBreakdown(uid),
    ])
      .then(([sumRes, topicsRes]) => {
        setSummary(sumRes.data || {})
        const topics = Array.isArray(topicsRes.data) ? topicsRes.data : []
        setTopicBreakdown(topics)
        setRecentActivity(topics.slice(0, 5).map(t => ({
          subject: t.subject,
          topic: t.topic,
          score_percent: t.score_percent,
        })))
      })
      .catch(err => {
        console.error('Dashboard load error:', err)
        setSummary({})
      })
      .finally(() => setLoading(false))

    // Load today's schedule separately so it doesn't break everything if it fails
    studyPlanAPI.get(uid)
      .then(res => {
        const plan = res.data?.plan || []
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
        const todayDay = plan.find(d => d.day === todayName)
        setTodaySchedule(todayDay?.slots || [])
      })
      .catch(() => setTodaySchedule([]))
  }, [uid])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: 'var(--text-muted)' }} />
    </div>
  )

  // ── Same safe fallbacks Analytics uses ───────────────────────────────────
  const totalQuestions = summary?.total_questions ?? 0
  const correctAnswers = summary?.correct_answers ?? 0
  const accuracyPercent = summary?.accuracy_percent ?? 0
  const avgSpeed = summary?.avg_speed_seconds ?? 0
  const streak = summary?.study_streak ?? storedUser.streak ?? 0
  const totalXp = storedUser.xp ?? 0
  const level = storedUser.level ?? 1

  const dailyGoal = 50
  const progress = Math.min(100, Math.round((totalQuestions / dailyGoal) * 100))

  // Subject breakdown — same computation as Analytics
  const subjMap = { Physics: 0, Chemistry: 0, Mathematics: 0, Biology: 0 }
  topicBreakdown.forEach(t => {
    if (t.subject in subjMap) subjMap[t.subject] += (t.questions_attempted || 0)
  })
  const subjectStats = topicBreakdown.reduce((acc, t) => {
    if (!acc[t.subject]) acc[t.subject] = { total: 0, correct: 0 }
    acc[t.subject].total += t.questions_attempted || 0
    acc[t.subject].correct += t.correct || 0
    return acc
  }, {})

  const subjectRows = Object.entries(subjectStats).map(([subject, v]) => ({
    subject,
    accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0,
    attempted: v.total,
  }))

  const subjectColors = {
    Physics: { color: 'var(--primary-light)', emoji: '⚛️' },
    Chemistry: { color: 'var(--secondary)', emoji: '🧪' },
    Mathematics: { color: 'var(--accent)', emoji: '📐' },
    Biology: { color: '#22c55e', emoji: '🧬' },
  }

  const slotBadge = {
    Study: 'primary', Practice: 'secondary',
    Test: 'accent', Revision: 'warning', Rest: 'default',
  }

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease' }}>

      {/* Welcome */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>
          Welcome back, {userName.split(' ')[0]} 👋
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          Preparing for{' '}
          <strong style={{ color: 'var(--primary-light)' }}>{userExam}</strong>
          {' '}· Level {level}
        </p>
      </div>

      {/* Stat Cards — same data source as Analytics summary */}
      <div className="grid-4 mb-3">
        <StatCard
          icon={<Target size={22} />} label="Overall Accuracy"
          value={`${accuracyPercent}%`}
          change={totalQuestions > 0 ? `${correctAnswers} correct` : 'No data yet'}
          color="var(--primary-light)" bg="rgba(108,99,255,0.15)"
        />
        <StatCard
          icon={<BookOpen size={22} />} label="Questions Done"
          value={totalQuestions}
          change={totalQuestions > 0 ? 'Keep going!' : 'Start now!'}
          color="var(--secondary)" bg="rgba(0,212,170,0.15)"
        />
        <StatCard
          icon={<Clock size={22} />} label="Study Streak"
          value={`${streak} Days`}
          change={streak > 0 ? `${streak} 🔥` : 'Start your streak!'}
          color="var(--warning)" bg="rgba(255,217,61,0.15)"
        />
        <StatCard
          icon={<Zap size={22} />} label="Total XP"
          value={totalXp}
          change={`Level ${level}`}
          color="#b44eff" bg="rgba(180,78,255,0.15)"
        />
      </div>

      <div className="grid-2 mb-3">

        {/* Progress + Schedule */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Today's Progress</h3>
            <span className="badge badge-primary">Day {streak || 1} 🔥</span>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Daily Goal ({dailyGoal} Qs)</span>
              <span style={{ fontWeight: '700', color: 'var(--primary-light)' }}>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Today's Schedule
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {todaySchedule.length > 0 ? todaySchedule.map((slot, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 0', borderBottom: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: '56px' }}>
                  {slot.time}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '600', fontSize: '0.85rem',
                    textDecoration: slot.completed ? 'line-through' : 'none',
                    color: slot.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                  }}>
                    {slot.subject}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {slot.topic} · {slot.duration}
                  </div>
                </div>
                <span className={`badge badge-${slotBadge[slot.type] || 'default'}`} style={{ fontSize: '0.66rem' }}>
                  {slot.completed ? '✓ Done' : slot.type}
                </span>
              </div>
            )) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0', textAlign: 'center', fontStyle: 'italic' }}>
                No study plan for today.{' '}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline', padding: '0', fontSize: '0.85rem' }}
                  onClick={() => navigate('/planner')}
                >
                  Generate one →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions + Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { icon: '🤖', label: 'Ask a Doubt', path: '/doubt-solver' },
                { icon: '📝', label: 'Start Practice', path: '/questions' },
                { icon: '📊', label: 'View Analytics', path: '/analytics' },
                { icon: '📈', label: 'Predict Rank', path: '/rank' },
              ].map(({ icon, label, path }) => (
                <button key={label} onClick={() => navigate(path)} style={{
                  background: 'var(--bg-glass)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '1rem',
                  cursor: 'pointer', transition: 'var(--transition)', textAlign: 'center',
                  color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.85rem'
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.transform = 'scale(1.03)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{icon}</div>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity — from topic breakdown */}
          <div className="card" style={{ flex: 1, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem' }}>Recent Topics Practiced</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentActivity.length > 0 ? recentActivity.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'center',
                  paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)'
                }}>
                  {a.score_percent >= 50
                    ? <CheckCircle size={15} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                    : <XCircle size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.83rem', fontWeight: '600' }}>{a.topic}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.subject}</div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: '700',
                    color: a.score_percent >= 50 ? 'var(--secondary)' : 'var(--accent)'
                  }}>
                    {a.score_percent}%
                  </span>
                </div>
              )) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0', textAlign: 'center', fontStyle: 'italic' }}>
                  No activity yet. Start solving questions!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subject Progress — same computation as Analytics */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Subject-wise Progress</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics')}>
            View Details <ChevronRight size={14} />
          </button>
        </div>

        {subjectRows.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
            {subjectRows.map(({ subject, accuracy, attempted }) => {
              const sc = subjectColors[subject] || { color: 'var(--primary-light)', emoji: '📚' }
              return (
                <div key={subject} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{sc.emoji}</div>
                  <div style={{ fontWeight: '700', marginBottom: '0.35rem', fontSize: '0.9rem' }}>{subject}</div>
                  <div className="progress-bar" style={{ marginBottom: '0.35rem' }}>
                    <div className="progress-fill" style={{
                      width: `${accuracy}%`,
                      background: `linear-gradient(90deg, ${sc.color}, ${sc.color}88)`
                    }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: sc.color, fontWeight: '700' }}>{accuracy}%</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{attempted} questions</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No subject data yet.{' '}
            <button
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline', padding: 0 }}
              onClick={() => navigate('/questions')}
            >
              Start practicing →
            </button>
          </div>
        )}
      </div>

    </div>
  )
}