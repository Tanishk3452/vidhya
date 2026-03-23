import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Target, Clock, TrendingUp,
  ChevronRight, CheckCircle, XCircle, Loader2, Zap
} from 'lucide-react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('neurolearn_user') || '{}')
    const uid = user.id || 'demo-user-001'
    const token = localStorage.getItem('neurolearn_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    axios.get(`${BASE_URL}/api/dashboard/summary?user_id=${uid}`, { headers })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: 'var(--text-muted)' }} />
    </div>
  )

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      Failed to load dashboard. Is the backend running?
    </div>
  )

  const { user, stats, subject_stats, recent_activity, today_schedule, exam } = data
  const dailyGoal = 50
  const progress = Math.min(100, Math.round((stats.total_questions / dailyGoal) * 100))

  // Subject color map
  const subjectColors = {
    Physics: { color: 'var(--primary-light)', bg: 'rgba(108,99,255,0.15)', emoji: '⚛️' },
    Chemistry: { color: 'var(--secondary)', bg: 'rgba(0,212,170,0.15)', emoji: '🧪' },
    Mathematics: { color: 'var(--accent)', bg: 'rgba(255,107,107,0.15)', emoji: '📐' },
  }

  // Slot type badge color
  const slotBadge = { Study: 'primary', Practice: 'secondary', Test: 'accent', Revision: 'warning', Rest: 'default' }

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease' }}>

      {/* Welcome Banner */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          Preparing for{' '}
          <strong style={{ color: 'var(--primary-light)' }}>{exam || 'your exam'}</strong>
          {' '}· Level {user?.level || 1}
        </p>
      </div>

      {/* Stat Cards — all real data */}
      <div className="grid-4 mb-3">
        <StatCard
          icon={<Target size={22} />}
          label="Overall Accuracy"
          value={`${stats.accuracy_percent}%`}
          change={stats.total_questions > 0 ? `${stats.correct_answers} correct` : 'No data yet'}
          color="var(--primary-light)" bg="rgba(108,99,255,0.15)"
        />
        <StatCard
          icon={<BookOpen size={22} />}
          label="Questions Done"
          value={stats.total_questions}
          change={stats.total_questions > 0 ? 'Keep going!' : 'Start now!'}
          color="var(--secondary)" bg="rgba(0,212,170,0.15)"
        />
        <StatCard
          icon={<Clock size={22} />}
          label="Study Streak"
          value={`${stats.streak} Days`}
          change={stats.streak > 0 ? `${stats.streak} 🔥` : 'Start your streak!'}
          color="var(--warning)" bg="rgba(255,217,61,0.15)"
        />
        <StatCard
          icon={<Zap size={22} />}
          label="Total XP"
          value={stats.total_xp}
          change={`Level ${stats.level}`}
          color="#b44eff" bg="rgba(180,78,255,0.15)"
        />
      </div>

      <div className="grid-2 mb-3">

        {/* Today's Progress + Schedule */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Today's Progress</h3>
            <span className="badge badge-primary">Day {stats.streak || 1} 🔥</span>
          </div>

          {/* Daily goal progress bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Daily Goal ({dailyGoal} Qs)</span>
              <span style={{ fontWeight: '700', color: 'var(--primary-light)' }}>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Today's schedule from study plan */}
          <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Today's Schedule
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {today_schedule.length > 0 ? today_schedule.map((slot, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 0', borderBottom: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: '56px' }}>
                  {slot.time}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{slot.subject}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {slot.topic} · {slot.duration}
                  </div>
                </div>
                <span className={`badge badge-${slotBadge[slot.type] || 'default'}`} style={{ fontSize: '0.66rem' }}>
                  {slot.type}
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

        {/* Right column: Quick Actions + Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Quick Actions */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { icon: '🤖', label: 'Ask a Doubt', path: '/doubt-solver' },
                { icon: '📝', label: 'Start Practice', path: '/questions' },
                { icon: '📊', label: 'View Analytics', path: '/analytics' },
                { icon: '📈', label: 'Predict Rank', path: '/rank' },
              ].map(({ icon, label, path }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  style={{
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

          {/* Recent Activity — real data */}
          <div className="card" style={{ flex: 1, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem' }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recent_activity.length > 0 ? recent_activity.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'center',
                  paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)'
                }}>
                  {a.correct
                    ? <CheckCircle size={15} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                    : <XCircle size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.83rem', fontWeight: '600' }}>{a.topic}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.subject}</div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: '700',
                    color: a.correct ? 'var(--secondary)' : 'var(--accent)'
                  }}>
                    {a.correct ? '+XP' : 'Wrong'}
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

      {/* Subject Progress — real data from DB */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Subject-wise Progress</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics')}>
            View Details <ChevronRight size={14} />
          </button>
        </div>

        {subject_stats.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
            {subject_stats.map(({ subject, accuracy, attempted }) => {
              const sc = subjectColors[subject] || { color: 'var(--primary-light)', bg: 'rgba(108,99,255,0.15)', emoji: '📚' }
              return (
                <div key={subject} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{sc.emoji}</div>
                  <div style={{ fontWeight: '700', marginBottom: '0.35rem', fontSize: '0.9rem' }}>{subject}</div>
                  <div className="progress-bar" style={{ marginBottom: '0.35rem' }}>
                    <div className="progress-fill" style={{ width: `${accuracy}%`, background: `linear-gradient(90deg, ${sc.color}, ${sc.color}88)` }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: sc.color, fontWeight: '700' }}>{accuracy}%</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{attempted} questions</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No subject data yet. Go to{' '}
            <button className="btn btn-ghost btn-sm" style={{ display: 'inline', padding: 0 }} onClick={() => navigate('/questions')}>
              Practice Questions
            </button>
            {' '}to start tracking!
          </div>
        )}
      </div>

    </div>
  )
}