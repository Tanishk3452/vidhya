import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Target, Clock, TrendingUp, ChevronRight, CheckCircle, Circle, Loader2
} from 'lucide-react'
import axios from 'axios'

function StatCard({ icon, label, value, change, color, bg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{label}</p>
        {change && <div className={`stat-change ${change.startsWith('+') ? 'positive' : 'negative'}`}>{change}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const uid = user.id || "demo-user-001";
    axios.get(`http://localhost:8000/api/analytics/summary?user_id=${uid}`)
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-white w-8 h-8"/></div>;

  const progress = stats ? Math.min(100, Math.round((stats.total_questions / 50) * 100)) : 0;
  
  // Safe empty states for dynamic users
  const todaySchedule = [];
  const recentActivity = [];

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease' }}>
      <div className="grid-4 mb-3">
        <StatCard
          icon={<Target size={22} />} label="Today's Accuracy"
          value={stats ? `${stats.accuracy_percent}%` : "0%"} change={stats?.total_questions > 0 ? "+4% vs yesterday" : "New"}
          color="var(--primary-light)" bg="rgba(108,99,255,0.15)"
        />
        <StatCard
          icon={<BookOpen size={22} />} label="Questions Done"
          value={stats ? stats.total_questions : "0"} change={stats?.total_questions > 0 ? "Great progress" : "Start now!"}
          color="var(--secondary)" bg="rgba(0,212,170,0.15)"
        />
        <StatCard
          icon={<Clock size={22} />} label="Study Streak"
          value={`${stats?.study_streak || 0} Days`} change="Keep it up"
          color="var(--warning)" bg="rgba(255,217,61,0.15)"
        />
        <StatCard
          icon={<TrendingUp size={22} />} label="Current Rank Est."
          value={stats?.total_questions > 0 ? "~4,200" : "Unranked"} change={stats?.total_questions > 0 ? "↑ +800 this week" : ""}
          color="var(--accent)" bg="rgba(255,107,107,0.15)"
        />
      </div>

      <div className="grid-2 mb-3">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 style={{ fontSize:'1.05rem', fontWeight:'700' }}>Today's Progress</h3>
            <span className="badge badge-primary">Day {stats?.study_streak || 1} 🔥</span>
          </div>
          <div style={{ marginBottom:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', marginBottom:'0.5rem' }}>
              <span style={{ color:'var(--text-muted)' }}>Daily Goal (50 Qs)</span>
              <span style={{ fontWeight:'700', color:'var(--primary-light)' }}>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {todaySchedule.length > 0 ? todaySchedule.map(({ time, subject, duration, color, done }, i) => (
              <div key={i} className="schedule-item" style={{ opacity: done ? 0.6 : 1 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginTop:'2px' }}>
                  {done ? <CheckCircle size={16} color="var(--secondary)" /> : <Circle size={16} color="var(--text-muted)" />}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:'600', fontSize:'0.85rem', textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {subject}
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{time} · {duration}</div>
                </div>
                <div className="schedule-dot" style={{ background: color }} />
              </div>
            )) : (
              <div style={{color:'var(--text-muted)', fontSize:'0.85rem', padding:'1rem 0', textAlign:'center', fontStyle:'italic'}}>
                No schedule for today.
              </div>
            )}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div className="card" style={{ padding:'1.25rem' }}>
            <h3 style={{ fontSize:'1.05rem', fontWeight:'700', marginBottom:'1rem' }}>Quick Actions</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              {[
                { icon: '🤖', label: 'Ask a Doubt', path: '/doubt-solver', color: 'var(--grad-primary)' },
                { icon: '📝', label: 'Start Practice', path: '/questions', color: 'var(--grad-secondary)' },
                { icon: '📊', label: 'View Analytics', path: '/analytics', color: 'var(--grad-accent)' },
                { icon: '📈', label: 'Predict Rank', path: '/rank', color: 'var(--grad-warning)' },
              ].map(({ icon, label, path, color }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  style={{
                    background:'var(--bg-glass)', border:'1px solid var(--border)',
                    borderRadius:'var(--radius-md)', padding:'1rem',
                    cursor:'pointer', transition:'var(--transition)', textAlign:'center',
                    color:'var(--text-primary)', fontWeight:'600', fontSize:'0.85rem'
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.transform = 'scale(1.03)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <div style={{ fontSize:'1.5rem', marginBottom:'0.4rem' }}>{icon}</div>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ flex:1, padding:'1.25rem' }}>
            <h3 style={{ fontSize:'1.05rem', fontWeight:'700', marginBottom:'1rem' }}>Recent Activity</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {recentActivity.length > 0 ? recentActivity.map(({ action, time, icon, score }, i) => (
                <div key={i} style={{
                  display:'flex', gap:'0.75rem', alignItems:'flex-start',
                  paddingBottom:'0.75rem', borderBottom:'1px solid var(--border)'
                }}>
                  <span style={{ fontSize:'1.1rem' }}>{icon}</span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'0.83rem', lineHeight:'1.4', color:'var(--text-secondary)' }}>{action}</p>
                    <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{time}</p>
                  </div>
                  {score && <span style={{ fontSize:'0.75rem', fontWeight:'700', color:'var(--secondary)', whiteSpace:'nowrap' }}>{score}</span>}
                </div>
              )) : (
                <div style={{color:'var(--text-muted)', fontSize:'0.85rem', padding:'1rem 0', textAlign:'center', fontStyle:'italic'}}>
                  No recent activity logged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 style={{ fontSize:'1.05rem', fontWeight:'700' }}>Subject-wise Progress</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics')}>
            View Details <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem' }}>
          {[
            { subject:'Physics', progress:stats?.total_questions > 0 ? 30 : 0, color:'var(--primary)', emoji:'⚛️' },
            { subject:'Chemistry', progress:stats?.total_questions > 0 ? 25 : 0, color:'var(--secondary)', emoji:'🧪' },
            { subject:'Mathematics', progress:stats?.total_questions > 0 ? 45 : 0, color:'var(--accent)', emoji:'📐' },
          ].map(({ subject, progress: p, color, emoji }) => (
            <div key={subject} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>{emoji}</div>
              <div style={{ fontWeight:'700', marginBottom:'0.35rem', fontSize:'0.9rem' }}>{subject}</div>
              <div className="progress-bar" style={{ marginBottom:'0.35rem' }}>
                <div className="progress-fill" style={{ width:`${p}%`, background:`linear-gradient(90deg, ${color}, ${color}88)` }} />
              </div>
              <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:'600' }}>{p}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
